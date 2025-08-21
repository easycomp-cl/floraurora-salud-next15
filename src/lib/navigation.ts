import { Home, User, HeartPulse, Briefcase, AtSign, Settings, Calendar, MessageSquare, MonitorCog } from "lucide-react";

export interface NavItem {
  name: string;
  url: string;
  icon: any;
  subItems?: NavSubItem[];
}

export interface NavSubItem {
  name: string;
  url: string;
}

export const navItems: NavItem[] = [
  { name: "Inicio", url: "/", icon: Home },
  {
    name: "Nosotros",
    url: "/about-us",
    icon: HeartPulse,
  },
  {
    name: "Servicios",
    url: "#",
    icon: MonitorCog,
    subItems: [
      { name: "Psicoterapia Infanto Juvenil", url: "#web" },
      { name: "Psicoterapia Adultos", url: "#soporte" },
      { name: "Terapia de Pareja", url: "#soporte" },
      { name: "Evaluación y Psicodiagnóstico", url: "#consultoria" },
    ],
  },
  {
    name: "Profesionales",
    url: "/professionals",
    icon: Briefcase,
  },
  
  { name: "Contacto", url: "/contact-us", icon: AtSign },
];

export const authenticatedNavItems: NavItem[] = [
  { name: "Dashboard", url: "/dashboard", icon: Settings },
  { name: "Agendar Cita", url: "/agendar-cita", icon: Calendar },
  { name: "Mi Perfil", url: "/profile", icon: User },
  { name: "Sesiones", url: "/sessions", icon: Calendar },
  { name: "Mensajes", url: "/messages", icon: MessageSquare },
];
