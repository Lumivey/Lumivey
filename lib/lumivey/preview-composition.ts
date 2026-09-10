import OpenAI from "openai";
import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";
import { formatPreviewContext } from "@/lib/lumivey/preview-context";
import { ArtDirection } from "@/lib/lumivey/art-direction";
import { PreviewReadiness } from "@/lib/lumivey/preview-readiness";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type PreviewSectionType =
  | "intro" | "story" | "services" | "projects" | "approach" | "proof" | "content" | "contact";

export type PreviewVisual = {
  id: string;
  kind: "source" | "generated";
  sourceAssetId?: string | null;
  purpose: string;
  subject: string;
  setting: string;
  composition: string;
  atmosphere: string;
  avoid: string[];
  crop: "portrait" | "landscape" | "square" | "wide" | "detail";
};

export type PreviewSection = {
  type: PreviewSectionType;
  eyebrow?: string;
  title?: string;
  body?: string;
  items?: string[];
  imageSlot?: "hero" | "story" | "detail" | null;
  sourceAssetId?: string | null;
  visuals?: PreviewVisual[];
  layout:
    | "text" | "split" | "grid" | "feature" | "list"
    | "split-reverse" | "statement" | "manifesto" | "cards" | "mosaic" | "gallery";
  tone?: "base" | "surface" | "accent" | "dark";
  emphasis?: "quiet" | "normal" | "strong" | "heroic";
};

export type PreviewComposition = {
  brandName: string;
  navigation: string[];
  hero: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    layout: "split" | "full" | "overlay" | "minimal" | "image-led" | "cinematic" | "poster" | "editorial";
    imageSlot?: "hero" | null;
    sourceAssetId?: string | null;
    visuals?: PreviewVisual[];
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
    palette: { background: string; surface: string; text: string; muted: string; accent: string; dark: string; };
    colorDirection: string;
    typographyDirection: string;
  };
  pageHints: Array<{ label: string; purpose: string }>;
  recognitionAnchors: string[];
  doNotChange: string[];
};

const DEFAULT_DESIGN: PreviewComposition["design"] = {
  character: "rustig en helder",
  density: "balanced",
  contrast: "clear",
  imagePresence: "balanced",
  shapeLanguage: "mixed",
  theme: "light",
  typeCharacter: "neutral",
  heroScale: "bold",
  sectionTreatment: "mixed",
  imageTreatment: "clean",
  palette: {
    background: "#F6F5F1",
    surface: "#FFFFFF",
    text: "#1B1B19",
    muted: "#6F6F69",
    accent: "#B6914C",
    dark: "#151515",
  },
  colorDirection: "",
  typographyDirection: "",
};

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeVisual(value: unknown, index: number): PreviewVisual | null {
  if (!value || typeof value !== "object") return null;
  const visual = value as Partial<PreviewVisual>;
  const kind = visual.kind === "source" ? "source" : "generated";
  const crop: PreviewVisual["crop"] = ["portrait", "landscape", "square", "wide", "detail"].includes(String(visual.crop))
    ? (visual.crop as PreviewVisual["crop"])
    : "landscape";

  return {
    id: asString(visual.id, `visual-${index + 1}`),
    kind,
    sourceAssetId: typeof visual.sourceAssetId === "string" ? visual.sourceAssetId : null,
    purpose: asString(visual.purpose),
    subject: asString(visual.subject),
    setting: asString(visual.setting),
    composition: asString(visual.composition),
    atmosphere: asString(visual.atmosphere),
    avoid: asStringArray(visual.avoid),
    crop,
  };
}

function normalizeVisuals(value: unknown): PreviewVisual[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => normalizeVisual(item, index))
    .filter((item): item is PreviewVisual => item !== null);
}

function normalizeSection(value: unknown, index: number): PreviewSection | null {
  if (!value || typeof value !== "object") return null;
  const section = value as Partial<PreviewSection>;

  const allowedTypes: PreviewSectionType[] = [
    "intro", "story", "services", "projects", "approach", "proof", "content", "contact",
  ];
  const allowedLayouts: PreviewSection["layout"][] = [
    "text", "split", "grid", "feature", "list", "split-reverse", "statement", "manifesto", "cards", "mosaic", "gallery",
  ];
  const allowedTones: NonNullable<PreviewSection["tone"]>[] = ["base", "surface", "accent", "dark"];
  const allowedEmphasis: NonNullable<PreviewSection["emphasis"]>[] = ["quiet", "normal", "strong", "heroic"];

  return {
    type: allowedTypes.includes(section.type as PreviewSectionType) ? (section.type as PreviewSectionType) : "content",
    eyebrow: asString(section.eyebrow),
    title: asString(section.title, `Sectie ${index + 1}`),
    body: asString(section.body),
    items: asStringArray(section.items),
    imageSlot: ["hero", "story", "detail"].includes(String(section.imageSlot))
      ? (section.imageSlot as "hero" | "story" | "detail")
      : null,
    sourceAssetId: typeof section.sourceAssetId === "string" ? section.sourceAssetId : null,
    visuals: normalizeVisuals(section.visuals),
    layout: allowedLayouts.includes(section.layout as PreviewSection["layout"])
      ? (section.layout as PreviewSection["layout"])
      : "text",
    tone: allowedTones.includes(section.tone as NonNullable<PreviewSection["tone"]>)
      ? (section.tone as NonNullable<PreviewSection["tone"]>)
      : "base",
    emphasis: allowedEmphasis.includes(section.emphasis as NonNullable<PreviewSection["emphasis"]>)
      ? (section.emphasis as NonNullable<PreviewSection["emphasis"]>)
      : "normal",
  };
}

function safePalette(value: unknown): PreviewComposition["design"]["palette"] {
  const palette = value && typeof value === "object"
    ? (value as Partial<PreviewComposition["design"]["palette"]>)
    : {};

  return {
    background: asString(palette.background, DEFAULT_DESIGN.palette.background),
    surface: asString(palette.surface, DEFAULT_DESIGN.palette.surface),
    text: asString(palette.text, DEFAULT_DESIGN.palette.text),
    muted: asString(palette.muted, DEFAULT_DESIGN.palette.muted),
    accent: asString(palette.accent, DEFAULT_DESIGN.palette.accent),
    dark: asString(palette.dark, DEFAULT_DESIGN.palette.dark),
  };
}

function normalizeComposition(value: unknown): PreviewComposition {
  const raw = value && typeof value === "object"
    ? (value as Partial<PreviewComposition>)
    : {};
  const hero: Partial<PreviewComposition["hero"]> =
    raw.hero && typeof raw.hero === "object" ? raw.hero : {};
  const design: Partial<PreviewComposition["design"]> =
    raw.design && typeof raw.design === "object" ? raw.design : {};

  const heroLayouts: PreviewComposition["hero"]["layout"][] = [
    "split", "full", "overlay", "minimal", "image-led", "cinematic", "poster", "editorial",
  ];

  const densities: PreviewComposition["design"]["density"][] = ["airy", "balanced", "compact"];
  const contrasts: PreviewComposition["design"]["contrast"][] = ["soft", "clear", "strong"];
  const imagePresences: PreviewComposition["design"]["imagePresence"][] = ["restrained", "balanced", "dominant"];
  const shapeLanguages: PreviewComposition["design"]["shapeLanguage"][] = ["square", "soft", "mixed"];
  const themes: PreviewComposition["design"]["theme"][] = ["light", "dark", "mixed"];
  const typeCharacters: PreviewComposition["design"]["typeCharacter"][] = ["neutral", "editorial", "technical", "expressive"];
  const heroScales: PreviewComposition["design"]["heroScale"][] = ["restrained", "bold", "cinematic"];
  const sectionTreatments: PreviewComposition["design"]["sectionTreatment"][] = ["open", "panels", "bands", "mixed"];
  const imageTreatments: PreviewComposition["design"]["imageTreatment"][] = ["clean", "documentary", "cinematic", "detail-led"];

  const normalizedDesign: PreviewComposition["design"] = {
    character: asString(design.character, DEFAULT_DESIGN.character),
    density: densities.includes(design.density as PreviewComposition["design"]["density"])
      ? (design.density as PreviewComposition["design"]["density"])
      : DEFAULT_DESIGN.density,
    contrast: contrasts.includes(design.contrast as PreviewComposition["design"]["contrast"])
      ? (design.contrast as PreviewComposition["design"]["contrast"])
      : DEFAULT_DESIGN.contrast,
    imagePresence: imagePresences.includes(design.imagePresence as PreviewComposition["design"]["imagePresence"])
      ? (design.imagePresence as PreviewComposition["design"]["imagePresence"])
      : DEFAULT_DESIGN.imagePresence,
    shapeLanguage: shapeLanguages.includes(design.shapeLanguage as PreviewComposition["design"]["shapeLanguage"])
      ? (design.shapeLanguage as PreviewComposition["design"]["shapeLanguage"])
      : DEFAULT_DESIGN.shapeLanguage,
    theme: themes.includes(design.theme as PreviewComposition["design"]["theme"])
      ? (design.theme as PreviewComposition["design"]["theme"])
      : DEFAULT_DESIGN.theme,
    typeCharacter: typeCharacters.includes(design.typeCharacter as PreviewComposition["design"]["typeCharacter"])
      ? (design.typeCharacter as PreviewComposition["design"]["typeCharacter"])
      : DEFAULT_DESIGN.typeCharacter,
    heroScale: heroScales.includes(design.heroScale as PreviewComposition["design"]["heroScale"])
      ? (design.heroScale as PreviewComposition["design"]["heroScale"])
      : DEFAULT_DESIGN.heroScale,
    sectionTreatment: sectionTreatments.includes(design.sectionTreatment as PreviewComposition["design"]["sectionTreatment"])
      ? (design.sectionTreatment as PreviewComposition["design"]["sectionTreatment"])
      : DEFAULT_DESIGN.sectionTreatment,
    imageTreatment: imageTreatments.includes(design.imageTreatment as PreviewComposition["design"]["imageTreatment"])
      ? (design.imageTreatment as PreviewComposition["design"]["imageTreatment"])
      : DEFAULT_DESIGN.imageTreatment,
    palette: safePalette(design.palette),
    colorDirection: asString(design.colorDirection),
    typographyDirection: asString(design.typographyDirection),
  };

  const sections = Array.isArray(raw.sections)
    ? raw.sections
        .map((section, index) => normalizeSection(section, index))
        .filter((section): section is PreviewSection => section !== null)
    : [];

  const pageHints = Array.isArray(raw.pageHints)
    ? raw.pageHints
        .filter((item): item is { label: string; purpose: string } =>
          Boolean(item) && typeof item === "object" && typeof (item as { label?: unknown }).label === "string"
        )
        .map((item) => ({ label: item.label, purpose: asString(item.purpose) }))
    : [];

  return {
    brandName: asString(raw.brandName),
    navigation: asStringArray(raw.navigation),
    hero: {
      eyebrow: asString(hero.eyebrow),
      title: asString(hero.title, "Welkom"),
      subtitle: asString(hero.subtitle),
      layout: heroLayouts.includes(hero.layout as PreviewComposition["hero"]["layout"])
        ? (hero.layout as PreviewComposition["hero"]["layout"])
        : "split",
      imageSlot: hero.imageSlot === "hero" ? "hero" : null,
      sourceAssetId: typeof hero.sourceAssetId === "string" ? hero.sourceAssetId : null,
      visuals: normalizeVisuals(hero.visuals),
      primaryAction: asString(hero.primaryAction),
    },
    sections,
    design: normalizedDesign,
    pageHints,
    recognitionAnchors: asStringArray(raw.recognitionAnchors),
    doNotChange: asStringArray(raw.doNotChange),
  };
}

export async function createPreviewComposition(
  understanding: LumiveyUnderstanding,
  artDirection: ArtDirection,
  readiness: PreviewReadiness
): Promise<PreviewComposition> {
  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: `
Je bent Lumiveys recognition-first homepage art director en componist.

Je taak is NIET om nette content in een rustige website-template te zetten.
Je ontwerpt een eerste homepage die visueel en inhoudelijk voortkomt uit precies deze ondernemer.

ACCEPTATIELAT
De preview moet het niveau benaderen van een door een goede designer samengestelde concept-homepage: duidelijke art direction, visuele hiërarchie, beeldritme, spanning, herkenning en een eigen wereld. Een generieke Squarespace/Webflow-achtige pagina met veel witruimte en afwisselend tekstblokken is onvoldoende.

De ondernemer moet kunnen denken: "Ja. Dit ben ik."
Niet alleen: "Ja, dit gaat over mijn vak."

REFERENTIEPRINCIPES
- mens en identiteit vóór layout;
- echte beelden vóór gegenereerde vervangers;
- een sterk verhaal mag de visuele richting bepalen;
- een vak met sterk beeldpotentieel moet ook beeldrijk worden vertaald;
- durf full-bleed, cinematic hero, donkere zones, detailgrids, beeldreeksen, asymmetrie en sterke statements te gebruiken wanneer dat past;
- een rustige ondernemer hoeft niet automatisch een lege minimalistische website te krijgen;
- rust kan ook ontstaan door focus, ritme, contrast en gecontroleerde rijkdom.

ANTI-TEMPLATE REGEL
Vermijd de standaardformule: lichte hero + tekstblok + donkere band + tekstblok + lichte sectie.
Gebruik de beschikbare bouwvormen bewust en gevarieerd. Als drie opeenvolgende secties visueel hetzelfde ritme hebben, hercomposeer.

VISUELE VERHALEN
Je kunt per hero en sectie een visuals-array gebruiken. Gebruik die rijkelijk wanneer beeld essentieel is.
- source = echt aangeleverd beeld; gebruik exact bestaande sourceAssetId.
- generated = tijdelijk AI-beeld zonder fictieve herkenbare ondernemer.
- een eigen foto van de ondernemer tijdens echt werk heeft prioriteit als die bruikbaar is.
- generated visuals mogen werkdetails, materiaal, objecten, omgeving, effecten of resultaat tonen.
- genereer NOOIT een herkenbare ondernemer zonder bronfoto.
- gebruik voor beeldrijke cases doorgaans 4-8 visuals over de homepage; voor tekstgedreven cases minder.
- elk beeld moet een andere taak hebben: mens, detail, bewijs, sfeer, resultaat, verhaal, materiaal of context.
- vermijd grote lege placeholders als compositorisch hoofdonderdeel; visualiseer liever meerdere compacte betekenisvolle beelden.

Voor een specialist in autodetailing kan dat bijvoorbeeld betekenen: echte werkfoto als menselijke hero, close-ups van lakdefecten, reflectie/inspectielicht, behandelingsdetail, eindresultaat en een historische/karaktervolle auto als verhaalbeeld — maar alleen als het begrip dat draagt. Kopieer dit voorbeeld niet mechanisch naar andere beroepen.

EIGEN BEELDASSETS
In de preview-context staat BESCHIKBARE EIGEN BEELDASSETS.
Gebruik sourceAssetId exact wanneer een bronbeeld inhoudelijk past. Je mag hetzelfde bronbeeld hoogstens twee keer gebruiken, alleen met een duidelijk andere crop/functie.

STEM EN WAARHEID
Schrijf alsof dit de website van de ondernemer is. Gebruik ik/wij waar natuurlijk.
Bevestigde ondernemersinformatie is leidend. Broninformatie mag niet stilletjes motivatie, trots of kwaliteit worden. Geen generieke marketingclaims zonder grond. Vul onbekenden niet in.

MEERPAGINA
De homepage is een krachtige voordeur, niet de hele website. Gebruik pageHints voor verdieping.

VISUEEL SYSTEEM
Bepaal theme, typeCharacter, heroScale, sectionTreatment, imageTreatment en een concreet HEX-palet. Kies niet automatisch beige/off-white. Bestaande identiteit heeft voorrang.

COMPOSITIE
Gebruik maximaal 7 secties. Kies per sectie layout, tone en emphasis. Beschikbare geavanceerde layouts: split-reverse, statement, manifesto, cards, mosaic, gallery. Hero kan cinematic, poster of editorial zijn.

Geef uitsluitend geldige JSON terug. Geen markdown of uitleg.
`,
    input: `
PREVIEW READINESS:\n${JSON.stringify(readiness, null, 2)}

ART DIRECTION:\n${JSON.stringify(artDirection, null, 2)}

LUMIVEY PREVIEW CONTEXT:\n${formatPreviewContext(understanding)}

Geef exact dit JSON-formaat terug:
{
  "brandName": "",
  "navigation": [],
  "hero": {
    "eyebrow": "",
    "title": "",
    "subtitle": "",
    "layout": "cinematic",
    "imageSlot": null,
    "sourceAssetId": null,
    "visuals": [
      {
        "id": "hero-primary",
        "kind": "source",
        "sourceAssetId": "",
        "purpose": "",
        "subject": "",
        "setting": "",
        "composition": "",
        "atmosphere": "",
        "avoid": [],
        "crop": "wide"
      }
    ],
    "primaryAction": ""
  },
  "sections": [
    {
      "type": "story",
      "eyebrow": "",
      "title": "",
      "body": "",
      "items": [],
      "imageSlot": null,
      "sourceAssetId": null,
      "visuals": [],
      "layout": "mosaic",
      "tone": "dark",
      "emphasis": "strong"
    }
  ],
  "design": {
    "character": "",
    "density": "balanced",
    "contrast": "strong",
    "imagePresence": "dominant",
    "shapeLanguage": "square",
    "theme": "mixed",
    "typeCharacter": "technical",
    "heroScale": "cinematic",
    "sectionTreatment": "mixed",
    "imageTreatment": "cinematic",
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
  "pageHints": [{ "label": "", "purpose": "" }],
  "recognitionAnchors": [],
  "doNotChange": []
}

Regels:
- sourceAssetId alleen vullen met een werkelijk beschikbare sourceId.
- generated visual krijgt sourceAssetId null.
- visual id's moeten uniek zijn.
- voor generated visuals moeten purpose, subject, setting, composition, atmosphere en avoid concreet genoeg zijn voor beeldgeneratie.
- gebruik geldige 6-cijferige HEX-kleuren.
`
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.output_text);
  } catch (error) {
    console.error("Preview composition JSON parse error:", error, response.output_text);
    parsed = {};
  }

  return normalizeComposition(parsed);
}
