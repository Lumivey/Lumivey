import { NextResponse } from "next/server";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/** Read-only probe of the existing v1 v0 chat: no new generation or credits. */
export async function GET(request: Request) {
  const chatId = new URL(request.url).searchParams.get("chatId")?.trim() || "";
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(chatId)) {
    return NextResponse.json({ error: "Geldige v0 chat-ID ontbreekt." }, { status: 400 });
  }
  const key = process.env.V0_API_KEY;
  if (!key) return NextResponse.json({ error: "V0_API_KEY ontbreekt." }, { status: 503 });

  const lookupStartedAt = new Date().toISOString();
  const started = performance.now();
  try {
    const response = await fetch(`https://api.v0.dev/v1/chats/${encodeURIComponent(chatId)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      // Do not parse or return upstream error bodies: they may contain private account data.
      console.warn("Lumivey v0 status upstream error", JSON.stringify({ chatId, httpStatus: response.status, lookupStartedAt, statusLookupMs: Math.round(performance.now() - started) }));
      return NextResponse.json({ error: "v0-status kon niet worden opgehaald.", upstreamStatus: response.status }, { status: 502 });
    }
    const data = await response.json();
    const version = data?.latestVersion;
    const rawStatus = version?.status;
    const status = rawStatus === "completed" || rawStatus === "failed" || rawStatus === "pending"
      ? rawStatus : "unknown";
    const createdMs = typeof version?.createdAt === "string" ? Date.parse(version.createdAt) : NaN;
    const updatedMs = typeof version?.updatedAt === "string" ? Date.parse(version.updatedAt) : NaN;
    const versionCreatedAt = Number.isFinite(createdMs) ? new Date(createdMs).toISOString() : null;
    const versionUpdatedAt = Number.isFinite(updatedMs) ? new Date(updatedMs).toISOString() : null;
    const generationMs = status !== "pending" && status !== "unknown" && versionCreatedAt && versionUpdatedAt && updatedMs >= createdMs
      ? updatedMs - createdMs : null;
    const checkedAt = new Date().toISOString();
    const statusLookupMs = Math.round(performance.now() - started);
    const versionId = typeof version?.id === "string" ? version.id : null;
    // These are metadata-only timestamps to correlate the existing submission and screenshot logs.
    // In particular, updatedAt is not a confirmed model-completion timestamp; never present it as end-to-end time.
    console.info("Lumivey v0 status timing", JSON.stringify({ chatId, versionId, status, lookupStartedAt, checkedAt, statusLookupMs, versionCreatedAt, versionUpdatedAt, generationMs }));
    return NextResponse.json({
      chatId,
      status,
      versionId,
      previewUrl: status === "completed" && typeof version?.demoUrl === "string" ? version.demoUrl : null,
      generationMs,
      versionCreatedAt,
      versionUpdatedAt,
      lookupStartedAt,
      checkedAt,
      statusLookupMs,
      note: generationMs === null
        ? "Generatieduur niet beschikbaar: v0 heeft geen geldige begin- en eindtijd voor deze versie teruggegeven."
        : "Gemeten verschil tussen createdAt en updatedAt van de v0-versie, niet de volledige Lumivey-doorlooptijd.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // A failed GET is safe to repeat. Never log upstream payloads or credentials.
    console.error("Lumivey v0 status lookup failed", JSON.stringify({ chatId, lookupStartedAt, statusLookupMs: Math.round(performance.now() - started), reason: error instanceof Error ? error.name : "unknown" }));
    return NextResponse.json({ error: "v0-statuscontrole is mislukt; geen nieuwe build gestart." }, { status: 502 });
  }
}
