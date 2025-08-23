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
    url: "/about",
    icon: HeartPulse,
  },
  {
    name: "Servicios",
    url: "/services",
    icon: MonitorCog,
    subItems: [
      { name: "Psicoterapia Infanto Juvenil", url: "/services" },
      { name: "Psicoterapia Adultos", url: "/services" },
      { name: "Terapia de Pareja", url: "/services" },
      { name: "Evaluación y Psicodiagnóstico", url: "/services" },
    ],
  },
  {
    name: "Profesionales",
    url: "/professionals",
    icon: Briefcase,
  },
  
  { name: "Contacto", url: "/contact", icon: AtSign },
];

export const authenticatedNavItems: NavItem[] = [
  { name: "Dashboard", url: "/dashboard", icon: Settings },
  { name: "Citas", url: "/dashboard/appointments", icon: Calendar },
  { name: "Mi Perfil", url: "/dashboard/profile", icon: User },
  { name: "Sesiones", url: "/dashboard/sessions", icon: Calendar },
  { name: "Mensajes", url: "/dashboard/messages", icon: MessageSquare },
];
