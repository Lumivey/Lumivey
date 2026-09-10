import { NextResponse } from "next/server";
import { createSiteDescription } from "@/lib/lumivey/site-description";
import { createArtDirection } from "@/lib/lumivey/art-direction";
import { chooseLayoutVariant } from "@/lib/lumivey/layout-variant";
import { createImageBrief } from "@/lib/lumivey/image-brief";
import { assessPreviewReadiness } from "@/lib/lumivey/preview-readiness";
import { createPreviewComposition } from "@/lib/lumivey/preview-composition";
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

    const readiness = await assessPreviewReadiness(understanding);

    // In deze bouwfase blijft de handmatige testknop bewust bestaan.
    // Daarom blokkeren we een vroege preview nog niet wanneer readiness=false.
    // In de echte productflow wordt readiness de trigger voor het verrassingsmoment.
    const [site, artDirection] = await Promise.all([
      createSiteDescription(understanding),
      createArtDirection(understanding),
    ]);

    const [composition, imageBrief] = await Promise.all([
      createPreviewComposition(
        understanding,
        artDirection,
        readiness
      ),
      createImageBrief(understanding, artDirection),
    ]);

    // Tijdelijke fallback voor de bestaande goedkeur-/publicatieketen.
    // De nieuwe preview renderer gebruikt composition. layoutVariant blijft
    // aanwezig totdat /site ook op de nieuwe compositie draait.
    const layoutVariant = chooseLayoutVariant(understanding);

    return NextResponse.json({
      readiness,
      composition,
      site,
      artDirection,
      layoutVariant,
      imageBrief,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "De preview kon niet worden gemaakt." },
      { status: 500 }
    );
  }
}
