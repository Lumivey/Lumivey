import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";

export type PreviewAsset = {
  sourceId: string;
  name: string;
  kind: "uploaded-image";
};

export type PreviewContext = {
  confirmed: {
    entrepreneur: LumiveyUnderstanding["entrepreneur"];
    identity: LumiveyUnderstanding["identity"];
    business: LumiveyUnderstanding["business"];
    website: LumiveyUnderstanding["website"];
    facts: string[];
  };
  sourceBacked: LumiveyUnderstanding["sourceBacked"];
  availableAssets: PreviewAsset[];
  interpretations: string[];
  unknowns: string[];
};

export function createPreviewContext(
  understanding: LumiveyUnderstanding
): PreviewContext {
  const availableAssets: PreviewAsset[] = (understanding.sources ?? [])
    .filter(
      (source) =>
        source.type === "image" &&
        typeof source.sourceId === "string" &&
        source.sourceId.length > 0
    )
    .map((source) => ({
      sourceId: source.sourceId as string,
      name: source.name || source.title || "Aangeleverde afbeelding",
      kind: "uploaded-image" as const,
    }));

  return {
    confirmed: {
      entrepreneur: understanding.entrepreneur ?? {},
      identity: understanding.identity ?? {},
      business: understanding.business ?? {},
      website: understanding.website ?? {},
      facts: understanding.facts ?? [],
    },
    sourceBacked: understanding.sourceBacked ?? {
      businessNames: [],
      professions: [],
      locations: [],
      services: [],
      contactDetails: [],
      visualAnchors: [],
    },
    availableAssets,
    interpretations: understanding.interpretations ?? [],
    unknowns: understanding.unknowns ?? [],
  };
}

export function formatPreviewContext(
  understanding: LumiveyUnderstanding
): string {
  const context = createPreviewContext(understanding);

  return `
BEVESTIGD DOOR DE ONDERNEMER
${JSON.stringify(context.confirmed, null, 2)}

BRON-GESTEUND MAAR NOG NIET BEVESTIGD
${JSON.stringify(context.sourceBacked, null, 2)}

BESCHIKBARE EIGEN BEELDASSETS
${JSON.stringify(context.availableAssets, null, 2)}

INTERPRETATIES — GEEN FEITEN
${JSON.stringify(context.interpretations, null, 2)}

ONBEKEND / NOG TE BEVESTIGEN
${JSON.stringify(context.unknowns, null, 2)}
  `.trim();
}
