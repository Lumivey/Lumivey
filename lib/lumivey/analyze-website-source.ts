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
  supportingFact: string;
  evidence: string;
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

ABSOLUTE BRONREGEL
- De website is een bron, geen waarheid.
- Verzin niets.
- Generaliseer niet buiten wat letterlijk of ondubbelzinnig in de bron staat.
- Leid GEEN sector, markt, specialisatie, doelgroep of persoonlijke betekenis af uit een algemeen begrip.
- Voorbeeld: uit het woord "assets" mag je NIET vastgoed, industrie, infra of een andere sector afleiden tenzij die sector letterlijk of ondubbelzinnig in de bron staat.
- Een feit uit de website blijft een BRONFEIT totdat de ondernemer het bevestigt.
- Iedere mogelijke deur moet terug te voeren zijn op een concreet steunfeit EN een letterlijk of vrijwel letterlijk bewijsfragment uit de bron.
- Als je geen concreet bewijs kunt aanwijzen, maak die deur dan niet.

Zoek niet naar administratieve volledigheid.
Zoek vooral naar informatie die kan helpen om een preview te maken waarin de ondernemer zichzelf herkent.

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
Alleen feiten of signalen waar mogelijk een betekenisvol verhaal achter zit en waar Discovery één laag dieper op zou kunnen vragen.
Voor iedere deur moet je opnemen:
- het signaal;
- het concrete steunfeit;
- een letterlijk of vrijwel letterlijk bewijsfragment uit de bron;
- waarom doorvragen waarde kan hebben.

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
      "supportingFact": "",
      "evidence": "",
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
      typeof (item as { supportingFact?: unknown }).supportingFact ===
        "string" &&
      typeof (item as { evidence?: unknown }).evidence === "string" &&
      typeof (
        item as { whyWorthExploring?: unknown }
      ).whyWorthExploring === "string" &&
      (item as { supportingFact: string }).supportingFact.trim().length > 0 &&
      (item as { evidence: string }).evidence.trim().length > 0
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
