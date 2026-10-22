// Zero-dependency static server for the docs, their playground and the development pages: node scripts/serve.js [port]
// Serves the repository root, so pages can import ../src and node_modules.
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {extname, join, normalize, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.argv[2] || process.env.PORT || 5181);

const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/') {
        response.writeHead(302, {location: '/docs/'});
        return response.end();
    }
    let path = normalize(join(root, decodeURIComponent(url.pathname)));
    if (!path.startsWith(root)) return send(response, 403, 'Forbidden');

    try {
        if ((await stat(path)).isDirectory()) {
            if (!url.pathname.endsWith('/')) {
                response.writeHead(301, {location: url.pathname + '/'});
                return response.end();
            }
            path = join(path, 'index.html');
        }
        const body = await readFile(path);
        response.writeHead(200, {
            'content-type': types[extname(path)] || 'application/octet-stream',
            'cache-control': 'no-store'
        });
        response.end(body);
    } catch {
        send(response, 404, 'Not found');
    }
}).listen(port, '127.0.0.1', () => {
    console.log(`easy-house: http://localhost:${port}/docs/ (playground: /docs/playground.html, development: /playground/)`);
});

function send(response, status, text) {
    response.writeHead(status, {'content-type': 'text/plain; charset=utf-8'});
    response.end(text);
}
