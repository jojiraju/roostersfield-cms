import { Router } from './http.ts';
import { seed } from './seed.ts';
import { authRoutes } from './routes/auth.ts';
import { masterRoutes } from './routes/masters.ts';
import { transactionRoutes } from './routes/transactions.ts';
import { insightRoutes } from './routes/insights.ts';

export const router = new Router();
router.get('/api/health', () => ({ ok: true, time: new Date().toISOString() }), { auth: false });
authRoutes(router);
masterRoutes(router);
transactionRoutes(router);
insightRoutes(router);

let booted: Promise<void> | null = null;
/** Creates tables and starter data once per process (cheap no-op afterwards). */
export const bootstrap = () => (booted ??= seed().catch((e) => { booted = null; throw e; }));
