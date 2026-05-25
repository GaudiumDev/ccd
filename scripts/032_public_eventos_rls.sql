-- Permite lectura anónima de eventos publicados para la landing pública
CREATE POLICY "public_read_publicados"
ON eventos
FOR SELECT
TO anon
USING (estado = 'publicado');
