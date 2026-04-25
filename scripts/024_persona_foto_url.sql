-- Add foto_url column to personas
ALTER TABLE personas ADD COLUMN IF NOT EXISTS foto_url text;

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos-perfil',
  'fotos-perfil',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for fotos-perfil bucket
CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fotos-perfil');

CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'fotos-perfil');

CREATE POLICY "Authenticated users can update profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'fotos-perfil');

CREATE POLICY "Authenticated users can delete profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fotos-perfil');
