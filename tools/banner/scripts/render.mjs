import { chromium } from 'playwright';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import buildBanner from './build.mjs';
import serve from './serve.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(`${root}/banner.config.json`, 'utf8'));
const { width, height, fps, startSeconds, frameCount } = config.capture;
const frames = `${root}/.frames`;
const directory = await buildBanner();
const server = await serve(directory);
let browser;
try {
  browser = await chromium.launch({
    headless: process.env.HEADED !== '1',
    ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
  });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Keep the upstream component unchanged; control only its animation timestamps.
  await page.addInitScript(() => {
    const queue = new Map();
    let nextId = 0;
    window.requestAnimationFrame = callback => { const id = ++nextId; queue.set(id, callback); return id; };
    window.cancelAnimationFrame = id => queue.delete(id);
    window.captureFrame = seconds => {
      const callbacks = [...queue.values()];
      queue.clear();
      callbacks.forEach(callback => callback(seconds * 1000));
      return callbacks.length;
    };
    window.pendingFrames = () => queue.size;
  });
  await page.goto(server.url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => window.pendingFrames() > 0);
  await rm(frames, { recursive: true, force: true });
  await mkdir(frames);
  for (let frame = 0; frame < frameCount; frame++) {
    const count = await page.evaluate(t => window.captureFrame(t), startSeconds + frame / fps);
    if (!count || errors.length) throw new Error(errors.join('\n') || 'No animation callback rendered.');
    await page.screenshot({ path: `${frames}/${String(frame).padStart(4, '0')}.png` });
    if ((frame + 1) % 25 === 0) console.log(`Captured ${frame + 1}/${frameCount} frames`);
  }
} finally {
  await browser?.close();
  await server.close();
}
const python = process.env.PYTHON || 'python3';
await new Promise((resolve, reject) => {
  const child = spawn(python, [`${root}/scripts/encode.py`], { stdio: 'inherit' });
  child.once('error', reject);
  child.once('exit', code => code === 0 ? resolve() : reject(new Error(`GIF encoding exited with code ${code}`)));
});
