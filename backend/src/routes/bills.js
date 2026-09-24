const express = require('express');
const { createBillsService } = require('../services/billsService');
const { createBillSchema } = require('../validation/billSchemas');
const { fromCents } = require('../utils/money');
const { NotFoundError } = require('../utils/errors');

function toResponse(bill) {
  return {
    id: bill.id,
    invoiceNo: bill.invoice_no,
    subtotal: fromCents(bill.subtotal),
    billDiscountType: bill.bill_discount_type,
    billDiscountValue: bill.bill_discount_value,
    billDiscountAmount: fromCents(bill.bill_discount_amount),
    taxableAmount: fromCents(bill.taxable_amount),
    vatPercent: bill.vat_percent,
    vatAmount: fromCents(bill.vat_amount),
    grandTotal: fromCents(bill.grand_total),
    paymentMethod: bill.payment_method,
    amountPaid: fromCents(bill.amount_paid),
    changeGiven: fromCents(bill.change_given),
    status: bill.status,
    customerId: bill.customer_id,
    customerName: bill.customer_name,
    customerAddress: bill.customer_address,
    customerPhone: bill.customer_phone,
    customerVatNumber: bill.customer_vat_number,
    createdAt: bill.created_at,
    items: bill.items.map((li) => ({
      id: li.id,
      itemId: li.item_id,
      itemCode: li.item_code,
      itemName: li.item_name,
      unit: li.unit,
      qty: li.qty,
      rate: fromCents(li.rate),
      discountType: li.discount_type,
      discountValue: li.discount_value,
      discountAmount: fromCents(li.discount_amount),
      lineTotal: fromCents(li.line_total),
    })),
  };
}

function toSummaryResponse(bill) {
  return {
    id: bill.id,
    invoiceNo: bill.invoice_no,
    createdAt: bill.created_at,
    paymentMethod: bill.payment_method,
    grandTotal: fromCents(bill.grand_total),
    status: bill.status,
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

function createBillsRouter(db) {
  const router = express.Router();
  const billsService = createBillsService(db);

  router.post('/', (req, res) => {
    const parsed = createBillSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    }

    try {
      const bill = billsService.createBill(parsed.data);
      res.status(201).json(toResponse(bill));
    } catch (err) {
      if (!err.statusCode) return res.status(400).json({ error: err.message });
      throw err;
    }
  });

  router.get('/', (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const limitRaw = Number(req.query.limit);
    const offsetRaw = Number(req.query.offset);
    const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 100;
    const offset = Number.isInteger(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
    res.json(billsService.listBills({ search, limit, offset }).map(toSummaryResponse));
  });

  router.get('/:id', (req, res) => {
    const id = parseId(req, res);
    if (id === null) return;
    try {
      res.json(toResponse(billsService.getBillById(id)));
    } catch (err) {
      if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
      throw err;
    }
  });

  return router;
}

module.exports = { createBillsRouter };
