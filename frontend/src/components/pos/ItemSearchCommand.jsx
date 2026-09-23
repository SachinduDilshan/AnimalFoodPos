import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command'
import { formatRupees } from '@/lib/currency'

const QTY_PREFIX_RE = /^(\d+(?:\.\d+)?)\s*\*\s*(.*)$/

function parseQuickQty(raw) {
  const match = raw.match(QTY_PREFIX_RE)
  if (!match) return { qty: 1, remainder: raw.trim() }
  return { qty: Number(match[1]), remainder: match[2].trim() }
}

function searchText(item) {
  return `${item.code} ${item.name} ${item.barcode ?? ''}`.toLowerCase()
}

export const ItemSearchCommand = forwardRef(function ItemSearchCommand({ items, onAddItem }, ref) {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState('')
  // command.jsx's CommandInput isn't forwardRef-wrapped, so we can't attach a ref
  // to it directly — grab the underlying <input> via the wrapper container instead.
  const containerRef = useRef(null)

  function focusInput() {
    containerRef.current?.querySelector('input')?.focus()
  }

  useImperativeHandle(ref, () => ({ focus: focusInput }))

  useEffect(() => {
    focusInput()
  }, [])

  const itemsByCommandValue = useMemo(() => {
    const map = new Map()
    for (const item of items) map.set(searchText(item), item)
    return map
  }, [items])

  const { remainder } = parseQuickQty(inputValue)

  function commit() {
    const { qty, remainder: text } = parseQuickQty(inputValue)
    if (!text) return

    const exact = items.find(
      (i) =>
        i.code.toLowerCase() === text.toLowerCase() ||
        (i.barcode && i.barcode.toLowerCase() === text.toLowerCase()),
    )
    const resolved = exact ?? itemsByCommandValue.get(highlighted)

    if (!resolved) {
      toast.error(`No item found for "${text}"`)
      return
    }

    onAddItem(resolved, qty)
    setInputValue('')
    setHighlighted('')
    focusInput()
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setInputValue('')
      setOpen(false)
      return
    }
    if (e.key !== 'Enter' || e.ctrlKey || e.metaKey) return
    e.preventDefault()
    commit()
  }

  return (
    <div ref={containerRef} className="relative">
      <Command
        shouldFilter={true}
        filter={(value, search) => {
          const { remainder: text } = parseQuickQty(search)
          return value.includes(text.toLowerCase()) ? 1 : 0
        }}
        value={highlighted}
        onValueChange={setHighlighted}
        className="overflow-visible rounded-lg border border-input bg-transparent"
      >
        <CommandInput
          value={inputValue}
          onValueChange={setInputValue}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          placeholder="Scan or search item by code, name, or barcode…"
        />
        {open && inputValue && (
          <CommandList
            className="absolute top-full right-0 left-0 z-50 mt-1 rounded-lg border bg-popover shadow-md"
            onMouseDown={(e) => e.preventDefault()}
          >
            <CommandEmpty className="py-4 text-sm text-muted-foreground">
              No items match "{remainder}".
            </CommandEmpty>
            {items.map((item) => (
              <CommandItem key={item.id} value={searchText(item)} onSelect={commit}>
                <span className="font-mono text-xs">{item.code}</span>
                <span className="flex-1">{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.unit}</span>
                <span className="text-xs text-muted-foreground">{formatRupees(item.sellingPrice)}</span>
              </CommandItem>
            ))}
          </CommandList>
        )}
      </Command>
    </div>
  )
})
