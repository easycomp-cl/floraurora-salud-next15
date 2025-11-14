import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";

// Next.js App Router API routes handle FormData automatically without body size limits
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;
    const tempUserId = formData.get("tempUserId") as string;

    if (!file || !folder || !tempUserId) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos: file, folder, tempUserId" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo PDF, PNG, JPG o JPEG" },
        { status: 400 }
      );
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo de 5MB" },
        { status: 400 }
      );
    }

    const admin = createAdminServer();

    // Generar nombre único para el archivo con estructura temporal
    // La estructura final será reorganizada después con: folder/userId/tipo-documento_userId_timestamp.ext
    const ext = file.type.includes("pdf") ? "pdf" : file.type.includes("png") ? "png" : "jpg";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 9);
    const fileName = `temp_${timestamp}_${randomId}.${ext}`;
    const path = `${folder}/${tempUserId}/${fileName}`;

    // Convertir File a ArrayBuffer para subir
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo usando admin client (bypass RLS)
    const { data: uploadData, error: uploadError } = await admin.storage
      .from("documents")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error al subir archivo:", uploadError);
      return NextResponse.json(
        { error: "Error al subir el archivo", details: uploadError.message },
        { status: 500 }
      );
    }

    // Obtener URL firmada (signed URL) con expiración de 1 año
    // Las URLs públicas no funcionan si el bucket no es público
    const { data: signedUrlData, error: signedUrlError } = await admin.storage
      .from("documents")
      .createSignedUrl(uploadData.path, 31536000); // 1 año en segundos
    
    let fileUrl: string;
    if (!signedUrlError && signedUrlData?.signedUrl) {
      fileUrl = signedUrlData.signedUrl;
    } else {
      // Si falla la URL firmada, intentar URL pública como fallback
      console.warn("No se pudo generar URL firmada, usando URL pública:", signedUrlError);
      const { data: publicUrl } = admin.storage.from("documents").getPublicUrl(uploadData.path);
      fileUrl = publicUrl.publicUrl;
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      path: uploadData.path,
    });
  } catch (error) {
    console.error("Error en API de upload:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

