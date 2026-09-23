const { openDb } = require('./db/connection');
const { createApp } = require('./app');

let db;
let server;

/** Opens the DB, runs migrations, and listens on 127.0.0.1 only. */
function startServer({ dbPath, port = 5178 }) {
  db = openDb(dbPath);
  const app = createApp(db);

  return new Promise((resolve, reject) => {
    server = app.listen(port, '127.0.0.1', (err) => {
      if (err) return reject(err);
      console.log(`[server] listening on http://127.0.0.1:${port} (db: ${dbPath})`);
      resolve({ app, db, server });
    });
  });
}

function stopServer() {
  if (server) server.close();
  if (db) db.close();
}

module.exports = { startServer, stopServer };
