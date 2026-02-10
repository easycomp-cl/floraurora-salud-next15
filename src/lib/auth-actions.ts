"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createAdminServer } from "@/utils/supabase/server";
import { executeSignupPro } from "@/lib/signupProLogic";
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

  if (!result.exists) {
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

  revalidatePath("/");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("❌ Variables de entorno de Supabase no configuradas");
    redirect("/signup?error=config-error");
  }

  const supabase = await createClient();
  const admin = createAdminServer();
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
    redirect("/signup?error=invalid-data");
  }

  // 2. Verificar si el email tiene una solicitud de profesional en proceso (pending/resubmitted)
  const { data: pendingProfessionalRequest } = await admin
    .from("professional_requests")
    .select("id")
    .eq("email", email)
    .in("status", ["pending", "resubmitted"])
    .maybeSingle();

  if (pendingProfessionalRequest) {
    redirect("/signup?error=professional-request-pending");
  }

  // 3. Verificar si el usuario ya existe en Supabase Auth
  const { data: existingUsers, error: listUsersError } = await admin.auth.admin.listUsers();

  if (listUsersError) {
    console.error("Error al listar usuarios para verificar existencia:", listUsersError);
    redirect("/signup?error=auth-service-error");
  }

  if (existingUsers?.users) {
    const userExists = existingUsers.users.some((user) => user.email?.toLowerCase() === email);
    if (userExists) {
      redirect("/signup?error=user-exists");
    }
  }

  // 3. Registrar el usuario en Supabase Auth
  // Usar getSiteUrl() para detectar correctamente local, preview y producción
  const { getSiteUrl } = await import("@/lib/utils/url");
  const baseUrl = getSiteUrl();
  
  const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      emailRedirectTo: `${baseUrl}/confirmation`,
      data: {
        full_name: `${firstName} ${lastName}`,
        email: email,
      },
    },
  });

  if (signUpError) {
    // Verificar primero si es un error de correo (caso esperado con fallback)
    const isEmailError = signUpError.message.includes("Error sending confirmation email") || 
                         signUpError.code === 'unexpected_failure' ||
                         (signUpError.status === 500 && signUpError.message.toLowerCase().includes("email"));
    
    // Manejar error de envío de correo - este es un caso esperado que se maneja con fallback
    // NO es un error crítico, es parte del flujo normal cuando Supabase no puede enviar correos
    if (isEmailError) {
      // Si hay un usuario en signUpData, usarlo directamente
      if (signUpData?.user) {
        const user = signUpData.user as { id: string; email?: string | null; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> | null };
        
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
            }
          }
        } catch (createErr) {
          console.error("⚠️ Error al crear usuario en tabla users:", createErr);
          // Continuar aunque falle, el usuario puede iniciar sesión después
        }
        
        // Redirigir a página de confirmación con mensaje
        redirect("/confirmation?email-sent=false");
      } else {
        // No hay usuario en signUpData, verificar usando listUsers
        try {
          const { data: listedUsers, error: listError } = await admin.auth.admin.listUsers({
            page: 1,
            perPage: 1000
          });
          
          if (!listError && listedUsers?.users) {
            const checkUser = listedUsers.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
            
            if (checkUser) {
              // Usuario encontrado en auth. Crear users/patients si falta, enviar correo si no confirmado.
              try {
                let { data: userRecord } = await admin
                  .from("users")
                  .select("id")
                  .eq("user_id", checkUser.id)
                  .maybeSingle();
                if (!userRecord) {
                  const fullName = checkUser.user_metadata?.full_name || `${firstName} ${lastName}`;
                  const nameParts = fullName.split(" ");
                  const { data: inserted } = await admin.from("users").insert({
                    user_id: checkUser.id,
                    email: checkUser.email || email,
                    name: nameParts[0] || firstName,
                    last_name: nameParts.slice(1).join(" ") || lastName,
                    role: 2,
                    is_active: true,
                    created_at: new Date().toISOString()
                  }).select("id").maybeSingle();
                  if (inserted) userRecord = inserted;
                }
                if (userRecord?.id) {
                  const { data: existingPatient } = await admin
                    .from("patients")
                    .select("id")
                    .eq("id", userRecord.id)
                    .maybeSingle();
                  if (!existingPatient) {
                    await admin.from("patients").insert({
                      id: userRecord.id,
                      emergency_contact_name: "",
                      emergency_contact_phone: "",
                      health_insurances_id: 1,
                    });
                  }
                }
              } catch (createErr) {
                console.error("⚠️ Error al crear usuario en tabla users:", createErr);
              }
              
              if (checkUser.email_confirmed_at) {
                redirect("/login?registered=true");
              } else {
                // Enviar correo de confirmación manualmente
                try {
                  const { data: linkData } = await admin.auth.admin.generateLink({
                    type: "signup",
                    email: email,
                    password: password,
                    options: { redirectTo: `${baseUrl}/confirmation` },
                  });
                  const link = linkData?.properties?.action_link;
                  if (link) {
                    const { sendNotificationEmail } = await import("@/lib/services/emailService");
                    await sendNotificationEmail({
                      to: email,
                      subject: "Confirma tu correo electrónico - FlorAurora Salud",
                      message: `Hola ${firstName},\n\nGracias por registrarte en FlorAurora Salud. Por favor, confirma tu correo electrónico haciendo clic en el botón a continuación para activar tu cuenta.`,
                      actionUrl: link,
                      actionText: "Confirmar correo electrónico",
                    });
                  }
                } catch (e) {
                  console.error("⚠️ Error enviando correo:", e);
                }
                redirect("/confirmation?email-sent=true&registered=true");
              }
            } else {
              // Usuario no encontrado en listUsers (puede ser delay de propagación)
              // Crear con API de Admin y enviar correo manualmente
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
                  // Usuario creado por signUp (Supabase lo creó antes de fallar el email)
                  // Crear en users/patients si falta y redirigir a confirmación
                  try {
                    let { data: userRecord } = await admin
                      .from("users")
                      .select("id")
                      .eq("user_id", doubleCheckUser.id)
                      .maybeSingle();
                    if (!userRecord) {
                      const fullName = doubleCheckUser.user_metadata?.full_name || `${firstName} ${lastName}`;
                      const nameParts = fullName.split(" ");
                      const { data: inserted } = await admin.from("users").insert({
                        user_id: doubleCheckUser.id,
                        email: doubleCheckUser.email || email,
                        name: nameParts[0] || firstName,
                        last_name: nameParts.slice(1).join(" ") || lastName,
                        role: 2,
                        is_active: true,
                        created_at: new Date().toISOString()
                      }).select("id").maybeSingle();
                      if (inserted) userRecord = inserted;
                    }
                    if (userRecord?.id) {
                      const { data: existingPatient } = await admin
                        .from("patients")
                        .select("id")
                        .eq("id", userRecord.id)
                        .maybeSingle();
                      if (!existingPatient) {
                        await admin.from("patients").insert({
                          id: userRecord.id,
                          emergency_contact_name: "",
                          emergency_contact_phone: "",
                          health_insurances_id: 1,
                        });
                      }
                    }
                  } catch (createErr) {
                    console.error("⚠️ Error al crear usuario en tabla users:", createErr);
                  }
                  
                  if (doubleCheckUser.email_confirmed_at) {
                    redirect("/login?registered=true");
                  } else {
                    // Generar enlace y enviar correo manualmente (mismo flujo que admin.createUser)
                    try {
                      const { data: linkData } = await admin.auth.admin.generateLink({
                        type: "signup",
                        email: email,
                        password: password,
                        options: { redirectTo: `${baseUrl}/confirmation` },
                      });
                      const link = linkData?.properties?.action_link;
                      if (link) {
                        const { sendNotificationEmail } = await import("@/lib/services/emailService");
                        await sendNotificationEmail({
                          to: email,
                          subject: "Confirma tu correo electrónico - FlorAurora Salud",
                          message: `Hola ${firstName},\n\nGracias por registrarte en FlorAurora Salud. Por favor, confirma tu correo electrónico haciendo clic en el botón a continuación para activar tu cuenta.`,
                          actionUrl: link,
                          actionText: "Confirmar correo electrónico",
                        });
                      }
                    } catch (e) {
                      console.error("⚠️ Error enviando correo de confirmación:", e);
                    }
                    redirect("/confirmation?email-sent=true&registered=true");
                  }
                  return;
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
                  // Usuario ya existe (creado por signUp antes de fallar el email)
                  if (adminCreateError?.message?.includes("already registered") || 
                      adminCreateError?.message?.toLowerCase().includes("already exists")) {
                    const { data: finalCheckUsers } = await admin.auth.admin.listUsers({
                      page: 1,
                      perPage: 1000
                    });
                    const finalCheckUser = finalCheckUsers?.users?.find(
                      (u) => (u.email || "").toLowerCase() === email.toLowerCase()
                    );
                    if (finalCheckUser) {
                      // Usuario creado por signUp antes de fallar email. Crear users/patients si falta.
                      try {
                        let { data: userRecord } = await admin
                          .from("users")
                          .select("id")
                          .eq("user_id", finalCheckUser.id)
                          .maybeSingle();
                        if (!userRecord) {
                          const fullName = finalCheckUser.user_metadata?.full_name || `${firstName} ${lastName}`;
                          const nameParts = fullName.split(" ");
                          const { data: inserted } = await admin.from("users").insert({
                            user_id: finalCheckUser.id,
                            email: finalCheckUser.email || email,
                            name: nameParts[0] || firstName,
                            last_name: nameParts.slice(1).join(" ") || lastName,
                            role: 2,
                            is_active: true,
                            created_at: new Date().toISOString()
                          }).select("id").maybeSingle();
                          if (inserted) userRecord = inserted;
                        }
                        if (userRecord?.id) {
                          const { data: existingPatient } = await admin
                            .from("patients")
                            .select("id")
                            .eq("id", userRecord.id)
                            .maybeSingle();
                          if (!existingPatient) {
                            await admin.from("patients").insert({
                              id: userRecord.id,
                              emergency_contact_name: "",
                              emergency_contact_phone: "",
                              health_insurances_id: 1,
                            });
                          }
                        }
                      } catch (e) {
                        console.error("⚠️ Error creando usuario/paciente:", e);
                      }
                      if (!finalCheckUser.email_confirmed_at) {
                        try {
                          const { data: linkData } = await admin.auth.admin.generateLink({
                            type: "signup",
                            email: email,
                            password: password,
                            options: { redirectTo: `${baseUrl}/confirmation` },
                          });
                          const link = linkData?.properties?.action_link;
                          if (link) {
                            const { sendNotificationEmail } = await import("@/lib/services/emailService");
                            await sendNotificationEmail({
                              to: email,
                              subject: "Confirma tu correo electrónico - FlorAurora Salud",
                              message: `Hola ${firstName},\n\nGracias por registrarte en FlorAurora Salud. Por favor, confirma tu correo electrónico haciendo clic en el botón a continuación para activar tu cuenta.`,
                              actionUrl: link,
                              actionText: "Confirmar correo electrónico",
                            });
                          }
                        } catch (e) {
                          console.error("⚠️ Error enviando correo:", e);
                        }
                      }
                      redirect(finalCheckUser.email_confirmed_at ? "/login?registered=true" : "/confirmation?email-sent=true&registered=true");
                      return;
                    }
                  }
                  console.error("❌ Error al crear usuario:", adminCreateError);
                  redirect("/signup?error=email-service-error");
                  return;
                }

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
                          if (patientInsertError.code !== '23505') {
                            console.error("⚠️ Error al crear perfil de paciente:", patientInsertError);
                            // No es crítico, el usuario puede completar su perfil después
                          }
                        } else {
                          // Enviar notificación al correo de contacto
                          try {
                            const { sendPatientRegistrationNotification } = await import("@/lib/services/emailService");
                            await sendPatientRegistrationNotification({
                              patientName: `${firstName} ${lastName}`,
                              patientEmail: email,
                              patientPhone: null,
                            });
                          } catch (notificationError) {
                            console.error("⚠️ Error al enviar notificación de registro (no crítico):", notificationError);
                            // No es crítico, el registro ya se completó exitosamente
                          }
                        }
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

                  if (confirmationLink) {
                    redirect("/confirmation?email-sent=true&registered=true");
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
      redirect("/signup?error=invalid-email");
      return;
    }
    
    if (signUpError.message.includes("Password should be at least")) {
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
    
    redirect("/signup?error=signup-failed");
  }

  // 4. Verificar que el registro fue exitoso
  if (signUpData?.user) {
  } else {
    console.error("❌ Error: signUpData.user es nulo después de un registro exitoso sin error.");
    redirect("/signup?error=unexpected-error");
  }
  
  revalidatePath("/", "layout");
  redirect("/confirmation");
}

export async function signupPro(formData: FormData) {
  const result = await executeSignupPro(formData);
  if (result.redirectUrl) {
    redirect(result.redirectUrl);
  }
  redirect("/signup-pro?error=signup-failed");
}

export async function signout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error al cerrar sesión:", error);
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
    console.error("Error al iniciar sesión con Google:", error);
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