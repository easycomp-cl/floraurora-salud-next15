import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos: file, userId" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo (solo imágenes)
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo PNG, JPG, JPEG o WEBP" },
        { status: 400 }
      );
    }

    // Validar tamaño (2MB máximo para avatares)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo de 2MB" },
        { status: 400 }
      );
    }

    const admin = createAdminServer();

    // Generar nombre único para el archivo
    const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
    const timestamp = Date.now();
    const fileName = `avatar_${userId}_${timestamp}.${ext}`;
    const path = `avatars/${userId}/${fileName}`;

    // Convertir File a ArrayBuffer para subir
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo usando admin client (bypass RLS)
    const { data: uploadData, error: uploadError } = await admin.storage
      .from("profiles")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true, // Permitir sobrescribir si existe
      });

    if (uploadError) {
      console.error("Error al subir avatar:", uploadError);
      return NextResponse.json(
        { error: "Error al subir el archivo", details: uploadError.message },
        { status: 500 }
      );
    }

    // Obtener URL firmada (signed URL) con expiración de 1 año
    // Las URLs públicas no funcionan si el bucket no es público
    const { data: signedUrlData, error: signedUrlError } = await admin.storage
      .from("profiles")
      .createSignedUrl(uploadData.path, 31536000); // 1 año en segundos
    
    let fileUrl: string;
    if (!signedUrlError && signedUrlData?.signedUrl) {
      fileUrl = signedUrlData.signedUrl;
    } else {
      // Si falla la URL firmada, intentar URL pública como fallback
      console.warn("No se pudo generar URL firmada, usando URL pública:", signedUrlError);
      const { data: publicUrl } = admin.storage.from("profiles").getPublicUrl(uploadData.path);
      fileUrl = publicUrl.publicUrl;
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      path: uploadData.path,
    });
  } catch (error) {
    console.error("Error en API de upload avatar:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

