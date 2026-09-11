import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createArtDirection } from "@/lib/lumivey/art-direction";
import { createSiteDescription } from "@/lib/lumivey/site-description";
import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function compactUnderstanding(understanding: LumiveyUnderstanding) {
  return {
    entrepreneur: understanding.entrepreneur,
    identity: understanding.identity,
    humanSignals: understanding.humanSignals,
    business: understanding.business,
    website: understanding.website,
    facts: understanding.facts,
    interpretations: understanding.interpretations,
    unknowns: understanding.unknowns,
    sourceBacked: understanding.sourceBacked,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const understanding = body.understanding as LumiveyUnderstanding | undefined;

    if (!understanding) {
      return NextResponse.json({ error: "Geen intern begrip ontvangen." }, { status: 400 });
    }

    const [site, artDirection] = await Promise.all([
      createSiteDescription(understanding),
      createArtDirection(understanding),
    ]);

    const highHumanSignals = (understanding.humanSignals || [])
      .filter((item) => item.previewRelevance === "high")
      .slice(0, 4);

    const prompt = `
Create ONE polished visual artist impression of a future website for an entrepreneur.
This is a Lumivey Preview: a high-fidelity website concept image whose purpose is recognition and WoW before the real website is built.

IMPORTANT
- Output a single vertical website screenshot / concept board, not browser chrome and not a collage of multiple alternatives.
- It must look like a believable future website, but it is an image, not working HTML.
- The approved real website will later be built by a production engine from this creative direction, so keep the concept technically realistic for modern responsive web development.
- Do not invent factual claims, contact details, awards, clients, prices, addresses, opening hours or biography.
- Unknown facts must not appear as invented copy.
- Prioritize identity, atmosphere, visual hierarchy, image/story combination and entrepreneur-specific recognition.
- Avoid generic template aesthetics.
- Avoid excessive dashboard/card UI unless the business genuinely calls for it.
- Use concise Dutch website copy where copy is visible.
- The design should be strong enough that the entrepreneur can react: “Ja, dit ben ik.”

HUMAN RECOGNITION RULE
When HIGH-RELEVANCE HUMAN SIGNALS are provided below, use at least one of them meaningfully in the image, copy, atmosphere or composition, unless doing so would be inappropriate or technically unrealistic.
Do not reduce it to a decorative hobby card. Let it help make this the website of this specific entrepreneur rather than a generic website for the profession.
Never extend the signal beyond its evidence.

HIGH-RELEVANCE HUMAN SIGNALS
${JSON.stringify(highHumanSignals, null, 2)}

CURRENT LUMIVEY UNDERSTANDING
${JSON.stringify(compactUnderstanding(understanding), null, 2)}

CREATIVE DIRECTION
${JSON.stringify(artDirection, null, 2)}

CONTENT DIRECTION
${JSON.stringify(site, null, 2)}

MAKEABILITY RULE
Do not show visual or interaction ideas that a modern production engine such as v0/Vercel could not reasonably reproduce in a responsive website. Prefer strong composition, typography, photography, spacing and color over impossible effects.
`;

    const result = await openai.images.generate({
      model: "gpt-image-2",
      prompt,
      size: "1024x1536",
      quality: "medium",
    });

    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      throw new Error("Geen artist impression ontvangen.");
    }

    return NextResponse.json({
      impression: {
        id: `impression-${Date.now()}`,
        imageDataUrl: `data:image/png;base64,${imageBase64}`,
        headline: site.title || "Eerste impressie",
        rationale: [
          ...highHumanSignals.map((item) => item.signal),
          ...(artDirection.personality || []).slice(0, 3),
          ...(understanding.identity.recognitionAnchors || []).slice(0, 3),
        ].filter(Boolean).slice(0, 6),
        createdAt: new Date().toISOString(),
      },
      artDirection,
      siteDirection: site,
    });
  } catch (error) {
    console.error("Artist impression error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "De impressie kon niet worden gemaakt." },
      { status: 500 }
    );
  }
}
