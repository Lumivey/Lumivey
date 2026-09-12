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
      note: "The approved Preview is supplied separately as an attachment and is the design authority.",
    },
    facts: brief.facts,
    assets: brief.assets.map((asset, index) => ({
      attachmentOrder: index + 2,
      name: asset.name,
      kind: asset.kind,
      purpose: asset.purpose,
      aiStatus: asset.aiStatus,
      role: asset.role,
      origin: asset.origin,
      validationStatus: asset.validationStatus,
      productionInstruction: asset.productionInstruction,
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
Turn the approved Preview into a real responsive website using the supplied production assets.

DESIGN AUTHORITY
- Attachment 1 is the APPROVED PREVIEW. The customer has already approved this direction.
- Treat the Preview as the primary source of truth for composition, visual richness, hierarchy, pacing, imagery, atmosphere, typography feeling, color rhythm, overlaps, texture and emotional impact.
- Recreate the Preview's intent as faithfully as technically practical. Do not redesign it into a safer, flatter or more generic website.
- Use your own implementation creativity where exact reproduction is not practical, but preserve the same story, energy and recognition.
- The Website Brief is a guardrail for truth, required functionality and asset meaning. It is NOT a second design brief and must not override the approved Preview unless there is a factual/safety/technical conflict.

ASSET MAP
- Attachments after the Preview are production assets mapped to visible elements from the approved Preview.
- Respect each asset's role, origin, validation status and production instruction.
- A preview-derived or generated personal image may be used as an artistic element when marked as such. Do not silently present it as documentary truth.
- When a real customer asset is supplied for the same role, prefer it over a generated substitute.
- Do not repeatedly crop/reuse one real photo where dedicated mapped assets are supplied for other visual moments.

TRUTH & FUNCTION GUARDRAILS
- Do not invent phone numbers, email addresses, addresses, opening hours, prices, years of experience, awards, certifications, clients, projects, staff, services or biography.
- If information is unknown, omit it or clearly mark it as a placeholder.
- The result must work responsively on desktop and mobile.
- Do not mention v0, Vercel, prompts, AI tooling or Lumivey's internal process in the public website.

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
