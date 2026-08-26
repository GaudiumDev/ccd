-- ============================================================
-- Migration 061: Seed del catálogo de Diócesis (Argentina)
-- Fuente: "Diocesis - Listado.csv" (carpeta listados para importación),
-- a su vez tomado de catholic-hierarchy.org.
-- GENERADO por scratchpad/gen_diocesis.py — no editar a mano.
--
-- Requiere la migración 060 (tabla public.diocesis).
-- Idempotente: upsert por `codigo` (uq_diocesis_codigo).
--
-- Ajustes sobre el CSV original:
--   * 6 nombres venían truncados y se completaron:
--     San Juan de Cuyo, Alto Valle del Río Negro, San Carlos de
--     Bariloche, Santa Fe de la Vera Cruz, San Nicolás de los
--     Arroyos y Gregorio de Laferrère.
--   * Se pasaron los conectores a minúscula ("De" -> "de").
--   * Se agregó `provincia` (el CSV no la trae): la usa el
--     desplegable para mostrar primero las diócesis de la
--     provincia elegida.
-- Total: 66 diócesis.
-- ============================================================

BEGIN;

-- 1. Baja lógica de todas las diócesis argentinas (las canónicas se
--    reactivan en el paso 2, igual que en los seeds 045 / 053).
UPDATE public.diocesis
   SET estado = 'inactiva',
       fecha_baja = COALESCE(fecha_baja, CURRENT_DATE),
       updated_at = NOW()
 WHERE pais = 'Argentina' OR pais IS NULL;

-- 2. Upsert del listado canónico

INSERT INTO public.diocesis (codigo, nombre, tipo, pais, provincia) VALUES
  ('DIOC-001', 'Arquidiócesis de Salta', 'arquidiocesis', 'Argentina', 'Salta'),
  ('DIOC-002', 'Diócesis de Orán', 'diocesis', 'Argentina', 'Salta'),
  ('DIOC-003', 'Prelatura de Cafayate', 'prelatura', 'Argentina', 'Salta'),
  ('DIOC-004', 'Diócesis de Jujuy', 'diocesis', 'Argentina', 'Jujuy'),
  ('DIOC-005', 'Prelatura de Humahuaca', 'prelatura', 'Argentina', 'Jujuy'),
  ('DIOC-006', 'Diócesis de Catamarca', 'diocesis', 'Argentina', 'Catamarca'),
  ('DIOC-007', 'Arquidiócesis de Tucumán', 'arquidiocesis', 'Argentina', 'Tucumán'),
  ('DIOC-008', 'Diócesis de Concepción', 'diocesis', 'Argentina', 'Tucumán'),
  ('DIOC-009', 'Diócesis de Santiago del Estero', 'diocesis', 'Argentina', 'Santiago del Estero'),
  ('DIOC-010', 'Diócesis de Añatuya', 'diocesis', 'Argentina', 'Santiago del Estero'),
  ('DIOC-011', 'Arquidiócesis de Córdoba', 'arquidiocesis', 'Argentina', 'Córdoba'),
  ('DIOC-012', 'Diócesis de Cruz del Eje', 'diocesis', 'Argentina', 'Córdoba'),
  ('DIOC-013', 'Prelatura de Deán Funes', 'prelatura', 'Argentina', 'Córdoba'),
  ('DIOC-014', 'Diócesis de San Francisco', 'diocesis', 'Argentina', 'Córdoba'),
  ('DIOC-015', 'Diócesis de Villa María', 'diocesis', 'Argentina', 'Córdoba'),
  ('DIOC-016', 'Diócesis de Río Cuarto', 'diocesis', 'Argentina', 'Córdoba'),
  ('DIOC-017', 'Arquidiócesis de San Juan de Cuyo', 'arquidiocesis', 'Argentina', 'San Juan'),
  ('DIOC-018', 'Diócesis de La Rioja', 'diocesis', 'Argentina', 'La Rioja'),
  ('DIOC-019', 'Diócesis de San Luis', 'diocesis', 'Argentina', 'San Luis'),
  ('DIOC-020', 'Arquidiócesis de Mendoza', 'arquidiocesis', 'Argentina', 'Mendoza'),
  ('DIOC-021', 'Diócesis de San Rafael', 'diocesis', 'Argentina', 'Mendoza'),
  ('DIOC-022', 'Diócesis de Neuquén', 'diocesis', 'Argentina', 'Neuquén'),
  ('DIOC-023', 'Arquidiócesis de Bahía Blanca', 'arquidiocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-024', 'Diócesis de Santa Rosa', 'diocesis', 'Argentina', 'La Pampa'),
  ('DIOC-025', 'Diócesis de Alto Valle del Río Negro', 'diocesis', 'Argentina', 'Río Negro'),
  ('DIOC-026', 'Diócesis de San Carlos de Bariloche', 'diocesis', 'Argentina', 'Río Negro'),
  ('DIOC-027', 'Diócesis de Viedma', 'diocesis', 'Argentina', 'Río Negro'),
  ('DIOC-028', 'Diócesis de Comodoro Rivadavia', 'diocesis', 'Argentina', 'Chubut'),
  ('DIOC-029', 'Diócesis de Río Gallegos', 'diocesis', 'Argentina', 'Santa Cruz'),
  ('DIOC-030', 'Arquidiócesis de Resistencia', 'arquidiocesis', 'Argentina', 'Chaco'),
  ('DIOC-031', 'Diócesis de San Roque', 'diocesis', 'Argentina', 'Chaco'),
  ('DIOC-032', 'Diócesis de Formosa', 'diocesis', 'Argentina', 'Formosa'),
  ('DIOC-033', 'Arquidiócesis de Corrientes', 'arquidiocesis', 'Argentina', 'Corrientes'),
  ('DIOC-034', 'Diócesis de Goya', 'diocesis', 'Argentina', 'Corrientes'),
  ('DIOC-035', 'Diócesis de Santo Tomé', 'diocesis', 'Argentina', 'Corrientes'),
  ('DIOC-036', 'Diócesis de Posadas', 'diocesis', 'Argentina', 'Misiones'),
  ('DIOC-037', 'Diócesis de Puerto Iguazú', 'diocesis', 'Argentina', 'Misiones'),
  ('DIOC-038', 'Arquidiócesis de Santa Fe de la Vera Cruz', 'arquidiocesis', 'Argentina', 'Santa Fe'),
  ('DIOC-039', 'Diócesis de Rafaela', 'diocesis', 'Argentina', 'Santa Fe'),
  ('DIOC-040', 'Diócesis de Reconquista', 'diocesis', 'Argentina', 'Santa Fe'),
  ('DIOC-041', 'Arquidiócesis de Rosario', 'arquidiocesis', 'Argentina', 'Santa Fe'),
  ('DIOC-042', 'Diócesis de Venado Tuerto', 'diocesis', 'Argentina', 'Santa Fe'),
  ('DIOC-043', 'Diócesis de San Nicolás de los Arroyos', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-044', 'Arquidiócesis de Paraná', 'arquidiocesis', 'Argentina', 'Entre Ríos'),
  ('DIOC-045', 'Diócesis de Concordia', 'diocesis', 'Argentina', 'Entre Ríos'),
  ('DIOC-046', 'Diócesis de Gualeguaychú', 'diocesis', 'Argentina', 'Entre Ríos'),
  ('DIOC-047', 'Arquidiócesis de Buenos Aires', 'arquidiocesis', 'Argentina', 'Ciudad Autónoma de Buenos Aires'),
  ('DIOC-048', 'Diócesis de San Isidro', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-049', 'Diócesis de San Miguel', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-050', 'Diócesis de San Martín', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-051', 'Diócesis de Morón', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-052', 'Diócesis de Merlo Moreno', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-053', 'Diócesis de San Justo', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-054', 'Diócesis de Gregorio de Laferrère', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-055', 'Diócesis de Lomas de Zamora', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-056', 'Diócesis de Avellaneda Lanús', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-057', 'Arquidiócesis de La Plata', 'arquidiocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-058', 'Diócesis de Quilmes', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-059', 'Diócesis de Zárate Campana', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-060', 'Diócesis de 9 de Julio', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-061', 'Diócesis de Azul', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-062', 'Diócesis de Mar del Plata', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-063', 'Diócesis de Chascomús', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-064', 'Diócesis de Mercedes Luján', 'diocesis', 'Argentina', 'Buenos Aires'),
  ('DIOC-065', 'Diócesis de Oberá', 'diocesis', 'Argentina', 'Misiones'),
  ('DIOC-066', 'Prelatura de Esquel', 'prelatura', 'Argentina', 'Chubut')
ON CONFLICT (codigo) DO UPDATE SET
  nombre     = EXCLUDED.nombre,
  tipo       = EXCLUDED.tipo,
  pais       = EXCLUDED.pais,
  provincia  = EXCLUDED.provincia,
  estado     = 'activa',
  fecha_baja = NULL,
  updated_at = NOW();

COMMIT;

-- Verificación:
-- SELECT provincia, COUNT(*) FROM public.diocesis
--  WHERE estado = 'activa' GROUP BY provincia ORDER BY provincia;
