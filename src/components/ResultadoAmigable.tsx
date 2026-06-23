import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { ClasificacionItem, DictamenData, ExtraccionData } from '@/types'

// ----------------------------------------------------------------------------
// Utilidades de formato
// ----------------------------------------------------------------------------

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const TIPO_DOC_LABELS: Record<string, string> = {
  DENUNCIA_ADMINISTRATIVA: 'Denuncia administrativa',
  DENUNCIA_POLICIAL: 'Denuncia policial',
  CEDULA_VERDE: 'Cédula verde',
  PERICIA_TECNICA: 'Pericia técnica',
  POLIZA: 'Póliza',
  FOTO_EVENTO: 'Foto del evento',
  FOTO_DANIOS: 'Foto de daños',
  OTRO: 'Otro documento',
}

function tipoDocLabel(tipo: string): string {
  return TIPO_DOC_LABELS[tipo] ?? humanize(tipo)
}

function formatDateTimeSafe(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateSafe(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ----------------------------------------------------------------------------
// Átomos de UI
// ----------------------------------------------------------------------------

type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info'

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  )
}

function Stat({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value === null || value === undefined || value === '' ? '—' : value}</p>
    </div>
  )
}

function BarraConfianza({ value, label }: { value: number; label?: string }) {
  const pct = Math.round((value ?? 0) * 100)
  const tone = pct >= 85 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-muted">
          <div className={`h-1.5 rounded-full ${tone}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="w-10 text-right text-xs font-medium tabular-nums">{pct}%</span>
      </div>
    </div>
  )
}

function SectionTitle({ children, tone }: { children: React.ReactNode; tone?: 'danger' | 'warning' }) {
  const color =
    tone === 'danger'
      ? 'text-red-600 dark:text-red-400'
      : tone === 'warning'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-muted-foreground'
  return <h3 className={`mb-3 text-xs font-semibold uppercase tracking-wide ${color}`}>{children}</h3>
}

// ----------------------------------------------------------------------------
// Paso A — Clasificación
// ----------------------------------------------------------------------------

export function ClasificacionPanel({ resultado }: { resultado: unknown }) {
  const items = Array.isArray(resultado) ? (resultado as ClasificacionItem[]) : []

  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No hay datos de clasificación.</p>
  }

  const promedioConfianza = items.reduce((acc, i) => acc + (i.confianza ?? 0), 0) / items.length
  const noLegibles = items.filter((i) => i.legible === false).length
  const fueraDeCaso = items.filter((i) => i.pertenece_al_caso === false).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span>
          <strong className="text-foreground">{items.length}</strong>{' '}
          <span className="text-muted-foreground">documentos clasificados</span>
        </span>
        <span>
          <strong className="text-foreground">{Math.round(promedioConfianza * 100)}%</strong>{' '}
          <span className="text-muted-foreground">confianza promedio</span>
        </span>
        {noLegibles > 0 && <Badge tone="warning">{noLegibles} ilegible(s)</Badge>}
        {fueraDeCaso > 0 && <Badge tone="danger">{fueraDeCaso} fuera del caso</Badge>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <Card key={i} className="p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="truncate text-sm font-medium" title={item.archivo}>
                {item.archivo}
              </p>
              <Badge tone="info">{tipoDocLabel(item.tipo_doc)}</Badge>
            </div>
            {(item.legible === false || item.pertenece_al_caso === false) && (
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {item.legible === false && <Badge tone="warning">No legible</Badge>}
                {item.pertenece_al_caso === false && <Badge tone="danger">No pertenece al caso</Badge>}
              </div>
            )}
            <BarraConfianza value={item.confianza ?? 0} label="Confianza de clasificación" />
            {item.nota_clasificacion && (
              <p className="mt-2 text-xs italic text-muted-foreground">{item.nota_clasificacion}</p>
            )}
            {item.razon_pertenencia && (
              <p
                className="mt-2 line-clamp-2 text-xs text-muted-foreground"
                title={item.razon_pertenencia}
              >
                {item.razon_pertenencia}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Paso B — Extracción
// ----------------------------------------------------------------------------

export function ExtraccionPanel({ resultado }: { resultado: unknown }) {
  const data = (resultado ?? {}) as ExtraccionData
  const { siniestro, vehiculos, poliza, calidad_extraccion, conflictos } = data

  const sinDatos = !siniestro && !vehiculos?.length && !poliza && !calidad_extraccion
  if (sinDatos) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No hay datos de extracción.</p>
  }

  return (
    <div className="space-y-6">
      {siniestro && (
        <Card className="p-4">
          <SectionTitle>El siniestro</SectionTitle>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Stat label="Fecha y hora" value={formatDateTimeSafe(siniestro.fecha_hora)} />
            <Stat label="Municipio" value={siniestro.municipio} />
            <Stat label="Tipo de vía" value={siniestro.tipo_via ? humanize(siniestro.tipo_via) : null} />
            <Stat
              label="Clima"
              value={siniestro.condicion_climatica ? humanize(siniestro.condicion_climatica) : null}
            />
          </div>
          {siniestro.direccion_aproximada && (
            <p className="mt-3 text-xs text-muted-foreground">{siniestro.direccion_aproximada}</p>
          )}
          {siniestro.descripcion_dinamica && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {siniestro.descripcion_dinamica}
            </p>
          )}
        </Card>
      )}

      {vehiculos && vehiculos.length > 0 && (
        <div>
          <SectionTitle>Vehículos involucrados</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {vehiculos.map((v, i) => (
              <Card key={i} className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {[v.marca, v.modelo].filter(Boolean).join(' ') || 'Vehículo'}
                  </p>
                  <Badge tone={v.rol === 'ASEGURADO' ? 'info' : 'neutral'}>{humanize(v.rol)}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Año" value={v.año ?? undefined} />
                  <Stat label="Matrícula" value={v.matricula} />
                  <Stat label="Color" value={v.color} />
                  <Stat label="Conductor" value={v.conductor_nombre} />
                  <Stat label="CI conductor" value={v.conductor_ci} />
                  <Stat
                    label="Licencia"
                    value={v.licencia_numero ? `${v.licencia_numero} (${v.licencia_categoria ?? '—'})` : null}
                  />
                </div>
                {v.danios_descripcion && (
                  <p className="mt-3 text-xs leading-relaxed text-foreground/90">{v.danios_descripcion}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {poliza && (
        <Card className="p-4">
          <SectionTitle>Póliza</SectionTitle>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <Stat label="Aseguradora" value={poliza.aseguradora} />
            <Stat label="Número" value={poliza.numero} />
            <Stat label="Cobertura" value={poliza.cobertura_tipo ? humanize(poliza.cobertura_tipo) : null} />
            <Stat label="Vigencia desde" value={formatDateSafe(poliza.vigencia_desde)} />
            <Stat label="Vigencia hasta" value={formatDateSafe(poliza.vigencia_hasta)} />
            <Stat label="Franquicia" value={poliza.franquicia != null ? String(poliza.franquicia) : null} />
          </div>
        </Card>
      )}

      {conflictos && conflictos.length > 0 && (
        <div>
          <SectionTitle tone="warning">Datos a verificar ({conflictos.length})</SectionTitle>
          <div className="space-y-2">
            {conflictos.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950"
              >
                <p className="font-medium text-amber-800 dark:text-amber-300">{humanize(c.campo)}</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">{c.descripcion}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  "{c.valor_doc_1}" vs. "{c.valor_doc_2}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {calidad_extraccion && (
        <Card className="p-4">
          <SectionTitle>Calidad de la extracción</SectionTitle>
          <BarraConfianza value={calidad_extraccion.score} label="Confianza de la IA" />
          {calidad_extraccion.campos_faltantes_criticos?.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {calidad_extraccion.campos_faltantes_criticos.map((c, i) => (
                <li key={i}>{humanize(c)}</li>
              ))}
            </ul>
          )}
          {calidad_extraccion.observaciones && (
            <p className="mt-3 text-xs text-muted-foreground">{calidad_extraccion.observaciones}</p>
          )}
        </Card>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Paso C — Dictamen
// ----------------------------------------------------------------------------

const RESPONSABILIDAD_LABELS: Record<string, { label: string; tone: BadgeTone }> = {
  ASEGURADO_RESPONSABLE: { label: 'Asegurado responsable', tone: 'danger' },
  TERCERO_RESPONSABLE: { label: 'Tercero responsable', tone: 'success' },
  RESPONSABILIDAD_COMPARTIDA: { label: 'Responsabilidad compartida', tone: 'warning' },
  SIN_RESPONSABILIDAD: { label: 'Sin responsabilidad determinada', tone: 'neutral' },
}

function AnalisisNarrativo({ texto }: { texto: string }) {
  const [expandido, setExpandido] = useState(false)
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <SectionTitle>Análisis narrativo completo</SectionTitle>
        <Button variant="ghost" size="sm" onClick={() => setExpandido((v) => !v)}>
          {expandido ? 'Ver menos' : 'Ver más'}
        </Button>
      </div>
      <p
        className={`whitespace-pre-line text-sm leading-relaxed text-foreground/90 ${
          expandido ? '' : 'line-clamp-6'
        }`}
      >
        {texto}
      </p>
    </Card>
  )
}

export function DictamenPanel({ resultado }: { resultado: unknown }) {
  const root = (resultado ?? {}) as { dictamen?: DictamenData }
  const d = root.dictamen

  if (!d) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No hay datos de dictamen.</p>
  }

  const resp = RESPONSABILIDAD_LABELS[d.responsabilidad_sugerida] ?? {
    label: humanize(d.responsabilidad_sugerida || 'No determinado'),
    tone: 'neutral' as BadgeTone,
  }

  const coberturaInfo = (() => {
    if (typeof d.cobertura_aplica === 'boolean') {
      return d.cobertura_aplica
        ? { label: 'Aplica', tone: 'success' as BadgeTone }
        : { label: 'No aplica', tone: 'danger' as BadgeTone }
    }
    const v = (d.cobertura_aplica ?? '').toString().toLowerCase()
    if (v.startsWith('si') || v === 'true') return { label: 'Aplica', tone: 'success' as BadgeTone }
    if (v.startsWith('no') || v === 'false') return { label: 'No aplica', tone: 'danger' as BadgeTone }
    return { label: humanize(v || 'Condicional'), tone: 'warning' as BadgeTone }
  })()

  return (
    <div className="space-y-6">
      {d.dictamen_posible === false && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          El dictamen aún no es concluyente. Faltan datos para completarlo.
        </div>
      )}

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone={resp.tone}>{resp.label}</Badge>
          <Badge tone={coberturaInfo.tone}>Cobertura: {coberturaInfo.label}</Badge>
          <Badge tone={d.franquicia_aplica ? 'warning' : 'neutral'}>
            Franquicia {d.franquicia_aplica ? 'aplica' : 'no aplica'}
          </Badge>
        </div>

        {(d.porcentaje_responsabilidad_asegurado != null || d.porcentaje_responsabilidad_tercero != null) && (
          <div className="mb-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Responsabilidad</p>
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="bg-red-400"
                style={{ width: `${d.porcentaje_responsabilidad_asegurado ?? 0}%` }}
              />
              <div
                className="bg-emerald-400"
                style={{ width: `${d.porcentaje_responsabilidad_tercero ?? 0}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>Asegurado {d.porcentaje_responsabilidad_asegurado ?? 0}%</span>
              <span>Tercero {d.porcentaje_responsabilidad_tercero ?? 0}%</span>
            </div>
          </div>
        )}

        <BarraConfianza value={d.confianza_dictamen ?? 0} label="Confianza del dictamen" />

        {d.monto_sugerido_liquidar != null && (
          <p className="mt-3 text-sm">
            <span className="text-muted-foreground">Monto sugerido a liquidar: </span>
            <strong>{d.monto_sugerido_liquidar}</strong>
          </p>
        )}

        {d.razon_cobertura && (
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{d.razon_cobertura}</p>
        )}
      </Card>

      {d.infracciones_detectadas?.length > 0 && (
        <div>
          <SectionTitle>Infracciones detectadas</SectionTitle>
          <div className="space-y-2">
            {d.infracciones_detectadas.map((inf, i) => (
              <div key={i} className="rounded-lg border p-3 text-sm">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Badge tone="warning">{humanize(inf.infractor)}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {[inf.articulo_ley_5016, inf.articulo_ordenanza].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <p>{inf.descripcion_infraccion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.alertas_liquidador?.length > 0 && (
        <div>
          <SectionTitle tone="danger">Alertas para el liquidador</SectionTitle>
          <ul className="space-y-1.5 text-sm">
            {d.alertas_liquidador.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {d.datos_faltantes_para_dictamen?.length > 0 && (
        <div>
          <SectionTitle>Datos faltantes para el dictamen</SectionTitle>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {d.datos_faltantes_para_dictamen.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {d.analisis_narrativo && <AnalisisNarrativo texto={d.analisis_narrativo} />}
    </div>
  )
}
