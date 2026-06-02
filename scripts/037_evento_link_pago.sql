-- Add Mercado Pago payment link field to eventos table
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS link_pago_mercadopago TEXT;
