import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Función para configurar cookies de sesión de manera consistente (solo servidor)
export function setSessionCookies(response: NextResponse, session: any) {
  if (!session?.access_token) {
    return response;
  }

  const { access_token, refresh_token } = session;
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 días
  };

  // Cookie principal de autenticación
  response.cookies.set('sb-auth-token', access_token, cookieOptions);
  
  // Cookie de acceso de Supabase
  response.cookies.set('sb-access-token', access_token, cookieOptions);
  
  // Cookie de refresh si existe
  if (refresh_token) {
    response.cookies.set('sb-refresh-token', refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30 // 30 días para refresh token
    });
  }

  // Cookie adicional para compatibilidad
  response.cookies.set('supabase-auth-token', access_token, cookieOptions);

  return response;
}

// Función para limpiar cookies de sesión (solo servidor)
export function clearSessionCookies(response: NextResponse) {
  const cookieNames = [
    'sb-auth-token',
    'sb-access-token', 
    'sb-refresh-token',
    'supabase-auth-token'
  ];

  cookieNames.forEach(name => {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0)
    });
  });

  return response;
}

// Función para obtener cookies de sesión (solo servidor)
export function getSessionCookies() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  
  return {
    authToken: allCookies.find(c => c.name === 'sb-auth-token')?.value,
    accessToken: allCookies.find(c => c.name === 'sb-access-token')?.value,
    refreshToken: allCookies.find(c => c.name === 'sb-refresh-token')?.value,
    allCookies
  };
}
