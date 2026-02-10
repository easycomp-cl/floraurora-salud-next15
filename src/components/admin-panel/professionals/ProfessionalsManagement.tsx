"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminProfessional,
  AdminServiceSummary,
  AdminService,
} from "@/lib/types/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BadgeCheck,
  BadgeX,
  Stethoscope,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
  Tag,
  CreditCard,
  Calendar,
  Receipt,
  Gift,
  XCircle,
} from "lucide-react";
import ProfessionalRequestsManagement from "./ProfessionalRequestsManagement";

interface ProfessionalsResponse {
  data: AdminProfessional[];
}

interface ServicesResponse {
  data: AdminService[];
  total: number;
}

interface PlanPayment {
  id: number;
  amount: number;
  currency: string;
  payment_date: string;
  provider_payment_status: string;
  expires_at: string;
}

interface ProfessionalPlanData {
  plan_type: "commission" | "monthly" | null;
  monthly_plan_expires_at: string | null;
  last_monthly_payment_date: string | null;
  use_promotional_price: boolean;
  admin_granted_plan: boolean;
  can_revoke: boolean;
  payments: PlanPayment[];
  config: { premiumNormalPrice: number; premiumPromotionPrice: number };
}

function formatServicesList(services: AdminServiceSummary[]) {
  if (services.length === 0) {
    return "Sin servicios asignados";
  }

  return services.map((service) => service.name).join(", ");
}

export default function ProfessionalsManagement() {
  const [activeTab, setActiveTab] = useState<"professionals" | "requests">(
    "professionals"
  );
  const [allProfessionals, setAllProfessionals] = useState<AdminProfessional[]>(
    []
  );
  const [services, setServices] = useState<AdminService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] =
    useState<AdminProfessional | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [planData, setPlanData] = useState<ProfessionalPlanData | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planActionLoading, setPlanActionLoading] = useState(false);

  // Filtros y paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [titleFilter, setTitleFilter] = useState<string>("all");

  // Obtener títulos únicos para el filtro
  const availableTitles = useMemo(() => {
    const titles = new Set<string>();
    allProfessionals.forEach((prof) => {
      if (prof.title_name) {
        titles.add(prof.title_name);
      }
    });
    return Array.from(titles).sort();
  }, [allProfessionals]);

  // Filtrar profesionales
  const filteredProfessionals = useMemo(() => {
    let filtered = [...allProfessionals];

    // Filtro de búsqueda
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (prof) =>
          prof.name?.toLowerCase().includes(search) ||
          prof.last_name?.toLowerCase().includes(search) ||
          prof.email?.toLowerCase().includes(search) ||
          prof.phone_number?.toLowerCase().includes(search) ||
          prof.title_name?.toLowerCase().includes(search) ||
          prof.specialties.some((s) => s.toLowerCase().includes(search))
      );
    }

    // Filtro de estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((prof) =>
        statusFilter === "active" ? prof.is_active : !prof.is_active
      );
    }

    // Filtro de título
    if (titleFilter !== "all") {
      filtered = filtered.filter((prof) => prof.title_name === titleFilter);
    }

    return filtered;
  }, [allProfessionals, searchTerm, statusFilter, titleFilter]);

  // Paginación
  const totalPages = useMemo(() => {
    return Math.max(Math.ceil(filteredProfessionals.length / pageSize), 1);
  }, [filteredProfessionals.length, pageSize]);

  const paginatedProfessionals = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredProfessionals.slice(start, end);
  }, [filteredProfessionals, page, pageSize]);

  const loadProfessionals = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/professionals", {
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload?.error ?? "No se pudieron obtener los profesionales"
        );
      }

      const payload = (await response.json()) as ProfessionalsResponse;
      setAllProfessionals(payload.data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error inesperado al cargar los profesionales.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadServices = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/services?onlyActive=false", {
        cache: "no-store",
      });
      if (!response.ok) {
        console.warn(
          "[ProfessionalsManagement] No se pudieron cargar los servicios:",
          response.status
        );
        setServices([]);
        return;
      }
      const payload = (await response.json()) as ServicesResponse;
      setServices(payload.data);
    } catch (err) {
      console.warn(
        "[ProfessionalsManagement] Error al cargar servicios (tabla puede no existir):",
        err
      );
      setServices([]);
    }
  }, []);

  useEffect(() => {
    loadProfessionals();
    loadServices();
  }, [loadProfessionals, loadServices]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, titleFilter]);

  const handleToggleActive = async (professional: AdminProfessional) => {
    try {
      setActionLoadingId(professional.id);
      setMessage(null);
      setError(null);

      const response = await fetch(
        `/api/admin/professionals/${professional.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !professional.is_active }),
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload?.error ?? "No se pudo actualizar el estado del profesional"
        );
      }

      setMessage(
        !professional.is_active
          ? "Profesional activado correctamente."
          : "Profesional desactivado correctamente."
      );
      await loadProfessionals();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error inesperado al actualizar el profesional.";
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenAssignServices = (professional: AdminProfessional) => {
    setSelectedProfessional(professional);
    setSelectedServiceIds(professional.services.map((service) => service.id));
    setIsAssignDialogOpen(true);
    setMessage(null);
    setError(null);
  };

  const handleOpenPlanDialog = async (professional: AdminProfessional) => {
    setSelectedProfessional(professional);
    setIsPlanDialogOpen(true);
    setPlanData(null);
    setMessage(null);
    setError(null);
    setPlanLoading(true);
    try {
      const res = await fetch(`/api/admin/professionals/${professional.id}/plan`);
      if (res.ok) {
        const data = (await res.json()) as ProfessionalPlanData;
        setPlanData({
          ...data,
          can_revoke: data.can_revoke ?? (data.admin_granted_plan && data.plan_type === "monthly"),
        });
      } else {
        setError("No se pudo cargar el plan");
      }
    } catch {
      setError("Error al cargar el plan");
    } finally {
      setPlanLoading(false);
    }
  };

  const handleTogglePromoInPlan = async () => {
    if (!selectedProfessional || !planData) return;
    setPlanActionLoading(true);
    setError(null);
    try {
      const newValue = !planData.use_promotional_price;
      const res = await fetch(
        `/api/admin/professionals/${selectedProfessional.id}/promotional-price`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ use_promotional_price: newValue }),
        }
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Error al actualizar promoción");
      }
      setPlanData((prev) => prev ? { ...prev, use_promotional_price: newValue } : null);
      setMessage(newValue ? "Promoción activada" : "Promoción desactivada");
      await loadProfessionals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar promoción");
    } finally {
      setPlanActionLoading(false);
    }
  };

  const handleGrantRenewal = async () => {
    if (!selectedProfessional) return;
    setPlanActionLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/professionals/${selectedProfessional.id}/grant-renewal`,
        { method: "POST" }
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Error al conceder renovación");
      }
      const result = await res.json();
      setMessage(result.message ?? "Se concedió el mes gratis correctamente.");
      await loadProfessionals();
      if (planData) {
        setPlanData({
          ...planData,
          plan_type: "monthly",
          monthly_plan_expires_at: result.expires_at ?? planData.monthly_plan_expires_at,
          last_monthly_payment_date: new Date().toISOString(),
          admin_granted_plan: true,
          can_revoke: true,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conceder renovación");
    } finally {
      setPlanActionLoading(false);
    }
  };

  const handleRevokeRenewal = async () => {
    if (!selectedProfessional) return;
    setPlanActionLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/professionals/${selectedProfessional.id}/revoke-renewal`,
        { method: "POST" }
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Error al revocar");
      }
      const result = await res.json();
      setMessage(result.message ?? "Mes gratis revocado. El profesional pasó a Plan Light.");
      await loadProfessionals();
      if (planData) {
        setPlanData({
          ...planData,
          plan_type: "commission",
          monthly_plan_expires_at: null,
          last_monthly_payment_date: null,
          admin_granted_plan: false,
          can_revoke: false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al revocar");
    } finally {
      setPlanActionLoading(false);
    }
  };

  const handleAssignServices = async () => {
    if (!selectedProfessional) return;
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(
        `/api/admin/professionals/${selectedProfessional.id}/services`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceIds: selectedServiceIds }),
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload?.error ?? "No se pudieron asignar los servicios"
        );
      }

      setMessage("Servicios asignados correctamente.");
      setIsAssignDialogOpen(false);
      setSelectedProfessional(null);
      await loadProfessionals();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error inesperado al asignar los servicios.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeServices = useMemo(
    () => services.filter((service) => service.is_active),
    [services]
  );

  return (
    <section className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("professionals")}
            className={`${
              activeTab === "professionals"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2`}
          >
            <Users className="w-4 h-4" />
            Profesionales Activos
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`${
              activeTab === "requests"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2`}
          >
            <FileText className="w-4 h-4" />
            Solicitudes
          </button>
        </nav>
      </div>

      {activeTab === "requests" ? (
        <ProfessionalRequestsManagement />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Gestión de profesionales
              </CardTitle>
              <p className="text-sm text-gray-500">
                Administra profesionales, sus especialidades y servicios
                asignados.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Filtros y búsqueda */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-1 space-y-1.5">
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Nombre, correo, teléfono o especialidad"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="statusFilter">Estado</Label>
                  <select
                    id="statusFilter"
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as "all" | "active" | "inactive"
                      )
                    }
                  >
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="titleFilter">Título/Área</Label>
                  <select
                    id="titleFilter"
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    value={titleFilter}
                    onChange={(event) => setTitleFilter(event.target.value)}
                  >
                    <option value="all">Todos</option>
                    {availableTitles.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {message && (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Tabla */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Profesional
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Contacto
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Título/Área
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Especialidades
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-gray-500"
                        >
                          Cargando profesionales...
                        </td>
                      </tr>
                    ) : paginatedProfessionals.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-gray-500"
                        >
                          No se encontraron profesionales con los filtros
                          seleccionados.
                        </td>
                      </tr>
                    ) : (
                      paginatedProfessionals.map((professional) => (
                        <tr key={professional.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {professional.name} {professional.last_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ID #{professional.id}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col space-y-0.5">
                              <span className="text-sm text-gray-700">
                                {professional.email ?? "-"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {professional.phone_number ?? "-"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="h-4 w-4 text-primary" />
                              <span className="text-sm text-gray-700">
                                {professional.title_name ?? "Sin título"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {professional.specialties.length > 0 ? (
                                professional.specialties.map(
                                  (specialty, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                                    >
                                      {specialty}
                                    </span>
                                  )
                                )
                              ) : (
                                <span className="text-xs text-gray-400">
                                  Sin especialidades
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {professional.plan_type ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {professional.plan_type === "commission"
                                        ? "Plan Comisión"
                                        : "Plan Mensual"}
                                    </span>
                                  </div>
                                  {professional.plan_type === "monthly" && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <Calendar className="h-3 w-3" />
                                      {professional.monthly_plan_expires_at ? (
                                        <>
                                          Expira:{" "}
                                          {new Date(
                                            professional.monthly_plan_expires_at
                                          ).toLocaleDateString("es-CL", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                          })}
                                          {new Date(
                                            professional.monthly_plan_expires_at
                                          ) > new Date() ? (
                                            <span className="ml-1 text-green-600">
                                              (Activo)
                                            </span>
                                          ) : (
                                            <span className="ml-1 text-red-600">
                                              (Vencido)
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-red-600">
                                          Sin fecha de expiración
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  Sin plan asignado
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {professional.is_active ? (
                                <BadgeCheck className="h-4 w-4 text-green-500" />
                              ) : (
                                <BadgeX className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm text-gray-700">
                                {professional.is_active ? "Activo" : "Inactivo"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(professional)}
                                disabled={actionLoadingId === professional.id}
                              >
                                {actionLoadingId === professional.id
                                  ? "Procesando..."
                                  : professional.is_active
                                    ? "Desactivar"
                                    : "Activar"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenPlanDialog(professional)}
                                title="Ver detalle del plan y gestionar promoción"
                              >
                                <CreditCard className="h-3 w-3" />
                                Ver plan
                              </Button>

                              {services.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenAssignServices(professional)
                                  }
                                >
                                  Servicios
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-4 text-sm text-gray-600 md:flex-row">
                <span>
                  Mostrando {paginatedProfessionals.length} de{" "}
                  {filteredProfessionals.length} profesionales
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page <= 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span>
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={page >= totalPages || isLoading}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dialog para asignar servicios */}
          <Dialog
            open={isAssignDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                setIsAssignDialogOpen(open);
                setSelectedProfessional(null);
              } else {
                setIsAssignDialogOpen(true);
              }
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Asignar servicios</DialogTitle>
                <DialogDescription>
                  Selecciona los servicios disponibles que podrá ofrecer el
                  profesional.
                </DialogDescription>
              </DialogHeader>

              {selectedProfessional && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedProfessional.name}{" "}
                      {selectedProfessional.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Actualmente asignados:{" "}
                      {formatServicesList(selectedProfessional.services)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Servicios disponibles</Label>
                    <div className="max-h-64 overflow-y-auto rounded-md border border-gray-300 bg-white p-3 space-y-2">
                      {activeServices.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4 text-center">
                          No hay servicios activos configurados
                        </p>
                      ) : (
                        activeServices.map((service) => {
                          const formatPrice = () => {
                            if (
                              service.minimum_amount !== null &&
                              service.minimum_amount !== undefined
                            ) {
                              if (
                                service.maximum_amount !== null &&
                                service.maximum_amount !== undefined
                              ) {
                                return `$${service.minimum_amount.toLocaleString("es-CL")} - $${service.maximum_amount.toLocaleString("es-CL")}`;
                              }
                              return `$${service.minimum_amount.toLocaleString("es-CL")}`;
                            }
                            if (
                              service.maximum_amount !== null &&
                              service.maximum_amount !== undefined
                            ) {
                              return `Hasta $${service.maximum_amount.toLocaleString("es-CL")}`;
                            }
                            return "Precio no definido";
                          };
                          const isChecked = selectedServiceIds.includes(service.id);
                          return (
                            <label
                              key={service.id}
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedServiceIds((prev) =>
                                      [...prev, service.id].sort((a, b) => a - b)
                                    );
                                  } else {
                                    setSelectedServiceIds((prev) =>
                                      prev.filter((id) => id !== service.id)
                                    );
                                  }
                                }}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                              />
                              <span className="flex-1 text-sm text-gray-700">
                                {service.name} · {service.duration_minutes} min ·{" "}
                                {formatPrice()}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                    <p className="font-medium text-gray-700">
                      Resumen de servicios activos:
                    </p>
                    <ul className="mt-2 space-y-1">
                      {services.map((service) => {
                        const formatPrice = () => {
                          if (
                            service.minimum_amount !== null &&
                            service.minimum_amount !== undefined
                          ) {
                            if (
                              service.maximum_amount !== null &&
                              service.maximum_amount !== undefined
                            ) {
                              return `$${service.minimum_amount.toLocaleString("es-CL")} - $${service.maximum_amount.toLocaleString("es-CL")}`;
                            }
                            return `$${service.minimum_amount.toLocaleString("es-CL")}`;
                          }
                          if (
                            service.maximum_amount !== null &&
                            service.maximum_amount !== undefined
                          ) {
                            return `Hasta $${service.maximum_amount.toLocaleString("es-CL")}`;
                          }
                          return "Precio no definido";
                        };
                        return (
                          <li
                            key={service.id}
                            className="flex items-center gap-2"
                          >
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            <span className="flex-1">
                              {service.name} ({service.duration_minutes} min)
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <DollarSign className="h-3 w-3" />
                              {formatPrice()}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAssignDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAssignServices}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog Ver plan */}
          <Dialog
            open={isPlanDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                setIsPlanDialogOpen(false);
                setSelectedProfessional(null);
                setPlanData(null);
              }
            }}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Plan del profesional</DialogTitle>
                <DialogDescription>
                  Detalle del plan actual, historial de pagos y acciones de
                  administración
                </DialogDescription>
              </DialogHeader>

              {selectedProfessional && (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedProfessional.name}{" "}
                      {selectedProfessional.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID #{selectedProfessional.id} ·{" "}
                      {selectedProfessional.email ?? "-"}
                    </p>
                  </div>

                  {planLoading ? (
                    <p className="text-sm text-gray-500 py-4 text-center">
                      Cargando plan...
                    </p>
                  ) : planData ? (
                    <>
                      {/* Detalle del plan */}
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary" />
                          Plan actual
                        </h4>
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tipo:</span>
                            <span className="font-medium">
                              {planData.plan_type === "commission"
                                ? "Plan Comisión"
                                : planData.plan_type === "monthly"
                                  ? "Plan Premium (Mensual)"
                                  : "Sin plan asignado"}
                            </span>
                          </div>
                          {planData.plan_type === "monthly" && (
                            <>
                              {(planData.admin_granted_plan || planData.can_revoke) && (
                                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                                  Mes gratis concedido por admin. Puedes revocarlo para que pase a Plan Light.
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Expira:
                                </span>
                                <span
                                  className={
                                    planData.monthly_plan_expires_at &&
                                    new Date(
                                      planData.monthly_plan_expires_at
                                    ) > new Date()
                                      ? "text-green-600 font-medium"
                                      : "text-red-600 font-medium"
                                  }
                                >
                                  {planData.monthly_plan_expires_at
                                    ? new Date(
                                        planData.monthly_plan_expires_at
                                      ).toLocaleDateString("es-CL", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })
                                    : "Sin fecha"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Último pago:
                                </span>
                                <span>
                                  {planData.last_monthly_payment_date
                                    ? new Date(
                                        planData.last_monthly_payment_date
                                      ).toLocaleDateString("es-CL", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })
                                    : "-"}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Precios de referencia */}
                      <div className="rounded-lg border border-gray-200 p-4 space-y-2">
                        <h4 className="font-medium text-gray-900">
                          Precios de referencia
                        </h4>
                        <p className="text-sm text-gray-600">
                          Normal: $
                          {planData.config.premiumNormalPrice.toLocaleString(
                            "es-CL"
                          )}{" "}
                          · Promocional: $
                          {planData.config.premiumPromotionPrice.toLocaleString(
                            "es-CL"
                          )}
                        </p>
                      </div>

                      {/* Historial de pagos */}
                      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-primary" />
                          Registro de pagos
                        </h4>
                        {planData.payments.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No hay pagos registrados
                          </p>
                        ) : (
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {planData.payments.map((p) => (
                              <div
                                key={p.id}
                                className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0"
                              >
                                <div>
                                  <span className="font-medium">
                                    $
                                    {Number(p.amount).toLocaleString("es-CL")}{" "}
                                    {p.currency}
                                  </span>
                                  <span className="text-gray-500 ml-2">
                                    {p.payment_date
                                      ? new Date(
                                          p.payment_date
                                        ).toLocaleDateString("es-CL", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                        })
                                      : "-"}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  Vigente hasta:{" "}
                                  {p.expires_at
                                    ? new Date(p.expires_at).toLocaleDateString(
                                        "es-CL",
                                        {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                        }
                                      )
                                    : "-"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Acciones de admin */}
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
                        <h4 className="font-medium text-gray-900">
                          Acciones de administración
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={
                              planData.use_promotional_price
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={handleTogglePromoInPlan}
                            disabled={planActionLoading}
                            className={
                              planData.use_promotional_price
                                ? "bg-orange-500 hover:bg-orange-600 text-white"
                                : ""
                            }
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {planActionLoading
                              ? "Procesando..."
                              : planData.use_promotional_price
                                ? "Promoción activa (clic para desactivar)"
                                : "Asignar promoción"}
                          </Button>
                          {(() => {
                            const planActive = Boolean(
                              planData.plan_type === "monthly" &&
                              planData.monthly_plan_expires_at &&
                              new Date(planData.monthly_plan_expires_at) > new Date()
                            );
                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGrantRenewal}
                                disabled={planActionLoading || planActive}
                                title={
                                  planActive
                                    ? "El plan mensual ya está activo. Solo se puede conceder cuando esté vencido."
                                    : undefined
                                }
                              >
                                <Gift className="h-3 w-3 mr-1" />
                                {planActionLoading
                                  ? "Procesando..."
                                  : planActive
                                    ? "Plan activo (no se puede regalar)"
                                    : planData.plan_type === "monthly"
                                      ? "Conceder 1 mes gratis (renovación)"
                                      : "Conceder 1 mes Premium gratis"}
                              </Button>
                            );
                          })()}
                          {planData.can_revoke && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRevokeRenewal}
                              disabled={planActionLoading}
                              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Quitar mes gratis → Plan Light
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 py-4 text-center">
                      No se pudieron cargar los datos del plan
                    </p>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </section>
  );
}
