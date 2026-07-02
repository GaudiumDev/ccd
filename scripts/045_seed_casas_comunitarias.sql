-- Migration 045: Seed canonical Casas Comunitarias
-- Source: "Casas Comunitarias - Hoja 1.csv"
-- Depends on: 039_cecista_perfil.sql (creates public.casas_comunitarias).
-- Run this in the Supabase SQL editor.
--
-- Behaviour:
--   1. Soft-deletes ALL existing casas_comunitarias (estado='inactiva', fecha_baja).
--   2. Upserts the canonical rows by `codigo` (idempotent / re-runnable).
--   3. Canonical rows are re-activated (estado='activa', fecha_baja=NULL); old
--      un-coded rows remain inactiva.
--
-- Tipo mapping: "con Pautas aprobadas" -> con_pautas_aprobadas ; "Incoada" -> incoada

BEGIN;

-- ─── 1. Unique key on codigo (enables idempotent upsert) ──────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_casas_comunitarias_codigo
  ON public.casas_comunitarias (codigo) WHERE codigo IS NOT NULL;

-- ─── 2. Soft-delete existing rows (canonical ones re-activated in step 3) ──────
UPDATE public.casas_comunitarias
  SET estado = 'inactiva',
      fecha_baja = COALESCE(fecha_baja, CURRENT_DATE);

-- ─── 3. Upsert canonical rows (idempotent by codigo) ──────────────────────────
INSERT INTO public.casas_comunitarias (codigo, nombre, tipo, estado) VALUES
  ('CASACOM-001', 'MONTE TABOR',                'con_pautas_aprobadas', 'activa'),
  ('CASACOM-002', 'AIM KARIM',                  'con_pautas_aprobadas', 'activa'),
  ('CASACOM-003', 'FORTALEZA DE DIOS',          'con_pautas_aprobadas', 'activa'),
  ('CASACOM-004', 'JERUSALÉN CIUDAD DE DIOS',   'con_pautas_aprobadas', 'activa'),
  ('CASACOM-005', 'SAGRADO CORAZÓN',            'con_pautas_aprobadas', 'activa'),
  ('CASACOM-006', 'MARÍA DEL CAFARNAÚN',        'con_pautas_aprobadas', 'activa'),
  ('CASACOM-007', 'DEL AMOR DE DIOS',           'con_pautas_aprobadas', 'activa'),
  ('CASACOM-008', 'FAMILIA DE DIOS',            'con_pautas_aprobadas', 'activa'),
  ('CASACOM-009', 'NAZARET',                    'con_pautas_aprobadas', 'activa'),
  ('CASACOM-010', 'BETANIA (Bs.As.)',           'con_pautas_aprobadas', 'activa'),
  ('CASACOM-011', 'BETANIA (Corrientes)',       'con_pautas_aprobadas', 'activa'),
  ('CASACOM-012', 'PEQUEÑA TIENDA',             'con_pautas_aprobadas', 'activa'),
  ('CASACOM-013', 'LA VISITACIÓN DE DIOS',      'con_pautas_aprobadas', 'activa'),
  ('CASACOM-014', 'APÓSTOLES DE LA REVELACIÓN', 'con_pautas_aprobadas', 'activa'),
  ('CASACOM-015', 'HIJOS DE LA RÚAJ',           'con_pautas_aprobadas', 'activa'),
  ('CASACOM-016', 'POZO DE MISERICORDIA',       'con_pautas_aprobadas', 'activa'),
  ('CASACOM-017', 'BERAKAH',                    'con_pautas_aprobadas', 'activa'),
  ('CASACOM-018', 'MORADA DEL PADRE',           'con_pautas_aprobadas', 'activa'),
  ('CASACOM-019', 'NUEVO BELÉN (Chile)',        'incoada',              'activa'),
  ('CASACOM-020', 'JARDÍN DEL AMADO',           'incoada',              'activa'),
  ('CASACOM-021', 'BETHLEJEM',                  'incoada',              'activa')
ON CONFLICT (codigo) WHERE codigo IS NOT NULL DO UPDATE
  SET nombre     = EXCLUDED.nombre,
      tipo       = EXCLUDED.tipo,
      estado     = 'activa',
      fecha_baja = NULL,
      updated_at = now();

COMMIT;

-- ─── Verification (run separately after commit) ───────────────────────────────
-- SELECT tipo, estado, count(*) FROM public.casas_comunitarias GROUP BY tipo, estado ORDER BY tipo, estado;
-- SELECT codigo, nombre, tipo FROM public.casas_comunitarias WHERE estado='activa' ORDER BY codigo;
