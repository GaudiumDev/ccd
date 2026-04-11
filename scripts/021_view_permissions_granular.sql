-- Migration 021: Permisos de vista granulares
-- Agrega view.personas, view.organizaciones, view.eventos y view.eventos_publicados

BEGIN;

INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('view.personas',
   'Ver personas',
   'Permite ver el listado y detalle de personas en el sistema',
   'sistema'),
  ('view.organizaciones',
   'Ver organizaciones',
   'Permite ver el listado y detalle de organizaciones',
   'sistema'),
  ('view.eventos',
   'Ver eventos',
   'Permite ver el listado y detalle de eventos',
   'sistema'),
  ('view.eventos_publicados',
   'Ver eventos publicados',
   'Permite ver la página de eventos publicados (panel comunitario)',
   'sistema')
ON CONFLICT (clave) DO NOTHING;

-- view.personas, view.organizaciones, view.eventos → mismos roles que tienen view.all
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre IN (
  'admin_general',
  'tecnico_confraternidad',
  'responsable_fraternidad',
  'usuario_carga',
  'solo_lectura'
)
  AND p.clave IN ('view.personas', 'view.organizaciones', 'view.eventos')
ON CONFLICT DO NOTHING;

-- view.eventos_publicados: solo admin_general por defecto
-- Los admins pueden asignarlo a otros roles desde la UI de Permisos del Rol
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre = 'admin_general'
  AND p.clave = 'view.eventos_publicados'
ON CONFLICT DO NOTHING;

COMMIT;
