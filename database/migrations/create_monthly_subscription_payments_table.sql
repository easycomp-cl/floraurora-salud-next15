-- Crear tabla para registrar pagos mensuales de planes de profesionales
-- Esta tabla es independiente de la tabla payments que maneja pagos de appointments

CREATE TABLE IF NOT EXISTS public.monthly_subscription_payments (
  id BIGSERIAL PRIMARY KEY,
  professional_id INTEGER NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CLP',
  provider TEXT NOT NULL DEFAULT 'webpay_plus',
  provider_payment_id TEXT,
  provider_payment_status TEXT NOT NULL DEFAULT 'pending',
  buy_order TEXT NOT NULL UNIQUE,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- Fecha de expiración del plan después de este pago
  receipt_url TEXT,
  raw_response JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_monthly_subscription_payments_professional_id 
  ON public.monthly_subscription_payments(professional_id);
CREATE INDEX IF NOT EXISTS idx_monthly_subscription_payments_buy_order 
  ON public.monthly_subscription_payments(buy_order);
CREATE INDEX IF NOT EXISTS idx_monthly_subscription_payments_provider_payment_id 
  ON public.monthly_subscription_payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_monthly_subscription_payments_payment_date 
  ON public.monthly_subscription_payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_subscription_payments_status 
  ON public.monthly_subscription_payments(provider_payment_status);

-- Comentarios para documentación
COMMENT ON TABLE public.monthly_subscription_payments IS 'Registra los pagos mensuales realizados por profesionales para mantener su plan activo';
COMMENT ON COLUMN public.monthly_subscription_payments.professional_id IS 'ID del profesional que realiza el pago';
COMMENT ON COLUMN public.monthly_subscription_payments.amount IS 'Monto del pago en la moneda especificada';
COMMENT ON COLUMN public.monthly_subscription_payments.currency IS 'Moneda del pago (CLP, USD, etc.)';
COMMENT ON COLUMN public.monthly_subscription_payments.provider IS 'Proveedor de pago (webpay_plus, etc.)';
COMMENT ON COLUMN public.monthly_subscription_payments.provider_payment_id IS 'ID del pago en el proveedor (código de autorización de Webpay)';
COMMENT ON COLUMN public.monthly_subscription_payments.provider_payment_status IS 'Estado del pago: pending, succeeded, failed, cancelled';
COMMENT ON COLUMN public.monthly_subscription_payments.buy_order IS 'Orden de compra única para identificar la transacción en Webpay (formato: plan{professional_id}{timestamp})';
COMMENT ON COLUMN public.monthly_subscription_payments.payment_date IS 'Fecha en que se realizó el pago';
COMMENT ON COLUMN public.monthly_subscription_payments.expires_at IS 'Fecha de expiración del plan después de este pago (normalmente 30 días después del pago)';
COMMENT ON COLUMN public.monthly_subscription_payments.raw_response IS 'Respuesta completa del proveedor de pago en formato JSON';
COMMENT ON COLUMN public.monthly_subscription_payments.metadata IS 'Metadatos adicionales del pago (token, ambiente, etc.)';

-- RLS Policies (si se necesita acceso desde el cliente)
ALTER TABLE public.monthly_subscription_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Los profesionales solo pueden ver sus propios pagos
-- La relación es: professionals.id -> users.id -> users.user_id (auth.uid())
CREATE POLICY "Professionals can view their own subscription payments"
  ON public.monthly_subscription_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.professionals p
      JOIN public.users u ON p.id = u.id
      WHERE p.id = monthly_subscription_payments.professional_id
      AND u.user_id = auth.uid()
    )
  );

-- Policy: Solo el sistema puede insertar pagos (a través de API con admin client)
-- Los profesionales no pueden insertar pagos directamente

