import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

const exec = promisify(execFile);
const image = process.argv[2] || 'psci:local';
const suffix = randomUUID().slice(0, 8);
const container = `psci-smoke-${suffix}`;
const volume = `psci-smoke-data-${suffix}`;
let baseUrl;
let createdVolume = false;
async function docker(...args) {
  const { stdout } = await exec('docker', args, { timeout: 60000 });
  return stdout.trim();
}
async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(response.ok, true, `${options.method || 'GET'} ${path}: ${response.status}`);
  return response;
}
async function start() {
  await docker(
    'run',
    '--detach',
    '--name',
    container,
    '--init',
    '--publish',
    '127.0.0.1::3001',
    '--mount',
    `type=volume,source=${volume},target=/app/data`,
    image,
  );
  const bindings = JSON.parse(
    await docker('inspect', '--format', '{{json .NetworkSettings.Ports}}', container),
  );
  baseUrl = `http://127.0.0.1:${bindings['3001/tcp'][0].HostPort}`;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {
      /* The process may still be starting. */
    }
    await delay(500);
  }
  throw new Error('O contêiner não ficou disponível em 30 segundos.');
}
try {
  assert.equal(await docker('image', 'inspect', '--format', '{{.Config.User}}', image), 'node');
  await docker('volume', 'create', volume);
  createdVolume = true;
  await start();
  const html = await (await request('/')).text();
  assert.match(html, /<div id="root"><\/div>/);
  const asset = html.match(/src="(\/assets\/[^\"]+\.js)"/);
  assert.ok(asset, 'O frontend compilado precisa estar disponível.');
  await request(asset[1]);
  const login = await (
    await request('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    })
  ).json();
  const headers = { Authorization: `Bearer ${login.token}`, 'Content-Type': 'application/json' };
  const notes = `Persistência validada no contêiner ${suffix}.`;
  await request('/api/me', { method: 'PATCH', headers, body: JSON.stringify({ notes }) });
  await docker('stop', '--time', '10', container);
  await docker('rm', container);
  await start();
  const session = await (await request('/api/session', { headers })).json();
  assert.equal(session.user.character.notes, notes);
  assert.equal(session.user.role, 'admin');
  console.log(
    'Container OK: usuário node, frontend/API, login e banco/sessão persistentes após recriação.',
  );
} catch (error) {
  console.error(error.message);
  try {
    console.error(await docker('logs', '--tail', '30', container));
  } catch {
    /* No container yet. */
  }
  process.exitCode = 1;
} finally {
  try {
    await docker('rm', '--force', container);
  } catch {
    /* Already removed or not created. */
  }
  if (createdVolume) await docker('volume', 'rm', volume);
}
