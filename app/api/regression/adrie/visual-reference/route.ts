import { NextResponse } from "next/server";

/**
 * Temporary fail-closed gate. The previous POST submitted a paid v0 correction
 * after same-origin/header and message-history checks, but without authenticated
 * operator ownership or a committed transactional one-shot claim. Those checks
 * cannot establish authorization or prevent concurrent paid submissions.
 *
 * The old diagnostic implementation is available in Git history. Do not revive
 * it or add a shared-secret/header bypass. Corrections need a verified owner,
 * an exact approved chat/version, an immutable instruction/assets revision and
 * a durable claim, and must be POST-only.
 */
export async function POST(_request: Request) {
  return NextResponse.json(
    {
      error: "De betaalde visuele correctie is tijdelijk uitgeschakeld totdat autorisatie en eenmalige database-reservering zijn getest.",
      code: "V0_BUILD_SAFETY_GATE_CLOSED",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
