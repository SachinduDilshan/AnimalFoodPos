const { NotFoundError, ConflictError } = require('../utils/errors');

function conflictFieldFromMessage(message) {
  if (message.includes('items.code')) return 'code';
  if (message.includes('items.barcode')) return 'barcode';
  return 'field';
}

function createItemsService(db) {
  function getItemById(id) {
    const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!row) throw new NotFoundError(`Item ${id} not found`);
    return row;
  }

  function createItem({
    code,
    name,
    description,
    unit,
    categoryId,
    barcode,
    costPriceCents,
    sellingPriceCents,
    reorderLevel,
  }) {
    const stmt = db.prepare(`
      INSERT INTO items (code, barcode, name, description, category_id, unit, cost_price, selling_price, stock_qty, reorder_level, is_active)
      VALUES (@code, @barcode, @name, @description, @categoryId, @unit, @costPrice, @sellingPrice, 0, @reorderLevel, 1)
    `);

    let info;
    try {
      info = stmt.run({
        code,
        barcode: barcode ?? null,
        name,
        description: description ?? null,
        categoryId: categoryId ?? null,
        unit: unit ?? 'PCS',
        costPrice: costPriceCents ?? 0,
        sellingPrice: sellingPriceCents ?? 0,
        reorderLevel: reorderLevel ?? 0,
      });
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ConflictError(`${conflictFieldFromMessage(err.message)} already exists`);
      }
      throw err;
    }

    return getItemById(info.lastInsertRowid);
  }

  function listItems({ includeInactive = false } = {}) {
    const sql = includeInactive
      ? 'SELECT * FROM items ORDER BY name'
      : 'SELECT * FROM items WHERE is_active = 1 ORDER BY name';
    return db.prepare(sql).all();
  }

  const COLUMN_MAP = {
    code: 'code',
    name: 'name',
    description: 'description',
    unit: 'unit',
    categoryId: 'category_id',
    barcode: 'barcode',
    costPriceCents: 'cost_price',
    sellingPriceCents: 'selling_price',
    reorderLevel: 'reorder_level',
  };

  function updateItem(id, changes) {
    getItemById(id);

    const keys = Object.keys(changes).filter((key) => key in COLUMN_MAP);
    if (keys.length === 0) return getItemById(id);

    const setClauses = keys.map((key) => `${COLUMN_MAP[key]} = @${key}`);
    setClauses.push("updated_at = datetime('now')");

    const stmt = db.prepare(`UPDATE items SET ${setClauses.join(', ')} WHERE id = @id`);

    try {
      stmt.run({ ...changes, id });
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ConflictError(`${conflictFieldFromMessage(err.message)} already exists`);
      }
      throw err;
    }

    return getItemById(id);
  }

  function softDeleteItem(id) {
    getItemById(id);
    db.prepare("UPDATE items SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(id);
    return getItemById(id);
  }

  return { createItem, listItems, getItemById, updateItem, softDeleteItem };
}

module.exports = { createItemsService };
