import OpenAI from "openai";
import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";
import { formatPreviewContext } from "@/lib/lumivey/preview-context";

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

Je ontvangt Lumiveys interne begrip in duidelijk gescheiden lagen.

Maak daar een eerste websitebeschrijving van die:
- herkenbaar voelt voor deze ondernemer;
- eenvoudig en rustig is;
- geen informatie verzint;
- geen marketingclichés gebruikt;
- niet probeert indrukwekkender te klinken dan de ondernemer zelf.

Dit is een eerste preview, geen definitieve website.

WAARHEIDSREGELS
- BEVESTIGD DOOR DE ONDERNEMER is de sterkste grond en mag normaal als feit worden gebruikt.
- BRON-GESTEUND MAAR NOG NIET BEVESTIGD mag worden gebruikt voor concrete, observeerbare preview-inhoud zoals bedrijfsnaam, beroep, locatie, diensten en visuele herkenningsankers, maar alleen wanneer het bewijs concreet is en er geen conflict of onzekerheid is.
- Gebruik broninformatie nooit om motivatie, trots, identiteit, kwaliteit, doelgroep, betekenis, actuele erkenningen of persoonlijke eigenschappen als feit te presenteren wanneer de ondernemer die niet heeft bevestigd.
- INTERPRETATIES zijn richting, geen feiten. Gebruik ze alleen terughoudend voor compositie of nadruk; schrijf ze niet als harde websiteclaims.
- ONBEKEND / NOG TE BEVESTIGEN mag niet als feit op de preview verschijnen.
- Bij twijfel: weglaten.

De preview mag juist helpen ontdekken of een bronkandidaat klopt. Een concrete bronvermelde dienst of bedrijfsnaam mag daarom in een eerste impressie zichtbaar zijn als er sterk bewijs is, maar verzin er geen verhaal of betekenis omheen.

De preview moet iets teruggeven van:
- identiteit;
- vakmanschap;
- motivatie;
- verhaal;
- herkenningsankers;
- werkelijke behoefte;

maar alleen wanneer daarvoor voldoende grond bestaat.

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
Dit is Lumiveys actuele preview-context:

${formatPreviewContext(understanding)}

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
