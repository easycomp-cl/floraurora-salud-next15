-- Migración para agregar campos de Google Meet a la tabla appointments
-- Esta migración agrega los campos necesarios para almacenar el enlace de Meet y el ID del evento

-- Agregar columna meet_link si no existe (puede que ya exista)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'meet_link'
    ) THEN
        ALTER TABLE public.appointments 
        ADD COLUMN meet_link text;
        
        COMMENT ON COLUMN public.appointments.meet_link IS 'Enlace de Google Meet para la videollamada de la cita';
    END IF;
END $$;

-- Agregar columna meet_event_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'meet_event_id'
    ) THEN
        ALTER TABLE public.appointments 
        ADD COLUMN meet_event_id text;
        
        COMMENT ON COLUMN public.appointments.meet_event_id IS 'ID del evento en Google Calendar asociado a esta cita';
        
        -- Crear índice para búsquedas rápidas por meet_event_id
        CREATE INDEX IF NOT EXISTS idx_appointments_meet_event_id 
        ON public.appointments(meet_event_id) 
        WHERE meet_event_id IS NOT NULL;
    END IF;
END $$;

-- Crear índice para meet_link si no existe
CREATE INDEX IF NOT EXISTS idx_appointments_meet_link 
ON public.appointments(meet_link) 
WHERE meet_link IS NOT NULL;

