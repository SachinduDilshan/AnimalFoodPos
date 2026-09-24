import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { computeBillTotals, computeChangeDue } from '@/lib/billCalculations'
import { formatRupees } from '@/lib/currency'
import { TotalRow } from '@/components/pos/TotalRow'

const PAYMENT_METHODS = ['CASH', 'CARD', 'CREDIT', 'OTHER']

export function BillSummary({
  lines,
  billDiscountType,
  billDiscountValue,
  onBillDiscountChange,
  vatPercent,
  onVatPercentChange,
  paymentMethod,
  onPaymentMethodChange,
  amountPaid,
  onAmountPaidChange,
  submitting,
  onCompleteSale,
}) {
  const totals = computeBillTotals({ lines, billDiscountType, billDiscountValue, vatPercent })
  const { changeGiven, isInsufficient } = computeChangeDue({
    paymentMethod,
    amountPaid,
    grandTotal: totals.grandTotal,
  })

  const disabled = lines.length === 0 || (paymentMethod === 'CASH' && isInsufficient) || submitting

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bill Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Bill Discount</Label>
          <div className="flex items-center gap-1">
            <Select
              value={billDiscountType}
              onValueChange={(value) => onBillDiscountChange({ type: value, value: 0 })}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                <SelectItem value="PERCENT">Percent</SelectItem>
                <SelectItem value="FLAT">Flat</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              step="0.01"
              min="0"
              max={billDiscountType === 'PERCENT' ? '100' : undefined}
              disabled={billDiscountType === 'NONE'}
              value={billDiscountValue}
              onChange={(e) => onBillDiscountChange({ type: billDiscountType, value: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="vat-percent">VAT %</Label>
          <Input
            id="vat-percent"
            type="number"
            step="0.01"
            min="0"
            value={vatPercent}
            onChange={(e) => onVatPercentChange(Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-1 border-t pt-3">
          <TotalRow label="Subtotal" value={formatRupees(totals.subtotal)} />
          <TotalRow label="Bill Discount" value={`−${formatRupees(totals.billDiscountAmount)}`} />
          <TotalRow label="Taxable Amount" value={formatRupees(totals.taxableAmount)} />
          <TotalRow label="VAT Amount" value={formatRupees(totals.vatAmount)} />
          <TotalRow label="Grand Total" value={formatRupees(totals.grandTotal)} emphasize />
        </div>

        <div className="flex flex-col gap-1.5 border-t pt-3">
          <Label htmlFor="payment-method">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <SelectTrigger id="payment-method" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount-paid">Amount Paid</Label>
          <Input
            id="amount-paid"
            type="number"
            step="0.01"
            min="0"
            disabled={paymentMethod === 'CARD' || paymentMethod === 'OTHER'}
            value={
              paymentMethod === 'CARD' || paymentMethod === 'OTHER'
                ? totals.grandTotal.toFixed(2)
                : amountPaid
            }
            onChange={(e) => onAmountPaidChange(e.target.value)}
          />
          {paymentMethod === 'CASH' && isInsufficient && (
            <p className="text-xs text-destructive">Amount paid must be at least the grand total.</p>
          )}
          {paymentMethod === 'CREDIT' && (
            <p className="text-xs text-muted-foreground">
              Optional part-payment now — remainder is tracked as credit.
            </p>
          )}
        </div>

        {(paymentMethod === 'CASH' || paymentMethod === 'CREDIT') && (
          <TotalRow label="Change" value={formatRupees(changeGiven)} />
        )}

        <Button size="lg" disabled={disabled} onClick={onCompleteSale}>
          {submitting ? 'Completing…' : 'Complete Sale'}
        </Button>
      </CardContent>
    </Card>
  )
}
