import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import client from '@/api/client'
import { useItems } from '@/hooks/useItems'
import { useCart } from '@/hooks/useCart'
import { getErrorMessage } from '@/lib/apiError'
import { SHOP_NAME, SHOP_ADDRESS, SHOP_PHONE, SHOP_VAT_NUMBER, SHOP_TIN } from '@/config/shopInfo'
import { ItemPickerList } from '@/components/pos/ItemPickerList'
import { AddToCartDialog } from '@/components/pos/AddToCartDialog'
import { CartTable } from '@/components/pos/CartTable'
import { BillSummary } from '@/components/pos/BillSummary'
import { ReceiptPreviewDialog } from '@/components/pos/ReceiptPreviewDialog'

function buildPayload({
  lines,
  billDiscountType,
  billDiscountValue,
  vatPercent,
  paymentMethod,
  amountPaid,
  supplierName,
  supplierAddress,
  supplierPhone,
  supplierTin,
  supplierVatNumber,
  customerName,
  customerAddress,
  customerPhone,
  customerTin,
  customerVatNumber,
}) {
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
    // CARD/OTHER/CHEQUE: amountPaid omitted — server ignores/forces it
    ...(supplierName.trim() && { supplierName: supplierName.trim() }),
    ...(supplierAddress.trim() && { supplierAddress: supplierAddress.trim() }),
    ...(supplierPhone.trim() && { supplierPhone: supplierPhone.trim() }),
    ...(supplierTin.trim() && { supplierTin: supplierTin.trim() }),
    ...(supplierVatNumber.trim() && { supplierVatNumber: supplierVatNumber.trim() }),
    ...(customerName.trim() && { customerName: customerName.trim() }),
    ...(customerAddress.trim() && { customerAddress: customerAddress.trim() }),
    ...(customerPhone.trim() && { customerPhone: customerPhone.trim() }),
    ...(customerTin.trim() && { customerTin: customerTin.trim() }),
    ...(customerVatNumber.trim() && { customerVatNumber: customerVatNumber.trim() }),
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
  const [supplierName, setSupplierName] = useState(SHOP_NAME)
  const [supplierAddress, setSupplierAddress] = useState(SHOP_ADDRESS)
  const [supplierPhone, setSupplierPhone] = useState(SHOP_PHONE)
  const [supplierTin, setSupplierTin] = useState(SHOP_TIN)
  const [supplierVatNumber, setSupplierVatNumber] = useState(SHOP_VAT_NUMBER)
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerTin, setCustomerTin] = useState('')
  const [customerVatNumber, setCustomerVatNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const searchRef = useRef(null)
  const [completedBill, setCompletedBill] = useState(null)
  // Drives AddToCartDialog for both flows:
  //   { item, mode: 'add' } — picked from ItemPickerList, fresh defaults
  //   { item, mode: 'edit', initialValues: { qty, rate, discountType, discountValue } } — editing an existing cart line
  const [dialogTarget, setDialogTarget] = useState(null)

  function focusSearch() {
    searchRef.current?.focus()
  }

  function handlePickItem(item) {
    setDialogTarget({ item, mode: 'add' })
  }

  function handleEditLine(line) {
    setDialogTarget({
      item: line.item,
      mode: 'edit',
      initialValues: {
        qty: line.qty,
        rate: line.rate,
        discountType: line.discountType,
        discountValue: line.discountValue,
      },
    })
  }

  function handleDialogOpenChange(open) {
    if (!open) {
      setDialogTarget(null)
      focusSearch()
    }
  }

  function handleDialogConfirm({ qty, rate, discountType, discountValue }) {
    if (dialogTarget?.mode === 'edit') {
      cart.updateLine(dialogTarget.item.id, { qty, rate, discountType, discountValue })
    } else {
      cart.addItem({ item: dialogTarget.item, qty, rate, discountType, discountValue })
      searchRef.current?.clear()
    }
  }

  function resetForNextSale() {
    cart.clear()
    setBillDiscountType('NONE')
    setBillDiscountValue(0)
    setVatPercent(0)
    setPaymentMethod('CASH')
    setAmountPaid('')
    setSupplierName(SHOP_NAME)
    setSupplierAddress(SHOP_ADDRESS)
    setSupplierPhone(SHOP_PHONE)
    setSupplierTin(SHOP_TIN)
    setSupplierVatNumber(SHOP_VAT_NUMBER)
    setCustomerName('')
    setCustomerAddress('')
    setCustomerPhone('')
    setCustomerTin('')
    setCustomerVatNumber('')
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
        supplierName,
        supplierAddress,
        supplierPhone,
        supplierTin,
        supplierVatNumber,
        customerName,
        customerAddress,
        customerPhone,
        customerTin,
        customerVatNumber,
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
            onEditLine={handleEditLine}
            onRemoveLine={cart.removeLine}
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
          supplierName={supplierName}
          onSupplierNameChange={setSupplierName}
          supplierAddress={supplierAddress}
          onSupplierAddressChange={setSupplierAddress}
          supplierPhone={supplierPhone}
          onSupplierPhoneChange={setSupplierPhone}
          supplierTin={supplierTin}
          onSupplierTinChange={setSupplierTin}
          supplierVatNumber={supplierVatNumber}
          onSupplierVatNumberChange={setSupplierVatNumber}
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
          customerAddress={customerAddress}
          onCustomerAddressChange={setCustomerAddress}
          customerPhone={customerPhone}
          onCustomerPhoneChange={setCustomerPhone}
          customerTin={customerTin}
          onCustomerTinChange={setCustomerTin}
          customerVatNumber={customerVatNumber}
          onCustomerVatNumberChange={setCustomerVatNumber}
          submitting={submitting}
          onCompleteSale={handleCompleteSale}
        />
      </div>

      <AddToCartDialog
        key={dialogTarget ? `${dialogTarget.mode}-${dialogTarget.item.id}` : 'none'}
        open={dialogTarget !== null}
        onOpenChange={handleDialogOpenChange}
        item={dialogTarget?.item ?? null}
        initialValues={dialogTarget?.initialValues}
        onConfirm={handleDialogConfirm}
      />

      <ReceiptPreviewDialog
        bill={completedBill}
        open={completedBill !== null}
        onOpenChange={handleReceiptDialogOpenChange}
        closeLabel="New Sale"
      />
    </div>
  )
}