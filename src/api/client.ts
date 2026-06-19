import type { Carpeta, CarpetaDetalle, DocumentoConCarpeta, ResultadoIA, UserProfile } from '../types'
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

async function request<T>(path: string, options?: RequestInit, _retried = false): Promise<T> {
  const res = await fetch(`/api${path}`, { ...options, headers: authHeaders(options?.headers) })

  if (res.status === 401 && !_retried && (await tryRefresh())) {
    return request<T>(path, options, true)
  }

  if (res.status === 401) {
    clearTokens()
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

async function requestList<T>(path: string): Promise<T[]> {
  const data = await request<T[] | { results: T[]; next: string | null }>(path)
  if (Array.isArray(data)) return data

  const results = [...data.results]
  let next = data.next
  while (next) {
    const page = await request<{ results: T[]; next: string | null }>(next.replace(/^.*\/api/, ''))
    results.push(...page.results)
    next = page.next
  }
  return results
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
    const text = await res.text().catch(() => '')
    throw new Error(text || `${res.status} ${res.statusText}`)
  }

  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = /filename="?([^"]+)"?/.exec(disposition)
  return { blob: await res.blob(), filename: match?.[1] ?? fallbackFilename }
}

export const api = {
  carpetas: () => requestList<Carpeta>('/carpetas/'),
  carpeta: (id: string) => request<CarpetaDetalle>(`/carpetas/${id}/`),
  dictamen: (id: string) => request<ResultadoIA>(`/carpetas/${id}/dictamen/`),
  reprocesar: (id: string) =>
    request<{ detail: string }>(`/carpetas/${id}/reprocesar/`, { method: 'POST' }),
  preinforme: (id: string) =>
    authenticatedDownload(`/carpetas/${id}/preinforme/`, `preinforme-${id}.docx`),
  documentos: () => requestList<DocumentoConCarpeta>('/documentos/'),

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
  logout: () => clearTokens(),
}
