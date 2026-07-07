import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/api/client'
import { useAuth } from '@/lib/auth'

export function ConfiguracionPage() {
  const { user } = useAuth()
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setExito(null)

    if (passwordNueva !== passwordConfirmar) {
      setError('La nueva contraseña y su confirmación no coinciden.')
      return
    }

    setSubmitting(true)
    try {
      await api.cambiarPassword(passwordActual, passwordNueva)
      setExito('Contraseña actualizada correctamente.')
      setPasswordActual('')
      setPasswordNueva('')
      setPasswordConfirmar('')
    } catch (err) {
      setError((err as Error).message || 'No se pudo actualizar la contraseña.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground">Tus datos y tu contraseña.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mi perfil</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={user?.nombre ?? ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="password-actual">Contraseña actual</Label>
              <Input
                id="password-actual"
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-nueva">Nueva contraseña</Label>
              <Input
                id="password-nueva"
                type="password"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-confirmar">Confirmar nueva contraseña</Label>
              <Input
                id="password-confirmar"
                type="password"
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300 sm:col-span-2">
                {error}
              </div>
            )}
            {exito && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300 sm:col-span-2">
                {exito}
              </div>
            )}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Guardar contraseña'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
