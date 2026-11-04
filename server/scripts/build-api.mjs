// Bundles the API into a single file that Vercel runs as a serverless function: api/index.mjs
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
await build({
  entryPoints: [path.join(here, '..', 'src', 'vercel.ts')],
  outfile: path.join(here, '..', '..', 'api', 'index.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // Installed by npm and traced into the function by Vercel (xlsx is only used by the Excel importer).
  external: ['@libsql/client', 'xlsx'],
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  logLevel: 'info',
});
