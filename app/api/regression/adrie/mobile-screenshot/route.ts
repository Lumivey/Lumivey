import { NextResponse } from "next/server";
import { isAllowedV0PreviewUrl } from "@/lib/lumivey/allowed-v0-preview-host";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CHAT_ID = /^[a-zA-Z0-9_-]{8,128}$/;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Only the v0 API may supply the preview URL; never proxy a caller-controlled URL. */
export async function GET(request: Request) {
  const chatId = new URL(request.url).searchParams.get("chatId")?.trim() || "";
  if (!CHAT_ID.test(chatId)) return NextResponse.json({ error: "Geldige v0 chat-ID ontbreekt." }, { status: 400 });
  const v0Key = process.env.V0_API_KEY;
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  if (!v0Key || !firecrawlKey) {
    return NextResponse.json({ error: "v0- of Firecrawl-API-sleutel ontbreekt voor mobiele controle." }, { status: 503 });
  }

  try {
    const started = performance.now();
    const response = await fetch(`https://api.v0.dev/v1/chats/${encodeURIComponent(chatId)}`, {
      headers: { Authorization: `Bearer ${v0Key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return NextResponse.json({ error: "Bestaande v0-chat is niet toegankelijk via de API.", upstreamStatus: response.status }, { status: 502 });
    const chat = await response.json();
    const version = chat?.latestVersion;
    if (version?.status !== "completed") return NextResponse.json({ error: "Deze v0-versie is niet gereed." }, { status: 409 });
    const preview = version?.demoUrl;
    if (typeof preview !== "string") return NextResponse.json({ error: "v0 heeft geen renderbare Preview-URL beschikbaar gesteld." }, { status: 424 });
    // v0's authenticated API returns vusercontent.net sandbox previews as well as older v0/vercel URLs.
    // Keep the host allowlist narrow; never allow arbitrary HTTPS or caller-supplied URLs.
    if (!isAllowedV0PreviewUrl(preview)) {
      console.warn("Lumivey v0 mobile preview host denied", JSON.stringify({ chatId, previewHost: (() => { try { return new URL(preview).hostname; } catch { return "invalid"; } })() }));
      return NextResponse.json({ error: "De v0-Preview heeft geen vertrouwde renderlocatie." }, { status: 502 });
    }
    // Firecrawl already belongs to Lumivey's stack. A mobile viewport is essential: resizing a desktop screenshot is not a mobile test.
    const scrape = await fetch(process.env.FIRECRAWL_API_URL || "https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: preview,
        mobile: true,
        formats: [{ type: "screenshot", fullPage: true, viewport: { width: 390, height: 844 }, quality: 85 }],
        onlyMainContent: false,
        waitFor: 1200,
        maxAge: 0,
        timeout: 60000,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(75000),
    });
    if (!scrape.ok) {
      console.warn("Lumivey mobile screenshot Firecrawl error", JSON.stringify({ chatId, upstreamStatus: scrape.status }));
      return NextResponse.json({ error: "Mobiele render via Firecrawl mislukt; QA blijft geblokkeerd.", upstreamStatus: scrape.status }, { status: 502 });
    }
    const payload = await scrape.json();
    const image = payload?.data?.screenshot ?? payload?.screenshot;
    if (payload?.success === false || typeof image !== "string" || !image.startsWith("https://")) {
      return NextResponse.json({ error: "Firecrawl heeft geen echte mobiele screenshot teruggegeven; QA blijft geblokkeerd." }, { status: 502 });
    }
    const imageUrl = new URL(image);
    if (imageUrl.username || imageUrl.password || imageUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Ongeldige screenshotlocatie." }, { status: 502 });
    }
    const render = await fetch(imageUrl, { cache: "no-store", signal: AbortSignal.timeout(20000) });
    if (!render.ok) return NextResponse.json({ error: "Mobiele screenshot is niet te downloaden; QA blijft geblokkeerd." }, { status: 502 });
    const type = render.headers.get("content-type")?.split(";")[0]?.trim() || "";
    if (!["image/png", "image/jpeg", "image/webp"].includes(type)) return NextResponse.json({ error: "Geen geldig mobiel screenshotformaat." }, { status: 502 });
    const bytes = await render.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Mobiele screenshot is leeg of te groot." }, { status: 502 });
    console.info("Lumivey existing v0 mobile screenshot", JSON.stringify({ chatId, screenshotFetchMs: Math.round(performance.now() - started), bytes: bytes.byteLength }));
    return new Response(bytes, {
      headers: { "Content-Type": type, "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff", "X-Lumivey-Image-Source": "firecrawl-mobile-390px" },
    });
  } catch (error) {
    console.error("Lumivey mobile screenshot failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Mobiele websitecontrole mislukt. Geen nieuwe build gestart." }, { status: 502 });
  }
}
