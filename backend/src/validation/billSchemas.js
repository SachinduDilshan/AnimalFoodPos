const { z } = require('zod');

const DISCOUNT_TYPES = ['PERCENT', 'FLAT'];
const PAYMENT_METHODS = ['CASH', 'CARD', 'CREDIT', 'CHEQUE', 'OTHER'];

const billLineSchema = z
  .object({
    itemId: z.number().int().positive(),
    qty: z.number().positive(),
    rate: z.number().nonnegative(),
    discountType: z.enum(DISCOUNT_TYPES).optional(),
    discountValue: z.number().nonnegative().optional(),
  })
  .strict()
  .superRefine((line, ctx) => {
    if ((line.discountType !== undefined) !== (line.discountValue !== undefined)) {
      ctx.addIssue({
        code: 'custom',
        message: 'discountType and discountValue must be provided together',
        path: ['discountValue'],
      });
    }
    if (line.discountType === 'PERCENT' && line.discountValue > 100) {
      ctx.addIssue({
        code: 'custom',
        message: 'discountValue cannot exceed 100 for PERCENT',
        path: ['discountValue'],
      });
    }
  });

const createBillSchema = z
  .object({
    items: z.array(billLineSchema).min(1, 'At least one item is required'),
    billDiscountType: z.enum(DISCOUNT_TYPES).optional(),
    billDiscountValue: z.number().nonnegative().optional(),
    vatPercent: z.number().nonnegative().max(100).default(0),
    paymentMethod: z.enum(PAYMENT_METHODS),
    amountPaid: z.number().nonnegative().optional(),
    customerId: z.number().int().positive().nullable().optional(),
    customerName: z.string().trim().optional(),
    customerAddress: z.string().trim().optional(),
    customerPhone: z.string().trim().optional(),
    customerVatNumber: z.string().trim().optional(),
  })
  .strict()
  .superRefine((bill, ctx) => {
    if ((bill.billDiscountType !== undefined) !== (bill.billDiscountValue !== undefined)) {
      ctx.addIssue({
        code: 'custom',
        message: 'billDiscountType and billDiscountValue must be provided together',
        path: ['billDiscountValue'],
      });
    }
    if (bill.billDiscountType === 'PERCENT' && bill.billDiscountValue > 100) {
      ctx.addIssue({
        code: 'custom',
        message: 'billDiscountValue cannot exceed 100 for PERCENT',
        path: ['billDiscountValue'],
      });
    }
    if (bill.paymentMethod === 'CASH' && bill.amountPaid === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'amountPaid is required when paymentMethod is CASH',
        path: ['amountPaid'],
      });
    }
  });

module.exports = { createBillSchema, DISCOUNT_TYPES, PAYMENT_METHODS };
