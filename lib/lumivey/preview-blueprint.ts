import OpenAI from "openai";
import type { WebsiteBrief } from "@/lib/lumivey/primary-flow";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function createPreviewBlueprint(brief: WebsiteBrief): Promise<string> {
  const preview = brief.artistImpression?.imageDataUrl;

  if (!preview) {
    throw new Error("Geen goedgekeurde Preview beschikbaar voor visuele analyse.");
  }

  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: `Je analyseert een goedgekeurde Lumivey Preview uitsluitend als ontwerp-referentie voor een websitegenerator.

Maak een compacte maar concrete VISUELE BLUEPRINT in platte tekst. Beschrijf alleen wat zichtbaar en bruikbaar is voor reconstructie als echte HTML/CSS/componenten.

Leg minimaal vast:
- sectievolgorde en relatieve hoogtes;
- grid/kolommen, uitlijning, witruimte en ritme;
- kleurverdeling en contrast;
- typografische hiërarchie en sfeer;
- welk beeld in welke sectie welke rol heeft;
- hoeveel keer herkenbare personen zichtbaar zijn en waar;
- welke persoonlijke/sfeervolle laag subtiel of dominant is;
- CTA-plaatsing;
- opvallende grafische lijnen, kaders, overlays, texturen of schema's;
- wat absoluut NIET groter, vaker of dominanter mag worden dan in de Preview.

Harde regels:
- De Preview zelf mag nooit productieasset worden.
- Beschrijf geen fictieve details die niet zichtbaar zijn.
- Noem expliciet wanneer een persoon precies één keer zichtbaar is.
- Noem expliciet wanneer een hobby/persoonlijk motief slechts een kleine secundaire rol heeft.
- Beschrijf de compositie zo dat een generator de pagina kan herbouwen zonder de screenshot te ontvangen.
- Houd de blueprint onder ongeveer 1200 woorden.`,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Analyseer deze goedgekeurde Preview. De inhoudelijke rationale is:\n${brief.artistImpression.rationale.join("\n")}`,
          },
          {
            type: "input_image",
            image_url: preview,
          },
        ],
      },
    ],
  });

  const blueprint = response.output_text?.trim();
  if (!blueprint) {
    throw new Error("De visuele Preview-analyse leverde geen blueprint op.");
  }

  return blueprint;
}
