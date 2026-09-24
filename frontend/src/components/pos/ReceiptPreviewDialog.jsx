import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatRupees } from '@/lib/currency'
import { TotalRow } from '@/components/pos/TotalRow'
import { SHOP_NAME, SHOP_ADDRESS, SHOP_PHONE } from '@/config/shopInfo'

export function ReceiptPreviewDialog({ bill, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {bill && (
          <>
            <DialogHeader className="print:hidden">
              <DialogTitle>Receipt Preview</DialogTitle>
            </DialogHeader>

            <div className="receipt-print-area mx-auto max-h-[70vh] w-[80mm] overflow-y-auto font-mono text-xs print:max-h-none print:overflow-visible">
              <div className="mb-2 text-center">
                <div className="text-sm font-semibold">{SHOP_NAME}</div>
                <div>{SHOP_ADDRESS}</div>
                <div>Tel: {SHOP_PHONE}</div>
                <div className="my-1 border-t border-dashed" />
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

              <div className="border-t border-dashed py-2">
                {bill.items.map((item) => (
                  <div key={item.id} className="mb-1">
                    <div className="flex justify-between">
                      <span>{item.itemName}</span>
                      <span>{formatRupees(item.lineTotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>
                        {item.itemCode} · {item.qty} {item.unit} @ {formatRupees(item.rate)}
                      </span>
                      {item.discountAmount > 0 && <span>−{formatRupees(item.discountAmount)}</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-0.5 border-t border-dashed pt-2">
                <TotalRow label="Subtotal" value={formatRupees(bill.subtotal)} />
                {bill.billDiscountAmount > 0 && (
                  <TotalRow label="Bill Discount" value={`−${formatRupees(bill.billDiscountAmount)}`} />
                )}
                <TotalRow label="Taxable Amount" value={formatRupees(bill.taxableAmount)} />
                <TotalRow label={`VAT (${bill.vatPercent}%)`} value={formatRupees(bill.vatAmount)} />
                <TotalRow label="Grand Total" value={formatRupees(bill.grandTotal)} emphasize />
              </div>

              <div className="flex flex-col gap-0.5 border-t border-dashed pt-2">
                <TotalRow label="Payment Method" value={bill.paymentMethod} />
                <TotalRow label="Amount Paid" value={formatRupees(bill.amountPaid)} />
                {(bill.paymentMethod === 'CASH' || bill.paymentMethod === 'CREDIT') && bill.changeGiven > 0 && (
                  <TotalRow label="Change Given" value={formatRupees(bill.changeGiven)} />
                )}
              </div>
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
