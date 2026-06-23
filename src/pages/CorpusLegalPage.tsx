import { useEffect, useRef, useState } from 'react'

import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BusquedaLegalResult, FuentesCorpus } from '@/types'

export function CorpusLegalPage() {
  const [fuentes, setFuentes] = useState<FuentesCorpus | null>(null)
  const [fuentesError, setFuentesError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [municipioBusqueda, setMunicipioBusqueda] = useState('')
  const [resultados, setResultados] = useState<BusquedaLegalResult[]>([])
  const [buscando, setBuscando] = useState(false)
  const [busquedaError, setBusquedaError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [municipioSubida, setMunicipioSubida] = useState('Nacional')
  const [subiendo, setSubiendo] = useState(false)
  const [subidaError, setSubidaError] = useState<string | null>(null)
  const [subidaOk, setSubidaOk] = useState<string | null>(null)

  const cargarFuentes = () => {
    api
      .corpusFuentes()
      .then((data) => {
        setFuentes(data)
        setFuentesError(null)
      })
      .catch((e: Error) => setFuentesError(e.message))
  }

  useEffect(() => {
    cargarFuentes()
  }, [])

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length < 3) {
      setBusquedaError('Ingresá al menos 3 caracteres para buscar.')
      return
    }
    setBuscando(true)
    setBusquedaError(null)
    try {
      const data = await api.corpusBuscar(query.trim(), municipioBusqueda.trim() || undefined)
      setResultados(data.resultados)
    } catch (e) {
      setBusquedaError((e as Error).message)
    } finally {
      setBuscando(false)
    }
  }

  const handleSubirPdf = async (e: React.FormEvent) => {
    e.preventDefault()
    const archivo = fileInputRef.current?.files?.[0]
    if (!archivo) {
      setSubidaError('Seleccioná un archivo PDF.')
      return
    }
    setSubiendo(true)
    setSubidaError(null)
    setSubidaOk(null)
    try {
      const res = await api.corpusIndexarPdf(archivo, municipioSubida.trim() || 'Nacional')
      setSubidaOk(`"${res.titulo}" indexado: ${res.chunks_indexados} fragmento(s) (municipio: ${res.municipio}).`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      cargarFuentes()
    } catch (e) {
      setSubidaError((e as Error).message)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Corpus Legal</h1>
        <p className="text-sm text-muted-foreground">
          Búsqueda semántica de leyes y ordenanzas indexadas para el dictamen asistido por IA (RAG).
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
        {fuentesError ? (
          <span className="text-red-600 dark:text-red-400">{fuentesError}</span>
        ) : fuentes ? (
          <>
            <span>
              <strong className="text-foreground">{fuentes.total_chunks}</strong>{' '}
              <span className="text-muted-foreground">fragmentos indexados</span>
            </span>
            <span>
              <strong className="text-foreground">{fuentes.fuentes.length}</strong>{' '}
              <span className="text-muted-foreground">documentos legales</span>
            </span>
            <span>
              <strong className="text-foreground">{fuentes.total_casos_historicos}</strong>{' '}
              <span className="text-muted-foreground">casos históricos</span>
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Cargando estadísticas...</span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-4">
            <form onSubmit={handleBuscar} className="mb-4 flex flex-wrap gap-3">
              <Input
                placeholder="Ej: señal de PARE responsabilidad"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-[240px] flex-1"
              />
              <Input
                placeholder="Municipio (opcional)"
                value={municipioBusqueda}
                onChange={(e) => setMunicipioBusqueda(e.target.value)}
                className="w-48"
              />
              <Button type="submit" disabled={buscando}>
                {buscando ? 'Buscando...' : 'Buscar'}
              </Button>
            </form>

            {busquedaError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {busquedaError}
              </div>
            )}

            {resultados.length === 0 ? (
              <p className="px-1 py-8 text-center text-sm text-muted-foreground">
                {buscando ? 'Buscando...' : 'Sin resultados todavía. Realizá una búsqueda.'}
              </p>
            ) : (
              <ul className="space-y-3">
                {resultados.map((r, i) => (
                  <li key={i} className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {r.fuente} <span className="text-muted-foreground">· {r.municipio}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        sim. {(r.similitud * 100).toFixed(0)}%
                      </span>
                    </div>
                    {r.encabezado && (
                      <p className="mb-1 text-xs font-medium text-muted-foreground">{r.encabezado}</p>
                    )}
                    <p className="whitespace-pre-line text-sm text-foreground/90">{r.texto}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Indexar ordenanza (PDF)</h2>
            <form onSubmit={handleSubirPdf} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="pdf-file">Archivo PDF</Label>
                <Input id="pdf-file" type="file" accept="application/pdf" ref={fileInputRef} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pdf-municipio">Municipio</Label>
                <Input
                  id="pdf-municipio"
                  placeholder="Nacional"
                  value={municipioSubida}
                  onChange={(e) => setMunicipioSubida(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={subiendo} className="w-full">
                {subiendo ? 'Indexando...' : 'Indexar PDF'}
              </Button>
              {subidaError && <p className="text-sm text-red-600 dark:text-red-400">{subidaError}</p>}
              {subidaOk && <p className="text-sm text-emerald-600 dark:text-emerald-400">{subidaOk}</p>}
            </form>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Documentos indexados</h2>
            {fuentes && fuentes.fuentes.length > 0 ? (
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {fuentes.fuentes.map((f) => (
                  <li key={f} className="truncate">
                    • {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No hay documentos indexados todavía.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
