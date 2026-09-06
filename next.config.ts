import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fail the production build on type errors instead of shipping them. This is
  // already the default; stated explicitly so a future "just make it build" fix
  // has to delete a deliberate line rather than flip a silent default.
  typescript: { ignoreBuildErrors: false },
};

// Next 16 no longer runs ESLint as part of `next build`, so lint is not covered
// by the build. CI runs `npm run lint` as its own step — see .github/workflows/ci.yml.

export default nextConfig;
