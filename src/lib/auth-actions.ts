"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createAdminServer } from "@/utils/supabase/server";
import { logAccountProvider } from "@/utils/supabase/accountProvider";

import { z } from "zod";
import { resetPasswordSchema } from "@/lib/validations/password";

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

  // Verificar si el usuario está bloqueado en app_metadata
  const isBlocked = signInData.user?.app_metadata?.blocked === true;
  if (isBlocked) {
    console.warn("🚫 login: Usuario bloqueado detectado, cerrando sesión...");
    // Cerrar la sesión inmediatamente
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Tu cuenta ha sido bloqueada. Por favor, contacta con el administrador.",
    };
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
    redirect("/signup?error=config-error");
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
    redirect("/signup?error=invalid-data");
  }

  // 2. Verificar si el usuario ya existe en Supabase Auth
  const { data: existingUsers, error: listUsersError } = await admin.auth.admin.listUsers();

  if (listUsersError) {
    console.error("Error al listar usuarios para verificar existencia:", listUsersError);
    redirect("/signup?error=auth-service-error");
  }

  if (existingUsers?.users) {
    const userExists = existingUsers.users.some((user) => user.email?.toLowerCase() === email);
    if (userExists) {
      console.log("🔍 Usuario ya existe:", email);
      redirect("/signup?error=user-exists");
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
    hasUser: !!signUpData?.user,
    user: signUpData?.user,
    hasSession: !!signUpData?.session,
    emailSent: signUpData?.user ? !signUpData.user.email_confirmed_at : false,
    emailConfirmed: signUpData?.user?.email_confirmed_at,
    needsConfirmation: signUpData?.user ? !signUpData.user.email_confirmed_at : false
  });

  // Logging específico para debugging de correos
  if (signUpData?.user && !signUpData.user.email_confirmed_at) {
    console.log("📧 CORREO DEBE HABERSE ENVIADO:", {
      userId: signUpData.user.id,
      email: signUpData.user.email,
      emailConfirmed: signUpData.user.email_confirmed_at,
      redirectUrl: `${baseUrl}/confirm`,
      userMetadata: signUpData.user.user_metadata
    });
  } else if (signUpData?.user && signUpData.user.email_confirmed_at) {
    console.log("⚠️ CORREO YA CONFIRMADO (caso inesperado):", {
      userId: signUpData.user.id,
      email: signUpData.user.email,
      emailConfirmed: signUpData.user.email_confirmed_at
    });
  }

  if (signUpError) {
    // Verificar primero si es un error de correo (caso esperado con fallback)
    const isEmailError = signUpError.message.includes("Error sending confirmation email") || 
                         signUpError.code === 'unexpected_failure' ||
                         (signUpError.status === 500 && signUpError.message.toLowerCase().includes("email"));
    
    // Manejar error de envío de correo - este es un caso esperado que se maneja con fallback
    // NO es un error crítico, es parte del flujo normal cuando Supabase no puede enviar correos
    if (isEmailError) {
      console.log("ℹ️ Supabase no pudo enviar correo de confirmación (esperado), usando fallback manual...");
      
      // Si hay un usuario en signUpData, usarlo directamente
      if (signUpData?.user) {
        const user = signUpData.user as { id: string; email?: string | null; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> | null };
        console.log("✅ Usuario creado a pesar del error de correo:", {
          userId: user.id,
          emailConfirmed: !!user.email_confirmed_at
        });
        
        // Crear el registro en la tabla users si no existe usando el cliente Admin
        try {
          const { data: existingUser } = await admin
            .from("users")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          
          if (!existingUser) {
            const fullNameFromMeta = user.user_metadata?.full_name;
            const fullName = (typeof fullNameFromMeta === 'string' ? fullNameFromMeta : null) || `${firstName} ${lastName}`;
            const nameParts = fullName.split(" ");
            const firstNameFromMeta = nameParts[0] || firstName;
            const lastNameFromMeta = nameParts.slice(1).join(" ") || lastName;
            
            const { error: userInsertError } = await admin
              .from("users")
              .insert({
                user_id: user.id,
                email: user.email || email,
                name: firstNameFromMeta,
                last_name: lastNameFromMeta,
                role: 2, // Rol por defecto: paciente
                is_active: true,
                created_at: new Date().toISOString()
              });

            if (userInsertError && userInsertError.code !== '23505') {
              console.error("⚠️ Error al crear usuario en tabla users:", userInsertError);
            } else {
              console.log("✅ Usuario creado en tabla users después del error de correo");
            }
          }
        } catch (createErr) {
          console.error("⚠️ Error al crear usuario en tabla users:", createErr);
          // Continuar aunque falle, el usuario puede iniciar sesión después
        }
        
        // Redirigir a página de confirmación con mensaje
        console.log("⚠️ Usuario creado pero el correo no se pudo enviar");
        redirect("/confirm?email-sent=false");
      } else {
        // No hay usuario en signUpData, verificar usando listUsers
        console.log("⚠️ No hay usuario en signUpData, verificando con listUsers...");
        try {
          const { data: listedUsers, error: listError } = await admin.auth.admin.listUsers({
            page: 1,
            perPage: 1000
          });
          
          if (!listError && listedUsers?.users) {
            const checkUser = listedUsers.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
            
            if (checkUser) {
              console.log("✅ Usuario encontrado en listUsers:", {
                userId: checkUser.id,
                emailConfirmed: !!checkUser.email_confirmed_at
              });
              
              // Crear el registro en la tabla users si no existe usando el cliente Admin
              try {
                const { data: existingUser } = await admin
                  .from("users")
                  .select("id")
                  .eq("user_id", checkUser.id)
                  .maybeSingle();
                
                if (!existingUser) {
                  const fullName = checkUser.user_metadata?.full_name || `${firstName} ${lastName}`;
                  const nameParts = fullName.split(" ");
                  const firstNameFromMeta = nameParts[0] || firstName;
                  const lastNameFromMeta = nameParts.slice(1).join(" ") || lastName;
                  
                  const { error: userInsertError } = await admin
                    .from("users")
                    .insert({
                      user_id: checkUser.id,
                      email: checkUser.email || email,
                      name: firstNameFromMeta,
                      last_name: lastNameFromMeta,
                      role: 2,
                      is_active: true,
                      created_at: new Date().toISOString()
                    });

                  if (userInsertError && userInsertError.code !== '23505') {
                    console.error("⚠️ Error al crear usuario en tabla users:", userInsertError);
                  } else {
                    console.log("✅ Usuario creado en tabla users");
                  }
                }
              } catch (createErr) {
                console.error("⚠️ Error al crear usuario en tabla users:", createErr);
              }
              
              // Redirigir según el estado de confirmación
              if (checkUser.email_confirmed_at) {
                console.log("✅ Email ya confirmado, redirigiendo al login...");
                redirect("/login?registered=true");
              } else {
                console.log("⚠️ Usuario creado pero necesita confirmar email");
                redirect("/confirm?email-sent=false");
              }
            } else {
              console.log("❌ Usuario NO se creó debido al error de correo");
              // Intentar crear el usuario usando la API de Admin como fallback
              console.log("🔄 Intentando crear usuario usando API de Admin como fallback...");
              try {
                // Verificar una vez más si el usuario existe (por si se creó entre verificaciones)
                const { data: doubleCheckUsers } = await admin.auth.admin.listUsers({
                  page: 1,
                  perPage: 1000
                });
                
                const doubleCheckUser = doubleCheckUsers?.users?.find(
                  (u) => (u.email || "").toLowerCase() === email.toLowerCase()
                );
                
                if (doubleCheckUser) {
                  console.log("✅ Usuario encontrado en segunda verificación:", {
                    userId: doubleCheckUser.id,
                    emailConfirmed: !!doubleCheckUser.email_confirmed_at
                  });
                  
                  // Crear el registro en la tabla users si no existe usando el cliente Admin
                  try {
                    const { data: existingUser } = await admin
                      .from("users")
                      .select("id")
                      .eq("user_id", doubleCheckUser.id)
                      .maybeSingle();
                    
                    if (!existingUser) {
                      const fullName = doubleCheckUser.user_metadata?.full_name || `${firstName} ${lastName}`;
                      const nameParts = fullName.split(" ");
                      const firstNameFromMeta = nameParts[0] || firstName;
                      const lastNameFromMeta = nameParts.slice(1).join(" ") || lastName;
                      
                      const { error: userInsertError } = await admin
                        .from("users")
                        .insert({
                          user_id: doubleCheckUser.id,
                          email: doubleCheckUser.email || email,
                          name: firstNameFromMeta,
                          last_name: lastNameFromMeta,
                          role: 2,
                          is_active: true,
                          created_at: new Date().toISOString()
                        });

                      if (userInsertError && userInsertError.code !== '23505') {
                        console.error("⚠️ Error al crear usuario en tabla users:", userInsertError);
                      } else {
                        console.log("✅ Usuario creado en tabla users");
                      }
                    }
                  } catch (createErr) {
                    console.error("⚠️ Error al crear usuario en tabla users:", createErr);
                  }
                  
                  // Redirigir según el estado de confirmación
                  if (doubleCheckUser.email_confirmed_at) {
                    console.log("✅ Email ya confirmado, redirigiendo al login...");
                    redirect("/login?registered=true");
                  } else {
                    console.log("⚠️ Usuario creado pero necesita confirmar email");
                    redirect("/confirm?email-sent=false");
                  }
                  return; // Salir de la función
                }
                
                // Si no existe, crear el usuario usando la API de Admin
                // NO confirmar el email automáticamente - generaremos el enlace y lo enviaremos manualmente
                const { data: adminUserData, error: adminCreateError } = await admin.auth.admin.createUser({
                  email: email,
                  password: password,
                  email_confirm: false, // NO confirmar automáticamente - enviaremos el correo manualmente
                  user_metadata: {
                    full_name: `${firstName} ${lastName}`,
                    email: email,
                  },
                });

                if (adminCreateError || !adminUserData?.user) {
                  console.error("❌ Error al crear usuario con API de Admin:", adminCreateError);
                  
                  // Si el error es que el usuario ya existe, verificar y continuar
                  if (adminCreateError?.message?.includes("already registered") || 
                      adminCreateError?.message?.toLowerCase().includes("already exists")) {
                    console.log("⚠️ Usuario ya existe según API de Admin, verificando...");
                    const { data: finalCheckUsers } = await admin.auth.admin.listUsers({
                      page: 1,
                      perPage: 1000
                    });
                    
                    const finalCheckUser = finalCheckUsers?.users?.find(
                      (u) => (u.email || "").toLowerCase() === email.toLowerCase()
                    );
                    
                    if (finalCheckUser) {
                      console.log("✅ Usuario encontrado después del error 'already exists'");
                      redirect("/signup?error=user-exists");
                    } else {
                      redirect("/signup?error=email-service-error");
                    }
                  } else {
                    redirect("/signup?error=email-service-error");
                  }
                  return;
                }

                console.log("✅ Usuario creado exitosamente con API de Admin:", {
                  userId: adminUserData.user.id,
                  emailConfirmed: !!adminUserData.user.email_confirmed_at
                });

                // Generar enlace de confirmación y enviarlo manualmente
                let confirmationLink: string | null = null;
                try {
                  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
                    type: "signup",
                    email: email,
                    password: password,
                    options: {
                      redirectTo: `${baseUrl}/confirmation`,
                    },
                  });

                  if (linkError || !linkData?.properties?.action_link) {
                    console.error("⚠️ Error al generar enlace de confirmación:", linkError);
                  } else {
                    confirmationLink = linkData.properties.action_link;
                    console.log("✅ Enlace de confirmación generado exitosamente");
                    console.log("🔗 Enlace generado (primeros 100 chars):", confirmationLink.substring(0, 100) + "...");
                    console.log("🔗 URL completa del enlace:", confirmationLink);
                    
                    // Verificar que el enlace tenga el formato correcto
                    try {
                      const linkUrl = new URL(confirmationLink);
                      console.log("🔗 Parámetros del enlace:", {
                        hostname: linkUrl.hostname,
                        pathname: linkUrl.pathname,
                        searchParams: Object.fromEntries(linkUrl.searchParams)
                      });
                    } catch (urlError) {
                      console.warn("⚠️ Error al parsear URL del enlace:", urlError);
                    }
                    
                    // Enviar el correo manualmente usando SendGrid
                    try {
                      const { sendNotificationEmail } = await import("@/lib/services/emailService");
                      await sendNotificationEmail({
                        to: email,
                        subject: "Confirma tu correo electrónico - FlorAurora Salud",
                        message: `Hola ${firstName},\n\nGracias por registrarte en FlorAurora Salud. Por favor, confirma tu correo electrónico haciendo clic en el botón a continuación para activar tu cuenta.`,
                        actionUrl: confirmationLink,
                        actionText: "Confirmar correo electrónico",
                      });
                      console.log("✅ Correo de confirmación enviado manualmente");
                    } catch (emailError) {
                      console.error("⚠️ Error al enviar correo de confirmación manualmente:", emailError);
                      // Continuar aunque falle el correo - el usuario puede solicitar reenvío
                    }
                  }
                } catch (linkGenError) {
                  console.error("⚠️ Error al generar/enviar enlace de confirmación:", linkGenError);
                  // Continuar aunque falle - el usuario puede solicitar reenvío después
                }

                // Crear el registro en la tabla users usando el cliente Admin (bypassea RLS)
                try {
                  const { data: userRecord, error: userInsertError } = await admin
                    .from("users")
                    .insert({
                      user_id: adminUserData.user.id,
                      email: adminUserData.user.email || email,
                      name: firstName,
                      last_name: lastName,
                      role: 2, // Rol por defecto: paciente
                      is_active: true,
                      created_at: new Date().toISOString()
                    })
                    .select()
                    .maybeSingle();

                  if (userInsertError) {
                    // Si es un error de duplicación, el usuario ya existe
                    if (userInsertError.code === '23505' && userInsertError.message.includes('duplicate key')) {
                      console.log("⚠️ Usuario ya existe en tabla users, continuando...");
                    } else {
                      console.error("❌ Error al crear usuario en tabla users:", userInsertError);
                      // Salir del try antes de hacer redirect
                      throw new Error("Error al crear usuario en tabla users");
                    }
                  } else if (userRecord) {
                    console.log("✅ Usuario creado en tabla users:", userRecord.id);
                  }
                  
                  // Crear perfil de paciente básico usando el cliente Admin
                  // Primero obtener el id numérico del usuario (ya lo tenemos o lo obtenemos)
                  let userData = userRecord;
                  if (!userData) {
                    // Si no tenemos el registro, obtenerlo
                    const { data: fetchedUserData } = await admin
                      .from("users")
                      .select("id")
                      .eq("user_id", adminUserData.user.id)
                      .maybeSingle();
                    userData = fetchedUserData;
                  }
                  
                  if (userData?.id) {
                    try {
                      // Verificar si el perfil de paciente ya existe
                      const { data: existingPatient } = await admin
                        .from("patients")
                        .select("id")
                        .eq("id", userData.id)
                        .maybeSingle();
                      
                      if (!existingPatient) {
                        const { error: patientInsertError } = await admin
                          .from("patients")
                          .insert({
                            id: userData.id,
                            emergency_contact_name: "",
                            emergency_contact_phone: "",
                            health_insurances_id: 1,
                          });

                        if (patientInsertError) {
                          // Si es un error de duplicación, el perfil ya existe (race condition)
                          if (patientInsertError.code === '23505') {
                            console.log("⚠️ Perfil de paciente ya existe, continuando...");
                          } else {
                            console.error("⚠️ Error al crear perfil de paciente:", patientInsertError);
                            // No es crítico, el usuario puede completar su perfil después
                          }
                        } else {
                          console.log("✅ Perfil de paciente creado");
                          
                          // Enviar notificación al correo de contacto
                          try {
                            const { sendPatientRegistrationNotification } = await import("@/lib/services/emailService");
                            await sendPatientRegistrationNotification({
                              patientName: `${firstName} ${lastName}`,
                              patientEmail: email,
                              patientPhone: null,
                            });
                            console.log("✅ Notificación de registro de paciente enviada al correo de contacto");
                          } catch (notificationError) {
                            console.error("⚠️ Error al enviar notificación de registro (no crítico):", notificationError);
                            // No es crítico, el registro ya se completó exitosamente
                          }
                        }
                      } else {
                        console.log("✅ Perfil de paciente ya existe");
                      }
                    } catch (profileErr) {
                      console.error("⚠️ Error al crear perfil de paciente:", profileErr);
                      // No es crítico, el usuario puede completar su perfil después
                    }
                  }
                } catch (createErr: unknown) {
                  // Verificar si es un redirect de Next.js (no es un error real)
                  if (createErr && typeof createErr === "object" && "digest" in createErr && typeof createErr.digest === "string" && createErr.digest.includes("NEXT_REDIRECT")) {
                    throw createErr; // Re-lanzar el redirect
                  }
                  console.error("❌ Error al crear usuario en tabla users:", createErr);
                  redirect("/signup?error=signup-failed");
                  return; // No continuar después del redirect
                }

                  // Redirigir a la página de confirmación indicando que se envió el correo
                  console.log("✅ Registro completado exitosamente, redirigiendo a confirmación...");
                  if (confirmationLink) {
                    redirect("/confirm?email-sent=true&registered=true");
                  } else {
                    // Si no se pudo generar el enlace, redirigir al login con mensaje
                    redirect("/login?registered=true&email-pending=true");
                  }
              } catch (adminErr: unknown) {
                // Verificar si es un redirect de Next.js (no es un error real)
                if (adminErr && typeof adminErr === "object" && "digest" in adminErr && typeof adminErr.digest === "string" && adminErr.digest.includes("NEXT_REDIRECT")) {
                  throw adminErr; // Re-lanzar el redirect
                }
                console.error("❌ Error al crear usuario con API de Admin:", adminErr);
                redirect("/signup?error=email-service-error");
              }
            }
          } else {
            console.error("❌ Error al listar usuarios:", listError);
            redirect("/signup?error=signup-failed");
          }
        } catch (checkErr: unknown) {
          // Verificar si es un redirect de Next.js (no es un error real)
          if (checkErr && typeof checkErr === "object" && "digest" in checkErr && typeof checkErr.digest === "string" && checkErr.digest.includes("NEXT_REDIRECT")) {
            throw checkErr; // Re-lanzar el redirect
          }
          console.error("❌ Error al verificar usuario:", checkErr);
          redirect("/signup?error=signup-failed");
        }
      }
      
      // Si llegamos aquí, el fallback de correo se manejó correctamente
      // No necesitamos hacer nada más, el flujo continúa normalmente
      return; // Salir temprano para evitar procesar otros errores
    }
    
    // Si NO es un error de correo, manejar otros errores específicos
    if (signUpError.message.includes("User already registered")) {
      console.log("🔍 Usuario ya registrado, redirigiendo...");
      redirect("/signup?error=user-exists");
      return;
    }
    
    if (signUpError.message.includes("Invalid email")) {
      console.log("🔍 Email inválido");
      redirect("/signup?error=invalid-email");
      return;
    }
    
    if (signUpError.message.includes("Password should be at least")) {
      console.log("🔍 Contraseña muy corta");
      redirect("/signup?error=weak-password");
      return;
    }
    
    // Si llegamos aquí, es un error real no esperado
    console.error("❌ Error al registrar usuario en Supabase Auth:", {
      message: signUpError.message,
      status: signUpError.status,
      name: signUpError.name,
      code: signUpError.code,
    });
    
    console.log("🔍 Error genérico de registro, redirigiendo...");
    redirect("/signup?error=signup-failed");
  }

  // 4. Verificar que el registro fue exitoso
  if (signUpData?.user) {
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
    redirect("/signup?error=unexpected-error");
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
  
  // Si ya existe una solicitud pendiente, redirigir a éxito indicando que ya existe
  // Esto puede pasar si el usuario hace doble clic o recarga la página después de enviar
  // IMPORTANTE: No lanzar error, solo redirigir silenciosamente
  if (existingRequest && existingRequest.status === "pending") {
    console.log("Ya existe una solicitud pendiente para este email, redirigiendo a éxito:", email);
    // Usar redirect() que lanza una excepción especial que Next.js maneja
    // Esto evita que el componente cliente trate esto como un error
    redirect("/signup-pro/success?existing=true");
  }
  
  // Si existe una solicitud rechazada o reenviada, la actualizaremos en lugar de crear una nueva
  const isResubmission = existingRequest && (existingRequest.status === "rejected" || existingRequest.status === "resubmitted");

  // NOTA: Ya NO creamos el usuario aquí. El usuario se creará cuando el administrador apruebe la solicitud.
  // Solo guardamos la solicitud con user_id null o temporal.
  let userId: string | null = null;
  
  // Si es un reenvío y ya tiene un user_id, mantenerlo (pero no actualizar el usuario todavía)
  if (isResubmission && existingRequest?.user_id) {
    userId = existingRequest.user_id;
    console.log("Reenvío de solicitud rechazada, manteniendo user_id existente:", userId);
    // NO actualizamos el usuario aquí, se hará cuando se apruebe
  } else {
    // Verificar si el usuario ya existe (no debería, pero verificamos por seguridad)
    const { data: existingPublicUser } = await admin
      .from("users")
      .select("id, email, role")
      .eq("email", email)
      .maybeSingle();
    
    if (existingPublicUser) {
      console.error("Usuario ya existe en public.users:", email);
      redirect("/signup-pro?error=user-exists");
    }
    
    // También verificar en auth.users
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
    
    // NO creamos el usuario aquí. Se creará cuando se apruebe la solicitud.
    console.log("Solicitud profesional: NO se crea usuario hasta la aprobación del administrador");
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

  // 4. Si los archivos fueron subidos con temp_user_id, reorganizarlos usando el email como identificador temporal
  // Los archivos se reorganizarán con el user_id real cuando se apruebe la solicitud
  let final_degree_copy_url: string | null = degree_copy_url;
  let final_id_copy_url: string | null = id_copy_url;
  let final_professional_certificate_url: string | null = professional_certificate_url;

  // Usar email como identificador temporal para organizar archivos pendientes
  const tempIdentifier = temp_user_id || email.replace(/[^a-zA-Z0-9]/g, "_");

  if (temp_user_id) {
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
        
        // Crear nuevo path con estructura organizada: folder/tempIdentifier/tipo-documento_tempIdentifier_timestamp.ext
        // Cuando se apruebe la solicitud, estos archivos se moverán a la carpeta del usuario real
        const pathParts = oldPath.split("/");
        const oldFileName = pathParts[pathParts.length - 1];
        const ext = oldFileName.split(".").pop() || "pdf";
        
        // Nombre descriptivo del archivo: tipo-documento_tempIdentifier_timestamp.ext
        const timestamp = Date.now();
        const newFileName = `${fileType}_${tempIdentifier}_${timestamp}.${ext}`;
        const newPath = `${folder}/pending/${tempIdentifier}/${newFileName}`;
        
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
    // Crear nueva solicitud (sin user_id, se asignará cuando se apruebe)
    const { error: requestError } = await admin.from("professional_requests").insert({
      user_id: userId || null, // Puede ser null si es nueva solicitud
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
      redirect("/signup-pro?error=request-creation-failed");
    }
  }

  // 6. Enviar correo de notificación al profesional (se hará en background)
  try {
    const { sendProfessionalRequestReceivedEmail } = await import("@/lib/services/emailService");
    await sendProfessionalRequestReceivedEmail({
      to: email,
      professionalName: full_name,
    });
  } catch (emailError) {
    console.error("Error al enviar correo al profesional (no crítico):", emailError);
    // No redirigir por error de email, solo loguear
  }

  // 7. Enviar notificación al correo de contacto sobre la nueva solicitud profesional
  try {
    const { sendProfessionalRegistrationNotification } = await import("@/lib/services/emailService");
    await sendProfessionalRegistrationNotification({
      professionalName: full_name,
      professionalEmail: email,
      professionalPhone: phone_number || null,
      rut: rut || null,
    });
    console.log("✅ Notificación de solicitud profesional enviada al correo de contacto");
  } catch (notificationError) {
    console.error("⚠️ Error al enviar notificación al correo de contacto (no crítico):", notificationError);
    // No redirigir por error de notificación, solo loguear
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
  const { getSiteUrl } = await import("@/lib/utils/url");
  const baseUrl = getSiteUrl();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
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