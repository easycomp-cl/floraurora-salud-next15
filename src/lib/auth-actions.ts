"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createAdminServer } from "@/utils/supabase/server";
import { logAccountProvider } from "@/utils/supabase/accountProvider";

import { z } from "zod";
import { resetPasswordSchema } from "@/lib/validations/password";
import { config } from "@/lib/config";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const signupSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function getSession() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error("Unexpected error getting session:", error);
    return null;
  }
}

export async function getUser() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("Error getting user:", error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error("Unexpected error getting user:", error);
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    redirect("/auth/login");
  }
  
  return session;
}

export async function requireUser() {
  const user = await getUser();
  
  if (!user) {
    redirect("/auth/login");
  }
  
  return user;
}

// export async function login(prevState: { message?: string; error?: string } | null, formData: FormData) {
//   const supabase = await createClient();

//   const data = {
//     email: (formData.get("email") as string | null)?.toLowerCase().trim() || "",
//     password: (formData.get("password") as string | null)?.trim() || "",
//   };

//   // Validar los datos con Zod
//   const parsed = loginSchema.safeParse(data);

//   if (!parsed.success) {
//     console.log("❌ Error de validación Zod:", parsed.error.flatten());
//     return {
//       success: false,
//       error: "Datos de formulario inválidos",
//       details: parsed.error.flatten(),
//     };
//   }

//   const { error } = await supabase.auth.signInWithPassword(parsed.data);

//   if (error) {
//       // Log del error completo para debugging
//       console.log("❌ Error de autenticación Supabase:", {
//         message: error.message,
//         status: error.status,
//         name: error.name,
//         stack: error.stack,
//         fullError: error
//       });
//     const message = (error.message || "").toLowerCase();
//     const isGoogleOnly =
//       message.includes("oauth") ||
//       message.includes("social") ||
//       message.includes("use a magic link") ||
//       message.includes("email link") ||
//       message.includes("identity already exists") ||
//       message.includes("sign in with google") ||
//       message.includes("password authentication is disabled");

//       if (isGoogleOnly) {
//         console.log("🔍 Detectada cuenta registrada con Google");
//       }

//     return {
//       success: false,
//       error: isGoogleOnly
//         ? "Esta cuenta está registrada con Google"
//         : "Error al iniciar sesión",
//     };
//   }

//   // Éxito - redirigir al dashboard
//   console.log("✅ Login exitoso, redirigiendo al dashboard");
//   revalidatePath("/");
//   redirect("/dashboard");
// }

export async function login(prevState: { message?: string; error?: string } | null, formData: FormData) {
  // 1) Parse & validate input
  const data = {
    email: (formData.get("email") as string | null)?.toLowerCase().trim() || "",
    password: (formData.get("password") as string | null)?.trim() || "",
  };
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid form data",
      details: parsed.error.flatten(),
    };
  }
  //console.log("🔍 Email:", parsed.data.email);
  const emailUser = parsed.data.email;
  const result = await logAccountProvider(emailUser);
  //[TEST]const result = await logAccountProvider("irraxdgonz7@gmail.com");
  console.log("🔍 Resultado de logAccountProvider:", JSON.stringify(result, null, 2));

  if (!result.exists) {
    console.log("🔍 No se encontró ningún usuario con este correo electrónico");
    return {
      success: false,
      error: "Credenciales incorrectas",
    };
  }

  if (result.exists && result.providers?.includes("google")) {
    return {
      success: false,
      error: "Esta cuenta es de Google. Por favor, inicie sesión con Google.",
      provider: "google",
    };
  } 

  // 2) Create Supabase clients
  // - anon SSR client for regular auth
  // - admin client (SERVICE ROLE) ONLY on server to inspect providers
  const supabase = await createClient();
  const admin = createAdminServer(); // must use SUPABASE_SERVICE_ROLE_KEY (server-only!)

  const lu = await admin.auth.admin.listUsers();
  if (lu.error) return { success: false, error: "Auth service unavailable" };

  const authUser = lu.data?.users?.find(u => (u.email || "").toLowerCase() === emailUser) ?? null;
  console.log("🔍 authUser:", JSON.stringify(authUser, null, 2));
  if (!authUser) {
    return { success: false, error: "No account found with this email" };
  }

  if (!authUser.email_confirmed_at) {
    return {
      success: false,
      error: "Por favor, confirme su correo electrónico antes de iniciar sesión.",
      needsConfirmation: true,
    };
  }


  // 3) Look up the account by email with Admin API to detect providers
  // This avoids brittle string-matching on error messages.
  const { data: listed, error: adminErr } = await admin.auth.admin.listUsers();

  if (adminErr) {
    console.error("Admin listUsers error:", adminErr);
    return { success: false, error: "Auth service unavailable" };
  }

  // Filtrar usuarios por email manualmente
  const user = listed?.users?.find(u => (u.email || "").toLowerCase() === emailUser);
  if (!user) {
    console.log("🔍 No se encontró ningún usuario con este correo electrónico");
    return { success: false, error: "No se encontró cuenta con este correo electrónico" };
  }


  // Intentar iniciar sesión
  const { data: signInData, error } = await supabase.auth.signInWithPassword({ 
    email: emailUser, 
    password: parsed.data.password 
  });

  if (error) {
    const msg = (error.message || "").toLowerCase();
    const isBadCreds = msg.includes("invalid login") || msg.includes("invalid credentials");
    return { success: false, error: isBadCreds ? "Email o contraseña incorrectos" : "Error al iniciar sesión" };
  }

  // Verificar que la sesión se haya creado correctamente
  if (!signInData.session) {
    return { success: false, error: "Error al crear la sesión de usuario" };
  }

  console.log("✅ Inicio de sesión exitoso, sesión creada:", {
    userId: signInData.user?.id,
    userEmail: signInData.user?.email,
    hasSession: !!signInData.session,
    hasAccessToken: !!signInData.session.access_token
  });

  // 4) Redirect (303) — now the session cookie exists, so /dashboard won't bounce to /auth/login
  revalidatePath("/");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  // Validar variables de entorno críticas
  console.log("🔍 Validando configuración de Supabase:", {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("❌ Variables de entorno de Supabase no configuradas");
    redirect("/auth/signup?error=config-error");
  }

  const supabase = await createClient();
  const admin = createAdminServer();
  console.log("🔍 formData recibido:", {
    hasFirstName: !!formData.get("first-name"),
    hasLastName: !!formData.get("last-name"),
    hasEmail: !!formData.get("email"),
    hasPassword: !!formData.get("password")
  });
  const firstName = formData.get("first-name") as string;
  const lastName = formData.get("last-name") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim() || "";
  const password = formData.get("password") as string;

  // 1. Validar los datos con Zod
  const parsed = signupSchema.safeParse({
    firstName,
    lastName,
    email,
    password,
  });

  if (!parsed.success) {
    console.log("❌ Error de validación Zod en signup:", parsed.error.flatten());
    redirect("/auth/signup?error=invalid-data");
  }

  // 2. Verificar si el usuario ya existe en Supabase Auth
  const { data: existingUsers, error: listUsersError } = await admin.auth.admin.listUsers();

  if (listUsersError) {
    console.error("Error al listar usuarios para verificar existencia:", listUsersError);
    redirect("/auth/signup?error=auth-service-error");
  }

  if (existingUsers?.users) {
    const userExists = existingUsers.users.some((user) => user.email?.toLowerCase() === email);
    if (userExists) {
      console.log("🔍 Usuario ya existe:", email);
      redirect("/auth/signup?error=user-exists");
    }
  }

  // 3. Registrar el usuario en Supabase Auth
  console.log("🔍 Iniciando registro en Supabase Auth:", {
    email,
    firstName,
    lastName,
    hasPassword: !!password
  });
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  console.log("🔍 URL de redirección configurada:", `${baseUrl}/confirm`);
  
  const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      emailRedirectTo: `${baseUrl}/confirm`,
      data: {
        full_name: `${firstName} ${lastName}`,
        email: email,
      },
    },
  });
  
  console.log("🔍 Resultado del registro Supabase:", {
    hasError: !!signUpError,
    error: signUpError,
    hasUser: !!signUpData.user,
    user: signUpData.user,
    hasSession: !!signUpData.session,
    emailSent: signUpData.user ? !signUpData.user.email_confirmed_at : false,
    emailConfirmed: signUpData.user?.email_confirmed_at,
    needsConfirmation: signUpData.user ? !signUpData.user.email_confirmed_at : false
  });

  // Logging específico para debugging de correos
  if (signUpData.user && !signUpData.user.email_confirmed_at) {
    console.log("📧 CORREO DEBE HABERSE ENVIADO:", {
      userId: signUpData.user.id,
      email: signUpData.user.email,
      emailConfirmed: signUpData.user.email_confirmed_at,
      redirectUrl: `${baseUrl}/confirm`,
      userMetadata: signUpData.user.user_metadata
    });
  } else if (signUpData.user && signUpData.user.email_confirmed_at) {
    console.log("⚠️ CORREO YA CONFIRMADO (caso inesperado):", {
      userId: signUpData.user.id,
      email: signUpData.user.email,
      emailConfirmed: signUpData.user.email_confirmed_at
    });
  }

  if (signUpError) {
    console.error("❌ Error al registrar usuario en Supabase Auth:", {
      message: signUpError.message,
      status: signUpError.status,
      name: signUpError.name,
      fullError: signUpError
    });
    
    if (signUpError.message.includes("User already registered")) {
      console.log("🔍 Usuario ya registrado, redirigiendo...");
      redirect("/auth/signup?error=user-exists");
    }
    
    if (signUpError.message.includes("Invalid email")) {
      console.log("🔍 Email inválido");
      redirect("/auth/signup?error=invalid-email");
    }
    
    if (signUpError.message.includes("Password should be at least")) {
      console.log("🔍 Contraseña muy corta");
      redirect("/auth/signup?error=weak-password");
    }
    
    console.log("🔍 Error genérico de registro, redirigiendo...");
    redirect("/auth/signup?error=signup-failed");
  }

  // 4. Verificar que el registro fue exitoso
  if (signUpData.user) {
    console.log("✅ Usuario registrado exitosamente en Supabase Auth:", {
      userId: signUpData.user.id,
      email: signUpData.user.email,
      emailConfirmed: signUpData.user.email_confirmed_at,
      needsConfirmation: !signUpData.user.email_confirmed_at
    });

    if (!signUpData.user.email_confirmed_at) {
      console.log("📧 Correo de confirmación enviado. Usuario necesita confirmar su email.");
    } else {
      console.log("✅ Email ya confirmado (caso inesperado en registro nuevo)");
    }
  } else {
    console.error("❌ Error: signUpData.user es nulo después de un registro exitoso sin error.");
    redirect("/auth/signup?error=unexpected-error");
  }
  
  console.log("🔍 Redirigiendo a página de confirmación...");
  revalidatePath("/", "layout");
  redirect("/confirm");
}

export async function signupPro(formData: FormData) {
  const admin = createAdminServer();

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

  // Validar que tenemos email
  if (!email) {
    console.error("Email es requerido");
    redirect("/signup-pro?error=email-required");
  }

  // Verificar si ya existe una solicitud para este email
  const { data: existingRequest } = await admin
    .from("professional_requests")
    .select("id, status, email, user_id")
    .eq("email", email)
    .maybeSingle();
  
  // Solo bloquear si hay una solicitud pendiente (en revisión activa)
  // Permitir actualizar si está rechazada o reenviada
  if (existingRequest && existingRequest.status === "pending") {
    console.error("Ya existe una solicitud pendiente para este email:", email);
    redirect("/signup-pro?error=request-pending");
  }
  
  // Si existe una solicitud rechazada o reenviada, la actualizaremos en lugar de crear una nueva
  const isResubmission = existingRequest && (existingRequest.status === "rejected" || existingRequest.status === "resubmitted");

  let userId: string;
  
  // Si es un reenvío, usar el usuario existente y actualizar datos
  if (isResubmission && existingRequest?.user_id) {
    userId = existingRequest.user_id;
    console.log("Reenvío de solicitud rechazada, usando usuario existente:", userId);
    
    // Actualizar datos del usuario en public.users
    const { error: userUpdateError } = await admin.from("users")
      .update({
        name: first_name,
        last_name: `${last_name_p} ${last_name_m}`.trim(),
        phone_number,
        rut,
        is_active: false, // Mantener inactivo hasta nueva aprobación
      })
      .eq("user_id", userId);
    
    if (userUpdateError) {
      console.error("Error al actualizar usuario en reenvío:", userUpdateError);
      redirect("/signup-pro?error=user-update-failed");
    }
  } else {
    // Verificar si el usuario ya existe en public.users primero (más rápido)
    const { data: existingPublicUser } = await admin
      .from("users")
      .select("id, email, role")
      .eq("email", email)
      .maybeSingle();
    
    if (existingPublicUser) {
      console.error("Usuario ya existe en public.users:", email);
      redirect("/signup-pro?error=user-exists");
    }
    
    // También verificar en auth.users antes de crear
    // Listar usuarios y buscar por email (más eficiente que intentar crear y fallar)
    try {
      const { data: authUsers } = await admin.auth.admin.listUsers();
      const existingAuthUser = authUsers?.users?.find(
        (user) => user.email?.toLowerCase() === email.toLowerCase()
      );
      
      if (existingAuthUser) {
        console.error("Usuario ya existe en auth.users:", email);
        redirect("/signup-pro?error=user-exists");
      }
    } catch (error) {
      console.error("Error al verificar usuarios en auth:", error);
      // Continuar con el registro si no podemos verificar
    }

    // Generar contraseña temporal (el usuario la cambiará después de aprobación)
    const tempPassword = `Temp${Math.random().toString(36).slice(2, 15)}!${Math.random().toString(36).slice(2, 8)}`;

    // 1. Crear usuario en auth.users
    const { data: signUpData, error: signUpError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false, // No confirmado hasta que admin apruebe
      user_metadata: {
        full_name,
        email,
        role: "professional",
      },
    });

    if (signUpError || !signUpData.user) {
      console.error("Error al crear usuario en auth:", signUpError);
      // Si el error es que el usuario ya existe, redirigir con ese mensaje
      if (signUpError?.message?.includes("already registered") || signUpError?.message?.includes("already exists")) {
        redirect("/signup-pro?error=user-exists");
      }
      redirect("/signup-pro?error=signup-failed");
    }

    userId = signUpData.user.id;

    // 2. Crear registro en public.users con role=3 (profesional) y estado pendiente
    // Usar admin client para bypass RLS
    const { error: userInsertError } = await admin.from("users").insert({
      user_id: userId,
      email,
      name: first_name,
      last_name: `${last_name_p} ${last_name_m}`.trim(),
      role: 3, // Profesional
      is_active: false, // Inactivo hasta aprobación
      phone_number,
      rut,
    });

    if (userInsertError) {
      console.error("Error al crear usuario en public.users:", userInsertError);
      // Intentar eliminar el usuario de auth si falla la inserción
      await admin.auth.admin.deleteUser(userId);
      redirect("/signup-pro?error=user-creation-failed");
    }
  }

  // 3. Obtener URLs de archivos (ya subidos desde el cliente) o archivos directamente
  const temp_user_id = (formData.get("temp_user_id") as string) || "";
  const degree_copy_url = (formData.get("degree_copy_url") as string) || null;
  const id_copy_url = (formData.get("id_copy_url") as string) || null;
  const professional_certificate_url = (formData.get("professional_certificate_url") as string) || null;
  
  // Obtener URLs de certificados adicionales (JSON array)
  let additional_certificates_urls: string[] = [];
  try {
    const additionalCertsJson = formData.get("additional_certificates_urls");
    if (additionalCertsJson && typeof additionalCertsJson === "string") {
      additional_certificates_urls = JSON.parse(additionalCertsJson);
    }
  } catch (error) {
    console.error("Error al parsear certificados adicionales:", error);
  }

  // 4. Si los archivos fueron subidos con temp_user_id, reorganizarlos a la carpeta del usuario real
  let final_degree_copy_url: string | null = degree_copy_url;
  let final_id_copy_url: string | null = id_copy_url;
  let final_professional_certificate_url: string | null = professional_certificate_url;

  if (temp_user_id && userId) {
    const reorganizeFile = async (url: string | null, folder: string, fileType: string): Promise<string | null> => {
      if (!url) return url;
      
      try {
        // Extraer el path del archivo desde la URL (puede ser pública o firmada)
        const urlObj = new URL(url);
        let oldPath: string | undefined;
        
        // Intentar extraer de URL pública
        if (urlObj.pathname.includes("/storage/v1/object/public/documents/")) {
          oldPath = urlObj.pathname.split("/storage/v1/object/public/documents/")[1];
        }
        // Intentar extraer de URL firmada (signed URL)
        else if (urlObj.pathname.includes("/storage/v1/object/sign/documents/")) {
          oldPath = urlObj.pathname.split("/storage/v1/object/sign/documents/")[1];
          // Remover parámetros de query si existen
          if (oldPath.includes("?")) {
            oldPath = oldPath.split("?")[0];
          }
        }
        
        if (!oldPath) {
          console.warn("No se pudo extraer el path de la URL:", url);
          return url;
        }
        
        // Crear nuevo path con estructura organizada: folder/userId/tipo-documento_userId_timestamp.ext
        const pathParts = oldPath.split("/");
        const oldFileName = pathParts[pathParts.length - 1];
        const ext = oldFileName.split(".").pop() || "pdf";
        
        // Nombre descriptivo del archivo: tipo-documento_userId_timestamp.ext
        const timestamp = Date.now();
        const newFileName = `${fileType}_${userId}_${timestamp}.${ext}`;
        const newPath = `${folder}/${userId}/${newFileName}`;
        
        // Mover el archivo (copiar y luego eliminar el original)
        // Usar admin client para bypass RLS en storage
        const { data: copyData, error: copyError } = await admin.storage
          .from("documents")
          .copy(oldPath, newPath);
        
        if (!copyError && copyData) {
          // Eliminar el archivo original
          await admin.storage.from("documents").remove([oldPath]);
          
          // Obtener URL firmada (signed URL) con expiración de 1 año
          // Las URLs públicas no funcionan si el bucket no es público
          const { data: signedUrlData, error: signedUrlError } = await admin.storage
            .from("documents")
            .createSignedUrl(newPath, 31536000); // 1 año en segundos
          
          if (!signedUrlError && signedUrlData?.signedUrl) {
            return signedUrlData.signedUrl;
          }
          
          // Si falla la URL firmada, intentar URL pública como fallback
          const { data: publicUrl } = admin.storage.from("documents").getPublicUrl(newPath);
          return publicUrl.publicUrl;
        }
        
        // Si falla la reorganización, mantener la URL original
        return url;
      } catch (error) {
        console.error("Error al reorganizar archivo:", error);
        return url; // Mantener URL original si falla
      }
    };

    // Reorganizar archivos en paralelo con nombres descriptivos
    const [reorganized_degree_url, reorganized_id_url, reorganized_cert_url] = await Promise.all([
      reorganizeFile(degree_copy_url, "professional-degrees", "titulo-universitario"),
      reorganizeFile(id_copy_url, "id-copies", "cedula-identidad"),
      reorganizeFile(professional_certificate_url, "professional-certificates", "certificado-profesional"),
    ]);

    // Usar URLs reorganizadas
    final_degree_copy_url = reorganized_degree_url;
    final_id_copy_url = reorganized_id_url;
    final_professional_certificate_url = reorganized_cert_url;
    
    // Reorganizar certificados adicionales
    if (additional_certificates_urls.length > 0) {
      const reorganizedAdditionalCerts = await Promise.all(
        additional_certificates_urls.map((url, index) =>
          reorganizeFile(url, "additional-certificates", `certificado-adicional-${index + 1}`)
        )
      );
      additional_certificates_urls = reorganizedAdditionalCerts.filter((url): url is string => url !== null);
    }
  }

  // 5. Guardar o actualizar solicitud en professional_requests
  // Usar admin client para bypass RLS
  if (isResubmission && existingRequest?.id) {
    // Actualizar solicitud existente rechazada o reenviada
    // Siempre cambiar a "resubmitted" para indicar que fue actualizada
    const { error: requestError } = await admin.from("professional_requests")
      .update({
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
        status: "resubmitted", // Cambiar estado a reenviada (siempre, incluso si ya estaba en resubmitted)
        rejection_reason: null, // Limpiar motivo de rechazo anterior
        reviewed_by: null, // Limpiar revisión anterior
        reviewed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingRequest.id);

    if (requestError) {
      console.error("Error al actualizar solicitud profesional:", requestError);
      redirect("/signup-pro?error=request-update-failed");
    }
  } else {
    // Crear nueva solicitud
    const { error: requestError } = await admin.from("professional_requests").insert({
      user_id: userId,
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
    });

    if (requestError) {
      console.error("Error al guardar solicitud profesional:", requestError);
      // Limpiar: eliminar usuario creado solo si no es reenvío
      if (!isResubmission) {
        await admin.auth.admin.deleteUser(userId);
        await admin.from("users").delete().eq("user_id", userId);
      }
      redirect("/signup-pro?error=request-creation-failed");
    }
  }

  // 6. Enviar correo de notificación (se hará en background)
  try {
    const { sendProfessionalRequestReceivedEmail } = await import("@/lib/services/emailService");
    await sendProfessionalRequestReceivedEmail({
      to: email,
      professionalName: full_name,
    });
  } catch (emailError) {
    console.error("Error al enviar correo (no crítico):", emailError);
    // No redirigir por error de email, solo loguear
  }

  revalidatePath("/", "layout");
  // Redirigir con parámetro si es reenvío
  const successUrl = isResubmission 
    ? "/signup-pro/success?resubmitted=true"
    : "/signup-pro/success";
  redirect(successUrl);
}

export async function signout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.log(error);
    redirect("/error");
  }

  redirect("/auth/logout");
}

// Esta función debe ejecutarse en el cliente, no en el servidor
export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.log(error);
    redirect("/error");
  }

  redirect(data.url);
}

/**
 * Solicita un email de reset de contraseña
 */
export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get("email") as string)?.trim() || "";

  if (!email) {
    return {
      success: false,
      error: "El email es requerido",
    };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.app.url}/reset-password`,
    });

    if (error) {
      console.error("❌ Error solicitando reset de contraseña:", error);
      return {
        success: false,
        error: error.message || "Error al solicitar el reset de contraseña",
      };
    }

    console.log("✅ Email de reset de contraseña enviado a:", email);
    return {
      success: true,
      message: "Se ha enviado un email con instrucciones para resetear tu contraseña",
    };
  } catch (error) {
    console.error("💥 Error inesperado solicitando reset de contraseña:", error);
    return {
      success: false,
      error: "Error inesperado al solicitar el reset de contraseña",
    };
  }
}

/**
 * Resetea la contraseña usando el token de Supabase
 */
export async function resetPassword(formData: FormData) {
  const password = (formData.get("password") as string)?.trim() || "";
  const confirmPassword = (formData.get("confirmPassword") as string)?.trim() || "";

  // Validar con Zod
  const parsed = resetPasswordSchema.safeParse({
    password,
    confirmPassword,
  });

  if (!parsed.success) {
    console.error("❌ Error de validación:", parsed.error.flatten());
    return {
      success: false,
      error: "Datos de formulario inválidos",
      details: parsed.error.flatten(),
    };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      console.error("❌ Error actualizando contraseña:", error);
      return {
        success: false,
        error: error.message || "Error al actualizar la contraseña",
      };
    }

    console.log("✅ Contraseña actualizada exitosamente");
    
    // Redirigir al login después de éxito
    revalidatePath("/", "layout");
    redirect("/login?passwordReset=success");
  } catch (error) {
    console.error("💥 Error inesperado actualizando contraseña:", error);
    return {
      success: false,
      error: "Error inesperado al actualizar la contraseña",
    };
  }
}

/**
 * Verifica si el token de reset de contraseña es válido
 */
export async function verifyResetToken() {
  const supabase = await createClient();

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("❌ Error verificando token:", error);
      return {
        valid: false,
        error: error.message || "Error al verificar el token",
      };
    }

    // Si hay sesión, significa que el token es válido
    if (session) {
      return {
        valid: true,
      };
    }

    return {
      valid: false,
      error: "Token inválido o expirado",
    };
  } catch (error) {
    console.error("💥 Error inesperado verificando token:", error);
    return {
      valid: false,
      error: "Error inesperado al verificar el token",
    };
  }
}