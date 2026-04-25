-- 023_roles_codigo_interno.sql
-- Agrega el campo codigo_interno a roles_sistema.
-- Alfanumérico, único, inmutable una vez asignado.

ALTER TABLE public.roles_sistema
  ADD COLUMN IF NOT EXISTS codigo_interno TEXT UNIQUE;

-- Índice para búsquedas por código en importaciones
CREATE INDEX IF NOT EXISTS roles_sistema_codigo_interno_idx
  ON public.roles_sistema (codigo_interno)
  WHERE codigo_interno IS NOT NULL;

COMMENT ON COLUMN public.roles_sistema.codigo_interno
  IS 'Código interno CcD (alfanumérico). Inmutable una vez definido. Usado en importaciones de asignaciones.';
j