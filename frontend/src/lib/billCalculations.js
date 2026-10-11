export function computeDiscountAmount(type, value, baseAmount) {
  if (type === 'PERCENT') return baseAmount * (Math.min(value, 100) / 100)
  if (type === 'FLAT') return Math.min(Math.max(value, 0), baseAmount)
  return 0
}

export function computeLineTotal({ qty, rate, discountType, discountValue }) {
  const grossAmount = qty * rate
  const discountAmount = computeDiscountAmount(discountType, discountValue, grossAmount)
  return { grossAmount, discountAmount, lineTotal: grossAmount - discountAmount }
}

export function computeBillTotals({ lines, billDiscountType, billDiscountValue, vatPercent }) {
  const subtotal = lines.reduce((sum, l) => sum + computeLineTotal(l).lineTotal, 0)
  const billDiscountAmount = computeDiscountAmount(billDiscountType, billDiscountValue, subtotal)
  const taxableAmount = subtotal - billDiscountAmount
  const vatAmount = taxableAmount * ((vatPercent || 0) / 100)
  return { subtotal, billDiscountAmount, taxableAmount, vatAmount, grandTotal: taxableAmount + vatAmount }
}

export function computeChangeDue({ paymentMethod, amountPaid, grandTotal }) {
  const paid = Number(amountPaid) || 0
  if (paymentMethod === 'CASH') {
    return { changeGiven: Math.max(0, paid - grandTotal), isInsufficient: paid < grandTotal }
  }
  if (paymentMethod === 'CARD' || paymentMethod === 'OTHER') {
    return { changeGiven: 0, isInsufficient: false }
  }
  return { changeGiven: Math.max(0, paid - grandTotal), isInsufficient: false }
}
