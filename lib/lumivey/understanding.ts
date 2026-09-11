import { SourceContext } from "@/lib/lumivey/source-context";

export type SourceBackedCandidate = {
  value: string;
  evidence: string;
  sourceLabel?: string;
  status: "source-backed-unconfirmed";
};

export type HumanSignal = {
  signal: string;
  evidence: string;
  confidence: "medium" | "high";
  previewRelevance: "medium" | "high";
};

export type LumiveyUnderstanding = {
  entrepreneur: {
    name?: string;
    businessName?: string;
    profession?: string;
    location?: string;
  };

  identity: {
    motivation?: string[];
    craftsmanship?: string[];
    pride?: string[];
    story?: string[];
    recognitionAnchors?: string[];
  };

  humanSignals: HumanSignal[];

  business: {
    services?: string[];
    audience?: string[];
    existingWebsite?: string;
    importantNeeds?: string[];
  };

  website: {
    purpose?: string[];
    desiredFeeling?: string[];
    usefulContent?: string[];
  };

  sourceBacked: {
    businessNames: SourceBackedCandidate[];
    professions: SourceBackedCandidate[];
    locations: SourceBackedCandidate[];
    services: SourceBackedCandidate[];
    contactDetails: SourceBackedCandidate[];
    visualAnchors: SourceBackedCandidate[];
  };

  facts: string[];
  interpretations: string[];
  unknowns: string[];
  sources?: SourceContext[];
};

export const EMPTY_UNDERSTANDING: LumiveyUnderstanding = {
  entrepreneur: {},
  identity: {},
  humanSignals: [],
  business: {},
  website: {},
  sourceBacked: {
    businessNames: [],
    professions: [],
    locations: [],
    services: [],
    contactDetails: [],
    visualAnchors: [],
  },
  facts: [],
  interpretations: [],
  unknowns: [],
  sources: [],
};
