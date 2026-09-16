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

  try {
    const start = performance.now();
    const response = await fetch(`https://api.v0.dev/v1/chats/${encodeURIComponent(chatId)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const data: any = await response.json();
    if (!response.ok) {
      // Never return upstream body: it might contain account or customer information.
      console.warn("Lumivey v0 status upstream error", JSON.stringify({ chatId, httpStatus: response.status }));
      return NextResponse.json({ error: "v0-status kon niet worden opgehaald.", upstreamStatus: response.status }, { status: 502 });
    }
    const version = data?.latestVersion;
    const rawStatus = version?.status;
    const status = rawStatus === "completed" || rawStatus === "failed" || rawStatus === "pending"
      ? rawStatus : "unknown";
    const createdMs = Date.parse(version?.createdAt || "");
    const updatedMs = Date.parse(version?.updatedAt || "");
    const generationMs = status !== "pending" && status !== "unknown" && Number.isFinite(createdMs) && Number.isFinite(updatedMs) && updatedMs >= createdMs
      ? updatedMs - createdMs : null;
    const checkedAt = new Date().toISOString();
    console.info("Lumivey v0 status timing", JSON.stringify({ chatId, status, statusLookupMs: Math.round(performance.now() - start), generationMs }));
    return NextResponse.json({
      chatId,
      status,
      versionId: typeof version?.id === "string" ? version.id : null,
      previewUrl: status === "completed" && typeof version?.demoUrl === "string" ? version.demoUrl : null,
      generationMs,
      checkedAt,
      statusLookupMs: Math.round(performance.now() - start),
      note: generationMs === null
        ? "Generatieduur niet beschikbaar: v0 heeft geen geldige begin- en eindtijd voor deze versie teruggegeven."
        : "Gemeten verschil tussen createdAt en updatedAt van de v0-versie, niet de volledige Lumivey-doorlooptijd.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Lumivey v0 status lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "v0-statuscontrole is mislukt; geen nieuwe build gestart." }, { status: 502 });
  }
}
