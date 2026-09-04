import { NextResponse } from "next/server";
import { createSiteDescription } from "@/lib/lumivey/site-description";
import { createArtDirection } from "@/lib/lumivey/art-direction";
import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const understanding = body.understanding as LumiveyUnderstanding;

    if (!understanding) {
      return NextResponse.json(
        { error: "Geen intern begrip ontvangen." },
        { status: 400 }
      );
    }

    const [site, artDirection] = await Promise.all([
      createSiteDescription(understanding),
      createArtDirection(understanding),
    ]);

    return NextResponse.json({
      site,
      artDirection,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "De preview kon niet worden gemaakt." },
      { status: 500 }
    );
  }
}