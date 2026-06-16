import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { StatusBadge } from '../components/StatusBadge'
import type { Carpeta, EstadoCarpeta } from '../types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function CarpetaListPage() {
  const [carpetas, setCarpetas] = useState<Carpeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoCarpeta | ''>('')

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
      error: carpetas.filter((c) => c.estado === 'ERROR').length,
    }),
    [carpetas],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return carpetas.filter((c) => {
      const matchSearch =
        !q ||
        c.caso_id.toLowerCase().includes(q) ||
        c.email_remitente.toLowerCase().includes(q) ||
        c.email_asunto.toLowerCase().includes(q)
      const matchEstado = !filtroEstado || c.estado === filtroEstado
      return matchSearch && matchEstado
    })
  }, [carpetas, search, filtroEstado])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">
          Liquidador &mdash; Gestión de Casos
        </h1>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total casos',  value: stats.total,       color: 'text-gray-900' },
            { label: 'Completadas',  value: stats.completadas, color: 'text-green-600' },
            { label: 'Procesando',   value: stats.procesando,  color: 'text-yellow-600' },
            { label: 'Con error',    value: stats.error,       color: 'text-red-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            placeholder="Buscar por caso, remitente o asunto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoCarpeta | '')}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los estados</option>
            <option value="RECIBIDA">Recibida</option>
            <option value="PROCESANDO">Procesando</option>
            <option value="COMPLETADA">Completada</option>
            <option value="ERROR">Error</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando casos...</div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-300 text-sm">
            No se encontraron casos.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Caso ID', 'Remitente', 'Asunto', 'Estado', 'Docs', 'Recibida', ''].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900">
                      {c.caso_id}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                      {c.email_remitente}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate">
                      {c.email_asunto}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge estado={c.estado} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-center">{c.total_documentos}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(c.recibida_en)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/carpetas/${c.id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-xs whitespace-nowrap"
                      >
                        Ver detalle →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
