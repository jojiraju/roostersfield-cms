import { config } from './config.ts';
import { createServer } from './http.ts';
import { bootstrap, router } from './app.ts';

await bootstrap();
const server = createServer(router, { staticDir: config.clientDist });
server.listen(config.port, () => {
  console.log(`\n  Rooster's Field API ready → http://localhost:${config.port}`);
  console.log(`  Database: ${config.tursoUrl ?? config.dbFile}\n`);
});
