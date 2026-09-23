export function formatRupees(amount) {
  const value = Number(amount ?? 0)
  return `Rs. ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
