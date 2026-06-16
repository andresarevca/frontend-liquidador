import type { EstadoCarpeta } from '../types'

const config: Record<EstadoCarpeta, { bg: string; text: string; dot: string }> = {
  RECIBIDA:   { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400' },
  PROCESANDO: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  COMPLETADA: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-400' },
  ERROR:      { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-400' },
}

const labels: Record<EstadoCarpeta, string> = {
  RECIBIDA: 'Recibida',
  PROCESANDO: 'Procesando',
  COMPLETADA: 'Completada',
  ERROR: 'Error',
}

export function StatusBadge({ estado }: { estado: EstadoCarpeta }) {
  const c = config[estado] ?? { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {labels[estado] ?? estado}
    </span>
  )
}
