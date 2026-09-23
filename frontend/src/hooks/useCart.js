import { useState } from 'react'

export function useCart() {
  const [lines, setLines] = useState([])

  function addItem({ item, qty = 1 }) {
    setLines((prev) => {
      const index = prev.findIndex((l) => l.itemId === item.id)
      if (index === -1) {
        return [
          ...prev,
          {
            itemId: item.id,
            item,
            qty,
            rate: item.sellingPrice,
            discountType: 'NONE',
            discountValue: 0,
          },
        ]
      }
      const next = [...prev]
      const merged = Math.round((next[index].qty + qty) * 1000) / 1000
      next[index] = { ...next[index], qty: merged }
      return next
    })
  }

  function updateLine(itemId, patch) {
    setLines((prev) => prev.map((l) => (l.itemId === itemId ? { ...l, ...patch } : l)))
  }

  function removeLine(itemId) {
    setLines((prev) => prev.filter((l) => l.itemId !== itemId))
  }

  function clear() {
    setLines([])
  }

  return { lines, addItem, updateLine, removeLine, clear }
}
