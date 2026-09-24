export function ProductCell({ item }) {
  return (
    <div className="flex flex-col">
      <span className="font-medium">{item.name}</span>
      <span className="font-mono text-xs text-muted-foreground">
        {item.code} · {item.unit}
      </span>
    </div>
  )
}
