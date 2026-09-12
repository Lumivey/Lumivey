import OpenAI from "openai";
import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ReplayTurn = {
  turn: number;
  user: string;
  assistant: string;
  referenceExpectation: string;
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MICHAEL_TURNS = [
  "Het is hier avond. Werken jullie in het buitenland? Ik wil een website hebben want ik wil klanten hebben.",
  "Nog niet een bedrijf. Ik ben student en ik wil bijverdienen.",
  "Luxe auto's en sportwagens wassen, detailleren, poetsen. Maar dan op een hele goede manier met topproducten. Ik gebruik alleen Meguiars uit America. Diep reinigen, kleien en polijsten, en een harde was laag. Kan ook met een wetlook als de klant dat wil. Maar ik wil alleen maar het topsegment doe.",
  "Mijn vader heeft een oude Porsche 356 en daar is het mee begonnen.",
  "Haha een wasstraat? Daar krijg je alleen maar swirls van in je lak. Nooit doen!",
];

const REFERENCE_EXPECTATIONS = [
  "Beantwoordt de concrete vraag eerst volgens de huidige productwaarheid: Lumivey richt zich in deze fase op Nederland. Gaat daarna zonder intake-modus naar wat voor bedrijf/werk de ondernemer wil doen.",
  "Laat de oppervlakkige wens 'klanten krijgen' los en vraagt wat de student voor klanten wil gaan doen.",
  "Herkent dat topsegment/detailing méér is dan zomaar bijverdienen en opent een concrete oorsprongsdeur: waar begon die fascinatie, welke auto/ervaring/persoon zette dit in gang? Een algemene smaakvraag als 'wat trekt je aan in sportwagens?' is hier onvoldoende omdat die net zo goed alleen een actuele voorkeur kan opleveren.",
  "Begrijpt Porsche 356 als oorsprong van zorg/respect voor bijzondere auto's en koppelt dit voorzichtig aan topsegment. Geen verplicht vervolgveld of zakelijke intake.",
  "Herkent de spontane energie rond 'swirls' als betekenisvolle deur: niet alleen schoonmaken maar schade voorkomen, perfectie behouden en respect voor lak. Dit mag het beeld van Michael merkbaar verdiepen.",
];

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(unfenced);
  } catch {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(unfenced.slice(start, end + 1));
    }
    throw new Error("Regressiebeoordelaar gaf geen geldige JSON terug.");
  }
}

async function evaluateReplay(replay: ReplayTurn[]) {
  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: `
Je beoordeelt een regressietest voor Lumivey Discovery.

De norm is NIET letterlijke overeenkomst met juni.
De norm is vergelijkbare diepte, betekenis, menselijke nieuwsgierigheid en het volgen van dezelfde belangrijke deuren, voor zover dat niet strijdt met de actuele productwaarheid en Plan v0.4.

BELANGRIJK:
- beoordeel functie en informatiewaarde, niet formulering;
- een andere vraag mag PASS zijn als zij dezelfde persoonlijke laag ontsluit;
- onderscheid een algemene voorkeur-/smaakvraag van een echte oorsprongsdeur;
- als de juni-route aantoonbaar een rijkere laag ontsloot, zoals een eerste concrete auto/persoon/herinnering, dan is een algemene vraag naar huidige aantrekkingskracht niet automatisch gelijkwaardig;
- gebruik WARN als de huidige reactie bruikbaar is maar een rijkere persoonlijke oorsprongsdeur laat liggen;
- FAIL is voor duidelijke ontsporing naar intake/oplossing of het missen/sluiten van een belangrijke deur.

Geef uitsluitend geldige JSON terug in exact dit formaat:
{
  "overall": "PASS|WARN|FAIL",
  "firstDeviationTurn": 0,
  "firstDeviation": "",
  "diagnosis": "",
  "turns": [
    {"turn":1,"status":"PASS|WARN|FAIL","reason":""}
  ]
}

Gebruik firstDeviationTurn = 0 als er in deze vijf beurten geen materiële afwijking is.
`,
    input: JSON.stringify(replay, null, 2),
  });

  return parseJsonObject(response.output_text);
}

export async function GET(request: Request) {
  try {
    const messages: ChatMessage[] = [];
    const replay: ReplayTurn[] = [];
    const base = new URL(request.url).origin;

    for (let index = 0; index < MICHAEL_TURNS.length; index += 1) {
      const user = MICHAEL_TURNS[index];
      messages.push({ role: "user", content: user });

      const response = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, sourceContexts: [] }),
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          {
            error: data?.error || `Replay stopte bij beurt ${index + 1}.`,
            replay,
          },
          { status: response.status }
        );
      }

      const assistant = String(data.reply || "");
      messages.push({ role: "assistant", content: assistant });
      replay.push({
        turn: index + 1,
        user,
        assistant,
        referenceExpectation: REFERENCE_EXPECTATIONS[index],
      });
    }

    const evaluation = await evaluateReplay(replay);

    return NextResponse.json({
      case: "Michael / high-end detailing",
      purpose: "Golden Path replay — first five text-only turns before the photo enters the June reference conversation.",
      note: "Stops before the photo-dependent part. This is for finding the first behavioral deviation, not for judging the final preview.",
      evaluation,
      replay,
    });
  } catch (error) {
    console.error("Michael regression failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Regressietest kon niet worden uitgevoerd." },
      { status: 500 }
    );
  }
}
