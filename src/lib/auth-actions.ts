"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createAdminServer } from "@/utils/supabase/server";
import { logAccountProvider } from "@/utils/supabase/accountProvider";

import { email, z } from "zod";

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

// export async function login(prevState: any, formData: FormData) {
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

export async function login(prevState: any, formData: FormData) {
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
  const supabase = await createClient();
  const admin = createAdminServer();
  console.log("🔍 formData:", formData);
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
    return {
      success: false,
      error: "Datos de formulario inválidos",
      details: parsed.error.flatten(),
    };
  }

  // 2. Verificar si el usuario ya existe en Supabase Auth
  const { data: existingUsers, error: listUsersError } = await admin.auth.admin.listUsers();

  if (listUsersError) {
    console.error("Error al listar usuarios para verificar existencia:", listUsersError);
    return {
      success: false,
      error: "Error en el servicio de autenticación al verificar usuario.",
    };
  }

  if (existingUsers?.users) {
    const userExists = existingUsers.users.some((user) => user.email?.toLowerCase() === email);
    if (userExists) {
      console.log("🔍 Usuario ya existe:", email);
      return {
        success: false,
        error: "Ya existe una cuenta con este correo electrónico.",
      };
    }
  }

  // 3. Registrar el usuario en Supabase Auth
  console.log("Email a registrar en Supabase:", email);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      emailRedirectTo: `${baseUrl}/auth/auth/confirm`,
      data: {
        full_name: `${firstName} ${lastName}`,
        email: email,
      },
    },
  });

  if (signUpError) {
    console.error("Error al registrar usuario en Supabase Auth:", signUpError);
    if (signUpError.message.includes("User already registered")) {
      return {
        success: false,
        error: "Ya existe una cuenta con este correo electrónico.",
      };
    }
    return {
      success: false,
      error: "Error al crear la cuenta. Por favor, inténtelo de nuevo.",
    };
  }

  // 4. Insertar datos del usuario en la tabla 'users' si el registro fue exitoso en Auth
  // La lógica de inserción en la tabla 'users' se moverá a la función de confirmación de email.
  // if (signUpData.user) {
  //   const { error: insertError } = await supabase.from("users").insert({
  //     user_id: signUpData.user.id,
  //     name: firstName,
  //     last_name: lastName,
  //     email: email,
  //     is_active: true,
  //     role: 2, 
  //   });
  //
  //   if (insertError) {
  //     console.error("Error al insertar el usuario en la tabla 'users':", insertError);
  //     redirect("/error");
  //   }
  // } else {
  //   console.error("Error: signUpData.user es nulo después de un registro exitoso sin error.");
  //   return {
  //     success: false,
  //     error: "Error inesperado al obtener los datos del usuario después del registro.",
  //   };
  // }
  
  revalidatePath("/", "layout");
  redirect("/auth/confirm");
}

export async function signupPro(formData: FormData) {
  const supabase = await createClient();
  // Aquí solo haremos parsing y guardaremos la solicitud en una tabla
  // Ej: professional_requests con estado "pending". El admin aprobará/rechazará.

  const full_name = (formData.get("full_name") as string)?.trim() || "";
  const rut = (formData.get("rut") as string)?.trim() || "";
  const birth_date = (formData.get("birth_date") as string) || "";
  const university = (formData.get("university") as string)?.trim() || "";
  const study_year_start = (formData.get("study_year_start") as string)?.trim() || "";
  const study_year_end = (formData.get("study_year_end") as string)?.trim() || "";
  const extra_studies = (formData.get("extra_studies") as string)?.trim() || "";
  const superintendence_number = (formData.get("superintendence_number") as string)?.trim() || "";

  // Subir archivo al storage (si está configurado). Bucket: 'docs'
  const degree_copy = formData.get("degree_copy") as File | null;
  let degree_copy_url: string | null = null;
  if (degree_copy && degree_copy.size) {
    const arrayBuffer = await degree_copy.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);
    const ext = degree_copy.type.includes("pdf") ? "pdf" : degree_copy.type.includes("png") ? "png" : "jpg";
    const path = `professional-degrees/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("docs")
      .upload(path, fileBytes, {
        contentType: degree_copy.type,
        upsert: false,
      });
    if (!uploadError && uploadData) {
      const { data: publicUrl } = supabase.storage.from("docs").getPublicUrl(uploadData.path);
      degree_copy_url = publicUrl.publicUrl;
    }
  }

  const { error } = await supabase.from("professional_requests").insert({
    full_name,
    rut,
    birth_date,
    university,
    study_year_start,
    study_year_end,
    extra_studies,
    superintendence_number,
    degree_copy_url,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error al guardar solicitud profesional:", error);
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/auth/confirm");
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