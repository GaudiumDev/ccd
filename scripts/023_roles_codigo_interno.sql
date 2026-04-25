-- 023_roles_codigo_interno.sql
-- Agrega el campo codigo_interno a roles_sistema y ministerios.
-- Alfanumérico, único, inmutable una vez asignado.

ALTER TABLE public.roles_sistema
  ADD COLUMN IF NOT EXISTS codigo_interno TEXT UNIQUE;

ALTER TABLE public.ministerios
  ADD COLUMN IF NOT EXISTS codigo_interno TEXT UNIQUE;

-- Índices para búsquedas por código en importaciones
CREATE INDEX IF NOT EXISTS roles_sistema_codigo_interno_idx
  ON public.roles_sistema (codigo_interno)
  WHERE codigo_interno IS NOT NULL;

CREATE INDEX IF NOT EXISTS ministerios_codigo_interno_idx
  ON public.ministerios (codigo_interno)
  WHERE codigo_interno IS NOT NULL;

COMMENT ON COLUMN public.roles_sistema.codigo_interno
  IS 'Código interno CcD (alfanumérico). Inmutable una vez definido. Usado en importaciones de asignaciones.';

COMMENT ON COLUMN public.ministerios.codigo_interno
  IS 'Código interno CcD (alfanumérico). Inmutable una vez definido. Usado en importaciones de asignaciones.';