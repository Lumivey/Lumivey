import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CHAT_ID = "jncA2EfHpLj";
const ORIGINAL_VERSION_ID = "b_97tonr5qUCW";
const CORRECTION_MARKER = "LUMIVEY — TARGETED CORRECTION OF THE EXISTING ASSETPOUWER WEBSITE IN THIS CHAT.";

/** Read-only diagnostic, fixed to the Adrie regression chat.
 * Never return raw customer chat messages, source code or API credentials.
 * A matching chat message proves receipt only, NOT generation or a passing website.
 */
export async function GET() {
  const key = process.env.V0_API_KEY;
  if (!key) return NextResponse.json({ verdict: "unavailable", error: "V0_API_KEY ontbreekt; er is niets verzonden." }, { status: 503 });

  try {
    const started = performance.now();
    const response = await fetch(`https://api.v0.dev/v1/chats/${CHAT_ID}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      console.warn("Adrie correction read-only diagnostic upstream status", response.status);
      return NextResponse.json({ verdict: "unavailable", upstreamStatus: response.status,
        explanation: "v0 heeft het uitlezen van de originele chat geweigerd. De verzendstatus is niet vastgesteld; NIET opnieuw versturen." }, { status: 502 });
    }
    const chat = await response.json();
    const messages: unknown[] = Array.isArray(chat?.messages) ? chat.messages : [];
    const matching = messages.filter((item) => {
      if (!item || typeof item !== "object") return false;
      const msg = item as { role?: unknown; content?: unknown };
      return msg.role === "user" && typeof msg.content === "string" && msg.content.startsWith(CORRECTION_MARKER);
    }) as Array<{ id?: unknown; createdAt?: unknown }>;
    const versionId = typeof chat?.latestVersion?.id === "string" ? chat.latestVersion.id : null;
    const versionStatus = typeof chat?.latestVersion?.status === "string" ? chat.latestVersion.status : "unknown";
    const verifiedReceived = matching.length > 0;
    const verdict = !Array.isArray(chat?.messages) ? "inconclusive"
      : verifiedReceived ? (versionId && versionId !== ORIGINAL_VERSION_ID ? "received_new_version" : "received_no_new_version")
      : versionId && versionId !== ORIGINAL_VERSION_ID ? "new_version_no_matching_message" : "not_found";
    const payload = {
      verdict,
      checkedAt: new Date().toISOString(),
      chatId: CHAT_ID,
      originalVersionId: ORIGINAL_VERSION_ID,
      currentVersionId: versionId,
      versionStatus,
      messageCount: messages.length,
      correctionMessageCount: matching.length,
      correctionReceived: verifiedReceived,
      correctionMessageTimes: matching.map((msg) => typeof msg.createdAt === "string" ? msg.createdAt : null),
      readOnly: true,
      noNewGenerationStarted: true,
      explanation: verdict === "received_new_version"
        ? "Het correctiebericht staat in de oorspronkelijke chat én er is een andere v0-versie. De inhoudelijke website-QA moet nog plaatsvinden."
        : verdict === "received_no_new_version"
          ? "Het correctiebericht staat in de oorspronkelijke chat, maar er is nog geen nieuwe websiteversie. Niet nogmaals versturen; controleer de verwerking."
          : verdict === "not_found"
            ? "Het exacte correctiebericht is NIET aangetroffen in de door v0 teruggegeven chatberichten. Dit bewijst niet dat er nooit een netwerkverzoek is gedaan. Eerst verzendfout onderzoeken; niet blind opnieuw versturen."
            : "De berichten en/of versie geven geen eenduidig bewijs van een afgeronde correctie. Niet blind opnieuw versturen.",
      lookupMs: Math.round(performance.now() - started),
    };
    console.info("Adrie correction receipt read-only result", JSON.stringify({ verdict, versionId, matchingCount: matching.length, lookupMs: payload.lookupMs }));
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Adrie correction read-only diagnostic failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ verdict: "unavailable", explanation: "Statuscontrole is mislukt. Niet nogmaals versturen." }, { status: 502 });
  }
}
