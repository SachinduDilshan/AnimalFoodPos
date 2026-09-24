import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { computeLineTotal } from '@/lib/billCalculations'
import { formatRupees } from '@/lib/currency'

// select.jsx's SelectTrigger/input.jsx's Input aren't forwardRef-wrapped, so a `ref` prop on
// them silently does nothing — query the actual DOM node by data attribute instead, same
// workaround CartTable.jsx uses.
function focusField(container, field) {
  const el = container?.querySelector(`[data-field="${field}"]`)
  el?.focus()
  el?.select?.()
}

export function AddToCartDialog({ open, onOpenChange, item, initialValues, onConfirm }) {
  const containerRef = useRef(null)
  const isEdit = initialValues != null
  // Lazy initializers so a freshly-keyed instance (POS.jsx keys this by mode+item id,
  // forcing a remount per open) starts with the right values immediately — no reliance on
  // an effect correcting a stale DOM value after the fact. When initialValues is absent
  // (fresh add) these fall through to the same defaults as before.
  const [qty, setQty] = useState(() => String(initialValues?.qty ?? '1'))
  const [rate, setRate] = useState(() => String(initialValues?.rate ?? item?.sellingPrice ?? '0'))
  const [discountType, setDiscountType] = useState(() => initialValues?.discountType ?? 'NONE')
  const [discountValue, setDiscountValue] = useState(() => String(initialValues?.discountValue ?? '0'))
  const [pendingDiscountFocus, setPendingDiscountFocus] = useState(false)

  function confirmAndClose() {
    onConfirm({
      qty: Number(qty),
      rate: Number(rate),
      discountType,
      discountValue: Number(discountValue),
    })
    onOpenChange(false)
  }

  // Deferred one render so the discount-value input has already re-enabled (or, for NONE, so
  // we submit directly) before we try to focus it — mirrors CartTable.jsx's identical pattern.
  useEffect(() => {
    if (!pendingDiscountFocus) return
    if (discountType === 'NONE') {
      confirmAndClose()
    } else {
      focusField(containerRef.current, 'discount-value')
    }
    setPendingDiscountFocus(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountType, pendingDiscountFocus])

  function handleFieldKeyDown(e, nextField) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (nextField) {
      focusField(containerRef.current, nextField)
    } else {
      confirmAndClose()
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    confirmAndClose()
  }

  if (!item) return null

  const isKg = item.unit === 'KG'
  const step = isKg ? '0.01' : '1'
  const preview = computeLineTotal({
    qty: Number(qty) || 0,
    rate: Number(rate) || 0,
    discountType,
    discountValue: Number(discountValue) || 0,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          focusField(containerRef.current, 'qty')
        }}
      >
        {/* DialogContent (like Input/SelectTrigger/TableRow elsewhere in this app) isn't
            forwardRef-wrapped, so scope the querySelector idiom to this plain div instead. */}
        <form
          ref={containerRef}
          onSubmit={handleSubmit}
          autoComplete="off"
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit "${item.name}" in Cart` : `Add "${item.name}" to Cart`}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-qty">Qty ({item.unit})</Label>
              <Input
                id="add-qty"
                type="number"
                step={step}
                min={step}
                data-field="qty"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                onKeyDown={(e) => handleFieldKeyDown(e, 'rate')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-rate">Rate (Rs.)</Label>
              <Input
                id="add-rate"
                type="number"
                step="0.01"
                min="0"
                data-field="rate"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                onKeyDown={(e) => handleFieldKeyDown(e, 'discount-type')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Discount</Label>
              <div className="flex items-center gap-1">
                <Select
                  value={discountType}
                  onValueChange={(value) => {
                    setDiscountType(value)
                    setDiscountValue('0')
                    setPendingDiscountFocus(true)
                  }}
                >
                  <SelectTrigger className="w-28" data-field="discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  {/* Radix restores focus to the trigger when the popup closes, which fires
                      after (and overrides) the pendingDiscountFocus effect's own focus call
                      above — opt out so our explicit focus/submit wins, same as CartTable.jsx. */}
                  <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                    <SelectItem value="NONE">None</SelectItem>
                    <SelectItem value="PERCENT">Percent</SelectItem>
                    <SelectItem value="FLAT">Flat</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={discountType === 'PERCENT' ? '100' : undefined}
                  disabled={discountType === 'NONE'}
                  data-field="discount-value"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  onKeyDown={(e) => handleFieldKeyDown(e, null)}
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Line Total: {formatRupees(preview.lineTotal)}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Add to Cart'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
