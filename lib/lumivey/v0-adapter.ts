import { WebsiteBrief } from "@/lib/lumivey/primary-flow";

type V0BuildResult = {
  chatId: string;
  webUrl?: string;
  previewUrl?: string;
  raw: unknown;
};

type V0Attachment = { url: string } | { name?: string; content: string };

function compactBriefForV0(brief: WebsiteBrief) {
  const { sources: _sources, ...understandingWithoutSources } = brief.understanding;

  return {
    version: brief.version,
    understanding: understandingWithoutSources,
    artistImpression: {
      id: brief.artistImpression.id,
      headline: brief.artistImpression.headline,
      rationale: brief.artistImpression.rationale,
      createdAt: brief.artistImpression.createdAt,
      note: "The customer approved this Preview. It is the design authority and is supplied separately as the first visual attachment.",
    },
    facts: brief.facts,
    assets: brief.assets.map((asset) => ({
      name: asset.name,
      kind: asset.kind,
      purpose: asset.purpose,
      aiStatus: asset.aiStatus,
      url: asset.url,
      source: asset.source ? asset.source.slice(0, 1500) : undefined,
      attached: Boolean(asset.dataUrl || asset.url),
    })),
    pages: brief.pages,
    functionalRequirements: brief.functionalRequirements,
    constraints: brief.constraints,
    unknowns: brief.unknowns,
  };
}

function buildV0Prompt(brief: WebsiteBrief): string {
  const compactBrief = compactBriefForV0(brief);

  return `
You are the technical production engine for Lumivey.
The entrepreneur has already approved the attached Preview and is now moving into production.
Your job is NOT to redesign it from the Website Brief. Your job is to turn that approved creative direction into a real responsive website.

DESIGN AUTHORITY
- The APPROVED PREVIEW attachment is the primary source of truth for visual design.
- Study it closely before building: composition, visual rhythm, image density, atmosphere, hierarchy, typography feeling, color, scale, layering, overlaps, background treatments, texture, pacing, visual surprises and emotional impact.
- Recreate its intent as faithfully as technically practical.
- Use your own frontend/design judgement where literal reproduction is impossible. You have creative freedom to solve implementation details, responsive behavior and missing visual transitions while staying recognizably faithful to the Preview.
- Do NOT simplify a rich Preview into a safer, flatter or more generic website merely because that is easier to implement.
- Do NOT let the Website Brief overrule the Preview on visual composition unless the brief explicitly identifies a hard truth, legal, functional or asset constraint.

THE WEBSITE BRIEF IS A GUARDRAIL, NOT THE DESIGN DRIVER
Use it for:
- confirmed facts and business meaning;
- required functionality and pages;
- truth boundaries and unknowns;
- which assets are real and how they may be used;
- explicit things that must not be invented.
Do not treat prose in the brief as a replacement layout specification when the approved Preview already shows the creative answer.

TRUTH & ASSET RULES
- Do not invent phone numbers, email addresses, addresses, opening hours, prices, years of experience, awards, certifications, clients, projects, staff, services or biography.
- If information is unknown, omit it or clearly mark it as a placeholder.
- Use supplied REAL ASSETS before generic or generated alternatives.
- Do not replace a real entrepreneur/work photo with a generic or generated person when a real asset is supplied.
- Personal AI elements visible in the Preview may remain as clearly creative/illustrative placeholders when they help preserve the approved direction, but must not be presented as verified documentary fact unless validated.
- The real entrepreneur must remain recognizable where the Preview relies on that person for identity.
- The result must work responsively on desktop and mobile.
- Do not mention v0, Vercel, prompts, AI tooling or Lumivey's internal process in the public website.

CREATIVE FREEDOM
You may:
- create additional visual treatments, crops, gradients, masks, overlays, typography moments, transitions and responsive reinterpretations that help the real website retain the Preview's energy;
- use repeated crops or transformed treatments of real supplied images when that supports the approved visual language;
- use temporary non-documentary visual placeholders where the Preview clearly depends on imagery that has not yet been supplied, as long as they are not represented as factual evidence about the entrepreneur.

ASSET PRIORITY
1. Real entrepreneur / team / work / location images supplied as attachments.
2. AI-enhanced real sources that are explicitly supplied as production assets.
3. Approved Preview imagery and visual treatments as creative direction.
4. Generated/generic imagery only when no relevant real source exists and only when it does not impersonate a real person as factual reality.

WEBSITE BRIEF / PRODUCTION GUARDRAILS
${JSON.stringify(compactBrief, null, 2)}
`;
}

function buildV0Attachments(brief: WebsiteBrief): V0Attachment[] {
  const attachments: V0Attachment[] = [];

  if (brief.artistImpression?.imageDataUrl) {
    attachments.push({ url: brief.artistImpression.imageDataUrl });
  }

  for (const asset of brief.assets) {
    if (asset.kind !== "image") continue;
    const assetUrl = asset.dataUrl || asset.url;
    if (!assetUrl) continue;
    attachments.push({ url: assetUrl });
  }

  return attachments;
}

export async function createV0Build(brief: WebsiteBrief): Promise<V0BuildResult> {
  const apiKey = process.env.V0_API_KEY;

  if (!apiKey) {
    throw new Error("V0_API_KEY ontbreekt.");
  }

  const response = await fetch("https://api.v0.dev/v1/chats", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: buildV0Prompt(brief),
      attachments: buildV0Attachments(brief),
      responseMode: "sync",
      chatPrivacy: "private",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || data?.error || "v0-build kon niet worden gestart.";
    throw new Error(String(message));
  }

  const chatId = data?.id || data?.chat?.id || data?.data?.chat?.id;
  const previewUrl = data?.demo || data?.preview?.url || data?.data?.preview?.url;
  const webUrl = data?.url || data?.webUrl || data?.data?.chat?.webUrl;

  if (!chatId) {
    throw new Error("v0 gaf geen chat-id terug.");
  }

  return { chatId, previewUrl, webUrl, raw: data };
}

export async function correctV0Build(chatId: string, instruction: string): Promise<unknown> {
  const apiKey = process.env.V0_API_KEY;

  if (!apiKey) {
    throw new Error("V0_API_KEY ontbreekt.");
  }

  const response = await fetch(`https://api.v0.dev/v1/chats/${chatId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: instruction }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || data?.error || "v0-correctie kon niet worden verstuurd.";
    throw new Error(String(message));
  }

  return data;
}
