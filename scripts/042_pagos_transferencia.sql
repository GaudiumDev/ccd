-- ============================================================
-- MIGRACIÓN 042: Pago de inscripción por transferencia + verificación
--
-- 1. Datos de cobro (alias/CBU) por organización (confra/fraternidad)
-- 2. Columna comprobante_url en pagos (object path del bucket)
-- 3. Bucket privado pagos-comprobantes + RLS
-- 4. Permiso payment.verify en el catálogo
-- ============================================================

BEGIN;

-- 1. Datos de cobro por organización
ALTER TABLE public.organizaciones
  ADD COLUMN IF NOT EXISTS pago_alias TEXT,
  ADD COLUMN IF NOT EXISTS pago_cbu TEXT,
  ADD COLUMN IF NOT EXISTS pago_titular TEXT,
  ADD COLUMN IF NOT EXISTS pago_banco TEXT,
  ADD COLUMN IF NOT EXISTS pago_instrucciones TEXT;

-- 2. Comprobante de transferencia en pagos (guarda el object path, no URL pública)
ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS comprobante_url TEXT;

COMMIT;

-- ============================================================
-- 3. STORAGE: bucket privado para comprobantes de pago
--    Ejecutar DESPUÉS del COMMIT anterior
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pagos-comprobantes',
  'pagos-comprobantes',
  false,
  10485760, -- 10 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: los usuarios autenticados pueden LEER (el panel genera signed URLs).
-- El INSERT lo hace el service-role del endpoint público (bypassa RLS).
CREATE POLICY "pagos_comprobantes_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pagos-comprobantes' AND auth.uid() IS NOT NULL);

-- ============================================================
-- 4. Permiso payment.verify (verificar/aprobar/rechazar pagos por transferencia)
-- ============================================================

-- 4a. Ampliar el CHECK de permisos.categoria para admitir 'pagos' (patrón de migración 026)
ALTER TABLE public.permisos
  DROP CONSTRAINT IF EXISTS permisos_categoria_check;
ALTER TABLE public.permisos
  ADD CONSTRAINT permisos_categoria_check
  CHECK (categoria IN ('personas', 'organizaciones', 'eventos', 'tipos_eventos', 'roles', 'sistema', 'pagos'));

-- 4b. Insertar el permiso en el catálogo
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('payment.verify',
   'Verificar pagos por transferencia',
   'Permite verificar el comprobante de un pago por transferencia y aprobarlo o rechazarlo, scopeado a la organización del evento.',
   'pagos')
ON CONFLICT (clave) DO NOTHING;

-- 4c. Asignar payment.verify a los roles que gestionan eventos de su org
INSERT INTO public.rol_permisos (rol_sistema_id, permiso_id, activo)
SELECT rs.id, p.id, true
FROM public.roles_sistema rs
CROSS JOIN public.permisos p
WHERE rs.nombre IN ('admin_general', 'tecnico_confraternidad', 'responsable_fraternidad')
  AND p.clave = 'payment.verify'
ON CONFLICT DO NOTHING;
