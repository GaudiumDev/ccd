"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"

// Short list of most common countries; Argentina first
const PAISES: ComboboxOption[] = [
  { label: "Argentina", value: "Argentina" },
  { label: "Bolivia", value: "Bolivia" },
  { label: "Brasil", value: "Brasil" },
  { label: "Chile", value: "Chile" },
  { label: "Colombia", value: "Colombia" },
  { label: "Ecuador", value: "Ecuador" },
  { label: "España", value: "España" },
  { label: "México", value: "México" },
  { label: "Paraguay", value: "Paraguay" },
  { label: "Perú", value: "Perú" },
  { label: "Uruguay", value: "Uruguay" },
  { label: "Venezuela", value: "Venezuela" },
]

interface GeorefProvincia {
  id: string
  nombre: string
}

interface GeorefLocalidad {
  id: string
  nombre: string
}

interface LocationFieldsProps {
  pais: string
  provincia: string
  localidad: string
  codigoPostal?: string
  diocesis?: string
  onPaisChange: (val: string) => void
  onProvinciaChange: (val: string) => void
  onLocalidadChange: (val: string) => void
  onCodigoPostalChange?: (val: string) => void
  onDiocesisChange?: (val: string) => void
  disabled?: boolean
}

const GEOREF_BASE = "https://apis.datos.gob.ar/georef/api"

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function LocationFields({
  pais,
  provincia,
  localidad,
  codigoPostal,
  diocesis,
  onPaisChange,
  onProvinciaChange,
  onLocalidadChange,
  onCodigoPostalChange,
  onDiocesisChange,
  disabled,
}: LocationFieldsProps) {
  const isArgentina = pais === "Argentina"

  // Province typeahead state
  const [provinciaQuery, setProvinciaQuery] = React.useState("")
  const [provincias, setProvincias] = React.useState<ComboboxOption[]>([])
  const [provinciasLoading, setProvinciasLoading] = React.useState(false)
  const debouncedProvinciaQuery = useDebounce(provinciaQuery, 300)

  // Localidad typeahead state
  const [localidadQuery, setLocalidadQuery] = React.useState("")
  const [localidades, setLocalidades] = React.useState<ComboboxOption[]>([])
  const [localidadesLoading, setLocalidadesLoading] = React.useState(false)
  const debouncedLocalidadQuery = useDebounce(localidadQuery, 300)

  // Fetch provinces when Argentina and query changes
  React.useEffect(() => {
    if (!isArgentina) return
    setProvinciasLoading(true)
    const params = new URLSearchParams({ max: "10", campos: "id,nombre" })
    if (debouncedProvinciaQuery) params.set("nombre", debouncedProvinciaQuery)
    fetch(`${GEOREF_BASE}/provincias?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const opts: ComboboxOption[] = (data.provincias ?? []).map((p: GeorefProvincia) => ({
          label: p.nombre,
          value: p.nombre,
        }))
        setProvincias(opts)
      })
      .catch(() => setProvincias([]))
      .finally(() => setProvinciasLoading(false))
  }, [isArgentina, debouncedProvinciaQuery])

  // Fetch localidades when Argentina, province selected, and query changes
  React.useEffect(() => {
    if (!isArgentina || !provincia) {
      setLocalidades([])
      return
    }
    setLocalidadesLoading(true)
    const params = new URLSearchParams({ provincia, max: "10", campos: "id,nombre" })
    if (debouncedLocalidadQuery) params.set("nombre", debouncedLocalidadQuery)
    fetch(`${GEOREF_BASE}/localidades?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const opts: ComboboxOption[] = (data.localidades ?? []).map((l: GeorefLocalidad) => ({
          label: l.nombre,
          value: l.nombre,
        }))
        setLocalidades(opts)
      })
      .catch(() => setLocalidades([]))
      .finally(() => setLocalidadesLoading(false))
  }, [isArgentina, provincia, debouncedLocalidadQuery])

  function handlePaisChange(val: string) {
    onPaisChange(val)
    // Reset downstream fields when country changes
    onProvinciaChange("")
    onLocalidadChange("")
    setProvinciaQuery("")
    setLocalidadQuery("")
  }

  function handleProvinciaChange(val: string) {
    onProvinciaChange(val)
    onLocalidadChange("")
    setLocalidadQuery("")
  }

  return (
    <div className="space-y-4">
      {/* País */}
      <div className="space-y-2">
        <Label>País</Label>
        <Combobox
          value={pais}
          onSelect={handlePaisChange}
          options={PAISES}
          placeholder="Seleccionar país..."
          searchPlaceholder="Buscar país..."
          emptyText="País no encontrado."
          disabled={disabled}
        />
      </div>

      {/* Provincia */}
      <div className="space-y-2">
        <Label>Provincia</Label>
        {isArgentina ? (
          <Combobox
            value={provincia}
            onSelect={handleProvinciaChange}
            options={provincias}
            placeholder="Buscar provincia..."
            searchPlaceholder="Escribir para buscar..."
            emptyText="No se encontró la provincia."
            onSearch={setProvinciaQuery}
            loading={provinciasLoading}
            disabled={disabled}
          />
        ) : (
          <Input
            placeholder="Provincia / Estado"
            value={provincia}
            onChange={(e) => onProvinciaChange(e.target.value)}
            disabled={disabled}
          />
        )}
      </div>

      {/* Ciudad + CP */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Ciudad</Label>
          {isArgentina ? (
            <Combobox
              value={localidad}
              onSelect={onLocalidadChange}
              options={localidades}
              placeholder={provincia ? "Buscar ciudad..." : "Seleccionar provincia primero"}
              searchPlaceholder="Escribir para buscar..."
              emptyText="No se encontró la ciudad."
              onSearch={setLocalidadQuery}
              loading={localidadesLoading}
              disabled={disabled || !provincia}
            />
          ) : (
            <Input
              placeholder="Ciudad"
              value={localidad}
              onChange={(e) => onLocalidadChange(e.target.value)}
              disabled={disabled}
            />
          )}
        </div>
        {onCodigoPostalChange !== undefined && (
          <div className="space-y-2">
            <Label htmlFor="codigo_postal">CP</Label>
            <Input
              id="codigo_postal"
              name="codigo_postal"
              placeholder="3400"
              value={codigoPostal ?? ""}
              onChange={(e) => onCodigoPostalChange(e.target.value)}
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {/* Diócesis */}
      {onDiocesisChange !== undefined && (
        <div className="space-y-2">
          <Label htmlFor="diocesis">Diócesis</Label>
          <Input
            id="diocesis"
            name="diocesis"
            placeholder="Ej: Diócesis de Corrientes"
            value={diocesis ?? ""}
            onChange={(e) => onDiocesisChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}
