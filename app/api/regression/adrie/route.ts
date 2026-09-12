import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createArtDirection } from "@/lib/lumivey/art-direction";
import { createSiteDescription } from "@/lib/lumivey/site-description";
import type { SourceContext } from "@/lib/lumivey/source-context";

export const maxDuration = 300;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ADRIE_TURNS = [
  "Ik ben Adrie Pouwer. Mijn bedrijf heet AssetPouwer. Ik wil een nieuwe website. Mijn huidige website is https://www.assetpouwer.nl",
  "Ik doe strategisch assetmanagement. Vooral overal waar een draadje aan zit: elektrotechniek, industriële automatisering en meet- en regeltechniek. Industrie en infra, zoals tunneltechnische installaties.",
  "Ik zit eigenlijk tussen strategie en operatie in. Ik heb zelf buiten in de kou gewerkt en fabrieken opgestart. Dus ik wil niet alleen mooie plannen maken; het moet buiten ook echt werken.",
  "Ik ben vrij rustig. Ik luister eerst voordat ik iets zeg. In mijn vrije tijd fotografeer ik graag. Zondagochtend het bos in, rustig kijken naar composities. Dat lijkt eigenlijk wel op hoe ik werk: eerst kijken en begrijpen voordat ik oordeel.",
  "Een voorbeeld: bij een grote change heb ik de directie laten zien wat de echte impact was op mensen en budgetten. Daardoor hebben ze besloten de verandering over meerdere jaren te spreiden in plaats van in één keer door te drukken.",
  "Ik wil vooral benaderd worden voor strategische assetmanagementvraagstukken. Mail, telefoon en LinkedIn zijn prima, maar het liefst gewoon eerst een persoonlijk gesprek of koffie.",
];

type ChatMessage = { role: "user" | "assistant"; content: string };

type Turn = {
  turn: number;
  user: string;
  assistant: string;
};

function parseJson(text: string) {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
    throw new Error("Adrie-beoordelaar gaf geen geldige JSON terug.");
  }
}

async function evaluate(input: unknown) {
  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: `
Je beoordeelt een Lumivey referentietest voor Adrie Pouwer / AssetPouwer.
Dit is GEEN exacte transcript-replay van een historisch gesprek; het is een gecontroleerde reconstructie van de eerder vastgelegde referentie-inhoud. Beoordeel dus betekenisbehoud en kwaliteit, niet letterlijke formulering.

Kern die niet mag verdampen:
- Adrie is geen generieke consultant; hij verbindt strategie met operatie.
- Zijn technische bedding is elektrotechniek, industriële automatisering en meet- en regeltechniek, vooral in industrie en infra.
- "Poten in de klei" is belangrijk: buiten gewerkt, fabrieken opgestart, dus uitvoerbaarheid telt.
- Hij is rustig en luistert eerst; fotografie/compositie is een menselijke herkenningslaag die hij zelf verbindt aan zijn manier van werken.
- Het voorbeeld van de grote change laat zien dat hij consequenties voor mensen en budgetten zichtbaar maakt en besluitvorming helpt faseren.
- De website moet vertrouwen, rust, overzicht en senioriteit voelen, zonder corporate consultant-clichés.
- De bestaande website is bronmateriaal, niet de ontwerpwaarheid.
- Geen nieuwe feiten verzinnen.

Geef uitsluitend JSON terug:
{
  "overall":"PASS|WARN|FAIL",
  "diagnosis":"",
  "checks":[
    {"name":"strategy-operation-bridge","status":"PASS|WARN|FAIL","reason":""},
    {"name":"practical-roots","status":"PASS|WARN|FAIL","reason":""},
    {"name":"calm-observer-photography","status":"PASS|WARN|FAIL","reason":""},
    {"name":"decision-impact-example","status":"PASS|WARN|FAIL","reason":""},
    {"name":"source-not-design-truth","status":"PASS|WARN|FAIL","reason":""},
    {"name":"preview-specificity","status":"PASS|WARN|FAIL","reason":""}
  ]
}
`,
    input: JSON.stringify(input, null, 2),
  });
  return parseJson(response.output_text);
}

export async function GET(request: Request) {
  try {
    const base = new URL(request.url).origin;
    const messages: ChatMessage[] = [];
    const replay: Turn[] = [];
    let sourceContexts: SourceContext[] = [];
    let understanding: any = null;

    for (let index = 0; index < ADRIE_TURNS.length; index += 1) {
      const user = ADRIE_TURNS[index];
      messages.push({ role: "user", content: user });

      const response = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, sourceContexts }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `Adrie replay stopte bij beurt ${index + 1}.`);

      const assistant = String(data.reply || "");
      messages.push({ role: "assistant", content: assistant });
      replay.push({ turn: index + 1, user, assistant });
      understanding = data.understanding;
      sourceContexts = Array.isArray(data?.understanding?.sources) ? data.understanding.sources : sourceContexts;
    }

    const [artDirection, siteDirection] = await Promise.all([
      createArtDirection(understanding),
      createSiteDescription(understanding),
    ]);

    const previewResponse = await fetch(`${base}/api/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ understanding }),
      cache: "no-store",
    });
    const previewData = await previewResponse.json();
    if (!previewResponse.ok || !previewData?.impression?.imageDataUrl) {
      throw new Error(previewData?.error || "Adrie Preview kon niet worden gegenereerd.");
    }

    const evaluation = await evaluate({
      replay,
      understanding,
      artDirection,
      siteDirection,
      sourceContexts,
      previewRationale: previewData.impression.rationale,
    });

    return NextResponse.json({
      case: "Adrie Pouwer / AssetPouwer",
      purpose: "Nieuwe contrastcase na Michael: broninterpretatie, menselijke diepte en creatieve richting voor een zakelijke B2B-adviseur.",
      note: "Deze test gebruikt een gecontroleerde reconstructie van de eerder vastgelegde Adrie-referentie-inhoud plus de bestaande website als bron. Foto-assets worden in een volgende laag toegevoegd zodra beschikbaar.",
      replay,
      sourceContexts,
      understanding,
      artDirection,
      siteDirection,
      previewImpression: previewData.impression,
      evaluation,
    });
  } catch (error) {
    console.error("Adrie regression error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Adrie-regressietest kon niet worden uitgevoerd." },
      { status: 500 }
    );
  }
}
