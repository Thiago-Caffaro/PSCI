import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/app.js';

const directory = await mkdtemp(join(tmpdir(), 'psci-browser-test-'));
const { app, closeStreams } = createApp({ dataFile: join(directory, 'db.json') });
const server = app.listen(3101, '127.0.0.1', () =>
  console.log('PSCI browser tests: http://127.0.0.1:3101'),
);
async function stop() {
  closeStreams();
  server.closeAllConnections();
  server.close(async () => {
    await rm(directory, { recursive: true, force: true });
    process.exit(0);
  });
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
