"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminRole, AdminUser, AdminUserStatus } from "@/lib/types/admin";
import UserForm, { buildUserFormDefaults, type UserFormValues } from "./UserForm";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck, ShieldOff, ShieldQuestion, UserCog, LockKeyhole } from "lucide-react";

interface UsersResponse {
  data: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
}

const roleLabels: Record<AdminRole, string> = {
  admin: "Administrador",
  professional: "Profesional",
  patient: "Paciente",
};

const statusLabels: Record<AdminUserStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  blocked: "Bloqueado",
  pending: "Pendiente",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  try {
    const date = new Date(value);
    return format(date, "dd MMM yyyy HH:mm", { locale: es });
  } catch {
    return value;
  }
}

export default function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState<AdminRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AdminUserStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const totalPages = useMemo(() => {
    if (pageSize === 0) return 1;
    return Math.max(Math.ceil(total / pageSize), 1);
  }, [pageSize, total]);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    if (searchQuery) {
      params.set("search", searchQuery);
    }

    if (roleFilter !== "all") {
      params.set("role", roleFilter);
    }

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    return params.toString();
  }, [page, pageSize, roleFilter, statusFilter, searchQuery]);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const query = buildQueryString();
      const response = await fetch(`/api/admin/users?${query}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo obtener la lista de usuarios");
      }

      const payload = (await response.json()) as UsersResponse;
      setUsers(payload.data);
      setPage(payload.page);
      setTotal(payload.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ocurrió un error al cargar los usuarios.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryString]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const applyFilters = () => {
    setPage(1);
    setSearchQuery(searchTerm.trim());
  };

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, searchQuery]);

  const resetMessages = () => {
    setActionMessage(null);
    setDialogError(null);
  };

  const handleCreateSubmit = async (values: UserFormValues) => {
    try {
      setIsSubmitting(true);
      setDialogError(null);

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo crear el usuario");
      }

      setActionMessage("Usuario creado correctamente.");
      setIsCreateOpen(false);
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado al crear el usuario.";
      setDialogError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (values: UserFormValues) => {
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      setDialogError(null);

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          last_name: values.last_name,
          email: values.email,
          phone_number: values.phone_number,
          rut: values.rut,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo actualizar el usuario");
      }

      if (selectedUser.role !== values.role) {
        const roleResponse = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: values.role }),
        });

        if (!roleResponse.ok) {
          const payload = await roleResponse.json().catch(() => ({}));
          throw new Error(payload?.error ?? "No se pudo actualizar el rol del usuario");
        }
      }

      setActionMessage("Usuario actualizado correctamente.");
      setIsEditOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al actualizar el usuario.";
      setDialogError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockToggle = async (user: AdminUser) => {
    try {
      resetMessages();
      setActionLoadingId(user.id);
      const response = await fetch(`/api/admin/users/${user.id}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: user.status !== "blocked" }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo actualizar el estado del usuario");
      }

      setActionMessage(
        user.status === "blocked"
          ? "Usuario desbloqueado correctamente."
          : "Usuario bloqueado correctamente.",
      );

      await loadUsers();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al actualizar el estado.";
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetPassword = async (user: AdminUser) => {
    try {
      resetMessages();
      setActionLoadingId(user.id);
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo enviar el correo de recuperación");
      }

      const payload = await response.json();
      setActionMessage(
        `Enlace de recuperación enviado. (${payload.recoveryLink ?? "sin enlace"})`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al enviar el enlace.";
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Gestión de usuarios
            </CardTitle>
            <p className="text-sm text-gray-500">
              Administra cuentas, roles y estados de pacientes, profesionales y administradores.
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setDialogError(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetMessages();
                setIsCreateOpen(true);
              }}>
                Crear usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Crear nuevo usuario</DialogTitle>
                <DialogDescription>
                  Ingresa los datos básicos y define un rol inicial para el usuario.
                </DialogDescription>
              </DialogHeader>
              <UserForm
                mode="create"
                onSubmit={handleCreateSubmit}
                onCancel={() => setIsCreateOpen(false)}
                isSubmitting={isSubmitting}
                error={dialogError}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="search">Buscar</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Nombre, correo o teléfono"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      applyFilters();
                    }
                  }}
                />
                <Button variant="outline" onClick={applyFilters}>
                  Buscar
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="roleFilter">Rol</Label>
              <select
                id="roleFilter"
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as AdminRole | "all")}
              >
                <option value="all">Todos</option>
                <option value="admin">Administradores</option>
                <option value="professional">Profesionales</option>
                <option value="patient">Pacientes</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="statusFilter">Estado</Label>
              <select
                id="statusFilter"
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as AdminUserStatus | "all")
                }
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="blocked">Bloqueados</option>
                <option value="inactive">Inactivos</option>
                <option value="pending">Pendientes</option>
              </select>
            </div>
          </div>

          {actionMessage && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {actionMessage}
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Usuario</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Contacto</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Rol</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Creación</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      No se encontraron usuarios con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {user.name} {user.last_name}
                          </span>
                          <span className="text-xs text-gray-500">ID #{user.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col space-y-0.5">
                          <span className="text-sm text-gray-700">{user.email ?? "-"}</span>
                          <span className="text-xs text-gray-500">{user.phone_number ?? "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          {user.status === "active" && (
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                          )}
                          {user.status === "blocked" && (
                            <ShieldOff className="h-4 w-4 text-red-500" />
                          )}
                          {user.status !== "active" && user.status !== "blocked" && (
                            <ShieldQuestion className="h-4 w-4 text-yellow-500" />
                          )}
                          <div className="flex flex-col text-xs">
                            <span className="font-medium text-gray-700">{statusLabels[user.status]}</span>
                            {user.blocked_until && (
                              <span className="text-gray-500">
                                hasta {formatDate(user.blocked_until)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Dialog
                            open={isEditOpen && selectedUser?.id === user.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setIsEditOpen(false);
                                setSelectedUser(null);
                                setDialogError(null);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  resetMessages();
                                  setSelectedUser(user);
                                  setIsEditOpen(true);
                                }}
                              >
                                Editar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Editar usuario</DialogTitle>
                                <DialogDescription>
                                  Actualiza los datos básicos y el rol asignado.
                                </DialogDescription>
                              </DialogHeader>
                              <UserForm
                                mode="edit"
                                defaultValues={buildUserFormDefaults(selectedUser ?? undefined)}
                                onSubmit={handleEditSubmit}
                                onCancel={() => {
                                  setIsEditOpen(false);
                                  setSelectedUser(null);
                                }}
                                isSubmitting={isSubmitting}
                                error={dialogError}
                              />
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBlockToggle(user)}
                            disabled={actionLoadingId === user.id}
                          >
                            {actionLoadingId === user.id ? (
                              "Procesando..."
                            ) : user.status === "blocked" ? (
                              "Desbloquear"
                            ) : (
                              "Bloquear"
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(user)}
                            disabled={actionLoadingId === user.id}
                          >
                            <LockKeyhole className="mr-2 h-4 w-4" />
                            Resetear clave
                          </Button>

                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            <UserCog className="mr-1 h-3 w-3" />
                            {user.role_id}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-4 text-sm text-gray-600 md:flex-row">
            <span>
              Mostrando {users.length} de {total} usuarios
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

