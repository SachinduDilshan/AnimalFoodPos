import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import client from '@/api/client'
import { useItems } from '@/hooks/useItems'
import { useCart } from '@/hooks/useCart'
import { getErrorMessage } from '@/lib/apiError'
import { ItemPickerList } from '@/components/pos/ItemPickerList'
import { AddToCartDialog } from '@/components/pos/AddToCartDialog'
import { CartTable } from '@/components/pos/CartTable'
import { BillSummary } from '@/components/pos/BillSummary'
import { ReceiptPreviewDialog } from '@/components/pos/ReceiptPreviewDialog'

// vatPercent is intentionally not accepted here — it's preview-only until backend
// VAT-override support lands, and the bills schema would reject an unknown field anyway.
function buildPayload({ lines, billDiscountType, billDiscountValue, paymentMethod, amountPaid }) {
  return {
    items: lines.map((l) => ({
      itemId: l.itemId,
      qty: Number(l.qty),
      rate: Number(l.rate),
      ...(l.discountType !== 'NONE' && {
        discountType: l.discountType,
        discountValue: Number(l.discountValue),
      }),
    })),
    ...(billDiscountType !== 'NONE' && {
      billDiscountType,
      billDiscountValue: Number(billDiscountValue),
    }),
    paymentMethod,
    ...(paymentMethod === 'CASH' && { amountPaid: Number(amountPaid) }),
    ...(paymentMethod === 'CREDIT' && Number(amountPaid) > 0 && { amountPaid: Number(amountPaid) }),
    // CARD/OTHER: amountPaid omitted — server ignores/forces it
    // vatPercent: never sent — preview-only until backend VAT-override support lands
  }
}

export default function POS() {
  const { items, loading: itemsLoading } = useItems()
  const cart = useCart()

  const [billDiscountType, setBillDiscountType] = useState('NONE')
  const [billDiscountValue, setBillDiscountValue] = useState(0)
  const [vatPercent, setVatPercent] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [amountPaid, setAmountPaid] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const searchRef = useRef(null)
  // Always null now — qty/rate/discount are entered in AddToCartDialog before a line ever
  // reaches the cart, so CartTable no longer needs to be told to auto-focus a just-added row.
  // Left wired in (rather than removed from CartTable) since CartTable's own inline-edit
  // Enter-chain still independently depends on the sibling onFocusSearch prop.
  const focusRequest = null
  const [completedBill, setCompletedBill] = useState(null)
  const [pendingItem, setPendingItem] = useState(null)

  function focusSearch() {
    searchRef.current?.focus()
  }

  function handlePickItem(item) {
    setPendingItem(item)
  }

  function handleAddModalOpenChange(open) {
    if (!open) {
      setPendingItem(null)
      focusSearch()
    }
  }

  function handleConfirmAdd({ qty, rate, discountType, discountValue }) {
    cart.addItem({ item: pendingItem, qty, rate, discountType, discountValue })
    searchRef.current?.clear()
  }

  function resetForNextSale() {
    cart.clear()
    setBillDiscountType('NONE')
    setBillDiscountValue(0)
    setVatPercent(0)
    setPaymentMethod('CASH')
    setAmountPaid('')
    focusSearch()
  }

  function handleReceiptDialogOpenChange(open) {
    if (!open) {
      setCompletedBill(null)
      resetForNextSale()
    }
  }

  async function handleCompleteSale() {
    if (cart.lines.length === 0 || submitting || completedBill !== null) return
    setSubmitting(true)
    try {
      const payload = buildPayload({
        lines: cart.lines,
        billDiscountType,
        billDiscountValue,
        paymentMethod,
        amountPaid,
      })
      const res = await client.post('/bills', payload)
      setCompletedBill(res.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompleteSaleRef = useRef(handleCompleteSale)
  handleCompleteSaleRef.current = handleCompleteSale

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCompleteSaleRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">POS</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr_360px]">
        <ItemPickerList ref={searchRef} items={items} onPickItem={handlePickItem} />

        {itemsLoading ? (
          <p className="text-sm text-muted-foreground">Loading items…</p>
        ) : (
          <CartTable
            lines={cart.lines}
            onUpdateLine={cart.updateLine}
            onRemoveLine={cart.removeLine}
            focusRequest={focusRequest}
            onFocusSearch={focusSearch}
          />
        )}

        <BillSummary
          lines={cart.lines}
          billDiscountType={billDiscountType}
          billDiscountValue={billDiscountValue}
          onBillDiscountChange={({ type, value }) => {
            setBillDiscountType(type)
            setBillDiscountValue(value)
          }}
          vatPercent={vatPercent}
          onVatPercentChange={setVatPercent}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          amountPaid={amountPaid}
          onAmountPaidChange={setAmountPaid}
          submitting={submitting}
          onCompleteSale={handleCompleteSale}
        />
      </div>

      <AddToCartDialog
        key={pendingItem?.id ?? 'none'}
        open={pendingItem !== null}
        onOpenChange={handleAddModalOpenChange}
        item={pendingItem}
        onConfirm={handleConfirmAdd}
      />

      <ReceiptPreviewDialog
        bill={completedBill}
        open={completedBill !== null}
        onOpenChange={handleReceiptDialogOpenChange}
      />
    </div>
  )
}
