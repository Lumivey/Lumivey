import { LUMIVEY_BEHAVIOR } from "@/lib/lumivey/behavior";
import { LUMIVEY_PRODUCT } from "@/lib/lumivey/product";
import { extractUnderstanding } from "@/lib/lumivey/extract-understanding";
import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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

    const transcript = messages
      .map((message) => {
        const speaker =
          message.role === "user" ? "Ondernemer" : "Lumivey";

        return `${speaker}: ${message.content}`;
      })
      .join("\n\n");

    const response = await openai.responses.create({
  model: "gpt-5.6-terra",
  instructions: `${LUMIVEY_BEHAVIOR}

${LUMIVEY_PRODUCT}`,
  input: `
Dit is het gesprek tot nu toe:

${transcript}

Reageer nu als Lumivey op het laatste bericht van de ondernemer.
      `,
});

const understanding = await extractUnderstanding(messages);

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