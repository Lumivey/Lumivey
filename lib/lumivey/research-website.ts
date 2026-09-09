export type WebsiteResearchResult = {
  url: string;
  title?: string;
  markdown: string;
  links: string[];
  images: string[];
  branding?: unknown;
};

function normalizeUrl(url: string): string {
  try {
    return new URL(url).toString();
  } catch {
    throw new Error("Ongeldige website-URL.");
  }
}

export async function researchWebsite(
  inputUrl: string
): Promise<WebsiteResearchResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY ontbreekt.");
  }

  const url = normalizeUrl(inputUrl);
  const endpoint =
    process.env.FIRECRAWL_API_URL ||
    "https://api.firecrawl.dev/v2/scrape";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "links", "images", "branding"],
      onlyMainContent: true,
    }),
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.error ||
        `Firecrawl gaf status ${response.status}.`
    );
  }

  const data = payload?.data ?? payload;
  const markdown =
    typeof data?.markdown === "string"
      ? data.markdown
      : "";

  const links = Array.isArray(data?.links)
    ? data.links.filter(
        (item: unknown): item is string =>
          typeof item === "string"
      )
    : [];

  const images = Array.isArray(data?.images)
    ? data.images.filter(
        (item: unknown): item is string =>
          typeof item === "string"
      )
    : [];

  const title =
    typeof data?.metadata?.title === "string"
      ? data.metadata.title
      : undefined;

  if (!markdown.trim()) {
    throw new Error(
      "Firecrawl leverde geen bruikbare website-inhoud op."
    );
  }

  return {
    url,
    title,
    markdown,
    links,
    images,
    branding: data?.branding,
  };
}
