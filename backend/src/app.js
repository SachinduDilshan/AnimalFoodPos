const express = require('express');
const cors = require('cors');
const { createRouter } = require('./routes');

/** Builds the Express app wired to the given open db handle. Does not listen. */
function createApp(db) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api', createRouter(db));

  return app;
}

module.exports = { createApp };
