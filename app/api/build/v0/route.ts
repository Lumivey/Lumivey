import { NextResponse } from "next/server";

/**
 * Temporary fail-closed safety gate on the draft branch.
 * The previous general build route accepted a client-provided Website Brief and
 * called the paid v0 API without verified owner authorization, durable Preview
 * approval, an exact-branch database check, or a transactionally claimed job.
 *
 * Do not introduce a fallback, environment flag, or alternate paid endpoint.
 * Restore generation only after server-side authorization + immutable approval,
 * verified Neon branch/RLS, and an integrated one-shot ledger pass real tests.
 * Previous implementation is recoverable from Git history.
 */
export async function POST(_request: Request) {
  return NextResponse.json(
    {
      error: "v0-generatie is tijdelijk uitgeschakeld totdat autorisatie en eenmalige database-reservering zijn getest.",
      code: "V0_BUILD_SAFETY_GATE_CLOSED",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
