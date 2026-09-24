import { useState } from 'react'
import { toast } from 'sonner'
import client from '@/api/client'
import { useBillHistory } from '@/hooks/useBillHistory'
import { getErrorMessage } from '@/lib/apiError'
import { formatRupees } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ReceiptPreviewDialog } from '@/components/pos/ReceiptPreviewDialog'

const COLUMN_COUNT = 6

function formatDate(value) {
  return new Date(value).toLocaleString('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BillHistory() {
  const { bills, loading, error, search, setSearch, refresh } = useBillHistory()

  const [viewingBill, setViewingBill] = useState(null)
  const [receiptOpen, setReceiptOpen] = useState(false)

  async function handleView(bill) {
    try {
      const res = await client.get(`/bills/${bill.id}`)
      setViewingBill(res.data)
      setReceiptOpen(true)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  function handleReceiptOpenChange(open) {
    setReceiptOpen(open)
    if (!open) setViewingBill(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Bill History</h1>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by invoice number or date…"
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>Failed to load bills: {error}</span>
          <Button variant="outline" size="sm" onClick={refresh}>
            Retry
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice No</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Grand Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="py-6 text-center text-muted-foreground">
                Loading bills…
              </TableCell>
            </TableRow>
          )}

          {!loading && bills.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="py-6 text-center text-muted-foreground">
                {search ? 'No bills match your search.' : 'No bills yet.'}
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            bills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell className="font-mono text-xs">{bill.invoiceNo}</TableCell>
                <TableCell>{formatDate(bill.createdAt)}</TableCell>
                <TableCell>{bill.paymentMethod}</TableCell>
                <TableCell>{formatRupees(bill.grandTotal)}</TableCell>
                <TableCell>
                  <Badge variant={bill.status === 'COMPLETED' ? 'default' : 'destructive'}>
                    {bill.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleView(bill)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <ReceiptPreviewDialog
        bill={viewingBill}
        open={receiptOpen}
        onOpenChange={handleReceiptOpenChange}
        closeLabel="Close"
      />
    </div>
  )
}
