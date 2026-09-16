import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CHAT_ID = "jncA2EfHpLj";
const EXPECTED_VERSION = "b_0H3NhLl18e";
const MARKER = "LUMIVEY-ADRIE-VISUAL-REFERENCE-ONE-SHOT";

/** Read only. Never expose messages, image URLs, customer assets or credentials. */
export async function GET() {
  const key = process.env.V0_API_KEY;
  if (!key) return NextResponse.json({ verdict: "unavailable", explanation: "v0 API-configuratie ontbreekt. Niets versturen." }, { status: 503 });
  try {
    const response = await fetch(`https://api.v0.dev/v1/chats/${CHAT_ID}`, {
      headers: { Authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return NextResponse.json({ verdict: "unavailable", upstreamStatus: response.status, explanation: "v0-chat niet uitleesbaar. Geen nieuwe poging doen." }, { status: 502 });
    const chat = await response.json();
    const messages: unknown = chat?.messages;
    const version = chat?.latestVersion;
    const versionId = typeof version?.id === "string" ? version.id : null;
    const versionStatus = typeof version?.status === "string" ? version.status : "unknown";
    if (!Array.isArray(messages)) return NextResponse.json({ verdict: "inconclusive", versionId, versionStatus, explanation: "Berichtgeschiedenis ontbreekt; niet opnieuw verzenden." });
    const matching = messages.filter((item) => {
      if (!item || typeof item !== "object") return false;
      const message = item as { role?: unknown; content?: unknown };
      return message.role === "user" && typeof message.content === "string" && message.content.startsWith(MARKER);
    });
    const received = matching.length > 0;
    const verdict = received ? (versionId !== EXPECTED_VERSION ? "received_new_version" : "received_awaiting_version")
      : versionId === EXPECTED_VERSION && versionStatus === "completed" ? "not_received_version_ready"
      : "not_received_version_not_ready";
    return NextResponse.json({ verdict, checkedAt: new Date().toISOString(), chatId: CHAT_ID,
      expectedVersionId: EXPECTED_VERSION, currentVersionId: versionId, versionStatus,
      visualMessageCount: matching.length, visualMessageReceived: received,
      readOnly: true, noNewGenerationStarted: true,
      explanation: received ? "Het visuele correctiebericht staat daadwerkelijk in de oorspronkelijke chat. Niet opnieuw versturen."
        : versionId === EXPECTED_VERSION && versionStatus === "completed"
          ? "Het visuele bericht staat niet in de teruggegeven chatberichten en de verwachte versie is gereed. De eerdere afwijzing gebeurde vóór de verzending; eerst bediening herstellen, niet blind herhalen."
          : "Het visuele bericht is niet gevonden, maar chatversie of status voldoet niet. Geen nieuwe verzending." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ verdict: "unavailable", explanation: "Leescontrole mislukt; niet opnieuw versturen." }, { status: 502 });
  }
}
