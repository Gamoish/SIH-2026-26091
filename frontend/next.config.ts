import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * Standalone output is opt-in via NEXT_STANDALONE=true, and only the Docker
 * build sets it.
 *
 * It is not the default because it does not build on Windows. Next copies the
 * traced dependencies into <distDir>/standalone as symlinks; pnpm's store is
 * itself a symlink farm, and creating symlinks on Windows needs elevation or
 * Developer Mode, so `next build` dies with:
 *
 *   Error: EPERM: operation not permitted, symlink
 *     '...node_modules/.pnpm/react@19.2.8/node_modules/react' -> '...'
 *
 * That would take `pnpm build` and the whole Playwright suite down on any
 * Windows dev machine, to save size in an image those machines never run.
 * The container builds on Linux, where symlinks are unremarkable.
 */
const standalone = process.env.NEXT_STANDALONE === 'true';

const nextConfig: NextConfig = {
  ...(standalone ? { output: 'standalone' as const } : {}),

  /**
   * The workspace root, not the frontend package.
   *
   * pnpm hoists shared dependencies to the repo-root node_modules, so tracing
   * from the package directory would resolve symlinks outside the traced root
   * and omit them from the standalone bundle - the container then fails at
   * require time rather than build time. This must point at the directory that
   * actually holds pnpm-lock.yaml.
   */
  outputFileTracingRoot: path.join(import.meta.dirname, '..'),

  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
