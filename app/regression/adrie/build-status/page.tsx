"use client";

import { useEffect, useState } from "react";

type BuildState = {
  chatId: string;
  status: "pending" | "completed" | "failed" | "unknown";
  checkedAt: string;
  generationMs: number | null;
  statusLookupMs: number;
  versionId?: string | null;
  note: string;
};

export default function AdrieBuildStatusPage() {
  const [chatId, setChatId] = useState("");
  const [activeChatId, setActiveChatId] = useState("");
  const [result, setResult] = useState<BuildState | null>(null);
  const [error, setError] = useState("");
  const [desktopError, setDesktopError] = useState(false);
  const [mobileError, setMobileError] = useState(false);

  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get("chatId") || "";
    if (/^[a-zA-Z0-9_-]{8,128}$/.test(fromLink)) {
      setChatId(fromLink);
      setActiveChatId(fromLink);
    }
  }, []);

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
        setResult(data as BuildState);
        setError("");
        if (data.status === "pending" || data.status === "unknown") timer = setTimeout(check, 5000);
      } catch {
        if (!cancelled) setError("Statuscontrole mislukt. Geen nieuwe build gestart.");
      }
    };
    void check();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [activeChatId]);

  return <main className="home"><section className="intro" style={{ maxWidth: 1100 }}>
    <p className="eyebrow">Adrie regressie — bestaande v0-build</p>
    <h1>Buildstatus, doorlooptijd en echte renders</h1>
    <p className="lead">Leest alleen een bestaande v0-chat. Desktop gebruikt de officiële v0-screenshot; mobiel gebruikt een echte 390px-render via de bestaande Firecrawl-integratie. Geen nieuwe websitegeneratie.</p>
    <form onSubmit={(event) => { event.preventDefault(); setResult(null); setDesktopError(false); setMobileError(false); setError(""); setActiveChatId(chatId.trim()); }}>
      <label htmlFor="v0-chat-id">v0 chat-ID</label><br />
      <input id="v0-chat-id" value={chatId} onChange={(event) => setChatId(event.target.value)} placeholder="Bestaande chat-ID" required pattern="[a-zA-Z0-9_-]{8,128}" />
      <button type="submit">Controleer bestaande build</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {result && <section style={{ marginTop: 24 }} aria-live="polite">
      <p><strong>Status:</strong> {result.status === "pending" ? "v0 bouwt nog" : result.status === "completed" ? "v0 meldt gereed — onafhankelijke Lumivey-QA is nog NIET uitgevoerd" : result.status === "failed" ? "v0 meldt een mislukte build" : "Onbekend — geen gereedmelding"}</p>
      <p><strong>v0-generatietijd:</strong> {result.generationMs === null ? "Niet beschikbaar" : `${(result.generationMs / 1000).toFixed(1)} seconden (indicatief)`}</p>
      <p><strong>API-statuscontrole:</strong> {result.statusLookupMs} ms</p>
      <p><strong>Laatst gecontroleerd:</strong> {result.checkedAt}</p>
      <p className="quiet">{result.note}</p>
      {result.status === "completed" && result.versionId && <section style={{ marginTop: 24 }}>
        <h2>Desktop — officiële v0-screenshot</h2>
        {desktopError ? <p role="alert">v0 heeft geen toegankelijke desktop-screenshot teruggegeven. Er wordt niets opnieuw gegenereerd.</p> :
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`desktop:${result.chatId}:${result.versionId}`} src={`/api/regression/adrie/build-screenshot?chatId=${encodeURIComponent(result.chatId)}`} alt="Echte desktoprender van bestaande v0 Adrie-build" style={{ display: "block", width: "100%", height: "auto", border: "1px solid #d8d8d2", borderRadius: 12 }} onError={() => setDesktopError(true)} />}
        <h2 style={{ marginTop: 30 }}>Mobiel — echte 390px-viewport</h2>
        <p className="quiet">Firecrawl rendert de bestaande Preview opnieuw in mobiele resolutie, geen verkleinde desktopafbeelding. Dit gebruikt een screenshot-scrape, niet een nieuwe v0-generatie.</p>
        {mobileError ? <p role="alert">Mobiele screenshot kon niet worden opgehaald (bijvoorbeeld door toegangsbeveiliging van de v0-preview). De mobiele QA blijft dan onbewezen.</p> :
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`mobile:${result.chatId}:${result.versionId}`} src={`/api/regression/adrie/mobile-screenshot?chatId=${encodeURIComponent(result.chatId)}`} alt="Echte mobiele render van bestaande v0 Adrie-build op 390 pixels breedte" style={{ display: "block", width: "min(390px, 100%)", height: "auto", border: "1px solid #d8d8d2", borderRadius: 12 }} onError={() => setMobileError(true)} />}
      </section>}
      <p className="quiet">Een gereedmelding of screenshot is geen kwaliteitsgoedkeuring. Pas na vergelijking met de goedgekeurde Preview en onafhankelijke QA mag een website verder.</p>
    </section>}
  </section></main>;
}
