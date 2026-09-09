import OpenAI from "openai";
import { SourceContext } from "@/lib/lumivey/source-context";
import { WebsiteResearchResult } from "@/lib/lumivey/research-website";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_SOURCE_CHARS = 24000;

type ParsedFact = {
  statement: string;
  evidence?: string;
};

type ParsedGoldCandidate = {
  signal: string;
  reason: string;
};

type ParsedDoor = {
  signal: string;
  whyWorthExploring: string;
};

export async function analyzeWebsiteSource(
  research: WebsiteResearchResult
): Promise<SourceContext> {
  const sourceText = research.markdown.slice(0, MAX_SOURCE_CHARS);
  const brandingText = research.branding
    ? JSON.stringify(research.branding, null, 2)
    : "geen branding-data";
  const imageList = research.images.slice(0, 20).join("\n");

  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: `
Je analyseert een bestaande bedrijfswebsite als interne bron voor Lumivey Discovery.

BELANGRIJK
- De website is een bron, geen waarheid.
- Verzin niets.
- Trek geen persoonlijke conclusies die niet letterlijk of duidelijk uit de bron volgen.
- Een feit uit de website blijft een BRONFEIT totdat de ondernemer het bevestigt.
- Zoek niet naar administratieve volledigheid.
- Zoek vooral naar informatie die kan helpen om een preview te maken waarin de ondernemer zichzelf herkent.

HERKEN VIER DINGEN

1. BRONFEITEN
Concrete zaken die werkelijk in de bron staan, bijvoorbeeld:
- bedrijfsnaam;
- genoemde personen;
- diensten;
- plaats of werkgebied;
- geschiedenis;
- projecten;
- jaartallen;
- specialisaties;
- slogans;
- logo-, kleur- of beeldsignalen wanneer de brondata die daadwerkelijk bevat.

2. MOGELIJKE GOUDKLOMPJES
Bestaande signalen die onderscheidend, persoonlijk, betekenisvol of herkenbaar kunnen zijn.
Noem alleen waarom het mogelijk interessant is; verzin het verhaal erachter niet.

3. MOGELIJKE DEUREN
Feiten of signalen waar mogelijk een betekenisvol verhaal achter zit en waar Discovery één laag dieper op zou kunnen vragen.
Beschrijf het signaal en waarom doorvragen waarde kan hebben.

4. ONZEKERHEDEN
Dingen die verouderd, onduidelijk, dubbelzinnig of niet betrouwbaar genoeg lijken.

Geef uitsluitend geldige JSON terug.
Geen markdown.
Geen uitleg buiten JSON.
    `,
    input: `
BRON-URL
${research.url}

BRONTITEL
${research.title || "onbekend"}

WEBSITE-INHOUD
${sourceText}

BRANDING-DATA
${brandingText}

AFBEELDINGS-URLS
${imageList || "geen"}

Geef exact dit JSON-formaat terug:

{
  "facts": [
    {
      "statement": "",
      "evidence": ""
    }
  ],
  "goldCandidates": [
    {
      "signal": "",
      "reason": ""
    }
  ],
  "doors": [
    {
      "signal": "",
      "whyWorthExploring": ""
    }
  ],
  "uncertainties": []
}

Houd het compact en relevant voor Discovery en preview.
    `,
  });

  const parsed: unknown = JSON.parse(response.output_text);
  const parsedObject =
    typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};

  const rawFacts = Array.isArray(parsedObject.facts)
    ? parsedObject.facts
    : [];

  const facts = rawFacts
    .filter((item: unknown): item is ParsedFact => {
      return (
        typeof item === "object" &&
        item !== null &&
        typeof (item as { statement?: unknown }).statement === "string"
      );
    })
    .map((item: ParsedFact) => ({
      statement: item.statement,
      evidence:
        typeof item.evidence === "string"
          ? item.evidence
          : undefined,
      status: "source-only" as const,
    }));

  const rawGoldCandidates = Array.isArray(
    parsedObject.goldCandidates
  )
    ? parsedObject.goldCandidates
    : [];

  const goldCandidates = rawGoldCandidates.filter(
    (item: unknown): item is ParsedGoldCandidate =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as { signal?: unknown }).signal === "string" &&
      typeof (item as { reason?: unknown }).reason === "string"
  );

  const rawDoors = Array.isArray(parsedObject.doors)
    ? parsedObject.doors
    : [];

  const doors = rawDoors.filter(
    (item: unknown): item is ParsedDoor =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as { signal?: unknown }).signal === "string" &&
      typeof (
        item as { whyWorthExploring?: unknown }
      ).whyWorthExploring === "string"
  );

  const rawUncertainties = Array.isArray(
    parsedObject.uncertainties
  )
    ? parsedObject.uncertainties
    : [];

  const uncertainties = rawUncertainties.filter(
    (item: unknown): item is string => typeof item === "string"
  );

  return {
    type: "website",
    url: research.url,
    title: research.title,
    facts,
    goldCandidates,
    doors,
    uncertainties,
  };
}
