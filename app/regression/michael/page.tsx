"use client";

import { useEffect, useState } from "react";

type Turn = {
  turn: number;
  user: string;
  assistant: string;
  referenceExpectation: string;
};

type EvaluationTurn = {
  turn: number;
  status: "PASS" | "WARN" | "FAIL";
  reason: string;
};

type Check = {
  name: string;
  status: "PASS" | "WARN" | "FAIL";
  reason: string;
};

type Result = {
  case: string;
  purpose: string;
  note: string;
  evaluation: {
    overall: "PASS" | "WARN" | "FAIL";
    firstDeviationTurn: number;
    firstDeviation: string;
    diagnosis: string;
    turns: EvaluationTurn[];
  };
  understandingEvaluation: {
    overall: "PASS" | "WARN" | "FAIL";
    firstLoss: string;
    diagnosis: string;
    checks: Check[];
  };
  creativeEvaluation: {
    overall: "PASS" | "WARN" | "FAIL";
    firstLoss: string;
    diagnosis: string;
    checks: Check[];
  };
  artDirection: Record<string, unknown>;
  siteDirection: Record<string, unknown>;
  understanding: {
    identity?: Record<string, unknown>;
    humanSignals?: unknown[];
    business?: Record<string, unknown>;
    facts?: unknown[];
    interpretations?: unknown[];
  };
  replay: Turn[];
};

export default function MichaelRegressionPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const response = await fetch("/api/regression/michael", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Regressietest kon niet worden uitgevoerd.");
        if (!cancelled) setResult(data);
      } catch (runError) {
        if (!cancelled) setError(runError instanceof Error ? runError.message : "Regressietest kon niet worden uitgevoerd.");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="home">
      <section className="intro" style={{ maxWidth: 960 }}>
        <p className="eyebrow">Golden Path</p>
        <h1>Michael regressietest</h1>
        <p className="lead">Exacte juni-antwoorden door de huidige keten. We toetsen gesprek, betekenisbehoud en daarna de creatieve vertaallaag vóór de echte beeldgeneratie.</p>

        {!result && !error && <p>Drie regressielagen draaien…</p>}
        {error && <p>{error}</p>}

        {result && (
          <>
            <div style={{ margin: "28px 0", padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
              <p className="eyebrow">Laag 1 — gesprek</p>
              <p><strong>Uitkomst:</strong> {result.evaluation.overall}</p>
              <p><strong>Eerste afwijking:</strong> {result.evaluation.firstDeviationTurn || "geen in deze vijf beurten"}</p>
              {result.evaluation.firstDeviation && <p>{result.evaluation.firstDeviation}</p>}
              <p><strong>Diagnose:</strong> {result.evaluation.diagnosis}</p>
            </div>

            <div style={{ margin: "28px 0", padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
              <p className="eyebrow">Laag 2 — betekenisbehoud</p>
              <p><strong>Uitkomst:</strong> {result.understandingEvaluation.overall}</p>
              <p><strong>Eerste verlies:</strong> {result.understandingEvaluation.firstLoss || "geen"}</p>
              <p><strong>Diagnose:</strong> {result.understandingEvaluation.diagnosis}</p>
              {result.understandingEvaluation.checks.map((check) => (
                <p key={check.name}><strong>{check.name} — {check.status}:</strong> {check.reason}</p>
              ))}
            </div>

            <div style={{ margin: "28px 0", padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
              <p className="eyebrow">Laag 3 — creatieve vertaling</p>
              <p><strong>Uitkomst:</strong> {result.creativeEvaluation.overall}</p>
              <p><strong>Eerste verlies:</strong> {result.creativeEvaluation.firstLoss || "geen"}</p>
              <p><strong>Diagnose:</strong> {result.creativeEvaluation.diagnosis}</p>
              {result.creativeEvaluation.checks.map((check) => (
                <p key={check.name}><strong>{check.name} — {check.status}:</strong> {check.reason}</p>
              ))}
            </div>

            {result.replay.map((turn) => {
              const judgement = result.evaluation.turns.find((item) => item.turn === turn.turn);
              return (
                <article key={turn.turn} style={{ margin: "30px 0", paddingBottom: 28, borderBottom: "1px solid #deded8" }}>
                  <p className="eyebrow">Beurt {turn.turn} — {judgement?.status || "?"}</p>
                  <p><strong>Michael:</strong> {turn.user}</p>
                  <p><strong>Huidige Lumivey:</strong> {turn.assistant}</p>
                  <p><strong>Juni-functie:</strong> {turn.referenceExpectation}</p>
                  {judgement?.reason && <p><strong>Beoordeling:</strong> {judgement.reason}</p>}
                </article>
              );
            })}

            <details style={{ margin: "36px 0" }}>
              <summary>Ruwe creatieve richting bekijken</summary>
              <pre style={{ whiteSpace: "pre-wrap", marginTop: 18, fontSize: 13 }}>{JSON.stringify({ artDirection: result.artDirection, siteDirection: result.siteDirection }, null, 2)}</pre>
            </details>

            <details style={{ margin: "36px 0" }}>
              <summary>Ruwe Understanding bekijken</summary>
              <pre style={{ whiteSpace: "pre-wrap", marginTop: 18, fontSize: 13 }}>{JSON.stringify(result.understanding, null, 2)}</pre>
            </details>
          </>
        )}
      </section>
    </main>
  );
}
