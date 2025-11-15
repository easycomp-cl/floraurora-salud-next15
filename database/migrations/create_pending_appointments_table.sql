-- Tabla temporal para guardar datos de citas pendientes de pago
-- Esta tabla almacena los datos de la cita antes de que se procese el pago
-- Los registros se eliminan automáticamente después de que el pago sea exitoso o expire

CREATE TABLE IF NOT EXISTS public.pending_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buy_order text NOT NULL UNIQUE,
  appointment_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  CONSTRAINT pending_appointments_buy_order_key UNIQUE (buy_order)
);

-- Índice para búsquedas rápidas por buy_order
CREATE INDEX IF NOT EXISTS idx_pending_appointments_buy_order 
  ON public.pending_appointments(buy_order);

-- Índice para limpieza automática de registros expirados
CREATE INDEX IF NOT EXISTS idx_pending_appointments_expires_at 
  ON public.pending_appointments(expires_at);

-- Comentarios
COMMENT ON TABLE public.pending_appointments IS 'Tabla temporal para almacenar datos de citas antes de que se procese el pago. Los registros se eliminan después del pago exitoso o cuando expiran.';
COMMENT ON COLUMN public.pending_appointments.buy_order IS 'Orden de compra única de Webpay (formato: apt{timestamp})';
COMMENT ON COLUMN public.pending_appointments.appointment_data IS 'Datos JSON de la cita pendiente (professional_id, patient_id, date, time, etc.)';
COMMENT ON COLUMN public.pending_appointments.expires_at IS 'Fecha de expiración del registro temporal (típicamente 30 minutos después de la creación)';

-- Habilitar RLS
ALTER TABLE public.pending_appointments ENABLE ROW LEVEL SECURITY;

-- Política: Solo el sistema (usando createAdminServer) puede insertar, leer y eliminar
-- Los usuarios normales no pueden acceder a esta tabla
CREATE POLICY "System can manage pending appointments"
  ON public.pending_appointments
  FOR ALL
  TO authenticated
  USING (false) -- Nadie puede leer directamente
  WITH CHECK (false); -- Nadie puede escribir directamente

-- Nota: Esta tabla se usa solo desde el backend con createAdminServer(),
-- por lo que las políticas RLS son restrictivas. El acceso se hace desde el servidor.

