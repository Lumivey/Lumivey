import { NextResponse } from "next/server";

const CORRECTION = `
CORRECTION ROUND — keep the current build, but restore the WoW factor of the approved Preview.

The current implementation understood the palette and hero, but it became too sparse and too black in the lower half. The approved Preview is visually richer and more cinematic. Do NOT redesign from scratch; refine the current version toward the Preview.

Critical corrections:
- Keep the current hero with the REAL Michael photo. That part is strong and must remain the primary human anchor.
- Keep the dark premium base and yellow/gold accent language.
- Restore visual richness below the hero. The lower half is currently too empty, flat and black. In the approved Preview, photography, texture, close-up car imagery, warm glows, overlapping visual planes and image/text interplay continue through the entire page.
- Do not let large stretches become plain black background with only text. Use visually meaningful automotive/detailing imagery and subtle atmospheric treatments to maintain energy and continuity.
- Treat the whole homepage as one flowing editorial composition, not separate black sections stacked vertically.
- Make the services area more visual and tactile, closer to the approved Preview: real/detail-oriented imagery for washing, claying, polishing, protection and wetlook, integrated into the page rather than isolated as simple icon columns.
- The Porsche 356 story remains SUPPORTING, not the main business story. Its visual should feel like a smaller emotional origin-story moment, preferably an archival/polaroid style placeholder if no real image is available yet.
- The current faux old-photo placeholder and Michael signature are creative placeholders only. Keep them only as clearly artistic direction; they still require later validation/replacement with real source material.
- Add more visual movement and depth near the final CTA: use a strong car close-up / glossy yellow bodywork treatment similar to the approved Preview instead of ending on a mostly empty black field.
- Preserve clean responsive behavior on desktop and mobile.
- Do not invent factual contact details, prices, awards, certifications, addresses or biography.

Success criterion: when Michael sees the site, it should carry the same visual excitement and emotional recognition as the approved Preview, not merely the same colors and headings.
`;

async function v0Fetch(path: string, init?: RequestInit) {
  const apiKey = process.env.V0_API_KEY;
  if (!apiKey) throw new Error("V0_API_KEY ontbreekt.");

  const response = await fetch(`https://api.v0.dev/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || data?.error || `v0 request failed: ${path}`;
    throw new Error(String(message));
  }
  return data;
}

function flattenChats(data: any): any[] {
  const raw = Array.isArray(data?.data) ? data.data : [];
  return raw.flatMap((item: any) => (Array.isArray(item) ? item : [item])).filter(Boolean);
}

export async function GET() {
  try {
    const list = await v0Fetch("/chats?limit=20");
    const chats = flattenChats(list)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());

    let target: any = null;
    for (const chat of chats) {
      if (!chat?.id) continue;
      const detail = await v0Fetch(`/chats/${encodeURIComponent(chat.id)}`);
      const haystack = [
        detail?.name,
        detail?.title,
        detail?.text,
        ...(Array.isArray(detail?.messages) ? detail.messages.map((m: any) => m?.content) : []),
      ]
        .filter(Boolean)
        .join("\n")
        .toLowerCase();

      if (haystack.includes("michael") && (haystack.includes("porsche 356") || haystack.includes("high-end detailing"))) {
        target = detail;
        break;
      }
    }

    if (!target?.id) {
      return NextResponse.json({ error: "Geen recente Michael v0-chat gevonden." }, { status: 404 });
    }

    const corrected = await v0Fetch(`/chats/${encodeURIComponent(target.id)}/messages`, {
      method: "POST",
      body: JSON.stringify({ message: CORRECTION }),
    });

    return NextResponse.json({
      ok: true,
      chatId: target.id,
      webUrl: target.webUrl || target.url,
      demoUrl: corrected?.latestVersion?.demoUrl || corrected?.demo,
      instruction: CORRECTION.trim(),
    });
  } catch (error) {
    console.error("Michael v0 correction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Correctieronde kon niet worden verstuurd." },
      { status: 500 }
    );
  }
}
