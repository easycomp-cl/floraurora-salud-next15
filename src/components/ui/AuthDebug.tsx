"use client";

import { useAuthState } from "@/lib/hooks/useAuthState";
import { useEffect, useState } from "react";
import supabase from "@/utils/supabase/client";

export default function AuthDebug() {
  const { user, session, isLoading, isAuthenticated } = useAuthState();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [cookies, setCookies] = useState<string[]>([]);

  useEffect(() => {
    const getDebugInfo = async () => {
      try {
        // Obtener información de debug de Supabase
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        // Obtener cookies del navegador
        const allCookies = document.cookie.split(";").map((c) => c.trim());
        const supabaseCookies = allCookies.filter((c) => c.includes("sb-"));

        setDebugInfo({
          useAuthHook: {
            user: user
              ? {
                  id: user.id,
                  email: user.email,
                  role: user.user_metadata?.role,
                }
              : null,
            session: session
              ? {
                  access_token: !!session.access_token,
                  refresh_token: !!session.refresh_token,
                  expires_at: session.expires_at,
                }
              : null,
            loading: isLoading,
            isAuthenticated,
          },
          directSupabase: {
            session: currentSession
              ? {
                  access_token: !!currentSession.access_token,
                  refresh_token: !!currentSession.refresh_token,
                  expires_at: currentSession.expires_at,
                }
              : null,
            user: currentUser
              ? {
                  id: currentUser.id,
                  email: currentUser.email,
                  role: currentUser.user_metadata?.role,
                }
              : null,
            sessionError: sessionError?.message,
            userError: userError?.message,
          },
          environment: {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            supabaseUrl:
              process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
          },
        });

        setCookies(supabaseCookies);
      } catch (error) {
        console.error("Error getting debug info:", error);
      }
    };

    getDebugInfo();
  }, [user, session, isLoading, isAuthenticated]);

  if (!process.env.NODE_ENV || process.env.NODE_ENV === "production") {
    return null; // No mostrar en producción
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md text-xs z-50">
      <h3 className="font-bold mb-2">🔍 Debug de Autenticación</h3>

      <div className="space-y-2">
        <div>
          <strong>useAuth Hook:</strong>
          <pre className="text-xs mt-1">
            {JSON.stringify(debugInfo.useAuthHook, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Supabase Directo:</strong>
          <pre className="text-xs mt-1">
            {JSON.stringify(debugInfo.directSupabase, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Variables de Entorno:</strong>
          <pre className="text-xs mt-1">
            {JSON.stringify(debugInfo.environment, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Cookies de Supabase:</strong>
          <div className="text-xs mt-1">
            {cookies.length > 0
              ? cookies.map((cookie, i) => (
                  <div key={i} className="break-all">
                    {cookie}
                  </div>
                ))
              : "No hay cookies de Supabase"}
          </div>
        </div>
      </div>
    </div>
  );
}
