import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

import { api } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import type { Carpeta } from '@/types'

export function DashboardPage() {
  const [carpetas, setCarpetas] = useState<Carpeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .carpetas()
      .then(setCarpetas)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(
    () => ({
      total: carpetas.length,
      completadas: carpetas.filter((c) => c.estado === 'COMPLETADA').length,
      procesando: carpetas.filter((c) => c.estado === 'PROCESANDO').length,
      errores: carpetas.filter((c) => c.estado === 'ERROR').length,
    }),
    [carpetas],
  )

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

  const recientes = carpetas.slice(0, 5)

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen general de la operación.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
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
            <CardHeader>
              <CardTitle className="text-base">Casos recientes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Caso
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Asunto
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Estado
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                        Cargando casos...
                      </td>
                    </tr>
                  ) : recientes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                        No hay casos todavía.
                      </td>
                    </tr>
                  ) : (
                    recientes.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">{c.caso_id}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.email_asunto}</td>
                        <td className="px-4 py-3">
                          <StatusBadge estado={c.estado} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/casos/${c.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Ver detalle →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
