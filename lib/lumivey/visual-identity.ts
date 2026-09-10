import OpenAI from "openai";
import type { LumiveyUnderstanding } from "@/lib/lumivey/understanding";
import type { PreviewComposition, PreviewSection } from "@/lib/lumivey/preview-composition";
import { formatPreviewContext } from "@/lib/lumivey/preview-context";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type IdentityPatch = {
  theme?: PreviewComposition["design"]["theme"];
  typeCharacter?: PreviewComposition["design"]["typeCharacter"];
  heroScale?: PreviewComposition["design"]["heroScale"];
  sectionTreatment?: PreviewComposition["design"]["sectionTreatment"];
  imageTreatment?: PreviewComposition["design"]["imageTreatment"];
  shapeLanguage?: PreviewComposition["design"]["shapeLanguage"];
  density?: PreviewComposition["design"]["density"];
  contrast?: PreviewComposition["design"]["contrast"];
  imagePresence?: PreviewComposition["design"]["imagePresence"];
  palette?: Partial<PreviewComposition["design"]["palette"]>;
  colorDirection?: string;
  typographyDirection?: string;
  character?: string;
  heroLayout?: PreviewComposition["hero"]["layout"];
  sections?: Array<{
    index: number;
    layout?: PreviewSection["layout"];
    tone?: NonNullable<PreviewSection["tone"]>;
    emphasis?: NonNullable<PreviewSection["emphasis"]>;
  }>;
};

const themes: PreviewComposition["design"]["theme"][] = ["light", "dark", "mixed"];
const typeCharacters: PreviewComposition["design"]["typeCharacter"][] = ["neutral", "editorial", "technical", "expressive"];
const heroScales: PreviewComposition["design"]["heroScale"][] = ["restrained", "bold", "cinematic"];
const sectionTreatments: PreviewComposition["design"]["sectionTreatment"][] = ["open", "panels", "bands", "mixed"];
const imageTreatments: PreviewComposition["design"]["imageTreatment"][] = ["clean", "documentary", "cinematic", "detail-led"];
const shapeLanguages: PreviewComposition["design"]["shapeLanguage"][] = ["square", "soft", "mixed"];
const densities: PreviewComposition["design"]["density"][] = ["airy", "balanced", "compact"];
const contrasts: PreviewComposition["design"]["contrast"][] = ["soft", "clear", "strong"];
const imagePresences: PreviewComposition["design"]["imagePresence"][] = ["restrained", "balanced", "dominant"];
const heroLayouts: PreviewComposition["hero"]["layout"][] = ["split", "full", "overlay", "minimal", "image-led", "cinematic", "poster", "editorial"];
const layouts: PreviewSection["layout"][] = ["text", "split", "grid", "feature", "list", "split-reverse", "statement", "manifesto", "cards", "mosaic", "gallery"];
const tones: NonNullable<PreviewSection["tone"]>[] = ["base", "surface", "accent", "dark"];
const emphases: NonNullable<PreviewSection["emphasis"]>[] = ["quiet", "normal", "strong", "heroic"];

function isHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value);
}

function parsePatch(value: unknown, sectionCount: number): IdentityPatch {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  const design = raw.design && typeof raw.design === "object" ? raw.design as Record<string, unknown> : {};
  const paletteRaw = design.palette && typeof design.palette === "object" ? design.palette as Record<string, unknown> : {};

  const palette: Partial<PreviewComposition["design"]["palette"]> = {};
  for (const key of ["background", "surface", "text", "muted", "accent", "dark"] as const) {
    if (isHex(paletteRaw[key])) palette[key] = paletteRaw[key] as string;
  }

  const sections = Array.isArray(raw.sections)
    ? raw.sections.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const index = Number(row.index);
        if (!Number.isInteger(index) || index < 0 || index >= sectionCount) return [];
        return [{
          index,
          layout: layouts.includes(row.layout as PreviewSection["layout"]) ? row.layout as PreviewSection["layout"] : undefined,
          tone: tones.includes(row.tone as NonNullable<PreviewSection["tone"]>) ? row.tone as NonNullable<PreviewSection["tone"]> : undefined,
          emphasis: emphases.includes(row.emphasis as NonNullable<PreviewSection["emphasis"]>) ? row.emphasis as NonNullable<PreviewSection["emphasis"]> : undefined,
        }];
      })
    : undefined;

  return {
    theme: themes.includes(design.theme as PreviewComposition["design"]["theme"]) ? design.theme as PreviewComposition["design"]["theme"] : undefined,
    typeCharacter: typeCharacters.includes(design.typeCharacter as PreviewComposition["design"]["typeCharacter"]) ? design.typeCharacter as PreviewComposition["design"]["typeCharacter"] : undefined,
    heroScale: heroScales.includes(design.heroScale as PreviewComposition["design"]["heroScale"]) ? design.heroScale as PreviewComposition["design"]["heroScale"] : undefined,
    sectionTreatment: sectionTreatments.includes(design.sectionTreatment as PreviewComposition["design"]["sectionTreatment"]) ? design.sectionTreatment as PreviewComposition["design"]["sectionTreatment"] : undefined,
    imageTreatment: imageTreatments.includes(design.imageTreatment as PreviewComposition["design"]["imageTreatment"]) ? design.imageTreatment as PreviewComposition["design"]["imageTreatment"] : undefined,
    shapeLanguage: shapeLanguages.includes(design.shapeLanguage as PreviewComposition["design"]["shapeLanguage"]) ? design.shapeLanguage as PreviewComposition["design"]["shapeLanguage"] : undefined,
    density: densities.includes(design.density as PreviewComposition["design"]["density"]) ? design.density as PreviewComposition["design"]["density"] : undefined,
    contrast: contrasts.includes(design.contrast as PreviewComposition["design"]["contrast"]) ? design.contrast as PreviewComposition["design"]["contrast"] : undefined,
    imagePresence: imagePresences.includes(design.imagePresence as PreviewComposition["design"]["imagePresence"]) ? design.imagePresence as PreviewComposition["design"]["imagePresence"] : undefined,
    palette,
    colorDirection: typeof design.colorDirection === "string" ? design.colorDirection : undefined,
    typographyDirection: typeof design.typographyDirection === "string" ? design.typographyDirection : undefined,
    character: typeof design.character === "string" ? design.character : undefined,
    heroLayout: heroLayouts.includes(raw.heroLayout as PreviewComposition["hero"]["layout"]) ? raw.heroLayout as PreviewComposition["hero"]["layout"] : undefined,
    sections,
  };
}

export async function applyVisualIdentity(
  understanding: LumiveyUnderstanding,
  composition: PreviewComposition
): Promise<PreviewComposition> {
  try {
    const response = await openai.responses.create({
      model: "gpt-5.6-terra",
      instructions: `
Je bent Lumiveys visual-identity director. Je krijgt een bestaande homepagecompositie en het echte begrip van de ondernemer.

Je taak is NIET om een nieuw template te kiezen. Je moet één samenhangende visuele taal over de hele homepage leggen, zodat kleur, typografie, fotografie, ritme en compositie elkaar versterken.

HOOFDREGEL
De pagina moet voelen als één ontworpen geheel, niet als losse blokken onder elkaar.

WERKWIJZE
- Haal 3-5 visuele motieven uit het begrip en bronmateriaal: bijvoorbeeld een dominante kleur uit eigen foto's, materiaal, omgeving, persoonlijkheid, vakritme of herkenningsanker.
- Laat die motieven door de hele pagina terugkomen via palette, contrast, typografisch karakter, beeldbehandeling en sectieritme.
- Gebruik accentkleur als vocabulaire, niet alleen als groot achtergrondvlak.
- Beeldrijke ondernemers mogen beeldclusters, split-composities en gallery/mosaic krijgen.
- Rustige ondernemers mogen stilte en asymmetrie krijgen zonder automatisch beige/minimalistisch te worden.
- Creatieve/sociale ondernemingen mogen speelser zijn zonder druk of goedkoop te worden.
- Technische ondernemingen mogen preciezer zijn zonder overal hoofdletters en zwarte vlakken te krijgen.

BRONBEELDEN
Eigen foto's zijn identiteit, geen decoratie. Laat ze leidend zijn wanneer ze mensen, werkplek, pand, voertuig, project of herkenbare sfeer tonen. Een AI-beeld mag ondersteunen, maar niet een sterk eigen beeld wegdrukken.

ANTI-BLOKKEN
- Vermijd meer dan twee zware full-width kleurwissels op de homepage.
- Kies bij voorkeur open/mixed boven bands wanneer inhoud en beelden dat toelaten.
- Gebruik niet drie opeenvolgende secties met dezelfde visuele grammatica.
- Laat minstens twee beeldrijke secties werken als geïntegreerde compositie (split, mosaic, gallery, feature) wanneer er genoeg beelden zijn.

WAARHEID
Geen feiten of tekst wijzigen. Alleen visuele systeemkeuzes.

Geef uitsluitend JSON terug.
`,
      input: `
LUMIVEY-BEGRIP:\n${formatPreviewContext(understanding)}

HUIDIGE COMPOSITIE:\n${JSON.stringify({
        design: composition.design,
        hero: { layout: composition.hero.layout, visualCount: composition.hero.visuals?.length ?? 0 },
        sections: composition.sections.map((section, index) => ({
          index,
          type: section.type,
          layout: section.layout,
          tone: section.tone,
          emphasis: section.emphasis,
          visualCount: section.visuals?.length ?? 0,
          sourceCount: section.visuals?.filter((visual) => visual.kind === "source").length ?? 0,
          itemCount: section.items?.length ?? 0,
        })),
      }, null, 2)}

Geef dit formaat terug:
{
  "design": {
    "character": "",
    "theme": "light|dark|mixed",
    "typeCharacter": "neutral|editorial|technical|expressive",
    "heroScale": "restrained|bold|cinematic",
    "sectionTreatment": "open|panels|bands|mixed",
    "imageTreatment": "clean|documentary|cinematic|detail-led",
    "shapeLanguage": "square|soft|mixed",
    "density": "airy|balanced|compact",
    "contrast": "soft|clear|strong",
    "imagePresence": "restrained|balanced|dominant",
    "palette": {
      "background": "#000000",
      "surface": "#000000",
      "text": "#000000",
      "muted": "#000000",
      "accent": "#000000",
      "dark": "#000000"
    },
    "colorDirection": "",
    "typographyDirection": ""
  },
  "heroLayout": "cinematic|poster|editorial|split|full|overlay|minimal|image-led",
  "sections": [
    { "index": 0, "layout": "split", "tone": "base", "emphasis": "normal" }
  ]
}
`
    });

    const patch = parsePatch(JSON.parse(response.output_text), composition.sections.length);
    const sectionMap = new Map((patch.sections ?? []).map((item) => [item.index, item]));

    return {
      ...composition,
      hero: {
        ...composition.hero,
        layout: patch.heroLayout ?? composition.hero.layout,
      },
      sections: composition.sections.map((section, index) => {
        const row = sectionMap.get(index);
        return {
          ...section,
          layout: row?.layout ?? section.layout,
          tone: row?.tone ?? section.tone,
          emphasis: row?.emphasis ?? section.emphasis,
        };
      }),
      design: {
        ...composition.design,
        character: patch.character ?? composition.design.character,
        theme: patch.theme ?? composition.design.theme,
        typeCharacter: patch.typeCharacter ?? composition.design.typeCharacter,
        heroScale: patch.heroScale ?? composition.design.heroScale,
        sectionTreatment: patch.sectionTreatment ?? composition.design.sectionTreatment,
        imageTreatment: patch.imageTreatment ?? composition.design.imageTreatment,
        shapeLanguage: patch.shapeLanguage ?? composition.design.shapeLanguage,
        density: patch.density ?? composition.design.density,
        contrast: patch.contrast ?? composition.design.contrast,
        imagePresence: patch.imagePresence ?? composition.design.imagePresence,
        palette: { ...composition.design.palette, ...(patch.palette ?? {}) },
        colorDirection: patch.colorDirection ?? composition.design.colorDirection,
        typographyDirection: patch.typographyDirection ?? composition.design.typographyDirection,
      },
    };
  } catch (error) {
    console.error("Visual identity pass failed; using existing composition:", error);
    return composition;
  }
}
