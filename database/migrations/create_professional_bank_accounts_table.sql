-- =============================================
-- Tabla professional_bank_accounts
-- Información bancaria del profesional para pagos
-- Email y RUT se obtienen de users (no editables en este formulario)
-- =============================================

-- 0. Crear función set_updated_at si no existe (usada por el trigger)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS public.professional_bank_accounts (
  id SERIAL PRIMARY KEY,
  professional_id INTEGER NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  bank TEXT,
  account_type TEXT,
  account_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professional_id)
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_professional_bank_accounts_professional_id
  ON public.professional_bank_accounts(professional_id);

-- 3. Trigger para updated_at
DROP TRIGGER IF EXISTS trg_professional_bank_accounts_updated_at ON public.professional_bank_accounts;
CREATE TRIGGER trg_professional_bank_accounts_updated_at
  BEFORE UPDATE ON public.professional_bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Comentarios
COMMENT ON TABLE public.professional_bank_accounts IS 'Información bancaria del profesional para transferencias. Email y RUT se obtienen de users.';
COMMENT ON COLUMN public.professional_bank_accounts.professional_id IS 'ID del profesional (relación 1:1)';
COMMENT ON COLUMN public.professional_bank_accounts.bank IS 'Nombre del banco';
COMMENT ON COLUMN public.professional_bank_accounts.account_type IS 'Tipo de cuenta: cuenta corriente, cuenta vista, etc.';
COMMENT ON COLUMN public.professional_bank_accounts.account_number IS 'Número de cuenta';

-- 5. Habilitar RLS
ALTER TABLE public.professional_bank_accounts ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS
-- Profesionales: pueden ver y actualizar su propia información bancaria
DROP POLICY IF EXISTS "Professionals can view own bank account" ON public.professional_bank_accounts;
CREATE POLICY "Professionals can view own bank account"
  ON public.professional_bank_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      INNER JOIN public.users u ON p.id = u.id
      WHERE p.id = professional_bank_accounts.professional_id
        AND u.user_id = auth.uid()
        AND u.role = 3
        AND u.is_active = true
    )
  );

DROP POLICY IF EXISTS "Professionals can insert own bank account" ON public.professional_bank_accounts;
CREATE POLICY "Professionals can insert own bank account"
  ON public.professional_bank_accounts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professionals p
      INNER JOIN public.users u ON p.id = u.id
      WHERE p.id = professional_id
        AND u.user_id = auth.uid()
        AND u.role = 3
        AND u.is_active = true
    )
  );

DROP POLICY IF EXISTS "Professionals can update own bank account" ON public.professional_bank_accounts;
CREATE POLICY "Professionals can update own bank account"
  ON public.professional_bank_accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      INNER JOIN public.users u ON p.id = u.id
      WHERE p.id = professional_bank_accounts.professional_id
        AND u.user_id = auth.uid()
        AND u.role = 3
        AND u.is_active = true
    )
  );

-- Admin: puede ver toda la información bancaria
DROP POLICY IF EXISTS "Admins can view all bank accounts" ON public.professional_bank_accounts;
CREATE POLICY "Admins can view all bank accounts"
  ON public.professional_bank_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
        AND users.role = 1
        AND users.is_active = true
    )
  );

-- 7. Permisos
GRANT SELECT, INSERT, UPDATE ON public.professional_bank_accounts TO authenticated;
