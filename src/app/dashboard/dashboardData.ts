export interface AppointmentData {
  id: string;
  servicio: string;
  profesional: string;
  fecha: string;
  hora: string;
  duracion: string;
  monto: number;
  url?: string; // opcional
  boleta?: string; // opcional
  estado: 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Completada';
}

export const appointmentsData: AppointmentData[] = [
  {
    id: "APT001",
    servicio: "Terapia Individual",
    profesional: "Dra. Aurora Flores",
    fecha: "2025-11-05",
    hora: "15:00",
    duracion: "50 min",
    monto: 45000,
    url: "https://meet.google.com/abc-defg-hij",
    boleta: "#B001",
    estado: "Confirmada"
  },
  {
    id: "APT002",
    servicio: "Consulta Psicológica",
    profesional: "Dr. Juan Pérez",
    fecha: "2025-11-07",
    hora: "10:30",
    duracion: "45 min",
    monto: 40000,
    url: "https://meet.google.com/xyz-uvwx-yz",
    boleta: "#B002",
    estado: "Pendiente"
  },
  {
    id: "APT003",
    servicio: "Terapia de Pareja",
    profesional: "Dra. María González",
    fecha: "2025-11-10",
    hora: "16:15",
    duracion: "60 min",
    monto: 60000,
    url: "https://store.steampowered.com/app/730/CounterStrike_2/",
    boleta: "#B003",
    estado: "Completada"
  },
  {
  id: "APT004",
    servicio: "Libertad",
    profesional: "Lord sith. Palpatine",
    fecha: "2025-11-10",
    hora: "16:15",
    duracion: "60 min",
    monto: 66,
    url: "https://www.youtube.com/watch?v=sVadWtFKOSI",
    boleta: "#B003",
    estado: "Completada"
  }

];