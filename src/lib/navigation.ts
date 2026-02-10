import React from "react";
import {
  Home,
  User,
  HeartPulse,
  Briefcase,
  AtSign,
  LayoutDashboard,
  Calendar,
  MonitorCog,
  Clock,
  Users,
  BarChart3,
  ShieldCheck,
  Settings2,
  CreditCard,
  DollarSign,
  FileText,
  PlayCircle,
  Star,
} from "lucide-react";
import SIIIcon from "@/components/icons/SIIIcon";

export interface NavSubItem {
  label: string;
  href: string;
  description?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>; // Componente de icono de Lucide
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
    label: "Nosotros",
    href: "/about",
    icon: HeartPulse,
    description: "Información sobre FlorAurora Salud",
  },
  {
    label: "Servicios",
    href: "/services",
    icon: MonitorCog,
    description: "Nuestros servicios de psicología",
    subItems: [
      {
        label: "Psicoterapia Infanto Juvenil",
        href: "/services#psicoterapia-infanto-juvenil",
        description: "Terapia especializada para niños y adolescentes"
      },
      {
        label: "Psicoterapia Adultos",
        href: "/services#psicoterapia-adultos",
        description: "Terapia para adultos"
      },
      {
        label: "Terapia de Pareja",
        href: "/services#terapia-pareja",
        description: "Terapia de pareja y relaciones"
      },
      {
        label: "Evaluación y Psicodiagnóstico",
        href: "/services#evaluacion-psicodiagnostico",
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
    label: "Contacto",
    href: "/contact",
    icon: AtSign,
    description: "Contáctanos",
  },
];

const dashboardNavItem: NavItem = {
  label: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboard,
  description: "Panel principal",
};

const appointmentsNavItem: NavItem = {
  label: "Agendar Cita",
  href: "/dashboard/appointments",
  icon: Calendar,
  description: "Gestiona tus citas",
};

const sessionsNavItem: NavItem = {
  label: "Mis Citas",
  href: "/dashboard/sessions",
  icon: Calendar,
  description: "Historial de citas",
};

const profileNavItem: NavItem = {
  label: "Perfil",
  href: "/dashboard/profile",
  icon: User,
  description: "Tu perfil personal",
};

export const baseAuthenticatedNavItems: NavItem[] = [
  dashboardNavItem,
  sessionsNavItem,
  profileNavItem,
];

export const adminNavigationItems: NavItem[] = [

  {
    label: "Usuarios",
    href: "/admin/users",
    icon: Users,
    description: "Gestiona pacientes, profesionales y administradores",
  },
  {
    label: "Profesionales",
    href: "/admin/professionals",
    icon: Briefcase,
    description: "Administra perfiles y disponibilidad de profesionales",
  },
  {
    label: "Servicios",
    href: "/admin/services",
    icon: MonitorCog,
    description: "Configura servicios y tarifas ofrecidas",
  },
  {
    label: "Reportes",
    href: "/admin/reports",
    icon: BarChart3,
    description: "Estadísticas y reportes descargables",
  },
  {
    label: "Valoraciones",
    href: "/admin/ratings",
    icon: Star,
    description: "Calificaciones y encuestas de satisfacción",
  },
  {
    label: "Configuración",
    href: "/admin/settings",
    icon: Settings2,
    description: "Plantillas, horarios y carrusel del sitio",
  },
  {
    label: "Auditoría",
    href: "/admin/audit",
    icon: ShieldCheck,
    description: "Registro de acciones administrativas",
  },
  {
    label: "Tutoriales",
    href: "/admin/tutorials",
    icon: PlayCircle,
    description: "Gestiona videos tutoriales para profesionales y pacientes",
  },
];

const adminMenuNavItem: NavItem = {
  label: "Panel administrativo",
  href: "/admin",
  icon: LayoutDashboard,
  description: "Accesos rápidos a herramientas administrativas",
  subItems: adminNavigationItems.map((item) => ({
    label: item.label,
    href: item.href,
    description: item.description,
  })),
};

// Elemento de navegación para Tutoriales (disponible para profesionales y admin)
const tutorialsNavItem: NavItem = {
  label: "Tutoriales",
  href: "/dashboard/tutorials",
  icon: PlayCircle,
  description: "Videos de ayuda para el usuario",
};

// Elementos adicionales para profesionales
export const professionalNavItems: NavItem[] = [
  {
    label: "Fichas Clínicas",
    href: "/dashboard/clinical-records",
    icon: FileText,
    description: "Gestiona las fichas clínicas de tus pacientes",
  },
  {
    label: "Mis Horarios",
    href: "/dashboard/schedules",
    icon: Clock,
    description: "Configura tu disponibilidad",
  },
  {
    label: "Mis Precios",
    href: "/dashboard/my-prices",
    icon: DollarSign,
    description: "Gestiona tus precios por especialidad",
  },
  {
    label: "Mi SII",
    href: "/dashboard/my-sii",
    icon: SIIIcon,
    description: "Gestión del Servicio de Impuestos Internos",
  },
  {
    label: "Mi Plan",
    href: "/dashboard/my-plan",
    icon: CreditCard,
    description: "Gestiona tu plan y pagos",
  },
];

// Función para obtener elementos de navegación basados en el rol
export function getAuthenticatedNavItems(userRole?: number): NavItem[] {
  if (userRole === 1) {
    // Admin: Dashboard, Panel administrativo, Tutoriales, Perfil
    return [dashboardNavItem, adminMenuNavItem, tutorialsNavItem, profileNavItem];
  }

  const items = [...baseAuthenticatedNavItems];
  
  if (userRole === 2) {
    items.splice(1, 0, appointmentsNavItem);
  }
  
  // Agregar elementos específicos para profesionales
  if (userRole === 3) {
    items.push(...professionalNavItems);
    // Agregar Tutoriales para profesionales
    items.push(tutorialsNavItem);
  }
  
  return items;
}

// Mantener compatibilidad con el array original
export const authenticatedNavItems: NavItem[] = baseAuthenticatedNavItems;
