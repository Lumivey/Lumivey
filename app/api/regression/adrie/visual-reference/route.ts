import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CHAT_ID = "jncA2EfHpLj";
const VERSION = "b_0H3NhLl18e";
const MARKER = "LUMIVEY-ADRIE-VISUAL-REFERENCE-ONE-SHOT";
const APPROVED_IMAGE_SHA256 = "4af0bbd756fc3886ecdcd47de0cfd429aafa8b523b0580e7e886ea55cccc5b9a";
const BLOB_HOST = /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i;

function validBlob(value: unknown, role: "visual-reference" | "hero-source"): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && BLOB_HOST.test(url.hostname)
      && url.pathname.startsWith(`/lumivey/v0/adrie/${role}-`)
      && /\.(?:jpg|jpeg|png)$/i.test(url.pathname) && !url.username && !url.password;
  } catch { return false; }
}

async function readBoundedImage(url: string, maxBytes: number): Promise<{ bytes: Uint8Array; mime: string }> {
  const response = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Geüpload beeld kon niet worden geverifieerd.");
  const mime = response.headers.get("content-type")?.split(";")[0] || "";
  if (!/^image\/(?:jpeg|png)$/.test(mime)) throw new Error("Bestand is geen JPEG/PNG-beeld.");
  if (Number(response.headers.get("content-length") || "0") > maxBytes) throw new Error("Bestand overschrijdt veiligheidslimiet.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 30_000 || bytes.length > maxBytes) throw new Error("Ongeldige of te grote afbeelding.");
  return { bytes, mime };
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin || request.headers.get("sec-fetch-site") !== "same-origin"
      || request.headers.get("sec-fetch-mode") !== "cors") {
    return NextResponse.json({ error: "Alleen een directe actie vanaf de Lumivey-regressiepagina is toegestaan." }, { status: 403 });
  }
  const data = await request.json().catch(() => null);
  const referenceUrl = data?.referenceUrl;
  const heroUrl = data?.heroUrl;
  if (data?.confirm !== MARKER || data?.versionId !== VERSION || !validBlob(referenceUrl, "visual-reference")
      || !validBlob(heroUrl, "hero-source") || referenceUrl === heroUrl) {
    return NextResponse.json({ error: "Bevestiging, versie of afzonderlijke afbeeldingen ontbreken." }, { status: 400 });
  }
  const key = process.env.V0_API_KEY;
  if (!key) return NextResponse.json({ error: "v0 API niet ingesteld." }, { status: 503 });
  try {
    const [reference, hero] = await Promise.all([
      readBoundedImage(referenceUrl, 2_000_000), readBoundedImage(heroUrl, 2_000_000),
    ]);
    if (reference.mime !== "image/jpeg"
        || createHash("sha256").update(reference.bytes).digest("hex") !== APPROVED_IMAGE_SHA256) {
      return NextResponse.json({ error: "Dit is niet de exacte goedgekeurde Preview uit het overdrachtspakket. Niets verstuurd." }, { status: 422 });
    }
    const headers = { Authorization: `Bearer ${key}` };
    const current = await fetch(`https://api.v0.dev/v1/chats/${CHAT_ID}`, {
      headers, cache: "no-store", signal: AbortSignal.timeout(20000),
    });
    if (!current.ok) return NextResponse.json({ error: "Bestaande chat onbereikbaar. Niets verstuurd." }, { status: 424 });
    const chat = await current.json();
    if (!Array.isArray(chat.messages) || chat.messages.some((m: { role?: string; content?: string }) =>
      m.role === "user" && m.content?.startsWith(MARKER))) {
      return NextResponse.json({ error: "Visuele correctie al verzonden of berichtgeschiedenis niet controleerbaar. Niet opnieuw versturen." }, { status: 409 });
    }
    if (chat.latestVersion?.id !== VERSION || chat.latestVersion?.status !== "completed") {
      return NextResponse.json({ error: "v0-versie gewijzigd of niet gereed. Niets verstuurd." }, { status: 409 });
    }
    const message = `${MARKER}\nThe two attached images have STRICTLY SEPARATE ROLES. Attachment 1 is the owner's exact approved DESIGN REFERENCE (visually inspect it, NEVER embed its URL or screenshot pixels in website code, CSS backgrounds, public assets or metadata). Attachment 2 is the standalone INDUSTRIAL WALKWAY HERO SOURCE (TEST PHOTO, not validated as a true photo of Adrie; publication requires validation). The previous text-only correction could not transmit the visual composition. Edit this chat's existing source files, not a new chat. Preserve the already improved customer proposition (who/what/when), real change-phasing case, correct services and functional contact structure. Match the actual reference visually with real HTML/CSS/SVG: full-head walking industrial hero with ivory left-to-right dissolve and 'Strategie ↔ operatie' at image bottom; quiet open frame corners; method section left with a continuous four-step line and technical pipe photo right; asymmetrical navy quotation plus three numbered evidence lines; SHALLOW proof strip; small separate forest LANDSCAPE with text, NEVER a second Adrie portrait; restrained olive contact band. Use attached standalone photo only for hero; do NOT crop off face or head. Do not fake an original logo, source credentials or contact data. Keep photo hobby secondary, not a service. If separate forest/pipe/real-logo files are unavailable, disclose them instead of cropping them from the reference or fabricating. On 390px mobile retain linked visual motifs and no horizontal overflow. Verify reference URL is absent from all output files, report changed source files and new version. Neither v0 self-report nor an API submission constitutes independent QA or owner approval.`;
    const sent = await fetch(`https://api.v0.dev/v1/chats/${CHAT_ID}/messages`, {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ message, attachments: [{ url: referenceUrl }, { url: heroUrl }] }),
      signal: AbortSignal.timeout(90000),
    });
    if (!sent.ok) return NextResponse.json({ error: "v0 heeft het bericht niet bevestigd; status eerst uitlezen, niet opnieuw versturen.", upstreamStatus: sent.status }, { status: 502 });
    return NextResponse.json({ submitted: true, chatId: CHAT_ID, previousVersionId: VERSION, designReferenceVerified: true,
      referenceAttached: true, separateHeroAttached: true, qaPassed: false }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Adrie visual handoff failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Verzending of beeldverificatie kon niet worden bevestigd; controleer status vóór herhaling." }, { status: 502 });
  }
}
