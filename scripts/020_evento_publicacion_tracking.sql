-- Migration 020: Separar "Aprobar eventos" de "Publicar eventos"
-- Agrega columnas de auditoría de publicación y crea el permiso event.publish

BEGIN;

-- 1. Columnas de auditoría de publicación en eventos
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS publicado_por    UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fecha_publicacion DATE;

-- 2a. Renombrar el permiso existente event.approve para aclarar que es solo aprobación
UPDATE public.permisos
SET nombre      = 'Aprobar eventos',
    descripcion = 'Permite aprobar eventos directamente (sin flujo de discernimiento). Reservado para administradores.'
WHERE clave = 'event.approve';

-- 2b. Agregar el nuevo permiso event.publish
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  (
    'event.publish',
    'Publicar eventos',
    'Permite publicar un evento que ya fue aprobado, haciéndolo visible en el panel de eventos publicados (aprobado → publicado)',
    'eventos'
  )
ON CONFLICT (clave) DO NOTHING;

-- 3. Asignar event.publish a admin_general por defecto
--    (Los admins pueden asignarlo a otros roles desde la UI de Permisos del Rol)
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre = 'admin_general'
  AND p.clave = 'event.publish'
ON CONFLICT DO NOTHING;

COMMIT;
