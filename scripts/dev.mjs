// Starts the API (port 4000) and the Vite dev server (port 5173) together. No extra dependencies.
import { spawn } from 'node:child_process';

const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';
const procs = [
  ['api', ['run', 'dev', '-w', 'server'], '\x1b[32m'],
  ['web', ['run', 'dev', '-w', 'client'], '\x1b[33m'],
].map(([name, args, color]) => {
  const p = spawn(npm, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: isWin });
  const tag = `${color}[${name}]\x1b[0m `;
  const pipe = (s) => s.on('data', (d) => process.stdout.write(String(d).split('\n').filter(Boolean).map((l) => tag + l).join('\n') + '\n'));
  pipe(p.stdout); pipe(p.stderr);
  p.on('exit', (code) => { console.log(`${tag}exited (${code})`); shutdown(); });
  return p;
});
let closing = false;
function shutdown() {
  if (closing) return; closing = true;
  procs.forEach((p) => { try { p.kill(); } catch {} });
  setTimeout(() => process.exit(0), 300);
}
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
console.log('\n  Rooster\'s Field  →  open http://localhost:5173  (API on :4000)\n');
