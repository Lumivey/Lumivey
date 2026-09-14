import { NextResponse } from "next/server";
import { createLumiveyPreview } from "@/lib/lumivey/create-preview";
import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const understanding = body.understanding as LumiveyUnderstanding | undefined;

    if (!understanding) {
      return NextResponse.json({ error: "Geen intern begrip ontvangen." }, { status: 400 });
    }

    return NextResponse.json(await createLumiveyPreview(understanding));
  } catch (error) {
    console.error("Artist impression error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "De impressie kon niet worden gemaakt." },
      { status: 500 }
    );
  }
}
