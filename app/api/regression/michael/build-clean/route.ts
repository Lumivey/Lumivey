import OpenAI from "openai";
import { NextResponse } from "next/server";
import type { ArtistImpression, WebsiteAsset, WebsiteBrief } from "@/lib/lumivey/primary-flow";
import type { LumiveyUnderstanding } from "@/lib/lumivey/understanding";
import { createV0Build } from "@/lib/lumivey/v0-adapter";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type InputImage = { name: string; dataUrl: string };

type AssetSpec = {
  name: string;
  role: string;
  validationStatus: WebsiteAsset["validationStatus"];
  source: string;
  productionInstruction: string;
  prompt: string;
};

const SPECS: AssetSpec[] = [
  {
    name: "michael-porsche-origin.jpg",
    role: "Porsche 356 oorsprongsverhaal — vader/zoon conceptbeeld",
    validationStatus: "needs-owner-validation",
    source: "Artistieke productie-asset afgeleid van de goedgekeurde Preview. Geen documentaire foto van Michael of zijn vader.",
    productionInstruction: "Gebruik voor het emotionele oorsprongsverhaal. Voor livegang Michael laten kiezen: behouden als artistieke interpretatie, vervangen door echte oude foto, of een echte foto door AI laten herstellen/stijlen.",
    prompt: "Create a clean standalone cinematic vintage family photograph for a premium automotive detailing website. A father stands beside a classic silver Porsche 356 with a young boy near him, late-1970s/early-1980s family-photo feeling, warm slightly faded analog colors, understated European driveway, emotionally authentic but not melodramatic. This is an artistic placeholder, not a depiction of any known real person. NO text, NO typography, NO website UI, NO logos added, NO frame, NO polaroid border. Landscape photo, editorial quality, believable old print character while still usable as a clean web asset.",
  },
  {
    name: "porsche-356-detail.jpg",
    role: "Porsche 356 detail / textuur",
    validationStatus: "approved",
    source: "AI-gegenereerd sfeer/detailbeeld uit de visuele taal van de goedgekeurde Preview; geen persoonlijk feit.",
    productionInstruction: "Gebruik als klein ondersteunend detailbeeld bij het oorsprongsverhaal; niet als hoofdbeeld van de site.",
    prompt: "Create a clean standalone premium automotive detail photograph: close-up of the rear bodywork and metal 356 model badge of a classic Porsche 356, dark black-gold cinematic lighting, glossy paint, shallow depth of field, tactile metal and lacquer, elegant high-end editorial car photography. NO website text, NO buttons, NO UI, NO decorative typography. Landscape 16:9 composition, realistic photography.",
  },
  {
    name: "yellow-car-detail.jpg",
    role: "Gele sportwagen / CTA-visuele climax",
    validationStatus: "approved",
    source: "AI-gegenereerd sfeerbeeld passend bij de goedgekeurde Preview; bedoeld voor CTA/achtergrond en lak/glansgevoel.",
    productionInstruction: "Gebruik als rijke beeldlaag richting de afsluitende CTA. Behoud warme gele lak, glans en premium sfeer.",
    prompt: "Create a clean standalone cinematic close-up of a glossy yellow high-end sports car body panel, mirror and curved fender under workshop lighting, deep black background, rich golden reflections, wet-look lacquer, premium automotive editorial photography, energetic but refined. NO visible brand logo, NO people, NO text, NO website UI. Wide landscape composition suitable as a website background.",
  },
  {
    name: "detailing-process.jpg",
    role: "Detailing-proces / dienstbeeld",
    validationStatus: "approved",
    source: "AI-gegenereerd dienstbeeld passend bij Michael's detailingverhaal; geen persoonlijk feit.",
    productionInstruction: "Gebruik voor diensten/werkwijze om de pagina beeldrijk te houden zonder dezelfde Michael-foto steeds te herhalen.",
    prompt: "Create a clean standalone high-end car detailing process photograph: gloved hands carefully machine-polishing a glossy dark car panel in a professional workshop, warm gold highlights, deep blacks, visible paint reflections and precision, premium editorial automotive photography. NO text, NO website UI, NO logos, NO identifiable face. Landscape composition suitable for a service section.",
  },
];

const understanding: LumiveyUnderstanding = {
  entrepreneur: { name: "Michael", profession: "High-end car detailer" },
  identity: {
    motivation: ["Wil als student bijverdienen met werk waar zijn fascinatie voor bijzondere auto's in terugkomt."],
    craftsmanship: [
      "Kiest bewust voor zorgvuldig reinigen, kleien, polijsten en beschermen in plaats van snelle wasstraatbehandeling.",
      "Let op swirls, lakbehoud, glans en afwerking.",
    ],
    story: ["Zijn fascinatie voor bijzondere auto's begon bij de oude Porsche 356 van zijn vader."],
    recognitionAnchors: [
      "Michael zelf, geconcentreerd werkend aan de lak van een gele sportwagen.",
      "Donkere premium sfeer met geel/goud als accent uit de aangeleverde foto.",
      "Porsche 356 als ondersteunend oorsprongsverhaal, niet als hoofdonderwerp.",
    ],
  },
  humanSignals: [{
    signal: "Michael reageert fel op wasstraten en swirls; voor hem gaat detailing om behoud en respect voor lak, niet alleen schoonmaken.",
    evidence: "‘Haha een wasstraat? Daar krijg je alleen maar swirls van in je lak. Nooit doen!’",
    confidence: "high",
    previewRelevance: "high",
  }],
  business: {
    services: ["Reinigen", "Kleien", "Polijsten", "Beschermen", "Wetlook-afwerking"],
    audience: ["Eigenaren van luxe auto's en sportwagens", "Topsegment"],
    importantNeeds: ["Klanten vinden voor high-end detailing"],
  },
  website: {
    purpose: ["Nieuwe klanten laten zien dat Michael zorgvuldig en op topsegmentniveau werkt", "Contact mogelijk maken"],
    desiredFeeling: ["Premium", "Precies", "Persoonlijk", "Rustig en zelfverzekerd"],
    usefulContent: ["Werkwijze", "Diensten", "Verhaal achter de Porsche 356", "Contact"],
  },
  sourceBacked: { businessNames: [], professions: [], locations: [], services: [], contactDetails: [], visualAnchors: [] },
  facts: [
    "Michael is student en wil bijverdienen.",
    "Hij wil luxe auto's en sportwagens detailen in het topsegment.",
    "Hij gebruikt Meguiar's producten.",
    "Hij noemt reinigen, kleien, polijsten, harde wax en optioneel wetlook.",
    "Zijn fascinatie begon bij de oude Porsche 356 van zijn vader.",
    "Hij vermijdt wasstraten vanwege swirls in de lak.",
  ],
  interpretations: ["De visuele richting mag precisie, lakbehoud en respect voor bijzondere auto's sterker maken dan algemene luxe-clichés."],
  unknowns: [],
  sources: [],
};

async function generateAsset(spec: AssetSpec): Promise<WebsiteAsset> {
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
    kind: "image",
    dataUrl: `data:image/png;base64,${b64}`,
    purpose: "supporting",
    aiStatus: "artist-interpretation",
    origin: "generated",
    validationStatus: spec.validationStatus,
    role: spec.role,
    source: spec.source,
    productionInstruction: spec.productionInstruction,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const preview = body?.preview as InputImage | undefined;
    const sourcePhoto = body?.sourcePhoto as InputImage | undefined;
    if (!preview?.dataUrl || !sourcePhoto?.dataUrl) {
      return NextResponse.json({ error: "Preview en echte Michael-foto zijn beide vereist." }, { status: 400 });
    }

    const generatedAssets = await Promise.all(SPECS.map(generateAsset));

    const impression: ArtistImpression = {
      id: "michael-approved-preview-2026-09-12",
      imageDataUrl: preview.dataUrl,
      headline: "Michael — High-End Detailing",
      rationale: [
        "Michael zelf is de primaire herkenningsdrager.",
        "Geel/goud uit de echte bronfoto bepaalt de accentkleur.",
        "Topsegment detailing is het hoofdverhaal.",
        "Porsche 356 blijft ondersteunend als oorsprongsverhaal.",
        "De pagina voelt als één ontworpen geheel, niet als een stapel blokken.",
      ],
      createdAt: new Date().toISOString(),
    };

    const realHeroAsset: WebsiteAsset = {
      name: sourcePhoto.name || "Michael bronfoto",
      kind: "image",
      dataUrl: sourcePhoto.dataUrl,
      purpose: "primary",
      aiStatus: "real",
      origin: "customer",
      validationStatus: "approved",
      role: "Primaire hero en herkenningsanker — Michael werkend aan gele auto",
      source: "Echte aangeleverde foto van Michael werkend aan de gele auto.",
      productionInstruction: "Gebruik als primaire menselijke productie-asset en als bron voor geel/goud, licht en sfeer. Vervang Michael niet door een gegenereerde persoon.",
    };

    const brief: WebsiteBrief = {
      version: 1,
      understanding,
      artistImpression: impression,
      facts: [
        { key: "entrepreneur.name", value: "Michael", status: "confirmed", source: "Golden Path reference" },
        { key: "business.positioning", value: "High-end detailing voor luxe auto's en sportwagens", status: "confirmed", source: "Golden Path reference" },
        { key: "business.origin", value: "Fascinatie begon bij de Porsche 356 van zijn vader", status: "confirmed", source: "Golden Path reference" },
        { key: "business.products", value: "Meguiar's", status: "confirmed", source: "Golden Path reference" },
      ],
      assets: [realHeroAsset, ...generatedAssets],
      pages: [
        { name: "Home", purpose: "De goedgekeurde Preview als werkende responsive homepage realiseren", knownContent: ["Michael", "Werkwijze", "Diensten", "Porsche 356 oorsprongsverhaal", "Contact"] },
        { name: "Over Michael", purpose: "Persoonlijke achtergrond en oorsprong", knownContent: ["Porsche 356 van zijn vader als ondersteunend verhaal"] },
        { name: "Diensten", purpose: "Detailingdiensten uitleggen", knownContent: ["Reinigen", "Kleien", "Polijsten", "Beschermen", "Wetlook-afwerking"] },
        { name: "Contact", purpose: "Kennismaking en aanvraag", knownContent: [] },
      ],
      functionalRequirements: ["Responsive desktop en mobiel", "Contactmogelijkheid", "Sterke beeldgedreven homepage"],
      constraints: [
        "De Preview is de design authority; de brief is alleen vangrail voor feiten, functies en assetbetekenis.",
        "Gebruik uitsluitend schone productie-assets zonder ingebakken website-tekst of layout voor beeldvlakken.",
        "Gebruik de echte foto van Michael als primaire menselijke bron.",
        "Gebruik de losse gegenereerde assets om de visuele rijkdom van de Preview te benaderen zonder de Preview zelf als achtergrondbeeld te recyclen.",
        "Verzin geen contactgegevens, adres, openingstijden, prijzen, certificeringen of andere niet-bevestigde feiten.",
        "Persoonlijke artistieke elementen mogen creatief blijven zolang hun validatiestatus wordt gerespecteerd.",
      ],
      unknowns: [],
    };

    const build = await createV0Build(brief);
    return NextResponse.json({ build, assetSummary: generatedAssets.map(({ name, role, validationStatus }) => ({ name, role, validationStatus })) });
  } catch (error) {
    console.error("Michael clean production build error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Clean productiepack kon niet worden gebouwd." },
      { status: 500 }
    );
  }
}
