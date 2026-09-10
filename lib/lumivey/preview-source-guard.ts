import OpenAI from "openai";
import type { LumiveyUnderstanding } from "@/lib/lumivey/understanding";
import type { PreviewComposition, PreviewVisual } from "@/lib/lumivey/preview-composition";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Placement = {
  sourceId: string;
  target: "hero" | "section";
  sectionIndex?: number;
  crop?: PreviewVisual["crop"];
  purpose?: string;
};

function imageSources(understanding: LumiveyUnderstanding) {
  return (understanding.sources ?? []).filter(
    (source) => source.type === "image" && typeof source.sourceId === "string" && source.sourceId.length > 0
  );
}

function usedSourceIds(composition: PreviewComposition): Set<string> {
  const used = new Set<string>();
  if (composition.hero.sourceAssetId) used.add(composition.hero.sourceAssetId);
  for (const visual of composition.hero.visuals ?? []) {
    if (visual.kind === "source" && visual.sourceAssetId) used.add(visual.sourceAssetId);
  }
  for (const section of composition.sections) {
    if (section.sourceAssetId) used.add(section.sourceAssetId);
    for (const visual of section.visuals ?? []) {
      if (visual.kind === "source" && visual.sourceAssetId) used.add(visual.sourceAssetId);
    }
  }
  return used;
}

function parsePlacements(value: unknown, validIds: Set<string>, sectionCount: number): Placement[] {
  if (!Array.isArray(value)) return [];
  const crops: PreviewVisual["crop"][] = ["portrait", "landscape", "square", "wide", "detail"];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const sourceId = typeof row.sourceId === "string" ? row.sourceId : "";
    if (!validIds.has(sourceId)) return [];
    const target = row.target === "hero" ? "hero" : row.target === "section" ? "section" : null;
    if (!target) return [];
    const sectionIndex = Number.isInteger(row.sectionIndex) ? Number(row.sectionIndex) : undefined;
    if (target === "section" && (sectionIndex === undefined || sectionIndex < 0 || sectionIndex >= sectionCount)) return [];
    const crop = crops.includes(row.crop as PreviewVisual["crop"]) ? row.crop as PreviewVisual["crop"] : "landscape";
    return [{
      sourceId,
      target,
      sectionIndex,
      crop,
      purpose: typeof row.purpose === "string" ? row.purpose : "eigen bronbeeld",
    } satisfies Placement];
  });
}

export async function ensureSourceAssetsInPreview(
  understanding: LumiveyUnderstanding,
  composition: PreviewComposition
): Promise<PreviewComposition> {
  const sources = imageSources(understanding);
  if (sources.length === 0) return composition;

  const used = usedSourceIds(composition);
  const unused = sources.filter((source) => !used.has(source.sourceId as string));
  if (unused.length === 0) return composition;

  try {
    const sourceSummary = unused.map((source) => ({
      sourceId: source.sourceId,
      name: source.name || source.title || "Aangeleverde foto",
      facts: source.facts ?? [],
      goldCandidates: source.goldCandidates ?? [],
      uncertainties: source.uncertainties ?? [],
    }));

    const sectionSummary = composition.sections.map((section, index) => ({
      index,
      type: section.type,
      title: section.title,
      layout: section.layout,
      visualCount: section.visuals?.length ?? 0,
    }));

    const response = await openai.responses.create({
      model: "gpt-5.6-terra",
      instructions: `
Je bewaakt Lumiveys principe: ECHT VOOR GEGENEREERD.

Er zijn door de ondernemer zelf aangeleverde foto's die de eerste composer nog niet gebruikt heeft. Plaats bruikbare echte foto's alsnog op de homepage wanneer zij herkenning, mens, team, echte werkplek, echt werk of locatie toevoegen.

HARD:
- een eigen foto van de ondernemer, team, echte salon/werkplaats of echt werk hoort normaal WEL in de preview;
- sla een bron alleen over als hij inhoudelijk misleidend, duidelijk verouderd of onbruikbaar is;
- verander geen tekst, layout, kleuren of feiten;
- vervang niets inhoudelijks: voeg het bronbeeld toe aan de meest logische bestaande visual collection;
- bij foto's met mensen of een team: kies landscape/wide zodat de oorspronkelijke groepscompositie zo veel mogelijk intact blijft;
- vermijd portrait/detail crops voor groepsfoto's;
- bronfoto's mogen nooit door een gegenereerd mensbeeld worden vervangen.

Geef uitsluitend JSON terug: een array placements. Geen uitleg.
`,
      input: `
ONGEBRUIKTE EIGEN FOTO'S:
${JSON.stringify(sourceSummary, null, 2)}

HUIDIGE HERO:
${JSON.stringify({ title: composition.hero.title, layout: composition.hero.layout, visualCount: composition.hero.visuals?.length ?? 0 }, null, 2)}

SECTIES:
${JSON.stringify(sectionSummary, null, 2)}

JSON-formaat:
[
  {
    "sourceId": "exact-bestaand-sourceId",
    "target": "hero|section",
    "sectionIndex": 0,
    "crop": "landscape|wide|portrait|square|detail",
    "purpose": "waarom dit echte beeld hier thuishoort"
  }
]

Laat een echt bronbeeld alleen weg als de broninformatie duidelijk zegt dat het misleidend/verouderd/onbruikbaar is.
`
    });

    const validIds = new Set(unused.map((source) => source.sourceId as string));
    const placements = parsePlacements(JSON.parse(response.output_text), validIds, composition.sections.length);
    if (placements.length === 0) return composition;

    let heroVisuals = [...(composition.hero.visuals ?? [])];
    const sections = composition.sections.map((section) => ({
      ...section,
      visuals: [...(section.visuals ?? [])],
    }));

    for (const placement of placements) {
      const visual: PreviewVisual = {
        id: `source-${placement.sourceId}`,
        kind: "source",
        sourceAssetId: placement.sourceId,
        purpose: placement.purpose || "eigen bronbeeld",
        subject: "",
        setting: "",
        composition: "behoud de oorspronkelijke menselijke compositie",
        atmosphere: "echt en herkenbaar",
        avoid: ["gezichten of belangrijke personen afsnijden", "bronbeeld vervangen door fictieve mensen"],
        crop: placement.crop ?? "landscape",
      };

      if (placement.target === "hero") {
        heroVisuals = [visual, ...heroVisuals.filter((item) => item.sourceAssetId !== placement.sourceId)];
      } else if (placement.sectionIndex !== undefined) {
        const section = sections[placement.sectionIndex];
        section.visuals = [visual, ...(section.visuals ?? []).filter((item) => item.sourceAssetId !== placement.sourceId)];
      }
    }

    return {
      ...composition,
      hero: { ...composition.hero, visuals: heroVisuals },
      sections,
    };
  } catch (error) {
    console.error("Source asset guard failed; using composition unchanged:", error);
    return composition;
  }
}
