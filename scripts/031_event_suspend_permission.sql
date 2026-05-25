-- Migración 031: Agregar permiso event.suspend al catálogo de permisos

-- 1. Insertar el permiso en el catálogo
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('event.suspend',
   'Suspender eventos',
   'Permite suspender un evento en cualquier instancia del flujo. Acción definitiva — solo Equipo Timón',
   'eventos')
ON CONFLICT (clave) DO NOTHING;

-- 2. Asignar event.suspend solo al admin_general
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre = 'admin_general'
  AND p.clave = 'event.suspend'
ON CONFLICT DO NOTHING;
