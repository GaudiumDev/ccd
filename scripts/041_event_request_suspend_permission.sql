-- Migración 041: Agregar permiso event.request_suspend al catálogo de permisos
--
-- Permite a un rol/ministerio (enlaces, responsables, delegados) SOLICITAR la suspensión
-- de un evento indicando el motivo. La suspensión definitiva sigue requiriendo event.suspend.
-- A diferencia del flujo anterior (hardcodeado por esSolicitante / approve_confra), ahora se
-- otorga como permiso asignable desde el catálogo (/ministerios/catalogo/[id], /ministerios/roles/[id]).

-- 1. Insertar el permiso en el catálogo
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('event.request_suspend',
   'Solicitar suspensión de eventos',
   'Permite solicitar la suspensión de un evento indicando el motivo. La solicitud la revisa el Equipo Timón.',
   'eventos')
ON CONFLICT (clave) DO NOTHING;

-- 2. Asignar event.request_suspend al admin_general (Equipo Timón también puede solicitar).
--    Los demás roles/ministerios (enlaces, responsables, delegados) se asignan desde el catálogo.
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre = 'admin_general'
  AND p.clave = 'event.request_suspend'
ON CONFLICT DO NOTHING;
