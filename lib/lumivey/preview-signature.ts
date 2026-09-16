import OpenAI from "openai";

export type PreviewSignature = {
  previewId: string;
  recognition: string;
  creativeMechanism: string;
  visualMotifs: Array<{ motif: string; evidence: string; webTranslation: string }>;
  wordImageLinks: Array<{ words: string; visual: string; relationship: string }>;
  nonNegotiables: string[];
  prohibitedLosses: string[];
  uncertainties: string[];
};

export type SignatureInput = {
  id: string;
  imageDataUrl: string;
  headline: string;
  rationale: string[];
  identityContext: unknown;
};

function strings(value: unknown, maximum: number): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()).slice(0, maximum)
    : [];
}

function entries(value: unknown, fields: string[], maximum: number): Record<string, string>[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maximum).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const entry = item as Record<string, unknown>;
    if (fields.some((key) => typeof entry[key] !== "string" || !String(entry[key]).trim())) return [];
    return [Object.fromEntries(fields.map((key) => [key, String(entry[key]).trim()]))];
  });
}

/** Read the actual approved image. The screenshot must NOT be passed to v0 as a production asset. */
export async function capturePreviewSignature(input: SignatureInput): Promise<PreviewSignature> {
  if (!input.id.trim() || !/^(data:image\/|https:\/\/)/i.test(input.imageDataUrl)) {
    throw new Error("WoW-signatuur: goedgekeurde Preview-ID of afbeelding ontbreekt.");
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response: any = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: `You are Lumivey's independent visual-to-production handoff analyst. Read the ACTUAL approved Preview image and provided rationale. Extract what causes entrepreneur recognition, especially meaningful playful details, visual grammar, editorial rhythm and relationships between image and words. This is not a new design proposal. Do not invent a motif you cannot point to in the image/rationale. The signature is specific to this entrepreneur: do not impose framing/viewfinders/photography or one visual style on everyone. Never interpret a hobby as a service. Preserve preexisting assets; screenshots are never production assets. Record uncertainty if text is unreadable. Give only a JSON object with keys recognition (string), creativeMechanism (string), visualMotifs (array of objects motif,evidence,webTranslation), wordImageLinks (array of objects words,visual,relationship), nonNegotiables (string array), prohibitedLosses (string array), uncertainties (string array). webTranslation must describe a feasible real HTML/CSS treatment rather than embedding screenshot pixels. The approved rationale and identity context are evidence, not a substitute for the image.`,
    input: [{
      role: "user",
      content: [
        { type: "input_text", text: JSON.stringify({ headline: input.headline, rationale: input.rationale, identityContext: input.identityContext }).slice(0, 18000) },
        { type: "input_image", image_url: input.imageDataUrl, detail: "high" },
      ],
    }],
  } as any);

  const text = String(response.output_text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("WoW-signatuur: visuele analyse gaf geen geldig JSON-contract. Geen generieke v0-build gestart.");
  }

  const recognition = typeof data.recognition === "string" ? data.recognition.trim() : "";
  const creativeMechanism = typeof data.creativeMechanism === "string" ? data.creativeMechanism.trim() : "";
  const visualMotifs = entries(data.visualMotifs, ["motif", "evidence", "webTranslation"], 8) as PreviewSignature["visualMotifs"];
  const wordImageLinks = entries(data.wordImageLinks, ["words", "visual", "relationship"], 8) as PreviewSignature["wordImageLinks"];
  const nonNegotiables = strings(data.nonNegotiables, 12);
  const prohibitedLosses = strings(data.prohibitedLosses, 12);
  const uncertainties = strings(data.uncertainties, 8);

  if (!recognition || !creativeMechanism || nonNegotiables.length === 0 || (visualMotifs.length === 0 && wordImageLinks.length === 0)) {
    throw new Error("WoW-signatuur: herkenning, creatief mechaniek of bewijs ontbreekt. Geen generieke v0-build gestart.");
  }
  return {
    previewId: input.id,
    recognition,
    creativeMechanism,
    visualMotifs,
    wordImageLinks,
    nonNegotiables,
    prohibitedLosses,
    uncertainties,
  };
}
