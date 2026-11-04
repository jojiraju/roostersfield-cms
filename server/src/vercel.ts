import type { IncomingMessage, ServerResponse } from 'node:http';
import { bootstrap, router } from './app.ts';
import { handleRequest } from './http.ts';

/** Vercel serverless entry. The static frontend is served by Vercel itself; this only handles /api/*. */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // vercel.json rewrites /api/* to this function with the original sub-path in ?__path= (so routing never depends on how req.url is rewritten).
  const url = new URL(req.url ?? '/', 'http://x');
  const sub = url.searchParams.get('__path');
  if (sub !== null) {
    url.searchParams.delete('__path');
    const q = url.searchParams.toString();
    req.url = `/api/${sub}${q ? `?${q}` : ''}`;
  }
  await handleRequest(router, req, res, { beforeApi: bootstrap });
}
