import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ImageBriefItem = {
  purpose: string;
  subject: string;
  setting: string;
  composition: string;
  atmosphere: string;
  avoid: string[];
};

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

const PERSON_REQUEST_KEYWORDS = [
  "portret",
  "portrait",
  "headshot",
  "profielportret",
  "gezicht",
  "face",
  "ondernemer",
  "eigenaar",
  "oprichter",
  "medewerker",
  "persoon",
  "person",
  "team",
  "in gesprek",
  "gesprek met",
  "aan het werk",
  "werkmoment",
  "werkbeeld",
  "kijkend",
  "lachend",
  "pose",
  "poserend",
  "interview",
  "consultant in beeld",
  "de ondernemer",
  "de eigenaar",
  "de oprichter",
];

const SAFE_MODE_AVOID = [
  "herkenbaar gezicht",
  "herkenbare ondernemer",
  "fictief portret",
  "headshot",
  "portretfoto",
  "gegenereerde identiteit",
  "persoon recht in camera",
  "geposeerde persoon",
];

function sanitizeNamedPeople(input: string): string {
  let output = input;

  // Vervang twee- of meerledige eigennamen, zoals "Adrie Pouwer"
  output = output.replace(
    /\b[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’-]+(?:\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’-]+)+\b/g,
    "de ondernemer"
  );

  // Extra afzwakken van persoonsgerichte formuleringen
  output = output.replace(/\bportret van\b/gi, "weergave van");
  output = output.replace(/\bportret\b/gi, "beeld");
  output = output.replace(/\bheadshot\b/gi, "beeld");
  output = output.replace(/\bwerkmoment\b/gi, "werksituatie");

  return output.trim();
}

function isRecognizablePersonRequest(brief: ImageBriefItem): boolean {
  const combined = normalize(
    [
      brief.purpose,
      brief.subject,
      brief.setting,
      brief.composition,
      brief.atmosphere,
      ...brief.avoid,
    ].join(" ")
  );

  return containsAny(combined, PERSON_REQUEST_KEYWORDS);
}

function buildSafeBrief(brief: ImageBriefItem): ImageBriefItem {
  const mergedContext = sanitizeNamedPeople(
    [brief.subject, brief.setting, brief.composition]
      .filter(Boolean)
      .join(" ")
  );

  return {
    purpose:
      "Tijdelijk websitebeeld dat het werkveld geloofwaardig vertegenwoordigt zonder een herkenbare persoon te tonen.",
    subject:
      "Geen portret en geen herkenbare ondernemer. Toon in plaats daarvan een waarheidsgetrouw alternatief dat past bij het werkveld, zoals de werkomgeving, gereedschap, materiaal, een product, documentatie, een werktafel, een relevant detail of anonieme handen tijdens een handeling.",
    setting: mergedContext,
    composition:
      "Rustige, geloofwaardige compositie. Geen herkenbaar gezicht. Geen persoon die bedoeld lijkt als de echte ondernemer. Kies een inhoudelijk passend alternatief zonder fictieve identiteit.",
    atmosphere: sanitizeNamedPeople(brief.atmosphere),
    avoid: Array.from(new Set([...brief.avoid, ...SAFE_MODE_AVOID])),
  };
}

function buildPrompt(
  brief: ImageBriefItem,
  safeMode: boolean
): string {
  const avoidLines =
    brief.avoid.length > 0
      ? brief.avoid.map((item) => `- ${item}`).join("\n")
      : "- niets opgegeven";

  return `
Je maakt een tijdelijke, fotorealistische websitefoto voor een Lumivey-preview.

KERNTAAK
Maak één geloofwaardig beeld dat inhoudelijk past bij de websitecontext en bruikbaar is als hoogwaardige tijdelijke preview-afbeelding.

ABSOLUTE WAARHEIDSREGEL
Genereer NOOIT een fictieve ondernemer, opdrachtgever, medewerker of andere herkenbare persoon alsof dit een werkelijk bestaande persoon uit de briefing is.

Deze regel gaat vóór alle andere instructies.

${
  safeMode
    ? `
SAFE MODE IS ACTIEF
De oorspronkelijke briefing vroeg expliciet of impliciet om een echte, herkenbare persoon, maar er is GEEN echte referentiefoto meegegeven.

Daarom gelden nu deze verplichte regels:
- Genereer GEEN portret.
- Genereer GEEN headshot.
- Genereer GEEN herkenbaar gezicht.
- Genereer GEEN fictieve ondernemer alsof dat de genoemde persoon is.
- Genereer GEEN persoon die de indruk wekt: "dit is de echte ondernemer".

Wat je WEL mag tonen:
- de relevante werkomgeving;
- gereedschap, materialen of producten;
- documentatie;
- een werktafel;
- een technische installatie;
- een interieur- of vakdetail;
- anonieme handen tijdens een handeling;
- alleen indien functioneel nodig: een persoon van achteren, buiten focus of onherkenbaar.

Kies automatisch het best passende, waarheidsgetrouwe alternatief.
`
    : `
Als de briefing geen herkenbare echte persoon vereist, maak dan gewoon het best passende geloofwaardige beeld.
`
}

BEELDBRIEFING

DOEL
${brief.purpose}

ONDERWERP
${brief.subject}

OMGEVING
${brief.setting}

COMPOSITIE
${brief.composition}

SFEER
${brief.atmosphere}

VERMIJD
${avoidLines}

ALGEMENE BEELDREGELS
- Fotorealistische fotografie.
- Geloofwaardig natuurlijk licht.
- Rustige, hoogwaardige website-uitstraling.
- Geen tekst, logo's of watermerken in het beeld.
- Geen generieke stockfotografie-uitstraling.
- Geen overdreven reclame-esthetiek.
- Geen onnodig geposeerde mensen.
- Geen fictieve identiteit.
- Geen herkenbare ondernemer zonder echte aangeleverde referentiefoto.
- Het beeld moet inhoudelijk aansluiten op het echte werk en de context uit de briefing.
`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const rawBrief = body?.brief;

    if (!rawBrief || typeof rawBrief !== "object") {
      return NextResponse.json(
        {
          error: "Geen beeldbriefing ontvangen.",
        },
        {
          status: 400,
        }
      );
    }

    const brief: ImageBriefItem = {
      purpose: asText(rawBrief.purpose),
      subject: asText(rawBrief.subject),
      setting: asText(rawBrief.setting),
      composition: asText(rawBrief.composition),
      atmosphere: asText(rawBrief.atmosphere),
      avoid: asStringArray(rawBrief.avoid),
    };

    if (
      !brief.purpose &&
      !brief.subject &&
      !brief.setting &&
      !brief.composition &&
      !brief.atmosphere
    ) {
      return NextResponse.json(
        {
          error: "De beeldbriefing is leeg.",
        },
        {
          status: 400,
        }
      );
    }

    const safeMode = isRecognizablePersonRequest(brief);
    const effectiveBrief = safeMode ? buildSafeBrief(brief) : brief;
    const prompt = buildPrompt(effectiveBrief, safeMode);

    const result = await openai.images.generate({
      model: "gpt-image-2",
      prompt,
      size: "1024x1536",
      quality: "medium",
    });

    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      throw new Error("Geen afbeelding ontvangen.");
    }

    return NextResponse.json({
      image: `data:image/png;base64,${imageBase64}`,
      safeMode,
    });
  } catch (error) {
    console.error("Image generation error:", error);

    return NextResponse.json(
      {
        error: "De afbeelding kon niet worden gemaakt.",
      },
      {
        status: 500,
      }
    );
  }
}