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
  whyWorthExploring: string;
};

export type SourceContext = {
  type: "website";
  url: string;
  title?: string;
  facts: SourceFact[];
  goldCandidates: SourceGoldCandidate[];
  doors: SourceDoor[];
  uncertainties: string[];
};

const URL_PATTERN = /https?:\/\/[^\s)\]}>"']+/gi;

export function extractUrlsFromText(text: string): string[] {
  const matches = text.match(URL_PATTERN) ?? [];

  return Array.from(
    new Set(matches.map((url) => url.replace(/[.,;!?]+$/, "")))
  );
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
        .map((fact) => `- ${fact.statement}`)
        .join("\n");

      const gold = source.goldCandidates
        .map((item) => `- ${item.signal} — ${item.reason}`)
        .join("\n");

      const doors = source.doors
        .map((door) => `- ${door.signal} — ${door.whyWorthExploring}`)
        .join("\n");

      const uncertainties = source.uncertainties
        .map((item) => `- ${item}`)
        .join("\n");

      return `
BRON ${index + 1}
Type: ${source.type}
URL: ${source.url}
Titel: ${source.title || "onbekend"}

BRONFEITEN — nog niet bevestigd door de ondernemer
${facts || "- geen"}

MOGELIJKE GOUDKLompjes
${gold || "- geen"}

MOGELIJKE DEUREN
${doors || "- geen"}

ONZEKERHEDEN
${uncertainties || "- geen"}
      `.trim();
    })
    .join("\n\n");
}
