export type WebsiteResearchPage = {
  url: string;
  title?: string;
  markdown: string;
  links: string[];
  images: string[];
  branding?: unknown;
};

export type WebsiteResearchResult = {
  url: string;
  title?: string;
  markdown: string;
  links: string[];
  images: string[];
  branding?: unknown;
  pages?: WebsiteResearchPage[];
};

function normalizeUrl(url: string): string {
  try {
    return new URL(url).toString();
  } catch {
    throw new Error("Ongeldige website-URL.");
  }
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(
    new Set(values.filter((item): item is string => typeof item === "string" && item.trim().length > 0))
  );
}

function pageFromPayload(item: any, fallbackUrl: string): WebsiteResearchPage | null {
  const markdown = typeof item?.markdown === "string" ? item.markdown : "";
  if (!markdown.trim()) return null;

  const url =
    typeof item?.metadata?.sourceURL === "string"
      ? item.metadata.sourceURL
      : typeof item?.url === "string"
        ? item.url
        : fallbackUrl;

  return {
    url,
    title: typeof item?.metadata?.title === "string" ? item.metadata.title : undefined,
    markdown,
    links: Array.isArray(item?.links) ? uniqueStrings(item.links) : [],
    images: Array.isArray(item?.images) ? uniqueStrings(item.images) : [],
    branding: item?.branding,
  };
}

async function scrapeSinglePage(url: string, apiKey: string): Promise<WebsiteResearchResult> {
  const endpoint = process.env.FIRECRAWL_API_URL || "https://api.firecrawl.dev/v2/scrape";
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
    throw new Error(payload?.error || `Firecrawl gaf status ${response.status}.`);
  }

  const data = payload?.data ?? payload;
  const page = pageFromPayload(data, url);
  if (!page) {
    throw new Error("Firecrawl leverde geen bruikbare website-inhoud op.");
  }

  return {
    url,
    title: page.title,
    markdown: page.markdown,
    links: page.links,
    images: page.images,
    branding: page.branding,
    pages: [page],
  };
}

async function crawlWebsite(url: string, apiKey: string): Promise<WebsiteResearchResult> {
  const crawlEndpoint = "https://api.firecrawl.dev/v2/crawl";
  const startResponse = await fetch(crawlEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      limit: 20,
      maxDiscoveryDepth: 4,
      scrapeOptions: {
        formats: ["markdown", "links", "images", "branding"],
        onlyMainContent: true,
      },
    }),
    cache: "no-store",
  });

  const startPayload = await startResponse.json();
  if (!startResponse.ok || startPayload?.success === false) {
    throw new Error(startPayload?.error || `Firecrawl crawl gaf status ${startResponse.status}.`);
  }

  const jobId = startPayload?.id;
  if (typeof jobId !== "string" || !jobId) {
    throw new Error("Firecrawl crawl gaf geen job-id terug.");
  }

  const deadline = Date.now() + 75_000;
  let payload: any = null;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const statusResponse = await fetch(`${crawlEndpoint}/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    payload = await statusResponse.json();
    if (!statusResponse.ok) {
      throw new Error(payload?.error || `Firecrawl crawl-status gaf status ${statusResponse.status}.`);
    }

    if (payload?.status === "completed") break;
    if (payload?.status === "failed" || payload?.status === "cancelled") {
      throw new Error(payload?.error || `Firecrawl crawl eindigde met status ${payload?.status}.`);
    }
  }

  if (payload?.status !== "completed") {
    throw new Error("Firecrawl crawl duurde te lang.");
  }

  const rawPages: unknown[] = Array.isArray(payload?.data) ? payload.data : [];
  const pages: WebsiteResearchPage[] = rawPages
    .map((item: unknown) => pageFromPayload(item, url))
    .filter((page: WebsiteResearchPage | null): page is WebsiteResearchPage => Boolean(page));

  if (!pages.length) {
    throw new Error("Firecrawl crawl leverde geen bruikbare websitepagina's op.");
  }

  const markdown = pages
    .map((page: WebsiteResearchPage, index: number) => `\n\n===== PAGINA ${index + 1}: ${page.title || page.url} =====\nURL: ${page.url}\n\n${page.markdown}`)
    .join("")
    .trim();

  return {
    url,
    title: pages[0]?.title,
    markdown,
    links: uniqueStrings(pages.flatMap((page: WebsiteResearchPage) => page.links)),
    images: uniqueStrings(pages.flatMap((page: WebsiteResearchPage) => page.images)),
    branding: pages.find((page: WebsiteResearchPage) => page.branding)?.branding,
    pages,
  };
}

export async function researchWebsite(inputUrl: string): Promise<WebsiteResearchResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY ontbreekt.");
  }

  const url = normalizeUrl(inputUrl);

  try {
    return await crawlWebsite(url, apiKey);
  } catch (crawlError) {
    console.error("Volledige Firecrawl crawl mislukt; val terug op homepage scrape:", crawlError);
    return scrapeSinglePage(url, apiKey);
  }
}
