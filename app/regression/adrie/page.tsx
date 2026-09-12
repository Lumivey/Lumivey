"use client";

import { useEffect, useState } from "react";

type Status = "PASS" | "WARN" | "FAIL";
type Check = { name: string; status: Status; reason: string };
type Turn = { turn: number; user: string; assistant: string };

type Result = {
  case: string;
  purpose: string;
  note: string;
  evaluation: { overall: Status; diagnosis: string; checks: Check[] };
  previewImpression: { imageDataUrl: string; headline?: string; rationale?: string[] };
  replay: Turn[];
  sourceContexts: unknown[];
  understanding: unknown;
  artDirection: unknown;
  siteDirection: unknown;
};

export default function AdrieRegressionPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const response = await fetch("/api/regression/adrie", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Adrie-regressietest kon niet worden uitgevoerd.");
        if (!cancelled) setResult(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Adrie-regressietest kon niet worden uitgevoerd.");
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="home">
      <section className="intro" style={{ maxWidth: 980 }}>
        <p className="eyebrow">Contrastcase na Michael</p>
        <h1>Adrie / AssetPouwer</h1>
        <p className="lead">Bestaande website als bron + vastgelegde referentie-inhoud → Discovery → Understanding → creatieve richting → Preview. Foto's volgen als aparte visuele laag.</p>

        {!result && !error && <p>Adrie-case draait. Firecrawl, gesprek en Preview kunnen even duren…</p>}
        {error && <p>{error}</p>}

        {result && (
          <>
            <div style={{ margin: "28px 0", padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
              <p className="eyebrow">Beoordeling</p>
              <p><strong>Uitkomst:</strong> {result.evaluation.overall}</p>
              <p><strong>Diagnose:</strong> {result.evaluation.diagnosis}</p>
              {result.evaluation.checks.map((check) => (
                <p key={check.name}><strong>{check.name} — {check.status}:</strong> {check.reason}</p>
              ))}
            </div>

            <div style={{ margin: "32px 0" }}>
              <p className="eyebrow">Artist impression — nog zonder aangeleverde Adrie-foto's</p>
              <p>Hier beoordelen we eerst of het systeem Adrie inhoudelijk en creatief onderscheidend begrijpt. Zodra de echte foto's er zijn, worden die de volgende visuele bronlaag.</p>
              <img
                src={result.previewImpression.imageDataUrl}
                alt="Adrie AssetPouwer artist impression"
                style={{ width: "100%", height: "auto", display: "block", borderRadius: 18, border: "1px solid #d8d8d2" }}
              />
            </div>

            {result.replay.map((turn) => (
              <article key={turn.turn} style={{ margin: "30px 0", paddingBottom: 28, borderBottom: "1px solid #deded8" }}>
                <p className="eyebrow">Beurt {turn.turn}</p>
                <p><strong>Adrie:</strong> {turn.user}</p>
                <p><strong>Lumivey:</strong> {turn.assistant}</p>
              </article>
            ))}

            <details style={{ margin: "34px 0" }}>
              <summary>Broncontext bekijken</summary>
              <pre style={{ whiteSpace: "pre-wrap", marginTop: 18, fontSize: 13 }}>{JSON.stringify(result.sourceContexts, null, 2)}</pre>
            </details>
            <details style={{ margin: "34px 0" }}>
              <summary>Understanding bekijken</summary>
              <pre style={{ whiteSpace: "pre-wrap", marginTop: 18, fontSize: 13 }}>{JSON.stringify(result.understanding, null, 2)}</pre>
            </details>
            <details style={{ margin: "34px 0" }}>
              <summary>Creatieve richting bekijken</summary>
              <pre style={{ whiteSpace: "pre-wrap", marginTop: 18, fontSize: 13 }}>{JSON.stringify({ artDirection: result.artDirection, siteDirection: result.siteDirection }, null, 2)}</pre>
            </details>
          </>
        )}
      </section>
    </main>
  );
}
