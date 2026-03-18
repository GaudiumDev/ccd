-- ============================================================
-- MIGRACIÓN 010: Agregar columna notas a asignaciones_ministerio
--                + Crear bucket de Storage para adjuntos
-- ============================================================

BEGIN;

-- Agregar columna notas a asignaciones_ministerio
ALTER TABLE public.asignaciones_ministerio
  ADD COLUMN IF NOT EXISTS notas TEXT;

COMMIT;

-- ============================================================
-- STORAGE: Crear bucket para adjuntos de asignaciones
-- Ejecutar DESPUÉS del COMMIT anterior
-- ============================================================

-- Crear bucket (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'asignaciones-adjuntos',
  'asignaciones-adjuntos',
  false,
  10485760, -- 10 MB
  ARRAY['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Solo usuarios autenticados pueden subir/leer archivos
CREATE POLICY "asignaciones_adjuntos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'asignaciones-adjuntos' AND auth.uid() IS NOT NULL);

CREATE POLICY "asignaciones_adjuntos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'asignaciones-adjuntos' AND auth.uid() IS NOT NULL);

CREATE POLICY "asignaciones_adjuntos_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'asignaciones-adjuntos' AND auth.uid() IS NOT NULL);
