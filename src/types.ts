export type EstadoCarpeta = 'RECIBIDA' | 'PROCESANDO' | 'COMPLETADA' | 'ERROR'

export interface Carpeta {
  id: string
  caso_id: string
  email_remitente: string
  email_asunto: string
  estado: EstadoCarpeta
  recibida_en: string
  procesada_en: string | null
  total_documentos: number
}

export interface Documento {
  id: number
  nombre_archivo: string
  formato: string
  tipo_doc: string
  subido_en: string
}

export interface DocumentoConCarpeta extends Documento {
  caso_id: string
  caso_pk: string
}

export interface ResultadoIA {
  paso: 'A' | 'B' | 'C'
  paso_display: string
  resultado: Record<string, unknown>
  generado_en: string
}

export interface CarpetaDetalle {
  id: string
  caso_id: string
  email_remitente: string
  email_asunto: string
  estado: EstadoCarpeta
  recibida_en: string
  procesada_en: string | null
  mensaje_error: string
  documentos: Documento[]
  resultados: ResultadoIA[]
}

export interface UserProfile {
  email: string
  nombre: string
  rol: 'Admin' | 'Liquidador'
}
