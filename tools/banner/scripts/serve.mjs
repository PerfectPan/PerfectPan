import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';

export default async function serve(directory) {
  const root = resolve(directory);
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
  const server = createServer(async (request, response) => {
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = resolve(root, `.${path === '/' ? '/index.html' : path}`);
      if (!file.startsWith(`${root}${sep}`)) {
        response.writeHead(403).end();
        return;
      }
      const data = await readFile(file);
      response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' }).end(data);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  };
}
