import { z } from 'zod';
import { all, get, run } from '../db.ts';
import { HttpError, badRequest, forbidden } from '../errors.ts';
import { hashPassword, signToken, verifyPassword } from '../security.ts';
import type { Router } from '../http.ts';

const attempts = new Map<string, { n: number; reset: number }>();

export function authRoutes(r: Router) {
  r.post('/api/auth/login', async ({ req, body }) => {
    const ip = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? 'x').split(',')[0].trim();
    const a = attempts.get(ip);
    if (a && a.reset > Date.now() && a.n >= 10) throw new HttpError(429, 'Too many attempts. Try again in a minute.');
    const { username, password } = z.object({ username: z.string().min(1, 'Enter your username'), password: z.string().min(1, 'Enter your password') }).parse(body);
    const u = await get<{ id: number; username: string; name: string; role: string; password_hash: string; active: number }>('SELECT * FROM users WHERE username=?', username);
    if (!u || !u.active || !verifyPassword(password, u.password_hash)) {
      attempts.set(ip, { n: (a && a.reset > Date.now() ? a.n : 0) + 1, reset: a && a.reset > Date.now() ? a.reset : Date.now() + 60_000 });
      throw badRequest('Wrong username or password');
    }
    attempts.delete(ip);
    return { token: signToken(u), user: { id: u.id, username: u.username, name: u.name, role: u.role } };
  }, { auth: false });

  r.get('/api/auth/me', async ({ user }) => {
    const u = await get('SELECT id,username,name,role FROM users WHERE id=? AND active=1', user!.sub);
    if (!u) throw forbidden('Account disabled');
    return u;
  });

  r.post('/api/auth/password', async ({ user, body }) => {
    const d = z.object({ current: z.string(), next: z.string().min(6, 'Use at least 6 characters') }).parse(body);
    const u = (await get<{ password_hash: string }>('SELECT password_hash FROM users WHERE id=?', user!.sub))!;
    if (!verifyPassword(d.current, u.password_hash)) throw badRequest('Current password is wrong');
    await run('UPDATE users SET password_hash=? WHERE id=?', hashPassword(d.next), user!.sub);
  });

  r.get('/api/users', async () => await all('SELECT id,username,name,role,active,created_at FROM users ORDER BY id'), { admin: true });
  r.post('/api/users', async ({ body }) => {
    const d = z.object({ username: z.string().trim().min(3), name: z.string().trim().min(1), password: z.string().min(6), role: z.enum(['admin', 'staff']).default('staff') }).parse(body);
    if (await get('SELECT 1 FROM users WHERE username=?', d.username)) throw badRequest('That username is taken');
    return { id: (await run('INSERT INTO users(username,name,password_hash,role) VALUES(?,?,?,?)', d.username, d.name, hashPassword(d.password), d.role)).id };
  }, { admin: true });
  r.put('/api/users/:id', async ({ params, body, user }) => {
    const d = z.object({ name: z.string().trim().min(1).optional(), role: z.enum(['admin', 'staff']).optional(), active: z.boolean().optional(), password: z.string().min(6).optional() }).parse(body);
    if (Number(params.id) === user!.sub && (d.active === false || d.role === 'staff')) throw badRequest('You cannot lock yourself out');
    await run('UPDATE users SET name=COALESCE(?,name), role=COALESCE(?,role), active=COALESCE(?,active) WHERE id=?', d.name, d.role, d.active === undefined ? null : Number(d.active), Number(params.id));
    if (d.password) await run('UPDATE users SET password_hash=? WHERE id=?', hashPassword(d.password), Number(params.id));
  }, { admin: true });
}
