import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CHAT_ID = "jncA2EfHpLj";
const MARKER = "LUMIVEY-ADRIE-VISUAL-REFERENCE-ONE-SHOT";
const VERSION_ID = /^[A-Za-z0-9_-]{8,128}$/;

/** Read only. Use the exact API version ID: 0/O and I/l must never be transcribed by hand. */
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
    const versionId = typeof version?.id === "string" && VERSION_ID.test(version.id) ? version.id : null;
    const versionStatus = typeof version?.status === "string" ? version.status : "unknown";
    if (!Array.isArray(messages)) return NextResponse.json({ verdict: "inconclusive", currentVersionId: versionId, versionStatus, explanation: "Berichtgeschiedenis ontbreekt; niet opnieuw verzenden." });
    const matching = messages.filter((item) => {
      if (!item || typeof item !== "object") return false;
      const message = item as { role?: unknown; content?: unknown };
      return message.role === "user" && typeof message.content === "string" && message.content.startsWith(MARKER);
    });
    const received = matching.length > 0;
    const ready = Boolean(versionId && versionStatus === "completed" && !received);
    const verdict = received ? "received" : ready ? "not_received_version_ready" : "not_received_version_not_ready";
    return NextResponse.json({ verdict, checkedAt: new Date().toISOString(), chatId: CHAT_ID,
      currentVersionId: versionId, versionStatus, visualMessageCount: matching.length, visualMessageReceived: received,
      safeToPrepareOneSubmission: ready, readOnly: true, noNewGenerationStarted: true,
      explanation: received ? "Visuele correctie is al ontvangen. Niet opnieuw versturen."
        : ready ? "Geen visueel correctiebericht gevonden; actuele v0-versie is gereed. Definitieve versie- en duplicaatcontrole vindt direct voor verzending plaats."
        : "Geen visueel correctiebericht gevonden, maar versie of status is niet betrouwbaar gereed. Niets versturen." },
      { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ verdict: "unavailable", explanation: "Leescontrole mislukt; niet opnieuw versturen." }, { status: 502 });
  }
}
