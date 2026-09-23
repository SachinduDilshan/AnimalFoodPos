const { z } = require('zod');

const UNIT_ENUM = ['KG', 'PKT', 'PCS', 'BAG'];

const codeSchema = z.string().trim().min(1, 'code is required').max(64, 'code too long');
const nameSchema = z.string().trim().min(1, 'name is required').max(200, 'name too long');
const descriptionSchema = z.string().trim().max(2000).nullable().optional();
const unitSchema = z.enum(UNIT_ENUM);
const barcodeSchema = z.string().trim().min(1).max(64).nullable().optional();
const categoryIdSchema = z.number().int().positive().nullable().optional();
const priceSchema = z.number().nonnegative();
const reorderLevelSchema = z.number().nonnegative();

// Create: only code/name are required, everything else is server-defaulted if omitted.
const createItemSchema = z
  .object({
    code: codeSchema,
    name: nameSchema,
    description: descriptionSchema,
    unit: unitSchema.optional(),
    categoryId: categoryIdSchema,
    barcode: barcodeSchema,
    costPrice: priceSchema.optional(),
    sellingPrice: priceSchema.optional(),
    reorderLevel: reorderLevelSchema.optional(),
  })
  .strict();

// Update: everything optional, but at least one field must be present. stockQty/isActive/id are
// deliberately left out of the shape so .strict() rejects them with a clear "unrecognized key" error
// instead of silently ignoring an attempt to change them outside their dedicated flows.
const updateItemSchema = z
  .object({
    code: codeSchema.optional(),
    name: nameSchema.optional(),
    description: descriptionSchema,
    unit: unitSchema.optional(),
    categoryId: categoryIdSchema,
    barcode: barcodeSchema,
    costPrice: priceSchema.optional(),
    sellingPrice: priceSchema.optional(),
    reorderLevel: reorderLevelSchema.optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one field must be provided' });

module.exports = { createItemSchema, updateItemSchema, UNIT_ENUM };
