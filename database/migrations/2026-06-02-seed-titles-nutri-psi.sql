-- Seed idempotente: títulos y especialidades para Psiquiatría/Nutrición
-- Evita duplicados por:
--   1) professional_titles.title_name
--   2) specialties.name + specialties.title_id

BEGIN;

-- 1) Insertar títulos si no existen
INSERT INTO public.professional_titles (title_name)
SELECT v.title_name
FROM (
  VALUES
    ('Psiquiatría'),
    ('Nutricionista'),
    ('Nutriología')
) AS v(title_name)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.professional_titles pt
  WHERE pt.title_name = v.title_name
);

-- 2) Insertar especialidades asociadas si no existen
INSERT INTO public.specialties (
  title_id,
  name,
  duration_minutes,
  minimum_amount,
  maximum_amount,
  is_active
)
SELECT
  pt.id AS title_id,
  v.name,
  55 AS duration_minutes,
  35000 AS minimum_amount,
  NULL::numeric AS maximum_amount,
  true AS is_active
FROM (
  VALUES
    ('Psiquiatría', 'Psiquiatría'),
    ('Nutricionista', 'Nutricionista'),
    ('Nutriología', 'Nutriología')
) AS v(title_name, name)
JOIN public.professional_titles pt
  ON pt.title_name = v.title_name
WHERE NOT EXISTS (
  SELECT 1
  FROM public.specialties s
  WHERE s.title_id = pt.id
    AND s.name = v.name
);

COMMIT;
