import { NextResponse } from "next/server";
import { SourceContext } from "@/lib/lumivey/source-context";
import { ArtistImpression, WebsiteAsset, WebsiteBrief, WebsiteFact, checkBuildReadiness } from "@/lib/lumivey/primary-flow";
import { createV0Build } from "@/lib/lumivey/v0-adapter";
import { LumiveyUnderstanding, SourceBackedCandidate } from "@/lib/lumivey/understanding";
import { ADRIE_REGRESSION_SOURCE_CONTEXTS } from "@/lib/lumivey/regression/adrie-checkpoint";
import { ADRIE_CHECKPOINT_UNDERSTANDING } from "@/lib/lumivey/regression/adrie-understanding";

export const maxDuration = 300;

type BuildAttachmentInput = {
  id?: string;
  name?: string;
  mimeType?: string;
  url?: string;
  size?: number;
};

function safeText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => safeText(value)).filter((value): value is string => Boolean(value))));
}

function uploadedPhotoSources(attachments: BuildAttachmentInput[]): SourceContext[] {
  return attachments.map((attachment, index) => ({
    type: "image",
    sourceId: attachment.id || `adrie-build-photo-${index + 1}`,
    name: attachment.name || `Adrie foto ${index + 1}`,
    mimeType: attachment.mimeType || "image/jpeg",
    facts: [],
    goldCandidates: [],
    doors: [],
    uncertainties: [],
    assets: [
      {
        kind: "image",
        name: attachment.name || `Adrie foto ${index + 1}`,
        url: attachment.url,
        origin: "uploaded",
        status: "source-only",
        evidence: "Door Adrie aangeleverde echte foto; via tijdelijke Blob-URL beschikbaar gemaakt voor de technische v0-overdracht.",
      },
    ],
  }));
}

function sourceAssets(sources: SourceContext[]): WebsiteAsset[] {
  return sources.flatMap((source, sourceIndex) => {
    const sourceLabel = source.url || source.name || `Bron ${sourceIndex + 1}`;
    const visualAssets: WebsiteAsset[] = (source.assets || []).map((asset, assetIndex) => ({
      name: asset.name || `Bronbeeld ${sourceIndex + 1}.${assetIndex + 1}`,
      kind: "image",
      source: asset.evidence || sourceLabel,
      url: asset.url,
      dataUrl: asset.dataUrl,
      purpose: "supporting",
      aiStatus: "real",
      role: asset.origin === "uploaded" ? "Door Adrie aangeleverd echt beeld" : "Beeld uit bestaande websitebron",
      origin: asset.origin === "uploaded" ? "customer" : "external",
      validationStatus: asset.origin === "uploaded" ? "approved" : "needs-owner-validation",
      productionInstruction:
        asset.origin === "uploaded"
          ? "Gebruik dit echte beeld alleen waar het de goedgekeurde Preview versterkt. De aangeleverde foto's zijn een bronpool, geen quota. Houd Adrie herkenbaar en crop hoofd/gezicht niet onbedoeld af. Fotografie/camera is persoonlijk en geen dienst. Gebruik een geloofwaardige crop van het echte beeld; reconstrueer geen losse handen, armen of andere lichaamsdelen met AI."
          : "Dit beeld komt uit de bestaande website en is bronmateriaal. Niet als productiebeeld gebruiken zonder expliciete validatie.",
    }));

    const sourceReference: WebsiteAsset = {
      name: `Bron ${sourceIndex + 1}`,
      kind: source.type === "website" ? "website" : source.type === "document" ? "document" : "other",
      source: JSON.stringify({
        type: source.type,
        url: source.url,
        name: source.name,
        title: source.title,
        facts: source.facts,
        goldCandidates: source.goldCandidates,
        uncertainties: source.uncertainties,
      }),
      origin: source.type === "website" ? "external" : "customer",
      validationStatus: "reference-only",
    };

    return [...visualAssets, sourceReference];
  });
}

function contactValue(candidates: SourceBackedCandidate[] | undefined, kind: "email" | "phone" | "link"): string | null {
  const values = (candidates || [])
    .map((item) => safeText((item as SourceBackedCandidate | undefined)?.value))
    .filter((value): value is string => Boolean(value));

  if (kind === "email") return values.find((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value)) || null;
  if (kind === "link") return values.find((value) => /linkedin\.com|instagram\.com|facebook\.com|https?:\/\//i.test(value)) || null;
  return values.find((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8 && !value.includes("@");
  }) || null;
}

function buildFacts(understanding: LumiveyUnderstanding): WebsiteFact[] {
  const sourceBacked = understanding.sourceBacked;
  const email = contactValue(sourceBacked?.contactDetails, "email");
  const phone = contactValue(sourceBacked?.contactDetails, "phone");
  const link = contactValue(sourceBacked?.contactDetails, "link");

  return [
    { key: "entrepreneur.name", value: safeText(understanding.entrepreneur?.name) || "Adrie Pouwer", status: "confirmed", source: "Discovery" },
    { key: "business.name", value: safeText(understanding.entrepreneur?.businessName) || "AssetPouwer", status: "confirmed", source: "Discovery" },
    { key: "contact.email", value: email, status: email ? "source-found" : "missing", source: email ? "website-source" : "not-found" },
    { key: "contact.phone", value: phone, status: phone ? "source-found" : "missing", source: phone ? "website-source" : "not-found" },
    { key: "contact.linkedin", value: link, status: link ? "source-found" : "missing", source: link ? "website-source" : "not-found" },
  ];
}

function sourceFactsAndGold(sources: SourceContext[]) {
  return {
    facts: unique(sources.flatMap((source) => (source.facts || []).map((fact) => fact.statement))),
    gold: unique(sources.flatMap((source) => (source.goldCandidates || []).map((item) => item.signal))),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const attachments: BuildAttachmentInput[] = Array.isArray(body?.attachments) ? body.attachments : [];
    const approvedPreview = body?.previewImpression as ArtistImpression | undefined;
    const evaluation = body?.evaluation;

    if (!approvedPreview?.imageDataUrl || !/^https?:\/\//i.test(approvedPreview.imageDataUrl)) {
      return NextResponse.json({ error: "Geen geldige opgeslagen URL voor de goedgekeurde Adrie Preview ontvangen." }, { status: 400 });
    }
    if (evaluation?.overall !== "PASS") {
      return NextResponse.json({ error: "Adrie Preview is niet als PASS goedgekeurd." }, { status: 409 });
    }
    if (attachments.length === 0 || attachments.some((attachment) => !attachment.url || !/^https?:\/\//i.test(attachment.url))) {
      return NextResponse.json({ error: "De opgeslagen URL's van de echte aangeleverde Adrie-foto's ontbreken in de v0-overdracht." }, { status: 400 });
    }

    // Discovery en brononderzoek zijn al afgerond. Gebruik exact dezelfde checkpoint-state
    // als de goedgekeurde Preview. De zware beelddata staat al in Blob storage en komt hier
    // alleen nog binnen als compacte URL-referentie.
    const understanding = ADRIE_CHECKPOINT_UNDERSTANDING;
    const photoSources = uploadedPhotoSources(attachments);
    const sources = [...ADRIE_REGRESSION_SOURCE_CONTEXTS, ...photoSources];
    const { facts: sourceFacts, gold: sourceGold } = sourceFactsAndGold(ADRIE_REGRESSION_SOURCE_CONTEXTS);

    const brief: WebsiteBrief = {
      version: 1,
      understanding,
      artistImpression: approvedPreview,
      facts: buildFacts(understanding),
      assets: sourceAssets(sources),
      pages: [
        { name: "Home", purpose: "De goedgekeurde Preview als primaire homepage-richting realiseren.", knownContent: unique([...(understanding.identity?.recognitionAnchors || []), ...(understanding.website?.usefulContent || [])]).slice(0, 8) },
        { name: "Over Adrie", purpose: "Persoon en senioriteit geloofwaardig verdiepen zonder CV-dump.", knownContent: unique(sourceFacts.filter((item) => /adrie|ervaring|diploma|tu delft|lloyd|nedtrain|institute|iam/i.test(item))).slice(0, 10) },
        { name: "Expertise & werkvelden", purpose: "Strategisch assetmanagement, techniek, industrie en infrastructuur helder maken.", knownContent: unique([...(understanding.business?.services || []), ...sourceGold]).slice(0, 12) },
        { name: "Praktijk & werkwijze", purpose: "De brug strategie-operatie, uitvoerbaarheid en het change-voorbeeld zichtbaar maken.", knownContent: unique([...(understanding.identity?.craftsmanship || []), ...(understanding.identity?.story || []), ...understanding.facts]).slice(0, 12) },
        { name: "Kennis", purpose: "Relevante artikelen, vakcontext en bewezen inhoud benutten zonder de oude site te kopiëren.", knownContent: unique(sourceFacts.filter((item) => /artikel|publicat|iso|nen|iam|kennis|magazine|certific/i.test(item))).slice(0, 12) },
        { name: "Contact", purpose: "Persoonlijke kennismaking laagdrempelig maken met alleen geverifieerde contactdata.", knownContent: (understanding.sourceBacked?.contactDetails || []).map((item) => safeText((item as SourceBackedCandidate | undefined)?.value)).filter((value): value is string => Boolean(value)).slice(0, 8) },
      ],
      functionalRequirements: [
        "Responsive desktop en mobiel",
        "Duidelijke contactmogelijkheid",
        "Navigatie naar inhoudelijke secties/pagina's",
        "Echte door Adrie aangeleverde beelden gebruiken waar ze de goedgekeurde Preview versterken",
      ],
      constraints: [
        "De goedgekeurde Preview is design authority. Benader de compositie, sfeer, hiërarchie en emotionele richting zo dicht mogelijk.",
        "Behoud de mix van rustige Adrie en technische geloofwaardigheid; maak er geen generieke consultantsite van.",
        "Gebruik bronrijkdom uit de bestaande site selectief: relevante professionele goudklompjes mogen niet verdwijnen, maar de oude site is geen ontwerpblauwdruk.",
        "Fotografie/camera is een persoonlijk herkenningsanker, geen dienst. Laat dit motief niet domineren; normaal maximaal één betekenisvol homepage-moment.",
        "Aangeleverde foto's zijn een bronpool, geen quota. Gebruik niet automatisch alle beelden.",
        "Echte Adrie-foto's gaan vóór AI-vervangers. Verander zijn gezicht niet en crop hoofd/gezicht niet onbedoeld af.",
        "Geen zwevende handen, armen of andere losse lichaamsdelen. Als een aangeleverde echte foto de gewenste scène bevat, crop die foto geloofwaardig in plaats van menselijke anatomie met AI te reconstrueren.",
        "Gebruik alleen geverifieerde contactgegevens. Als e-mail niet betrouwbaar uit de bron komt, laat die weg in plaats van te verzinnen.",
        "Het bestaande AssetPouwer-logo/woordmerk is een merkasset en mag niet stilzwijgend worden vervangen door een nieuw verzonnen logo. Als het logo nog niet als productieasset beschikbaar is, behoud ruimte en identiteit zonder een fictief alternatief te ontwerpen.",
        "Het change-voorbeeld moet herkenbaar maken dat impact op mensen en budgetten zichtbaar werd en dat fasering over meerdere jaren mogelijk werd.",
        "Vermijd mechanisch donker/licht/donker/licht stapelen wanneer een natuurlijker ritme de Preview beter benadert.",
      ],
      unknowns: [],
    };

    const readiness = checkBuildReadiness(brief);
    if (!readiness.ready) {
      return NextResponse.json({ error: "Adrie Website Brief is nog niet build-ready.", blockers: readiness.blockers, brief }, { status: 409 });
    }

    const build = await createV0Build(brief);
    return NextResponse.json({
      build,
      brief,
      sourceSummary: {
        crawlMode: "checkpoint-reuse",
        assetTransport: "blob-url",
        pageCount: ADRIE_REGRESSION_SOURCE_CONTEXTS.length,
        websiteFacts: sourceFacts.length,
        goldCandidates: sourceGold.length,
        uploadedRealImages: attachments.length,
      },
    });
  } catch (error) {
    console.error("Adrie v0 handoff error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Adrie Website Brief → v0 kon niet worden uitgevoerd." },
      { status: 500 }
    );
  }
}
