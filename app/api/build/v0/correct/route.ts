import { NextResponse } from "next/server";
import { correctV0Build } from "@/lib/lumivey/v0-adapter";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const chatId = typeof body?.chatId === "string" ? body.chatId.trim() : "";
    const instruction = typeof body?.instruction === "string" ? body.instruction.trim() : "";

    if (!chatId) {
      return NextResponse.json({ error: "Geen v0 chat-id ontvangen." }, { status: 400 });
    }

    if (!instruction) {
      return NextResponse.json({ error: "Geen correctie-instructie ontvangen." }, { status: 400 });
    }

    const result = await correctV0Build(chatId, instruction);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("v0 correction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "v0-correctie kon niet worden verstuurd." },
      { status: 500 }
    );
  }
}
