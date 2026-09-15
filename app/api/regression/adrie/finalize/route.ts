import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createArtDirection } from "@/lib/lumivey/art-direction";
import { createSiteDescription } from "@/lib/lumivey/site-description";
import { createLumiveyPreview } from "@/lib/lumivey/create-preview";
import { analyzeUploadedSource } from "@/lib/lumivey/analyze-uploaded-source";
import { extractUnderstanding } from "@/lib/lumivey/extract-understanding";
import { SourceContext, UploadedSourceInput } from "@/lib/lumivey/source-context";

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
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value || "Onbekende fout");
}

function isUploadedSourceInput(value: unknown): value is UploadedSourceInput {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<UploadedSourceInput>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.mimeType === "string" &&
    typeof candidate.dataUrl === "string" &&
    candidate.dataUrl.startsWith("data:image/") &&
    typeof candidate.size === "number"
  );
}

function promptSafeUnderstanding(understanding: any) {
  if (!understanding || typeof understanding !== "object") return understanding;
  const { sources: _sources, ...rest } = understanding;
  return rest;
}

function promptSafeSourceContexts(sourceContexts: SourceContext[]) {
  return sourceContexts.map((source) => ({
    ...source,
    assets: (source.assets ?? []).map((asset) => ({
      kind: asset.kind,
      name: asset.name,
      url: asset.url,
      origin: asset.origin,
      status: asset.status,
      evidence: asset.evidence,
      hasEmbeddedImage: Boolean(asset.dataUrl),
    })),
  }));
}

async function evaluate(input: unknown, previewImageDataUrl = "") {
  const instructions = `
Je beoordeelt een Lumivey referentietest voor Adrie Pouwer / AssetPouwer.
Dit is GEEN exacte transcript-replay van een historisch gesprek; het is een gecontroleerde reconstructie van de eerder vastgelegde referentie-inhoud. Beoordeel dus betekenisbehoud en kwaliteit, niet letterlijke formulering.

Kern die niet mag verdampen:
- Adrie is geen generieke consultant; hij verbindt strategie met operatie.
- Zijn technische bedding is elektrotechniek, industriële automatisering en meet- en regeltechniek, vooral in industrie en infra.
- "Poten in de klei" is belangrijk: buiten gewerkt, fabrieken opgestart, dus uitvoerbaarheid telt.
- Hij is rustig en luistert eerst; fotografie/compositie en zijn rustige zondagochtend in de natuur zijn een menselijke herkenningslaag die hij zelf verbindt aan zijn manier van werken.
- Het voorbeeld van de grote change laat zien dat hij consequenties voor mensen en budgetten zichtbaar maakt en besluitvorming helpt faseren.
- De website moet vertrouwen, rust, overzicht en senioriteit voelen, zonder corporate consultant-clichés.
- De bestaande website is bronmateriaal, niet de ontwerpwaarheid.
- Relevante bevestigde broninformatie, zoals contactgegevens en onderscheidende professionele context, mag niet zonder reden verdwijnen.
- Geen nieuwe feiten verzinnen.

LUMIVEY PREVIEW-NORM
- Een technisch nette of sectorspecifieke consultant-site is NIET automatisch PASS.
- De homepage hoort normaal zowel een professioneel anker als een persoonlijk herkenningsanker te bevatten, tenzij Discovery expliciet zegt dat Adrie dat niet wil.
- Voor deze SOLO consultant-case geldt: als echte door Adrie aangeleverde foto's beschikbaar zijn en er geen expliciet bezwaar tegen zichtbaarheid is, moet Adrie zelf EXACT ÉÉN KEER herkenbaar op de homepage zichtbaar zijn. Nul keer is een curatiefout; twee of meer keer is alleen acceptabel met een aantoonbaar andere, noodzakelijke verhaalfunctie.
- Een bos, camera, koffiekop, technische installatie of andere indirecte cue is ondersteunend en mag nooit als vervanging gelden voor die ene zichtbare menselijke aanwezigheid.
- Voor Adrie moet zijn rustige observerende/fotografische kant zichtbaar invloed hebben op beeldtaal, sfeer of compositie; alleen een technische installatie in rustig licht is onvoldoende als de persoonlijke laag verder ontbreekt.
- Een camera als los object is GEEN volwaardige vervanging voor het specifieke goudklompje: zondagochtend, natuur, kijken naar compositie, en de expliciete koppeling met zijn manier van werken. Als dit goudklompje alleen tot een generieke camera-prop of algemeen natuurbeeld is gereduceerd, is calm-observer-photography maximaal WARN.
- Fotografie/natuur mag niet als dienstverlening worden gepresenteerd.
- Als door Adrie aangeleverde foto's beschikbaar zijn, moeten die zichtbaar als primaire visuele bron worden gebruikt en mag een AI-vervanger zijn gezicht niet stilzwijgend overnemen.
- De ideale richting is een geloofwaardige combinatie van persoonlijke rust/observatie en technische assetmanagement-credibiliteit.
- PASS op preview-specificity vereist dat de preview duidelijk meer is dan een goede website voor een ervaren assetmanagementconsultant.

BRONRIJKDOM-NORM — GATE-KRITISCH
- Kijk niet alleen of de broncontext ergens in de input aanwezig is. Beoordeel of de GERENDERDE homepage aantoonbaar profiteert van de onderscheidende bronrijkdom.
- Als de bron rijke, onderscheidende professionele informatie bevat — bijvoorbeeld opleiding/diploma, lange en brede ervaring, relevante organisaties/rollen, professionele normering, aantoonbare kennisartikelen, concrete cases of andere geloofwaardigheidsankers — mag de Preview dat niet reduceren tot algemene termen als “ervaring”, “maatwerk”, “advies” of “impact”.
- Niet alles hoeft op de homepage, maar minstens twee concrete onderscheidende professionele goudklompjes of geloofwaardigheidsankers moeten zichtbaar of duidelijk als verdieping gepositioneerd zijn.
- Als relevante bronrijkdom aantoonbaar beschikbaar is maar de Preview nauwelijks meer laat zien dan generieke diensten/kreten, zet source-richness op WARN of FAIL.
- source-richness is gate-kritisch: overall PASS is NIET toegestaan wanneer source-richness WARN of FAIL is.

BEELDCURATIE-NORM
- Aangeleverde foto's vormen een bronpool, geen quota.
- Een homepage moet niet vol staan met herhaling van dezelfde persoon alleen omdat veel foto's beschikbaar zijn.
- Voor deze Adrie-case is EXACT ÉÉN herkenbare zichtbare verschijning van Adrie op de homepage de standaard wanneer echte foto's beschikbaar zijn. Nul zichtbare verschijningen is minimaal WARN op image-curation én personal-homepage-anchor; meer dan één is eveneens minimaal WARN tenzij een tweede beeld een duidelijke, noodzakelijke andere verhaalfunctie heeft.
- Na dat ene persoonlijke hoofdbeeld mogen techniek, werkomgeving, detailbeelden en sfeer de identiteit verder dragen.
- Een hobbyprop zoals de camera mag niet door herhaling zwaarder gaan wegen dan de professionele propositie. Twee cameramomenten zijn alleen acceptabel als ze duidelijk verschillende, betekenisvolle functies hebben; anders image-curation maximaal WARN.
- Straf onnodige persoonsherhaling, volledige afwezigheid ondanks bruikbare echte foto's, gezichtsvervorming, onherkenbare vervanging of ongunstige hoofd/face-crops af.

OVERALL-GATE
- overall PASS mag alleen wanneer ALLE gate-kritische checks PASS zijn: source-richness, personal-homepage-anchor, preview-specificity en image-curation.
- personal-homepage-anchor mag in deze Adrie-case NIET PASS zijn wanneer Adrie zelf niet herkenbaar zichtbaar is terwijl bruikbare echte foto's aanwezig zijn.
- Een sterke sfeer of mooie fotografie mag een inhoudelijke WARN niet maskeren.
- Als één gate-kritische check WARN is, is overall maximaal WARN.
- Als één gate-kritische check FAIL is, is overall FAIL.

Als previewAvailable=false, beoordeel preview-specificity en image-curation uitsluitend op de creatieve richting en zet expliciet dat de beeldpreview technisch niet beschikbaar was. Als previewAvailable=true en er is een beeld meegestuurd, beoordeel de GERENDERDE PREVIEW zelf en niet alleen de rationale.

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
    {"name":"source-richness","status":"PASS|WARN|FAIL","reason":""},
    {"name":"personal-homepage-anchor","status":"PASS|WARN|FAIL","reason":""},
    {"name":"preview-specificity","status":"PASS|WARN|FAIL","reason":""},
    {"name":"image-curation","status":"PASS|WARN|FAIL","reason":""}
  ]
}
`;

  const content: any[] = [
    { type: "input_text", text: JSON.stringify(input, null, 2) },
  ];
  if (previewImageDataUrl.startsWith("data:image/")) {
    content.push({ type: "input_image", image_url: previewImageDataUrl, detail: "low" });
  }

  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions,
    input: [{ role: "user", content }],
  });
  return parseJson(response.output_text);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let understanding = body?.understanding;
    const replay = Array.isArray(body?.replay) ? body.replay : [];
    let sourceContexts: SourceContext[] = Array.isArray(body?.sourceContexts) ? body.sourceContexts : [];
    const attachments = Array.isArray(body?.attachments)
      ? body.attachments.filter(isUploadedSourceInput).slice(0, 5)
      : [];

    if (!understanding) {
      return NextResponse.json({ error: "Geen Adrie Understanding ontvangen." }, { status: 400 });
    }

    if (attachments.length > 0) {
      const knownIds = new Set(sourceContexts.map((source) => source.sourceId).filter(Boolean));
      for (const attachment of attachments) {
        if (knownIds.has(attachment.id)) continue;
        const context = await analyzeUploadedSource(attachment);
        sourceContexts = [...sourceContexts, context];
        knownIds.add(attachment.id);
      }

      const messages = replay.flatMap((turn: any) => [
        { role: "user" as const, content: String(turn?.user || "") },
        { role: "assistant" as const, content: String(turn?.assistant || "") },
      ]);
      messages.push({
        role: "user" as const,
        content: `Ik heb ${attachments.length} foto's aangeleverd. Kies zelf welke het beste passen. Gebruik ze als echte beelden van mij; fotografie is persoonlijk en geen dienst.`,
      });
      understanding = await extractUnderstanding(messages, sourceContexts);
    }

    const [artDirection, siteDirection] = await Promise.all([
      createArtDirection(understanding),
      createSiteDescription(understanding),
    ]);

    let previewImpression: any = null;
    let previewError = "";

    try {
      const previewData = await createLumiveyPreview(understanding);
      previewImpression = previewData.impression;
    } catch (error) {
      previewError = errorMessage(error);
      console.error("Adrie preview substep error:", error);
    }

    const evaluationInput = {
      replay,
      understanding: promptSafeUnderstanding(understanding),
      artDirection,
      siteDirection,
      sourceContexts: promptSafeSourceContexts(sourceContexts),
      uploadedPhotoCount: attachments.length,
      previewAvailable: Boolean(previewImpression?.imageDataUrl),
      previewRationale: previewImpression?.rationale || [],
      previewError,
    };

    const evaluation = await evaluate(
      evaluationInput,
      typeof previewImpression?.imageDataUrl === "string" ? previewImpression.imageDataUrl : ""
    );

    return NextResponse.json({
      case: "Adrie Pouwer / AssetPouwer",
      purpose: "Contrastcase na Michael: broninterpretatie, menselijke diepte en creatieve richting voor een zakelijke B2B-adviseur.",
      note: attachments.length
        ? `Run 2 gebruikt ${attachments.length} door Adrie aangeleverde foto's als visuele bron vóór de Preview.`
        : "Run 1 zonder aangeleverde Adrie-foto's.",
      replay,
      sourceContexts,
      understanding,
      artDirection,
      siteDirection,
      previewImpression,
      previewError,
      uploadedPhotoCount: attachments.length,
      evaluation,
    });
  } catch (error) {
    console.error("Adrie finalize error:", error);
    return NextResponse.json({ error: errorMessage(error), stage: "adrie-finalize" }, { status: 500 });
  }
}
