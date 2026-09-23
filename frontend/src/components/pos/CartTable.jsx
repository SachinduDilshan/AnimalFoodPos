import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { computeLineTotal } from '@/lib/billCalculations'
import { formatRupees } from '@/lib/currency'

const COLUMN_COUNT = 8

export function CartTable({ lines, onUpdateLine, onRemoveLine }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Rate</TableHead>
          <TableHead>Discount</TableHead>
          <TableHead>Line Total</TableHead>
          <TableHead>Remove</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.length === 0 && (
          <TableRow>
            <TableCell colSpan={COLUMN_COUNT} className="py-6 text-center text-muted-foreground">
              Cart is empty — scan or search for an item above.
            </TableCell>
          </TableRow>
        )}

        {lines.map((line) => {
          const { lineTotal } = computeLineTotal(line)
          const isKg = line.item.unit === 'KG'
          const step = isKg ? '0.01' : '1'

          return (
            <TableRow key={line.itemId}>
              <TableCell className="font-mono text-xs">{line.item.code}</TableCell>
              <TableCell>{line.item.name}</TableCell>
              <TableCell>{line.item.unit}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  step={step}
                  min={step}
                  value={line.qty}
                  className="w-20"
                  onChange={(e) => onUpdateLine(line.itemId, { qty: Number(e.target.value) })}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={line.rate}
                  className="w-24"
                  onChange={(e) => onUpdateLine(line.itemId, { rate: Number(e.target.value) })}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Select
                    value={line.discountType}
                    onValueChange={(value) => onUpdateLine(line.itemId, { discountType: value, discountValue: 0 })}
                  >
                    <SelectTrigger className="w-24">
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
                    max={line.discountType === 'PERCENT' ? '100' : undefined}
                    disabled={line.discountType === 'NONE'}
                    value={line.discountValue}
                    className="w-20"
                    onChange={(e) => onUpdateLine(line.itemId, { discountValue: Number(e.target.value) })}
                  />
                </div>
              </TableCell>
              <TableCell className="text-right">{formatRupees(lineTotal)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${line.item.name}`}
                  onClick={() => onRemoveLine(line.itemId)}
                >
                  <Trash2Icon />
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
