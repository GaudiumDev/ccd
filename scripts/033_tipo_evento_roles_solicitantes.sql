-- Migration 033: Tabla junction para roles que pueden solicitar cada tipo de evento
-- Permite configurar por tipo de evento qué ministerios (con permiso event.create) pueden solicitarlo.

CREATE TABLE IF NOT EXISTS public.tipo_evento_roles_solicitantes (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_evento_id UUID NOT NULL REFERENCES public.tipos_eventos(id) ON DELETE CASCADE,
  ministerio_id  UUID NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tipo_evento_id, ministerio_id)
);

ALTER TABLE public.tipo_evento_roles_solicitantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ters_select_auth"
  ON public.tipo_evento_roles_solicitantes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "ters_insert_auth"
  ON public.tipo_evento_roles_solicitantes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ters_delete_auth"
  ON public.tipo_evento_roles_solicitantes FOR DELETE
  USING (auth.uid() IS NOT NULL);
