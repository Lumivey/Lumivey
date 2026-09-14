import { LUMIVEY_BEHAVIOR } from "@/lib/lumivey/behavior";
import { LUMIVEY_PRODUCT } from "@/lib/lumivey/product";
import { extractUnderstanding } from "@/lib/lumivey/extract-understanding";
import {
  extractUrlsFromText,
  formatSourceContextsForPrompt,
  SourceContext,
  UploadedSourceInput,
  websiteSourceKey,
} from "@/lib/lumivey/source-context";
import { researchWebsite } from "@/lib/lumivey/research-website";
import { analyzeWebsiteSource } from "@/lib/lumivey/analyze-website-source";
import { analyzeUploadedSource } from "@/lib/lumivey/analyze-uploaded-source";
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const maxDuration = 300;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type ChatMessage = { role: "user" | "assistant"; content: string };

function isSourceContextArray(value: unknown): value is SourceContext[] {
  return Array.isArray(value);
}

function isUploadedSourceInput(value: unknown): value is UploadedSourceInput {
  if (typeof value !== "object" || value === null) return false;
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

function uploadedSourcesFromBody(body: any): UploadedSourceInput[] {
  if (Array.isArray(body?.attachments)) {
    return body.attachments.filter(isUploadedSourceInput).slice(0, 8);
  }
  return isUploadedSourceInput(body?.attachment) ? [body.attachment] : [];
}

function cleanChatReply(text: string): string {
  return text.replace(/\*\*\*/g, "").replace(/\*\*/g, "").replace(/__/g, "").replace(/`/g, "").trim();
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const candidate = error as Record<string, unknown>;
    if (typeof candidate.message === "string") return candidate.message;
    if (typeof candidate.error === "string") return candidate.error;
    try { return JSON.stringify(error); } catch { return String(error); }
  }
  return String(error || "Onbekende fout");
}

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { status?: unknown; code?: unknown; message?: unknown };
  return (
    candidate.status === 429 ||
    candidate.code === "rate_limit_exceeded" ||
    (typeof candidate.message === "string" && candidate.message.includes("429"))
  );
}

async function withRateLimitRetry<T>(task: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (!isRateLimitError(error) || attempt === attempts - 1) throw error;
      const waitMs = 15_000 * (attempt + 1);
      console.warn(`OpenAI rate limit; retry ${attempt + 2}/${attempts} after ${waitMs}ms.`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

export async function POST(request: Request) {
  let diagnostic = false;
  let stage = "request";
  try {
    const body = await request.json();
    diagnostic = body?.diagnostic === true;
    const messages = body.messages as ChatMessage[];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Geen geldig gesprek ontvangen." }, { status: 400 });
    }

    const existingSourceContexts: SourceContext[] = isSourceContextArray(body.sourceContexts)
      ? body.sourceContexts
      : [];
    const uploadedSources = uploadedSourcesFromBody(body);

    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
    const urls = latestUserMessage ? extractUrlsFromText(latestUserMessage.content) : [];
    const sourceContexts: SourceContext[] = [...existingSourceContexts];

    const knownWebsiteKeys = new Set(
      sourceContexts
        .map((source) => (source.url ? websiteSourceKey(source.url) : null))
        .filter((key): key is string => typeof key === "string")
    );
    const knownSourceIds = new Set(
      sourceContexts.map((source) => source.sourceId).filter((id): id is string => typeof id === "string")
    );
    const sourceMoments: string[] = [];

    async function addWebsiteSource(url: string, origin: "message" | "uploaded-source") {
      const key = websiteSourceKey(url);
      if (!key || knownWebsiteKeys.has(key)) return;
      try {
        stage = "website-research";
        const research = await researchWebsite(url);
        stage = "website-analysis";
        const sourceContext = await analyzeWebsiteSource(research);
        sourceContexts.push(sourceContext);
        const storedKey = sourceContext.url ? websiteSourceKey(sourceContext.url) : key;
        knownWebsiteKeys.add(storedKey ?? key);
        sourceMoments.push(
          origin === "uploaded-source"
            ? `In een aangeleverde bron is de duidelijk leesbare website ${url} gevonden en automatisch als aanvullende bron onderzocht.`
            : `De ondernemer heeft de website ${url} rechtstreeks aangeleverd en die is als bron onderzocht.`
        );
      } catch (sourceError) {
        console.error("Websitebron kon niet worden onderzocht:", sourceError);
      }
    }

    const explicitNewUrl = urls.find((url) => {
      const key = websiteSourceKey(url);
      return key ? !knownWebsiteKeys.has(key) : false;
    });
    if (explicitNewUrl) await addWebsiteSource(explicitNewUrl, "message");

    for (const uploadedSource of uploadedSources) {
      if (knownSourceIds.has(uploadedSource.id)) continue;
      try {
        stage = "uploaded-source-analysis";
        const sourceContext = await analyzeUploadedSource(uploadedSource);
        sourceContexts.push(sourceContext);
        knownSourceIds.add(uploadedSource.id);
        sourceMoments.push(`De ondernemer heeft ${uploadedSource.name} aangeleverd en dat is als bron geanalyseerd.`);

        const discoveredUrl = (sourceContext.discoveredUrls ?? []).find((item) => {
          if (item.confidence !== "high") return false;
          const key = websiteSourceKey(item.url);
          return key ? !knownWebsiteKeys.has(key) : false;
        });
        if (discoveredUrl) await addWebsiteSource(discoveredUrl.url, "uploaded-source");
      } catch (sourceError) {
        console.error(`Aangeleverde bron ${uploadedSource.name} kon niet worden onderzocht:`, sourceError);
      }
    }

    const transcript = messages
      .map((message) => `${message.role === "user" ? "Ondernemer" : "Lumivey"}: ${message.content}`)
      .join("\n\n");
    const sourcePrompt = formatSourceContextsForPrompt(sourceContexts);
    const sourceMoment = sourceMoments.length
      ? `\nBRONGEBEURTENISSEN IN DIT LAATSTE BERICHT\n${sourceMoments.map((item) => `- ${item}`).join("\n")}`
      : "";

    stage = "discovery-response";
    const response = await withRateLimitRetry(() => openai.responses.create({
      model: "gpt-5.6-terra",
      instructions: `${LUMIVEY_BEHAVIOR}\n\n${LUMIVEY_PRODUCT}\n\nBRONNENREGEL\nExterne bronnen zijn context, geen waarheid. Gebruik bronfeiten nooit alsof de ondernemer ze zelf heeft bevestigd. Zie mogelijke goudklompjes en deuren als kansen om beter te begrijpen.\n\nABSOLUTE BEWIJSREGEL VOOR BRON-AFGELEIDE VRAGEN:\n- gebruik alleen een bron-afgeleide deur wanneer die in de broncontext een concreet steunfeit EN bewijsfragment heeft;\n- blijf in je formulering dicht bij dat steunfeit;\n- voeg geen sector, specialisatie, doelgroep, markt of betekenis toe die niet letterlijk of ondubbelzinnig uit het bewijs volgt;\n- generaliseer niet vanuit brede woorden;\n- als je het gewenste woord of begrip niet in het steunfeit/bewijs kunt aanwijzen, gebruik het dan niet;\n- de vraag mag betekenis onderzoeken, maar mag die betekenis nooit al invullen.\n\nMEERDERE BRONNEN IN ÉÉN BERICHT:\n- een ondernemer mag meerdere foto's of documenten tegelijk delen;\n- analyseer ze als één bronmoment maar bewaar iedere bron afzonderlijk met eigen provenance;\n- som niet alle beelden op in je antwoord; zoek de sterkste gedeelde of onderscheidende signalen;\n- als meerdere beelden dezelfde persoon in verschillende contexten tonen, mag je dat als visuele consistentie herkennen maar geen identiteit of betekenis verzinnen;\n- kies maximaal één volgende vraag.\n\nAUTOMATISCH ONTDEKTE WEBSITE IN EEN FOTO OF DOCUMENT:\n- als een aangeleverde bron een volledig en betrouwbaar leesbare website-URL bevat, mag Lumivey die automatisch als aanvullende bron onderzoeken;\n- vraag de ondernemer niet eerst opnieuw om die URL;\n- behandel de gevonden website als oude of externe bron: bruikbaar, maar mogelijk verouderd of onjuist.\n\nALS DE ONDERNEMER EEN NIEUWE WEBSITE, FOTO, LOGO, DOCUMENT OF ANDERE BRON AANLEVERT:\n- kijk eerst of die nieuwe bron concrete, betekenisvolle en bewijs-gedragen signalen bevat;\n- geef herkenningsankers voorrang boven een generieke dienstenvraag;\n- je mag in één korte natuurlijke terugkoppeling twee of drie harde bronfeiten combineren, zolang je geen betekenis verzint;\n- kies daarna maximaal één deur;\n- vermijd administratieve en intake-achtige vragen wanneer er een rijkere persoonlijke deur beschikbaar is;\n- contactgegevens mogen intern worden onthouden, maar zijn zelden een goede Discovery-vraag;\n- behandel betekenis nooit als bekend voordat de ondernemer die bevestigt.\n\nTEKSTVORM:\n- schrijf platte, natuurlijke chattekst;\n- gebruik geen markdown-opmaak, geen sterretjes, geen backticks en geen kopjes;\n- hooguit één vraag per antwoord.\n\nGa niet alle bronfeiten controleren en verander het gesprek niet in een intake.`,
      input: `Dit is het gesprek tot nu toe:\n\n${transcript}${sourceMoment}\n\nDit is interne broncontext. Laat de ondernemer deze analyse niet zien:\n\n${sourcePrompt}\n\nReageer nu als Lumivey op het laatste bericht van de ondernemer.`,
    }));

    stage = "understanding-extraction";
    const understanding = await withRateLimitRetry(() => extractUnderstanding(messages, sourceContexts));
    return NextResponse.json({ reply: cleanChatReply(response.output_text), understanding });
  } catch (error) {
    console.error(error);
    if (isRateLimitError(error)) {
      return NextResponse.json(
        { error: "Tijdelijke OpenAI-limiet bereikt. Lumivey kan deze stap veilig opnieuw proberen.", stage },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    return NextResponse.json(
      diagnostic
        ? { error: errorMessage(error), stage }
        : { error: "Er ging iets mis." },
      { status: 500 }
    );
  }
}
