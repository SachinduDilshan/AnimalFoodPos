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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ReceiptPreviewDialog } from '@/components/pos/ReceiptPreviewDialog'

const COLUMN_COUNT = 6

function parseSqliteUTC(dateStr) {
  if (typeof dateStr !== 'string') return new Date(dateStr)
  return new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z')
}

function formatDate(value) {
  const d = parseSqliteUTC(value)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Colombo',
  })
  return `${mm}/${dd}/${yyyy} ${time}`
}

export default function BillHistory() {
  const { bills, loading, error, search, setSearch, refresh } = useBillHistory()

  const [viewingBill, setViewingBill] = useState(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [deletingBill, setDeletingBill] = useState(null)
  const [deleting, setDeleting] = useState(false)

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

  async function handleConfirmDelete() {
    if (!deletingBill) return
    setDeleting(true)
    try {
      await client.delete(`/bills/${deletingBill.id}`)
      toast.success(`Invoice ${deletingBill.invoiceNo} deleted`)
      setDeletingBill(null)
      refresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
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
                <TableCell className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(bill)}>
                    View
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeletingBill(bill)}>
                    Delete
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

      <AlertDialog open={deletingBill !== null} onOpenChange={(open) => !open && setDeletingBill(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice {deletingBill?.invoiceNo}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the invoice and its line items. This cannot be undone, and stock
              levels will not be restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}