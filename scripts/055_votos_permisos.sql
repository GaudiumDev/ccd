-- Migración 055: Permisos para gestión de votos de Dedicados
--
-- Contexto (CSV "Datos de Cecistas a Relevar" → hoja Votos):
--   El Responsable / Referente de Dedicados valida la renovación de los votos de los
--   hermanos y, si algo está incorrecto, es quien carga la información. Los Animadores
--   de Dedicados deben tener acceso al listado de votos de los hermanos.
--
-- Se modela como dos permisos asignables desde el catálogo de roles/ministerios
-- (mismo patrón que la migración 041). Alcance GLOBAL (no scopeado a confraternidad):
--   - votos.edit → editar los votos de cualquier persona desde su detalle.
--   - votos.list → ver el listado consolidado de votos (solo lectura, para animadores).
--
-- Los votos siguen viviendo en persona_votos (migración 039); acá NO se cambia el esquema
-- de datos, solo el catálogo de permisos. Solo se guarda el voto vigente (sin historial).

-- 1. Insertar los permisos en el catálogo
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('votos.edit',
   'Editar votos de Dedicados',
   'Permite editar los votos (año, perpetuo/temporal) de cualquier persona desde su detalle. Para Responsables/Referentes de Dedicados.',
   'personas'),
  ('votos.list',
   'Ver listado de votos',
   'Permite acceder al listado consolidado de votos de los hermanos (solo lectura). Para Animadores de Dedicados.',
   'personas')
ON CONFLICT (clave) DO NOTHING;

-- 2. Asignar ambos permisos al admin_general (Equipo Timón). Los demás roles/ministerios
--    (Referentes, Animadores) se otorgan a mano desde el catálogo de permisos.
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre = 'admin_general'
  AND p.clave IN ('votos.edit', 'votos.list')
ON CONFLICT DO NOTHING;
