import OpenAI from "openai";
import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";
import { ArtDirection } from "@/lib/lumivey/art-direction";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ImageBrief = {
  hero: {
    purpose: string;
    subject: string;
    setting: string;
    composition: string;
    atmosphere: string;
    avoid: string[];
  };

  story: {
    purpose: string;
    subject: string;
    setting: string;
    composition: string;
    atmosphere: string;
    avoid: string[];
  };

  detail: {
    purpose: string;
    subject: string;
    setting: string;
    composition: string;
    atmosphere: string;
    avoid: string[];
  };
};

export async function createImageBrief(
  understanding: LumiveyUnderstanding,
  artDirection: ArtDirection
): Promise<ImageBrief> {
  const response = await openai.responses.create({
    model: "gpt-5.6-terra",

    instructions: `
Je bent de beeldredacteur van Lumivey.

Je ontvangt:
1. Lumiveys interne begrip van de ondernemer;
2. de gekozen art direction.

Maak voor drie beeldplekken een concrete beeldbriefing:

- hero
- story
- detail

De beelden moeten de ondernemer herkenbaar ondersteunen.
Ze mogen niet alleen decoratief zijn.

Gebruik uitsluitend informatie waarvoor voldoende grond bestaat.

Belangrijk:
- geen verzonnen personen, locaties, gebouwen of bedrijfsdetails;
- geen generieke stockfotografie;
- geen clichématige vakbeelden;
- geen onnatuurlijke poses;
- geen overdreven reclame-esthetiek;
- geen visuele elementen die niet bij de ondernemer passen.

Denk vooral aan:
- wat het beeld moet vertellen;
- wat er letterlijk te zien moet zijn;
- in welke omgeving;
- hoe dichtbij of ruim het beeld moet zijn;
- welke sfeer het moet hebben;
- wat absoluut vermeden moet worden.

Als een echt portret van de ondernemer niet beschikbaar is,
maak daar dan geen fictief portret van.

Een hero hoeft dus niet altijd een persoon te tonen.
Het kan ook werk, materiaal, omgeving of resultaat tonen
als dat sterker en eerlijker is.

Geef uitsluitend geldige JSON terug.
Geen markdown.
Geen uitleg.
    `,

    input: `
INTERNE BEGRIP:

${JSON.stringify(understanding, null, 2)}

ART DIRECTION:

${JSON.stringify(artDirection, null, 2)}

Geef exact dit JSON-formaat terug:

{
  "hero": {
    "purpose": "",
    "subject": "",
    "setting": "",
    "composition": "",
    "atmosphere": "",
    "avoid": []
  },
  "story": {
    "purpose": "",
    "subject": "",
    "setting": "",
    "composition": "",
    "atmosphere": "",
    "avoid": []
  },
  "detail": {
    "purpose": "",
    "subject": "",
    "setting": "",
    "composition": "",
    "atmosphere": "",
    "avoid": []
  }
}
    `,
  });

  return JSON.parse(response.output_text) as ImageBrief;
}