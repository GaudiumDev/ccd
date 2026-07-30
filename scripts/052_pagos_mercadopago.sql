-- ============================================================
-- MIGRACIÓN 052: Integración de Mercado Pago (Checkout Pro, modelo marketplace)
--
-- 1. Columnas de referencia de Mercado Pago en pagos (incluye qué organización cobró)
-- 2. Índice único para idempotencia del webhook (mp_payment_id)
-- 3. Tabla organizacion_mercadopago: cuenta de MP conectada por Confraternidad/Fraternidad
--    (RLS habilitada SIN policies: solo el service-role puede leer/escribir los tokens)
-- ============================================================

BEGIN;

ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS mp_payment_id BIGINT,
  ADD COLUMN IF NOT EXISTS mp_preference_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_organizacion_id UUID REFERENCES public.organizaciones(id);

CREATE UNIQUE INDEX IF NOT EXISTS pagos_mp_payment_id_key
  ON public.pagos (mp_payment_id) WHERE mp_payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.organizacion_mercadopago (
  organizacion_id UUID PRIMARY KEY REFERENCES public.organizaciones(id),
  mp_user_id BIGINT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  public_key TEXT,
  token_expira_en TIMESTAMPTZ NOT NULL,
  conectado_por UUID REFERENCES public.personas(id),
  conectado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizacion_mercadopago ENABLE ROW LEVEL SECURITY;
-- Sin policies a propósito: ni siquiera un usuario autenticado puede leer/escribir
-- esta tabla vía Supabase client. Solo el service-role (server-side) accede.

COMMIT;
