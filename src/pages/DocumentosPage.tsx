import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'

import { api } from '@/api/client'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Pagination } from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { usePagedList } from '@/hooks/use-paged-list'
import type { DocumentoConCarpeta } from '@/types'

export function DocumentosPage() {
  const [search, setSearch] = useState('')
  const { items, count, page, setPage, pageCount, loading, firstLoad, error, reload } =
    usePagedList<DocumentoConCarpeta>(api.documentosPage, { search })

  const hayBusqueda = search.trim() !== ''

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Documentos</h1>
        <p className="text-sm text-muted-foreground">
          Biblioteca global de archivos recibidos en todos los casos.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por archivo, tipo o caso..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-md"
        />
        <span className="text-xs text-muted-foreground sm:ml-auto">
          {firstLoad ? '—' : <><strong className="text-foreground">{count}</strong> documentos</>}
        </span>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : firstLoad ? (
        <Card className="px-4 py-12 text-center text-sm text-muted-foreground">Cargando documentos...</Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title={hayBusqueda ? 'No se encontraron documentos' : 'Aún no hay documentos'}
            description={
              hayBusqueda
                ? 'Prueba con otro nombre de archivo, tipo o número de caso.'
                : 'Los archivos aparecen aquí cuando se reciben en un caso.'
            }
            action={
              hayBusqueda ? (
                <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                  Limpiar búsqueda
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link to="/casos">Ir a Casos</Link>
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          {/* Móvil: tarjetas */}
          <ul className="space-y-3 md:hidden">
            {items.map((d) => (
              <li key={d.id}>
                <Link
                  to={`/casos/${d.caso_pk}`}
                  className="block rounded-lg border bg-card p-4 shadow-sm active:bg-muted/50"
                >
                  <p className="break-all text-sm font-medium">{d.nombre_archivo}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-mono">{d.caso_id}</span>
                    {' · '}
                    {d.tipo_doc || 'Sin clasificar'}
                    {' · '}
                    <span className="uppercase">{d.formato}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Escritorio: tabla */}
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {['Archivo', 'Caso', 'Tipo de documento', 'Formato'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{d.nombre_archivo}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      <Link to={`/casos/${d.caso_pk}`} className="hover:text-primary hover:underline">
                        {d.caso_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.tipo_doc || '—'}</td>
                    <td className="px-4 py-3 text-xs uppercase text-muted-foreground">{d.formato}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Pagination
            page={page}
            pageCount={pageCount}
            count={count}
            noun="documentos"
            disabled={loading}
            onPage={setPage}
          />
        </div>
      )}
    </div>
  )
}
