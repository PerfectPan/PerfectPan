import { build } from 'esbuild';
import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export default async function buildBanner() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const directory = fileURLToPath(new URL('../.build/', import.meta.url));
  await mkdir(directory, { recursive: true });
  await cp(`${root}/public`, directory, { recursive: true });
  await build({
    absWorkingDir: root,
    entryPoints: ['src/main.jsx'],
    bundle: true,
    jsx: 'automatic',
    outfile: `${directory}/bundle.js`,
    external: ['/Geist.woff2'],
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  return directory;
}
