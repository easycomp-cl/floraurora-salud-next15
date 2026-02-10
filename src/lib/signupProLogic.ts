/**
 * Lógica compartida para el registro de profesionales.
 * Usado por la API route y por la Server Action (auth-actions).
 */
import { revalidatePath } from "next/cache";
import { createAdminServer } from "@/utils/supabase/server";

export type SignupProResult =
  | { success: true; redirectUrl: string }
  | { success: false; error: string; redirectUrl?: string };

export async function executeSignupPro(formData: FormData): Promise<SignupProResult> {
  const admin = createAdminServer();

  try {
    // Obtener datos del formulario
    const first_name = (formData.get("first_name") as string)?.trim() || "";
    const last_name_p = (formData.get("last_name_p") as string)?.trim() || "";
    const last_name_m = (formData.get("last_name_m") as string)?.trim() || "";
    const full_name = `${first_name} ${last_name_p} ${last_name_m}`.trim();
    const rut = (formData.get("rut") as string)?.trim() || "";
    const birth_date = (formData.get("birth_date") as string) || "";
    const email = (formData.get("email") as string)?.toLowerCase().trim() || "";
    const phone_number = (formData.get("phone_number") as string)?.trim() || "";
    const university = (formData.get("university") as string)?.trim() || "";
    const profession = (formData.get("profession") as string)?.trim() || "";
    const study_year_start = (formData.get("study_year_start") as string)?.trim() || "";
    const study_year_end = (formData.get("study_year_end") as string)?.trim() || "";
    const extra_studies = (formData.get("extra_studies") as string)?.trim() || "";
    const superintendence_number = (formData.get("superintendence_number") as string)?.trim() || "";
    const region_id = formData.get("region_id");
    const municipality_id = formData.get("municipality_id");
    const plan_type_raw = (formData.get("plan_type") as string)?.trim() || "";
    const plan_type = plan_type_raw === "commission" || plan_type_raw === "monthly" ? plan_type_raw : null;

    console.log("[signupPro] Iniciando registro profesional:", { email, full_name: full_name || "(vacío)" });

    if (!email) {
      console.error("[signupPro] Email es requerido");
      return { success: false, error: "email-required", redirectUrl: "/signup-pro?error=email-required" };
    }

    // Verificar si ya existe una solicitud para este email
    const { data: existingRequest } = await admin
      .from("professional_requests")
      .select("id, status, email, user_id")
      .eq("email", email)
      .maybeSingle();

    if (existingRequest && existingRequest.status === "pending") {
      console.log("[signupPro] Ya existe solicitud pendiente para:", email);
      return { success: true, redirectUrl: "/signup-pro/success?existing=true" };
    }

    const isResubmission = existingRequest && (existingRequest.status === "rejected" || existingRequest.status === "resubmitted");
    let userId: string | null = null;

    if (isResubmission && existingRequest?.user_id) {
      userId = existingRequest.user_id;
    } else {
      const { data: existingPublicUser } = await admin
        .from("users")
        .select("id, email, role")
        .eq("email", email)
        .maybeSingle();

      if (existingPublicUser) {
        console.error("[signupPro] Usuario ya existe en public.users:", email);
        return { success: false, error: "user-exists", redirectUrl: "/signup-pro?error=user-exists" };
      }

      try {
        const { data: authUsers } = await admin.auth.admin.listUsers();
        const existingAuthUser = authUsers?.users?.find(
          (user) => user.email?.toLowerCase() === email.toLowerCase()
        );
        if (existingAuthUser) {
          console.error("[signupPro] Usuario ya existe en auth.users:", email);
          return { success: false, error: "user-exists", redirectUrl: "/signup-pro?error=user-exists" };
        }
      } catch (authError) {
        console.error("[signupPro] Error al verificar usuarios en auth:", authError);
      }
    }

    // URLs de archivos
    const temp_user_id = (formData.get("temp_user_id") as string) || "";
    const degree_copy_url = (formData.get("degree_copy_url") as string) || null;
    const id_copy_url = (formData.get("id_copy_url") as string) || null;
    const professional_certificate_url = (formData.get("professional_certificate_url") as string) || null;

    let additional_certificates_urls: string[] = [];
    try {
      const additionalCertsJson = formData.get("additional_certificates_urls");
      if (additionalCertsJson && typeof additionalCertsJson === "string") {
        additional_certificates_urls = JSON.parse(additionalCertsJson);
      }
    } catch (e) {
      console.error("[signupPro] Error al parsear certificados adicionales:", e);
    }

    let final_degree_copy_url: string | null = degree_copy_url;
    let final_id_copy_url: string | null = id_copy_url;
    let final_professional_certificate_url: string | null = professional_certificate_url;
    const tempIdentifier = temp_user_id || email.replace(/[^a-zA-Z0-9]/g, "_");

    if (temp_user_id) {
      const reorganizeFile = async (url: string | null, folder: string, fileType: string): Promise<string | null> => {
        if (!url) return url;
        try {
          const urlObj = new URL(url);
          let oldPath: string | undefined;
          if (urlObj.pathname.includes("/storage/v1/object/public/documents/")) {
            oldPath = urlObj.pathname.split("/storage/v1/object/public/documents/")[1];
          } else if (urlObj.pathname.includes("/storage/v1/object/sign/documents/")) {
            oldPath = urlObj.pathname.split("/storage/v1/object/sign/documents/")[1];
            if (oldPath?.includes("?")) oldPath = oldPath.split("?")[0];
          }
          if (!oldPath) return url;
          const pathParts = oldPath.split("/");
          const oldFileName = pathParts[pathParts.length - 1];
          const ext = oldFileName.split(".").pop() || "pdf";
          const timestamp = Date.now();
          const newFileName = `${fileType}_${tempIdentifier}_${timestamp}.${ext}`;
          const newPath = `${folder}/pending/${tempIdentifier}/${newFileName}`;
          const { data: copyData, error: copyError } = await admin.storage
            .from("documents")
            .copy(oldPath, newPath);
          if (!copyError && copyData) {
            await admin.storage.from("documents").remove([oldPath]);
            const { data: signedUrlData, error: signedUrlError } = await admin.storage
              .from("documents")
              .createSignedUrl(newPath, 31536000);
            if (!signedUrlError && signedUrlData?.signedUrl) return signedUrlData.signedUrl;
            const { data: publicUrl } = admin.storage.from("documents").getPublicUrl(newPath);
            return publicUrl.publicUrl;
          }
          return url;
        } catch (err) {
          console.error("[signupPro] Error al reorganizar archivo:", err);
          return url;
        }
      };

      const [reorganized_degree_url, reorganized_id_url, reorganized_cert_url] = await Promise.all([
        reorganizeFile(degree_copy_url, "professional-degrees", "titulo-universitario"),
        reorganizeFile(id_copy_url, "id-copies", "cedula-identidad"),
        reorganizeFile(professional_certificate_url, "professional-certificates", "certificado-profesional"),
      ]);
      final_degree_copy_url = reorganized_degree_url;
      final_id_copy_url = reorganized_id_url;
      final_professional_certificate_url = reorganized_cert_url;
      if (additional_certificates_urls.length > 0) {
        const reorganizedAdditionalCerts = await Promise.all(
          additional_certificates_urls.map((url, index) =>
            reorganizeFile(url, "additional-certificates", `certificado-adicional-${index + 1}`)
          )
        );
        additional_certificates_urls = reorganizedAdditionalCerts.filter((u): u is string => u !== null);
      }
    }

    const regionIdNum = region_id ? parseInt(region_id as string, 10) : NaN;
    const municipalityIdNum = municipality_id ? parseInt(municipality_id as string, 10) : NaN;

    if (isResubmission && existingRequest?.id) {
      const updatePayload: Record<string, unknown> = {
        full_name,
        rut,
        birth_date,
        phone_number,
        university,
        profession,
        study_year_start,
        study_year_end,
        extra_studies,
        superintendence_number,
        degree_copy_url: final_degree_copy_url,
        id_copy_url: final_id_copy_url,
        professional_certificate_url: final_professional_certificate_url,
        additional_certificates_urls: additional_certificates_urls.length > 0 ? JSON.stringify(additional_certificates_urls) : null,
        status: "resubmitted",
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        updated_at: new Date().toISOString(),
      };
      if (!Number.isNaN(regionIdNum) && regionIdNum > 0) updatePayload.region_id = regionIdNum;
      if (!Number.isNaN(municipalityIdNum) && municipalityIdNum > 0) updatePayload.municipality_id = municipalityIdNum;
      if (plan_type) updatePayload.plan_type = plan_type;

      const { error: requestError } = await admin.from("professional_requests")
        .update(updatePayload)
        .eq("id", existingRequest.id);

      if (requestError) {
        console.error("[signupPro] Error al actualizar solicitud:", requestError);
        return { success: false, error: "request-update-failed", redirectUrl: "/signup-pro?error=request-update-failed" };
      }
      console.log("[signupPro] Solicitud actualizada exitosamente. ID:", existingRequest.id);
    } else {
      const insertPayload: Record<string, unknown> = {
        user_id: userId || null,
        full_name,
        rut,
        birth_date,
        email,
        phone_number,
        university,
        profession,
        study_year_start,
        study_year_end,
        extra_studies,
        superintendence_number,
        degree_copy_url: final_degree_copy_url,
        id_copy_url: final_id_copy_url,
        professional_certificate_url: final_professional_certificate_url,
        additional_certificates_urls: additional_certificates_urls.length > 0 ? JSON.stringify(additional_certificates_urls) : null,
        status: "pending",
      };
      if (!Number.isNaN(regionIdNum) && regionIdNum > 0) insertPayload.region_id = regionIdNum;
      if (!Number.isNaN(municipalityIdNum) && municipalityIdNum > 0) insertPayload.municipality_id = municipalityIdNum;
      if (plan_type) insertPayload.plan_type = plan_type;

      const { data: insertData, error: requestError } = await admin.from("professional_requests").insert(insertPayload).select("id").single();

      if (requestError) {
        console.error("[signupPro] Error al guardar solicitud profesional:", requestError);
        return { success: false, error: "request-creation-failed", redirectUrl: "/signup-pro?error=request-creation-failed" };
      }
      console.log("[signupPro] Solicitud creada exitosamente. ID:", insertData?.id);
    }

    // Enviar correo al profesional
    try {
      const { sendProfessionalRequestReceivedEmail } = await import("@/lib/services/emailService");
      await sendProfessionalRequestReceivedEmail({ to: email, professionalName: full_name });
      console.log("[signupPro] Correo enviado al profesional:", email);
    } catch (emailError) {
      console.error("[signupPro] Error al enviar correo al profesional (no crítico):", emailError);
    }

    // Enviar notificación al admin
    try {
      const { sendProfessionalRegistrationNotification } = await import("@/lib/services/emailService");
      await sendProfessionalRegistrationNotification({
        professionalName: full_name,
        professionalEmail: email,
        professionalPhone: phone_number || null,
        rut: rut || null,
      });
      console.log("[signupPro] Notificación enviada al equipo");
    } catch (notificationError) {
      console.error("[signupPro] Error al enviar notificación (no crítico):", notificationError);
    }

    revalidatePath("/", "layout");
    const successUrl = isResubmission ? "/signup-pro/success?resubmitted=true" : "/signup-pro/success";
    return { success: true, redirectUrl: successUrl };
  } catch (err) {
    console.error("[signupPro] Error inesperado:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error interno",
      redirectUrl: "/signup-pro?error=signup-failed",
    };
  }
}
