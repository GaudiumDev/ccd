-- 036_evento_flyers.sql
-- Add horizontal and square flyer URL columns to eventos.
-- Admins upload flyers from Platform Administration.

ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS flyer_horizontal_url TEXT,
  ADD COLUMN IF NOT EXISTS flyer_cuadrado_url TEXT;

-- Create storage bucket for event flyers (public, max 10 MB each, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'eventos-flyers',
  'eventos-flyers',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload event flyers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'eventos-flyers');

CREATE POLICY "Anyone can view event flyers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'eventos-flyers');

CREATE POLICY "Authenticated users can update event flyers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'eventos-flyers');

CREATE POLICY "Authenticated users can delete event flyers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'eventos-flyers');
