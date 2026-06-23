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
  resultado: unknown
  generado_en: string
}

export interface ClasificacionItem {
  archivo: string
  tipo_doc: string
  legible: boolean
  confianza: number
  nota_clasificacion: string | null
  pertenece_al_caso: boolean
  razon_pertenencia: string
}

export interface ExtraccionVehiculo {
  rol: string
  marca: string | null
  modelo: string | null
  año: number | null
  matricula: string | null
  color: string | null
  conductor_nombre: string | null
  conductor_ci: string | null
  licencia_numero: string | null
  licencia_categoria: string | null
  danios_descripcion: string | null
}

export interface ExtraccionSiniestro {
  fecha_hora: string | null
  municipio: string | null
  direccion_aproximada: string | null
  tipo_via: string | null
  condicion_climatica: string | null
  descripcion_dinamica: string | null
}

export interface ExtraccionPoliza {
  numero: string | null
  aseguradora: string | null
  vigencia_desde: string | null
  vigencia_hasta: string | null
  cobertura_tipo: string | null
  suma_asegurada: number | null
  franquicia: number | null
}

export interface ExtraccionConflicto {
  campo: string
  valor_doc_1: string
  valor_doc_2: string
  descripcion: string
}

export interface ExtraccionCalidad {
  score: number
  campos_faltantes_criticos: string[]
  observaciones: string
}

export interface ExtraccionData {
  siniestro?: ExtraccionSiniestro
  vehiculos?: ExtraccionVehiculo[]
  poliza?: ExtraccionPoliza
  monto_danios?: { estimacion_pericia: number | null; moneda_original: string | null }
  conflictos?: ExtraccionConflicto[]
  calidad_extraccion?: ExtraccionCalidad
}

export interface DictamenInfraccion {
  infractor: string
  descripcion_infraccion: string
  articulo_ley_5016: string | null
  articulo_ordenanza: string | null
}

export interface DictamenData {
  dictamen_posible: boolean
  datos_faltantes_para_dictamen: string[]
  responsabilidad_sugerida: string
  porcentaje_responsabilidad_asegurado: number | null
  porcentaje_responsabilidad_tercero: number | null
  cobertura_aplica: string | boolean
  razon_cobertura: string
  franquicia_aplica: boolean
  monto_sugerido_liquidar: number | string | null
  infracciones_detectadas: DictamenInfraccion[]
  analisis_narrativo: string
  alertas_liquidador: string[]
  confianza_dictamen: number
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

export interface BusquedaLegalResult {
  fuente: string
  municipio: string
  encabezado: string
  texto: string
  similitud: number
}

export interface BusquedaLegalResponse {
  consulta: string
  resultados: BusquedaLegalResult[]
  total: number
}

export interface FuentesCorpus {
  fuentes: string[]
  total_chunks: number
  total_casos_historicos: number
}

export interface IndexarPdfResponse {
  titulo: string
  chunks_indexados: number
  municipio: string
}

export interface SubirDocumentosResponse {
  documentos: Documento[]
  rechazados: string[]
}
