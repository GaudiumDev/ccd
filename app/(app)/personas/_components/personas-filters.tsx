"use client"

import { useRouter } from "next/navigation"
import { useRef } from "react"

type Ministerio = { id: string; nombre: string }
type Organizacion = { id: string; nombre: string; tipo: string }

const tipoLabel: Record<string, string> = {
  confraternidad: 'Confraternidad',
  fraternidad: 'Fraternidad',
}

type Props = {
  ministerios: Ministerio[]
  organizaciones: Organizacion[]
  defaults: {
    q: string
    estado: string
    estado_eclesial: string
    provincia: string
    modo: string
    ministerio_id: string
    organizacion_id: string
    tipo_persona: string
  }
}

const selectClass = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"

export default function PersonasFilters({ ministerios, organizaciones, defaults }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  function handleClear() {
    router.push("/personas")
  }

  const hasActiveFilters = Object.values(defaults).some((v) => v !== "")

  return (
    <form ref={formRef} method="GET" className="space-y-3">
      {/* Búsqueda — fila completa */}
      <div className="relative">
        <input
          name="q"
          defaultValue={defaults.q}
          placeholder="Buscar por nombre, apellido o email..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 pl-8 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Grid de filtros */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <select name="tipo_persona" defaultValue={defaults.tipo_persona} className={selectClass}>
          <option value="">Tipo de persona</option>
          <option value="interesado">Interesado</option>
          <option value="inscripto">Inscripto</option>
          <option value="convivente">Convivente</option>
          <option value="cecista">Cecista</option>
          <option value="otro">Otro</option>
        </select>

        <select name="estado" defaultValue={defaults.estado} className={selectClass}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

        <select name="modo" defaultValue={defaults.modo} className={selectClass}>
          <option value="">Modo de participación</option>
          <option value="colaborador">Colaborador</option>
          <option value="servidor">Servidor</option>
          <option value="asesor">Asesor</option>
          <option value="familiar">Familiar</option>
          <option value="orante">Orante</option>
          <option value="intercesor">Intercesor</option>
        </select>

        <select name="estado_eclesial" defaultValue={defaults.estado_eclesial} className={selectClass}>
          <option value="">Estado eclesiástico</option>
          <option value="laico">Laico</option>
          <option value="religioso">Religioso/a</option>
          <option value="diacono">Diácono</option>
          <option value="sacerdote">Sacerdote</option>
          <option value="obispo">Obispo</option>
          <option value="cardenal">Cardenal</option>
        </select>

        <input
          name="provincia"
          defaultValue={defaults.provincia}
          placeholder="Provincia..."
          className={selectClass}
        />

        {organizaciones.length > 0 && (
          <select name="organizacion_id" defaultValue={defaults.organizacion_id} className={selectClass}>
            <option value="">Confraternidad / Fraternidad</option>
            {organizaciones.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre} ({tipoLabel[o.tipo] ?? o.tipo})
              </option>
            ))}
          </select>
        )}

        {ministerios.length > 0 && (
          <select name="ministerio_id" defaultValue={defaults.ministerio_id} className={selectClass}>
            <option value="">Rol asignado</option>
            {ministerios.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Botones */}
      <div className="flex items-center justify-end gap-2">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Limpiar filtros
          </button>
        )}
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Filtrar
        </button>
      </div>
    </form>
  )
}
