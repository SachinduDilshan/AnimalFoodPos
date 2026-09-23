import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const UNITS = ['KG', 'PKT', 'PCS', 'BAG']

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  unit: 'PCS',
  barcode: '',
  costPrice: '0',
  sellingPrice: '0',
  reorderLevel: '0',
}

export function ItemFormDialog({ open, onOpenChange, initialItem, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const isEdit = Boolean(initialItem)

  useEffect(() => {
    if (!open) return
    if (initialItem) {
      setForm({
        code: initialItem.code,
        name: initialItem.name,
        description: initialItem.description ?? '',
        unit: initialItem.unit,
        barcode: initialItem.barcode ?? '',
        costPrice: String(initialItem.costPrice),
        sellingPrice: String(initialItem.sellingPrice),
        reorderLevel: String(initialItem.reorderLevel),
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, initialItem])

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)

    const payload = {
      name: form.name,
      description: form.description || null,
      unit: form.unit,
      barcode: form.barcode ? form.barcode : null,
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      reorderLevel: Number(form.reorderLevel),
    }
    if (!isEdit) payload.code = form.code

    const result = await onSubmit(payload)
    setSaving(false)
    if (result) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-code">Item Code / ID</Label>
              <Input
                id="item-code"
                required
                disabled={isEdit}
                value={form.code}
                onChange={(e) => setField('code', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                required
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-unit">Unit</Label>
              <Select value={form.unit} onValueChange={(v) => setField('unit', v)}>
                <SelectTrigger id="item-unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-barcode">Barcode</Label>
              <Input
                id="item-barcode"
                value={form.barcode}
                onChange={(e) => setField('barcode', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-cost-price">Cost Price (Rs.)</Label>
                <Input
                  id="item-cost-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.costPrice}
                  onChange={(e) => setField('costPrice', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-selling-price">Selling Price (Rs.)</Label>
                <Input
                  id="item-selling-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.sellingPrice}
                  onChange={(e) => setField('sellingPrice', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-reorder-level">Reorder Level</Label>
              <Input
                id="item-reorder-level"
                type="number"
                step="1"
                min="0"
                value={form.reorderLevel}
                onChange={(e) => setField('reorderLevel', e.target.value)}
              />
            </div>

            {isEdit && (
              <p className="text-sm text-muted-foreground">
                Stock Qty: {initialItem.stockQty} (read-only, updated via stock movements)
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
