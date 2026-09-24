import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatRupees } from '@/lib/currency'

const COLUMN_COUNT = 5

function matchesSearch(item, term) {
  if (!term.trim()) return true
  const q = term.trim().toLowerCase()
  return (
    item.code.toLowerCase().includes(q) ||
    item.name.toLowerCase().includes(q) ||
    (item.barcode ?? '').toLowerCase().includes(q)
  )
}

export const ItemPickerList = forwardRef(function ItemPickerList({ items, onPickItem }, ref) {
  const [searchText, setSearchText] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef(null)

  function focusInput() {
    containerRef.current?.querySelector('input')?.focus()
  }

  useImperativeHandle(ref, () => ({
    focus: focusInput,
    clear: () => setSearchText(''),
  }))

  useEffect(() => {
    focusInput()
  }, [])

  const filteredItems = useMemo(
    () => items.filter((item) => matchesSearch(item, searchText)),
    [items, searchText],
  )

  // Auto-highlight the top match on every keystroke, same as the old search dropdown did,
  // so Enter works immediately without needing to arrow down first.
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredItems])

  // Only fires for real keyboard moves — mouse hover never touches highlightedIndex, so this
  // effect can't yank scroll position out from under the user while they're just hovering.
  // TableRow isn't forwardRef-wrapped (same issue as Input/SelectTrigger elsewhere in this
  // app), so find the row via its data attribute instead of a ref callback.
  useEffect(() => {
    containerRef.current
      ?.querySelector(`[data-row-index="${highlightedIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex])

  function pickHighlighted() {
    const item = filteredItems[highlightedIndex]
    if (item) onPickItem(item)
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, filteredItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pickHighlighted()
    } else if (e.key === 'Escape') {
      setSearchText('')
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      <Input
        placeholder="Search item by code, name, or barcode…"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="max-h-[70vh] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky top-0 z-10 bg-background">Code</TableHead>
              <TableHead className="sticky top-0 z-10 bg-background">Name</TableHead>
              <TableHead className="sticky top-0 z-10 bg-background text-center">Unit</TableHead>
              <TableHead className="sticky top-0 z-10 bg-background text-right">Price</TableHead>
              <TableHead className="sticky top-0 z-10 bg-background text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-6 text-center text-muted-foreground">
                  No items match your search.
                </TableCell>
              </TableRow>
            )}

            {filteredItems.map((item, index) => (
              <TableRow
                key={item.id}
                data-row-index={index}
                data-highlighted={index === highlightedIndex ? 'true' : undefined}
                className="cursor-pointer hover:bg-accent data-[highlighted=true]:bg-accent"
                onClick={() => onPickItem(item)}
              >
                <TableCell className="font-mono text-xs">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-center">{item.unit}</TableCell>
                <TableCell className="text-right">{formatRupees(item.sellingPrice)}</TableCell>
                <TableCell className="text-right">{item.stockQty}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
})
