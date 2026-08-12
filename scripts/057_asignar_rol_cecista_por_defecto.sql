-- ============================================================
-- 057_asignar_rol_cecista_por_defecto.sql
-- ============================================================
-- Asigna el rol/ministerio "Cecista" (codigo_interno = 'CEC') a
-- todas las personas ACTIVAS que hoy NO tienen ninguna asignación
-- de ministerio vigente.
--
-- "No tener rol" = ninguna fila en asignaciones_ministerio con
-- estado='activo' y (fecha_fin IS NULL o futura).
--
-- El rol Cecista es el rol base de la comunidad:
--   id             = 3d5a4e83-b913-4469-8801-7dff24ef4a1a
--   nombre         = Cecista
--   tipo           = usuario
--   nivel          = comunidad
--   nivel_acceso   = 0
--   codigo_interno = CEC
--
-- Idempotente: si se re-ejecuta, no duplica asignaciones (se apoya
-- en NOT EXISTS sobre la asignación activa). Se referencia el
-- ministerio por codigo_interno para no depender del UUID.
-- ============================================================

BEGIN;

WITH cecista AS (
  SELECT id
  FROM public.ministerios
  WHERE codigo_interno = 'CEC'
    AND activo = TRUE
  LIMIT 1
)
INSERT INTO public.asignaciones_ministerio
  (persona_id, ministerio_id, fecha_inicio, estado)
SELECT
  p.id,
  c.id,
  CURRENT_DATE,
  'activo'
FROM public.personas p
CROSS JOIN cecista c
WHERE p.fecha_baja IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.asignaciones_ministerio am
    WHERE am.persona_id = p.id
      AND am.estado = 'activo'
      AND (am.fecha_fin IS NULL OR am.fecha_fin > CURRENT_DATE)
  );

-- Reporte de cuántas personas quedaron con el rol Cecista recién asignado.
DO $$
DECLARE v_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM public.asignaciones_ministerio am
  JOIN public.ministerios m ON m.id = am.ministerio_id
  WHERE m.codigo_interno = 'CEC'
    AND am.estado = 'activo'
    AND am.fecha_inicio = CURRENT_DATE;
  RAISE NOTICE 'Asignaciones Cecista con fecha_inicio de hoy: %', v_total;
END $$;

COMMIT;
