import { NextResponse } from "next/server";

/**
 * Temporary fail-closed gate. Previously this handler called correctV0Build
 * through the adapter after same-origin and client-supplied version checks.
 * Those checks are not owner authorization or a durable one-shot claim.
 * Reopen only as an authenticated, owner/chat/version-bound POST after a
 * committed database claim and real concurrency tests. Never retry an
 * uncertain upstream correction automatically.
 */
export async function POST(_request: Request) {
  return NextResponse.json(
    {
      error: "Adrie v0-correcties zijn tijdelijk uitgeschakeld totdat autorisatie en eenmalige database-reservering zijn getest.",
      code: "V0_BUILD_SAFETY_GATE_CLOSED",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
