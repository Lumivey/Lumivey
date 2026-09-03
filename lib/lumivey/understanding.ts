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

  facts: string[];
  interpretations: string[];
  unknowns: string[];
};

export const EMPTY_UNDERSTANDING: LumiveyUnderstanding = {
  entrepreneur: {},
  identity: {},
  business: {},
  website: {},
  facts: [],
  interpretations: [],
  unknowns: [],
};