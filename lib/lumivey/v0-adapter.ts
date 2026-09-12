import { WebsiteBrief, WebsiteAsset } from "@/lib/lumivey/primary-flow";

type V0BuildResult = {
  chatId: string;
  webUrl?: string;
  previewUrl?: string;
  raw: unknown;
};

type V0Attachment = { url: string } | { name?: string; content: string };

function compositionalRole(asset: WebsiteAsset): string {
  const role = (asset.role || "").toLowerCase();

  if (asset.purpose === "primary") return "HERO_PRIMARY";
  if (role.includes("cta") || role.includes("climax")) return "CTA_CLIMAX";
  if (role.includes("dienst") || role.includes("service") || role.includes("werkwijze") || role.includes("proces")) return "SERVICE_PROCESS";
  if (role.includes("oorsprong") || role.includes("origin") || role.includes("verhaal") || role.includes("vader")) return "STORY_ORIGIN";
  if (role.includes("detail") || role.includes("textuur") || role.includes("texture")) return "DETAIL_TEXTURE";
  return "SUPPORTING_VISUAL";
}

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
      compositionalRole: compositionalRole(asset),
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
- Attachments after the Preview are clean production assets mapped to visual responsibilities from the approved Preview.
- Respect each asset's compositionalRole, role, origin, validation status and production instruction.
- The role describes WHAT JOB the image must do in the composition, not a rigid pixel position. Preserve your creative freedom while making sure each important role is visibly fulfilled.
- HERO_PRIMARY: identity anchor in the opening experience. It should carry strong visual weight.
- SERVICE_PROCESS: use meaningfully in the services/working-method part of the page so that section is not reduced to text/icons only.
- STORY_ORIGIN: use in the personal origin-story area. Keep it emotionally meaningful but secondary to the current business proposition.
- DETAIL_TEXTURE: use as an accent/detail layer to create depth, materiality and rhythm. Do not let it dominate the page.
- CTA_CLIMAX: use toward the closing conversion area as a strong visual climax, not as a small thumbnail.
- SUPPORTING_VISUAL: use where it strengthens pacing and continuity without competing with the hero.
- A generated personal image may be used as an artistic element when marked as such. Do not silently present it as documentary truth.
- When a real customer asset is supplied for the same role, prefer it over a generated substitute.
- Do not repeatedly crop/reuse one real photo where dedicated mapped assets are supplied for other visual moments.
- Do not leave an important supplied asset unused unless using it would conflict with the approved Preview or truth guardrails.

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
