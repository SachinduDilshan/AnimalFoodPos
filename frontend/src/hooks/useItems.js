import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import client from '@/api/client'
import { getErrorMessage as errorMessage } from '@/lib/apiError'

export function useItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [includeInactive, setIncludeInactive] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await client.get('/items', {
        params: includeInactive ? { includeInactive: true } : {},
      })
      setItems(res.data)
      setError(null)
    } catch (err) {
      const message = errorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [includeInactive])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createItem(values) {
    try {
      const res = await client.post('/items', values)
      toast.success('Item created')
      await refresh()
      return res.data
    } catch (err) {
      toast.error(errorMessage(err))
      return null
    }
  }

  async function updateItem(id, values) {
    try {
      const res = await client.patch(`/items/${id}`, values)
      toast.success('Item updated')
      await refresh()
      return res.data
    } catch (err) {
      toast.error(errorMessage(err))
      return null
    }
  }

  async function deleteItem(id) {
    try {
      const res = await client.delete(`/items/${id}`)
      toast.success('Item deactivated')
      await refresh()
      return res.data
    } catch (err) {
      toast.error(errorMessage(err))
      return null
    }
  }

  return {
    items,
    loading,
    error,
    includeInactive,
    setIncludeInactive,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  }
}
