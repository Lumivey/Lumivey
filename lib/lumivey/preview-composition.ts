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

export type PreviewSectionLayout =
  | "text"
  | "split"
  | "split-reverse"
  | "grid"
  | "feature"
  | "list"
  | "statement"
  | "manifesto"
  | "cards"
  | "mosaic"
  | "gallery";

export type PreviewSection = {
  type: PreviewSectionType;
  eyebrow?: string;
  title?: string;
  body?: string;
  items?: string[];
  imageSlot?: "hero" | "story" | "detail" | null;
  sourceAssetId?: string | null;
  layout: PreviewSectionLayout;
  tone?: "base" | "surface" | "accent" | "dark";
  emphasis?: "quiet" | "normal" | "strong" | "heroic";
  imageCrop?: "portrait" | "landscape" | "square" | "wide" | "detail";
};

export type PreviewComposition = {
  brandName: string;
  navigation: string[];
  hero: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    layout:
      | "split"
      | "full"
      | "overlay"
      | "minimal"
      | "image-led"
      | "cinematic"
      | "poster"
      | "editorial";
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

Je maakt GEEN templatekeuze. Je ontwerpt een eerste homepage vanuit het begrip van precies deze ondernemer of organisatie.

DOEL
De ondernemer moet bij de eerste preview kunnen denken:
"Ja. Dit ben ik. Dit is mijn onderneming, maar dan beter verteld."

De homepage is de eerste kennismaking met een toekomstige MEERPAGINA-WEBSITE. Probeer dus niet alle informatie op de homepage te proppen. Kies wat op de eerste pagina betekenisvol is en geef in pageHints aan welke logische vervolgpagina's uit het bekende materiaal voortkomen.

BELANGRIJKE KWALITEITSLAT
Een homepage mag niet voelen alsof tekst in een nette generieke layout is gezet.
De compositie moet voortkomen uit de identiteit, het werk, het verhaal en het beschikbare echte beeldmateriaal.
Gebruik visuele spanning, ritme, schaal, contrast en beeld waar dat bij deze ondernemer past.
Voor een sterk visueel vak mag de homepage beeldgedreven, cinematografisch, technisch of rijk aan bewijs zijn. Voor een rustige adviseur kan juist terughoudendheid passend zijn. Kies nooit minimalisme als automatische veilige standaard.

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
- Gebruik een AI imageSlot alleen voor plekken waar geen passend eigen beeldasset is of waar aanvullend beeld werkelijk iets toevoegt.

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
Bepaal daarom expliciet:
- light, dark of mixed;
- neutrale, redactionele, technische of expressieve typografie;
- hero restrained, bold of cinematic;
- open secties, panelen, kleurbanden of een mix;
- clean, documentary, cinematic of detail-led beeldgebruik;
- een concrete kleurpalette in geldige 6-cijferige HEX-kleuren.

Kleur is betekenisvol. Kies geen beige/off-white uit gewoonte. Een bestaande huisstijl heeft voorrang als die betrouwbaar bekend is.

COMPOSITIEGRAMMATICA
Je beschikt over rijkere bouwvormen. Gebruik ze bewust, niet allemaal tegelijk:
- text: rustige tekstsectie;
- split: tekst links, beeld rechts;
- split-reverse: beeld links, tekst rechts;
- grid: meerdere gelijkwaardige punten;
- feature: groot beeld of bewijs naast compacte tekst;
- list: ritmische lijst;
- statement: één grote gedachte met veel visueel gewicht;
- manifesto: uitgesproken kernzin of visie, bijna posterachtig;
- cards: inhoud als duidelijke losse bewijsblokken;
- mosaic: asymmetrische combinatie van beeld, titel en punten;
- gallery: werk/resultaat staat centraal, tekst ondersteunt.

Hero-keuzes:
- split: klassiek tweeluik;
- full: brede tekstgedreven hero;
- overlay: tekst over beeld;
- minimal: bewust sober wanneer dat werkelijk past;
- image-led: beeld heeft duidelijk de leiding;
- cinematic: bijna schermvullend beeld met sterke typografische laag;
- poster: krachtige grafische compositie met compacte copy;
- editorial: asymmetrische redactionele compositie.

Gebruik emphasis en imageCrop om hiërarchie te sturen. Een belangrijke identiteitspijler mag heroic zijn. Een ondersteunend feit mag quiet zijn.

VERMIJD HERHALING
- Niet iedere sectie hoeft dezelfde maximale breedte te hebben.
- Niet iedere sectie hoeft titel + alinea + lijst te zijn.
- Vermijd lange opeenvolgingen van witte tekstvlakken.
- Gebruik donkere, lichte of accentzones alleen wanneer ze inhoudelijk of ritmisch iets doen.
- Laat visueel werk visueel bewijs krijgen.
- Een sterk verhaal mag als zelfstandig moment in de pagina ademen.

Een adviseur, kapper, stichting, schilder en detailer moeten aantoonbaar verschillend kunnen uitkomen wanneer hun begrip verschilt.

DO NOT CHANGE
Wanneer bestaande visuele identiteit of herkenningsankers bekend zijn, zet concrete zaken die niet zomaar veranderd mogen worden in doNotChange. Doe dit alleen wanneer ondersteund door het begrip.

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
    "layout": "cinematic",
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
      "layout": "statement",
      "tone": "base",
      "emphasis": "strong",
      "imageCrop": "landscape"
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
