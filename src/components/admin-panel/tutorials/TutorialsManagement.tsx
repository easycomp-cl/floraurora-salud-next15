"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, PlayCircle, Video } from "lucide-react";
import type { TutorialVideo, TutorialVisibility } from "@/lib/types/adminConfig";
import { clientGetUser } from "@/lib/client-auth";

interface TutorialFormState {
  title: string;
  description: string;
  youtube_url: string;
  visibility: TutorialVisibility;
  display_order: number;
  is_active: boolean;
}

const defaultFormState: TutorialFormState = {
  title: "",
  description: "",
  youtube_url: "",
  visibility: "professionals",
  display_order: 0,
  is_active: true,
};

const visibilityLabels: Record<TutorialVisibility, string> = {
  professionals: "Solo profesionales",
  patients: "Solo pacientes",
  both: "Profesionales y pacientes",
};

export default function TutorialsManagement() {
  const [items, setItems] = useState<TutorialVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [formState, setFormState] = useState<TutorialFormState>(defaultFormState);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { user } = await clientGetUser();
      if (!user) {
        throw new Error("No autenticado");
      }

      const response = await fetch("/api/admin/tutorials", {
        cache: "no-store",
        credentials: "include",
        headers: { "X-User-ID": user.id },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo obtener los tutoriales");
      }
      const payload = await response.json();
      setItems(payload.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al cargar los tutoriales.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openDialog = (item?: TutorialVideo) => {
    setDialogError(null);
    setSuccess(null);
    if (item) {
      setEditingId(item.id);
      setFormState({
        title: item.title,
        description: item.description ?? "",
        youtube_url: item.youtube_url,
        visibility: item.visibility,
        display_order: item.display_order,
        is_active: item.is_active,
      });
    } else {
      setEditingId(null);
      setFormState(defaultFormState);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formState.title.trim()) {
      setDialogError("El título es obligatorio");
      return;
    }
    if (!formState.youtube_url.trim()) {
      setDialogError("El enlace de YouTube es obligatorio");
      return;
    }

    try {
      setIsSubmitting(true);
      setDialogError(null);

      const { user } = await clientGetUser();
      if (!user) {
        throw new Error("No autenticado");
      }

      const payload = {
        ...formState,
        description: formState.description || null,
      };

      const response = await fetch(
        editingId ? `/api/admin/tutorials/${editingId}` : "/api/admin/tutorials",
        {
          method: editingId ? "PUT" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": user.id,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const payloadError = await response.json().catch(() => ({}));
        throw new Error(payloadError?.error ?? "No se pudo guardar el tutorial");
      }

      setSuccess("Tutorial guardado correctamente.");
      setIsDialogOpen(false);
      await loadItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al guardar el tutorial.";
      setDialogError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (id: number) => {
    setItemToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);

      const { user } = await clientGetUser();
      if (!user) {
        throw new Error("No autenticado");
      }

      const response = await fetch(`/api/admin/tutorials/${itemToDelete}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-User-ID": user.id },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo eliminar el tutorial");
      }
      setSuccess("Tutorial eliminado correctamente.");
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      await loadItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al eliminar el tutorial.";
      setError(message);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Video className="h-6 w-6 text-blue-600" />
            Videos tutoriales
          </CardTitle>
          <CardDescription>
            Agrega videos de YouTube para profesionales y pacientes. Define quién puede ver cada tutorial.
          </CardDescription>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <PlayCircle className="h-4 w-4 mr-2" />
              Agregar video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar tutorial" : "Nuevo tutorial"}
              </DialogTitle>
              <DialogDescription>
                Introduce el enlace completo de YouTube (ej: https://www.youtube.com/watch?v=XXXXXXXX)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formState.title}
                  onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Cómo agendar una cita"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="youtube_url">Enlace de YouTube *</Label>
                <Input
                  id="youtube_url"
                  value={formState.youtube_url}
                  onChange={(e) => setFormState((prev) => ({ ...prev, youtube_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=XXXXXXXX"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formState.description}
                  onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descripción del contenido del video"
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="visibility">Visible para</Label>
                <select
                  id="visibility"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  value={formState.visibility}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      visibility: e.target.value as TutorialVisibility,
                    }))
                  }
                >
                  <option value="professionals">{visibilityLabels.professionals}</option>
                  <option value="patients">{visibilityLabels.patients}</option>
                  <option value="both">{visibilityLabels.both}</option>
                </select>
                <p className="text-xs text-gray-500">
                  Los pacientes aún no tienen acceso a la página de tutoriales.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="display_order">Orden</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formState.display_order}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        display_order: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="is_active">Estado</Label>
                  <select
                    id="is_active"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    value={String(formState.is_active)}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        is_active: e.target.value === "true",
                      }))
                    }
                  >
                    <option value="true">Visible</option>
                    <option value="false">Oculto</option>
                  </select>
                </div>
              </div>

              {dialogError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {dialogError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Confirmar eliminación
              </DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar este tutorial? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setItemToDelete(null);
                }}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-4">
        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 bg-white text-xs md:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Orden</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Título</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Visible para</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Estado</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Cargando tutoriales...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    No hay tutoriales configurados. Agrega el primero con el botón arriba.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">{item.display_order}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{item.title}</span>
                        {item.description && (
                          <span className="text-xs text-gray-500 line-clamp-2">{item.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-gray-600">
                        {visibilityLabels[item.visibility]}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          item.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openDialog(item)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(item.id)}
                          className="p-2 bg-gray-100 hover:bg-gray-200"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
