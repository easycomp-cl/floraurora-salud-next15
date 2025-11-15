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
        pathname.startsWith('/signup')) {
        return;
    }
    
    // Aplicar middleware a TODAS las rutas protegidas, incluyendo APIs
    // Esto asegura que las cookies se actualicen correctamente en todas las rutas
    // y previene problemas de cookies desactualizadas
    if (pathname.startsWith('/dashboard/') || 
        pathname.startsWith('/admin/') ||
        pathname.startsWith('/profile/') ||
        pathname.startsWith('/api/')) {
        return await updateSession(request);
    }
    
    return;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:woff2?|ttf|eot|otf|svg|png|jpg|jpeg|gif|ico)).*)',
    ],
}
