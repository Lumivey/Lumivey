import { NextResponse } from "next/server";

/**
 * Temporary fail-closed gate on the draft branch.
 * The previous GET enumerated v0 chats and POSTed a paid correction message.
 * A GET must never initiate a paid mutation; it also had no operator auth,
 * owner-scoped chat selection, consent or one-shot correction identity.
 * Keep the prior creative correction instruction in Git history until it can
 * be used safely by an authenticated, explicitly approved POST workflow.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "Automatische v0-correcties zijn uitgeschakeld totdat de eigenaar en exact goedgekeurde chat/versie server-side zijn vastgesteld.",
      code: "V0_BUILD_SAFETY_GATE_CLOSED",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
