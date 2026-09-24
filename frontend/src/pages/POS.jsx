import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import client from '@/api/client'
import { useItems } from '@/hooks/useItems'
import { useCart } from '@/hooks/useCart'
import { getErrorMessage } from '@/lib/apiError'
import { ItemSearchCommand } from '@/components/pos/ItemSearchCommand'
import { CartTable } from '@/components/pos/CartTable'
import { BillSummary } from '@/components/pos/BillSummary'
import { ReceiptPreviewDialog } from '@/components/pos/ReceiptPreviewDialog'

function buildPayload({ lines, billDiscountType, billDiscountValue, vatPercent, paymentMethod, amountPaid }) {
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
    vatPercent: Number(vatPercent),
    paymentMethod,
    ...(paymentMethod === 'CASH' && { amountPaid: Number(amountPaid) }),
    ...(paymentMethod === 'CREDIT' && Number(amountPaid) > 0 && { amountPaid: Number(amountPaid) }),
    // CARD/OTHER: amountPaid omitted — server ignores/forces it
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
  const [focusRequest, setFocusRequest] = useState(null)
  const [completedBill, setCompletedBill] = useState(null)

  function focusSearch() {
    searchRef.current?.focus()
  }

  function handleAddItem(item, qty) {
    cart.addItem({ item, qty })
    // Always a new object so the effect fires even when re-scanning the same item twice in a row.
    setFocusRequest({ itemId: item.id, at: Date.now() })
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
        vatPercent,
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <ItemSearchCommand ref={searchRef} items={items} onAddItem={handleAddItem} />
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
        </div>

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

      <ReceiptPreviewDialog
        bill={completedBill}
        open={completedBill !== null}
        onOpenChange={handleReceiptDialogOpenChange}
        closeLabel="New Sale"
      />
    </div>
  )
}
