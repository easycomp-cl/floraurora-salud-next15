import { type NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Excluir solo recursos estáticos y rutas públicas específicas
    if (pathname.startsWith('/_next/') || 
        pathname.startsWith('/favicon.ico') ||
        pathname.includes('.')) {
        return;
    }
    
    // Excluir rutas de autenticación públicas
    if (pathname.startsWith('/auth/') || 
        pathname === '/' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/callback') ||
        pathname.startsWith('/confirm') ||
        pathname.startsWith('/confirmation') ||
        pathname.startsWith('/confirmed') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/reset-password') ||
        pathname.startsWith('/privacy') ||
        pathname.startsWith('/terms') ||
        pathname.startsWith('/about') ||
        pathname.startsWith('/contact') ||
        pathname.startsWith('/services') ||
        pathname.startsWith('/professionals') ||
        pathname.startsWith('/messages')) {
        return;
    }
    
    // Aplicar middleware SOLO a rutas protegidas que realmente necesitan autenticación
    // Esto asegura que las cookies se actualicen correctamente en todas las rutas protegidas
    // y previene problemas de cookies desactualizadas
    // IMPORTANTE: Incluir tanto '/dashboard' exacto como '/dashboard/' para cubrir todas las rutas
    if (pathname === '/dashboard' ||
        pathname.startsWith('/dashboard/') || 
        pathname.startsWith('/admin/') ||
        pathname.startsWith('/profile/') ||
        pathname.startsWith('/api/')) {
        return await updateSession(request);
    }
    
    // Para todas las demás rutas (públicas), no hacer nada
    return;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:woff2?|ttf|eot|otf|svg|png|jpg|jpeg|gif|ico)).*)',
    ],
}
