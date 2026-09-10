import OpenAI from "openai";
import type { LumiveyUnderstanding } from "@/lib/lumivey/understanding";
import type { PreviewComposition, PreviewSection } from "@/lib/lumivey/preview-composition";
import { formatPreviewContext } from "@/lib/lumivey/preview-context";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type SectionDirection = {
  index: number;
  layout?: PreviewSection["layout"];
  tone?: NonNullable<PreviewSection["tone"]>;
  emphasis?: NonNullable<PreviewSection["emphasis"]>;
};

type ChoreographyPatch = {
  heroLayout?: PreviewComposition["hero"]["layout"];
  sectionTreatment?: PreviewComposition["design"]["sectionTreatment"];
  orderedIndices?: number[];
  sections?: SectionDirection[];
};

const sectionLayouts: PreviewSection["layout"][] = [
  "text", "split", "grid", "feature", "list", "split-reverse",
  "statement", "manifesto", "cards", "mosaic", "gallery",
];
const sectionTones: NonNullable<PreviewSection["tone"]>[] = ["base", "surface", "accent", "dark"];
const emphases: NonNullable<PreviewSection["emphasis"]>[] = ["quiet", "normal", "strong", "heroic"];
const heroLayouts: PreviewComposition["hero"]["layout"][] = [
  "split", "full", "overlay", "minimal", "image-led", "cinematic", "poster", "editorial",
];
const treatments: PreviewComposition["design"]["sectionTreatment"][] = ["open", "panels", "bands", "mixed"];

function parsePatch(value: unknown, sectionCount: number): ChoreographyPatch {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;

  const heroLayout = heroLayouts.includes(raw.heroLayout as PreviewComposition["hero"]["layout"])
    ? raw.heroLayout as PreviewComposition["hero"]["layout"]
    : undefined;
  const sectionTreatment = treatments.includes(raw.sectionTreatment as PreviewComposition["design"]["sectionTreatment"])
    ? raw.sectionTreatment as PreviewComposition["design"]["sectionTreatment"]
    : undefined;

  const orderedIndices = Array.isArray(raw.orderedIndices)
    ? raw.orderedIndices.filter((v): v is number => Number.isInteger(v) && Number(v) >= 0 && Number(v) < sectionCount)
    : undefined;

  const sections = Array.isArray(raw.sections)
    ? raw.sections.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        if (!Number.isInteger(row.index) || Number(row.index) < 0 || Number(row.index) >= sectionCount) return [];
        return [{
          index: Number(row.index),
          layout: sectionLayouts.includes(row.layout as PreviewSection["layout"])
            ? row.layout as PreviewSection["layout"] : undefined,
          tone: sectionTones.includes(row.tone as NonNullable<PreviewSection["tone"]>)
            ? row.tone as NonNullable<PreviewSection["tone"]> : undefined,
          emphasis: emphases.includes(row.emphasis as NonNullable<PreviewSection["emphasis"]>)
            ? row.emphasis as NonNullable<PreviewSection["emphasis"]> : undefined,
        } satisfies SectionDirection];
      })
    : undefined;

  return { heroLayout, sectionTreatment, orderedIndices, sections };
}

function validOrder(indices: number[] | undefined, count: number): indices is number[] {
  if (!indices || indices.length !== count) return false;
  return new Set(indices).size === count && indices.every((n) => n >= 0 && n < count);
}

export async function choreographPreviewPage(
  understanding: LumiveyUnderstanding,
  composition: PreviewComposition
): Promise<PreviewComposition> {
  try {
    const sectionSummary = composition.sections.map((section, index) => ({
      index,
      type: section.type,
      title: section.title,
      layout: section.layout,
      tone: section.tone,
      emphasis: section.emphasis,
      visualCount: section.visuals?.length ?? 0,
      hasSourceImage: Boolean(section.sourceAssetId || section.visuals?.some((visual) => visual.kind === "source")),
      itemCount: section.items?.length ?? 0,
    }));

    const response = await openai.responses.create({
      model: "gpt-5.6-terra",
      instructions: `
Je bent de page choreographer van Lumivey.

De inhoud, waarheid, beelden en identiteit zijn al gekozen. Jouw taak is om van losse secties één doorlopende homepage te maken die als geheel praat.

Je verandert GEEN tekst, feiten, visual briefs, kleuren of bronassets. Je regisseert alleen de beweging over de hele pagina: volgorde, hero-vorm, sectionTreatment, layout, tone en emphasis.

DOEL
- voorkom een stapel losse blokken onder elkaar;
- laat secties visueel op elkaar reageren;
- wissel schaal, ritme, dichtheid en beeld/text-relatie bewust af;
- laat een belangrijk verhaal of herkenningsanker op het juiste moment landen;
- gebruik donkere/licht/accent-zones als onderdeel van één ritme, niet als willekeurige stroken;
- laat beeldrijke secties rijk zijn en tekstgedreven momenten juist ademhalen;
- voorkom drie opeenvolgende secties met hetzelfde layout-ritme;
- niet iedere sectie hoeft een eigen gekleurd vlak te zijn;
- een homepage mag aanvoelen als één art-directed canvas.

REFERENTIEPRINCIPE
De sterke Lumivey-referentiepreviews voelen niet als 'hero + blok + blok + blok'. Kleur, beeld, typografie en ritme keren terug en verbinden onderdelen. Maak dat principe mogelijk zonder een referentie letterlijk na te bouwen.

PERSOONLIJKE EIGENHEID
- technische ondernemer: mag preciezer, ritmischer en beeldgedreven zijn;
- rustige adviseur: mag meer stilte, asymmetrie en editorial adem hebben;
- sociale/creatieve zaak: mag speelser, warmer en dynamischer zijn;
Maar baseer dit altijd op het echte begrip hieronder; geen beroepstemplate.

Geef uitsluitend JSON terug. Geen uitleg.
`,
      input: `
LUMIVEY-BEGRIP:
${formatPreviewContext(understanding)}

GLOBAAL DESIGN:
${JSON.stringify(composition.design, null, 2)}

HERO:
${JSON.stringify({ layout: composition.hero.layout, title: composition.hero.title, visualCount: composition.hero.visuals?.length ?? 0 }, null, 2)}

SECTIES:
${JSON.stringify(sectionSummary, null, 2)}

Geef exact dit patch-formaat terug:
{
  "heroLayout": "cinematic|poster|editorial|split|full|overlay|minimal|image-led",
  "sectionTreatment": "open|panels|bands|mixed",
  "orderedIndices": [0,1,2],
  "sections": [
    { "index": 0, "layout": "mosaic", "tone": "base", "emphasis": "strong" }
  ]
}

Regels:
- orderedIndices moet iedere bestaande sectie exact één keer bevatten;
- verander niets inhoudelijks;
- kies layouts die passen bij werkelijk aanwezige beelden/items;
- gebruik heroic spaarzaam: maximaal 1-2 secties;
- gebruik accent/dark als terugkerend ritme, niet automatisch om en om;
`
    });

    const patch = parsePatch(JSON.parse(response.output_text), composition.sections.length);
    const directionMap = new Map((patch.sections ?? []).map((item) => [item.index, item]));
    const ordered = validOrder(patch.orderedIndices, composition.sections.length)
      ? patch.orderedIndices
      : composition.sections.map((_, index) => index);

    const sections = ordered.map((originalIndex) => {
      const section = composition.sections[originalIndex];
      const direction = directionMap.get(originalIndex);
      return {
        ...section,
        layout: direction?.layout ?? section.layout,
        tone: direction?.tone ?? section.tone,
        emphasis: direction?.emphasis ?? section.emphasis,
      };
    });

    return {
      ...composition,
      hero: {
        ...composition.hero,
        layout: patch.heroLayout ?? composition.hero.layout,
      },
      sections,
      design: {
        ...composition.design,
        sectionTreatment: patch.sectionTreatment ?? composition.design.sectionTreatment,
      },
    };
  } catch (error) {
    console.error("Page choreography failed; using original composition:", error);
    return composition;
  }
}
