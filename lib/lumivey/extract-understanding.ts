import OpenAI from "openai";
import {
  EMPTY_UNDERSTANDING,
  LumiveyUnderstanding,
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

export async function extractUnderstanding(
  messages: ChatMessage[],
  sourceContexts: SourceContext[] = []
): Promise<LumiveyUnderstanding> {
  if (!messages.length) {
    return {
      ...EMPTY_UNDERSTANDING,
      sources: sourceContexts,
    };
  }

  const transcript = messages
    .map((message) => {
      const speaker =
        message.role === "user" ? "Ondernemer" : "Lumivey";

      return `${speaker}: ${message.content}`;
    })
    .join("\n\n");

  const sourcePrompt =
    formatSourceContextsForPrompt(sourceContexts);

  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: `
Je helpt Lumivey om intern bij te houden wat werkelijk uit een gesprek bekend is.

Dit is geen gesprek met de ondernemer.
Dit is interne interpretatie.

Maak streng onderscheid tussen:

1. FEITEN
Wat de ondernemer zelf duidelijk heeft gezegd of expliciet heeft bevestigd.

2. INTERPRETATIES
Wat redelijk uit het gesprek lijkt te volgen,
maar niet letterlijk als feit is uitgesproken.

3. BRONINFORMATIE
Informatie uit een website of andere externe bron is GEEN bevestigd ondernemersfeit.
Neem broninformatie daarom niet automatisch op in facts.
Gebruik broninformatie alleen als context om een bevestiging in het gesprek beter te begrijpen.

4. ONBEKEND
Wat belangrijk kan zijn maar nog niet bekend is.

Verzin niets.
Vul geen gaten op.
Maak geen marketingverhaal.
Maak geen aannames over karakter, kwaliteit, doelgroep of bedrijfsvoering
zonder voldoende grond in het gesprek.

Zoek alleen naar informatie die later kan helpen
om een website te maken waarin de ondernemer zichzelf herkent.

Een korte reactie als "ja", "klopt" of "inderdaad" mag alleen als bevestiging gelden
wanneer uit de direct voorafgaande context ondubbelzinnig duidelijk is welk concreet bronfeit wordt bevestigd.

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
  "facts": [],
  "interpretations": [],
  "unknowns": []
}

Gebruik lege strings of lege arrays wanneer iets niet bekend is.
    `,
  });

  const parsed = JSON.parse(
    response.output_text
  ) as LumiveyUnderstanding;

  return {
    ...parsed,
    sources: sourceContexts,
  };
}
