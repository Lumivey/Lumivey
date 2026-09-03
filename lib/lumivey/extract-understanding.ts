import OpenAI from "openai";
import {
  EMPTY_UNDERSTANDING,
  LumiveyUnderstanding,
} from "@/lib/lumivey/understanding";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function extractUnderstanding(
  messages: ChatMessage[]
): Promise<LumiveyUnderstanding> {
  if (!messages.length) {
    return EMPTY_UNDERSTANDING;
  }

  const transcript = messages
    .map((message) => {
      const speaker =
        message.role === "user" ? "Ondernemer" : "Lumivey";

      return `${speaker}: ${message.content}`;
    })
    .join("\n\n");

  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: `
Je helpt Lumivey om intern bij te houden wat werkelijk uit een gesprek bekend is.

Dit is geen gesprek met de ondernemer.
Dit is interne interpretatie.

Maak streng onderscheid tussen:

1. FEITEN
Wat de ondernemer zelf duidelijk heeft gezegd.

2. INTERPRETATIES
Wat redelijk uit het gesprek lijkt te volgen,
maar niet letterlijk als feit is uitgesproken.

3. ONBEKEND
Wat belangrijk kan zijn maar nog niet bekend is.

Verzin niets.
Vul geen gaten op.
Maak geen marketingverhaal.
Maak geen aannames over karakter, kwaliteit, doelgroep of bedrijfsvoering
zonder voldoende grond in het gesprek.

Zoek alleen naar informatie die later kan helpen
om een website te maken waarin de ondernemer zichzelf herkent.

Geef uitsluitend geldige JSON terug.
Geen uitleg.
Geen markdown.
    `,
    input: `
Lees dit gesprek:

${transcript}

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

  const parsed = JSON.parse(response.output_text);

  return parsed as LumiveyUnderstanding;
}