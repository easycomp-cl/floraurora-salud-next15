import { NextRequest, NextResponse } from "next/server";
import { executeSignupPro } from "@/lib/signupProLogic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    console.log("[API signup-pro] Recibida solicitud, email:", formData.get("email"));

    const result = await executeSignupPro(formData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        redirectUrl: result.redirectUrl,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error,
        redirectUrl: result.redirectUrl,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API signup-pro] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
        redirectUrl: "/signup-pro?error=signup-failed",
      },
      { status: 500 }
    );
  }
}
