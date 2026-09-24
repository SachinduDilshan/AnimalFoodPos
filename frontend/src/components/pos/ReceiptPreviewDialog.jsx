import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatRupees } from '@/lib/currency'
import { TotalRow } from '@/components/pos/TotalRow'
import { SHOP_NAME, SHOP_ADDRESS, SHOP_PHONE } from '@/config/shopInfo'

export function ReceiptPreviewDialog({ bill, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        {bill && (
          <>
            <DialogHeader className="print:hidden">
              <DialogTitle>Receipt Preview</DialogTitle>
            </DialogHeader>

            <div className="receipt-print-area max-h-[75vh] w-full overflow-y-auto text-sm print:max-h-none print:overflow-visible">
              <div className="mb-4 flex items-start justify-between border-b pb-4">
                <div>
                  <div className="text-lg font-semibold">{SHOP_NAME}</div>
                  <div className="text-muted-foreground">{SHOP_ADDRESS}</div>
                  <div className="text-muted-foreground">Tel: {SHOP_PHONE}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">INVOICE</div>
                  <div>Bill No: {bill.billNo}</div>
                  <div>
                    {new Date(bill.createdAt).toLocaleString('en-LK', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

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
            </div>

            <DialogFooter className="print:hidden">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                New Sale
              </Button>
              <Button onClick={() => window.print()}>Print</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
