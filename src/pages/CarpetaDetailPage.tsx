import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Upload } from 'lucide-react'

import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/StatusBadge'
import { ClasificacionPanel, DictamenPanel, ExtraccionPanel } from '@/components/ResultadoAmigable'
import type { CarpetaDetalle, Documento, ResultadoIA } from '@/types'

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

function computeDocumentacion(pasoB: ResultadoIA, documentos: Documento[]) {
  const doc = ((pasoB.resultado as Record<string, unknown>).documentacion ?? {}) as Record<
    string,
    unknown
  >
  const nombres = documentos.map((d) => d.nombre_archivo.toLowerCase())
  return DOCS_ESPERADOS.map(({ nombre, boolKey, countKey }) => {
    let entregado = false
    if (boolKey && doc[boolKey] === true) entregado = true
    else if (boolKey && doc[boolKey] === false) entregado = false
    else if (countKey && typeof doc[countKey] === 'number' && (doc[countKey] as number) > 0)
      entregado = true
    else if (nombres.some((n) => n.includes(nombre.toLowerCase().split(' ')[0]))) entregado = true
    return { nombre, entregado }
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
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{resultado.paso_display}</span>
        <span>Generado: {formatDateTime(resultado.generado_en)}</span>
      </div>
      <div className="max-h-[560px] overflow-auto rounded-lg bg-muted p-5">
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
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
  const [reprocesando, setReprocesando] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [verJson, setVerJson] = useState<Partial<Record<'A' | 'B' | 'C', boolean>>>({})

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

  const handleSubirDocumentos = async () => {
    if (archivosSeleccionados.length === 0 || !id) return

    setSubiendo(true)
    setFeedback(null)
    try {
      const res = await api.subirDocumentos(id, archivosSeleccionados)
      setArchivosSeleccionados([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      const subidos = `${res.documentos.length} documento(s) subido(s) correctamente.`
      const rechazo = res.rechazados.length
        ? ` Ignorados por formato no soportado: ${res.rechazados.join(', ')}.`
        : ''
      setFeedback({ msg: `${subidos}${rechazo} Podés reprocesar el pipeline para incluirlos.`, ok: true })
      load()
    } catch (e: unknown) {
      setFeedback({ msg: (e as Error).message, ok: false })
    } finally {
      setSubiendo(false)
    }
  }

  const handleDescargarPreinforme = async () => {
    if (!id) return
    setDescargando(true)
    setFeedback(null)
    try {
      const { blob, filename } = await api.preinforme(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: unknown) {
      setFeedback({ msg: (e as Error).message, ok: false })
    } finally {
      setDescargando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Cargando...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      </div>
    )
  }

  if (!carpeta) return null

  const by = Object.fromEntries(carpeta.resultados.map((r) => [r.paso, r])) as Partial<
    Record<'A' | 'B' | 'C', ResultadoIA>
  >

  const pendientesReproceso = carpeta.procesada_en
    ? carpeta.documentos.filter((d) => new Date(d.subido_en) > new Date(carpeta.procesada_en!)).length
    : 0

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link to="/casos" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Casos
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-mono text-xs">{carpeta.caso_id}</span>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold">{carpeta.caso_id}</h1>
            <StatusBadge estado={carpeta.estado} />
          </div>
          <p className="text-sm text-muted-foreground">{carpeta.email_asunto}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex gap-2">
            <Button
              variant={pendientesReproceso > 0 ? 'default' : 'outline'}
              onClick={handleReprocesar}
              disabled={reprocesando}
              className={pendientesReproceso > 0 ? 'relative' : undefined}
            >
              {pendientesReproceso > 0 && (
                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative h-3 w-3 rounded-full bg-amber-500" />
                </span>
              )}
              {reprocesando ? 'Relanzando...' : 'Reprocesar pipeline'}
            </Button>
            <Button onClick={handleDescargarPreinforme} disabled={descargando}>
              {descargando ? 'Descargando...' : 'Descargar preinforme'}
            </Button>
          </div>
          {pendientesReproceso > 0 && (
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {pendientesReproceso} documento{pendientesReproceso > 1 ? 's' : ''} nuevo
              {pendientesReproceso > 1 ? 's' : ''} sin procesar
            </p>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            feedback.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {carpeta.estado === 'ERROR' && carpeta.mensaje_error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-500 dark:text-red-300">
            Error del pipeline
          </p>
          <pre className="whitespace-pre-wrap font-mono text-sm text-red-700 dark:text-red-300">
            {carpeta.mensaje_error}
          </pre>
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="grid grid-cols-2 gap-4 p-5 text-sm sm:grid-cols-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Remitente</p>
            <p className="truncate" title={carpeta.email_remitente}>
              {carpeta.email_remitente}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Recibida</p>
            <p>{formatDateTime(carpeta.recibida_en)}</p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Procesada</p>
            <p>{carpeta.procesada_en ? formatDateTime(carpeta.procesada_en) : '—'}</p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Documentos</p>
            <p>{carpeta.documentos.length}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="documentos">
        <TabsList>
          <TabsTrigger value="documentos">Documentos ({carpeta.documentos.length})</TabsTrigger>
          <TabsTrigger value="A" disabled={!by.A}>
            Clasificación
          </TabsTrigger>
          <TabsTrigger value="B" disabled={!by.B}>
            Extracción
          </TabsTrigger>
          <TabsTrigger value="C" disabled={!by.C}>
            Dictamen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documentos" className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Archivos recibidos
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png,.docx,.odt,.odf,.txt"
                  className="hidden"
                  onChange={(e) => setArchivosSeleccionados(Array.from(e.target.files ?? []))}
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Elegir archivos
                </Button>
                {archivosSeleccionados.length > 0 && (
                  <span
                    className="max-w-[180px] truncate text-xs text-muted-foreground"
                    title={archivosSeleccionados.map((f) => f.name).join(', ')}
                  >
                    {archivosSeleccionados.length === 1
                      ? archivosSeleccionados[0].name
                      : `${archivosSeleccionados.length} archivos seleccionados`}
                  </span>
                )}
                <Button
                  size="sm"
                  onClick={handleSubirDocumentos}
                  disabled={subiendo || archivosSeleccionados.length === 0}
                >
                  <Upload className="h-4 w-4" />
                  {subiendo ? 'Subiendo...' : 'Subir documentos faltantes'}
                </Button>
              </div>
            </div>
            {carpeta.documentos.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No hay documentos.</p>
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      {['Archivo', 'Tipo de documento', 'Formato', 'Subido'].map((h) => (
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
                    {carpeta.documentos.map((d) => (
                      <tr key={d.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{d.nombre_archivo}</td>
                        <td className="px-4 py-3 text-muted-foreground">{d.tipo_doc || '—'}</td>
                        <td className="px-4 py-3 text-xs uppercase text-muted-foreground">
                          {d.formato}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDateTime(d.subido_en)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>

          {by.B && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Documentación complementaria
              </h3>
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Documento esperado
                      </th>
                      <th className="w-40 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {computeDocumentacion(by.B!, carpeta.documentos).map((item) => (
                      <tr key={item.nombre} className="hover:bg-muted/30">
                        <td className="px-4 py-3">{item.nombre}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              item.entregado
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                item.entregado
                                  ? 'bg-emerald-500 dark:bg-emerald-400'
                                  : 'bg-red-400 dark:bg-red-500'
                              }`}
                            />
                            {item.entregado ? 'ENTREGADO' : 'NO ENTREGADO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}
        </TabsContent>

        {(['A', 'B', 'C'] as const).map((p) => (
          <TabsContent key={p} value={p}>
            {by[p] ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVerJson((prev) => ({ ...prev, [p]: !prev[p] }))}
                  >
                    {verJson[p] ? 'Ver resumen' : 'Ver JSON técnico'}
                  </Button>
                </div>
                {verJson[p] ? (
                  <ResultadoPanel resultado={by[p]!} />
                ) : p === 'A' ? (
                  <ClasificacionPanel resultado={by[p]!.resultado} />
                ) : p === 'B' ? (
                  <ExtraccionPanel resultado={by[p]!.resultado} />
                ) : (
                  <DictamenPanel resultado={by[p]!.resultado} />
                )}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Resultado no disponible.
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
