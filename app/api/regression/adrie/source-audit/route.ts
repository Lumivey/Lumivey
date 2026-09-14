import { NextResponse } from "next/server";
import { researchWebsite } from "@/lib/lumivey/research-website";

export const maxDuration = 300;

const TARGET_URL = "https://www.assetpouwer.nl";

const SIGNALS = [
  { key: "over-adrie-page", label: "Over Adrie-pagina", patterns: [/adrie-pouwer/i, /over adrie pouwer/i] },
  { key: "iam-diploma", label: "IAM Diploma in Asset Management", patterns: [/diploma in asset management/i, /eerste vijf kandidaten/i] },
  { key: "tu-delft", label: "TU Delft", patterns: [/tu delft/i] },
  { key: "lloyds-register", label: "Lloyd's Register", patterns: [/lloyd.?s register/i] },
  { key: "nedtrain", label: "NedTrain Consulting", patterns: [/nedtrain/i] },
  { key: "iam-membership", label: "Institute of Asset Management", patterns: [/institute of asset management/i] },
  { key: "nen-iso", label: "NEN/ISO Asset Management", patterns: [/nen\/iso/i, /iso 55000/i] },
  { key: "contact-email", label: "Contact e-mail", patterns: [/info\s*(?:\[at\]|@)\s*assetpouwer\.nl/i] },
  { key: "contact-phone", label: "Contact telefoon", patterns: [/06\s*[- ]?\s*212\s*48\s*948/i, /212\s*48\s*948/i] },
  { key: "contact-address", label: "Adres Parklaan 23 Doorn", patterns: [/parklaan\s*23/i, /3941\s*rd\s*doorn/i] },
  { key: "articles", label: "Artikelen / kenniscontext", patterns: [/stadswerk magazine/i, /bewuste keuzes maken/i, /kenniscentrum/i] },
];

function pageMatches(page: { url: string; title?: string; markdown: string }) {
  const haystack = `${page.url}\n${page.title || ""}\n${page.markdown}`;
  return SIGNALS.map((signal) => ({
    key: signal.key,
    label: signal.label,
    found: signal.patterns.some((pattern) => pattern.test(haystack)),
  }));
}

export async function GET() {
  try {
    const research = await researchWebsite(TARGET_URL);
    const pages = research.pages ?? [];

    const pageAudit = pages.map((page) => ({
      url: page.url,
      title: page.title || "",
      chars: page.markdown.length,
      matches: pageMatches(page).filter((item) => item.found).map((item) => item.label),
    }));

    const combined = `${research.markdown}\n${research.links.join("\n")}`;
    const signals = SIGNALS.map((signal) => ({
      key: signal.key,
      label: signal.label,
      found: signal.patterns.some((pattern) => pattern.test(combined)),
      pages: pageAudit.filter((page) => page.matches.includes(signal.label)).map((page) => page.url),
    }));

    return NextResponse.json({
      source: TARGET_URL,
      mode: research.mode,
      crawlJobId: research.crawlJobId || null,
      fallbackReason: research.fallbackReason || null,
      pageCount: pages.length,
      pages: pageAudit,
      signals,
      summary: {
        found: signals.filter((signal) => signal.found).length,
        total: signals.length,
        missing: signals.filter((signal) => !signal.found).map((signal) => signal.label),
      },
    });
  } catch (error) {
    console.error("Adrie source audit failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bronaudit kon niet worden uitgevoerd." },
      { status: 500 }
    );
  }
}
