"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { MessageKey } from "@/i18n";
import { ar } from "@/i18n/ar";
import { databaseErrorKey } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { displayNameSchema } from "@/lib/validation/auth";
import { issueKey } from "@/lib/validation/messages";

export type ProfileFormState = {
  errorKey?: MessageKey;
  noticeKey?: MessageKey;
};

export async function updateDisplayName(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const parsed = displayNameSchema.safeParse({ displayName: formData.get("displayName") });

  if (!parsed.success) return { errorKey: issueKey(parsed.error.issues) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // An empty field means "clear it", which is null in the column rather than an
  // empty string — otherwise "has no display name" has two different truths.
  const displayName = parsed.data.displayName === "" ? null : parsed.data.displayName;

  // Only the field this form owns is written. Building the payload from the
  // submitted form rather than from a whole profile object is what stops a
  // future form that omits a field from nulling out real data on first save.
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) return { errorKey: databaseErrorKey(error, "profile:update-display-name") };

  revalidatePath("/profile");
  return { noticeKey: "profile.saved" };
}

export async function deleteAccount(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  // Typing the word is the confirmation step. It is a one-way, unrecoverable
  // action, which is the one case where the extra friction of a confirmation is
  // worth it — unlike deleting a single food entry, which gets undo instead.
  if (formData.get("confirm")?.toString().trim() !== ar["profile.delete.confirmWord"]) {
    return { errorKey: "profile.delete.mismatch" };
  }

  const supabase = await createClient();

  // A SECURITY DEFINER function that can only ever delete auth.uid(). Doing it
  // this way keeps the service_role key out of the application entirely.
  const { error } = await supabase.rpc("delete_own_account");

  if (error) return { errorKey: databaseErrorKey(error, "profile:delete-account") };

  // The account is gone; the cookie for it is not. Clearing it stops the next
  // request from arriving with a token for a user that no longer exists.
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/");
}
