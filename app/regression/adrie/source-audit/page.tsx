"use client";

import { useEffect, useState } from "react";

type Audit = {
  source: string;
  mode: "full-crawl" | "single-page-fallback";
  crawlJobId?: string | null;
  fallbackReason?: string | null;
  pageCount: number;
  pages: Array<{ url: string; title: string; chars: number; matches: string[] }>;
  signals: Array<{ key: string; label: string; found: boolean; pages: string[] }>;
  summary: { found: number; total: number; missing: string[] };
};

export default function AdrieSourceAuditPage() {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/regression/adrie/source-audit", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Bronaudit kon niet worden uitgevoerd.");
        if (!cancelled) setAudit(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="home">
      <section className="intro" style={{ maxWidth: 980 }}>
        <p className="eyebrow">Firecrawl broncontrole</p>
        <h1>AssetPouwer — wat heeft Firecrawl werkelijk gezien?</h1>
        <p className="lead">Deze pagina test alleen de bronlaag. Geen Discovery, geen Preview en geen v0.</p>

        {!audit && !error && <p>Volledige AssetPouwer-site wordt nu opnieuw onderzocht…</p>}
        {error && <div style={{ padding: 18, border: "1px solid #b8b8b0", borderRadius: 14 }}><strong>Audit stopte:</strong> {error}</div>}

        {audit && (
          <>
            <div style={{ margin: "28px 0", padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
              <p><strong>Firecrawl-modus:</strong> {audit.mode === "full-crawl" ? "VOLLEDIGE CRAWL" : "ALLEEN HOMEPAGE-FALLBACK"}</p>
              <p><strong>Aantal opgehaalde pagina's:</strong> {audit.pageCount}</p>
              <p><strong>Gezochte Adrie-signalen gevonden:</strong> {audit.summary.found}/{audit.summary.total}</p>
              {audit.fallbackReason && <p><strong>Waarom fallback:</strong> {audit.fallbackReason}</p>}
              {audit.summary.missing.length > 0 && <p><strong>Nog niet gevonden:</strong> {audit.summary.missing.join(", ")}</p>}
            </div>

            <div style={{ margin: "28px 0", padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
              <p className="eyebrow">Belangrijke signalen</p>
              {audit.signals.map((signal) => (
                <div key={signal.key} style={{ margin: "14px 0" }}>
                  <strong>{signal.found ? "✓" : "✗"} {signal.label}</strong>
                  {signal.found && signal.pages.length > 0 && <div className="quiet">gevonden op: {signal.pages.join(", ")}</div>}
                </div>
              ))}
            </div>

            <details style={{ margin: "34px 0" }} open>
              <summary>Opgehaalde pagina's bekijken</summary>
              <div style={{ marginTop: 18 }}>
                {audit.pages.map((page) => (
                  <article key={page.url} style={{ padding: "14px 0", borderBottom: "1px solid #deded8" }}>
                    <strong>{page.title || page.url}</strong>
                    <div>{page.url}</div>
                    <div className="quiet">{page.chars.toLocaleString("nl-NL")} tekens</div>
                    {page.matches.length > 0 && <div>Signalen: {page.matches.join(", ")}</div>}
                  </article>
                ))}
              </div>
            </details>
          </>
        )}
      </section>
    </main>
  );
}
