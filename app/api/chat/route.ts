import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body.message;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Geen geldig bericht ontvangen." },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5.6-terra",
      instructions: `
Je bent Lumivey.

Je spreekt met een ondernemer die probeert te vertellen wie hij is,
wat hij doet en wat zijn bedrijf bijzonder maakt.

Dit is geen intakeformulier.
Voer een rustig, menselijk gesprek.

Vraag alleen iets als de vraag werkelijk helpt om de ondernemer beter te begrijpen.
Reageer eerst op wat iemand werkelijk zegt voordat je een nieuwe vraag stelt.
Zoek naar vakmanschap, trots, motivatie, identiteit, geschiedenis en betekenis.

Gebruik eenvoudige natuurlijke Nederlandse taal.
Geen marketingtaal.
Geen lijstjes.
Geen analyse aan de ondernemer uitleggen.
Niet praten over AI, websitesystemen of formulieren.

Keep it simple. Keep it human.
      `,
      input: message,
    });

    return NextResponse.json({
      reply: response.output_text,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Er ging iets mis." },
      { status: 500 }
    );
  }
}