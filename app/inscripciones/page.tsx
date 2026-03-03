'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Search, Check, X } from 'lucide-react'

const estadoColores: Record<string, string> = {
  pendiente: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  confirmada: 'bg-green-500/20 text-green-700 dark:text-green-300',
  cancelada: 'bg-red-500/20 text-red-700 dark:text-red-300',
  completada: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
}

export default function InscripcionesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('todos')
  const inscripciones: any[] = []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Gestión de Inscripciones
        </h1>
        <p className="mt-2 text-muted-foreground">
          Administra las inscripciones a eventos
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Inscripciones</CardTitle>
            <CardDescription>Todas las inscripciones a eventos en el sistema</CardDescription>
          </div>
          <Link href="/inscripciones/nueva">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Inscripción
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o evento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-foreground"
            >
              <option value="todos">Todos los Estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmada">Confirmadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          {inscripciones.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Persona</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Evento</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Fecha Inscripción</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inscripciones.map((insc: any) => (
                    <tr key={insc.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-foreground">{insc.persona}</td>
                      <td className="py-3 px-4 text-foreground">{insc.evento}</td>
                      <td className="py-3 px-4 text-muted-foreground">{insc.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(insc.fechaInscripcion).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <Badge className={estadoColores[insc.estado] || estadoColores.pendiente}>
                          {insc.estado.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {insc.estado === 'pendiente' && (
                            <>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No hay inscripciones</h3>
              <p className="mt-2 text-muted-foreground">Aún no hay personas inscritas a eventos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
