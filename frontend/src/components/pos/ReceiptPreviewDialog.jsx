import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatRupees } from '@/lib/currency'
import { SHOP_NAME, SHOP_ADDRESS, SHOP_PHONE } from '@/config/shopInfo'


const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigitsToWords(n) {
  if (n < 20) return ONES[n]
  const tens = Math.floor(n / 10)
  const ones = n % 10
  return TENS[tens] + (ones ? ' ' + ONES[ones] : '')
}

function threeDigitsToWords(n) {
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  let words = ''
  if (hundreds) words += ONES[hundreds] + ' Hundred'
  if (rest) words += (words ? ' ' : '') + twoDigitsToWords(rest)
  return words
}

function integerToWords(n) {
  if (n === 0) return 'Zero'
  const crore = Math.floor(n / 10000000)
  n %= 10000000
  const lakh = Math.floor(n / 100000)
  n %= 100000
  const thousand = Math.floor(n / 1000)
  n %= 1000
  const hundred = n

  const parts = []
  if (crore) parts.push(threeDigitsToWords(crore) + ' Crore')
  if (lakh) parts.push(twoDigitsToWords(lakh) + ' Lakh')
  if (thousand) parts.push(twoDigitsToWords(thousand) + ' Thousand')
  if (hundred) parts.push(threeDigitsToWords(hundred))

  return parts.join(' ')
}

function amountInWords(amount) {
  const rupees = Math.floor(amount)
  const cents = Math.round((amount - rupees) * 100)

  let words = integerToWords(rupees) + ' Rupees'
  if (cents > 0) {
    words += ' and ' + twoDigitsToWords(cents) + ' Cents'
  }
  return words + ' Only'
}


function parseSqliteUTC(dateStr) {
  // SQLite's datetime('now') returns "YYYY-MM-DD HH:MM:SS" in UTC with no
  // timezone marker, so JS would otherwise misread it as local time.
  if (typeof dateStr !== 'string') return new Date(dateStr)
  return new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z')
}

function formatDateMMDDYYYY(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

function SectionLabel({ children }) {
  return (
    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </div>
  )
}

function LabelValue({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-0.5">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium">{value || '—'}</span>
    </div>
  )
}

function ReceiptBody({ bill }) {
  const createdAt = parseSqliteUTC(bill.createdAt)
  const lineDiscountTotal = bill.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0)

  return (
    <div className="mx-auto max-w-3xl bg-white text-gray-900">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="h-14 w-auto object-contain" />
          <div>
            <div className="text-xl font-bold tracking-tight">{SHOP_NAME}</div>
            <div className="text-sm text-gray-500">{SHOP_ADDRESS}</div>
            <div className="text-sm text-gray-500">Tel: {SHOP_PHONE}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tracking-tight text-gray-800">TAX INVOICE</div>
          <div className="mt-1 text-sm text-gray-500">Invoice No.</div>
          <div className="font-mono text-sm font-semibold">{bill.invoiceNo}</div>
          <div className="mt-1 text-sm text-gray-500">{formatDateMMDDYYYY(createdAt)}</div>
        </div>
      </div>

      {/* Supplier / Purchaser */}
      <div className="grid grid-cols-2 gap-8 border-b border-gray-200 py-6">
        <div>
          <SectionLabel>Supplier</SectionLabel>
          <div className="flex flex-col gap-0.5 text-sm">
            <div><span className="text-gray-500">Name: </span>{bill.supplierName || '—'}</div>
            <div><span className="text-gray-500">Address: </span>{bill.supplierAddress || '—'}</div>
            <div><span className="text-gray-500">Tel: </span>{bill.supplierPhone || '—'}</div>
            <div><span className="text-gray-500">TIN: </span>{bill.supplierTin || '—'}</div>
            <div><span className="text-gray-500">VAT Reg No: </span>{bill.supplierVatNumber || '—'}</div>
          </div>
        </div>
        <div>
          <SectionLabel>Purchaser</SectionLabel>
          <div className="flex flex-col gap-0.5 text-sm">
            <div><span className="text-gray-500">Name: </span>{bill.customerName || '—'}</div>
            <div><span className="text-gray-500">Address: </span>{bill.customerAddress || '—'}</div>
            <div><span className="text-gray-500">Tel: </span>{bill.customerPhone || '—'}</div>
            <div><span className="text-gray-500">TIN: </span>{bill.customerTin || '—'}</div>
            <div><span className="text-gray-500">VAT Reg No: </span>{bill.customerVatNumber || '—'}</div>
          </div>
        </div>
      </div>

      {/* Delivery / Supply info */}
      <div className="border-b border-gray-200 py-4 text-sm">
        <div className="grid grid-cols-2 gap-8">
          <LabelValue
            label="Date of Delivery"
            value={bill.deliveryDate ? formatDateMMDDYYYY(new Date(bill.deliveryDate + 'T00:00:00')) : ''}
          />
          <LabelValue label="Place of Supply" value={bill.placeOfSupply} />
        </div>
        <div className="mt-2 flex flex-col gap-0.5">
          <span className="text-gray-500">Additional Info</span>
          <span className="font-medium">{bill.additionalInfo || '—'}</span>
        </div>
      </div>

      {/* Items table */}
      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-800 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <th className="py-2 pl-1 pr-2 text-left font-semibold">#</th>
            <th className="px-2 py-2 text-left font-semibold">Item</th>
            <th className="px-2 py-2 text-right font-semibold">Qty</th>
            <th className="px-2 py-2 text-right font-semibold">Unit Price</th>
            <th className="px-2 py-2 text-right font-semibold">Discount</th>
            <th className="py-2 pl-2 pr-1 text-right font-semibold">Amount Excl. VAT</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, index) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-2.5 pl-1 pr-2 text-gray-500">{index + 1}</td>
              <td className="px-2 py-2.5 font-medium">{item.itemName}</td>
              <td className="px-2 py-2.5 text-right">{item.qty}</td>
              <td className="px-2 py-2.5 text-right">{formatRupees(item.rate)}</td>
              <td className="px-2 py-2.5 text-right text-gray-500">
                {item.discountAmount > 0 ? `−${formatRupees(item.discountAmount)}` : '—'}
              </td>
              <td className="py-2.5 pl-2 pr-1 text-right font-medium">{formatRupees(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-80 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatRupees(bill.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Discount</span>
            <span>
              {lineDiscountTotal + bill.billDiscountAmount > 0
                ? `−${formatRupees(lineDiscountTotal + bill.billDiscountAmount)}`
                : formatRupees(0)}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Total Value of Supply</span>
            <span>{formatRupees(bill.taxableAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 py-1 pt-2">
            <span className="text-gray-500">VAT Amount ({bill.vatPercent}%)</span>
            <span>{formatRupees(bill.vatAmount)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t-2 border-gray-800 py-2 text-base font-bold">
            <span>Total Amount (Incl. VAT)</span>
            <span>{formatRupees(bill.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-end">
        <div className="w-80 border-t border-gray-100 pt-2 text-xs text-gray-500">
          <span className="font-medium text-gray-700">Total Amount in Words: </span>
          {amountInWords(bill.grandTotal)}
        </div>
      </div>

      {/* Payment */}
      <div className="mt-6 flex justify-between border-t border-gray-200 pt-4 text-sm">
        <LabelValue label="Payment Method" value={bill.paymentMethod} />
        <div className="w-4" />
        <LabelValue label="Amount Paid" value={formatRupees(bill.amountPaid)} />
        {(bill.paymentMethod === 'CASH' || bill.paymentMethod === 'CREDIT') && bill.changeGiven > 0 && (
          <>
            <div className="w-4" />
            <LabelValue label="Change Given" value={formatRupees(bill.changeGiven)} />
          </>
        )}
      </div>
    </div>
  )
}

async function handlePrint(bill) {
  if (window.electronAPI?.printInvoice) {
    await window.electronAPI.printInvoice(bill.invoiceNo)
    return
  }
  window.print()
}

export function ReceiptPreviewDialog({ bill, open, onOpenChange, closeLabel = 'Close' }) {
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl print:hidden">
          {bill && (
            <>
              <DialogHeader>
                <DialogTitle>Receipt Preview</DialogTitle>
              </DialogHeader>

              <div className="max-h-[75vh] w-full overflow-y-auto text-sm">
                <ReceiptBody bill={bill} />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {closeLabel}
                </Button>
                <Button onClick={() => handlePrint(bill)}>Print</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/*
        Printed from a dedicated copy portaled directly to document.body, not
        from the on-screen dialog above. The dialog's content lives inside
        Radix's fixed-position, transformed, portaled, scrollable machinery —
        fighting that in print CSS broke twice (first the wrong-wrapper-hiding
        bug, then position:absolute clipping any receipt taller than one page
        instead of paginating it, confirmed by actually generating a PDF via
        printToPDF and rendering it, not just checking computed styles). This
        copy is a plain block, a direct child of body, in completely normal
        document flow — nothing to neutralize, and long receipts paginate
        across pages exactly like any other long HTML page.
      */}
      {bill &&
        createPortal(
          <div id="receipt-print-root" className="hidden print:block">
            <ReceiptBody bill={bill} />
          </div>,
          document.body,
        )}
    </>
  )
}