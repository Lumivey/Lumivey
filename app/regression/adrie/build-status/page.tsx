"use client";

import { useEffect, useState } from "react";
import { loadBuildSnapshot, saveBuildSnapshot, type BuildSnapshot } from "@/lib/lumivey/build-snapshot";

type BuildState = {
  chatId: string;
  status: "pending" | "completed" | "failed" | "unknown";
  checkedAt: string;
  generationMs: number | null;
  statusLookupMs: number;
  versionId?: string | null;
  note: string;
};
type QAReport = {
  versionId?: string;
  overall: "PASS" | "WARN" | "FAIL";
  publishable: false;
  checks: Array<{ name: string; status: string; evidence: string; correction: string }>;
  correctionPrompt: string;
  timing?: { captureMs: number; qaMs: number; totalMs: number };
};

export default function AdrieBuildStatusPage() {
  const [chatId, setChatId] = useState("");
  const [activeChatId, setActiveChatId] = useState("");
  const [result, setResult] = useState<BuildState | null>(null);
  const [snapshot, setSnapshot] = useState<BuildSnapshot | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [error, setError] = useState("");
  const [desktopError, setDesktopError] = useState(false);
  const [mobileError, setMobileError] = useState(false);
  const [qaLoading, setQaLoading] = useState(false);
  const [qa, setQa] = useState<QAReport | null>(null);
  const [qaError, setQaError] = useState("");

  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get("chatId") || "";
    if (/^[a-zA-Z0-9_-]{8,128}$/.test(fromLink)) { setChatId(fromLink); setActiveChatId(fromLink); }
  }, []);

  useEffect(() => {
    if (!activeChatId) return;
    let cancelled = false;
    setEvidenceLoading(true); setSnapshot(null); setQa(null);
    void loadBuildSnapshot(activeChatId).then((stored) => {
      if (cancelled) return;
      setSnapshot(stored);
      if (stored?.qa?.report) setQa(stored.qa.report as QAReport);
    }).catch(() => { if (!cancelled) setQaError("Lokaal goedkeuringsdossier kon niet worden geopend."); })
      .finally(() => { if (!cancelled) setEvidenceLoading(false); });
    return () => { cancelled = true; };
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      try {
        const response = await fetch(`/api/regression/adrie/build-status?chatId=${encodeURIComponent(activeChatId)}`, { cache: "no-store" });
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) { setError(data.error || "Statuscontrole mislukt."); return; }
        setResult(data as BuildState); setError("");
        if (data.status === "pending" || data.status === "unknown") timer = setTimeout(check, 5000);
      } catch { if (!cancelled) setError("Statuscontrole mislukt. Geen nieuwe build gestart."); }
    };
    void check();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [activeChatId]);

  async function runQA() {
    if (!snapshot || !result?.versionId || result.status !== "completed" || qaLoading) return;
    setQaLoading(true); setQaError(""); setQa(null);
    try {
      const response = await fetch("/api/regression/adrie/qa-existing", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({
          chatId: snapshot.chatId, expectedVersionId: result.versionId,
          approvedPreviewId: snapshot.previewId,
          approvedPreview: snapshot.approvedPreview,
          previewSignature: snapshot.previewSignature,
          factsAndAssetsToVerify: [
            ...((snapshot.brief.facts as unknown[]) || []),
            ...((snapshot.brief.assets as unknown[]) || []),
          ],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Onafhankelijke QA is niet gelukt.");
      if (!data.versionId || data.versionId !== result.versionId || !["PASS", "WARN", "FAIL"].includes(data.overall)) {
        throw new Error("QA-resultaat hoort niet aantoonbaar bij deze v0-versie; beoordeling geblokkeerd.");
      }
      const report = data as QAReport;
      const updated: BuildSnapshot = { ...snapshot, qa: { versionId: result.versionId, overall: report.overall, checkedAt: new Date().toISOString(), report } };
      await saveBuildSnapshot(updated);
      setSnapshot(updated); setQa(report);
    } catch (cause) { setQaError(cause instanceof Error ? cause.message : "QA mislukt; website blijft afgekeurd."); }
    finally { setQaLoading(false); }
  }

  const isCurrentQA = Boolean(qa && qa.versionId && qa.versionId === result?.versionId);

  return <main className="home"><section className="intro" style={{ maxWidth: 1100 }}>
    <p className="eyebrow">Adrie regressie — bestaande v0-build</p>
    <h1>Buildstatus, doorlooptijd en echte renders</h1>
    <p className="lead">Alleen bestaande v0-chat. Desktop: officiële screenshot. Mobiel: echte 390px-render via Firecrawl. De goedgekeurde Preview en gelockte signatuur zijn verplicht voor onafhankelijke QA.</p>
    <form onSubmit={(event) => {
      event.preventDefault(); setResult(null); setDesktopError(false); setMobileError(false); setError(""); setQaError(""); setActiveChatId(chatId.trim());
    }}>
      <label htmlFor="v0-chat-id">v0 chat-ID</label><br/>
      <input id="v0-chat-id" value={chatId} onChange={(event) => setChatId(event.target.value)} placeholder="Bestaande chat-ID" required pattern="[a-zA-Z0-9_-]{8,128}"/>
      <button type="submit">Controleer bestaande build</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {result && <section style={{ marginTop: 24 }} aria-live="polite">
      <p><strong>Status:</strong> {result.status === "pending" ? "v0 bouwt nog" : result.status === "completed" ? "v0 meldt gereed — dit is nog geen QA-goedkeuring" : result.status === "failed" ? "v0 meldt een mislukte build" : "Onbekend — geen gereedmelding"}</p>
      <p><strong>v0-versie:</strong> {result.versionId || "Niet beschikbaar"}</p>
      <p><strong>v0-generatietijd:</strong> {result.generationMs === null ? "Niet beschikbaar" : `${(result.generationMs / 1000).toFixed(1)} seconden (indicatief; niet de totale bouwtijd)`}</p>
      <p><strong>API-statuscontrole:</strong> {result.statusLookupMs} ms</p>
      <p><strong>Laatst gecontroleerd:</strong> {result.checkedAt}</p>
      <p className="quiet">{result.note}</p>
      <div style={{ margin: "24px 0", padding: 20, border: "1px solid #d8d8d2", borderRadius: 14 }}>
        <h2>Goedkeuringsdossier</h2>
        {evidenceLoading ? <p>Lokale opslag controleren…</p> : snapshot ? <>
          <p><strong>Preview:</strong> {snapshot.previewId}</p>
          <p><strong>Goedkeuring:</strong> {snapshot.approval.evaluator}{snapshot.approval.humanApproved ? " + expliciete menselijke goedkeuring" : ""}</p>
          <p><strong>Vastgelegd:</strong> {snapshot.savedAt} — in deze browser.</p>
          <p className="quiet">Dit is het oorspronkelijke dossier voor deze v0-chat. QA gebruikt exact dezelfde Preview en signatuur, zonder herinterpretatie.</p>
        </> : <p role="alert">Geen origineel goedkeuringsdossier voor deze chat in deze browser. Bij oudere builds is dit niet opgeslagen. Een screenshot van de website is géén vervanging voor de goedgekeurde Preview. QA en correctie blijven geblokkeerd: genereer de Preview of website NIET opnieuw om dit te omzeilen.</p>}
        {snapshot && result.status === "completed" && result.versionId && <>
          <button onClick={runQA} disabled={qaLoading}>{qaLoading ? "Bestaande desktop en mobiel onafhankelijk beoordelen…" : "Start onafhankelijke QA van deze v0-versie"}</button>
          <p className="quiet">Deze actie start geen v0-generatie, maar verbruikt Firecrawl-screenshot- en OpenAI-QA-credits. Publicatie blijft geblokkeerd tot eigenaar-goedkeuring.</p>
        </>}
        {qaError && <p role="alert">{qaError}</p>}
        {isCurrentQA && qa && <div style={{ marginTop: 18 }}>
          <h3>Onafhankelijke QA: {qa.overall}</h3>
          <p>Resultaat geldt uitsluitend voor v0-versie {qa.versionId}. Zelfs PASS is geen toestemming voor publicatie.</p>
          {qa.checks.map((check) => <p key={check.name}><strong>{check.name} — {check.status}:</strong> {check.evidence}</p>)}
          {qa.overall !== "PASS" && <><h3>Gerichte correctie voor dezelfde v0-chat</h3><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{qa.correctionPrompt}</pre><p className="quiet">Dit is alleen een correctievoorstel. Er is geen nieuwe v0-build of correctiebericht verstuurd.</p></>}
          {qa.timing && <p className="quiet">Capture {qa.timing.captureMs} ms · QA {qa.timing.qaMs} ms · totaal {qa.timing.totalMs} ms.</p>}
        </div>}
      </div>
      {result.status === "completed" && result.versionId && <section style={{ marginTop: 24 }}>
        <h2>Desktop — officiële v0-screenshot</h2>
        {desktopError ? <p role="alert">v0 heeft geen toegankelijke desktop-screenshot teruggegeven. Geen nieuwe build.</p> :
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`desktop:${result.chatId}:${result.versionId}`} src={`/api/regression/adrie/build-screenshot?chatId=${encodeURIComponent(result.chatId)}`} alt="Echte desktoprender van bestaande v0 Adrie-build" style={{ display: "block", width: "100%", height: "auto", border: "1px solid #d8d8d2", borderRadius: 12 }} onError={() => setDesktopError(true)}/>}
        <h2 style={{ marginTop: 30 }}>Mobiel — echte 390px-viewport</h2>
        <p className="quiet">Firecrawl rendert de bestaande Preview opnieuw in mobiele resolutie; geen verkleinde desktopafbeelding, geen nieuwe v0-generatie.</p>
        {mobileError ? <p role="alert">Mobiele screenshot kon niet worden opgehaald. Mobiele QA blijft onbewezen.</p> :
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`mobile:${result.chatId}:${result.versionId}`} src={`/api/regression/adrie/mobile-screenshot?chatId=${encodeURIComponent(result.chatId)}`} alt="Echte mobiele render van bestaande v0 Adrie-build op 390 pixels breedte" style={{ display: "block", width: "min(390px, 100%)", height: "auto", border: "1px solid #d8d8d2", borderRadius: 12 }} onError={() => setMobileError(true)}/>}
      </section>}
      <p className="quiet">Een gereedmelding of screenshot is nooit een kwaliteitsgoedkeuring. De oude Adrie-build blijft FAIL tot onafhankelijke controle en gerichte correctie aantoonbaar slagen.</p>
    </section>}
  </section></main>;
}
