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

function isAttachableImage(asset: WebsiteAsset): boolean {
  if (asset.kind !== "image") return false;
  if (!asset.dataUrl && !asset.url) return false;
  if (asset.validationStatus === "needs-owner-validation") return false;
  if (asset.validationStatus === "reference-only") return false;
  return true;
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
      note: "The approved Preview is supplied separately as a REFERENCE-ONLY attachment. It is design authority but is never a production asset and must never be rendered in the website.",
    },
    facts: brief.facts,
    assets: brief.assets.map((asset, index) => ({
      attachmentOrder: isAttachableImage(asset) ? index + 2 : undefined,
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
      attached: isAttachableImage(asset),
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

NON-NEGOTIABLE REFERENCE/PRODUCTION SEPARATION
- Attachment 1 is the APPROVED PREVIEW and is REFERENCE ONLY.
- Attachment 1 MUST NEVER be rendered, embedded, imported, copied into public assets, used as an <img>, background-image, CSS image, canvas, screenshot, iframe, poster, hero image, full-page image, or any other visible production element.
- Do not create code that points to Attachment 1 or its URL/data URL.
- Use Attachment 1 only to visually ANALYZE composition, spacing, hierarchy, pacing, typography feeling, color rhythm, section relationships and emotional direction.
- REBUILD the Preview as real HTML/CSS/components. Never solve fidelity by placing the Preview screenshot inside the website.
- Only attachments 2+ may be treated as production image assets.
- If there is any ambiguity between matching the Preview and reusing the Preview image itself, rebuild the structure. The screenshot itself is forbidden as a production shortcut.

DESIGN AUTHORITY
- The approved Preview is the primary source of truth for composition, visual richness, hierarchy, pacing, imagery, atmosphere, typography feeling, color rhythm, overlaps, texture and emotional impact.
- Recreate the Preview's intent as faithfully as technically practical. Do not redesign it into a safer, flatter or more generic website.
- Preserve the Preview's information density and rhythm. Do not introduce giant empty areas, accidental whitespace, oversized blank sections, or image/text scale mismatches that are absent from the approved Preview.
- Maintain coherent max-widths, section heights and responsive proportions. Images should support the same editorial rhythm as the Preview rather than becoming isolated oversized panels.
- Use your own implementation creativity only where exact reproduction is not practical, while preserving the same story, energy and recognition.
- The Website Brief is a guardrail for truth, required functionality and asset meaning. It is NOT a second design brief and must not override the approved Preview unless there is a factual/safety/technical conflict.

ASSET MAP
- Attachments after the Preview are clean production assets mapped to visual responsibilities from the approved Preview.
- Respect each asset's compositionalRole, role, origin, validation status and production instruction.
- Do NOT use assets marked needs-owner-validation or reference-only as production imagery unless they are later explicitly approved and attached.
- The role describes WHAT JOB the image must do in the composition, not a rigid pixel position. Preserve your creative freedom while making sure each important role is visibly fulfilled.
- HERO_PRIMARY: identity anchor in the opening experience. It should carry strong visual weight.
- SERVICE_PROCESS: use meaningfully in the services/working-method part of the page so that section is not reduced to text/icons only.
- STORY_ORIGIN: use in the personal origin-story area. Keep it emotionally meaningful but secondary to the current business proposition.
- DETAIL_TEXTURE: use as an accent/detail layer to create depth, materiality and rhythm. Do not let it dominate the page.
- CTA_CLIMAX: use toward the closing conversion area as a strong visual climax, not as a small thumbnail.
- SUPPORTING_VISUAL: use where it strengthens pacing and continuity without competing with the hero.
- A generated personal image may be used as an artistic element when marked as such. Do not silently present it as documentary truth.
- When a real customer asset is supplied for the same role, prefer it over a generated substitute.
- Keep real people recognizable. Do not crop off faces or heads in prominent imagery unless that crop is explicitly part of the approved Preview.
- HUMAN IMAGE CREDIBILITY IS A HARD GATE: never create floating hands, arms, heads or disconnected body fragments. Every visible body part must have believable anatomical and spatial continuity.
- If a supplied real photo already contains the needed human scene, crop/reuse that photo faithfully instead of reconstructing the person or body part with AI.
- If a crop would make anatomy ambiguous or implausible, show less. Do not invent anatomy to fill the composition.
- Do not repeatedly crop/reuse one real photo where dedicated mapped assets are supplied for other visual moments.
- Uploaded photos form a SOURCE POOL, not a quota. Do not force every supplied image into the homepage.
- A personal ritual, hobby or prop may carry identity, but it must remain secondary to the entrepreneur's professional proposition unless the approved Preview or brief explicitly says otherwise.
- If the same hobby/prop appears in many source photos, normally use it in no more than one or two distinct homepage moments. Do not let repetition make the business look like it sells the hobby.
- Do not infer a service from a personal hobby or recurring prop.
- Do not leave an important supplied approved asset unused unless using it would conflict with the approved Preview or truth guardrails.

TRUTH & FUNCTION GUARDRAILS
- Do not invent phone numbers, email addresses, addresses, opening hours, prices, years of experience, awards, certifications, clients, projects, staff, services or biography.
- If information is unknown, omit it or clearly mark it as a placeholder.
- The result must work responsively on desktop and mobile.
- Do not mention v0, Vercel, prompts, AI tooling or Lumivey's internal process in the public website.

FINAL SELF-CHECK BEFORE YOU FINISH
- Confirm Attachment 1 does not appear anywhere in rendered output or public source code as an image/background/reference URL.
- Confirm the page is reconstructed with real components and attachments 2+ only.
- Confirm there are no giant blank regions or broken desktop proportions compared with the approved Preview.
- Confirm the section order, density, visual hierarchy and emotional rhythm remain recognizably faithful to the approved Preview.
- Confirm real people remain anatomically believable and recognizable.
- If any of these checks fail, fix them before returning the build.

WEBSITE BRIEF / PRODUCTION GUARDRAILS
${JSON.stringify(compactBrief, null, 2)}
`;
}

function buildV0Attachments(brief: WebsiteBrief): V0Attachment[] {
  const attachments: V0Attachment[] = [];

  // The approved Preview is intentionally attached so v0 can visually inspect it,
  // but the prompt classifies it as strict REFERENCE ONLY. It may never become a
  // rendered production asset. Production imagery starts at attachment 2.
  if (brief.artistImpression?.imageDataUrl) {
    attachments.push({ url: brief.artistImpression.imageDataUrl });
  }

  for (const asset of brief.assets) {
    if (!isAttachableImage(asset)) continue;
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

  // v0 generation can take longer than a Vercel function invocation. Start the
  // chat asynchronously so Lumivey's own request returns immediately while v0
  // continues building in its own environment.
  const response = await fetch("https://api.v0.dev/v1/chats", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: buildV0Prompt(brief),
      attachments: buildV0Attachments(brief),
      responseMode: "async",
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
  const returnedWebUrl = data?.url || data?.webUrl || data?.data?.chat?.webUrl;

  if (!chatId) {
    throw new Error("v0 gaf geen chat-id terug.");
  }

  // Async mode may not have a rendered demo yet. The v0 chat URL is available
  // immediately and will show generation progress/results without keeping the
  // Lumivey serverless function open.
  const webUrl = returnedWebUrl || `https://v0.dev/chat/${chatId}`;

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
