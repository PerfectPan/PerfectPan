import buildBanner from './build.mjs';
import serve from './serve.mjs';

const server = await serve(await buildBanner());
console.log(`Banner preview: ${server.url}`);
console.log('Press Ctrl+C to stop.');
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => { await server.close(); process.exit(0); });
}
