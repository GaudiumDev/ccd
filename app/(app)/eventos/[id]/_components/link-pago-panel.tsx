'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LinkPagoPanel({
  eventoId,
  linkPagoActual,
}: {
  eventoId: string
  linkPagoActual: string | null
}) {
  const router = useRouter()
  const supabase = createClient()
  const [link, setLink] = useState(linkPagoActual ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGuardar() {
    const trimmed = link.trim()
    if (!trimmed) {
      setError('Ingresá un link válido.')
      return
    }
    try {
      new URL(trimmed)
    } catch {
      setError('El link no es una URL válida.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const { error: dbError } = await supabase
        .from('eventos')
        .update({ link_pago_mercadopago: trimmed })
        .eq('id', eventoId)
      if (dbError) throw dbError
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar el link.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEliminar() {
    setError(null)
    setLoading(true)
    try {
      const { error: dbError } = await supabase
        .from('eventos')
        .update({ link_pago_mercadopago: null })
        .eq('id', eventoId)
      if (dbError) throw dbError
      setLink('')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar el link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          Link de Pago (Preinscripción)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="link-pago">Link de Mercado Pago</Label>
          <Input
            id="link-pago"
            type="url"
            placeholder="https://mpago.la/..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Este link se mostrará a los participantes para realizar la preinscripción.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleGuardar}
            disabled={loading || !link.trim()}
            className="gap-1.5"
          >
            <Link2 className="h-3.5 w-3.5" />
            {loading ? 'Guardando…' : 'Guardar link'}
          </Button>
          {linkPagoActual && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEliminar}
              disabled={loading}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
