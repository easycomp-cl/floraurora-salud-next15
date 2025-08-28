import { type NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Excluir rutas de autenticación y recursos estáticos del middleware
    if (pathname.startsWith('/auth/') || 
        pathname.startsWith('/_next/') || 
        pathname.startsWith('/api/') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.includes('.') ||
        pathname === '/') {
        return;
    }
    
    // Solo aplicar middleware a rutas protegidas
    if (pathname.startsWith('/dashboard/') || 
        pathname.startsWith('/admin/') ||
        pathname.startsWith('/profile/')) {
        return await updateSession(request);
    }
    
    return;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:woff2?|ttf|eot|otf|svg|png|jpg|jpeg|gif|ico)).*)',
    ],
}
