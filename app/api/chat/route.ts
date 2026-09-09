import { LUMIVEY_BEHAVIOR } from "@/lib/lumivey/behavior";
import { LUMIVEY_PRODUCT } from "@/lib/lumivey/product";
import { extractUnderstanding } from "@/lib/lumivey/extract-understanding";
import {
  extractUrlsFromText,
  formatSourceContextsForPrompt,
  SourceContext,
} from "@/lib/lumivey/source-context";
import { researchWebsite } from "@/lib/lumivey/research-website";
import { analyzeWebsiteSource } from "@/lib/lumivey/analyze-website-source";
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

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    const urls = latestUserMessage
      ? extractUrlsFromText(latestUserMessage.content)
      : [];

    const knownUrls = new Set(
      existingSourceContexts.map(
        (source: SourceContext) => source.url
      )
    );

    const newUrl = urls.find((url) => !knownUrls.has(url));

    const sourceContexts: SourceContext[] = [
      ...existingSourceContexts,
    ];

    if (newUrl) {
      try {
        const research = await researchWebsite(newUrl);
        const sourceContext = await analyzeWebsiteSource(research);
        sourceContexts.push(sourceContext);
      } catch (sourceError) {
        console.error(
          "Websitebron kon niet worden onderzocht:",
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

    const response = await openai.responses.create({
      model: "gpt-5.6-terra",
      instructions: `${LUMIVEY_BEHAVIOR}\n\n${LUMIVEY_PRODUCT}\n\nBRONNENREGEL\n\nExterne bronnen zijn context, geen waarheid.\nGebruik bronfeiten nooit alsof de ondernemer ze zelf heeft bevestigd.\nZie mogelijke goudklompjes en deuren als kansen om beter te begrijpen.\n\nALS DE ONDERNEMER IN HET LAATSTE BERICHT EEN NIEUWE WEBSITE OF ANDERE BRON AANLEVERT:\n- kijk eerst of die nieuwe bron een concrete, betekenisvolle deur bevat;\n- geef zo'n bron-afgeleide deur voorrang boven een algemene vraag zoals waarom iemand nu een website wil of wat er moet veranderen;\n- doe dat alleen wanneer de deur iets kan vertellen over identiteit, geschiedenis, vakmanschap, trots, motivatie of herkenbaarheid;\n- noem het concrete bronfeit of signaal kort en voorzichtig, zodat de ondernemer merkt dat Lumivey werkelijk heeft gekeken;\n- vraag daarna maximaal één laag dieper naar de betekenis ervan;\n- behandel de betekenis nooit als bekend voordat de ondernemer die bevestigt;\n- als het gesprek zelf op dat moment een duidelijk sterkere persoonlijke deur bevat, mag die voorgaan.\n\nVoorbeeld van het gewenste patroon:\n\"Ik zie op je huidige site dat ... Is dat nog steeds iets wat voor jou belangrijk is?\"\nNiet: een algemene websitevraag die ook zonder bron gesteld had kunnen worden.\n\nGa niet alle bronfeiten controleren en verander het gesprek niet in een intake.`,
      input: `
Dit is het gesprek tot nu toe:

${transcript}

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
      reply: response.output_text,
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
