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
  "Herkent dat topsegment/detailing méér is dan zomaar bijverdienen en opent één persoonlijke oorsprongs- of fascinatie-deur. De deur hoeft niet exact 'welke auto?' te zijn; ook vragen naar waarom luxe auto's hem aantrekken, waar die fascinatie begon of wat hij daarin bijzonder vindt zijn functioneel gelijkwaardig zolang ze echt persoonlijk verdiepen.",
  "Begrijpt Porsche 356 als oorsprong van zorg/respect voor bijzondere auto's en koppelt dit voorzichtig aan topsegment. Geen verplicht vervolgveld of zakelijke intake.",
  "Herkent de spontane energie rond 'swirls' als betekenisvolle deur: niet alleen schoonmaken maar schade voorkomen, perfectie behouden en respect voor lak. Dit mag het beeld van Michael merkbaar verdiepen.",
];

async function evaluateReplay(replay: ReplayTurn[]) {
  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: `
Je beoordeelt een regressietest voor Lumivey Discovery.

De norm is NIET letterlijke overeenkomst met juni.
De norm is vergelijkbare diepte, betekenis, menselijke nieuwsgierigheid en het volgen van dezelfde belangrijke deuren, voor zover dat niet strijdt met de actuele productwaarheid en Plan v0.4.

BELANGRIJK:
- beoordeel functie, niet formulering;
- een andere vraag mag PASS zijn als zij dezelfde persoonlijke deur opent en vergelijkbare kans op betekenis geeft;
- geef GEEN WARN alleen omdat de huidige vraag breder of anders geformuleerd is dan juni;
- gebruik WARN alleen als de huidige reactie aantoonbaar minder betekenis kan ontsluiten, te voorzichtig/zakelijk/intake-achtig wordt, of een rijke persoonlijke deur duidelijk laat liggen;
- vraag jezelf steeds af: zou dit antwoord in een organisch gesprek plausibel dezelfde mens achter de ondernemer kunnen blootleggen?

Beoordeel per beurt:
- PASS: huidig gedrag bewaart de functie en betekenis van de juni-referentie, ook als formulering of route anders is.
- WARN: bruikbaar, maar duidelijk vlakker, te voorzichtig, te zakelijk, te intake-achtig of betekenis verliest.
- FAIL: mist of sluit een belangrijke deur, springt naar oplossing/website/intake, of interpreteert zo star dat de essentie verloren gaat.

Zoek vooral de EERSTE betekenisvolle afwijking. Latere fouten kunnen gevolgschade zijn.
Geen stijlpolitie en geen voorkeur voor de juni-zinnen zelf.

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

  return JSON.parse(response.output_text);
}

export async function GET(request: Request) {
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
}
