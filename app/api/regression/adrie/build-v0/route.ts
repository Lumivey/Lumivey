import { NextResponse } from "next/server";

/**
 * Temporary fail-closed safety gate on the draft branch.
 * The former route trusted caller-provided Preview evaluation and humanApproved,
 * then directly invoked the paid v0 API without a verified server-side owner,
 * durable approval, or the transactional job ledger.
 *
 * Do not restore the former handler or add a bypass flag. Rebuild this route only
 * when authorization, immutable approved inputs, exact Neon branch, RLS and
 * atomic one-shot claim have been independently verified and integration-tested.
 * The previous implementation remains recoverable in Git history.
 */
export async function POST(_request: Request) {
  return NextResponse.json(
    {
      error: "Adrie v0-generatie is tijdelijk uitgeschakeld totdat autorisatie en eenmalige database-reservering zijn getest.",
      code: "V0_BUILD_SAFETY_GATE_CLOSED",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
