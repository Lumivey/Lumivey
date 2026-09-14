export type WebsiteResearchPage = {
  url: string;
  title?: string;
  markdown: string;
  links: string[];
  images: string[];
  branding?: unknown;
};

export type WebsiteResearchMode = "full-crawl" | "targeted-fallback" | "single-page-fallback";

export type WebsiteResearchResult = {
  url: string;
  title?: string;
  markdown: string;
  links: string[];
  images: string[];
  branding?: unknown;
  pages?: WebsiteResearchPage[];
  mode: WebsiteResearchMode;
  crawlJobId?: string;
  fallbackReason?: string;
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

async function scrapePage(url: string, apiKey: string): Promise<WebsiteResearchPage> {
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
  return page;
}

function resultFromPages(
  rootUrl: string,
  pages: WebsiteResearchPage[],
  mode: WebsiteResearchMode,
  fallbackReason?: string,
  crawlJobId?: string
): WebsiteResearchResult {
  const markdown = pages
    .map((page, index) => `\n\n===== PAGINA ${index + 1}: ${page.title || page.url} =====\nURL: ${page.url}\n\n${page.markdown}`)
    .join("")
    .trim();

  return {
    url: rootUrl,
    title: pages[0]?.title,
    markdown,
    links: uniqueStrings(pages.flatMap((page) => page.links)),
    images: uniqueStrings(pages.flatMap((page) => page.images)),
    branding: pages.find((page) => page.branding)?.branding,
    pages,
    mode,
    fallbackReason,
    crawlJobId,
  };
}

function rankFallbackLinks(rootUrl: string, links: string[]): string[] {
  const root = new URL(rootUrl);
  const priority = /(adrie|over|about|contact|kennis|referent|artikel|nieuws|magazine|diploma|certif|iso|assetmanager|service|dienst)/i;
  const sameSite = uniqueStrings(links)
    .map((link) => {
      try {
        return new URL(link, rootUrl);
      } catch {
        return null;
      }
    })
    .filter((url): url is URL => Boolean(url))
    .filter((url) => url.hostname.replace(/^www\./, "") === root.hostname.replace(/^www\./, ""))
    .filter((url) => /^https?:$/.test(url.protocol))
    .map((url) => {
      url.hash = "";
      return url.toString();
    });

  return sameSite
    .map((url, index) => ({ url, index, priority: priority.test(url) ? 1 : 0 }))
    .sort((a, b) => b.priority - a.priority || a.index - b.index)
    .map((item) => item.url)
    .filter((url) => url !== rootUrl)
    .slice(0, 10);
}

async function targetedFallback(
  url: string,
  apiKey: string,
  fallbackReason: string
): Promise<WebsiteResearchResult> {
  const homepage = await scrapePage(url, apiKey);
  const targets = rankFallbackLinks(url, homepage.links);
  const extraPages = (
    await Promise.all(
      targets.map(async (target) => {
        try {
          return await scrapePage(target, apiKey);
        } catch (error) {
          console.warn(`Gerichte fallback scrape mislukt voor ${target}:`, error);
          return null;
        }
      })
    )
  ).filter((page): page is WebsiteResearchPage => Boolean(page));

  const pages = [homepage, ...extraPages];
  return resultFromPages(url, pages, pages.length > 1 ? "targeted-fallback" : "single-page-fallback", fallbackReason);
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

  const deadline = Date.now() + 120_000;
  let payload: any = null;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

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

  return resultFromPages(url, pages, "full-crawl", undefined, jobId);
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
    const fallbackReason = crawlError instanceof Error ? crawlError.message : String(crawlError);
    console.error("Volledige Firecrawl crawl mislukt; start gerichte fallback:", crawlError);
    return targetedFallback(url, apiKey, fallbackReason);
  }
}
