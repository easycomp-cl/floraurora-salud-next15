"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import type { CarouselItem } from "@/lib/types/adminConfig";
import { clientGetUser } from "@/lib/client-auth";

interface CarouselFormState {
  title: string;
  message: string;
  image_url: string;
  cta_label: string;
  cta_link: string;
  start_date: string;
  end_date: string;
  display_order: number;
  is_active: boolean;
}

const defaultFormState: CarouselFormState = {
  title: "",
  message: "",
  image_url: "",
  cta_label: "",
  cta_link: "",
  start_date: "",
  end_date: "",
  display_order: 0,
  is_active: true,
};

export default function CarouselManagerPanel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [formState, setFormState] = useState<CarouselFormState>(defaultFormState);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Obtener el usuario actual para incluir el header X-User-ID
      const { user } = await clientGetUser();
      if (!user) {
        throw new Error("No autenticado");
      }

      const response = await fetch("/api/admin/carousel", {
        cache: "no-store",
        credentials: "include", // Incluir cookies para autenticación
        headers: {
          "X-User-ID": user.id, // Enviar user_id en header como respaldo
        },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo obtener el carrusel");
      }
      const payload = await response.json();
      setItems(payload.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al cargar el carrusel.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openDialog = (item?: CarouselItem) => {
    setDialogError(null);
    setSuccess(null);
    setImagePreview(null);
    if (item) {
      setEditingId(item.id);
      setFormState({
        title: item.title ?? "",
        message: item.message ?? "",
        image_url: item.image_url ?? "",
        cta_label: item.cta_label ?? "",
        cta_link: item.cta_link ?? "",
        start_date: item.start_date ?? "",
        end_date: item.end_date ?? "",
        display_order: item.display_order,
        is_active: item.is_active,
      });
      if (item.image_url) {
        setImagePreview(item.image_url);
      }
    } else {
      setEditingId(null);
      setFormState(defaultFormState);
    }
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setDialogError("Tipo de archivo no permitido. Solo PNG, JPG, JPEG, WEBP o GIF");
      return;
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setDialogError("El archivo excede el tamaño máximo de 5MB");
      return;
    }

    try {
      setIsUploadingImage(true);
      setDialogError(null);

      // Crear FormData
      const formData = new FormData();
      formData.append("file", file);

      // Subir imagen
      const response = await fetch("/api/admin/carousel/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error ?? "Error al subir la imagen");
      }

      const data = await response.json();
      
      // Actualizar el estado con la URL de la imagen
      setFormState((prev) => ({ ...prev, image_url: data.url }));
      setImagePreview(data.url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al subir la imagen.";
      setDialogError(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Obtener el usuario actual para incluir el header X-User-ID
      const { user } = await clientGetUser();
      if (!user) {
        throw new Error("No autenticado");
      }
      
      const payload = {
        ...formState,
        display_order: Number(formState.display_order),
        start_date: formState.start_date || null,
        end_date: formState.end_date || null,
        image_url: formState.image_url || null,
        title: formState.title || null,
        message: formState.message || null,
        cta_label: formState.cta_label || null,
        cta_link: formState.cta_link || null,
      };

      const response = await fetch(
        editingId ? `/api/admin/carousel/${editingId}` : "/api/admin/carousel",
        {
          method: editingId ? "PUT" : "POST",
          credentials: "include", // Incluir cookies para autenticación
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": user.id, // Enviar user_id en header como respaldo
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const payloadError = await response.json().catch(() => ({}));
        throw new Error(payloadError?.error ?? "No se pudo guardar el elemento del carrusel");
      }

      setSuccess("Carrusel actualizado correctamente.");
      setIsDialogOpen(false);
      await loadItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al guardar el carrusel.";
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
      
      // Obtener el usuario actual para incluir el header X-User-ID
      const { user } = await clientGetUser();
      if (!user) {
        throw new Error("No autenticado");
      }
      
      const response = await fetch(`/api/admin/carousel/${itemToDelete}`, {
        method: "DELETE",
        credentials: "include", // Incluir cookies para autenticación
        headers: {
          "X-User-ID": user.id, // Enviar user_id en header como respaldo
        },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo eliminar el elemento");
      }
      setSuccess("Elemento eliminado correctamente.");
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      await loadItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al eliminar el elemento.";
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
          <CardTitle className="text-xl font-semibold text-gray-900">
            Carrusel de la página principal
          </CardTitle>
          <CardDescription>
            Configura los mensajes destacados que se muestran en la página de inicio.
          </CardDescription>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>Agregar elemento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar elemento del carrusel" : "Nuevo elemento del carrusel"}
              </DialogTitle>
              <DialogDescription>
                Puedes dejar campos opcionales vacíos. El orden define la prioridad de aparición.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formState.title}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, title: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="display_order">Orden de despliegue</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formState.display_order}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        display_order: Number(event.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="message">Mensaje</Label>
                  <textarea
                    id="message"
                    className="min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    value={formState.message}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, message: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image_upload">Imagen del carrusel</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="image_upload"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                        className="cursor-pointer"
                      />
                      {isUploadingImage && (
                        <span className="flex items-center text-sm text-gray-500">
                          Subiendo...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Formatos permitidos: PNG, JPG, JPEG, WEBP, GIF. Tamaño máximo: 5MB
                    </p>
                  </div>
                </div>

                {imagePreview && (
                  <div className="space-y-2">
                    <Label>Vista previa</Label>
                    <div className="relative w-full h-48 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <Image
                        src={imagePreview}
                        alt="Vista previa"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="cta_label">Texto botón</Label>
                  <Input
                    id="cta_label"
                    value={formState.cta_label}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, cta_label: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cta_link">Link del botón</Label>
                  <Input
                    id="cta_link"
                    placeholder="https://..."
                    value={formState.cta_link}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, cta_link: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="start_date">Fecha inicio</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formState.start_date}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, start_date: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="end_date">Fecha fin</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formState.end_date}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, end_date: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="is_active">Estado</Label>
                <select
                  id="is_active"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  value={String(formState.is_active)}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      is_active: event.target.value === "true",
                    }))
                  }
                >
                  <option value="true">Visible</option>
                  <option value="false">Oculto</option>
                </select>
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

        {/* Diálogo de confirmación de eliminación */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Confirmar eliminación
              </DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar este elemento del carrusel? Esta acción no se puede deshacer.
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
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Vigencia</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Estado</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Cargando carrusel...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    No hay elementos configurados actualmente.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">{item.display_order}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{item.title ?? "Sin título"}</span>
                        {item.message && (
                          <span className="text-xs text-gray-500 line-clamp-2">{item.message}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {item.start_date ? item.start_date : "Sin inicio"} →{" "}
                      {item.end_date ? item.end_date : "Sin fin"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          item.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
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
                          className="p-2 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                          title="Eliminar elemento"
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

