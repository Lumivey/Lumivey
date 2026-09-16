import { WebsiteBrief, WebsiteAsset } from "@/lib/lumivey/primary-flow";
import { capturePreviewSignature } from "@/lib/lumivey/preview-signature";

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
      note: "The approved Preview screenshot is deliberately NOT attached. Use the locked PreviewSignature and production assets to construct genuine responsive components; never render a screenshot shortcut.",
    },
    previewSignature: brief.previewSignature,
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
  const signature = brief.previewSignature;
  if (!signature || signature.previewId !== brief.artistImpression.id) {
    throw new Error("WoW-signatuur ontbreekt of verwijst naar de verkeerde Preview. v0-build geblokkeerd.");
  }

  return `
You are the technical production engine for Lumivey.
Build a real responsive website from the approved Lumivey direction and supplied production assets.

ABSOLUTE REFERENCE/PRODUCTION SEPARATION
- The original approved Preview screenshot is NOT attached to this request on purpose.
- Never invent, reconstruct or embed a full-page screenshot as a shortcut.
- Build the website as genuine HTML/CSS/components.
- All attachments in this request are production assets only.
- Never create a fake screenshot of the Preview and never use any full-page image as the website surface.

APPROVED PREVIEW RATIONALE
- ${approvedRationale}

LOCKED PREVIEW WOW SIGNATURE — ID ${signature.previewId}
The entrepreneur approved the creative interpretation, not merely its facts. Preserve the reason they recognized themselves:
${JSON.stringify(signature, null, 2)}

MANDATORY CREATIVE TRANSFER
- Implement EACH observed visualMotif using its webTranslation as real responsive HTML/CSS/SVG or typography. Its evidence ties the motif to the actual approved image, not to a generic industry template.
- Preserve EACH wordImageLink so its textual phrase and visual cue reinforce one another in meaningful locations. Never keep the words while deleting the visual relationship.
- Honor every nonNegotiable and prohibitedLoss in the locked signature. These are product requirements, not optional decoration.
- Retain the recognition and creativeMechanism in layout, pacing, typography, image use and navigation; do not replace the original editorial composition with bland cards or alternating generic blocks.
- Different entrepreneurs have different signatures. Do NOT add generic viewfinders, camera motifs, signatures or playful elements unless THIS PreviewSignature explicitly establishes them.
- If an item is genuinely impossible responsively or violates truth/safety, preserve the closest faithful alternative and call out the exact deviation rather than silently dropping it.
- Don't solve layout by reusing the same face/photo multiple times. Preserve the approved proportion between personal and professional content.

TWO INDEPENDENT QUALITY QUESTIONS — BOTH MUST SURVIVE PREVIEW TO WEBSITE
1. Can the entrepreneur recognize their identity, craftsmanship, character and specific creative signature? Never remove the reason for their WoW to make a generic professional site.
2. Can a potential customer quickly understand the actual service/offer, relevant audience or problem, truthful reasons to trust the entrepreneur and how to make contact? Use the already supplied understanding.business.services/audience, verified facts, real case/experience and contact details where available. Show only evidence supported by the source/approval status. Never invent credentials, reviews, projects or contact data. Where no formal credential or testimonial exists, a credible, accurately described working method may establish trust.
- These questions are separate acceptance gates: good copy cannot compensate for lost personality, and a creative design cannot compensate for incomprehensible services or misleading claims.
- Do not turn the artist impression into a conventional marketing landing page, add repetitive proof cards, force personal disclosures or invent a new intake flow.
- If essential offer/contact information is missing from the brief, do not fabricate it: flag the exact missing information for verification in the existing approval process.

DESIGN AUTHORITY
- The approved rationale, locked PreviewSignature, Website Brief and asset roles are design authority for hierarchy, pacing, image use, atmosphere, color rhythm and section relationships.
- Do not redesign the work into a safer, flatter or more generic consultant website.
- Preserve information density and rhythm. No giant empty areas, accidental whitespace or image/text scale mismatches.
- Do not increase the number of appearances of a person, hobby, prop or image beyond what the approved direction requires.
- For a solo knowledge/trust professional, use one clear recognizable homepage appearance by default unless the brief explicitly requires more.
- Keep personal hobbies or rituals secondary to the professional proposition unless approved direction makes them central.

PRODUCTION ASSET RULES
- Respect each asset's compositionalRole, role, origin, validation status and production instruction.
- HERO_PRIMARY: strong opening identity anchor.
- SERVICE_PROCESS: services or working-method support.
- STORY_ORIGIN: personal/origin context, secondary unless approved direction says otherwise.
- DETAIL_TEXTURE: accent only; never dominate.
- CTA_CLIMAX: closing conversion area.
- SUPPORTING_VISUAL: pacing and continuity.
- Uploaded photos are a SOURCE POOL, not a quota. Do not force all images into the homepage.
- Prefer real customer assets over generated substitutes.
- Keep real people recognizable. Never crop off faces or heads in prominent imagery.
- HUMAN IMAGE CREDIBILITY IS A HARD GATE: no floating hands, arms, heads, disconnected body fragments or implausible crops.
- Do not repeatedly reuse or recrop the same person photo where approved direction calls for other visual content.
- Do not infer a service from a hobby or recurring prop.
- Existing company logos and visual marks may not be silently replaced; if the original asset is unavailable, flag this instead of inventing a brand identity.

TRUTH & FUNCTION GUARDRAILS
- Do not invent phone numbers, email addresses, addresses, opening hours, prices, years of experience, awards, certifications, clients, projects, staff, services or biography.
- If information is unknown, omit it or clearly mark as a placeholder.
- The result must work responsively on desktop and mobile.
- Do not mention v0, Vercel, prompts, AI tooling or Lumivey's internal process in the public website.

PRODUCTION SELF-CHECK (Lumivey still requires independent post-build QA)
Before returning the build, verify:
1. No full-page screenshot or Preview image rendered anywhere.
2. Every nonNegotiable and meaningful motif/word-image relation is present as real web components; not merely described in copy.
3. A solo knowledge/trust professional is not unnecessarily repeated across the homepage.
4. No oversized body crops, severed heads or repeated person images not requested.
5. Section order, density, hierarchy, emotional rhythm and visual grammar remain faithful to the approved direction.
6. Only supplied production assets are rendered as images.
7. No giant blank regions or broken desktop/mobile proportions.
8. A visitor understands the real offer, its audience/context, verified reasons for trust, and a clear truthful contact route without sacrificing entrepreneur recognition.
Fix anything that fails; do not declare a final Lumivey QA PASS on your own.

WEBSITE BRIEF / PRODUCTION GUARDRAILS
${JSON.stringify(compactBrief, null, 2)}
`;
}

function buildV0Attachments(brief: WebsiteBrief): V0Attachment[] {
  const attachments: V0Attachment[] = [];
  // Never attach the approved Preview screenshot. v0 has previously mistaken it for production artwork.
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

  // Analyze actual approved image once, then lock its signature in outgoing Brief.
  // Missing/invalid analysis is a controlled stop, never permission for a generic site.
  if (!brief.previewSignature) {
    brief.previewSignature = await capturePreviewSignature({
      id: brief.artistImpression.id,
      imageDataUrl: brief.artistImpression.imageDataUrl,
      headline: brief.artistImpression.headline,
      rationale: brief.artistImpression.rationale,
      identityContext: {
        entrepreneur: brief.understanding.entrepreneur,
        identity: brief.understanding.identity,
        pages: brief.pages.map((page) => ({ name: page.name, purpose: page.purpose })),
        constraints: brief.constraints,
      },
    });
  }
  if (brief.previewSignature.previewId !== brief.artistImpression.id) {
    throw new Error("WoW-signatuur hoort bij een andere Preview; v0-overdracht is geblokkeerd.");
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
