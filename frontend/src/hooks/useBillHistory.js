import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import client from '@/api/client'
import { getErrorMessage as errorMessage } from '@/lib/apiError'

export function useBillHistory() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await client.get('/bills', {
        params: debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {},
      })
      setBills(res.data)
      setError(null)
    } catch (err) {
      const message = errorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { bills, loading, error, search, setSearch, refresh }
}
