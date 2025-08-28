import { Home, User, HeartPulse, Briefcase, AtSign, Settings, Calendar, MessageSquare, MonitorCog } from "lucide-react";

export interface NavSubItem {
  label: string;
  href: string;
  description?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: any; // Componente de icono de Lucide
  description?: string;
  subItems?: NavSubItem[];
}

export const navItems: NavItem[] = [
  {
    label: "Inicio",
    href: "/",
    icon: Home,
    description: "Página principal de FlorAurora Salud",
  },
  {
    label: "Servicios",
    href: "/services",
    icon: MonitorCog,
    description: "Nuestros servicios de psicología",
    subItems: [
      {
        label: "Psicoterapia Infanto Juvenil",
        href: "/services",
        description: "Terapia especializada para niños y adolescentes"
      },
      {
        label: "Psicoterapia Adultos",
        href: "/services",
        description: "Terapia para adultos"
      },
      {
        label: "Terapia de Pareja",
        href: "/services",
        description: "Terapia de pareja y relaciones"
      },
      {
        label: "Evaluación y Psicodiagnóstico",
        href: "/services",
        description: "Evaluaciones psicológicas completas"
      },
    ]
  },
  {
    label: "Profesionales",
    href: "/professionals",
    icon: Briefcase,
    description: "Conoce a nuestro equipo",
  },
  {
    label: "Acerca de",
    href: "/about",
    icon: HeartPulse,
    description: "Información sobre FlorAurora Salud",
  },
  {
    label: "Contacto",
    href: "/contact",
    icon: AtSign,
    description: "Contáctanos",
  },
];

export const authenticatedNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Settings,
    description: "Panel principal",
  },
  {
    label: "Citas",
    href: "/dashboard/appointments",
    icon: Calendar,
    description: "Gestiona tus citas",
  },
  {
    label: "Sesiones",
    href: "/dashboard/sessions",
    icon: Calendar,
    description: "Historial de sesiones",
  },
  {
    label: "Perfil",
    href: "/dashboard/profile",
    icon: User,
    description: "Tu perfil personal",
  },
];
