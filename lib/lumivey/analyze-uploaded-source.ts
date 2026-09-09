import OpenAI from "openai";
import {
  SourceContext,
  UploadedSourceInput,
} from "@/lib/lumivey/source-context";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

type ParsedAnalysis = {
  facts?: unknown;
  goldCandidates?: unknown;
  doors?: unknown;
  uncertainties?: unknown;
};

function buildInstructions(sourceType: "image" | "document") {
  return `
Je analyseert een door de ondernemer aangeleverde ${
    sourceType === "image" ? "afbeelding" : "document"
  } als interne bron voor Lumivey Discovery.

ABSOLUTE BRONREGEL
- De bron is context, geen waarheid over betekenis of intentie.
- Verzin niets.
- Beschrijf alleen wat werkelijk zichtbaar of leesbaar is.
- Leid geen persoonlijke betekenis, emotie, familieband, sector, doelgroep of kwaliteit af zonder concreet bewijs.
- Een bronfeit blijft een BRONFEIT totdat de ondernemer het bevestigt.
- Iedere mogelijke deur moet terug te voeren zijn op een concreet steunfeit EN concreet bewijs uit de bron.
- Als je geen concreet bewijs kunt aanwijzen, maak die deur niet.

VISUELE TEKSTBETROUWBAARHEID
- Behandel gestileerde, kleine, schuine, onscherpe, gedeeltelijk afgedekte of anderszins moeilijk leesbare tekst NIET als exacte transcriptie.
- Alleen wanneer een naam, slogan, telefoonnummer of andere tekst zonder redelijke twijfel leesbaar is, mag je die exact citeren.
- Bij twijfel: noteer alleen het betrouwbaar leesbare deel en zet de rest expliciet bij uncertainties.
- Gebruik formuleringen als: "Op de bus staat een bedrijfsnaam met 'Schildersbedrijf' en een naam die niet volledig zeker leesbaar is."
- Verzin nooit ontbrekende letters om van een gedeeltelijk leesbare naam een plausibele volledige naam te maken.
- Een vermoedelijke lezing mag NIET als source-backed kandidaat worden aangeboden alsof die exact is.
- Als zichtbare tekst mogelijk botst met iets dat de ondernemer zelf heeft gezegd, markeer dit als onzekerheid; corrigeer geen van beide automatisch.

ZOEK NAAR GOUD DAT VOOR EEN WEBSITE RELEVANT KAN ZIJN
Bij afbeeldingen kan dat bijvoorbeeld zijn:
- bedrijfsnaam of zichtbaar woordmerk;
- logo of herkenbaar beeldmerk;
- dominante of terugkerende kleuren;
- bedrijfsbus, werkplaats, salon, winkel, gereedschap of werkomgeving;
- project, product, detail of vakmanschap;
- een persoon in context, zonder identiteit te verzinnen;
- zichtbare tekst of jaartallen.

Bij documenten kan dat bijvoorbeeld zijn:
- bedrijfsnaam;
- personen;
- geschiedenis;
- projecten;
- diensten;
- specialisaties;
- jaartallen;
- slogans;
- waarden;
- verhalen of opvallende formuleringen.

PRIORITEIT VOOR GOUD EN DEUREN
- Geef herkenningsankers voorrang wanneer ze duidelijk zichtbaar zijn: bedrijfsnaam, logo, woordmerk, kleurgebruik, bedrijfsbus, terugkerende vormtaal of een herkenbaar projectdetail.
- Een deur moet helpen ontdekken waarom iets herkenbaar, persoonlijk, betekenisvol, trotsmakend of kenmerkend is.
- Maak van administratieve controle geen hoofddeur.
- Vermijd deuren die alleen vragen of iets "officieel", "toegestaan", "beschikbaar" of "actueel" is, tenzij dat echt noodzakelijk is voor de preview.
- Vermijd ook intake-achtige deuren als "welke diensten biedt u precies aan?" wanneer er een rijker herkenningssignaal aanwezig is.
- Contactgegevens mogen als bronfeit worden vastgelegd, maar zijn zelden goud voor Discovery.

MOGELIJKE DEUR
Een deur is geen conclusie. Het is een concreet signaal waar mogelijk een verhaal achter zit.
Voorbeeld: een oude bedrijfsbus met hetzelfde logo kan een deur zijn naar herkenbaarheid of geschiedenis, maar je mag niet aannemen dat de ondernemer er trots op is.

Geef uitsluitend geldige JSON terug.
Geen markdown.
Geen uitleg buiten JSON.
  `;
}

function buildPrompt(file: UploadedSourceInput) {
  return `
BESTAND
Naam: ${file.name}
Type: ${file.mimeType}

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

Houd het compact. Selecteer alleen informatie die werkelijk waarde kan hebben voor Discovery of de preview.
  `;
}

function parseAnalysis(
  outputText: string,
  file: UploadedSourceInput,
  type: "image" | "document"
): SourceContext {
  const parsed: unknown = JSON.parse(outputText);
  const object: ParsedAnalysis =
    typeof parsed === "object" && parsed !== null
      ? (parsed as ParsedAnalysis)
      : {};

  const rawFacts = Array.isArray(object.facts) ? object.facts : [];
  const facts = rawFacts
    .filter((item: unknown): item is ParsedFact => {
      return (
        typeof item === "object" &&
        item !== null &&
        typeof (item as { statement?: unknown }).statement === "string"
      );
    })
    .map((item) => ({
      statement: item.statement,
      evidence:
        typeof item.evidence === "string" ? item.evidence : undefined,
      status: "source-only" as const,
    }));

  const rawGold = Array.isArray(object.goldCandidates)
    ? object.goldCandidates
    : [];
  const goldCandidates = rawGold.filter(
    (item: unknown): item is ParsedGoldCandidate =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as { signal?: unknown }).signal === "string" &&
      typeof (item as { reason?: unknown }).reason === "string"
  );

  const rawDoors = Array.isArray(object.doors) ? object.doors : [];
  const doors = rawDoors.filter(
    (item: unknown): item is ParsedDoor =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as { signal?: unknown }).signal === "string" &&
      typeof (item as { supportingFact?: unknown }).supportingFact ===
        "string" &&
      typeof (item as { evidence?: unknown }).evidence === "string" &&
      typeof (item as { whyWorthExploring?: unknown }).whyWorthExploring ===
        "string" &&
      (item as { supportingFact: string }).supportingFact.trim().length > 0 &&
      (item as { evidence: string }).evidence.trim().length > 0
  );

  const rawUncertainties = Array.isArray(object.uncertainties)
    ? object.uncertainties
    : [];
  const uncertainties = rawUncertainties.filter(
    (item: unknown): item is string => typeof item === "string"
  );

  return {
    type,
    sourceId: file.id,
    name: file.name,
    mimeType: file.mimeType,
    title: file.name,
    facts,
    goldCandidates,
    doors,
    uncertainties,
  };
}

export async function analyzeUploadedSource(
  file: UploadedSourceInput
): Promise<SourceContext> {
  const isImage = file.mimeType.startsWith("image/");
  const prompt = buildPrompt(file);

  if (isImage) {
    const response = await openai.responses.create({
      model: "gpt-5.6-terra",
      instructions: buildInstructions("image"),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
            {
              type: "input_image",
              image_url: file.dataUrl,
              detail: "high",
            },
          ],
        },
      ],
    });

    return parseAnalysis(response.output_text, file, "image");
  }

  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: buildInstructions("document"),
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt,
          },
          {
            type: "input_file",
            filename: file.name,
            file_data: file.dataUrl,
          },
        ],
      },
    ],
  });

  return parseAnalysis(response.output_text, file, "document");
}
