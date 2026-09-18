import { NextResponse } from "next/server";

/**
 * Temporary fail-closed gate on the draft branch.
 * Former Michael clean build generated paid images AND called v0 from a
 * public POST with caller-supplied photos/Preview. No authenticated operator,
 * durable approval or one-shot ledger was checked.
 * Keep reference implementation in Git history; do not add a bypass.
 */
export async function POST(_request: Request) {
  return NextResponse.json(
    {
      error: "Michael clean build is tijdelijk uitgeschakeld totdat autorisatie, goedkeuring en de eenmalige build-reservering zijn getest.",
      code: "V0_BUILD_SAFETY_GATE_CLOSED",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
