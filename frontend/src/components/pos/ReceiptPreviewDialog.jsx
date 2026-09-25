import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatRupees } from '@/lib/currency'
import { TotalRow } from '@/components/pos/TotalRow'
import { SHOP_NAME, SHOP_ADDRESS, SHOP_PHONE, SHOP_VAT_NUMBER,SHOP_TIN } from '@/config/shopInfo'


function parseSqliteUTC(dateStr) {
  // SQLite's datetime('now') returns "YYYY-MM-DD HH:MM:SS" in UTC with no
  // timezone marker, so JS would otherwise misread it as local time.
  if (typeof dateStr !== 'string') return new Date(dateStr)
  return new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z')
}

function ReceiptBody({ bill }) {
  return (
    <>
      <div className="mb-4 flex flex-col items-center border-b pb-4 text-center">
        <img src="/logo.png" alt="" className="mb-2 h-16 w-auto object-contain" />
        <div className="text-lg font-semibold">{SHOP_NAME}</div>
        <div className="text-muted-foreground">{SHOP_ADDRESS}</div>
        <div className="text-muted-foreground">Tel: {SHOP_PHONE}</div>
        <div className="text-muted-foreground">VAT Reg No: {SHOP_VAT_NUMBER}</div>
        <div className="text-muted-foreground">TIN: {SHOP_TIN}</div>
      </div>

      <div className="mb-4 flex items-start justify-between">
        <div className="text-left">
          <div className="font-semibold">Supplier</div>
          {bill.supplierName && <div>{bill.supplierName}</div>}
          {bill.supplierAddress && <div className="text-muted-foreground">{bill.supplierAddress}</div>}
          {bill.supplierPhone && <div className="text-muted-foreground">Tel: {bill.supplierPhone}</div>}
          {bill.supplierTin && <div className="text-muted-foreground">TIN: {bill.supplierTin}</div>}
          {bill.supplierVatNumber && (
            <div className="text-muted-foreground">VAT Reg No: {bill.supplierVatNumber}</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">INVOICE</div>
          <div>Invoice No: {bill.invoiceNo}</div>
          <div>
            {parseSqliteUTC(bill.createdAt).toLocaleString('en-LK', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Colombo',
            })}
          </div>
        </div>
      </div>

      {(bill.customerName || bill.customerAddress || bill.customerPhone || bill.customerTin || bill.customerVatNumber) && (
        <div className="mb-4 text-left">
          <div className="font-semibold">Purchaser</div>
          {bill.customerName && <div>{bill.customerName}</div>}
          {bill.customerAddress && <div className="text-muted-foreground">{bill.customerAddress}</div>}
          {bill.customerPhone && <div className="text-muted-foreground">Tel: {bill.customerPhone}</div>}
          {bill.customerTin && <div className="text-muted-foreground">TIN: {bill.customerTin}</div>}
          {bill.customerVatNumber && (
            <div className="text-muted-foreground">VAT Reg No: {bill.customerVatNumber}</div>
          )}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Code</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Discount</TableHead>
            <TableHead className="text-right">Line Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bill.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.itemName}</TableCell>
              <TableCell className="font-mono text-xs">{item.itemCode}</TableCell>
              <TableCell className="text-right">{item.qty}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell className="text-right">{formatRupees(item.rate)}</TableCell>
              <TableCell className="text-right">
                {item.discountAmount > 0 ? `−${formatRupees(item.discountAmount)}` : '—'}
              </TableCell>
              <TableCell className="text-right">{formatRupees(item.lineTotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 flex justify-end">
        <div className="flex w-72 flex-col gap-0.5">
          <TotalRow label="Subtotal" value={formatRupees(bill.subtotal)} />
          {bill.billDiscountAmount > 0 && (
            <TotalRow label="Bill Discount" value={`−${formatRupees(bill.billDiscountAmount)}`} />
          )}
          <TotalRow label="Taxable Amount" value={formatRupees(bill.taxableAmount)} />
          <TotalRow label={`VAT (${bill.vatPercent}%)`} value={formatRupees(bill.vatAmount)} />
          <TotalRow label="Grand Total" value={formatRupees(bill.grandTotal)} emphasize />
        </div>
      </div>

      <div className="mt-4 flex justify-end border-t pt-4">
        <div className="flex w-72 flex-col gap-0.5">
          <TotalRow label="Payment Method" value={bill.paymentMethod} />
          <TotalRow label="Amount Paid" value={formatRupees(bill.amountPaid)} />
          {(bill.paymentMethod === 'CASH' || bill.paymentMethod === 'CREDIT') && bill.changeGiven > 0 && (
            <TotalRow label="Change Given" value={formatRupees(bill.changeGiven)} />
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-muted-foreground">Thank you for your business!</div>
    </>
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
