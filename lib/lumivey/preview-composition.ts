import OpenAI from "openai";
import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";
import { formatPreviewContext } from "@/lib/lumivey/preview-context";
import { ArtDirection } from "@/lib/lumivey/art-direction";
import { PreviewReadiness } from "@/lib/lumivey/preview-readiness";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type PreviewSectionType =
  | "intro"
  | "story"
  | "services"
  | "projects"
  | "approach"
  | "proof"
  | "content"
  | "contact";

export type PreviewSection = {
  type: PreviewSectionType;
  eyebrow?: string;
  title?: string;
  body?: string;
  items?: string[];
  imageSlot?: "hero" | "story" | "detail" | null;
  layout: "text" | "split" | "grid" | "feature" | "list";
};

export type PreviewComposition = {
  brandName: string;
  navigation: string[];
  hero: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    layout: "split" | "full" | "overlay" | "minimal" | "image-led";
    imageSlot?: "hero" | null;
    primaryAction?: string;
  };
  sections: PreviewSection[];
  design: {
    character: string;
    density: "airy" | "balanced" | "compact";
    contrast: "soft" | "clear" | "strong";
    imagePresence: "restrained" | "balanced" | "dominant";
    shapeLanguage: "square" | "soft" | "mixed";
    colorDirection: string;
    typographyDirection: string;
  };
  pageHints: Array<{
    label: string;
    purpose: string;
  }>;
  recognitionAnchors: string[];
  doNotChange: string[];
};

export async function createPreviewComposition(
  understanding: LumiveyUnderstanding,
  artDirection: ArtDirection,
  readiness: PreviewReadiness
): Promise<PreviewComposition> {
  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: `
Je bent Lumiveys recognition-first homepage-componist.

Je maakt GEEN templatekeuze en je kiest GEEN ondernemer uit een paar vaste stijlen.
Je componeert een eerste homepage vanuit het begrip van precies deze ondernemer of organisatie.

DOEL
De ondernemer moet bij de eerste preview kunnen denken:
"Ja. Dit ben ik. Dit is mijn onderneming, maar dan beter verteld."

De homepage is de eerste kennismaking met een toekomstige MEERPAGINA-WEBSITE. Probeer dus niet alle informatie op de homepage te proppen. Kies wat op de eerste pagina betekenisvol is en geef in pageHints aan welke logische vervolgpagina's uit het bekende materiaal voortkomen.

HERKENNING EERST
- mens/organisatie en echte onderneming gaan vóór generieke webdesignconventies;
- bestaand logo, huisstijl, kleuren, voertuig, pand, werk, fotografie of andere herkenningsankers moeten gerespecteerd worden wanneer ze betrouwbaar bekend zijn;
- moderniseren betekent niet rebranden;
- behoud vóór vervangen;
- echt bronmateriaal vóór verzonnen beeld;
- gebruik AI-stijl alleen om het bestaande karakter beter te vertalen, niet om een nieuw karakter op te leggen.

DISCOVERY EERST
- een rijk gesprek kan voldoende zijn, ook zonder bestaande website;
- bronnen zijn extra ogen en oren, niet het hart van de identiteit;
- veel bronfeiten zijn geen vervanging voor menselijk begrip;
- als readiness laag is, blijf terughoudend en maak geen persoonlijk verhaal van gaten.

WAARHEID
- bevestigde ondernemersinformatie is leidend;
- bron-gesteunde concrete feiten en visuele ankers mogen nauw aan het bewijs worden gebruikt;
- broninformatie mag nooit stilletjes worden opgewaardeerd naar motivatie, trots, identiteit, kwaliteit of persoonlijke eigenschappen;
- interpretaties zijn richting, geen publiceerbare feiten;
- onbekenden worden niet ingevuld;
- geen generieke claims zoals zorgvuldig, persoonlijk, kwaliteit, passie, betrouwbaar tenzij daar echte grond voor is.

COMPOSITIE
Kies per ondernemer zelf:
- hero-opbouw;
- sectievolgorde;
- hoeveel tekst versus beeld;
- ritme en dichtheid;
- wat prominent is en wat juist niet;
- welke informatie naar vervolgpagina's hoort.

De beschikbare section types zijn technische bouwstenen, geen vaste paginaformule. Gebruik alleen relevante secties. Vermijd telkens dezelfde volgorde. Een adviseur, kapper, stichting, schilder en detailer moeten aantoonbaar verschillend kunnen uitkomen wanneer hun begrip verschilt.

DO NOT CHANGE
Wanneer bestaande visuele identiteit of herkenningsankers bekend zijn, zet concrete zaken die niet zomaar veranderd mogen worden in doNotChange. Voorbeeld: bestaand logo behouden, herkenbare buskleuren respecteren. Doe dit alleen wanneer ondersteund door het begrip.

Geef uitsluitend geldige JSON terug. Geen markdown. Geen uitleg.
    `,
    input: `
PREVIEW READINESS:
${JSON.stringify(readiness, null, 2)}

ART DIRECTION:
${JSON.stringify(artDirection, null, 2)}

LUMIVEY PREVIEW CONTEXT:
${formatPreviewContext(understanding)}

Geef exact dit JSON-formaat terug:
{
  "brandName": "",
  "navigation": [],
  "hero": {
    "eyebrow": "",
    "title": "",
    "subtitle": "",
    "layout": "split",
    "imageSlot": "hero",
    "primaryAction": ""
  },
  "sections": [
    {
      "type": "intro",
      "eyebrow": "",
      "title": "",
      "body": "",
      "items": [],
      "imageSlot": null,
      "layout": "text"
    }
  ],
  "design": {
    "character": "",
    "density": "balanced",
    "contrast": "clear",
    "imagePresence": "balanced",
    "shapeLanguage": "mixed",
    "colorDirection": "",
    "typographyDirection": ""
  },
  "pageHints": [
    { "label": "", "purpose": "" }
  ],
  "recognitionAnchors": [],
  "doNotChange": []
}

Gebruik lege strings of arrays waar informatie niet verantwoord ingevuld kan worden.
Gebruik maximaal 7 homepage-secties; de rest hoort naar vervolgpagina's.
    `,
  });

  return JSON.parse(response.output_text) as PreviewComposition;
}
