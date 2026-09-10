import OpenAI from "openai";
import type { LumiveyUnderstanding } from "@/lib/lumivey/understanding";
import type { PreviewComposition, PreviewVisual } from "@/lib/lumivey/preview-composition";
import { formatPreviewContext } from "@/lib/lumivey/preview-context";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type SectionPatch = {
  index: number;
  eyebrow?: string;
  title?: string;
  body?: string;
  items?: string[];
};

type VisualPatch = {
  id: string;
  purpose?: string;
  subject?: string;
  setting?: string;
  composition?: string;
  atmosphere?: string;
  avoid?: string[];
};

type QualityPatch = {
  hero?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    primaryAction?: string;
  };
  sections?: SectionPatch[];
  visuals?: VisualPatch[];
};

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function strings(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

function parsePatch(value: unknown): QualityPatch {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;

  const heroRaw = raw.hero && typeof raw.hero === "object" ? raw.hero as Record<string, unknown> : undefined;
  const hero = heroRaw ? {
    eyebrow: text(heroRaw.eyebrow),
    title: text(heroRaw.title),
    subtitle: text(heroRaw.subtitle),
    primaryAction: text(heroRaw.primaryAction),
  } : undefined;

  const sections = Array.isArray(raw.sections)
    ? raw.sections.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const section = item as Record<string, unknown>;
        if (typeof section.index !== "number" || !Number.isInteger(section.index)) return [];
        return [{
          index: section.index,
          eyebrow: text(section.eyebrow),
          title: text(section.title),
          body: text(section.body),
          items: strings(section.items),
        } satisfies SectionPatch];
      })
    : undefined;

  const visuals = Array.isArray(raw.visuals)
    ? raw.visuals.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const visual = item as Record<string, unknown>;
        const id = text(visual.id);
        if (!id) return [];
        return [{
          id,
          purpose: text(visual.purpose),
          subject: text(visual.subject),
          setting: text(visual.setting),
          composition: text(visual.composition),
          atmosphere: text(visual.atmosphere),
          avoid: strings(visual.avoid),
        } satisfies VisualPatch];
      })
    : undefined;

  return { hero, sections, visuals };
}

function patchVisual(visual: PreviewVisual, patch?: VisualPatch): PreviewVisual {
  if (!patch) return visual;
  return {
    ...visual,
    purpose: patch.purpose ?? visual.purpose,
    subject: patch.subject ?? visual.subject,
    setting: patch.setting ?? visual.setting,
    composition: patch.composition ?? visual.composition,
    atmosphere: patch.atmosphere ?? visual.atmosphere,
    avoid: patch.avoid ?? visual.avoid,
  };
}

export async function refinePreviewQuality(
  understanding: LumiveyUnderstanding,
  composition: PreviewComposition
): Promise<PreviewComposition> {
  try {
    const response = await openai.responses.create({
      model: "gpt-5.6-terra",
      instructions: `
Je bent de laatste kwaliteitsredacteur en visual director van een Lumivey-preview.

Je HERONTWERPT de pagina niet. Je corrigeert alleen de laatste 10-15% zodat de reeds gekozen compositie scherper, menselijker en doelgerichter wordt.

ABSOLUUT
- Voeg GEEN nieuwe feiten, diensten, resultaten, merken, contactgegevens of claims toe.
- Houd alles aantoonbaar binnen het meegeleverde Lumivey-begrip.
- Bewaar de gekozen layout, kleuren, volgorde, sourceAssetId's, aantal secties en visual kind/crop.
- Schrijf in de stem van de ondernemer; vermijd tekst die klinkt alsof Lumivey OVER hem schrijft.

COPY-KWALITEIT
- Korter en trefzekerder waar mogelijk.
- Geen lege marketingzinnen, managementtaal of AI-achtige slogans.
- Vermijd herhaling van dezelfde gedachte in hero en secties.
- Een sterke kop mag compact en eigen zijn, maar niet bedacht klinken.
- CTA's concreet en rustig.
- Gebruik bevestigde concrete vaktaal wanneer die in het begrip aanwezig is. Vervang specifieke handelingen, problemen, materialen of controles niet door vage woorden als aandacht, kwaliteit, vakmanschap of resultaat.
- Laat minstens één sectie bij een vakinhoudelijke ondernemer concreet bewijzen WAT hij doet of WAAR hij op let, wanneer het begrip daarvoor voldoende feiten bevat.
- Een persoonlijk oorsprongsverhaal mag emotioneel dragen, maar hoeft niet in meerdere secties opnieuw uitgelegd te worden.

VISUELE FUNCTIE
Beoordeel alleen de GENERATED visuals. Iedere visual moet één duidelijke eigen taak hebben: mens/context, materiaal, technisch detail, probleem/bewijs, werkwijze, resultaat of verhaal.
- voorkom meerdere beelden die feitelijk hetzelfde laten zien;
- maak subject/composition specifieker als twee beelden te veel op elkaar lijken;
- koppel een probleem/bewijs-beeld alleen aan een concreet bevestigd probleem of inspectiepunt uit het begrip;
- koppel een werkwijze-beeld alleen aan een concreet bevestigde handeling, materiaalkeuze of controle;
- laat resultaatbeelden zien wat visueel waarneembaar mag zijn zonder onbevestigde prestatieretoriek;
- laat beeldbrieven aansluiten op de identiteit en het vak, niet op generieke stockfotografie;
- source visuals nooit veranderen of vervangen;
- geen herkenbare fictieve ondernemer of medewerker genereren.

COMPOSITIE-HYGIENE
Je kunt de layout niet veranderen, maar voorkom tekst die door zijn lengte waarschijnlijk met beelden gaat botsen.
- Houd koppen in beeldrijke split/mosaic/gallery-secties bij voorkeur compact: meestal 3-8 woorden.
- Verplaats nuance naar bodytekst in plaats van een extreem lange kop.
- Laat twee naast elkaar liggende tekst- en beeldonderdelen ieder ademruimte houden.

CONTRAST
Je kunt geen CSS wijzigen. Zorg daarom dat de tekstinhoud niet afhankelijk is van een subtiele kleurtruc. De renderer bewaakt technisch leesbaar contrast.

Geef uitsluitend JSON terug met ALLEEN wijzigingen. Geen markdown, geen uitleg.
`,
      input: `
LUMIVEY-BEGRIP:
${formatPreviewContext(understanding)}

HUIDIGE COMPOSITIE:
${JSON.stringify(composition, null, 2)}

Geef uitsluitend dit patch-formaat terug:
{
  "hero": {
    "eyebrow": "alleen als wijzigen",
    "title": "alleen als wijzigen",
    "subtitle": "alleen als wijzigen",
    "primaryAction": "alleen als wijzigen"
  },
  "sections": [
    {
      "index": 0,
      "eyebrow": "alleen als wijzigen",
      "title": "alleen als wijzigen",
      "body": "alleen als wijzigen",
      "items": ["alleen als de bestaande items echt aangescherpt moeten worden"]
    }
  ],
  "visuals": [
    {
      "id": "bestaande-visual-id",
      "purpose": "alleen als wijzigen",
      "subject": "alleen als wijzigen",
      "setting": "alleen als wijzigen",
      "composition": "alleen als wijzigen",
      "atmosphere": "alleen als wijzigen",
      "avoid": ["alleen als wijzigen"]
    }
  ]
}

Laat ongewijzigde velden of objecten volledig weg.
`
    });

    const patch = parsePatch(JSON.parse(response.output_text));
    const visualPatches = new Map((patch.visuals ?? []).map((item) => [item.id, item]));
    const sectionPatches = new Map((patch.sections ?? []).map((item) => [item.index, item]));

    return {
      ...composition,
      hero: {
        ...composition.hero,
        eyebrow: patch.hero?.eyebrow ?? composition.hero.eyebrow,
        title: patch.hero?.title ?? composition.hero.title,
        subtitle: patch.hero?.subtitle ?? composition.hero.subtitle,
        primaryAction: patch.hero?.primaryAction ?? composition.hero.primaryAction,
        visuals: composition.hero.visuals?.map((visual) =>
          visual.kind === "generated" ? patchVisual(visual, visualPatches.get(visual.id)) : visual
        ),
      },
      sections: composition.sections.map((section, index) => {
        const sectionPatch = sectionPatches.get(index);
        return {
          ...section,
          eyebrow: sectionPatch?.eyebrow ?? section.eyebrow,
          title: sectionPatch?.title ?? section.title,
          body: sectionPatch?.body ?? section.body,
          items: sectionPatch?.items ?? section.items,
          visuals: section.visuals?.map((visual) =>
            visual.kind === "generated" ? patchVisual(visual, visualPatches.get(visual.id)) : visual
          ),
        };
      }),
    };
  } catch (error) {
    console.error("Preview quality refinement failed; using original composition:", error);
    return composition;
  }
}
