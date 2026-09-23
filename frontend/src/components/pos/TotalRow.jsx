export function TotalRow({ label, value, emphasize }) {
  return (
    <div className={`flex items-center justify-between ${emphasize ? 'text-base font-semibold' : 'text-sm'}`}>
      <span className={emphasize ? '' : 'text-muted-foreground'}>{label}</span>
      <span>{value}</span>
    </div>
  )
}
