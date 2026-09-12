import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type AssetSpec = {
  name: string;
  role: string;
  source: string;
  validationStatus: "approved" | "needs-owner-validation" | "replace-with-real-if-available";
  productionInstruction: string;
  prompt: string;
};

const SPECS: AssetSpec[] = [
  {
    name: "michael-porsche-origin.png",
    role: "Porsche 356 oorsprongsverhaal — vader/zoon beeld",
    source: "Artistieke productie-asset op basis van de goedgekeurde Preview; concept voor het vader/Porsche-oorsprongsverhaal.",
    validationStatus: "replace-with-real-if-available",
    productionInstruction: "Gebruik voor het emotionele oorsprongsverhaal. Vraag vóór livegang of Michael een echte oude foto heeft; die mag met AI worden hersteld en in deze stijl gebracht. Als Michael de artistieke interpretatie goedkeurt, mag die blijven.",
    prompt: "Create a CLEAN standalone cinematic vintage family photograph for a premium automotive detailing website. A father stands beside a classic silver Porsche 356 with a young boy near him, late-1970s/early-1980s family-photo feeling, warm slightly faded analog colors, understated European driveway, emotionally authentic but not melodramatic. This is an artistic placeholder, not a depiction of any known real person. IMPORTANT: image only. NO text, NO typography, NO website UI, NO buttons, NO frame, NO polaroid border, NO caption. Landscape editorial photograph suitable as a production website asset.",
  },
  {
    name: "porsche-356-detail.png",
    role: "Porsche 356 detail / textuur",
    source: "AI-gegenereerd sfeer/detailbeeld uit de visuele taal van de goedgekeurde Preview; geen persoonlijk feit.",
    validationStatus: "approved",
    productionInstruction: "Gebruik als secundaire detaildrager bij het oorsprongsverhaal; niet als hoofdbeeld van de site.",
    prompt: "Create a CLEAN standalone premium automotive detail photograph: close-up of the rear bodywork and metal 356 model badge of a classic Porsche 356, dark black-gold cinematic lighting, glossy paint, shallow depth of field, tactile metal and lacquer, elegant high-end editorial car photography. Image only. NO website text, NO buttons, NO UI, NO decorative typography. Landscape 16:9 composition.",
  },
  {
    name: "yellow-car-cta.png",
    role: "Gele sportwagen / CTA-visuele climax",
    source: "AI-gegenereerd sfeerbeeld passend bij de goedgekeurde Preview; bedoeld voor CTA/achtergrond en lak/glansgevoel.",
    validationStatus: "approved",
    productionInstruction: "Gebruik als rijke beeldlaag richting de afsluitende CTA. Behoud warme gele lak, glans, close-up schaal en premium sfeer uit de Preview.",
    prompt: "Create a CLEAN standalone cinematic close-up of a glossy yellow high-end sports car body panel, mirror and curved fender under workshop lighting, deep black background, rich golden reflections, wet-look lacquer, premium automotive editorial photography, energetic but refined. Image only. NO visible brand logo, NO people, NO text, NO website UI. Wide landscape composition suitable as a website background.",
  },
  {
    name: "detailing-process.png",
    role: "Detailing proces / dienstbeeld",
    source: "AI-gegenereerd dienstbeeld passend bij Michael's detailingverhaal; geen persoonlijk feit.",
    validationStatus: "approved",
    productionInstruction: "Gebruik voor visuele rijkdom bij werkwijze of diensten. Niet presenteren als documentaire foto van Michael zelf.",
    prompt: "Create a CLEAN standalone high-end car detailing process photograph: gloved hands carefully machine-polishing a glossy dark car panel in a professional workshop, warm gold highlights, deep blacks, visible paint reflections and precision, premium editorial automotive photography. Image only. NO text, NO website UI, NO logos, NO identifiable face. Landscape composition suitable for a service section.",
  },
];

export async function POST() {
  try {
    const generated = await Promise.all(
      SPECS.map(async (spec) => {
        const result = await openai.images.generate({
          model: "gpt-image-2",
          prompt: spec.prompt,
          size: "1536x1024",
          quality: "medium",
        });
        const b64 = result.data?.[0]?.b64_json;
        if (!b64) throw new Error(`Geen beeld ontvangen voor ${spec.name}.`);
        return {
          name: spec.name,
          kind: "image" as const,
          dataUrl: `data:image/png;base64,${b64}`,
          purpose: "supporting" as const,
          aiStatus: "artist-interpretation" as const,
          origin: "generated" as const,
          validationStatus: spec.validationStatus,
          role: spec.role,
          source: spec.source,
          productionInstruction: spec.productionInstruction,
        };
      })
    );

    return NextResponse.json({ assets: generated });
  } catch (error) {
    console.error("Michael production asset generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Productie-assets konden niet worden gemaakt." },
      { status: 500 }
    );
  }
}
