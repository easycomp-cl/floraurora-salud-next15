import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import { getAdminActorId } from "@/lib/auth/getAdminActor";

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario es administrador
    const actorId = await getAdminActorId();
    if (!actorId) {
      return NextResponse.json(
        { error: "No autorizado. Se requieren permisos de administrador." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos: file" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo (solo imágenes)
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo PNG, JPG, JPEG, WEBP o GIF" },
        { status: 400 }
      );
    }

    // Validar tamaño (5MB máximo para imágenes del carrusel)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo de 5MB" },
        { status: 400 }
      );
    }

    const admin = createAdminServer();

    // Generar nombre único para el archivo
    const ext = file.type.includes("png")
      ? "png"
      : file.type.includes("webp")
        ? "webp"
        : file.type.includes("gif")
          ? "gif"
          : "jpg";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 9);
    const fileName = `carousel_${timestamp}_${randomId}.${ext}`;
    const path = fileName; // Solo el nombre del archivo, el bucket ya se especifica en .from()

    // Convertir File a ArrayBuffer para subir
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo usando admin client (bypass RLS)
    const { data: uploadData, error: uploadError } = await admin.storage
      .from("carousel-images")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false, // No sobrescribir si existe
      });

    if (uploadError) {
      console.error("Error al subir imagen del carrusel:", uploadError);
      return NextResponse.json(
        { error: "Error al subir el archivo", details: uploadError.message },
        { status: 500 }
      );
    }

    // Obtener URL pública (el bucket es público)
    const { data: publicUrl } = admin.storage
      .from("carousel-images")
      .getPublicUrl(uploadData.path);

    // Si el bucket no es público, usar URL firmada como fallback
    let fileUrl: string = publicUrl.publicUrl;

    // Verificar si la URL pública funciona, si no, usar URL firmada
    try {
      const testResponse = await fetch(fileUrl, { method: "HEAD" });
      if (!testResponse.ok) {
        // Intentar con URL firmada
        const { data: signedUrlData, error: signedUrlError } = await admin.storage
          .from("carousel-images")
          .createSignedUrl(uploadData.path, 31536000); // 1 año en segundos

        if (!signedUrlError && signedUrlData?.signedUrl) {
          fileUrl = signedUrlData.signedUrl;
        }
      }
    } catch (error) {
      console.warn("Error al verificar URL pública, usando URL firmada:", error);
      // Intentar con URL firmada como fallback
      const { data: signedUrlData, error: signedUrlError } = await admin.storage
        .from("carousel-images")
        .createSignedUrl(uploadData.path, 31536000); // 1 año en segundos

      if (!signedUrlError && signedUrlData?.signedUrl) {
        fileUrl = signedUrlData.signedUrl;
      }
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      path: uploadData.path,
    });
  } catch (error) {
    console.error("Error en API de upload carousel:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

