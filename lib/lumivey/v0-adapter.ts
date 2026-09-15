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
  let attachmentOrder = 1;

  return {
    version: brief.version,
    understanding: understandingWithoutSources,
    artistImpression: {
      id: brief.artistImpression.id,
      headline: brief.artistImpression.headline,
      rationale: brief.artistImpression.rationale,
      createdAt: brief.artistImpression.createdAt,
      note: "The approved Preview screenshot is deliberately NOT attached. Use the approved rationale, Website Brief and asset roles as design guidance; never render a screenshot shortcut.",
    },
    facts: brief.facts,
    assets: brief.assets.map((asset) => {
      const attached = isAttachableImage(asset);
      const currentOrder = attached ? attachmentOrder++ : undefined;
      return {
        attachmentOrder: currentOrder,
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
        attached,
      };
    }),
    pages: brief.pages,
    functionalRequirements: brief.functionalRequirements,
    constraints: brief.constraints,
    unknowns: brief.unknowns,
  };
}

function buildV0Prompt(brief: WebsiteBrief): string {
  const compactBrief = compactBriefForV0(brief);
  const approvedRationale = brief.artistImpression.rationale.join("\n- ");

  return `
You are the technical production engine for Lumivey.
Build a real responsive website from the approved Lumivey direction and the supplied production assets.

ABSOLUTE REFERENCE/PRODUCTION SEPARATION
- The original approved Preview screenshot is NOT attached to this request on purpose.
- Never invent, reconstruct or embed a full-page screenshot as a shortcut.
- Build the website as genuine HTML/CSS/components.
- All attachments in this request are production assets only.
- Never create a fake screenshot of the Preview and never use any full-page image as the website surface.

APPROVED PREVIEW RATIONALE
- ${approvedRationale}

DESIGN AUTHORITY
- The approved rationale, Website Brief and asset roles are the design authority for hierarchy, pacing, image use, atmosphere, color rhythm and section relationships.
- Do not redesign the work into a safer, flatter or more generic consultant website.
- Preserve information density and rhythm. No giant empty areas, accidental whitespace or image/text scale mismatches.
- Do not increase the number of appearances of a person, hobby, prop or image beyond what the approved direction requires.
- For a solo knowledge/trust professional, use one clear recognizable homepage appearance by default unless the brief explicitly requires more.
- Keep personal hobbies or rituals secondary to the professional proposition unless the approved direction explicitly makes them central.

PRODUCTION ASSET RULES
- Respect each asset's compositionalRole, role, origin, validation status and production instruction.
- HERO_PRIMARY: strong opening identity anchor.
- SERVICE_PROCESS: services or working-method support.
- STORY_ORIGIN: personal/origin context, always secondary to the current proposition unless the approved direction says otherwise.
- DETAIL_TEXTURE: accent only; never dominate.
- CTA_CLIMAX: closing conversion area.
- SUPPORTING_VISUAL: pacing and continuity.
- Uploaded photos are a SOURCE POOL, not a quota. Do not force all images into the homepage.
- Prefer real customer assets over generated substitutes.
- Keep real people recognizable. Never crop off faces or heads in prominent imagery unless the approved direction explicitly requires it.
- HUMAN IMAGE CREDIBILITY IS A HARD GATE: no floating hands, arms, heads, disconnected body fragments or implausible crops.
- Do not repeatedly reuse or recrop the same person photo where the approved direction calls for other visual content.
- Do not infer a service from a hobby or recurring prop.

TRUTH & FUNCTION GUARDRAILS
- Do not invent phone numbers, email addresses, addresses, opening hours, prices, years of experience, awards, certifications, clients, projects, staff, services or biography.
- If information is unknown, omit it or clearly mark it as a placeholder.
- The result must work responsively on desktop and mobile.
- Do not mention v0, Vercel, prompts, AI tooling or Lumivey's internal process in the public website.

FINAL SELF-CHECK
Before returning the build, verify:
1. There is no full-page screenshot or Preview image rendered anywhere.
2. A solo knowledge/trust professional is not unnecessarily repeated across the homepage.
3. There are no oversized body crops or repeated person images that were not requested.
4. The section order, density, hierarchy and emotional rhythm remain faithful to the approved direction.
5. Only supplied production assets are rendered as images.
6. There are no giant blank regions or broken desktop proportions.
If any check fails, fix it before returning the build.

WEBSITE BRIEF / PRODUCTION GUARDRAILS
${JSON.stringify(compactBrief, null, 2)}
`;
}

function buildV0Attachments(brief: WebsiteBrief): V0Attachment[] {
  const attachments: V0Attachment[] = [];

  // Never attach the approved Preview screenshot. v0 can treat any attached image
  // as a production asset even when a prompt says reference-only.
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
  if (!apiKey) throw new Error("V0_API_KEY ontbreekt.");

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

  if (!chatId) throw new Error("v0 gaf geen chat-id terug.");

  const webUrl = returnedWebUrl || `https://v0.dev/chat/${chatId}`;
  return { chatId, previewUrl, webUrl, raw: data };
}

export async function correctV0Build(chatId: string, instruction: string): Promise<unknown> {
  const apiKey = process.env.V0_API_KEY;
  if (!apiKey) throw new Error("V0_API_KEY ontbreekt.");

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
