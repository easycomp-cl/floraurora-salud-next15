export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'patient' | 'professional';
  patient_id?: string; // Opcional, si el usuario es un paciente
  professional_id?: string; // Opcional, si el usuario es un profesional
};

export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'patient' | 'professional';
  // Agrega aquí cualquier otro campo que desees de la tabla 'users' o metadatos
};
