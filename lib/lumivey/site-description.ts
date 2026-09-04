import OpenAI from "openai";
import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type SiteDescription = {
  title: string;
  subtitle: string;
  intro: string;
  storyTitle?: string;
  story?: string;
  servicesTitle?: string;
  services: string[];
  contactTitle: string;
  contactText: string;
  visualDirection: {
    mood: string;
    tone: string;
  };
};

export async function createSiteDescription(
  understanding: LumiveyUnderstanding
): Promise<SiteDescription> {
  const response = await openai.responses.create({
    model: "gpt-5.6-terra",

    instructions: `
Je bent de eerste eenvoudige website-componist van Lumivey.

Je ontvangt uitsluitend Lumiveys interne begrip van een ondernemer.

Maak daar een eerste websitebeschrijving van die:
- herkenbaar voelt voor deze ondernemer;
- eenvoudig en rustig is;
- geen informatie verzint;
- geen marketingclichés gebruikt;
- niet probeert indrukwekkender te klinken dan de ondernemer zelf;
- alleen informatie gebruikt waarvoor voldoende grond bestaat.

Dit is een eerste preview, geen definitieve website.

De preview moet iets teruggeven van:
- identiteit;
- vakmanschap;
- motivatie;
- verhaal;
- herkenningsankers;
- werkelijke behoefte;

maar alleen wanneer die informatie daadwerkelijk aanwezig is.

Als informatie ontbreekt:
laat het weg.
Vul geen gaten op.

De website hoeft niet alle beschikbare informatie te tonen.
Kies wat betekenisvol is.

De structuur mag per ondernemer verschillen,
maar houd deze eerste versie technisch eenvoudig.

Geef uitsluitend geldige JSON terug.
Geen markdown.
Geen uitleg.
    `,

    input: `
Dit is Lumiveys actuele begrip:

${JSON.stringify(understanding, null, 2)}

Geef exact dit JSON-formaat terug:

{
  "title": "",
  "subtitle": "",
  "intro": "",
  "storyTitle": "",
  "story": "",
  "servicesTitle": "",
  "services": [],
  "contactTitle": "",
  "contactText": "",
  "visualDirection": {
    "mood": "",
    "tone": ""
  }
}

Gebruik lege strings of lege arrays wanneer een onderdeel niet verantwoord gevuld kan worden.
    `,
  });

  return JSON.parse(response.output_text) as SiteDescription;
}