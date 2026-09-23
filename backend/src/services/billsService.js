const { NotFoundError } = require('../utils/errors');
const { toCents } = require('../utils/money');

function formatBillNo(seq) {
  return `BILL-${String(seq).padStart(6, '0')}`;
}

function createBillsService(db) {
  const nextBillNoStmt = db.prepare(`
    INSERT INTO counters (name, value) VALUES ('bill_no', 1)
    ON CONFLICT(name) DO UPDATE SET value = value + 1
    RETURNING value
  `);
  const getItemStmt = db.prepare('SELECT * FROM items WHERE id = ?');
  const getSettingsStmt = db.prepare('SELECT default_vat_percent FROM settings WHERE id = 1');
  const insertBillStmt = db.prepare(`
    INSERT INTO bills (
      bill_no, subtotal, bill_discount_type, bill_discount_value, bill_discount_amount,
      taxable_amount, vat_percent, vat_amount, grand_total,
      payment_method, amount_paid, change_given, status, customer_id
    ) VALUES (
      @billNo, @subtotal, @billDiscountType, @billDiscountValue, @billDiscountAmount,
      @taxableAmount, @vatPercent, @vatAmount, @grandTotal,
      @paymentMethod, @amountPaid, @changeGiven, 'COMPLETED', @customerId
    )
  `);
  const insertBillItemStmt = db.prepare(`
    INSERT INTO bill_items (
      bill_id, item_id, item_code, item_name, unit, qty, rate,
      discount_type, discount_value, discount_amount, line_total
    ) VALUES (
      @billId, @itemId, @itemCode, @itemName, @unit, @qty, @rate,
      @discountType, @discountValue, @discountAmount, @lineTotal
    )
  `);
  const insertStockMovementStmt = db.prepare(`
    INSERT INTO stock_movements (item_id, type, qty_change, unit_cost, reference_id, note)
    VALUES (@itemId, 'SALE', @qtyChange, @unitCost, @referenceId, NULL)
  `);
  const updateStockStmt = db.prepare('UPDATE items SET stock_qty = stock_qty - @qty WHERE id = @itemId');

  function getBillById(id) {
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
    if (!bill) throw new NotFoundError(`Bill ${id} not found`);
    const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ? ORDER BY id').all(id);
    return { ...bill, items };
  }

  function computeDiscountCents(type, value, baseCents) {
    if (type === 'PERCENT') return Math.round(baseCents * (value / 100));
    if (type === 'FLAT') return Math.min(Math.round(toCents(value)), baseCents);
    return 0;
  }

  function createBill(input) {
    const txn = db.transaction(() => {
      const { value: seq } = nextBillNoStmt.get();
      const billNo = formatBillNo(seq);

      const lineComputations = input.items.map((line) => {
        const item = getItemStmt.get(line.itemId);
        if (!item) throw new Error(`Item ${line.itemId} not found`);
        if (!item.is_active) throw new Error(`Item ${line.itemId} is not active`);

        const rateCents = toCents(line.rate);
        const grossCents = Math.round(rateCents * line.qty);
        const discountAmountCents = computeDiscountCents(line.discountType, line.discountValue, grossCents);
        const lineTotalCents = grossCents - discountAmountCents;

        return { item, line, rateCents, discountAmountCents, lineTotalCents };
      });

      const subtotalCents = lineComputations.reduce((sum, l) => sum + l.lineTotalCents, 0);

      const billDiscountAmountCents = computeDiscountCents(
        input.billDiscountType,
        input.billDiscountValue,
        subtotalCents,
      );
      const taxableAmountCents = subtotalCents - billDiscountAmountCents;

      const { default_vat_percent: vatPercent } = getSettingsStmt.get();
      const vatAmountCents = Math.round(taxableAmountCents * (vatPercent / 100));
      const grandTotalCents = taxableAmountCents + vatAmountCents;

      let amountPaidCents;
      let changeGivenCents;
      if (input.paymentMethod === 'CASH') {
        amountPaidCents = toCents(input.amountPaid);
        if (amountPaidCents < grandTotalCents) {
          throw new Error('amountPaid is less than grandTotal for CASH payment');
        }
        changeGivenCents = amountPaidCents - grandTotalCents;
      } else if (input.paymentMethod === 'CARD' || input.paymentMethod === 'OTHER') {
        amountPaidCents = grandTotalCents;
        changeGivenCents = 0;
      } else {
        amountPaidCents = input.amountPaid !== undefined ? toCents(input.amountPaid) : 0;
        changeGivenCents = Math.max(0, amountPaidCents - grandTotalCents);
      }

      const billInfo = insertBillStmt.run({
        billNo,
        subtotal: subtotalCents,
        billDiscountType: input.billDiscountType ?? null,
        billDiscountValue: input.billDiscountValue ?? 0,
        billDiscountAmount: billDiscountAmountCents,
        taxableAmount: taxableAmountCents,
        vatPercent,
        vatAmount: vatAmountCents,
        grandTotal: grandTotalCents,
        paymentMethod: input.paymentMethod,
        amountPaid: amountPaidCents,
        changeGiven: changeGivenCents,
        customerId: input.customerId ?? null,
      });
      const billId = billInfo.lastInsertRowid;

      for (const l of lineComputations) {
        insertBillItemStmt.run({
          billId,
          itemId: l.item.id,
          itemCode: l.item.code,
          itemName: l.item.name,
          unit: l.item.unit,
          qty: l.line.qty,
          rate: l.rateCents,
          discountType: l.line.discountType ?? null,
          discountValue: l.line.discountValue ?? 0,
          discountAmount: l.discountAmountCents,
          lineTotal: l.lineTotalCents,
        });
        insertStockMovementStmt.run({
          itemId: l.item.id,
          qtyChange: -l.line.qty,
          unitCost: l.item.cost_price,
          referenceId: billId,
        });
        updateStockStmt.run({ qty: l.line.qty, itemId: l.item.id });
      }

      return billId;
    });

    const billId = txn();
    return getBillById(billId);
  }

  return { createBill, getBillById };
}

module.exports = { createBillsService };
