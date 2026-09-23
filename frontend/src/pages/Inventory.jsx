import { useEffect, useState } from 'react'
import client from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Inventory() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    client
      .get('/health')
      .then((res) => setHealth(res.data))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Inventory</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Backend health check</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {error && <p className="text-destructive">Failed to reach backend: {error}</p>}
          {!error && !health && <p className="text-muted-foreground">Checking /api/health…</p>}
          {health && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={health.ok ? 'default' : 'destructive'}>
                  {health.ok ? 'OK' : 'ERROR'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">DB path:</span>{' '}
                <code className="text-xs">{health.dbPath}</code>
              </div>
              <div>
                <span className="text-muted-foreground">Tables ({health.tables.length}):</span>{' '}
                <code className="text-xs">{health.tables.join(', ')}</code>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
