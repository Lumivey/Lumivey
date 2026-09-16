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
  error?: string;
};

export default function AdrieBuildStatusPage() {
  const [chatId, setChatId] = useState("");
  const [activeChatId, setActiveChatId] = useState("");
  const [result, setResult] = useState<BuildState | null>(null);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

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
    <h1>Buildstatus, doorlooptijd en echte render</h1>
    <p className="lead">Leest uitsluitend een bestaande v0-chat en haalt de screenshot van de nieuwste voltooide versie op. Geen nieuwe Discovery, Preview of websitegeneratie.</p>
    <form onSubmit={(event) => { event.preventDefault(); setResult(null); setImageError(false); setError(""); setActiveChatId(chatId.trim()); }}>
      <label htmlFor="v0-chat-id">v0 chat-ID</label><br />
      <input id="v0-chat-id" value={chatId} onChange={(event) => setChatId(event.target.value)} placeholder="Bestaande chat-ID" required pattern="[a-zA-Z0-9_-]{8,128}" />
      <button type="submit">Controleer bestaande build</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {result && <section style={{ marginTop: 24 }} aria-live="polite">
      <p><strong>Status:</strong> {result.status === "pending" ? "v0 bouwt nog" : result.status === "completed" ? "v0 meldt gereed — onafhankelijke Lumivey-QA is nog NIET uitgevoerd" : result.status === "failed" ? "v0 heeft de build als mislukt gemeld" : "Onbekend — geen gereedmelding"}</p>
      <p><strong>v0-generatietijd:</strong> {result.generationMs === null ? "Niet beschikbaar" : `${(result.generationMs / 1000).toFixed(1)} seconden (indicatief)`}</p>
      <p><strong>API-statuscontrole:</strong> {result.statusLookupMs} ms</p>
      <p><strong>Laatst gecontroleerd:</strong> {result.checkedAt}</p>
      <p className="quiet">{result.note}</p>
      {result.status === "completed" && result.versionId && <section style={{ marginTop: 24 }}>
        <h2>Officiële v0-screenshot — automatisch opgehaald</h2>
        <p className="quiet">Dit is de screenshot die v0 voor de bestaande versie beschikbaar stelt. Er is geen nieuwe generatie gestart. Dit bewijst nog geen mobiel gedrag of Lumivey-kwaliteit.</p>
        {imageError ? <p role="alert">Screenshot is niet beschikbaar of deze oudere chat is niet toegankelijk via de v0-API. Er wordt niets opnieuw gegenereerd.</p> :
          // The server fetches the protected screenshot with the v0 key; never expose its URL or API key in the browser.
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`${result.chatId}:${result.versionId}`} src={`/api/regression/adrie/build-screenshot?chatId=${encodeURIComponent(result.chatId)}`} alt="Gerenderde screenshot van de bestaande v0 Adrie-build" style={{ display: "block", width: "100%", height: "auto", border: "1px solid #d8d8d2", borderRadius: 12 }} onError={() => setImageError(true)} />}
      </section>}
      <p className="quiet">Een gereedmelding of screenshot is geen kwaliteitsgoedkeuring. Desktop- en mobiele controle tegen dezelfde goedgekeurde Preview blijven verplicht.</p>
    </section>}
  </section></main>;
}
