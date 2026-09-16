import { NextResponse } from "next/server";

const CHAT_ID = "jncA2EfHpLj";
const VERSION = "b_0H3NhLl18e";
const MARKER = "LUMIVEY-ADRIE-VISUAL-REFERENCE-ONE-SHOT";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin || request.headers.get("sec-fetch-site") !== "same-origin") {
    return NextResponse.json({ error: "Ongeldige herkomst." }, { status: 403 });
  }
  const data = await request.json().catch(() => null);
  const url = typeof data?.referenceUrl === "string" ? data.referenceUrl : "";
  if (data?.confirm !== MARKER || data?.versionId !== VERSION || !/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/lumivey\/v0\/adrie\/visual-reference-[a-zA-Z0-9_-]+\.jpg(?:\?.*)?$/i.test(url)) {
    return NextResponse.json({ error: "Ontwerpbestand, bevestiging of versie ontbreekt." }, { status: 400 });
  }
  const key = process.env.V0_API_KEY;
  if (!key) return NextResponse.json({ error: "v0 API niet ingesteld." }, { status: 503 });
  const headers = { Authorization: `Bearer ${key}` };
  const current = await fetch(`https://api.v0.dev/v1/chats/${CHAT_ID}`, { headers, cache: "no-store" });
  if (!current.ok) return NextResponse.json({ error: "Bestaande chat onbereikbaar." }, { status: 424 });
  const chat = await current.json();
  if (!Array.isArray(chat.messages) || chat.messages.some((m: { role?: string; content?: string }) => m.role === "user" && m.content?.startsWith(MARKER))) {
    return NextResponse.json({ error: "Visuele correctie al verzonden of berichtgeschiedenis niet controleerbaar." }, { status: 409 });
  }
  if (chat.latestVersion?.id !== VERSION || chat.latestVersion?.status !== "completed") {
    return NextResponse.json({ error: "Versie gewijzigd of nog niet gereed. Niet verzonden." }, { status: 409 });
  }
  const message = `${MARKER}\nInspect the attached approved DESIGN REFERENCE image visually. The previous correction received ONLY TEXT; therefore the actual composition was lost. EDIT EXISTING FILES, do not generate another chat or restart Discovery. The attached screenshot is REFERENCE ONLY, NOT a production asset: never display or embed its URL, pixels or entire composition as an image in HTML, CSS, JSX, OG images or metadata. Build actual responsive HTML/CSS/SVG and use independent approved photographs only. Preserve the improved business content (for whom / what / when), accurate case story and contact structure unchanged. Match the visible reference composition: ivory editorial hero with one full-head walking Adrie in industrial context, subtle open corner frames and 'Strategie ↔ operatie'; technical blue pipe detail and four connected process stages; asymmetrical midnight-navy quote with numbered evidence; shallow proof strip; small forest landscape WITHOUT another Adrie portrait; restrained olive contact band. Do not substitute generic cards or a tablet close-up for the walking hero. On mobile retain meaningful visual relationships and uncropped faces. If the genuine walking hero, forest asset or original logo is not available independently, explicitly list missing assets; never hallucinate Adrie or invent a logo. Verify generated code does not contain the reference image URL. Return actual changed files and preview; independent Lumivey QA and owner approval remain open.`;
  const sent = await fetch(`https://api.v0.dev/v1/chats/${CHAT_ID}/messages`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ message, attachments: [{ url }] }),
  });
  if (!sent.ok) return NextResponse.json({ error: "v0 bevestigde het bericht niet. Niet opnieuw versturen zonder leescontrole.", upstreamStatus: sent.status }, { status: 502 });
  return NextResponse.json({ submitted: true, chatId: CHAT_ID, previousVersionId: VERSION, referenceAttached: true, qaPassed: false });
}
