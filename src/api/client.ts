import type {
  BusquedaLegalResponse,
  Carpeta,
  CarpetaDetalle,
  DocumentoConCarpeta,
  FuentesCorpus,
  IndexarPdfResponse,
  ListParams,
  Page,
  ResultadoIA,
  SubirDocumentosResponse,
  UserProfile,
} from '../types'
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken, setTokens } from '../lib/tokens'

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) return false

  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
      .then(async (res) => {
        if (!res.ok) return false
        const data = (await res.json()) as { access: string }
        setAccessToken(data.access)
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  const access = getAccessToken()
  if (access) headers.set('Authorization', `Bearer ${access}`)
  return headers
}

// El backend devuelve errores como JSON de DRF ({"detail": "..."} o {"campo": ["..."]}).
// Los convertimos a una frase legible en lugar de mostrar el cuerpo crudo.
async function errorMessage(res: Response): Promise<string> {
  const generico = `Error ${res.status}${res.statusText ? ` (${res.statusText})` : ''}. Intenta nuevamente.`
  const text = await res.text().catch(() => '')
  if (!text) return generico
  try {
    const data = JSON.parse(text) as unknown
    const partes: string[] = []
    const recolectar = (v: unknown, campo?: string) => {
      if (typeof v === 'string') {
        const etiqueta = campo && campo !== 'detail' && campo !== 'non_field_errors' ? campo.replace(/_/g, ' ') : ''
        partes.push(etiqueta ? `${etiqueta}: ${v}` : v)
      } else if (Array.isArray(v)) v.forEach((x) => recolectar(x, campo))
      else if (v && typeof v === 'object')
        Object.entries(v as Record<string, unknown>).forEach(([k, x]) => recolectar(x, k))
    }
    recolectar(data)
    return partes.length ? partes.join(' ') : generico
  } catch {
    return text.trimStart().startsWith('<') || text.length > 300 ? generico : text
  }
}

async function request<T>(path: string, options?: RequestInit, _retried = false): Promise<T> {
  const res = await fetch(`/api${path}`, { ...options, headers: authHeaders(options?.headers) })

  if (res.status === 401 && !_retried && (await tryRefresh())) {
    return request<T>(path, options, true)
  }

  if (res.status === 401) {
    clearTokens()
  }

  if (!res.ok) {
    throw new Error(await errorMessage(res))
  }
  return res.json() as Promise<T>
}

async function requestUpload<T>(path: string, formData: FormData, _retried = false): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    body: formData,
    headers: authHeaders(),
  })

  if (res.status === 401 && !_retried && (await tryRefresh())) {
    return requestUpload<T>(path, formData, true)
  }

  if (res.status === 401) {
    clearTokens()
  }

  if (!res.ok) {
    throw new Error(await errorMessage(res))
  }
  return res.json() as Promise<T>
}

function withQuery(path: string, params: Record<string, string | number | undefined | null> = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  })
  const qs = q.toString()
  return qs ? `${path}${path.includes('?') ? '&' : '?'}${qs}` : path
}

function requestPage<T>(path: string, params?: ListParams) {
  return request<Page<T>>(withQuery(path, { ...params }))
}

async function authenticatedDownload(
  path: string,
  fallbackFilename: string,
  _retried = false,
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`/api${path}`, { headers: authHeaders() })

  if (res.status === 401 && !_retried && (await tryRefresh())) {
    return authenticatedDownload(path, fallbackFilename, true)
  }

  if (res.status === 401) {
    clearTokens()
  }

  if (!res.ok) {
    throw new Error(await errorMessage(res))
  }

  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = /filename="?([^"]+)"?/.exec(disposition)
  return { blob: await res.blob(), filename: match?.[1] ?? fallbackFilename }
}

export const api = {
  carpetasPage: (params?: ListParams) => requestPage<Carpeta>('/carpetas/', params),
  carpeta: (id: string) => request<CarpetaDetalle>(`/carpetas/${id}/`),
  dictamen: (id: string) => request<ResultadoIA>(`/carpetas/${id}/dictamen/`),
  reprocesar: (id: string) =>
    request<{ detail: string }>(`/carpetas/${id}/reprocesar/`, { method: 'POST' }),
  subirDocumentos: (id: string, archivos: File[]) => {
    const formData = new FormData()
    archivos.forEach((archivo) => formData.append('archivos', archivo))
    return requestUpload<SubirDocumentosResponse>(`/carpetas/${id}/documentos/`, formData)
  },
  preinforme: (id: string) =>
    authenticatedDownload(`/carpetas/${id}/preinforme/`, `preinforme-${id}.docx`),
  documentosPage: (params?: ListParams) => requestPage<DocumentoConCarpeta>('/documentos/', params),

  corpusBuscar: (q: string, municipio?: string, n = 6) => {
    const params = new URLSearchParams({ q, n: String(n) })
    if (municipio) params.set('municipio', municipio)
    return request<BusquedaLegalResponse>(`/corpus/buscar/?${params.toString()}`)
  },
  corpusFuentes: () => request<FuentesCorpus>('/corpus/fuentes/'),
  corpusEliminar: (fuente: string) =>
    request<{ chunks_eliminados: number }>(`/corpus/fuente/?fuente=${encodeURIComponent(fuente)}`, {
      method: 'DELETE',
    }),
  corpusIndexarPdf: (archivo: File, municipio: string) => {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('municipio', municipio)
    return requestUpload<IndexarPdfResponse>('/corpus/indexar-pdf/', formData)
  },

  authLogin: async (username: string, password: string) => {
    const res = await fetch('/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.detail ?? 'No se pudo iniciar sesión.')
    }
    const data = (await res.json()) as { access: string; refresh: string }
    setTokens(data.access, data.refresh)
  },
  me: () => request<UserProfile>('/auth/me/'),
  cambiarPassword: (passwordActual: string, passwordNueva: string) =>
    request<{ detail: string }>('/auth/cambiar-password/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password_actual: passwordActual, password_nueva: passwordNueva }),
    }),
  logout: () => clearTokens(),
}
