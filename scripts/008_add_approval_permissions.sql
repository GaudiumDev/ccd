-- Migración 008: Agregar permisos de aprobación de discernimiento al catálogo
-- Los permisos event.approve_confra y event.approve_eqt son los que usa el código
-- para controlar quién puede comunicar el discernimiento en cada nivel.
-- El catálogo original (005) solo tenía event.approve, que nunca se checkea en el flujo.

-- 1. Insertar las dos claves faltantes en la tabla de permisos
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('event.approve_confra',
   'Discernimiento confraternidad / delegado',
   'Permite comunicar el resultado del discernimiento a nivel confraternidad o delegado',
   'eventos'),
  ('event.approve_eqt',
   'Discernimiento Equipo Timón',
   'Permite comunicar el resultado del discernimiento a nivel Equipo Timón',
   'eventos')
ON CONFLICT (clave) DO NOTHING;

-- 2. Asignar event.approve_confra a los roles de sistema que corresponden
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre IN ('admin_general', 'tecnico_confraternidad', 'responsable_fraternidad')
  AND p.clave = 'event.approve_confra'
ON CONFLICT DO NOTHING;

-- 3. Asignar event.approve_eqt solo al admin_general
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre = 'admin_general'
  AND p.clave = 'event.approve_eqt'
ON CONFLICT DO NOTHING;

-- 4. Renombrar event.approve para que no sea confuso en la UI
UPDATE public.permisos
SET nombre = 'Aprobar y publicar eventos (admin)',
    descripcion = 'Permiso de aprobación directa — reservado para administradores. Para discernimiento usar event.approve_confra / event.approve_eqt.'
WHERE clave = 'event.approve';
