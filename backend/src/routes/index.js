const express = require('express');
const { createItemsRouter } = require('./items');
const { createBillsRouter } = require('./bills');

/**
 * Builds the /api router. Feature routes get mounted here as they're built
 * (items, categories, bills, settings, ...).
 */
function createRouter(db) {
  const router = express.Router();

  router.get('/health', (req, res) => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => row.name);

    res.json({ ok: true, dbPath: db.name, tables });
  });

  router.use('/items', createItemsRouter(db));
  router.use('/bills', createBillsRouter(db));

  return router;
}

module.exports = { createRouter };
