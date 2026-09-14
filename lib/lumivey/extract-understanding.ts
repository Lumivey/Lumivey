import OpenAI from "openai";
import {
  EMPTY_UNDERSTANDING,
  LumiveyUnderstanding,
  SourceBackedCandidate,
} from "@/lib/lumivey/understanding";
import {
  formatSourceContextsForPrompt,
  SourceContext,
} from "@/lib/lumivey/source-context";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function parseJson(text: string): LumiveyUnderstanding {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(clean) as LumiveyUnderstanding;
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(clean.slice(start, end + 1)) as LumiveyUnderstanding;
    }
    throw new Error("Understanding-model gaf geen geldige JSON terug.");
  }
}

function deterministicContactCandidates(sourceContexts: SourceContext[]): SourceBackedCandidate[] {
  const candidates: SourceBackedCandidate[] = [];

  for (const source of sourceContexts) {
    const sourceLabel = source.url || source.title || source.name || source.type;

    for (const fact of source.facts || []) {
      const match = fact.statement.match(/^Contact (?:e-mail|telefoon|link):\s*(.+)$/i);
      if (!match?.[1]?.trim()) continue;

      const value = match[1].trim();
      candidates.push({
        value,
        evidence: fact.evidence || fact.statement,
        sourceLabel,
        status: "source-backed-unconfirmed",
      });
    }
  }

  return Array.from(
    new Map(candidates.map((candidate) => [candidate.value.toLowerCase(), candidate])).values()
  );
}

function mergeSourceBackedCandidates(
  primary: SourceBackedCandidate[] = [],
  additional: SourceBackedCandidate[] = []
): SourceBackedCandidate[] {
  return Array.from(
    new Map(
      [...primary, ...additional]
        .filter((candidate) => candidate?.value?.trim())
        .map((candidate) => [candidate.value.trim().toLowerCase(), candidate])
    ).values()
  );
}

export async function extractUnderstanding(
  messages: ChatMessage[],
  sourceContexts: SourceContext[] = []
): Promise<LumiveyUnderstanding> {
  if (!messages.length) {
    return {
      ...EMPTY_UNDERSTANDING,
      sourceBacked: {
        ...EMPTY_UNDERSTANDING.sourceBacked,
        contactDetails: deterministicContactCandidates(sourceContexts),
      },
      sources: sourceContexts,
    };
  }

  const transcript = messages
    .map((message) => {
      const speaker = message.role === "user" ? "Ondernemer" : "Lumivey";
      return `${speaker}: ${message.content}`;
    })
    .join("\n\n");

  const sourcePrompt = formatSourceContextsForPrompt(sourceContexts);

  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: `
Je helpt Lumivey om intern bij te houden wat werkelijk bekend is.

Dit is geen gesprek met de ondernemer.
Dit is interne interpretatie.

Maak onderscheid tussen vijf lagen:

1. BEVESTIGDE FEITEN
Wat de ondernemer zelf duidelijk heeft gezegd of expliciet heeft bevestigd.
Deze informatie mag naar entrepreneur, business, website en facts.

2. BEVESTIGDE IDENTITEIT
De velden identity.motivation, identity.craftsmanship, identity.pride, identity.story en identity.recognitionAnchors mogen alleen worden gevuld wanneer de ondernemer zelf de betekenis heeft uitgesproken of ondubbelzinnig heeft bevestigd.

3. HUMAN SIGNALS / GOUDKLOMPJES
Leg hier betekenisvolle menselijke signalen vast die sterk uit het gesprek blijken en die een website persoonlijker en herkenbaarder kunnen maken.

Een humanSignal is GEEN hard bedrijfsfeit en hoeft dus niet als feit geformuleerd te worden.
Het mag gaan om bijvoorbeeld:
- een manier van kijken of werken;
- een persoonlijk ritueel of detail dat iets laat zien over karakter;
- een gebeurtenis of herinnering die betekenis geeft aan het werk;
- een uitspraak die de ondernemer onderscheidt;
- een opvallende verbinding tussen persoonlijk gedrag en professioneel gedrag;
- een verhaal, keuze of trotsmoment dat visueel of inhoudelijk bruikbaar is in de Preview.

Voor humanSignals gelden harde regels:
- het signaal moet aantoonbaar uit het gesprek komen;
- evidence citeert of parafraseert concreet waarop het signaal is gebaseerd;
- geen psychologische diagnoses of wilde karakteraannames;
- geen betekenis verzinnen uit alleen een foto of externe bron;
- wanneer de ondernemer zelf de verbinding legt tussen een persoonlijk detail en zijn manier van werken, mag dat met confidence=high worden vastgelegd;
- gebruik previewRelevance=high wanneer het signaal de ondernemer duidelijk menselijker of onderscheidender kan maken in een artist impression.

Voorbeeld van WEL toegestaan:
Ondernemer zegt dat hij op zondagochtend met een camera rustig composities zoekt en dat hij in zijn werk ook eerst kijkt en luistert voordat hij oordeelt.
Dan mag humanSignals bevatten: "Neemt bewust tijd om te observeren en samenhang te zien; verbindt dit zelf aan zijn manier van werken."

Voorbeeld van NIET toegestaan:
Een bron bevat een foto van een motor. Daaruit mag je niet afleiden dat vrijheid belangrijk voor hem is.

4. SOURCE-BACKED KANDIDATEN
Concrete informatie die aantoonbaar uit een externe bron komt, maar nog niet door de ondernemer is bevestigd.
Zet zulke informatie niet in facts en vul er de bevestigde hoofdvelden niet mee.
Zet deze informatie in sourceBacked met exact bewijs.

Gebruik sourceBacked voor concrete kandidaten zoals bedrijfsnaam, beroep, plaatsnaam, diensten, contactgegevens en visuele herkenningsankers.

5. ONBEKEND / NOG TE BEVESTIGEN
Maak onderscheid tussen echt onbekend en informatie waarvoor al een bronkandidaat bestaat.

ABSOLUTE WAARHEIDSREGELS
- Een aangeleverde foto, website of document kan een signaal of deur opleveren, maar nooit automatisch persoonlijke betekenis.
- Formuleringen van Lumivey in eerdere assistentberichten tellen niet als bevestiging door de ondernemer.
- Een korte reactie als "ja", "klopt" of "inderdaad" geldt alleen als bevestiging wanneer ondubbelzinnig duidelijk is wat bevestigd wordt.
- Verzin geen feiten.
- Vul geen gaten op.
- Maak geen marketingverhaal.

Zoek alleen naar informatie die later helpt om een website te maken waarin de ondernemer zichzelf herkent.

Geef uitsluitend geldige JSON terug.
Geen uitleg.
Geen markdown.
    `,
    input: `
Lees dit gesprek:

${transcript}

EXTERNE BRONCONTEXT
${sourcePrompt}

Geef exact dit JSON-formaat terug:

{
  "entrepreneur": {
    "name": "",
    "businessName": "",
    "profession": "",
    "location": ""
  },
  "identity": {
    "motivation": [],
    "craftsmanship": [],
    "pride": [],
    "story": [],
    "recognitionAnchors": []
  },
  "humanSignals": [
    {
      "signal": "",
      "evidence": "",
      "confidence": "high",
      "previewRelevance": "high"
    }
  ],
  "business": {
    "services": [],
    "audience": [],
    "existingWebsite": "",
    "importantNeeds": []
  },
  "website": {
    "purpose": [],
    "desiredFeeling": [],
    "usefulContent": []
  },
  "sourceBacked": {
    "businessNames": [],
    "professions": [],
    "locations": [],
    "services": [],
    "contactDetails": [],
    "visualAnchors": []
  },
  "facts": [],
  "interpretations": [],
  "unknowns": []
}

Gebruik lege strings of lege arrays wanneer iets niet bekend is.
Verwijder lege voorbeelditems.
    `,
  });

  const parsed = parseJson(response.output_text);
  const sourceBacked = parsed.sourceBacked ?? EMPTY_UNDERSTANDING.sourceBacked;
  const deterministicContacts = deterministicContactCandidates(sourceContexts);

  return {
    ...parsed,
    humanSignals: parsed.humanSignals ?? [],
    sourceBacked: {
      ...EMPTY_UNDERSTANDING.sourceBacked,
      ...sourceBacked,
      contactDetails: mergeSourceBackedCandidates(
        sourceBacked.contactDetails,
        deterministicContacts
      ),
    },
    sources: sourceContexts,
  };
}
