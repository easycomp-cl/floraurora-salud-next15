"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarClock, DollarSign, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DashboardMetricKey =
  | "totalAppointments"
  | "completedAppointments"
  | "totalRevenue"
  | "activeUsers"
  | "activeProfessionals"
  | "newUsers";

interface DashboardMetric {
  id: DashboardMetricKey;
  label: string;
  helper: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  format: (value: number) => string;
}

interface MetricsResponse {
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  activeUsers: number;
  activeProfessionals: number;
  newUsers: number;
}

const quickActions = [
  {
    id: "users",
    title: "Gestionar usuarios",
    description: "Crear, editar y asignar roles",
    href: "/admin/users",
  },
  {
    id: "professionals",
    title: "Gestionar profesionales",
    description: "Supervisar perfiles y horarios",
    href: "/admin/professionals",
  },
  {
    id: "appointments",
    title: "Ver agenda completa",
    description: "Controlar disponibilidad y sesiones",
    href: "/admin/appointments",
  },
] as const;

const metricDefinitions: DashboardMetric[] = [
  {
    id: "totalAppointments",
    label: "Citas totales",
    helper: "Periodo seleccionado",
    icon: CalendarClock,
    format: (value) => value.toLocaleString("es-CL"),
  },
  {
    id: "completedAppointments",
    label: "Citas completadas",
    helper: "Marcadas como finalizadas",
    icon: BarChart3,
    format: (value) => value.toLocaleString("es-CL"),
  },
  {
    id: "totalRevenue",
    label: "Ingresos",
    helper: "Pagos registrados",
    icon: DollarSign,
    format: (value) =>
      new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      }).format(value),
  },
  {
    id: "activeUsers",
    label: "Usuarios activos",
    helper: "Perfiles habilitados",
    icon: Users,
    format: (value) => value.toLocaleString("es-CL"),
  },
  {
    id: "activeProfessionals",
    label: "Profesionales activos",
    helper: "Con agenda disponible",
    icon: BarChart3,
    format: (value) => value.toLocaleString("es-CL"),
  },
  {
    id: "newUsers",
    label: "Nuevos usuarios",
    helper: "Registrados en el periodo",
    icon: Users,
    format: (value) => value.toLocaleString("es-CL"),
  },
];

const rangeOptions = [
  { id: "30", label: "Últimos 30 días" },
  { id: "60", label: "Últimos 60 días" },
  { id: "90", label: "Últimos 90 días" },
  { id: "365", label: "Últimos 12 meses" },
] as const;

export function AdminOverview() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<(typeof rangeOptions)[number]["id"]>("30");

  const queryString = useMemo(() => {
    const days = Number(range);
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    return `from=${from.toISOString()}&to=${to.toISOString()}`;
  }, [range]);

  useEffect(() => {
    let abort = false;
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `/api/admin/reports/metrics?${queryString}`,
          {
            cache: "no-store",
          }
        );
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(
            payload?.error ?? "No se pudieron cargar las métricas"
          );
        }
        const payload = (await response.json()) as MetricsResponse;
        if (!abort) {
          setMetrics(payload);
        }
      } catch (err) {
        if (!abort) {
          const message =
            err instanceof Error
              ? err.message
              : "Error inesperado al obtener métricas.";
          setError(message);
        }
      } finally {
        if (!abort) {
          setIsLoading(false);
        }
      }
    };

    fetchMetrics();
    return () => {
      abort = true;
    };
  }, [queryString]);

  return (
    <section className="space-y-8">
      <header className="rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Panel general
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Monitorea la salud del ecosistema en un vistazo y toma acciones
              clave apoyado con datos en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Periodo:</span>
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              value={range}
              onChange={(event) =>
                setRange(
                  event.target.value as (typeof rangeOptions)[number]["id"]
                )
              }
            >
              {rangeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metricDefinitions.map((metric) => {
          const value = metrics ? (metrics[metric.id] ?? 0) : 0;
          return (
            <Card key={metric.id} className="border-gray-100 bg-white shadow">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <metric.icon className="size-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </CardTitle>
                  <p className="text-2xl font-semibold text-gray-900">
                    {isLoading && !metrics ? "—" : metric.format(value)}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">
                {metric.helper}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-gray-100 bg-white shadow">
        <CardHeader className="gap-2">
          <CardTitle className="text-xl text-gray-900">
            Acciones rápidas
          </CardTitle>
          <CardDescription>
            Accede directamente a las áreas de gestión más consultadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <div
              key={action.id}
              className="flex flex-col justify-between rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-4 shadow-sm transition hover:border-primary/40 hover:bg-white"
            >
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {action.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <Button asChild className="mt-4 w-fit">
                <Link href={action.href}>Ir ahora</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
