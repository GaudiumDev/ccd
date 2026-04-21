-- Agrega campo activo a tipos_eventos
-- Los tipos inactivos no deben mostrarse al crear un evento

ALTER TABLE tipos_eventos ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
