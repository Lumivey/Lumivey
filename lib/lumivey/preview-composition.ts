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
  sourceAssetId?: string | null;
  layout: "text" | "split" | "grid" | "feature" | "list";
  tone?: "base" | "surface" | "accent" | "dark";
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
    sourceAssetId?: string | null;
    primaryAction?: string;
  };
  sections: PreviewSection[];
  design: {
    character: string;
    density: "airy" | "balanced" | "compact";
    contrast: "soft" | "clear" | "strong";
    imagePresence: "restrained" | "balanced" | "dominant";
    shapeLanguage: "square" | "soft" | "mixed";
    theme: "light" | "dark" | "mixed";
    typeCharacter: "neutral" | "editorial" | "technical" | "expressive";
    heroScale: "restrained" | "bold" | "cinematic";
    sectionTreatment: "open" | "panels" | "bands" | "mixed";
    imageTreatment: "clean" | "documentary" | "cinematic" | "detail-led";
    palette: {
      background: string;
      surface: string;
      text: string;
      muted: string;
      accent: string;
      dark: string;
    };
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

EIGEN BEELDASSETS ZIJN EERSTE KLAS
In de preview-context staat een lijst BESCHIKBARE EIGEN BEELDASSETS met sourceId's.
- Wanneer een aangeleverde foto inhoudelijk sterk past bij hero of sectie, gebruik die foto door exact die sourceId in sourceAssetId te zetten.
- Verzin nooit een sourceAssetId.
- Een eigen foto van de ondernemer tijdens zijn echte werk heeft in principe voorrang boven een fictief AI-beeld wanneer die foto betekenisvol bruikbaar is.
- Een aangeleverde foto hoeft niet letterlijk of onbewerkt de hele hero te vullen; de renderer mag croppen en visueel behandelen. Maar de persoon of het echte werk mag niet stilletjes vervangen worden door een fictief equivalent.
- Gebruik een AI imageSlot alleen voor plekken waar geen passend eigen beeldasset is of waar een aanvullend beeld werkelijk iets toevoegt.
- sourceAssetId en imageSlot mogen samen bestaan: sourceAssetId bepaalt dan het primaire echte beeld voor die plek; imageSlot is alleen fallback/aanvulling wanneer het eigen beeld niet beschikbaar is.

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

STEM
Schrijf de homepage alsof het de website van deze ondernemer is, niet alsof Lumivey een profiel OVER hem schrijft.
- Voor een zelfstandige persoon is ik/wij-taal meestal natuurlijker dan steeds de naam van de ondernemer in de derde persoon.
- Gebruik derde persoon alleen als de organisatiecontext daar echt om vraagt.
- Houd de woorden dicht bij hoe de ondernemer zelf praat.

VISUELE VRIJHEID
De visuele taal moet uit de ondernemer voortkomen, niet uit Lumivey.
Bepaal daarom expliciet een visueel systeem:
- light, dark of mixed;
- neutrale, redactionele, technische of expressieve typografie;
- hero restrained, bold of cinematic;
- open secties, panelen, kleurbanden of een mix;
- clean, documentary, cinematic of detail-led beeldgebruik;
- een concrete kleurpalette in geldige 6-cijferige HEX-kleuren.

Kleur is betekenisvol. Kies geen beige/off-white uit gewoonte. Een high-end detailer kan bijvoorbeeld donker en technisch uitkomen, terwijl een warme persoonlijke adviseur juist licht en menselijk kan zijn. Een bestaande huisstijl heeft voorrang als die betrouwbaar bekend is.

COMPOSITIE
Kies per ondernemer zelf:
- hero-opbouw;
- sectievolgorde;
- hoeveel tekst versus beeld;
- ritme en dichtheid;
- wat prominent is en wat juist niet;
- welke secties donker/licht/accent mogen zijn;
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
    "sourceAssetId": null,
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
      "sourceAssetId": null,
      "layout": "text",
      "tone": "base"
    }
  ],
  "design": {
    "character": "",
    "density": "balanced",
    "contrast": "clear",
    "imagePresence": "balanced",
    "shapeLanguage": "mixed",
    "theme": "light",
    "typeCharacter": "neutral",
    "heroScale": "bold",
    "sectionTreatment": "mixed",
    "imageTreatment": "clean",
    "palette": {
      "background": "#F6F5F1",
      "surface": "#FFFFFF",
      "text": "#1B1B19",
      "muted": "#6F6F69",
      "accent": "#B6914C",
      "dark": "#151515"
    },
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
Gebruik uitsluitend geldige 6-cijferige HEX-kleuren in palette.
    `,
  });

  return JSON.parse(response.output_text) as PreviewComposition;
}
