import OpenAI from "openai";
import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ArtDirection = {
  personality: string[];
  visualMood: string;
  layoutStyle: string;
  heroStyle: string;
  imageStyle: string;
  colorDirection: string;
  typographyDirection: string;
  sectionRhythm: string;
  emphasis: string[];
  avoid: string[];
};

export async function createArtDirection(
  understanding: LumiveyUnderstanding
): Promise<ArtDirection> {
  const response = await openai.responses.create({
    model: "gpt-5.6-terra",

    instructions: `
Je bent de art director van Lumivey.

Je ontvangt Lumiveys interne begrip van een ondernemer.

Bepaal op basis daarvan een eerste visuele richting voor de website.

Je taak is NIET om zomaar iets moois te verzinnen.
De visuele richting moet voortkomen uit:
- identiteit;
- vakmanschap;
- verhaal;
- doelgroep;
- gewenste uitstraling;
- herkenningsankers;
- aard van het werk.

Als informatie ontbreekt:
kies rustig en terughoudend.
Vul geen persoonlijkheid in die niet uit het begrip blijkt.

Denk aan:
- visuele rust versus energie;
- fotografie versus grafische vormen;
- lichte versus donkere hero;
- veel witruimte versus compactere compositie;
- redactioneel, ambachtelijk, modern, technisch, warm, zakelijk of persoonlijk;
- welke delen van het verhaal visueel nadruk verdienen;
- welke soorten beelden betekenisvol zijn;
- welk ritme past bij deze ondernemer.

Vermijd:
- generieke templates;
- overdreven luxe als daar geen aanleiding voor is;
- modieuze effecten zonder betekenis;
- marketingclichés;
- visuele drukte;
- stijlen die niet passen bij de ondernemer.

Geef uitsluitend geldige JSON terug.
Geen markdown.
Geen uitleg.
    `,

    input: `
Dit is Lumiveys actuele begrip:

${JSON.stringify(understanding, null, 2)}

Geef exact dit JSON-formaat terug:

{
  "personality": [],
  "visualMood": "",
  "layoutStyle": "",
  "heroStyle": "",
  "imageStyle": "",
  "colorDirection": "",
  "typographyDirection": "",
  "sectionRhythm": "",
  "emphasis": [],
  "avoid": []
}

Gebruik lege strings of lege arrays wanneer iets niet verantwoord bepaald kan worden.
    `,
  });

  return JSON.parse(response.output_text) as ArtDirection;
}