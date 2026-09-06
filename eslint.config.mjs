import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// eslint-config-next 16 ships flat configs directly, so there is no FlatCompat
// shim here and no `@eslint/eslintrc` dependency to keep in sync.
const config = [
  { ignores: [".next/**", "node_modules/**", "supabase/**", "next-env.d.ts"] },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default config;
