import OpenAI from "openai";
import { NextResponse } from "next/server";
import type { PreviewSignature } from "@/lib/lumivey/preview-signature";

export const maxDuration = 300;
type Status = "PASS" | "WARN" | "FAIL";
type Check = { name: string; status: Status; evidence: string; correction: string };

const REQUIRED = [
  "signature-preservation",
  "word-image-links",
  "preview-fidelity",
  "human-image-integrity",
  "brand-assets-and-facts",
  "visitor-clarity-and-trust",
  "responsive-layout",
] as const;

function validImage(value: unknown): value is string {
  return typeof value === "string" && /^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/i.test(value);
}

function validSignature(value: unknown): value is PreviewSignature {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PreviewSignature>;
  return typeof item.previewId === "string" && Boolean(item.previewId.trim())
    && typeof item.recognition === "string" && Boolean(item.recognition.trim())
    && typeof item.creativeMechanism === "string" && Boolean(item.creativeMechanism.trim())
    && Array.isArray(item.visualMotifs) && Array.isArray(item.wordImageLinks)
    && Array.isArray(item.nonNegotiables) && item.nonNegotiables.length > 0
    && Array.isArray(item.prohibitedLosses);
}

function parseOutput(raw: string): Record<string, unknown> {
  const clean = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try { return JSON.parse(clean) as Record<string, unknown>; }
  catch { throw new Error("Website-QA gaf geen valide JSON terug; publicatie blijft geblokkeerd."); }
}

/** Independent QA: screenshots are evidence. v0's self-reported completion is never accepted as proof. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const signature: unknown = body?.previewSignature;
    if (!validSignature(signature)) {
      return NextResponse.json({ error: "Ontbrekende of ongeldige gelockte PreviewSignature." }, { status: 400 });
    }
    const approvedPreview: unknown = body?.approvedPreview;
    const desktop: unknown = body?.websiteDesktop;
    const mobile: unknown = body?.websiteMobile;
    if (!validImage(approvedPreview) || !validImage(desktop) || !validImage(mobile)) {
      return NextResponse.json({ error: "Voor onafhankelijke QA zijn goedgekeurde Preview plus echte desktop- en mobiele websiterenders vereist." }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY ontbreekt voor onafhankelijke website-QA.");

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response: any = await openai.responses.create({
      model: "gpt-5.6-terra",
      instructions: `You are an INDEPENDENT Lumivey website quality reviewer, not the website builder. Apply TWO separate quality questions to BOTH approved Preview and actual website: (1) Does the entrepreneur recognize their genuine identity, craftsmanship and specific creative signature? (2) Can a potential visitor promptly understand the real offer, relevant audience or use case, the factual grounds for trust and the next contact step? Never trade away criterion 1 to satisfy criterion 2; a conventional sales template is not required. Compare approved Preview against ACTUAL rendered website screenshots for desktop AND mobile, using a LOCKED signature. Explicitly test visual motif translation as real rendered design, not merely textual mention; word-image relationships; entrepreneur recognition; section rhythm; factual/brand discrepancies visible in evidence; recognizable uncut real faces and coherent anatomy; mobile layout. For visitor-clarity-and-trust, check visible offer and audience/use case, factual evidence supporting material credibility claims if available, clear contact path and whether contact details are verified against provided facts. Do not demand invented diplomas, case studies or testimonials: a truthful, concrete working method can support trust when evidence is unavailable. Never infer a visible contact button is functional from a screenshot alone; mark its functionality unverified unless independent evidence is supplied. If the Preview itself lacks visitor clarity, report that separately in evidence: do not silently redesign or flatten its approved WoW. An approved Preview screenshot embedded as a large image inside the website is an absolute failure, not fidelity. Do not demand identical pixels; demand preservation of creative mechanism and non-negotiables in technically feasible web components. Do not infer missing detail as present. If something is offscreen/too small or unavailable, WARN or FAIL with uncertainty, never invent PASS. If a locked nonNegotiable or reason-for-WoW is lost, signature-preservation MUST be FAIL even if content is correct. Return ONLY JSON {checks:[{name,status,evidence,correction}]} containing exactly these check names: ${REQUIRED.join(", ")}. Status PASS/WARN/FAIL. Evidence must cite visible portions of screenshots and distinguish verified facts from interpretation; correction says how to correct EXISTING v0 build without rerunning Discovery/Firecrawl/Preview. No scores or false claims of entrepreneur approval.`,
      input: [{ role: "user", content: [
        { type: "input_text", text: JSON.stringify({ signature, factsAndAssetsToVerify: body?.factsAndAssetsToVerify || [], note: "Next images in order: approved Preview, actual DESKTOP site, actual MOBILE site. Determine whether both entrepreneur recognition and visitor understanding/trust are preserved; do not invent missing factual evidence." }).slice(0, 25000) },
        { type: "input_image", image_url: approvedPreview, detail: "high" },
        { type: "input_image", image_url: desktop, detail: "high" },
        { type: "input_image", image_url: mobile, detail: "high" },
      ] }],
    } as any);

    const data = parseOutput(String(response.output_text || ""));
    const checks = Array.isArray(data.checks) ? data.checks : [];
    const verifiedChecks: Check[] = REQUIRED.map((name) => {
      const item = checks.find((entry: any) => entry?.name === name);
      if (!item || !["PASS", "WARN", "FAIL"].includes(item.status) || typeof item.evidence !== "string" || !item.evidence.trim()) {
        return { name, status: "FAIL", evidence: "QA-bewijs of check ontbreekt.", correction: "Controleer dit onderdeel tegen de goedgekeurde Preview en maak de render opnieuw." };
      }
      return {
        name,
        status: item.status as Status,
        evidence: item.evidence,
        correction: typeof item.correction === "string" ? item.correction : "Gericht herstellen en opnieuw renderen.",
      };
    });
    // Lost WoW, invalid human image, missing brand/facts or failed visitor trust never average away.
    const critical = new Set(["signature-preservation", "human-image-integrity", "brand-assets-and-facts", "visitor-clarity-and-trust"]);
    const overall: Status = verifiedChecks.some((check) => check.status === "FAIL" || (critical.has(check.name) && check.status !== "PASS"))
      ? "FAIL"
      : verifiedChecks.some((check) => check.status === "WARN") ? "WARN" : "PASS";
    const corrections = verifiedChecks.filter((check) => check.status !== "PASS");
    return NextResponse.json({
      previewId: signature.previewId,
      overall,
      publishable: false, // Separate owner approval is mandatory even after QA PASS.
      checks: verifiedChecks,
      correctionPrompt: corrections.length
        ? `Correct ONLY the existing build; keep the approved Preview and locked signature authoritative. Preserve BOTH entrepreneur recognition and factual visitor understanding/trust; never solve one by sacrificing the other.\n${corrections.map((check) => `- ${check.name}: ${check.correction}`).join("\n")}\nRender desktop and mobile again for independent QA.`
        : "No corrections identified by this QA pass. Obtain entrepreneur approval before publication.",
    });
  } catch (error) {
    console.error("Preview signature QA error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Website-QA mislukt; publicatie blijft geblokkeerd." }, { status: 500 });
  }
}
