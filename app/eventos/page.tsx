'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Plus, Search, Edit2, Trash2, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const estadoColores: Record<string, string> = {
  borrador: 'bg-gray-500/20 text-gray-700 dark:text-gray-300',
  publicado: 'bg-green-500/20 text-green-700 dark:text-green-300',
  en_progreso: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  finalizado: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  cancelado: 'bg-red-500/20 text-red-700 dark:text-red-300',
}

export default function EventosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const eventos: any[] = []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-8 w-8 text-primary" />
          Gestión de Eventos
        </h1>
        <p className="mt-2 text-muted-foreground">
          Crea y administra eventos espirituales
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Eventos Registrados</CardTitle>
            <CardDescription>Lista completa de eventos en el sistema</CardDescription>
          </div>
          <Link href="/eventos/nuevo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Evento
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre del evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {eventos.length > 0 ? (
            <div className="space-y-3">
              {eventos.map((evento: any) => (
                <div
                  key={evento.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-foreground">{evento.nombre}</h3>
                      <Badge className={estadoColores[evento.estado] || estadoColores.borrador}>
                        {evento.estado.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{evento.descripcion}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Tipo: {evento.tipo}</span>
                      <span>Ubicación: {evento.ubicacion}</span>
                      <span>Capacidad: {evento.capacidad}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/eventos/${evento.id}`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/eventos/${evento.id}/editar`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No hay eventos registrados</h3>
              <p className="mt-2 text-muted-foreground">Comienza agregando el primer evento al sistema</p>
              <Link href="/eventos/nuevo" className="mt-4 inline-block">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Evento
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
