import { useState } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { useItems } from '@/hooks/useItems'
import { formatRupees } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ItemFormDialog } from '@/components/inventory/ItemFormDialog'
import { DeleteItemDialog } from '@/components/inventory/DeleteItemDialog'

const COLUMN_COUNT = 8

function matchesSearch(item, term) {
  if (!term.trim()) return true
  const q = term.trim().toLowerCase()
  return item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
}

export default function Inventory() {
  const {
    items,
    loading,
    error,
    includeInactive,
    setIncludeInactive,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  } = useItems()

  const [searchTerm, setSearchTerm] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [itemPendingDelete, setItemPendingDelete] = useState(null)

  const filteredItems = items.filter((item) => matchesSearch(item, searchTerm))

  function openCreateDialog() {
    setEditingItem(null)
    setFormOpen(true)
  }

  function openEditDialog(item) {
    setEditingItem(item)
    setFormOpen(true)
  }

  function openDeleteDialog(item) {
    setItemPendingDelete(item)
    setDeleteOpen(true)
  }

  async function handleFormSubmit(values) {
    if (editingItem) return updateItem(editingItem.id, values)
    return createItem(values)
  }

  async function handleConfirmDelete() {
    if (itemPendingDelete) await deleteItem(itemPendingDelete.id)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Inventory</h1>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by code or name…"
          className="max-w-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Select
          value={includeInactive ? 'all' : 'active'}
          onValueChange={(v) => setIncludeInactive(v === 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="all">All items</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button onClick={openCreateDialog}>Add Item</Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>Failed to load items: {error}</span>
          <Button variant="outline" size="sm" onClick={refresh}>
            Retry
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Cost Price</TableHead>
            <TableHead>Selling Price</TableHead>
            <TableHead>Stock Qty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="py-6 text-center text-muted-foreground">
                Loading items…
              </TableCell>
            </TableRow>
          )}

          {!loading && filteredItems.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="py-6 text-center text-muted-foreground">
                {searchTerm
                  ? 'No items match your search.'
                  : 'No items yet — click "Add Item" to create one.'}
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{formatRupees(item.costPrice)}</TableCell>
                <TableCell>{formatRupees(item.sellingPrice)}</TableCell>
                <TableCell>{item.stockQty}</TableCell>
                <TableCell>
                  <Badge variant={item.isActive ? 'default' : 'destructive'}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={!item.isActive}
                      title={!item.isActive ? 'Item is deactivated' : 'Edit item'}
                      onClick={() => openEditDialog(item)}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={!item.isActive}
                      title={!item.isActive ? 'Item is deactivated' : 'Deactivate item'}
                      onClick={() => openDeleteDialog(item)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <ItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initialItem={editingItem}
        onSubmit={handleFormSubmit}
      />

      <DeleteItemDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        item={itemPendingDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
