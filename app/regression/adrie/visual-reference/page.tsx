"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";

const CHAT_ID = "jncA2EfHpLj";
const EXPECTED_VERSION = "b_0H3NhLl18e";
const CONFIRM = "LUMIVEY-ADRIE-VISUAL-REFERENCE-ONE-SHOT";

type UploadResult = { url: string };

export default function AdrieVisualReferencePage() {
  const [reference, setReference] = useState<File | null>(null);
  const [hero, setHero] = useState<File | null>(null);
  const [phase, setPhase] = useState("");
  const [result, setResult] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!reference || !hero || busy || attempted) return;
    setBusy(true); setResult("");
    try {
      if (!/^image\/jpeg$/.test(reference.type) || !/^image\/(?:jpeg|png)$/.test(hero.type)) {
        throw new Error("Kies de JPG-ontwerpreferentie en de losse PNG/JPG-bronfoto uit het overdrachtspakket.");
      }
      if (reference.size > 2_000_000 || hero.size > 4_000_000) throw new Error("Bestand is te groot voor deze test.");
      setPhase("Ontwerpreferentie en losse bronfoto uploaden…");
      const stamp = Date.now();
      const [design, production] = await Promise.all([
        upload(`lumivey/v0/adrie/visual-reference-${stamp}.jpg`, reference, {
          access: "public", handleUploadUrl: "/api/uploads/v0-assets", contentType: reference.type,
        }) as Promise<UploadResult>,
        upload(`lumivey/v0/adrie/hero-source-${stamp}.${hero.type === "image/png" ? "png" : "jpg"}`, hero, {
          access: "public", handleUploadUrl: "/api/uploads/v0-assets", contentType: hero.type,
        }) as Promise<UploadResult>,
      ]);
      setPhase("Exacte v0-versie controleren; daarna één correctie indienen…");
      // An uncertain network result may still mean v0 accepted the request: lock BEFORE POST.
      sessionStorage.setItem(`lumivey-adrie-visual-attempt-${EXPECTED_VERSION}`, new Date().toISOString());
      setAttempted(true);
      const response = await fetch("/api/regression/adrie/visual-reference", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: CONFIRM, versionId: EXPECTED_VERSION, referenceUrl: design.url, heroUrl: production.url }),
      });
      const payload = await response.json();
      if (!response.ok || payload.submitted !== true) throw new Error(payload.error || `Verzending niet bevestigd (HTTP ${response.status}).`);
      setResult("v0 heeft de visuele correctie geaccepteerd. Er is nog geen kwaliteitsgoedkeuring. Controleer nu het versie-ID en de website.");
    } catch (error) {
      setResult(`${error instanceof Error ? error.message : "Onbekende fout."} ${attempted ? "Niet opnieuw versturen; lees eerst de chatstatus." : ""}`);
    } finally { setBusy(false); setPhase(""); }
  }

  return <main className="home"><section className="intro" style={{ maxWidth: 800 }}>
    <p className="eyebrow">AssetPouwer — visuele correctie</p>
    <h1>Laat v0 de echte Preview zien</h1>
    <p className="lead">Eén vervolgbericht aan de bestaande chat {CHAT_ID}. Dit is geen nieuwe website of Preview. Upload beide afzonderlijke bestanden uit het eerdere overdrachtspakket; v0 mag de ontwerpafbeelding nooit als websitebeeld gebruiken.</p>
    <p><strong>1. Ontwerpreferentie (JPG, niet als productiebeeld)</strong></p>
    <input type="file" accept="image/jpeg" onChange={(e) => setReference(e.target.files?.[0] || null)} disabled={busy || attempted}/>
    <p><strong>2. Losse industriële hero-bronfoto (PNG of JPG, alleen testmateriaal)</strong></p>
    <input type="file" accept="image/png,image/jpeg" onChange={(e) => setHero(e.target.files?.[0] || null)} disabled={busy || attempted}/>
    <p>Beide assets worden voor deze v0-test naar publiek toegankelijke Vercel Blob-URL's geüpload. Gebruik geen vertrouwelijke of niet-vrijgegeven foto's. De hero-testfoto is niet geverifieerd als echte foto van Adrie en mag niet zonder toestemming worden gepubliceerd.</p>
    <button type="button" disabled={!reference || !hero || busy || attempted} onClick={send}>{busy ? "Bezig…" : "Stuur één visuele correctie naar dezelfde v0-chat"}</button>
    {phase && <p aria-live="polite">{phase}</p>}
    {result && <p role="status">{result}</p>}
    <p><a href={`/regression/adrie/build-status?chatId=${CHAT_ID}`}>Bekijk de bestaande v0-versie (alleen lezen)</a></p>
    <p className="quiet">Geen automatische goedkeuring. Kwaliteit wordt pas vastgesteld na echte desktop- en mobiele vergelijking met de goedgekeurde Preview én controle van het zakelijke aanbod.</p>
  </section></main>;
}
