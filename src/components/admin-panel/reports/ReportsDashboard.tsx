"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { AdminProfessional, AdminService } from "@/lib/types/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface AppointmentRow {
  id: string;
  scheduled_at: string;
  status: string | null;
  payment_status: string | null;
  patient_name: string | null;
  professional_name: string | null;
  service: string | null;
  area: string | null;
  amount: number | null;
  currency: string | null;
  created_at: string;
  is_rescheduled?: boolean | null;
  rescheduled_at?: string | null;
}

type TabType = "all" | "rescheduled";

type SortField = "scheduled_at" | "service" | "patient_name" | "professional_name" | "status" | "amount" | "id";
type SortDirection = "asc" | "desc";

const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd MMM yyyy HH:mm", { locale: es });
  } catch {
    return value;
  }
};

const defaultRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
};

interface Patient {
  id: number;
  name: string | null;
  last_name: string | null;
}

interface Area {
  id: number;
  title_name: string;
}

export default function ReportsDashboard() {
  const [{ from, to }, setRange] = useState(defaultRange);
  const [professionalId, setProfessionalId] = useState<string>("all");
  const [patientId, setPatientId] = useState<string>("all");
  const [areaId, setAreaId] = useState<string>("all");
  const [serviceQuery, setServiceQuery] = useState("");
  const [allAppointments, setAllAppointments] = useState<AppointmentRow[]>([]);
  const [professionals, setProfessionals] = useState<AdminProfessional[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [allServices, setAllServices] = useState<AdminService[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  
  // Paginación y ordenamiento
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<SortField>("scheduled_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchTerm, setSearchTerm] = useState("");

  const loadProfessionalsAndServices = useCallback(async () => {
    try {
      const [professionalsResponse, servicesResponse, patientsResponse, areasResponse] = await Promise.all([
        fetch("/api/admin/professionals", { cache: "no-store" }),
        fetch("/api/admin/services?onlyActive=false", { cache: "no-store" }),
        fetch("/api/admin/users?role=patient&pageSize=1000", { cache: "no-store" }),
        fetch("/api/admin/professional-titles", { cache: "no-store" }),
      ]);

      if (professionalsResponse.ok) {
        const payload = await professionalsResponse.json();
        setProfessionals(payload.data ?? []);
      }

      if (servicesResponse.ok) {
        const payload = await servicesResponse.json();
        setAllServices(payload.data ?? []);
        setServices(payload.data ?? []);
      }

      if (patientsResponse.ok) {
        const payload = await patientsResponse.json();
        const patientUsers = (payload.data ?? []).map((user: { id: number; name: string | null; last_name: string | null }) => ({
          id: user.id,
          name: user.name,
          last_name: user.last_name,
        }));
        setPatients(patientUsers);
      }

      if (areasResponse.ok) {
        const payload = await areasResponse.json();
        setAreas(payload.data ?? []);
      }
    } catch (error) {
      console.warn("No se pudieron cargar datos:", error);
    }
  }, []);

  // Filtrar servicios cuando cambia el área seleccionada
  useEffect(() => {
    if (areaId === "all") {
      setServices(allServices);
    } else {
      const filteredServices = allServices.filter(
        (service) => service.title_id === Number(areaId)
      );
      setServices(filteredServices);
      // Limpiar servicio seleccionado si no está en la lista filtrada
      if (serviceQuery && !filteredServices.some((s) => s.name === serviceQuery)) {
        setServiceQuery("");
      }
    }
  }, [areaId, allServices, serviceQuery]);

  useEffect(() => {
    loadProfessionalsAndServices();
  }, [loadProfessionalsAndServices]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("from", `${from}T00:00:00Z`);
    params.set("to", `${to}T23:59:59Z`);
    if (professionalId !== "all") {
      params.set("professionalId", professionalId);
    }
    if (patientId !== "all") {
      params.set("patientId", patientId);
    }
    if (areaId !== "all") {
      params.set("areaId", areaId);
    }
    if (serviceQuery) {
      params.set("service", serviceQuery);
    }
    if (activeTab === "rescheduled") {
      params.set("rescheduledOnly", "true");
    }
    return params.toString();
  }, [from, to, professionalId, patientId, areaId, serviceQuery, activeTab]);

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const appointmentsResponse = await fetch(`/api/admin/reports/appointments?${queryString}`, { cache: "no-store" });

      if (!appointmentsResponse.ok) {
        const payload = await appointmentsResponse.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudieron obtener las citas");
      }

      const appointmentsPayload = await appointmentsResponse.json();
      setAllAppointments(appointmentsPayload.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al cargar los reportes.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Resetear página cuando cambian los filtros principales, el tamaño de página o la pestaña
  useEffect(() => {
    setPage(1);
  }, [from, to, professionalId, patientId, areaId, serviceQuery, pageSize, activeTab]);

  const handleExport = async (format: "excel" | "pdf") => {
    try {
      const response = await fetch(`/api/admin/reports/export?${queryString}&format=${format}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo exportar el reporte");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="(.+)"/);
      link.download = match?.[1] ?? `reporte.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al exportar el reporte.";
      setError(message);
    }
  };

  const selectedProfessional = professionals.find(
    (professional) => String(professional.id) === professionalId,
  );

  // Filtrar y ordenar citas
  const filteredAndSortedAppointments = useMemo(() => {
    let filtered = allAppointments;

    // Búsqueda por texto
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (appointment) =>
          appointment.id.toLowerCase().includes(lowerSearch) ||
          appointment.patient_name?.toLowerCase().includes(lowerSearch) ||
          appointment.professional_name?.toLowerCase().includes(lowerSearch) ||
          appointment.service?.toLowerCase().includes(lowerSearch) ||
          appointment.area?.toLowerCase().includes(lowerSearch) ||
          appointment.status?.toLowerCase().includes(lowerSearch)
      );
    }

    // Ordenamiento
    filtered = [...filtered].sort((a, b) => {
      let aValue: string | number | null = null;
      let bValue: string | number | null = null;

      switch (sortField) {
        case "id":
          // Para IDs tipo "APT-00000001", ordenar numéricamente por el número
          const aNum = parseInt(a.id.replace(/\D/g, "")) || 0;
          const bNum = parseInt(b.id.replace(/\D/g, "")) || 0;
          const idComparison = aNum - bNum;
          return sortDirection === "asc" ? idComparison : -idComparison;
        case "scheduled_at":
          aValue = a.scheduled_at;
          bValue = b.scheduled_at;
          break;
        case "service":
          aValue = a.service ?? "";
          bValue = b.service ?? "";
          break;
        case "patient_name":
          aValue = a.patient_name ?? "";
          bValue = b.patient_name ?? "";
          break;
        case "professional_name":
          aValue = a.professional_name ?? "";
          bValue = b.professional_name ?? "";
          break;
        case "status":
          aValue = a.status ?? "";
          bValue = b.status ?? "";
          break;
        case "amount":
          aValue = a.amount ?? 0;
          bValue = b.amount ?? 0;
          break;
      }

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      const comparison = (aValue as number) - (bValue as number);
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [allAppointments, searchTerm, sortField, sortDirection]);

  // Paginación
  const totalPages = useMemo(() => {
    if (pageSize === 0) return 1;
    return Math.max(Math.ceil(filteredAndSortedAppointments.length / pageSize), 1);
  }, [pageSize, filteredAndSortedAppointments.length]);

  const paginatedAppointments = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredAndSortedAppointments.slice(start, end);
  }, [filteredAndSortedAppointments, page, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="h-4 w-4 text-primary" />
    );
  };

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Reportes y control
            </CardTitle>
            <CardDescription>
              Filtra y exporta métricas clave sobre agendamientos y pagos.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("excel")}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter className="h-4 w-4" />
              Filtros
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <div className="space-y-1">
                <Label htmlFor="from">Desde</Label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(event) => setRange((prev) => ({ ...prev, from: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="to">Hasta</Label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(event) => setRange((prev) => ({ ...prev, to: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="area">Área</Label>
                <select
                  id="area"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  value={areaId}
                  onChange={(event) => setAreaId(event.target.value)}
                >
                  <option value="all">Todas</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.title_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="service">Servicio</Label>
                <select
                  id="service"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  value={serviceQuery}
                  onChange={(event) => setServiceQuery(event.target.value)}
                  disabled={areaId === "all"}
                >
                  <option value="">Todos</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="professional">Profesional</Label>
                <select
                  id="professional"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  value={professionalId}
                  onChange={(event) => setProfessionalId(event.target.value)}
                >
                  <option value="all">Todos</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name} {professional.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="patient">Paciente</Label>
                <select
                  id="patient"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  value={patientId}
                  onChange={(event) => setPatientId(event.target.value)}
                >
                  <option value="all">Todos</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} {patient.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2 text-sm text-gray-600">
            <p>
              {allAppointments.length.toLocaleString("es-CL")} citas en el periodo seleccionado.
              {selectedProfessional && (
                <> Profesional: {selectedProfessional.name} {selectedProfessional.last_name}.</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Detalle de citas
          </CardTitle>
          <CardDescription>
            {activeTab === "rescheduled" 
              ? "Citas reagendadas con fecha original y nueva fecha para facturación."
              : "Historial completo de agendamientos con estado y montos asociados."}
          </CardDescription>
          {/* Pestañas */}
          <div className="mt-4 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "all"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Todas las citas
            </button>
            <button
              onClick={() => setActiveTab("rescheduled")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "rescheduled"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Citas Reagendadas
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Búsqueda y controles */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Buscar por ID, paciente, profesional, servicio, área o estado..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              className="flex-1"
            />
            <div className="flex items-center gap-2">
              <Label htmlFor="pageSize" className="text-sm text-gray-600 whitespace-nowrap">
                Mostrar:
              </Label>
              <select
                id="pageSize"
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1); // Resetear a la primera página cuando cambia el tamaño
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 bg-white text-xs md:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    <button
                      onClick={() => handleSort("id")}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Cita ID
                      <SortIcon field="id" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    <button
                      onClick={() => handleSort("scheduled_at")}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      {activeTab === "rescheduled" ? "Fecha Nueva" : "Fecha"}
                      <SortIcon field="scheduled_at" />
                    </button>
                  </th>
                  {activeTab === "rescheduled" && (
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Fecha Original
                    </th>
                  )}
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    <button
                      onClick={() => handleSort("service")}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Servicio
                      <SortIcon field="service" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    <button
                      onClick={() => handleSort("patient_name")}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Paciente
                      <SortIcon field="patient_name" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    <button
                      onClick={() => handleSort("professional_name")}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Profesional
                      <SortIcon field="professional_name" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Estado
                      <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    <button
                      onClick={() => handleSort("amount")}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Monto
                      <SortIcon field="amount" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={activeTab === "rescheduled" ? 8 : 7} className="px-4 py-6 text-center text-gray-500">
                      Cargando datos...
                    </td>
                  </tr>
                ) : paginatedAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === "rescheduled" ? 8 : 7} className="px-4 py-6 text-center text-gray-500">
                      {searchTerm
                        ? "No se encontraron citas con los filtros de búsqueda."
                        : "No hay citas registradas con los filtros seleccionados."}
                    </td>
                  </tr>
                ) : (
                  paginatedAppointments.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">#{row.id}</td>
                      <td className="px-4 py-3">{formatDateTime(row.scheduled_at)}</td>
                      {activeTab === "rescheduled" && (
                        <td className="px-4 py-3">
                          {row.rescheduled_at ? (
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-900">{formatDateTime(row.rescheduled_at)}</span>
                              <span className="text-xs text-gray-500">(Original)</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">{row.service ?? "—"}</td>
                      <td className="px-4 py-3">{row.patient_name ?? "—"}</td>
                      <td className="px-4 py-3">{row.professional_name ?? "—"}</td>
                      <td className="px-4 py-3">{row.status ?? "Sin estado"}</td>
                      <td className="px-4 py-3">{formatCurrency(row.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-4 text-sm text-gray-600 md:flex-row">
            <span>
              Mostrando {paginatedAppointments.length} de{" "}
              {filteredAndSortedAppointments.length} citas
              {searchTerm && ` (${allAppointments.length} total en el periodo)`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1 || isLoading}
              >
                Anterior
              </Button>
              <span>
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages || isLoading}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

