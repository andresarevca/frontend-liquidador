import { useEffect, useMemo, useState } from 'react'

import { api } from '@/api/client'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { DocumentoConCarpeta } from '@/types'

export function DocumentosPage() {
  const [docs, setDocs] = useState<DocumentoConCarpeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api
      .documentos()
      .then(setDocs)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const casoCount = useMemo(() => new Set(docs.map((d) => d.caso_pk)).size, [docs])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return q
      ? docs.filter(
          (d) =>
            d.nombre_archivo.toLowerCase().includes(q) ||
            d.tipo_doc.toLowerCase().includes(q) ||
            d.caso_id.toLowerCase().includes(q),
        )
      : docs
  }, [docs, search])

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Documentos</h1>
        <p className="text-sm text-muted-foreground">
          Biblioteca global de archivos recibidos en todos los casos.
        </p>
      </div>

      <div className="mb-4 flex gap-3">
        <Input
          placeholder="Buscar por archivo, tipo o caso..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">{docs.length}</strong> documentos
          </span>
          <span>
            <strong className="text-foreground">{casoCount}</strong> casos
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      ) : (
        <Card className="overflow-hidden">
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
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    Cargando documentos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    No hay documentos.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{d.nombre_archivo}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {d.caso_id}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.tipo_doc || '—'}</td>
                    <td className="px-4 py-3 text-xs uppercase text-muted-foreground">
                      {d.formato}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
