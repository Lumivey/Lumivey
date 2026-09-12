import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";

export type ArtistImpression = {
  id: string;
  imageDataUrl: string;
  headline: string;
  rationale: string[];
  createdAt: string;
};

export type FactStatus = "confirmed" | "source-found" | "derived" | "uncertain" | "missing";

export type WebsiteFact = {
  key: string;
  value: string | null;
  status: FactStatus;
  source?: string;
};

export type WebsiteAsset = {
  name: string;
  kind: "image" | "document" | "website" | "social" | "other";
  source?: string;
  url?: string;
  dataUrl?: string;
  purpose?: "primary" | "supporting" | "reference";
  aiStatus?: "real" | "ai-enhanced-real" | "artist-interpretation" | "unknown";
  role?: string;
  origin?: "customer" | "preview-derived" | "generated" | "external" | "unknown";
  validationStatus?: "approved" | "needs-owner-validation" | "replace-with-real-if-available" | "reference-only";
  productionInstruction?: string;
};

export type WebsiteBrief = {
  version: 1;
  understanding: LumiveyUnderstanding;
  artistImpression: ArtistImpression;
  facts: WebsiteFact[];
  assets: WebsiteAsset[];
  pages: Array<{
    name: string;
    purpose: string;
    knownContent: string[];
  }>;
  functionalRequirements: string[];
  constraints: string[];
  unknowns: string[];
};

export type BuildReadinessResult = {
  ready: boolean;
  blockers: string[];
};

export function checkBuildReadiness(brief: WebsiteBrief): BuildReadinessResult {
  const blockers: string[] = [];

  if (!brief.artistImpression?.imageDataUrl) {
    blockers.push("Geen goedgekeurde artist impression beschikbaar.");
  }

  if (brief.pages.length === 0) {
    blockers.push("Er zijn nog geen pagina's voor de website bepaald.");
  }

  const criticalUnknowns = brief.unknowns.filter(Boolean);
  if (criticalUnknowns.length > 0) {
    blockers.push(...criticalUnknowns.map((item) => `Nog te verifiëren: ${item}`));
  }

  return { ready: blockers.length === 0, blockers };
}
