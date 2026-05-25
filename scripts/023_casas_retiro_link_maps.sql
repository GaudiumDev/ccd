-- Add Google Maps URL field to casas_retiro
ALTER TABLE casas_retiro ADD COLUMN IF NOT EXISTS link_maps TEXT;
