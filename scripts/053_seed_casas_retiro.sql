-- Migration 053: Seed canonical Casas de Retiro
-- Source: "Casas de Retiro - Casas.csv"
-- Run this in the Supabase SQL editor.
--
-- Behaviour (same pattern as 043/045):
--   1. Adds a partial unique index on `codigo_interno` (enables idempotent upsert).
--   2. Soft-deletes ALL existing casas_retiro (estado='inactiva', fecha_baja).
--   3. Upserts the canonical rows by `codigo_interno`; canonical rows re-activated.
--
-- Mapping: Tipo PROPIA->propia, everything else (EXTERNA/typos)->terceros.
-- Empty placeholder rows (CASA-94..199 in the CSV) are skipped.
-- "Link a google maps" column -> link_maps verbatim (some rows hold a place name /
-- GPS coords instead of a URL; kept as-is, clean up later if needed).

BEGIN;

-- ─── 1. Unique key on codigo_interno ──────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_casas_retiro_codigo_interno
  ON public.casas_retiro (codigo_interno) WHERE codigo_interno IS NOT NULL;

-- ─── 2. Soft-delete existing rows (canonical ones re-activated in step 3) ──────
UPDATE public.casas_retiro
  SET estado = 'inactiva',
      fecha_baja = COALESCE(fecha_baja, CURRENT_DATE);

-- ─── 3. Upsert canonical rows (idempotent by codigo_interno) ──────────────────
INSERT INTO public.casas_retiro
  (codigo_interno, nombre, tipo_propiedad, direccion_calle, direccion_nro,
   ciudad, cp, provincia, pais, diocesis, link_maps, notas, estado)
VALUES
  ('CASA-01', 'Casa De Retiro Nuestra Señora De La Paz', 'propia', '-30.703076, -59.462218', '-30.703076, -59.462218', 'La Paz', '3191', 'Entre Ríos', 'Argentina', 'Arquidiócesis De Paraná', 'https://maps.app.goo.gl/VUYoy3Ww9Uev1Euz6', 'En una sola planta, habitaciones con baño priivado', 'activa'),
  ('CASA-02', 'Santa Casa de Ejercicios Espirituales', 'terceros', 'Independencia1190', NULL, 'CABA', '1099', 'CABA', 'Argentina', 'Arquidiócesis De Buenos Aires', 'https://maps.app.goo.gl/XLYLh9dEt7dUt1YF8', NULL, 'activa'),
  ('CASA-03', 'Centro Pastoral Diocesano', 'terceros', 'Baumeister y pergamino 1243', NULL, 'Oberá', '3360', 'Misiones', 'Argentina', 'Diócesis De Oberá', 'https://maps.app.goo.gl/UZM1ifH6UGe1du55A', NULL, 'activa'),
  ('CASA-04', 'Seminario Mayor Jesús Buen Pastor', 'terceros', 'Bv Buteler 100', NULL, 'Rio IV', '5800', 'Cordoba', 'Argentina', 'Diócesis De Río Cuarto', 'https://maps.app.goo.gl/Wr9t3JyWhjGEA1z17', NULL, 'activa'),
  ('CASA-05', 'CECABS', 'terceros', 'Paraje La Lola', NULL, 'Reconquista', '3560', 'Santa Fé', 'Argentina', 'Diócesis De Reconquista', 'https://maps.app.goo.gl/2rt7zquJUhh7V4Wa8', NULL, 'activa'),
  ('CASA-06', 'Casa de retiro CANA', 'terceros', 'Corrientes 1385', NULL, 'Concepción', '4146', 'Tucumán', 'Argentina', 'Diócesis De Concepción', 'https://maps.app.goo.gl/xiWdjVLzvviMfaYf7?g_st=aw', NULL, 'activa'),
  ('CASA-07', 'casa de Retiro Espacio La Merced', 'terceros', 'Buenos Aires 665', NULL, 'Corrientes', '3400', 'corrientes', 'Argentina', 'Arquidiócesis De Corrientes', 'https://maps.app.goo.gl/RKQypF3iidpgV6Jw9', NULL, 'activa'),
  ('CASA-08', 'Casa de Espiritualidad de Fátima', 'terceros', 'Juan José Paso 8385', NULL, 'Rosario', '2006', 'Santa Fé', 'Argentina', 'Arquidiócesis De Rosario', 'https://maps.app.goo.gl/U5hk7xsKktsy4Hie9', NULL, 'activa'),
  ('CASA-09', 'Casa Papa Francisco', 'terceros', 'calle 60 entre 9 y 11', NULL, 'Miramar', '7607', 'Buenos Aires', 'Argentina', 'Diócesis De Mar Del Plata', 'https://maps.app.goo.gl/moZJBQipzBGWXapy7', NULL, 'activa'),
  ('CASA-10', 'Casa Cardenal Copello', 'terceros', 'Barzana 1535', NULL, 'C.A.B.A', '1431', 'Buenos Aires', 'Argentina', 'Arquidiócesis De Buenos Aires', 'https://maps.app.goo.gl/3tu2zKi8ZtCahpxR7', NULL, 'activa'),
  ('CASA-11', 'Casa Madre Camila', 'terceros', 'Consejal Veiga 616', NULL, 'Concordia', '3202', 'Entre Rios', 'Argentina', 'Diócesis De Concordia', 'https://maps.app.goo.gl/BLNozjpv71roH5VN7', NULL, 'activa'),
  ('CASA-12', 'Instituto El Buen Pastor', 'terceros', 'Gral San Martín 1232', NULL, 'San Salvador', '4600', 'Jujuy', 'Argentina', 'Diócesis De Jujuy', 'https://maps.app.goo.gl/kGZc5y3u4KMkUq9Q7', NULL, 'activa'),
  ('CASA-13', 'María Madre de las Familias', 'terceros', 'Sarmiento y Uruguay', NULL, 'Gral San Martín', '3509', 'Chaco', 'Argentina', 'Diócesis De San Martín', 'https://maps.app.goo.gl/5EdMqq1GMKKiEEUS9', NULL, 'activa'),
  ('CASA-14', 'El Salvador', 'terceros', 'Pedro Londero 3445', NULL, 'Paraná', '3100', 'Entre Ríos', 'Argentina', 'Arquidiócesis De Paraná', 'https://maps.app.goo.gl/i73bdeRwLPZJbCBP6', NULL, 'activa'),
  ('CASA-15', 'Santa Isabel de Portugal', 'terceros', 'Belgrano 977', NULL, 'Santa Fé', '2605', 'Santa Fé', 'Argentina', 'Arquidiócesis De Santa Fe De', 'https://maps.app.goo.gl/o9SscBpS1gpq7ViF9', NULL, 'activa'),
  ('CASA-16', 'Casa de retiro La Choza', 'terceros', 'Ruta 28 km 11', NULL, 'San Lorenzo', '4406', 'Salta', 'Argentina', 'Arquidiócesis De Salta', 'Casa de Retiro "La Choza"', NULL, 'activa'),
  ('CASA-17', 'casa de retiro Santa Catalina', 'terceros', 'Av.Córdoba 2901', NULL, 'Esperanza', '3080', 'Santa Fé', 'Argentina', 'Arquidiócesis De Santa Fe De', 'Santa Catalina Retreat House', NULL, 'activa'),
  ('CASA-18', 'Centro de Espiritualidad Jesús de Nazareth', 'terceros', 'Ruta Nacional 16 Km 26,5', NULL, 'Puerto Tirol', '3505', 'Chaco', 'Argentina', 'Arquidiócesis De Resistencia', 'Jesus de Nazaret', NULL, 'activa'),
  ('CASA-19', 'Casa Divino Amor', 'terceros', 'Felipe Carlos Antonio, Beltrame 5617', NULL, 'Córdoba', '5019', 'Córdoba', 'Argentina', 'Arquidiócesis De Córdoba', 'Convento Divino Amor', NULL, 'activa'),
  ('CASA-20', 'Padre A.Stefenelli', 'terceros', 'Carlos Pellegrini 145', NULL, 'Gral Roca', '8332', 'Río Negro', 'Argentina', 'Diócesis De Neuquén', 'Carlos Pellegrini 145', NULL, 'activa'),
  ('CASA-21', 'casa Seminario San Pablo IV', 'terceros', 'Bragado 6572', NULL, 'Avellaneda', '1875', 'Buenos Aires', 'Argentina', 'Diócesis De Avellaneda Lanús', 'Seminario Pablo VI, Avellaneda', NULL, 'activa'),
  ('CASA-22', 'I.P.E.T N° 58 Gral  Mosconi', 'terceros', 'San Martín Gral Mosconi', NULL, 'La Puerta', '5137', 'Córdoba', 'Argentina', 'Diócesis De Rafaela', 'https://maps.app.goo.gl/DH3CoGSgGm74nEdWA', NULL, 'activa'),
  ('CASA-23', 'Seminario San José', 'terceros', 'Barracas 4369', NULL, 'Cañon Seco', '9013', 'Santa Cruz', 'Argentina', 'Diócesis De Río Gallegos', NULL, NULL, 'activa'),
  ('CASA-24', 'Escuela Educación Agropecuaria N°8', 'terceros', NULL, NULL, 'Gral San Martín', '3509', 'Chaco', 'Argentina', 'Arquidiócesis De Resistencia', '26° 27'' 18.5004" S 59° 22'' 25.9608" W', NULL, 'activa'),
  ('CASA-25', 'Centro de Capacitación Juan Pablo II', 'terceros', 'Ruta 11, km 1180', NULL, 'Formosa', '3600', 'Formosa', 'Argentina', 'Diócesis De Formosa', 'Centro de Capacitación Integral Juan Pablo II', NULL, 'activa'),
  ('CASA-26', 'Casa Fatima', 'terceros', 'Garupá ruta 12 km 8', NULL, 'Posadas', '3300', 'Misiones', 'Argentina', 'Diócesis De Posadas', 'FÁTIMA - Centro de Espiritualidad SVD', NULL, 'activa'),
  ('CASA-27', 'Ntra Señora del Transito', 'terceros', 'RP14 3720 Franquin Villanueva y maza', NULL, 'Lulunta Maipú', '5517', 'Mendoza', 'Argentina', 'Arquidiócesis De Mendoza', 'Casa De Retiro Nuestra Señora Del Tránsito', NULL, 'activa'),
  ('CASA-28', 'Casa de ejercicios San Liborio', 'terceros', 'San Martín s/n', 'Mariano I.Losa', 'Mercedes', '3470', 'Corrientes', 'Argentina', 'Arquidiócesis De Corrientes', '29° 22'' 21.126" S 58° 12'' 5.958" W', NULL, 'activa'),
  ('CASA-29', 'Casa Trinidad', 'terceros', 'Pantaleo 85', NULL, 'Gonzalez Catán', '1759', 'Buenos Aires', 'Argentina', 'Diócesis De Gregorio De Lafer', 'Padre Mario Pantaleo 85', NULL, 'activa'),
  ('CASA-30', 'Nuestra Sra d ela Esperanza', 'terceros', 'Dardo Rocha y Manuel Belgrano', NULL, '9 d ejulio', '6500', 'Buenos Aires', 'Argentina', 'Diócesis De 9 De Julio', 'Quinta Ntra. Sra. de la Esperanza', NULL, 'activa'),
  ('CASA-31', 'Colegio Sdo Corazón', 'terceros', 'Francia 1015', NULL, 'Venado Tuerto', '2600', 'Santa Fé', 'Argentina', 'Diócesis De Venado Tuerto', 'Colegio "Sagrado Corazón"', NULL, 'activa'),
  ('CASA-32', 'Casa Divina Misericordia', 'terceros', 'Saniago Derqui 563', NULL, 'Villa Allende', '5105', 'Córdoba', 'Argentina', 'Arquidiócesis De Córdoba', 'Capilla Nuestra Señora De La Misericordia', NULL, 'activa'),
  ('CASA-33', 'Casa de retiro San Clemente(redentoristas)', 'terceros', 'asunción 685', NULL, 'Resistencia', '3508', 'Chaco', 'Argentina', 'Arquidiócesis De Resistencia', 'Casa de Retiros San Clemente', NULL, 'activa'),
  ('CASA-34', 'Casa Belen', 'terceros', 'Bartolome Mitre y julio Argentino roca', NULL, 'Las Vertientes', '5839', 'Córdoba', 'Argentina', 'Diócesis De Río Cuarto', 'Bartolomé Mitre & Julio Argentino Roca', NULL, 'activa'),
  ('CASA-35', 'Casa de Espiritualidad Inmacuada Virgen de Caná', 'terceros', 'Salta 749', NULL, 'Álvarez', '2107', 'Santa Fé', 'Argentina', 'Arquidiócesis De Santa Fe De', 'Casa De Espiritualidad "Inmaculada Virgen De Caná" (MEC)', NULL, 'activa'),
  ('CASA-36', 'Ntra Señora de Nazareth', 'terceros', 'Av.Central Malvinas Argentinas 1010', NULL, 'San Nicolás', '2900', 'Buenos Aires', 'Argentina', 'Diócesis De San Nicolás De Lo', 'Casa De Retiros Nuestra Señora Del Nazareth', NULL, 'activa'),
  ('CASA-37', 'Abadia Ntra Sra de la Esperanza', 'terceros', 'ruta nacional 34 km 231 y 1/2', NULL, 'Rafaela', '2300', 'Santa Fé', 'Argentina', 'Diócesis De Rafaela', 'Abadía Nuestra Señora de la Esperanza', NULL, 'activa'),
  ('CASA-38', 'Ntra Sra de la Misericordia', 'terceros', 'Gaspar Campos 3101', NULL, 'San Miguel', '1663', 'Buenos Aires', 'Argentina', 'Diócesis De San Miguel', 'Casa de Retiros Espirituales "Nuestra Señora de la Misericordia"', NULL, 'activa'),
  ('CASA-39', 'Casa Tres Corazones', 'terceros', 'Tronador 1358', NULL, 'Neuquén', '8300', 'Neuquén', 'Argentina', 'Diócesis De Neuquén', 'Casa de Retiro - Tres Corazones', NULL, 'activa'),
  ('CASA-40', 'Casa Nazareth', 'terceros', 'El Tordillo', NULL, 'Comodoro Rivadavia', '9000', 'Chubut', 'Argentina', 'Diócesis De Comodoro Rivadavia', NULL, NULL, 'activa'),
  ('CASA-41', 'Instituto Cristo Rey', 'terceros', 'Virgen del Rosario 113', NULL, 'Roldán', '2134', 'Santa Fé', 'Argentina', 'Arquidiócesis De Rosario', 'Instituto Cristo Rey', NULL, 'activa'),
  ('CASA-42', 'EFA San Corrado', 'terceros', 'Ruta 17 nueve de julio', NULL, 'El Dorado', '3380', 'Misiones', 'Argentina', 'Diócesis De Puerto Iguazú', 'EFA 9 De Julio San Corrado', NULL, 'activa'),
  ('CASA-43', 'Casa de Oración Sauce Punco', 'terceros', '7km por Dean Funes x ruta 16', NULL, 'Dean Funes', '5200', 'Córdoba', 'Argentina', 'Arquidiócesis De Córdoba', 'Casa de Retiro Prelatura Deán Funes', NULL, 'activa'),
  ('CASA-44', 'Casa de Nazareh', 'terceros', 'Castelli 595', NULL, 'Ciudadela', '1702', 'C.A.B.A', 'Argentina', 'Arquidiócesis De Buenos Aires', 'Castelli 595', NULL, 'activa'),
  ('CASA-45', 'Seminario Metropolitano-"San Buenaventura"', 'terceros', 'Mitre 892', NULL, 'Salta', '4400', 'Salta', 'Argentina', 'Arquidiócesis De Salta', 'Seminario Metropolitano "San Buenaventura"', NULL, 'activa'),
  ('CASA-46', 'Casa de Encuentro Ntra Sra de Guadalupe', 'terceros', 'Piedras 7150', NULL, 'Santa Fé', '3004', 'Santa Fé', 'Argentina', 'Arquidiócesis De Santa Fe De', 'Casa de Encuentros Nuestra Señora de Guadalupe - Casa de Retiros Espirituales', NULL, 'activa'),
  ('CASA-47', 'Centro Pastoral', 'terceros', 'Pergamino 1243', NULL, 'Oberá', '3360', 'Misiones', 'Argentina', 'Diócesis De Oberá', 'Centro Pastoral: Alojamiento-casa de retiro.', NULL, 'activa'),
  ('CASA-48', 'Casa Jericó', 'terceros', 'Ruta N 9,km 1121', NULL, 'Santiago del Estero', '4201', 'Santiago del Estero', 'Argentina', 'Diócesis De Santiago Del Estero', 'Jericó', NULL, 'activa'),
  ('CASA-49', 'Casa Juan Pablo II', 'terceros', 'Ruta 11 km 1180', NULL, 'Formosa', '3600', 'Formosa', 'Argentina', 'Diócesis De Formosa', 'Centro Juan Pablo II', NULL, 'activa'),
  ('CASA-50', 'Casa San Miguel', 'terceros', 'Carlos Pellegrini 152 cruce ruta 22', NULL, 'Río Negro', '8332', 'Río Negro', 'Argentina', 'Diócesis De Alto Valle De Río', 'Colegio San Miguel', NULL, 'activa'),
  ('CASA-51', 'Casa Sacerdotal Cura Brochero', 'terceros', 'ruta 51 km 21-Campo Quijano', NULL, 'Salta', '4423', 'Salta', 'Argentina', 'Arquidiócesis De Salta', 'Casa Sacerdotal Cura Brochero', NULL, 'activa'),
  ('CASA-52', 'EFA San Wendelino', 'terceros', 'Paraje Capíovisiño', NULL, 'Capioví', '3324', 'Misiones', 'Argentina', 'Diócesis De Puerto Iguazú', 'Escuela de la Familia Agrícola (EFA) San Wendelino', NULL, 'activa'),
  ('CASA-53', 'Casa de retiro, capacitación y servicio "Eduardo Bonnin Aguiló". Fundación Racimo', 'terceros', 'Barrio San Jorge', NULL, 'Formosa', '3600', 'Formosa', 'Argentina', 'Diócesis De Formosa', 'Fundación Racimo', NULL, 'activa'),
  ('CASA-54', 'Casa Itatí', 'terceros', 'Calle 6 Esquina 19', NULL, 'Avellaneda', '3561', 'Santa Fé', 'Argentina', 'Diócesis De Reconquista', 'Casa Itatí', NULL, 'activa'),
  ('CASA-55', 'Casa San Pablo Apóstol', 'terceros', 'Calle 620 N° 2155', NULL, 'El Pato', '1893', 'Buenos Aires', 'Argentina', 'Diócesis De Quilmes', 'Casa De Retiros San Pablo Apostol', NULL, 'activa'),
  ('CASA-56', 'Casa San José', 'terceros', 'Velez Sarfield 450', NULL, 'Martínez', NULL, 'Buenos Aires', 'Argentina', 'Arquidiócesis De Buenos Aires', 'Vélez Sársfield 450', NULL, 'activa'),
  ('CASA-57', 'Cas Divina Providencia', 'terceros', 'Casuarinas 2270', NULL, 'Claypole', '1849', 'Buenos Aires', 'Argentina', 'Diócesis De Lomas De Zamora', 'Casa de Ejercicios Espirituales Ntra. Sra. de la Divina Providencia ("El Castillo")', NULL, 'activa'),
  ('CASA-58', 'Casa Nuestra Señora de la Esperanza', 'terceros', 'America 4015', NULL, 'San Justo', '1754', 'Buenoas Aires', 'Argentina', 'Diócesis De San Justo', 'Ntra. Sra. De la Esperanza', NULL, 'activa'),
  ('CASA-59', 'Parroquia Sdo Corazón de Jesús', 'terceros', 'Av.San Martín 235', NULL, 'Puerto San Julián', '9310', 'Santa Cruz', 'Argentina', 'Diócesis De Río Gallegos', 'Parroquia del Sagrado Corazon de Jesus', NULL, 'activa'),
  ('CASA-60', 'Seminario San Leonardo Murialdo', 'terceros', 'Juan xxIII 828', NULL, 'Villa Bosch', '1682', 'Buenos Aires', 'Argentina', 'Diócesis De San Martín', 'Juan XXIII 828', NULL, 'activa'),
  ('CASA-61', 'Casa Vocacional San José', 'terceros', 'Av. Monseñor Rosch 4639', NULL, 'Concordia', '3200', 'Entre Ríos', 'Argentina', 'Diócesis De Concordia', 'Centro Vocacional San José', NULL, 'activa'),
  ('CASA-62', 'Centro El Salvador Mariapolis', 'terceros', 'Pedro Londero 3445', NULL, 'Paraná', '3100', 'Entre Ríos', 'Argentina', 'Arquidiócesis De Paraná', 'Mariapolis Center "El Salvador"', NULL, 'activa'),
  ('CASA-63', 'La Inmaculada Virgen de Cana', 'terceros', 'Salta 749', NULL, 'Pueblo Esther', '2126', 'Santa Fé', 'Argenina', 'Arquidiócesis De Rosario', 'Pueblo Esther', NULL, 'activa'),
  ('CASA-64', 'Oasis del Espíritu Santo', 'terceros', 'Garupá RN 12, 81', NULL, 'Garupá', '3304', 'Misiones', 'Argentina', 'Diócesis De Posadas', 'Oasis Del Espíritu', NULL, 'activa'),
  ('CASA-65', 'Casa de retiro Juan Pablo II', 'terceros', 'Ruta 16 Km. 23,5', NULL, 'Resistencia', '3503', 'Chaco', 'Argentina', 'Arquidiócesis De Resistencia', 'Casa de Retiros Juan Pablo II', NULL, 'activa'),
  ('CASA-66', 'EFA Cristo Rey', 'terceros', 'Tamanduá', NULL, 'Los Helechos', '3361', 'Misiones', 'Argentina', 'Diócesis De Oberá', 'EFA Cristo Rey De Tamanduá Los Helechos', NULL, 'activa'),
  ('CASA-67', 'Casa Estudiantil N° 5009', 'terceros', 'Av. Guillermo Rawson 9120', NULL, 'Playa Unión-Rawson', '9103', 'Chubut', 'Argentina', NULL, 'Casa Estudiantil N° 5009', NULL, 'activa'),
  ('CASA-68', 'Casa de retiro Ntra sra de Luján', 'terceros', 'Calle 8 calle 54 E/ 52 y 53', NULL, 'Villa Elisa', '1894', 'Buenos Aires', 'Argentina', 'Arquidiócesis De La Plata', 'Casa Nuestra Señora De Lujan', NULL, 'activa'),
  ('CASA-69', 'Casa Encuentro Cristo Redentor', 'terceros', 'Av.Remirez 2735', NULL, 'Paraná', NULL, 'Entre Ríos', 'Argentina', 'Arquidiócesis De Paraná', 'Av. Francisco Ramírez 2735', NULL, 'activa'),
  ('CASA-70', 'Casa de Ejerciccios Espirituales San Ignacio d eLoyola', 'terceros', 'Garupá', NULL, 'Garupá', '3304', 'Misiones', 'Argentina', 'Diócesis De Posadas', 'Casa De Ejercicios Espirituales "San Ignacio De Loyola"', NULL, 'activa'),
  ('CASA-71', 'Casa Hermanas Adoratrices', 'terceros', 'Heredia 954', NULL, 'Villa Lynch', '1672', 'Buenos Aires', 'Argentina', 'Diócesis De San Martín', 'Casa de Retiros de las Hnas Adoratrices', NULL, 'activa'),
  ('CASA-72', 'Casa San Antonio de Obligado', 'terceros', 'San Antonio de Obligado', NULL, 'Santa Fé', '3587', 'Santa Fé', 'Argentina', 'Diócesis De Reconquista', 'San Antonio de Obligado', NULL, 'activa'),
  ('CASA-73', 'Seminario Mayor', 'terceros', 'Av.Sarmiento 841', NULL, 'San miguel de Túcuman', '4000', 'San Miguel de Tucumán', 'Argentina', 'Arquidiócesis De Tucumán', 'Seminario Mayor Arquidiocesano - Nuestra Señora de la Merced y San José', NULL, 'activa'),
  ('CASA-74', 'Santuario Don Bosco', 'terceros', 'Figueroa Urmenio  del Carmen 3046', NULL, 'Neuquén', '8300', 'Neuquén', 'Argentina', 'Diócesis De Neuquén', 'Santuario Don Bosco', NULL, 'activa'),
  ('CASA-75', 'Centro de Retiros', 'terceros', 'Gral Guemes 139', NULL, 'La Caldera', '4401', 'Salta', 'Argentina', 'Arquidiócesis De Salta', 'Casa de Retiros Espirituales de Comunidad Redentorista', NULL, 'activa'),
  ('CASA-76', 'Casa Salesiana Dean Funes', 'terceros', 'Don Bosco 350', NULL, 'Comodoro', '9000', 'Comodoro Rivadavia', 'Argentina', 'Diócesis De Comodoro Rivadavia', 'Colegio Dean Funes', NULL, 'activa'),
  ('CASA-77', 'Casa Las Mercedes', 'terceros', 'Manucho Zona rural', NULL, 'Manucho', '3032', 'Santa Fé', 'Argentina', 'Arquidiócesis De Santa Fe De', 'Estancia Las Mercedes - Manucho', NULL, 'activa'),
  ('CASA-78', 'Casa de Descanso', 'terceros', 'Teniente Espinosa y ruta 1', NULL, 'Apostoles', '3350', 'Misiones', 'Argentina', 'Diócesis De Posadas', 'https://maps.app.goo.gl/mLnJa5u2QWWXikDU7', NULL, 'activa'),
  ('CASA-79', 'Obispado d eRío Gallegos', 'terceros', 'Errazuriz 53', NULL, 'Río Gallegos', '9400', 'Santa Cruz', 'Argentina', 'Diócesis De Río Gallegos', 'Roman Catholic Diocese of Río Gallegos', NULL, 'activa'),
  ('CASA-80', 'Colegio San José La Porciuncúla', 'terceros', 'Madre Transito Cabanilla 350', NULL, 'San Agustín', '5191', 'Córdoba', 'Argentina', 'Arquidiócesis De Córdoba', 'San jose school', NULL, 'activa'),
  ('CASA-81', 'Casa de retiro Padre J.Rodriguez', 'terceros', 'Ruta prov.2 km 18', NULL, 'Recreo', '3014', 'Santa Fé', 'Argentina', 'Arquidiócesis De Santa Fe De', 'https://maps.app.goo.gl/EUAXJgTQ9GPA4Mhc8', 'Cerrado.', 'activa'),
  ('CASA-82', 'Casa Belén', 'terceros', 'Ruta de acceso, 1km', NULL, 'Río Cuarto', NULL, 'Córdoba', 'Argentina', 'Diócesis De Río Cuarto', NULL, NULL, 'activa'),
  ('CASA-83', 'Casa Belen de Ejercicios Espirituales', 'terceros', 'Unnamed Road', NULL, 'Yerba Buena', '4107', 'Tucumán', 'Argentina', 'Arquidiócesis De Tucumán', 'Casa Belen de Ejercicios Espirituales', NULL, 'activa'),
  ('CASA-84', 'CasaTinkunaco', 'terceros', '30 de Septiembre 149', NULL, 'La Rioja', '5300', 'La Rioja', 'Argentina', 'Diócesis De La Rioja', '29° 24'' 51.3072" S 66° 53'' 6.1555" W', NULL, 'activa'),
  ('CASA-85', 'Hermana Josefinas', 'terceros', 'Las Heras 368', NULL, 'San Miguel', '4000', 'S.Miguel d eTucumán', 'Argentina', 'Arquidiócesis De Tucumán', 'Residencia Hermanas Josefinas', NULL, 'activa'),
  ('CASA-86', 'Casa Leon XXIII', 'terceros', 'Bodereau 7850', NULL, 'Córdoba', '5018', 'Córdoba', 'Argentina', 'Arquidiócesis De Córdoba', 'Leon XIII School', NULL, 'activa'),
  ('CASA-87', 'Casa San Pablo', 'terceros', 'Coronel Suarez 359', NULL, 'Salta', '4400', 'Salta', 'Argentina', 'Arquidiócesis De Salta', 'Cnel. Suárez 359', NULL, 'activa'),
  ('CASA-88', 'Stella Maris', 'terceros', 'Ruta Prov.N° 11 km 33', NULL, 'Valle María', '3101', 'Enre Ríos', 'Argentina', 'Arquidiócesis De Paraná', 'Stella maris', NULL, 'activa'),
  ('CASA-89', 'Casa María Reina', 'terceros', 'Aconquija 268', NULL, 'Róldan', '2134', 'Santa Fé', 'Argentina', 'Arquidiócesis De Rosario', 'Casa de ejercicios espirituales María Reina', NULL, 'activa'),
  ('CASA-90', 'Casa Santa Margarita', 'terceros', 'Ruta 7 Chacra 38 calle Santa Margarita s/N', NULL, 'Rawson', '9103', 'Chubut', 'Argentina', 'Arquidiócesis De Bahía Blanca', 'Casa de Retiros y Encuentros Santa Margarita', NULL, 'activa'),
  ('CASA-91', 'Casa de Retiro', 'terceros', 'Ruta Nacional N°33, km. 777 (a 22 km)', NULL, 'Zavalla', '2125', 'Santa Fé', 'Argentina', 'Arquidiócesis De Rosario', 'Casa de Retiro en Zaballa', NULL, 'activa'),
  ('CASA-92', 'Casa de Retiro Parroquia San Antonio', 'terceros', NULL, NULL, 'San Martín', '3509', 'Chaco', 'Argentina', 'Arquidiócesis De Resistencia', 'Parroquia San Antonio', NULL, 'activa'),
  ('CASA-93', 'Centro de retiro y campamentos Asc.de la Iglesia Anglicana', 'terceros', NULL, NULL, 'La Caldera', '4401', 'Salta', 'Argentina', NULL, '24° 43'' 51.8768" S 65° 22'' 46.6266" W', NULL, 'activa')
ON CONFLICT (codigo_interno) WHERE codigo_interno IS NOT NULL DO UPDATE
  SET nombre          = EXCLUDED.nombre,
      tipo_propiedad  = EXCLUDED.tipo_propiedad,
      direccion_calle = EXCLUDED.direccion_calle,
      direccion_nro   = EXCLUDED.direccion_nro,
      ciudad          = EXCLUDED.ciudad,
      cp              = EXCLUDED.cp,
      provincia       = EXCLUDED.provincia,
      pais            = EXCLUDED.pais,
      diocesis        = EXCLUDED.diocesis,
      link_maps       = EXCLUDED.link_maps,
      notas           = EXCLUDED.notas,
      estado          = 'activa',
      fecha_baja      = NULL,
      updated_at      = now();

COMMIT;

-- ─── Verification (run separately after commit) ───────────────────────────────
-- SELECT estado, count(*) FROM public.casas_retiro GROUP BY estado;
-- SELECT codigo_interno, nombre, tipo_propiedad, ciudad, provincia FROM public.casas_retiro
--   WHERE estado='activa' ORDER BY codigo_interno;
