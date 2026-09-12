"use client";

import { useEffect, useState } from "react";

type Status = "PASS" | "WARN" | "FAIL";
type Check = { name: string; status: Status; reason: string };
type Turn = { turn: number; user: string; assistant: string };
type ChatMessage = { role: "user" | "assistant"; content: string };

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

const ADRIE_TURNS = [
  "Ik ben Adrie Pouwer. Mijn bedrijf heet AssetPouwer. Ik wil een nieuwe website. Mijn huidige website is https://www.assetpouwer.nl",
  "Ik doe strategisch assetmanagement. Vooral overal waar een draadje aan zit: elektrotechniek, industriële automatisering en meet- en regeltechniek. Industrie en infra, zoals tunneltechnische installaties.",
  "Ik zit eigenlijk tussen strategie en operatie in. Ik heb zelf buiten in de kou gewerkt en fabrieken opgestart. Dus ik wil niet alleen mooie plannen maken; het moet buiten ook echt werken.",
  "Ik ben vrij rustig. Ik luister eerst voordat ik iets zeg. In mijn vrije tijd fotografeer ik graag. Zondagochtend het bos in, rustig kijken naar composities. Dat lijkt eigenlijk wel op hoe ik werk: eerst kijken en begrijpen voordat ik oordeel.",
  "Een voorbeeld: bij een grote change heb ik de directie laten zien wat de echte impact was op mensen en budgetten. Daardoor hebben ze besloten de verandering over meerdere jaren te spreiden in plaats van in één keer door te drukken.",
  "Ik wil vooral benaderd worden voor strategische assetmanagementvraagstukken. Mail, telefoon en LinkedIn zijn prima, maar het liefst gewoon eerst een persoonlijk gesprek of koffie.",
];

async function readJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Route gaf geen JSON terug: ${text.slice(0, 180)}`);
  }
}

export default function AdrieRegressionPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("Start Adrie-case…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const messages: ChatMessage[] = [];
        const replay: Turn[] = [];
        let sourceContexts: unknown[] = [];
        let understanding: unknown = null;

        for (let index = 0; index < ADRIE_TURNS.length; index += 1) {
          if (cancelled) return;
          const user = ADRIE_TURNS[index];
          messages.push({ role: "user", content: user });
          setProgress(index === 0
            ? "Stap 1/7 — volledige AssetPouwer-site crawlen en eerste Discovery-reactie…"
            : `Stap ${index + 1}/7 — Discovery-beurt ${index + 1} van 6…`);

          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages, sourceContexts }),
            cache: "no-store",
          });
          const data = await readJsonResponse(response);
          if (!response.ok) throw new Error(data?.error || `Adrie replay stopte bij beurt ${index + 1}.`);

          const assistant = String(data.reply || "");
          messages.push({ role: "assistant", content: assistant });
          replay.push({ turn: index + 1, user, assistant });
          understanding = data.understanding;
          sourceContexts = Array.isArray(data?.understanding?.sources)
            ? data.understanding.sources
            : sourceContexts;
        }

        if (cancelled) return;
        setProgress("Stap 7/7 — creatieve richting, Preview en beoordeling…");

        const finalizeResponse = await fetch("/api/regression/adrie/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ replay, sourceContexts, understanding }),
          cache: "no-store",
        });
        const finalData = await readJsonResponse(finalizeResponse);
        if (!finalizeResponse.ok) throw new Error(finalData?.error || "Adrie-finalisatie kon niet worden uitgevoerd.");

        if (!cancelled) {
          setResult(finalData);
          setProgress("Gereed");
        }
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
        <p className="lead">Bestaande website als bron + vastgelegde referentie-inhoud → Discovery → Understanding → creatieve richting → Preview. Foto&apos;s volgen als aparte visuele laag.</p>

        {!result && !error && <p>{progress}</p>}
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
              <p className="eyebrow">Artist impression — nog zonder aangeleverde Adrie-foto&apos;s</p>
              <p>Hier beoordelen we eerst of het systeem Adrie inhoudelijk en creatief onderscheidend begrijpt. Zodra de echte foto&apos;s er zijn, worden die de volgende visuele bronlaag.</p>
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
