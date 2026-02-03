import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ professionalId: string }> }
) {
  try {
    const { professionalId } = await context.params;
    const professionalIdNum = Number(professionalId);

    if (Number.isNaN(professionalIdNum)) {
      return NextResponse.json(
        { error: "ID de profesional inválido" },
        { status: 400 }
      );
    }

    const admin = createAdminServer();

    // Obtener user_id desde users usando el professionalId
    const { data: userData, error: userError } = await admin
      .from("users")
      .select("user_id, email")
      .eq("id", professionalIdNum)
      .maybeSingle();

    if (userError) {
      console.error("Error fetching user data:", userError);
      return NextResponse.json(
        { error: "Error al obtener datos del usuario" },
        { status: 500 }
      );
    }

    if (!userData) {
      return NextResponse.json(
        { data: null },
        { status: 200 }
      );
    }

    const userUuid = userData.user_id ? String(userData.user_id) : null;
    const userEmail = userData.email ? String(userData.email) : null;

    let requestData = null;

    // Buscar primero por user_id (UUID)
    if (userUuid) {
      const { data: approvedRequest, error: approvedError } = await admin
        .from("professional_requests")
        .select(
          "university, profession, study_year_start, study_year_end, extra_studies, degree_copy_url, professional_certificate_url, additional_certificates_urls, status"
        )
        .eq("user_id", userUuid)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (approvedError) {
        console.error("Error fetching approved request:", approvedError);
      }

      if (approvedRequest) {
        requestData = approvedRequest;
      } else {
        // Si no hay aprobada, obtener la más reciente
        const { data: latestRequest, error: latestError } = await admin
          .from("professional_requests")
          .select(
            "university, profession, study_year_start, study_year_end, extra_studies, degree_copy_url, professional_certificate_url, additional_certificates_urls, status"
          )
          .eq("user_id", userUuid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestError) {
          console.error("Error fetching latest request:", latestError);
        }

        if (latestRequest) {
          requestData = latestRequest;
        }
      }
    }

    // Si no se encontró por user_id, intentar por email
    if (!requestData && userEmail) {
      const { data: approvedByEmail, error: approvedEmailError } = await admin
        .from("professional_requests")
        .select(
          "university, profession, study_year_start, study_year_end, extra_studies, degree_copy_url, professional_certificate_url, additional_certificates_urls, status"
        )
        .eq("email", userEmail)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (approvedEmailError) {
        console.error("Error fetching approved request by email:", approvedEmailError);
      }

      if (approvedByEmail) {
        requestData = approvedByEmail;
      } else {
        const { data: latestRequest, error: latestEmailError } = await admin
          .from("professional_requests")
          .select(
            "university, profession, study_year_start, study_year_end, extra_studies, degree_copy_url, professional_certificate_url, additional_certificates_urls, status"
          )
          .eq("email", userEmail)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestEmailError) {
          console.error("Error fetching latest request by email:", latestEmailError);
        }

        if (latestRequest) {
          requestData = latestRequest;
        }
      }
    }

    if (!requestData) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    // Procesar los datos
    const academicData = {
      university: requestData.university ? String(requestData.university).trim() : undefined,
      profession: requestData.profession ? String(requestData.profession).trim() : undefined,
      study_year_start: requestData.study_year_start
        ? String(requestData.study_year_start).trim()
        : undefined,
      study_year_end: requestData.study_year_end
        ? String(requestData.study_year_end).trim()
        : undefined,
      extra_studies: requestData.extra_studies
        ? String(requestData.extra_studies).trim()
        : undefined,
      degree_copy_url: requestData.degree_copy_url
        ? String(requestData.degree_copy_url)
        : null,
      professional_certificate_url: requestData.professional_certificate_url
        ? String(requestData.professional_certificate_url)
        : null,
      additional_certificates_urls: requestData.additional_certificates_urls
        ? typeof requestData.additional_certificates_urls === "string"
          ? requestData.additional_certificates_urls.trim()
            ? JSON.parse(requestData.additional_certificates_urls)
            : null
          : requestData.additional_certificates_urls
        : null,
    };

    return NextResponse.json({ data: academicData }, { status: 200 });
  } catch (error) {
    console.error("Error in professional-academic-data API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
