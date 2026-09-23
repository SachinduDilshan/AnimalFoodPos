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

// Trimmed because cmdk trims the value it hands back to onSelect internally — if this
// didn't match, items with no barcode (a trailing space here) would never resolve when
// clicked, since the map key and the value cmdk reports back would silently differ.
function searchText(item) {
  return `${item.code} ${item.name} ${item.barcode ?? ''}`.toLowerCase().trim()
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

  const filteredItems = useMemo(() => {
    if (!remainder) return items
    const q = remainder.toLowerCase()
    return items.filter((item) => searchText(item).includes(q))
  }, [items, remainder])

  // cmdk only updates `highlighted` on explicit hover/arrow-key navigation, so without
  // this, typing a name and pressing Enter (without arrowing down first) would never
  // resolve to anything — default the highlight to the top match on every search change.
  useEffect(() => {
    setHighlighted(filteredItems[0] ? searchText(filteredItems[0]) : '')
  }, [filteredItems])

  // `selectedValue` is passed by cmdk when a specific CommandItem is clicked (or
  // Enter-confirmed while navigated to it) — it must take priority over whatever's
  // merely auto-highlighted, otherwise clicking any result but the top one silently
  // resolves to the wrong item. It's absent when Enter fires from the raw input itself.
  function commit(selectedValue) {
    const { qty, remainder: text } = parseQuickQty(inputValue)
    if (!text) return

    let resolved
    if (selectedValue) {
      resolved = itemsByCommandValue.get(selectedValue)
    } else {
      const exact = items.find(
        (i) =>
          i.code.toLowerCase() === text.toLowerCase() ||
          (i.barcode && i.barcode.toLowerCase() === text.toLowerCase()),
      )
      resolved = exact ?? itemsByCommandValue.get(highlighted)
    }

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
        {/*
          Always mounted (not conditionally rendered on `open`) so cmdk always has every
          CommandItem registered — otherwise the auto-highlight-first-match effect above
          has nothing to point `highlighted` at, and committing via Enter without first
          opening/navigating the dropdown would never resolve to an item. Visibility is
          purely a CSS toggle instead.
        */}
        <CommandList
          className={`absolute top-full right-0 left-0 z-50 mt-1 rounded-lg border bg-popover shadow-md ${
            open && inputValue ? '' : 'hidden'
          }`}
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
      </Command>
    </div>
  )
})
