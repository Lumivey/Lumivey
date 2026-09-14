import { NextResponse } from "next/server";
import { researchWebsite } from "@/lib/lumivey/research-website";
import { analyzeWebsiteSource } from "@/lib/lumivey/analyze-website-source";
import { extractUnderstanding } from "@/lib/lumivey/extract-understanding";
import { SourceContext, UploadedSourceInput } from "@/lib/lumivey/source-context";
import { ArtistImpression, WebsiteAsset, WebsiteBrief, WebsiteFact, checkBuildReadiness } from "@/lib/lumivey/primary-flow";
import { createV0Build } from "@/lib/lumivey/v0-adapter";
import { LumiveyUnderstanding, SourceBackedCandidate } from "@/lib/lumivey/understanding";

export const maxDuration = 300;

const TARGET_URL = "https://www.assetpouwer.nl";

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function uploadedPhotoSources(attachments: UploadedSourceInput[]): SourceContext[] {
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
        dataUrl: attachment.dataUrl,
        origin: "uploaded",
        status: "source-only",
        evidence: "Door Adrie aangeleverde echte foto; opnieuw gecomprimeerd voor de technische v0-overdracht.",
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
  const values = (candidates || []).map((item) => item.value?.trim()).filter(Boolean) as string[];
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
    { key: "entrepreneur.name", value: understanding.entrepreneur?.name || "Adrie Pouwer", status: "confirmed", source: "Discovery" },
    { key: "business.name", value: understanding.entrepreneur?.businessName || "AssetPouwer", status: "confirmed", source: "Discovery" },
    { key: "contact.email", value: email, status: email ? "source-found" : "missing", source: email ? "website-source" : "not-found" },
    { key: "contact.phone", value: phone, status: phone ? "source-found" : "missing", source: phone ? "website-source" : "not-found" },
    { key: "contact.linkedin", value: link, status: link ? "source-found" : "missing", source: link ? "website-source" : "not-found" },
  ];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const replay = Array.isArray(body?.replay) ? body.replay : [];
    const attachments: UploadedSourceInput[] = Array.isArray(body?.attachments) ? body.attachments : [];
    const approvedPreview = body?.previewImpression as ArtistImpression | undefined;
    const evaluation = body?.evaluation;

    if (!approvedPreview?.imageDataUrl) {
      return NextResponse.json({ error: "Geen goedgekeurde Adrie Preview ontvangen." }, { status: 400 });
    }
    if (evaluation?.overall !== "PASS") {
      return NextResponse.json({ error: "Adrie Preview is niet als PASS goedgekeurd." }, { status: 409 });
    }
    if (attachments.length === 0) {
      return NextResponse.json({ error: "De echte aangeleverde Adrie-foto's ontbreken in de v0-overdracht." }, { status: 400 });
    }

    // Re-crawl at build time so the Website Brief uses the repaired, richer source layer.
    // The browser intentionally sends only compact image attachments; the full previous
    // SourceContext/Understanding is not posted again because that made the serverless
    // request exceed the platform payload limit.
    const research = await researchWebsite(TARGET_URL);
    const websiteContext = await analyzeWebsiteSource(research);
    const photoSources = uploadedPhotoSources(attachments);
    const sources = [websiteContext, ...photoSources];

    const messages = replay.flatMap((turn: any) => [
      { role: "user" as const, content: String(turn?.user || "") },
      { role: "assistant" as const, content: String(turn?.assistant || "") },
    ]);
    messages.push({
      role: "user" as const,
      content: "De aangeleverde foto's zijn echte foto's van mij en vormen een bronpool. Kies alleen wat echt nodig is. Fotografie is persoonlijk en geen dienst. Gebruik echte foto's geloofwaardig: geen losse of gegenereerde lichaamsdelen wanneer de bronfoto goed te croppen is.",
    });

    const understanding = await extractUnderstanding(messages, sources);
    const sourceFacts = websiteContext.facts.map((fact) => fact.statement);
    const sourceGold = websiteContext.goldCandidates.map((item) => item.signal);

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
        { name: "Contact", purpose: "Persoonlijke kennismaking laagdrempelig maken met alleen geverifieerde contactdata.", knownContent: understanding.sourceBacked?.contactDetails?.map((item) => item.value).slice(0, 8) || [] },
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
        crawlMode: research.mode,
        pageCount: research.pages?.length || 0,
        websiteFacts: websiteContext.facts.length,
        goldCandidates: websiteContext.goldCandidates.length,
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
