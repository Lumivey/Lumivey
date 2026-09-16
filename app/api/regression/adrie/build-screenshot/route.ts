import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CHAT_ID = /^[a-zA-Z0-9_-]{8,128}$/;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Screenshot comes from the official v0 version endpoint, never from a user-supplied URL. */
export async function GET(request: Request) {
  const chatId = new URL(request.url).searchParams.get("chatId")?.trim() || "";
  if (!CHAT_ID.test(chatId)) {
    return NextResponse.json({ error: "Geldige v0 chat-ID ontbreekt." }, { status: 400 });
  }
  const apiKey = process.env.V0_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "V0_API_KEY ontbreekt." }, { status: 503 });

  try {
    const started = performance.now();
    const chatResponse = await fetch(`https://api.v0.dev/v1/chats/${encodeURIComponent(chatId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!chatResponse.ok) {
      return NextResponse.json({ error: "Bestaande v0-chat is niet toegankelijk via deze API-sleutel.", upstreamStatus: chatResponse.status }, { status: 502 });
    }
    const chat = await chatResponse.json();
    const version = chat?.latestVersion;
    if (version?.status !== "completed" || typeof version?.id !== "string") {
      return NextResponse.json({ error: "De nieuwste v0-versie is nog niet gereed voor een screenshot." }, { status: 409 });
    }
    // Retrieve the official version resource: screenshotUrl is authenticated and may not be present in chat summaries.
    const versionResponse = await fetch(`https://api.v0.dev/v1/chats/${encodeURIComponent(chatId)}/versions/${encodeURIComponent(version.id)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!versionResponse.ok) {
      return NextResponse.json({ error: "v0-versie kon niet worden opgehaald.", upstreamStatus: versionResponse.status }, { status: 502 });
    }
    const detail = await versionResponse.json();
    const screenshotUrl = detail?.screenshotUrl;
    if (typeof screenshotUrl !== "string") {
      return NextResponse.json({ error: "v0 heeft geen screenshot van deze versie beschikbaar gesteld." }, { status: 424 });
    }
    const url = new URL(screenshotUrl);
    const host = url.hostname.toLowerCase();
    // Do not send a private v0 API key to arbitrary hosts even if the upstream payload is compromised.
    if (url.protocol !== "https:" || url.username || url.password || !(host === "v0.dev" || host.endsWith(".v0.dev") || host === "v0.app" || host.endsWith(".v0.app"))) {
      return NextResponse.json({ error: "v0 gaf een niet-vertrouwde screenshotlocatie terug." }, { status: 502 });
    }
    url.searchParams.set("ignoreCache", "1");
    const imageResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(35000),
    });
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "De bestaande v0-screenshot kon niet worden opgehaald.", upstreamStatus: imageResponse.status }, { status: 502 });
    }
    const contentType = imageResponse.headers.get("content-type")?.split(";")[0]?.trim() || "";
    if (!["image/png", "image/jpeg", "image/webp"].includes(contentType)) {
      return NextResponse.json({ error: "v0 leverde geen ondersteund screenshotformaat." }, { status: 502 });
    }
    const bytes = await imageResponse.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Screenshot ontbreekt of is te groot voor veilige verwerking." }, { status: 502 });
    }
    console.info("Lumivey existing v0 desktop screenshot", JSON.stringify({ chatId, versionId: version.id, screenshotFetchMs: Math.round(performance.now() - started), bytes: bytes.byteLength }));
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-Lumivey-Image-Source": "v0-version-screenshot",
      },
    });
  } catch (error) {
    console.error("Lumivey existing v0 screenshot failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Screenshot ophalen mislukt. Er is geen nieuwe build gestart." }, { status: 502 });
  }
}
