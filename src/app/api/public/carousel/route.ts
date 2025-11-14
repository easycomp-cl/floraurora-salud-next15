import { NextResponse } from "next/server";
import { configService } from "@/lib/services/configService";

export async function GET() {
  try {
    const items = await configService.getActiveCarouselItems();
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("[GET /api/public/carousel] Error", error);
    return NextResponse.json({ error: "Error interno al obtener el carrusel." }, { status: 500 });
  }
}

