import { NextResponse } from "next/server";
import { GET as getStatus } from "@/app/api/regression/adrie/build-status/route";
import { GET as getDesktop } from "@/app/api/regression/adrie/build-screenshot/route";
import { GET as getMobile } from "@/app/api/regression/adrie/mobile-screenshot/route";
import { POST as runIndependentQA } from "@/app/api/qa/preview-retention/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CHAT_ID = /^[a-zA-Z0-9_-]{8,128}$/;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

async function imageAsDataUrl(response: Response, label: string): Promise<string> {
  if (!response.ok) {
    let reason = `${label}: render niet beschikbaar (HTTP ${response.status}).`;
    try {
      const payload = await response.json();
      if (typeof payload?.error === "string") reason = `${label}: ${payload.error}`;
    } catch { /* An error response does not have to be JSON. */ }
    throw new Error(reason);
  }
  const type = response.headers.get("content-type")?.split(";")[0]?.trim() || "";
  if (!["image/png", "image/jpeg", "image/webp"].includes(type)) throw new Error(`${label}: onjuist screenshotformaat.`);
  const bytes = await response.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > MAX_IMAGE_BYTES) throw new Error(`${label}: screenshot leeg of te groot.`);
  return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
}

/** One QA pass must compare renders of ONE completed v0 version; never silently mix revisions. */
async function completedVersion(requestUrl: string, chatId: string): Promise<string> {
  const url = new URL(`/api/regression/adrie/build-status?chatId=${encodeURIComponent(chatId)}`, requestUrl);
  const response = await getStatus(new Request(url));
  if (!response.ok) throw new Error(`v0-versiecontrole is niet beschikbaar (HTTP ${response.status}). QA gestopt.`);
  const result = await response.json();
  if (result?.status !== "completed" || typeof result?.versionId !== "string" || !result.versionId.trim()) {
    throw new Error("Er is geen aantoonbaar voltooide v0-versie met versie-ID. QA gestopt.");
  }
  return result.versionId;
}

/** Uses ONLY an approved Preview and locked signature provided by the calling build flow.
 * Never regenerates Discovery, the Preview or a v0 chat. Missing inputs or changed versions stop QA.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const chatId = typeof body?.chatId === "string" ? body.chatId.trim() : "";
    if (!CHAT_ID.test(chatId)) return NextResponse.json({ error: "Geldige bestaande v0-chat-ID ontbreekt." }, { status: 400 });
    const signature = body?.previewSignature;
    const approvedPreview = body?.approvedPreview;
    if (!signature || typeof signature !== "object" || typeof signature.previewId !== "string" || !signature.previewId.trim()) {
      return NextResponse.json({ error: "De gelockte PreviewSignature ontbreekt. Geen vervangende signatuur genereren." }, { status: 400 });
    }
    if (typeof body?.approvedPreviewId !== "string" || signature.previewId !== body.approvedPreviewId) {
      return NextResponse.json({ error: "Preview-ID komt niet overeen met de goedgekeurde signatuur; QA geblokkeerd." }, { status: 409 });
    }
    if (typeof approvedPreview !== "string" || !/^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/i.test(approvedPreview)) {
      return NextResponse.json({ error: "Het werkelijk goedgekeurde Preview-beeld ontbreekt; QA kan niet betrouwbaar worden uitgevoerd." }, { status: 400 });
    }
    const started = performance.now();
    const versionId = await completedVersion(request.url, chatId);
    // The caller may bind QA to the version returned by its own build-status poll.
    if (body?.expectedVersionId !== undefined && body.expectedVersionId !== versionId) {
      return NextResponse.json({ error: "De v0-versie wijkt af van de aangevraagde versie. QA geblokkeerd.", publishable: false }, { status: 409 });
    }
    const base = new URL(request.url);
    const desktopRequest = new Request(new URL(`/api/regression/adrie/build-screenshot?chatId=${encodeURIComponent(chatId)}`, base));
    const mobileRequest = new Request(new URL(`/api/regression/adrie/mobile-screenshot?chatId=${encodeURIComponent(chatId)}`, base));
    // Reuse server-side capture handlers directly: no self-fetch across deployment protection or exposed keys.
    const [desktopResult, mobileResult] = await Promise.allSettled([getDesktop(desktopRequest), getMobile(mobileRequest)]);
    if (desktopResult.status !== "fulfilled" || mobileResult.status !== "fulfilled") {
      return NextResponse.json({ error: "Desktop- of mobiele render is mislukt. Onafhankelijke QA is niet gestart en publicatie blijft geblokkeerd.", publishable: false }, { status: 424 });
    }
    let websiteDesktop: string;
    let websiteMobile: string;
    try {
      [websiteDesktop, websiteMobile] = await Promise.all([
        imageAsDataUrl(desktopResult.value, "Desktop"),
        imageAsDataUrl(mobileResult.value, "Mobiel"),
      ]);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Screenshot ontbreekt.", publishable: false }, { status: 424 });
    }
    // Both capture routes read latestVersion independently. A version that changed during capture
    // cannot be compared against the old approved Preview or sent to the corrector as the old build.
    const afterCaptureVersion = await completedVersion(request.url, chatId);
    if (afterCaptureVersion !== versionId) {
      return NextResponse.json({ error: "v0 heeft tijdens de screenshots een nieuwe versie opgeleverd. De renders kunnen verschillen: QA gestopt, geen nieuwe build gestart.", publishable: false }, { status: 409 });
    }
    const captureMs = Math.round(performance.now() - started);
    const qaRequest = new Request(new URL("/api/qa/preview-retention", base), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approvedPreview,
        previewSignature: signature,
        websiteDesktop,
        websiteMobile,
        factsAndAssetsToVerify: Array.isArray(body?.factsAndAssetsToVerify) ? body.factsAndAssetsToVerify : [],
      }),
    });
    const qaResponse = await runIndependentQA(qaRequest);
    if (!qaResponse.ok) {
      return NextResponse.json({ error: "Onafhankelijke QA kon niet worden afgerond; website niet vrijgegeven.", publishable: false, captureMs, qaHttpStatus: qaResponse.status }, { status: 502 });
    }
    const report = await qaResponse.json();
    const qaMs = Math.round(performance.now() - started) - captureMs;
    console.info("Lumivey existing Adrie screenshot + QA timings", JSON.stringify({ chatId, versionId, previewId: signature.previewId, captureMs, qaMs, overall: report?.overall }));
    return NextResponse.json({ ...report, chatId, versionId, timing: { captureMs, qaMs, totalMs: Math.round(performance.now() - started), note: "Dezelfde v0-versie gerenderd en beoordeeld; er is geen nieuwe v0-build gestart." } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Lumivey existing Adrie QA failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Website-QA is mislukt of de v0-versie is niet bereikbaar; publicatie blijft geblokkeerd en er is geen nieuwe build gestart.", publishable: false }, { status: 502 });
  }
}
