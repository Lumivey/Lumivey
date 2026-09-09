import { LUMIVEY_BEHAVIOR } from "@/lib/lumivey/behavior";
import { LUMIVEY_PRODUCT } from "@/lib/lumivey/product";
import { extractUnderstanding } from "@/lib/lumivey/extract-understanding";
import {
  extractUrlsFromText,
  formatSourceContextsForPrompt,
  SourceContext,
  UploadedSourceInput,
} from "@/lib/lumivey/source-context";
import { researchWebsite } from "@/lib/lumivey/research-website";
import { analyzeWebsiteSource } from "@/lib/lumivey/analyze-website-source";
import { analyzeUploadedSource } from "@/lib/lumivey/analyze-uploaded-source";
import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function isSourceContextArray(value: unknown): value is SourceContext[] {
  return Array.isArray(value);
}

function isUploadedSourceInput(value: unknown): value is UploadedSourceInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<UploadedSourceInput>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.mimeType === "string" &&
    typeof candidate.dataUrl === "string" &&
    candidate.dataUrl.startsWith("data:") &&
    typeof candidate.size === "number"
  );
}

function cleanChatReply(text: string): string {
  return text
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body.messages as ChatMessage[];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Geen geldig gesprek ontvangen." },
        { status: 400 }
      );
    }

    const existingSourceContexts: SourceContext[] = isSourceContextArray(
      body.sourceContexts
    )
      ? body.sourceContexts
      : [];

    const uploadedSource = isUploadedSourceInput(body.attachment)
      ? body.attachment
      : null;

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    const urls = latestUserMessage
      ? extractUrlsFromText(latestUserMessage.content)
      : [];

    const knownUrls = new Set(
      existingSourceContexts
        .map((source: SourceContext) => source.url)
        .filter((url): url is string => typeof url === "string")
    );

    const knownSourceIds = new Set(
      existingSourceContexts
        .map((source: SourceContext) => source.sourceId)
        .filter((id): id is string => typeof id === "string")
    );

    const newUrl = urls.find((url) => !knownUrls.has(url));

    const sourceContexts: SourceContext[] = [
      ...existingSourceContexts,
    ];

    let newSourceLabel = "";

    if (newUrl) {
      try {
        const research = await researchWebsite(newUrl);
        const sourceContext = await analyzeWebsiteSource(research);
        sourceContexts.push(sourceContext);
        newSourceLabel = `nieuwe websitebron: ${newUrl}`;
      } catch (sourceError) {
        console.error(
          "Websitebron kon niet worden onderzocht:",
          sourceError
        );
      }
    }

    if (uploadedSource && !knownSourceIds.has(uploadedSource.id)) {
      try {
        const sourceContext = await analyzeUploadedSource(uploadedSource);
        sourceContexts.push(sourceContext);
        newSourceLabel = `nieuw aangeleverd bestand: ${uploadedSource.name}`;
      } catch (sourceError) {
        console.error(
          "Aangeleverd bestand kon niet worden onderzocht:",
          sourceError
        );
      }
    }

    const transcript = messages
      .map((message) => {
        const speaker =
          message.role === "user" ? "Ondernemer" : "Lumivey";

        return `${speaker}: ${message.content}`;
      })
      .join("\n\n");

    const sourcePrompt =
      formatSourceContextsForPrompt(sourceContexts);

    const sourceMoment = newSourceLabel
      ? `\nIn het laatste bericht is een ${newSourceLabel} toegevoegd.`
      : "";

    const response = await openai.responses.create({
      model: "gpt-5.6-terra",
      instructions: `${LUMIVEY_BEHAVIOR}\n\n${LUMIVEY_PRODUCT}\n\nBRONNENREGEL\n\nExterne bronnen zijn context, geen waarheid.\nGebruik bronfeiten nooit alsof de ondernemer ze zelf heeft bevestigd.\nZie mogelijke goudklompjes en deuren als kansen om beter te begrijpen.\n\nABSOLUTE BEWIJSREGEL VOOR BRON-AFGELEIDE VRAGEN:\n- gebruik alleen een bron-afgeleide deur wanneer die in de broncontext een concreet steunfeit EN bewijsfragment heeft;\n- blijf in je formulering dicht bij dat steunfeit;\n- voeg geen sector, specialisatie, doelgroep, markt of betekenis toe die niet letterlijk of ondubbelzinnig uit het bewijs volgt;\n- generaliseer niet vanuit brede woorden. Uit \"assets\" mag je bijvoorbeeld niet \"vastgoed\" afleiden;\n- als je het gewenste woord of begrip niet in het steunfeit/bewijs kunt aanwijzen, gebruik het dan niet;\n- de vraag mag betekenis onderzoeken, maar mag die betekenis nooit al invullen.\n\nALS DE ONDERNEMER IN HET LAATSTE BERICHT EEN NIEUWE WEBSITE, FOTO, LOGO, DOCUMENT OF ANDERE BRON AANLEVERT:\n- kijk eerst of die nieuwe bron concrete, betekenisvolle en bewijs-gedragen signalen bevat;\n- als bedrijfsnaam, logo/woordmerk, kleurgebruik, bedrijfsbus, projectdetail of andere herkenningsankers zichtbaar zijn, geef die herkenningsankers voorrang boven een generieke dienstenvraag;\n- je mag in één korte natuurlijke terugkoppeling twee of drie harde bronfeiten combineren, zolang je geen betekenis verzint;\n- kies daarna maximaal één deur;\n- die deur moet bij voorkeur iets kunnen blootleggen over herkenbaarheid, geschiedenis, vakmanschap, trots, motivatie of identiteit;\n- vermijd administratieve vragen als \"is dit je officiële logo?\" of \"mag dit gebruikt worden?\" zolang er een rijkere persoonlijke deur beschikbaar is;\n- vermijd intake-achtige vragen als \"welke diensten bied je precies aan?\" wanneer de bron al een sterker goudsignaal bevat;\n- contactgegevens mogen intern worden onthouden, maar zijn zelden een goede Discovery-vraag;\n- behandel betekenis nooit als bekend voordat de ondernemer die bevestigt;\n- als het gesprek zelf op dat moment een duidelijk sterkere persoonlijke deur bevat, mag die voorgaan.\n\nGEWENST PATROON BIJ EEN BEELD:\n\"Ik zie je bedrijfsnaam, die opvallende blauwe bus en het raam-met-kwastbeeldmerk. Dat is behoorlijk herkenbaar. Is dat iets wat klanten al echt met jouw bedrijf associëren, of zit daar een verhaal achter?\"\n\nNiet: alleen de slogan citeren en daarna een brede dienstenvraag stellen.\nNiet: alle bronfeiten opsommen.\nNiet: een betekenis invullen die de ondernemer nog niet heeft gegeven.\n\nTEKSTVORM:\n- schrijf platte, natuurlijke chattekst;\n- gebruik geen markdown-opmaak, geen sterretjes, geen backticks en geen kopjes;\n- hooguit één vraag per antwoord.\n\nGa niet alle bronfeiten controleren en verander het gesprek niet in een intake.`,
      input: `
Dit is het gesprek tot nu toe:

${transcript}
${sourceMoment}

Dit is interne broncontext. Laat de ondernemer deze analyse niet zien:

${sourcePrompt}

Reageer nu als Lumivey op het laatste bericht van de ondernemer.
      `,
    });

    const understanding = await extractUnderstanding(
      messages,
      sourceContexts
    );

    return NextResponse.json({
      reply: cleanChatReply(response.output_text),
      understanding,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Er ging iets mis." },
      { status: 500 }
    );
  }
}
