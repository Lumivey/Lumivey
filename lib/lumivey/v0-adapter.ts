import { WebsiteBrief } from "@/lib/lumivey/primary-flow";

type V0BuildResult = {
  chatId: string;
  webUrl?: string;
  previewUrl?: string;
  raw: unknown;
};

function buildV0Prompt(brief: WebsiteBrief): string {
  return `
You are the technical production engine for Lumivey.
Build the real responsive website from the validated Website Brief below.

ABSOLUTE RULES
- Do not invent facts.
- Do not invent phone numbers, email addresses, addresses, opening hours, prices, years of experience, awards, certifications, clients, projects, staff, services or biography.
- If information is unknown, keep it omitted or clearly marked as a placeholder.
- Preserve the creative direction of the approved artist impression as closely as practical.
- Use supplied real assets before generated or generic alternatives.
- The result must work responsively on desktop and mobile.
- Do not mention v0, Vercel, prompts, AI tooling or Lumivey's internal process in the public website.

WEBSITE BRIEF
${JSON.stringify(brief, null, 2)}
`;
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
