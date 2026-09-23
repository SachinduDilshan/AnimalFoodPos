/** Convert a rupee amount (float, e.g. 125.50) to integer cents (12550). */
function toCents(amount) {
  return Math.round(Number(amount) * 100);
}

/** Convert integer cents (12550) back to a rupee float (125.5). */
function fromCents(cents) {
  return Number(cents) / 100;
}

/** Format integer cents as an LKR display string, e.g. "Rs. 1,250.50". */
function formatLKR(cents) {
  const rupees = fromCents(cents);
  return `Rs. ${rupees.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

module.exports = { toCents, fromCents, formatLKR };
