const ACCESS_KEY = 'liquidador.access'
const REFRESH_KEY = 'liquidador.refresh'

export const AUTH_EVENT = 'liquidador-auth'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(REFRESH_KEY)
}

export function setTokens(access: string, refresh: string) {
  window.localStorage.setItem(ACCESS_KEY, access)
  window.localStorage.setItem(REFRESH_KEY, refresh)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function setAccessToken(access: string) {
  window.localStorage.setItem(ACCESS_KEY, access)
}

export function clearTokens() {
  window.localStorage.removeItem(ACCESS_KEY)
  window.localStorage.removeItem(REFRESH_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT))
}
