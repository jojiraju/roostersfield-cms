import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ZodError } from 'zod';
import { HttpError } from './errors.ts';
import { verifyToken } from './security.ts';
import type { TokenPayload } from './security.ts';

export interface Ctx {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  params: Record<string, string>;
  query: URLSearchParams;
  body: any;
  user: TokenPayload | null;
  readRaw: (limitBytes?: number) => Promise<Buffer>;
}
export type Handler = (ctx: Ctx) => unknown | Promise<unknown>;
interface RouteOpts { auth?: boolean; admin?: boolean; raw?: boolean }
interface Route { method: string; regex: RegExp; keys: string[]; handler: Handler; opts: RouteOpts }

/** Marker a handler returns after it has written the response itself (downloads etc.). */
export const HANDLED = Symbol('handled');

export class Router {
  routes: Route[] = [];
  add(method: string, pattern: string, handler: Handler, opts: RouteOpts = {}) {
    const keys: string[] = [];
    const src = pattern.replace(/:([A-Za-z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; });
    this.routes.push({ method, regex: new RegExp(`^${src}$`), keys, handler, opts: { auth: true, ...opts } });
  }
  get(p: string, h: Handler, o?: RouteOpts) { this.add('GET', p, h, o); }
  post(p: string, h: Handler, o?: RouteOpts) { this.add('POST', p, h, o); }
  put(p: string, h: Handler, o?: RouteOpts) { this.add('PUT', p, h, o); }
  patch(p: string, h: Handler, o?: RouteOpts) { this.add('PATCH', p, h, o); }
  delete(p: string, h: Handler, o?: RouteOpts) { this.add('DELETE', p, h, o); }
}

function readBody(req: http.IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) { reject(new HttpError(413, 'Request too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function sendJson(res: http.ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.json': 'application/json', '.map': 'application/json',
};

function serveStatic(root: string, urlPath: string, res: http.ServerResponse): boolean {
  if (!fs.existsSync(root)) return false;
  const safe = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(root, safe);
  if (!file.startsWith(root)) return false;
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html'); // SPA fallback
  if (!fs.existsSync(file)) return false;
  const ext = path.extname(file).toLowerCase();
  const immutable = file.includes(`${path.sep}assets${path.sep}`);
  res.writeHead(200, {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
  return true;
}

export function createServer(router: Router, opts: { staticDir?: string } = {}) {
  return http.createServer((req, res) => handleRequest(router, req, res, opts));
}

/** Handles one request. Used by the local Node server and by the Vercel function. */
export async function handleRequest(router: Router, req: http.IncomingMessage, res: http.ServerResponse, opts: { staticDir?: string; beforeApi?: () => Promise<void> } = {}) {
  {
    const started = Date.now();
    const url = new URL(req.url ?? '/', 'http://localhost');
    try {
      if (!url.pathname.startsWith('/api/')) {
        if (opts.staticDir && serveStatic(opts.staticDir, url.pathname, res)) return;
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found. (Frontend not built — run `npm run build`, or use `npm run dev`.)');
        return;
      }
      if (opts.beforeApi) await opts.beforeApi();
      const method = req.method ?? 'GET';
      let matched: Route | undefined;
      let params: Record<string, string> = {};
      for (const r of router.routes) {
        if (r.method !== method) continue;
        const m = r.regex.exec(url.pathname);
        if (m) { matched = r; params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])); break; }
      }
      if (!matched) throw new HttpError(404, `No route for ${method} ${url.pathname}`);

      let user: TokenPayload | null = null;
      const auth = req.headers.authorization;
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : url.searchParams.get('token');
      if (token) user = verifyToken(token);
      if (matched.opts.auth && !user) throw new HttpError(401, 'Please sign in');
      if (matched.opts.admin && user?.role !== 'admin') throw new HttpError(403, 'Admin access required');

      let body: any = undefined;
      const ctype = req.headers['content-type'] ?? '';
      if (!matched.opts.raw && ['POST', 'PUT', 'PATCH'].includes(method) && ctype.includes('json')) {
        const raw = await readBody(req, 5 * 1024 * 1024);
        try { body = raw.length ? JSON.parse(raw.toString('utf8')) : {}; } catch { throw new HttpError(400, 'Invalid JSON body'); }
      }
      const ctx: Ctx = { req, res, params, query: url.searchParams, body, user, readRaw: (limit = 80 * 1024 * 1024) => readBody(req, limit) };
      const result = await matched.handler(ctx);
      if (result === HANDLED) return;
      sendJson(res, 200, result === undefined ? { ok: true } : result);
    } catch (err) {
      let status = 500;
      let message = 'Something went wrong on the server';
      let details: unknown;
      if (err instanceof HttpError) { status = err.status; message = err.message; details = err.details; }
      else if (err instanceof ZodError) {
        status = 400;
        const i = err.issues[0];
        message = `${i.path.join('.') || 'input'}: ${i.message}`;
        details = err.issues;
      } else console.error('[error]', err);
      if (!res.headersSent) sendJson(res, status, { error: message, details });
    } finally {
      if (url.pathname.startsWith('/api/') && process.env.LOG_REQUESTS) console.log(`${req.method} ${url.pathname} ${res.statusCode} ${Date.now() - started}ms`);
    }
  }
}
