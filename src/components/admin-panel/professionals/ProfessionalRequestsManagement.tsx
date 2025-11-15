"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProfessionalRequest } from "@/lib/services/professionalRequestsService";
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
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Download,
  Eye,
  Search,
  Mail,
} from "lucide-react";

interface ProfessionalRequestsResponse {
  data: ProfessionalRequest[];
  total: number;
}

export default function ProfessionalRequestsManagement() {
  const [allRequests, setAllRequests] = useState<ProfessionalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<ProfessionalRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Filtros y paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "resubmitted"
  >("pending");

  // Filtrar solicitudes
  const filteredRequests = useMemo(() => {
    let filtered = [...allRequests];

    // Filtro de estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Filtro de búsqueda
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.full_name?.toLowerCase().includes(search) ||
          req.email?.toLowerCase().includes(search) ||
          req.rut?.toLowerCase().includes(search) ||
          req.university?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [allRequests, statusFilter, searchTerm]);

  // Paginación
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredRequests.slice(start, end);
  }, [filteredRequests, page, pageSize]);

  const totalPages = Math.ceil(filteredRequests.length / pageSize);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/professional-requests?status=all&pageSize=1000`
      );
      if (!response.ok) {
        throw new Error("Error al cargar solicitudes");
      }
      const data: ProfessionalRequestsResponse = await response.json();
      setAllRequests(data.data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error inesperado al cargar solicitudes";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const handleApprove = async (request: ProfessionalRequest) => {
    try {
      setActionLoadingId(request.id);
      setMessage(null);
      setError(null);

      const response = await fetch(
        `/api/admin/professional-requests/${request.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload?.error ?? "No se pudo aprobar la solicitud"
        );
      }

      setMessage("Solicitud aprobada exitosamente. Se ha enviado un correo al profesional.");
      await loadRequests();
      if (selectedRequest?.id === request.id) {
        setIsDetailDialogOpen(false);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error inesperado al aprobar la solicitud";
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      setError("Debes ingresar un motivo de rechazo");
      return;
    }

    try {
      setActionLoadingId(selectedRequest.id);
      setMessage(null);
      setError(null);

      const response = await fetch(
        `/api/admin/professional-requests/${selectedRequest.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload?.error ?? "No se pudo rechazar la solicitud"
        );
      }

      setMessage("Solicitud rechazada exitosamente. Se ha enviado un correo al profesional.");
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      await loadRequests();
      setIsDetailDialogOpen(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error inesperado al rechazar la solicitud";
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResendLink = async (request: ProfessionalRequest) => {
    try {
      setActionLoadingId(request.id);
      setMessage(null);
      setError(null);

      const response = await fetch(
        `/api/admin/professional-requests/${request.id}/resend-link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload?.error ?? "No se pudo reenviar el enlace"
        );
      }

      setMessage("Enlace de verificación reenviado exitosamente. Se ha enviado un correo al profesional.");
      // No cerrar el diálogo para que el admin pueda ver el mensaje
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error inesperado al reenviar el enlace";
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente
        </span>
      ),
      approved: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Aprobada
        </span>
      ),
      rejected: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Rechazada
        </span>
      ),
      resubmitted: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <FileText className="w-3 h-3 mr-1" />
          Reenviada
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Solicitudes Profesionales</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre, email, RUT o universidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "all"
                      | "pending"
                      | "approved"
                      | "rejected"
                      | "resubmitted"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobadas</option>
                <option value="rejected">Rechazadas</option>
                <option value="resubmitted">Reenviadas</option>
              </select>
            </div>
          </div>

          {/* Mensajes */}
          {message && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {/* Tabla */}
          {isLoading ? (
            <div className="text-center py-8">Cargando solicitudes...</div>
          ) : paginatedRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay solicitudes que coincidan con los filtros
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Nombre</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">RUT</th>
                      <th className="text-left p-3">Universidad</th>
                      <th className="text-left p-3">Estado</th>
                      <th className="text-left p-3">Fecha</th>
                      <th className="text-left p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRequests.map((request) => (
                      <tr key={request.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{request.full_name}</td>
                        <td className="p-3">{request.email}</td>
                        <td className="p-3">{request.rut}</td>
                        <td className="p-3">{request.university}</td>
                        <td className="p-3">{getStatusBadge(request.status)}</td>
                        <td className="p-3">
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            {request.status === "pending" ||
                            request.status === "resubmitted" ? (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApprove(request)}
                                  disabled={actionLoadingId === request.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Aprobar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setIsRejectDialogOpen(true);
                                  }}
                                  disabled={actionLoadingId === request.id}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Rechazar
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {paginatedRequests.length} de {filteredRequests.length} solicitudes
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <span className="px-4 py-2 text-sm">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalle */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Solicitud</DialogTitle>
            <DialogDescription>
              Información completa de la solicitud profesional
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre Completo</Label>
                  <p className="font-medium">{selectedRequest.full_name}</p>
                </div>
                <div>
                  <Label>RUT</Label>
                  <p className="font-medium">{selectedRequest.rut}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedRequest.email}</p>
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <p className="font-medium">
                    {selectedRequest.phone_number || "No proporcionado"}
                  </p>
                </div>
                <div>
                  <Label>Fecha de Nacimiento</Label>
                  <p className="font-medium">
                    {selectedRequest.birth_date
                      ? new Date(selectedRequest.birth_date).toLocaleDateString()
                      : "No proporcionado"}
                  </p>
                </div>
                <div>
                  <Label>Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              <div>
                <Label>Universidad</Label>
                <p className="font-medium">{selectedRequest.university}</p>
              </div>
              {selectedRequest.profession && (
                <div>
                  <Label>Profesión</Label>
                  <p className="font-medium">{selectedRequest.profession}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Año Inicio</Label>
                  <p className="font-medium">
                    {selectedRequest.study_year_start || "No proporcionado"}
                  </p>
                </div>
                <div>
                  <Label>Año Fin</Label>
                  <p className="font-medium">
                    {selectedRequest.study_year_end || "No proporcionado"}
                  </p>
                </div>
              </div>
              <div>
                <Label>Número de Inscripción</Label>
                <p className="font-medium">
                  {selectedRequest.superintendence_number}
                </p>
              </div>
              {selectedRequest.extra_studies && (
                <div>
                  <Label>Estudios Adicionales</Label>
                  <p className="font-medium">{selectedRequest.extra_studies}</p>
                </div>
              )}

              <div>
                <Label className="mb-2 block">Documentos Adjuntos</Label>
                <div className="space-y-3">
                  {selectedRequest.degree_copy_url && (
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">Título Universitario</p>
                          <p className="text-xs text-gray-500">
                            {(() => {
                              try {
                                const url = new URL(selectedRequest.degree_copy_url);
                                const pathParts = url.pathname.split("/");
                                const fileName = pathParts[pathParts.length - 1];
                                // Extraer información del nombre: titulo-universitario_userId_timestamp.ext
                                const match = fileName.match(/^titulo-universitario_([^_]+)_(\d+)\.(.+)$/);
                                if (match) {
                                  const [, , timestamp] = match;
                                  const date = new Date(parseInt(timestamp));
                                  return `Subido: ${date.toLocaleDateString("es-CL")} ${date.toLocaleTimeString("es-CL")}`;
                                }
                                return fileName;
                              } catch {
                                return "Ver documento";
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={selectedRequest.degree_copy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver documento"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <a
                          href={selectedRequest.degree_copy_url}
                          download
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Descargar documento"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                  {selectedRequest.id_copy_url && (
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">Copia de Cédula de Identidad</p>
                          <p className="text-xs text-gray-500">
                            {(() => {
                              try {
                                const url = new URL(selectedRequest.id_copy_url);
                                const pathParts = url.pathname.split("/");
                                const fileName = pathParts[pathParts.length - 1];
                                const match = fileName.match(/^cedula-identidad_([^_]+)_(\d+)\.(.+)$/);
                                if (match) {
                                  const [, , timestamp] = match;
                                  const date = new Date(parseInt(timestamp));
                                  return `Subido: ${date.toLocaleDateString("es-CL")} ${date.toLocaleTimeString("es-CL")}`;
                                }
                                return fileName;
                              } catch {
                                return "Ver documento";
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={selectedRequest.id_copy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver documento"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <a
                          href={selectedRequest.id_copy_url}
                          download
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Descargar documento"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                  {selectedRequest.professional_certificate_url && (
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">Certificado Profesional</p>
                          <p className="text-xs text-gray-500">
                            {(() => {
                              try {
                                const url = new URL(selectedRequest.professional_certificate_url);
                                const pathParts = url.pathname.split("/");
                                const fileName = pathParts[pathParts.length - 1];
                                const match = fileName.match(/^certificado-profesional_([^_]+)_(\d+)\.(.+)$/);
                                if (match) {
                                  const [, , timestamp] = match;
                                  const date = new Date(parseInt(timestamp));
                                  return `Subido: ${date.toLocaleDateString("es-CL")} ${date.toLocaleTimeString("es-CL")}`;
                                }
                                return fileName;
                              } catch {
                                return "Ver documento";
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={selectedRequest.professional_certificate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver documento"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <a
                          href={selectedRequest.professional_certificate_url}
                          download
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Descargar documento"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                  {/* Certificados adicionales */}
                  {selectedRequest.additional_certificates_urls && (() => {
                    try {
                      const additionalUrls = JSON.parse(selectedRequest.additional_certificates_urls) as string[];
                      return additionalUrls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="font-medium text-sm">Certificado Adicional {index + 1}</p>
                              <p className="text-xs text-gray-500">
                                {(() => {
                                  try {
                                    const urlObj = new URL(url);
                                    const pathParts = urlObj.pathname.split("/");
                                    const fileName = pathParts[pathParts.length - 1];
                                    const match = fileName.match(/^certificado-adicional-(\d+)_([^_]+)_(\d+)\.(.+)$/);
                                    if (match) {
                                      const [, , , timestamp] = match;
                                      const date = new Date(parseInt(timestamp));
                                      return `Subido: ${date.toLocaleDateString("es-CL")} ${date.toLocaleTimeString("es-CL")}`;
                                    }
                                    return fileName;
                                  } catch {
                                    return "Ver documento";
                                  }
                                })()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Ver documento"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <a
                              href={url}
                              download
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Descargar documento"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ));
                    } catch {
                      return null;
                    }
                  })()}
                  {!selectedRequest.degree_copy_url && !selectedRequest.id_copy_url && !selectedRequest.professional_certificate_url && (!selectedRequest.additional_certificates_urls || selectedRequest.additional_certificates_urls === "[]") && (
                    <p className="text-sm text-gray-500 italic">No hay documentos adjuntos</p>
                  )}
                </div>
              </div>

              {selectedRequest.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <Label className="text-red-800">Motivo de Rechazo</Label>
                  <p className="text-red-700 mt-1">
                    {selectedRequest.rejection_reason}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {(selectedRequest.status === "pending" ||
                  selectedRequest.status === "resubmitted") && (
                  <>
                    <Button
                      variant="default"
                      onClick={() => handleApprove(selectedRequest)}
                      disabled={actionLoadingId === selectedRequest.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aprobar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsDetailDialogOpen(false);
                        setIsRejectDialogOpen(true);
                      }}
                      disabled={actionLoadingId === selectedRequest.id}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                  </>
                )}
                {selectedRequest.status === "approved" && (
                  <Button
                    variant="outline"
                    onClick={() => handleResendLink(selectedRequest)}
                    disabled={actionLoadingId === selectedRequest.id}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {actionLoadingId === selectedRequest.id ? "Reenviando..." : "Reenviar Enlace"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de rechazo */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
            <DialogDescription>
              Ingresa el motivo del rechazo. Este mensaje se enviará al profesional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Motivo de Rechazo *</Label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Ej: Los documentos proporcionados no son legibles..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setRejectionReason("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={
                  !rejectionReason.trim() ||
                  actionLoadingId === selectedRequest?.id
                }
              >
                Rechazar Solicitud
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

