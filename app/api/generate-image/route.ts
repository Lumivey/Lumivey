import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ImageBriefItem = {
  purpose: string;
  subject: string;
  setting: string;
  composition: string;
  atmosphere: string;
  avoid: string[];
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const brief = body.brief as ImageBriefItem;

    if (!brief) {
      return NextResponse.json(
        { error: "Geen beeldbriefing ontvangen." },
        { status: 400 }
      );
    }

    const prompt = `
Maak een realistische tijdelijke websitefoto op basis van deze beeldbriefing.

DOEL
${brief.purpose}

ONDERWERP
${brief.subject}

OMGEVING
${brief.setting}

COMPOSITIE
${brief.composition}

SFEER
${brief.atmosphere}

VERMIJD
${brief.avoid.map((item) => `- ${item}`).join("\n")}

BELANGRIJK:
- fotorealistische fotografie;
- geloofwaardig natuurlijk licht;
- geen tekst, logo's of watermerken in het beeld;
- geen fictief portret van de ondernemer;
- geen generieke stockfotografie;
- geen overdreven reclame-esthetiek;
- het beeld moet geschikt zijn als rustige hoogwaardige websitefotografie.
    `;

    const result = await openai.images.generate({
      model: "gpt-image-2",
      prompt,
      size: "1024x1536",
      quality: "medium",
    });

    const imageBase64 = result.data[0]?.b64_json;

    if (!imageBase64) {
      throw new Error("Geen afbeelding ontvangen.");
    }

    return NextResponse.json({
      image: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error) {
    console.error("Image generation error:", error);

    return NextResponse.json(
      { error: "De afbeelding kon niet worden gemaakt." },
      { status: 500 }
    );
  }
}