import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createArtDirection } from "@/lib/lumivey/art-direction";
import { createSiteDescription } from "@/lib/lumivey/site-description";

export const maxDuration = 300;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function parseJson(text: string) {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
    throw new Error("Adrie-beoordelaar gaf geen geldige JSON terug.");
  }
}

function errorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (typeof object.message === "string") return object.message;
    if (typeof object.error === "string") return object.error;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value || "Onbekende fout");
}

async function evaluate(input: unknown) {
  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: `
Je beoordeelt een Lumivey referentietest voor Adrie Pouwer / AssetPouwer.
Dit is GEEN exacte transcript-replay van een historisch gesprek; het is een gecontroleerde reconstructie van de eerder vastgelegde referentie-inhoud. Beoordeel dus betekenisbehoud en kwaliteit, niet letterlijke formulering.

Kern die niet mag verdampen:
- Adrie is geen generieke consultant; hij verbindt strategie met operatie.
- Zijn technische bedding is elektrotechniek, industriële automatisering en meet- en regeltechniek, vooral in industrie en infra.
- "Poten in de klei" is belangrijk: buiten gewerkt, fabrieken opgestart, dus uitvoerbaarheid telt.
- Hij is rustig en luistert eerst; fotografie/compositie is een menselijke herkenningslaag die hij zelf verbindt aan zijn manier van werken.
- Het voorbeeld van de grote change laat zien dat hij consequenties voor mensen en budgetten zichtbaar maakt en besluitvorming helpt faseren.
- De website moet vertrouwen, rust, overzicht en senioriteit voelen, zonder corporate consultant-clichés.
- De bestaande website is bronmateriaal, niet de ontwerpwaarheid.
- Geen nieuwe feiten verzinnen.

Als previewAvailable=false, beoordeel preview-specificity uitsluitend op de creatieve richting en zet in de reden expliciet dat de beeldpreview technisch niet beschikbaar was. Laat een technisch previewprobleem niet automatisch de Discovery/Understanding-beoordeling vervuilen.

Geef uitsluitend JSON terug:
{
  "overall":"PASS|WARN|FAIL",
  "diagnosis":"",
  "checks":[
    {"name":"strategy-operation-bridge","status":"PASS|WARN|FAIL","reason":""},
    {"name":"practical-roots","status":"PASS|WARN|FAIL","reason":""},
    {"name":"calm-observer-photography","status":"PASS|WARN|FAIL","reason":""},
    {"name":"decision-impact-example","status":"PASS|WARN|FAIL","reason":""},
    {"name":"source-not-design-truth","status":"PASS|WARN|FAIL","reason":""},
    {"name":"preview-specificity","status":"PASS|WARN|FAIL","reason":""}
  ]
}
`,
    input: JSON.stringify(input, null, 2),
  });
  return parseJson(response.output_text);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const understanding = body?.understanding;
    const replay = Array.isArray(body?.replay) ? body.replay : [];
    const sourceContexts = Array.isArray(body?.sourceContexts) ? body.sourceContexts : [];

    if (!understanding) {
      return NextResponse.json({ error: "Geen Adrie Understanding ontvangen." }, { status: 400 });
    }

    const [artDirection, siteDirection] = await Promise.all([
      createArtDirection(understanding),
      createSiteDescription(understanding),
    ]);

    const base = new URL(request.url).origin;
    let previewImpression: any = null;
    let previewError = "";

    try {
      const previewResponse = await fetch(`${base}/api/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ understanding }),
        cache: "no-store",
      });

      const previewText = await previewResponse.text();
      let previewData: any;
      try {
        previewData = JSON.parse(previewText);
      } catch {
        throw new Error(`Preview-route gaf geen JSON terug: ${previewText.slice(0, 180)}`);
      }

      if (!previewResponse.ok || !previewData?.impression?.imageDataUrl) {
        throw new Error(errorMessage(previewData?.error || "Adrie Preview kon niet worden gegenereerd."));
      }

      previewImpression = previewData.impression;
    } catch (error) {
      previewError = errorMessage(error);
      console.error("Adrie preview substep error:", error);
    }

    const evaluation = await evaluate({
      replay,
      understanding,
      artDirection,
      siteDirection,
      sourceContexts,
      previewAvailable: Boolean(previewImpression?.imageDataUrl),
      previewRationale: previewImpression?.rationale || [],
      previewError,
    });

    return NextResponse.json({
      case: "Adrie Pouwer / AssetPouwer",
      purpose: "Nieuwe contrastcase na Michael: broninterpretatie, menselijke diepte en creatieve richting voor een zakelijke B2B-adviseur.",
      note: "Deze test gebruikt een gecontroleerde reconstructie van de eerder vastgelegde Adrie-referentie-inhoud plus de bestaande website als bron. Foto-assets worden in een volgende laag toegevoegd zodra beschikbaar.",
      replay,
      sourceContexts,
      understanding,
      artDirection,
      siteDirection,
      previewImpression,
      previewError,
      evaluation,
    });
  } catch (error) {
    console.error("Adrie finalize error:", error);
    return NextResponse.json(
      { error: errorMessage(error), stage: "adrie-finalize" },
      { status: 500 }
    );
  }
}
