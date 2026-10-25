import { createApp } from './app.js';

const { app, closeStreams } = createApp();
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, process.env.HOST || '0.0.0.0', () => {
  console.log(`PSCI API / terminal: http://localhost:${port}`);
});
function shutdown() {
  closeStreams();
  server.close();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
