import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";

export type PreviewContext = {
  confirmed: {
    entrepreneur: LumiveyUnderstanding["entrepreneur"];
    identity: LumiveyUnderstanding["identity"];
    business: LumiveyUnderstanding["business"];
    website: LumiveyUnderstanding["website"];
    facts: string[];
  };
  sourceBacked: LumiveyUnderstanding["sourceBacked"];
  interpretations: string[];
  unknowns: string[];
};

export function createPreviewContext(
  understanding: LumiveyUnderstanding
): PreviewContext {
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

INTERPRETATIES — GEEN FEITEN
${JSON.stringify(context.interpretations, null, 2)}

ONBEKEND / NOG TE BEVESTIGEN
${JSON.stringify(context.unknowns, null, 2)}
  `.trim();
}
