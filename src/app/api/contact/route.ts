import { NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validations/contact';
import { sendContactEmail, sendContactConfirmationEmail } from '@/lib/services/emailService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validar los datos con Zod
    const validatedData = contactFormSchema.parse(body);
    
    console.log('📧 Recibida solicitud de contacto:', validatedData);
    
    // Enviar email al equipo
    const teamEmailResult = await sendContactEmail(validatedData);
    
    if (!teamEmailResult.success) {
      console.error('❌ Error al enviar email al equipo:', teamEmailResult.error);
      return NextResponse.json(
        { error: 'Error al enviar el email al equipo' },
        { status: 500 }
      );
    }
    
    console.log('✅ Email enviado al equipo exitosamente');
    
    // Enviar email de confirmación al usuario
    const confirmationResult = await sendContactConfirmationEmail(validatedData);
    
    if (!confirmationResult.success) {
      console.error('⚠️ No se pudo enviar email de confirmación:', confirmationResult.error);
      // No falla la petición completa si esto falla, solo lo registramos
    } else {
      console.log('✅ Email de confirmación enviado al usuario');
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Mensaje enviado exitosamente'
    });
    
  } catch (error: unknown) {
    console.error('❌ Error en API de contacto:', error);

    // Si es un error de validación de Zod
    if (error && typeof error === 'object' && 'errors' in error) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

