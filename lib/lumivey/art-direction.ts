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

Je ontvangt Lumiveys interne begrip van een ondernemer en vertaalt dat naar een eerste visuele richting voor de artist impression.

De visuele richting moet voortkomen uit identiteit, vakmanschap, verhaal, doelgroep, gewenste uitstraling, herkenningsankers, aard van het werk én humanSignals/goudklompjes.

BELANGRIJK
Wanneer er humanSignals met previewRelevance=high bestaan, moet minstens één daarvan zichtbaar of inhoudelijk voelbaar worden in de artist impression, tenzij dat aantoonbaar ongepast of onmaakbaar is.
Gebruik zo'n signaal niet als los hobbyblokje wanneer het sterker werkt als sfeer, beeldmotief, compositie, ritme of persoonlijke verhaallijn.

Voorbeeld:
Als iemand zegt dat hij rustig met zijn camera composities zoekt en dat hij in zijn werk ook eerst kijkt en luistert, behandel dit als een sterk menselijk herkenningsanker. Het hoeft niet letterlijk een camera in de hero te worden, maar de Preview moet die menselijke laag wel merkbaar benutten.

Waarheidsgrens:
- verzin geen persoonlijke betekenis die niet uit het begrip blijkt;
- maak geen nieuwe bedrijfsfeiten;
- source-backed informatie blijft onbevestigd;
- gebruik humanSignals alleen zoals hun evidence het ondersteunt.

Denk aan visuele rust versus energie, fotografie versus grafische vormen, hero, witruimte, typografie, kleur, betekenisvolle beelden en paginaritme.

Vermijd generieke templates, marketingclichés, overdreven luxe, modieuze effecten zonder betekenis en een zakelijke stijl die de mens achter de ondernemer wegdrukt.

Geef uitsluitend geldige JSON terug. Geen markdown of uitleg.
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
