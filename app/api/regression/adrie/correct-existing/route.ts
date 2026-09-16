import { NextResponse } from "next/server";
import { GET as getBuildStatus } from "@/app/api/regression/adrie/build-status/route";
import { correctV0Build } from "@/lib/lumivey/v0-adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CHAT_ID = "jncA2EfHpLj";

/** Only the owner-facing regression page should trigger this fixed, narrowly scoped correction.
 * This is an internal regression route, not a general-purpose AI prompt proxy.
 * The original approved image is NOT passed as a production attachment.
 */
const CORRECTION = `LUMIVEY — TARGETED CORRECTION OF THE EXISTING ASSETPOUWER WEBSITE IN THIS CHAT. Edit the existing project and its files; do not create a new chat or remake Discovery/Preview. The current website was rejected by the owner. Treat this as a human-requested correction, NOT a certified QA result. Build actual responsive HTML/CSS/SVG, never embed a full-page preview screenshot.\n\nPRIMARY DESIGN AUTHORITY: the owner's approved AssetPouwer artist impression shared 16 September 2026. Hero: one authentic fully recognisable Adrie photo in a wide industrial setting with his entire head and face visible, text left and photo right forming one seamless editorial composition, headline 'Strategisch assetmanagement dat ook buiten moet werken.', fine open framing corners, small 'Strategie ↔ operatie' visual coupling. Current boxed photo layout and cropped heads are rejected. ONE recognisable large Adrie image on the homepage in total; never repeat him in the later personal section. If the original hero photo is not available as an actual production asset in the project, state that it is missing rather than fabricating his face.\n\nMETHOD SECTION: 'Eerst kijken. Dan richting geven.' with technical blue-pipe detail and one CONNECTED four-stage process: Verkennen & luisteren → Analyse & inzicht → Richting & keuzes → Besluit & uitvoeren. Implement a continuous line and restrained focus points, not four detached cards. Mobile can use an equally connected vertical sequence.\n\nDARK PRACTICE SECTION: asymmetrical editorial navy composition with large quote 'Een plan is pas sterk als het in de praktijk werkt.' and a compact numbered explanation. Actual Discovery example: Adrie helped leadership see the consequences of a major change for people and budgets; the organisation decided to phase work over several years. No fabricated client or results.\n\nPROOF: compact light band, not oversized consultancy tiles. AssetPouwer's real offer is independent strategic asset-management advice and interim management, bridging management, technical strategy and operational delivery. Discovery mentions electro-technical systems, industrial automation, instrumentation/control, industry and infrastructure including tunnel installations. A potential customer must understand FOR WHOM, WHAT, WHEN to engage, how Adrie helps and HOW to contact him. Weave this into the actual approved composition; do not flatten its personality to satisfy a marketing checklist.\n\nPERSONAL SIGNATURE: one SMALL secondary forest/landscape section 'Op zondagochtend het bos in. Rustig kijken naar composities.' with delicate framing/focus cue. Photography is a personal hobby and an observation metaphor, never a paid service; NO SECOND ADRIE PHOTO, no similarly dominant image of him.\n\nCLOSING: restrained green 'Eerst eens kennismaken.' section and a genuinely working route to contact. Restore existing authentic logo when supplied; never invent a replacement. Existing site source mentions a 2010 founding date, IAM diploma, ISO 55000, SAMP, contact data and address; source-only details must not be asserted as current facts without owner validation. Do not fabricate facts, credentials, branding, email or telephone. Surface exact missing asset/fact in implementation notes.\n\nDESIGN TRANSFER: preserve the approved asymmetry, quiet ivory/navy/olive rhythm, typography hierarchy, open photographic frame corners, connected line progression, disciplined density, and meaningful word/image connections. No generic alternating stacks or giant blank sections. Maintain accessible responsive navigation, working CTAs, 390px mobile readability, no cut-off human faces or detached anatomy.\n\nDELIVER: EDIT THIS EXISTING CHAT'S CODE ONLY and return its updated version/preview URL, actual changed files, verified design changes, any missing hero/logo or unconfirmed business data. Check real desktop and 390px mobile renders. Do not claim independent Lumivey QA or owner approval; those are separate post-build gates.`;

function sameOriginBrowserRequest(request: Request): boolean {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  const mode = request.headers.get("sec-fetch-mode");
  // Reject non-browser direct calls and CSRF; no caller-defined instruction or chat ID is accepted.
  return origin === url.origin && site === "same-origin" && mode === "cors";
}

export async function POST(request: Request) {
  if (!sameOriginBrowserRequest(request)) {
    return NextResponse.json({ error: "Alleen een directe actie vanuit de Lumivey-testpagina is toegestaan." }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (body?.confirm !== "CORRIGEER_BESTAANDE_ADRIE" || body?.chatId !== CHAT_ID
      || typeof body.expectedVersionId !== "string" || !body.expectedVersionId.trim()) {
      return NextResponse.json({ error: "Bevestiging of bestaand versie-ID ontbreekt. Geen correctie verstuurd." }, { status: 400 });
    }
    const statusRequest = new Request(new URL(`/api/regression/adrie/build-status?chatId=${CHAT_ID}`, request.url));
    const currentResponse = await getBuildStatus(statusRequest);
    if (!currentResponse.ok) return NextResponse.json({ error: "v0-status niet bereikbaar; geen correctie verstuurd." }, { status: 424 });
    const status = await currentResponse.json();
    if (status.status !== "completed" || status.versionId !== body.expectedVersionId) {
      return NextResponse.json({ error: "De chat is niet gereed of de versie is inmiddels gewijzigd. Geen correctie verstuurd.", currentStatus: status.status }, { status: 409 });
    }
    const started = performance.now();
    const response = await correctV0Build(CHAT_ID, CORRECTION);
    console.info("Lumivey existing Adrie correction submitted", JSON.stringify({ chatId: CHAT_ID, previousVersionId: body.expectedVersionId, submissionMs: Math.round(performance.now() - started) }));
    return NextResponse.json({ submitted: true, chatId: CHAT_ID, previousVersionId: body.expectedVersionId,
      submissionMs: Math.round(performance.now() - started),
      note: "Correctieverzoek is bij v0 ingediend. Dit is nog geen voltooide build of QA-goedkeuring.",
      messageId: typeof (response as { id?: unknown })?.id === "string" ? (response as { id: string }).id : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Lumivey Adrie correction submission failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "v0 heeft het correctieverzoek niet aantoonbaar geaccepteerd. Geen nieuw chat aangemaakt.", submitted: false }, { status: 502 });
  }
}
