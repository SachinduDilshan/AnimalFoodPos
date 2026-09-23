const express = require('express');

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

  return router;
}

module.exports = { createRouter };
