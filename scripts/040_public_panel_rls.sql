-- Migration 040: Acceso anónimo para el Panel de Publicación de Eventos en '/'
-- El panel público muestra eventos publicados Y suspendidos, con filtros por
-- confraternidad, fraternidad, casa de retiros, provincia, ciudad y estado.
-- Esto requiere exponer a usuarios anónimos:
--   1. Eventos suspendidos (los publicados ya están habilitados en 032).
--   2. Nombres de confraternidades y fraternidades (organizaciones).
--   3. Casas de retiro activas.

-- 1. Eventos suspendidos visibles para anónimos (se suma a public_read_publicados)
DROP POLICY IF EXISTS "public_read_suspendidos" ON public.eventos;
CREATE POLICY "public_read_suspendidos"
  ON public.eventos
  FOR SELECT
  TO anon
  USING (estado = 'suspendido');

-- 2. Confraternidades y fraternidades legibles para anónimos (solo nombre/jerarquía)
DROP POLICY IF EXISTS "public_read_organizaciones_panel" ON public.organizaciones;
CREATE POLICY "public_read_organizaciones_panel"
  ON public.organizaciones
  FOR SELECT
  TO anon
  USING (
    tipo IN ('confraternidad', 'fraternidad')
    AND fecha_baja IS NULL
  );

-- 3. Casas de retiro activas legibles para anónimos
DROP POLICY IF EXISTS "public_read_casas_retiro_panel" ON public.casas_retiro;
CREATE POLICY "public_read_casas_retiro_panel"
  ON public.casas_retiro
  FOR SELECT
  TO anon
  USING (fecha_baja IS NULL);
