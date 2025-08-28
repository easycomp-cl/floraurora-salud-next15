import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'
import { insertConfirmedUser } from '@/lib/email-confirm'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = await createClient()

    const { error, data } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      if (data.user) {
        const fullName = data.user.user_metadata.full_name || "";
        const [firstName, ...rest] = fullName.split(" ");
        const lastName = rest.join(" ");
        const userData = {
          id: data.user.id,
          name: firstName || "",
          last_name: lastName || "",
          email: data.user.email || "",
          role: 2, 
        };
        const { success, error: insertError } = await insertConfirmedUser(userData);
        if (!success) {
          console.error("Error al insertar el usuario en la tabla 'users' después de la confirmación:", insertError);
          redirectTo.pathname = '/error';
          return NextResponse.redirect(redirectTo);
        }
      }
      redirectTo.searchParams.delete('next');
      redirectTo.pathname = '/auth/confirmed'; // Redirigir a la nueva página de confirmación exitosa
      return NextResponse.redirect(redirectTo);
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = '/error'
  return NextResponse.redirect(redirectTo)
}