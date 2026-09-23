// Standalone dev runner: starts the backend against backend/dev.db, without Electron.
// Useful for testing routes with Postman/curl while building features.
const path = require('path');
const { startServer } = require('./server');

const dbPath = path.join(__dirname, '..', 'dev.db');

startServer({ dbPath }).catch((err) => {
  console.error('[dev] failed to start server', err);
  process.exit(1);
});
