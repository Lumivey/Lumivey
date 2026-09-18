import { NextResponse } from "next/server";

/**
 * Temporary fail-closed gate: the original generic correction handler accepted
 * a caller-supplied chat ID and free-form instruction, then issued a paid v0
 * correction without owner authorization, version binding or a durable claim.
 * Reopen only through the one authenticated, owner/chat/version-bound mutation
 * service after its transaction and concurrency tests have passed.
 */
export async function POST(_request: Request) {
  return NextResponse.json(
    {
      error: "v0-correcties zijn tijdelijk uitgeschakeld totdat autorisatie en eenmalige database-reservering zijn getest.",
      code: "V0_BUILD_SAFETY_GATE_CLOSED",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
