import OpenAI from "openai";
import { SourceContext, SourceFact } from "@/lib/lumivey/source-context";
import { WebsiteResearchResult } from "@/lib/lumivey/research-website";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_SOURCE_CHARS = 48000;

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

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildPrioritizedSourceText(research: WebsiteResearchResult): string {
  const pages = research.pages ?? [];
  if (!pages.length) return research.markdown.slice(0, MAX_SOURCE_CHARS);

  const priorityPattern = /(contact|over[-_/ ]?ons|over[-_/ ]?mij|about|team|wie[-_/ ]?zijn|dienst|service|expert|project)/i;
  const ranked = pages
    .map((page, index) => ({
      page,
      index,
      priority: priorityPattern.test(`${page.url} ${page.title || ""}`) ? 1 : 0,
    }))
    .sort((a, b) => b.priority - a.priority || a.index - b.index);

  return ranked
    .map(({ page }, index) => `\n\n===== BRONPAGINA ${index + 1}: ${page.title || page.url} =====\nURL: ${page.url}\n\n${page.markdown}`)
    .join("")
    .slice(0, MAX_SOURCE_CHARS);
}

function extractDeterministicContactFacts(research: WebsiteResearchResult): SourceFact[] {
  const text = research.markdown;
  const facts: SourceFact[] = [];

  const emails = uniqueStrings(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []);
  for (const email of emails.slice(0, 10)) {
    facts.push({
      statement: `Contact e-mail: ${email}`,
      evidence: email,
      status: "source-only",
    });
  }

  const rawPhones = text.match(/(?:\+31|0)[0-9() .-]{8,20}[0-9]/g) ?? [];
  const phones = uniqueStrings(
    rawPhones.filter((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 9 && digits.length <= 14;
    })
  );
  for (const phone of phones.slice(0, 10)) {
    facts.push({
      statement: `Contact telefoon: ${phone}`,
      evidence: phone,
      status: "source-only",
    });
  }

  const contactLinks = uniqueStrings(
    research.links.filter((link) => /linkedin\.com|instagram\.com|facebook\.com|mailto:|tel:/i.test(link))
  );
  for (const link of contactLinks.slice(0, 12)) {
    facts.push({
      statement: `Contact/link: ${link}`,
      evidence: link,
      status: "source-only",
    });
  }

  return facts;
}

export async function analyzeWebsiteSource(
  research: WebsiteResearchResult
): Promise<SourceContext> {
  const sourceText = buildPrioritizedSourceText(research);
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

  const aiFacts = rawFacts
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

  const deterministicContactFacts = extractDeterministicContactFacts(research);
  const facts = Array.from(
    new Map(
      [...deterministicContactFacts, ...aiFacts].map((fact) => [
        `${fact.statement.toLowerCase()}|${fact.evidence || ""}`,
        fact,
      ])
    ).values()
  );

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

  const assets = uniqueStrings(research.images)
    .slice(0, 20)
    .map((url) => ({
      kind: "image" as const,
      url,
      origin: "website" as const,
      status: "source-only" as const,
      evidence: `Afbeeldings-URL gevonden door Firecrawl vanaf ${research.url}`,
    }));

  return {
    type: "website",
    url: research.url,
    title: research.title,
    facts,
    goldCandidates,
    doors,
    uncertainties,
    assets,
  };
}
