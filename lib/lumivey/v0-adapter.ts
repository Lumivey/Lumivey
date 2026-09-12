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
      note: "The approved Preview is supplied separately as an attachment and is the primary visual reference.",
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
Build the real responsive website from the validated Website Brief and supplied visual attachments below.

ABSOLUTE RULES
- Do not invent facts.
- Do not invent phone numbers, email addresses, addresses, opening hours, prices, years of experience, awards, certifications, clients, projects, staff, services or biography.
- If information is unknown, keep it omitted or clearly marked as a placeholder.
- The APPROVED PREVIEW attachment is the primary creative contract. Preserve its overall visual language, hierarchy, color rhythm, typography feeling, image/text interplay and recognition as closely as practical.
- Use supplied REAL ASSETS before generated or generic alternatives. Do not replace a real entrepreneur/work photo with a generic or generated person when a real asset is supplied.
- Supporting personal AI elements in the Preview are creative direction only unless explicitly marked as approved production assets.
- Keep the Porsche 356 origin story supporting, not dominant, unless the Website Brief explicitly says otherwise.
- The result must work responsively on desktop and mobile.
- Do not mention v0, Vercel, prompts, AI tooling or Lumivey's internal process in the public website.
- Do not convert the approved Preview into a generic stack of cards/blocks. Sections are allowed, but the page should read as one coherent designed composition.

ASSET PRIORITY
1. Real entrepreneur / team / work / location images supplied as attachments.
2. AI-enhanced real sources that are explicitly supplied as production assets.
3. Approved artist-impression elements as visual direction.
4. Generated/generic imagery only when no relevant real source exists and only when it does not impersonate a real person.

WEBSITE BRIEF
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
