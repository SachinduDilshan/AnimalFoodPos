const express = require('express');
const { createItemsService } = require('../services/itemsService');
const { createItemSchema, updateItemSchema } = require('../validation/itemSchemas');
const { toCents, fromCents } = require('../utils/money');
const { NotFoundError, ConflictError } = require('../utils/errors');

function toResponse(row) {
  return {
    id: row.id,
    code: row.code,
    barcode: row.barcode,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    unit: row.unit,
    costPrice: fromCents(row.cost_price),
    sellingPrice: fromCents(row.selling_price),
    stockQty: row.stock_qty,
    reorderLevel: row.reorder_level,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'id must be an integer' });
    return null;
  }
  return id;
}

function createItemsRouter(db) {
  const router = express.Router();
  const itemsService = createItemsService(db);

  router.post('/', (req, res) => {
    const parsed = createItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    }

    const d = parsed.data;
    try {
      const item = itemsService.createItem({
        code: d.code,
        name: d.name,
        description: d.description ?? null,
        unit: d.unit ?? 'PCS',
        categoryId: d.categoryId ?? null,
        barcode: d.barcode ?? null,
        costPriceCents: d.costPrice !== undefined ? toCents(d.costPrice) : 0,
        sellingPriceCents: d.sellingPrice !== undefined ? toCents(d.sellingPrice) : 0,
        reorderLevel: d.reorderLevel ?? 0,
      });
      res.status(201).json(toResponse(item));
    } catch (err) {
      if (err instanceof ConflictError) return res.status(409).json({ error: err.message });
      throw err;
    }
  });

  router.get('/', (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    const items = itemsService.listItems({ includeInactive });
    res.json(items.map(toResponse));
  });

  router.get('/:id', (req, res) => {
    const id = parseId(req, res);
    if (id === null) return;
    try {
      res.json(toResponse(itemsService.getItemById(id)));
    } catch (err) {
      if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
      throw err;
    }
  });

  router.patch('/:id', (req, res) => {
    const id = parseId(req, res);
    if (id === null) return;

    const parsed = updateItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    }

    const d = parsed.data;
    const changes = {};
    if (d.code !== undefined) changes.code = d.code;
    if (d.name !== undefined) changes.name = d.name;
    if (d.description !== undefined) changes.description = d.description;
    if (d.unit !== undefined) changes.unit = d.unit;
    if (d.categoryId !== undefined) changes.categoryId = d.categoryId;
    if (d.barcode !== undefined) changes.barcode = d.barcode;
    if (d.costPrice !== undefined) changes.costPriceCents = toCents(d.costPrice);
    if (d.sellingPrice !== undefined) changes.sellingPriceCents = toCents(d.sellingPrice);
    if (d.reorderLevel !== undefined) changes.reorderLevel = d.reorderLevel;

    try {
      res.json(toResponse(itemsService.updateItem(id, changes)));
    } catch (err) {
      if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
      if (err instanceof ConflictError) return res.status(409).json({ error: err.message });
      throw err;
    }
  });

  router.delete('/:id', (req, res) => {
    const id = parseId(req, res);
    if (id === null) return;
    try {
      res.json(toResponse(itemsService.softDeleteItem(id)));
    } catch (err) {
      if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
      throw err;
    }
  });

  return router;
}

module.exports = { createItemsRouter };
