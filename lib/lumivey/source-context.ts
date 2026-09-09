export type SourceFact = {
  statement: string;
  evidence?: string;
  status: "source-only";
};

export type SourceGoldCandidate = {
  signal: string;
  reason: string;
};

export type SourceDoor = {
  signal: string;
  supportingFact: string;
  evidence: string;
  whyWorthExploring: string;
};

export type DiscoveredUrl = {
  url: string;
  evidence: string;
  confidence: "high";
};

export type SourceContext = {
  type: "website" | "image" | "document";
  sourceId?: string;
  url?: string;
  name?: string;
  mimeType?: string;
  title?: string;
  facts: SourceFact[];
  goldCandidates: SourceGoldCandidate[];
  doors: SourceDoor[];
  uncertainties: string[];
  discoveredUrls?: DiscoveredUrl[];
};

export type UploadedSourceInput = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  size: number;
};

const URL_PATTERN = /https?:\/\/[^\s)\]}>"']+/gi;

export function extractUrlsFromText(text: string): string[] {
  const matches = text.match(URL_PATTERN) ?? [];

  return Array.from(
    new Set(matches.map((url) => url.replace(/[.,;!?]+$/, "")))
  );
}

export function normalizeDiscoveredUrl(value: string): string | null {
  const trimmed = value.trim().replace(/[.,;!?]+$/, "");

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);

    if (!parsed.hostname.includes(".")) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function formatSourceContextsForPrompt(
  sourceContexts: SourceContext[]
): string {
  if (sourceContexts.length === 0) {
    return "Er is nog geen externe broncontext.";
  }

  return sourceContexts
    .map((source, index) => {
      const facts = source.facts
        .map((fact) => {
          const evidence = fact.evidence
            ? ` | bewijs: ${fact.evidence}`
            : "";

          return `- ${fact.statement}${evidence}`;
        })
        .join("\n");

      const gold = source.goldCandidates
        .map((item) => `- ${item.signal} — ${item.reason}`)
        .join("\n");

      const doors = source.doors
        .map(
          (door) =>
            `- ${door.signal}\n  steunfeit: ${door.supportingFact}\n  bewijs: ${door.evidence}\n  waarom interessant: ${door.whyWorthExploring}`
        )
        .join("\n");

      const uncertainties = source.uncertainties
        .map((item) => `- ${item}`)
        .join("\n");

      const discoveredUrls = (source.discoveredUrls ?? [])
        .map(
          (item) =>
            `- ${item.url} | bewijs: ${item.evidence} | betrouwbaarheid: ${item.confidence}`
        )
        .join("\n");

      const identity = source.url
        ? `URL: ${source.url}`
        : `Bestand: ${source.name || "onbekend"}`;

      return `
BRON ${index + 1}
Type: ${source.type}
${identity}
${source.mimeType ? `Bestandstype: ${source.mimeType}` : ""}
Titel: ${source.title || "onbekend"}

BRONFEITEN — nog niet bevestigd door de ondernemer
${facts || "- geen"}

MOGELIJKE GOUDKLOMPJES
${gold || "- geen"}

MOGELIJKE DEUREN — alleen gebruiken als steunfeit en bewijs werkelijk uit de bron komen
${doors || "- geen"}

DUIDELIJK LEESBARE WEBSITE-URLS IN DEZE BRON
${discoveredUrls || "- geen"}

ONZEKERHEDEN
${uncertainties || "- geen"}
      `.trim();
    })
    .join("\n\n");
}
