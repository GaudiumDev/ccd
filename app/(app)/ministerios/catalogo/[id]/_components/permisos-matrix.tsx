'use client'

import { useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Permisos que se muestran indentados bajo otro permiso (relación visual, no en DB)
const PERMISSION_CHILDREN: Record<string, string[]> = {
  'event.approve': ['event.approve_confra', 'event.approve_eqt'],
}
const ALL_CHILD_CLAVES = new Set(Object.values(PERMISSION_CHILDREN).flat())

interface Permiso {
  id: string
  clave: string
  nombre: string
  descripcion: string | null
  categoria: string
}

interface Props {
  ministerioId: string
  permisosPorCategoria: Record<string, Permiso[]>
  categoriaLabel: Record<string, string>
  permisosActivosIds: string[]
  totalPermisos: number
  isAdmin: boolean
  onNivelChange: (nivel: number) => void
}

export function PermisosMatrix({
  ministerioId,
  permisosPorCategoria,
  categoriaLabel,
  permisosActivosIds,
  totalPermisos,
  isAdmin,
  onNivelChange,
}: Props) {
  const supabase = createClient()
  const [activos, setActivos] = useState<Set<string>>(new Set(permisosActivosIds))
  const [cargando, setCargando] = useState<Set<string>>(new Set())
  const [errores, setErrores] = useState<Record<string, string>>({})

  const calcularNivel = (activosSet: Set<string>) => {
    if (totalPermisos === 0) return 0
    return Math.round((activosSet.size / totalPermisos) * 100)
  }

  const togglePermiso = async (permisoId: string, isChecked: boolean) => {
    // Actualización optimista
    const newActivos = new Set(activos)
    if (isChecked) newActivos.add(permisoId)
    else newActivos.delete(permisoId)

    setActivos(newActivos)
    setCargando(prev => new Set(prev).add(permisoId))
    setErrores(prev => { const e = { ...prev }; delete e[permisoId]; return e })

    const nuevoNivel = calcularNivel(newActivos)

    let error: any = null

    if (isChecked) {
      const res = await supabase
        .from('ministerio_permisos')
        .insert({ ministerio_id: ministerioId, permiso_id: permisoId })
      error = res.error
    } else {
      const res = await supabase
        .from('ministerio_permisos')
        .delete()
        .eq('ministerio_id', ministerioId)
        .eq('permiso_id', permisoId)
      error = res.error
    }

    if (error) {
      // Revertir estado optimista
      setActivos(activos)
      setErrores(prev => ({ ...prev, [permisoId]: 'Error al guardar. Intenta de nuevo.' }))
    } else if (!isAdmin) {
      await supabase
        .from('ministerios')
        .update({ nivel_acceso: nuevoNivel })
        .eq('id', ministerioId)
      onNivelChange(nuevoNivel)
    }

    setCargando(prev => {
      const next = new Set(prev)
      next.delete(permisoId)
      return next
    })
  }

  const toggleCategoria = useCallback(
    async (categoria: string) => {
      const permisos = permisosPorCategoria[categoria] ?? []
      const ids = permisos.map((p) => p.id)
      const allSelected = ids.every((id) => activos.has(id))

      const newActivos = new Set(activos)
      if (allSelected) {
        ids.forEach((id) => newActivos.delete(id))
      } else {
        ids.forEach((id) => newActivos.add(id))
      }
      setActivos(newActivos)

      const nuevoNivel = calcularNivel(newActivos)

      if (allSelected) {
        await supabase
          .from('ministerio_permisos')
          .delete()
          .eq('ministerio_id', ministerioId)
          .in('permiso_id', ids)
      } else {
        const toInsert = ids
          .filter((id) => !activos.has(id))
          .map((permiso_id) => ({ ministerio_id: ministerioId, permiso_id }))
        if (toInsert.length > 0) {
          await supabase.from('ministerio_permisos').insert(toInsert)
        }
      }

      if (!isAdmin) {
        await supabase
          .from('ministerios')
          .update({ nivel_acceso: nuevoNivel })
          .eq('id', ministerioId)
        onNivelChange(nuevoNivel)
      }
    },
    [permisosPorCategoria, activos, ministerioId, isAdmin],
  )

  const categorias = Object.keys(permisosPorCategoria)

  if (categorias.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No hay permisos definidos. Ejecuta la migración 005.
      </p>
    )
  }

  const renderPermiso = (permiso: Permiso, indented = false) => {
    const isActive = activos.has(permiso.id)
    const isLoading = cargando.has(permiso.id)
    const errorMsg = errores[permiso.id]
    const childClaves = PERMISSION_CHILDREN[permiso.clave]
    const children = childClaves
      ? childClaves
          .map(clave =>
            Object.values(permisosPorCategoria)
              .flat()
              .find((p: Permiso) => p.clave === clave)
          )
          .filter(Boolean) as Permiso[]
      : []

    return (
      <div key={permiso.id}>
        <div
          className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors ${indented ? 'border-border/50 bg-muted/30' : 'border-border'}`}
          onClick={() => !isLoading && togglePermiso(permiso.id, !isActive)}
        >
          <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <input
                type="checkbox"
                id={`perm-${permiso.id}`}
                checked={isActive}
                onChange={(e) => togglePermiso(permiso.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <label
              htmlFor={`perm-${permiso.id}`}
              className="text-sm font-medium text-foreground cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              {permiso.nombre}
            </label>
            {permiso.descripcion && (
              <p className="text-xs text-muted-foreground mt-0.5">{permiso.descripcion}</p>
            )}
            <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">{permiso.clave}</p>
            {errorMsg && (
              <p className="text-xs text-destructive mt-1">{errorMsg}</p>
            )}
          </div>
        </div>
        {children.length > 0 && (
          <div className="ml-6 mt-1 space-y-1 border-l-2 border-border/40 pl-3">
            {children.map(child => renderPermiso(child, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {categorias.map(categoria => {
        const ids = (permisosPorCategoria[categoria] ?? []).map((p) => p.id)
        const selectedCount = ids.filter((id) => activos.has(id)).length
        const allSelected = selectedCount === ids.length
        const someSelected = selectedCount > 0 && !allSelected

        return (
          <div key={categoria}>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id={`cat-${categoria}`}
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected
                }}
                onChange={() => toggleCategoria(categoria)}
                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              />
              <label
                htmlFor={`cat-${categoria}`}
                className="text-sm font-semibold text-foreground uppercase tracking-wide cursor-pointer"
              >
                {categoriaLabel[categoria] ?? categoria}
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 pl-6">
              {permisosPorCategoria[categoria]
                .filter((p: Permiso) => !ALL_CHILD_CLAVES.has(p.clave))
                .map((permiso: Permiso) => renderPermiso(permiso))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
