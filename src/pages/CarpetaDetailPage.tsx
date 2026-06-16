import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { StatusBadge } from '../components/StatusBadge'
import type { CarpetaDetalle, Documento, ResultadoIA } from '../types'

type Tab = 'documentos' | 'A' | 'B' | 'C'

// ----------------------------------------------------------------------------
// Documentación complementaria
// ----------------------------------------------------------------------------

const DOCS_ESPERADOS: Array<{ nombre: string; boolKey: string | null; countKey: string | null }> = [
  { nombre: 'Presupuesto de reparación de los vehículos afectados', boolKey: null, countKey: null },
  { nombre: 'Reclamo formal de los terceros afectados', boolKey: null, countKey: null },
  { nombre: 'Acta de procedimiento policial y resultado de alchotest', boolKey: 'denuncia_policial_presente', countKey: null },
  { nombre: 'Copia de la carpeta fiscal actualizada', boolKey: null, countKey: null },
  { nombre: 'Copia de la cédula verde y habilitación del vehículo asegurado', boolKey: 'cedula_verde_presente', countKey: null },
  { nombre: 'Copia del registro y cédula de identidad del conductor asegurado', boolKey: 'licencia_conductor_presente', countKey: null },
  { nombre: 'Informe del sistema de rastreo satelital (GPS)', boolKey: null, countKey: null },
  { nombre: 'Certificado y acta de defunción de las personas fallecidas', boolKey: null, countKey: null },
  { nombre: 'Informe pericial accidentológico', boolKey: 'pericia_tecnica_presente', countKey: null },
  { nombre: 'Fotos del evento/daños', boolKey: null, countKey: 'fotos_evento_cantidad' },
]

type DocEstado = 'ENTREGADO' | 'NO ENTREGADO'

function computeDocumentacion(
  pasoB: ResultadoIA,
  documentos: Documento[],
): Array<{ nombre: string; estado: DocEstado }> {
  const doc = ((pasoB.resultado as Record<string, unknown>).documentacion ?? {}) as Record<string, unknown>
  const nombresEntregados = documentos.map((d) => d.nombre_archivo.toLowerCase())

  return DOCS_ESPERADOS.map(({ nombre, boolKey, countKey }) => {
    let estado: DocEstado
    if (boolKey !== null && doc[boolKey] === true) {
      estado = 'ENTREGADO'
    } else if (boolKey !== null && doc[boolKey] === false) {
      estado = 'NO ENTREGADO'
    } else if (countKey !== null && typeof doc[countKey] === 'number' && (doc[countKey] as number) > 0) {
      estado = 'ENTREGADO'
    } else if (nombresEntregados.some((n) => n.includes(nombre.toLowerCase().split(' ')[0]))) {
      estado = 'ENTREGADO'
    } else {
      estado = 'NO ENTREGADO'
    }
    return { nombre, estado }
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ResultadoPanel({ resultado }: { resultado: ResultadoIA }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{resultado.paso_display}</span>
        <span>Generado: {formatDateTime(resultado.generado_en)}</span>
      </div>
      <div className="bg-gray-900 rounded-lg p-5 overflow-auto max-h-[560px]">
        <pre className="text-green-300 text-xs leading-relaxed whitespace-pre-wrap">
          {JSON.stringify(resultado.resultado, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export function CarpetaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [carpeta, setCarpeta] = useState<CarpetaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('documentos')
  const [reprocesando, setReprocesando] = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    api
      .carpeta(id)
      .then(setCarpeta)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleReprocesar = async () => {
    if (!id) return
    setReprocesando(true)
    setFeedback(null)
    try {
      const res = await api.reprocesar(id)
      setFeedback({ msg: res.detail, ok: true })
      setTimeout(() => {
        setFeedback(null)
        load()
      }, 2500)
    } catch (e: unknown) {
      setFeedback({ msg: (e as Error).message, ok: false })
    } finally {
      setReprocesando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Cargando...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 text-red-700 rounded-lg p-6 text-sm max-w-md">{error}</div>
      </div>
    )
  }

  if (!carpeta) return null

  const resultadoByPaso = Object.fromEntries(
    carpeta.resultados.map((r) => [r.paso, r]),
  ) as Partial<Record<'A' | 'B' | 'C', ResultadoIA>>

  const tabs: { id: Tab; label: string; disabled: boolean }[] = [
    { id: 'documentos', label: `Documentos (${carpeta.documentos.length})`, disabled: false },
    { id: 'A', label: 'Clasificación', disabled: !resultadoByPaso['A'] },
    { id: 'B', label: 'Extracción',    disabled: !resultadoByPaso['B'] },
    { id: 'C', label: 'Dictamen',      disabled: !resultadoByPaso['C'] },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 text-sm">
        <Link to="/" className="text-gray-400 hover:text-gray-600">
          ← Casos
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-mono text-gray-700 text-xs">{carpeta.caso_id}</span>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-gray-900 font-mono">{carpeta.caso_id}</h2>
              <StatusBadge estado={carpeta.estado} />
            </div>
            <p className="text-sm text-gray-500">{carpeta.email_asunto}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleReprocesar}
              disabled={reprocesando}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition cursor-pointer"
            >
              {reprocesando ? 'Relanzando...' : 'Reprocesar pipeline'}
            </button>
            <a
              href={api.preinformeUrl(carpeta.id)}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              Descargar preinforme
            </a>
          </div>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              feedback.ok
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {/* Error del pipeline */}
        {carpeta.estado === 'ERROR' && carpeta.mensaje_error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">
              Error del pipeline
            </p>
            <pre className="text-sm text-red-700 font-mono whitespace-pre-wrap">
              {carpeta.mensaje_error}
            </pre>
          </div>
        )}

        {/* Info card */}
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Remitente</p>
            <p className="text-gray-700 truncate" title={carpeta.email_remitente}>
              {carpeta.email_remitente}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Recibida</p>
            <p className="text-gray-700">{formatDateTime(carpeta.recibida_en)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Procesada</p>
            <p className="text-gray-700">
              {carpeta.procesada_en ? formatDateTime(carpeta.procesada_en) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Documentos</p>
            <p className="text-gray-700">{carpeta.documentos.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              disabled={t.disabled}
              onClick={() => !t.disabled && setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-indigo-500 text-indigo-600'
                  : t.disabled
                  ? 'border-transparent text-gray-300 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 cursor-pointer'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Documentos */}
        {tab === 'documentos' && (
          <div className="space-y-6">
            {/* Archivos recibidos */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Archivos recibidos
              </h3>
              {carpeta.documentos.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-10">No hay documentos.</p>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Archivo', 'Tipo de documento', 'Formato', 'Subido'].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {carpeta.documentos.map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{d.nombre_archivo}</td>
                          <td className="px-4 py-3 text-gray-600">{d.tipo_doc || '—'}</td>
                          <td className="px-4 py-3 text-gray-400 uppercase text-xs">{d.formato}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {formatDateTime(d.subido_en)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Documentación complementaria */}
            {resultadoByPaso['B'] && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Documentación complementaria
                </h3>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Documento esperado
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-36">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {computeDocumentacion(resultadoByPaso['B']!, carpeta.documentos).map((item) => (
                        <tr key={item.nombre} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700">{item.nombre}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                item.estado === 'ENTREGADO'
                                  ? 'text-green-700'
                                  : 'text-red-600'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.estado === 'ENTREGADO' ? 'bg-green-500' : 'bg-red-400'
                                }`}
                              />
                              {item.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs: IA results */}
        {(tab === 'A' || tab === 'B' || tab === 'C') &&
          (resultadoByPaso[tab] ? (
            <ResultadoPanel resultado={resultadoByPaso[tab]!} />
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">Resultado no disponible.</p>
          ))}
      </main>
    </div>
  )
}
