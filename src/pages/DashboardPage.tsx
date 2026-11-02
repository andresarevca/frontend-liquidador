import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, CheckCircle2, Loader2, AlertCircle, FolderOpen } from 'lucide-react'

import { api } from '@/api/client'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { StatusBadge } from '@/components/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Carpeta } from '@/types'

const POLL_MS = 10000

type Resumen = { total: number; completadas: number; procesando: number; errores: number; recientes: Carpeta[] }

// Los totales se piden al servidor (page_size=1 sólo para leer `count`) en lugar de bajar todas las carpetas.
async function cargarResumen(): Promise<Resumen> {
  const [total, completadas, procesando, errores, recientes] = await Promise.all([
    api.carpetasPage({ page_size: 1 }),
    api.carpetasPage({ page_size: 1, estado: 'COMPLETADA' }),
    api.carpetasPage({ page_size: 1, estado: 'PROCESANDO' }),
    api.carpetasPage({ page_size: 1, estado: 'ERROR' }),
    api.carpetasPage({ page_size: 5 }),
  ])
  return {
    total: total.count,
    completadas: completadas.count,
    procesando: procesando.count,
    errores: errores.count,
    recientes: recientes.results,
  }
}

export function DashboardPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let cancelled = false
    cargarResumen()
      .then((r) => {
        if (cancelled) return
        setResumen(r)
        setError(null)
      })
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [intento])

  const hayEnCurso = (resumen?.procesando ?? 0) > 0
  useEffect(() => {
    if (!hayEnCurso) return
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      cargarResumen()
        .then(setResumen)
        .catch(() => undefined)
    }, POLL_MS)
    return () => clearInterval(id)
  }, [hayEnCurso])

  const reintentar = useCallback(() => {
    setError(null)
    setIntento((n) => n + 1)
  }, [])

  const loading = resumen === null && !error
  const stats = resumen ?? { total: 0, completadas: 0, procesando: 0, errores: 0, recientes: [] }
  const recientes = stats.recientes

  const kpis = [
    { label: 'Total casos', value: stats.total, icon: FolderKanban, color: 'text-foreground' },
    {
      label: 'Completadas',
      value: stats.completadas,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Procesando',
      value: stats.procesando,
      icon: Loader2,
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Con error',
      value: stats.errores,
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen general de la operación.</p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reintentar} />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {kpis.map((k) => (
              <Card key={k.label}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {k.label}
                    </CardTitle>
                    <k.icon className={`h-4 w-4 ${k.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${k.color}`}>{loading ? '—' : k.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Casos recientes</CardTitle>
              <Link to="/casos" className="text-xs font-medium text-primary hover:underline">
                Ver todos →
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <p className="px-4 py-12 text-center text-sm text-muted-foreground">Cargando casos...</p>
              ) : recientes.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="Aún no hay casos"
                  description="Los casos aparecen cuando llega un correo con la documentación del siniestro."
                />
              ) : (
                <ul className="divide-y">
                  {recientes.map((c) => (
                    <li key={c.id}>
                      <Link
                        to={`/casos/${c.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 active:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold">{c.caso_id}</p>
                          <p className="truncate text-sm text-muted-foreground">{c.email_asunto}</p>
                        </div>
                        <StatusBadge estado={c.estado} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
