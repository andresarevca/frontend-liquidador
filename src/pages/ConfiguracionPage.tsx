import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

const usuariosMock = [
  { nombre: 'Elías Arévalo', email: 'elias@demo.com', rol: 'Admin' },
  { nombre: 'Andrés Carreras', email: 'andres@demo.com', rol: 'Liquidador' },
  { nombre: 'Carlo Almeida', email: 'carlo@demo.com', rol: 'Liquidador' },
]

export function ConfiguracionPage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios y configuración</h1>
        <p className="text-sm text-muted-foreground">Gestión de cuentas y preferencias.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mi perfil</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input defaultValue={user?.nombre ?? ''} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue={user?.email ?? ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Input defaultValue={user?.rol ?? ''} disabled />
          </div>
          <div className="flex items-end">
            <Button>Guardar cambios</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Usuarios del equipo</CardTitle>
            <Button size="sm" variant="outline">
              Invitar usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {['Nombre', 'Email', 'Rol', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {usuariosMock.map((u) => (
                <tr key={u.email} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{u.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.rol}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost">
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
