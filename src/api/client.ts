import type { Carpeta, CarpetaDetalle, ResultadoIA } from '../types'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, options)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

async function requestList<T>(path: string): Promise<T[]> {
  const data = await request<T[] | { results: T[] }>(path)
  return Array.isArray(data) ? data : data.results
}

export const api = {
  carpetas: () => requestList<Carpeta>('/carpetas/'),
  carpeta: (id: string) => request<CarpetaDetalle>(`/carpetas/${id}/`),
  dictamen: (id: string) => request<ResultadoIA>(`/carpetas/${id}/dictamen/`),
  reprocesar: (id: string) =>
    request<{ detail: string }>(`/carpetas/${id}/reprocesar/`, { method: 'POST' }),
  preinformeUrl: (id: string) => `/api/carpetas/${id}/preinforme/`,
}
