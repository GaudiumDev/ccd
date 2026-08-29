-- Migración 065: Permisos de exportación de datos (Excel / PDF)
--
-- Contexto: hasta ahora cualquier usuario con acceso a las secciones de Personas y
-- Organizaciones podía descargar el listado completo en Excel. No todos los roles
-- deberían poder exportar todos los datos, así que la exportación pasa a ser un
-- permiso asignable desde el catálogo de roles/ministerios
-- (/ministerios/catalogo/[id] y /ministerios/roles/[id]), mismo patrón que 041 y 055.
--
--   - personas.export       → exportar el listado de personas a Excel y el detalle a PDF.
--   - organizaciones.export → exportar el listado de organizaciones a Excel.
--
-- Los permisos son GLOBALES (no scopeados a confraternidad): el filtrado de qué filas
-- se exportan lo sigue haciendo RLS.

-- 1. Insertar los permisos en el catálogo
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('personas.export',
   'Exportar personas',
   'Permite descargar el listado de personas en Excel (con los filtros aplicados) y exportar el detalle de una persona a PDF.',
   'personas'),
  ('organizaciones.export',
   'Exportar organizaciones',
   'Permite descargar el listado de organizaciones en Excel (con los filtros aplicados).',
   'organizaciones')
ON CONFLICT (clave) DO NOTHING;

-- 2. Asignar ambos permisos al admin_general (Equipo Timón).
--    El resto de los roles/ministerios se otorgan a mano desde el catálogo de permisos.
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre = 'admin_general'
  AND p.clave IN ('personas.export', 'organizaciones.export')
ON CONFLICT DO NOTHING;

-- 3. (Opcional) Descomentar para que los roles técnicos de confraternidad y los
--    responsables de fraternidad conserven la exportación que tenían antes de esta
--    migración. Si se deja comentado, solo el Equipo Timón podrá exportar hasta que
--    se asignen los permisos desde la UI.
--
-- INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
-- SELECT rs.id, p.id, true
-- FROM public.roles_sistema rs
-- CROSS JOIN public.permisos p
-- WHERE rs.nombre IN ('tecnico_confraternidad', 'responsable_fraternidad')
--   AND p.clave IN ('personas.export', 'organizaciones.export')
-- ON CONFLICT DO NOTHING;
