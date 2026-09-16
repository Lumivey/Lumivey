"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";

const CHAT_ID = "jncA2EfHpLj";
const CONFIRM = "LUMIVEY-ADRIE-VISUAL-REFERENCE-ONE-SHOT";
// Preserve the existing lock key so earlier attempts cannot be silently forgotten.
const LOCK = "lumivey-adrie-visual-attempt-b_0H3NhLl18e";
type Diagnostic = { verdict: string; currentVersionId?: string | null; versionStatus?: string; visualMessageReceived?: boolean; safeToPrepareOneSubmission?: boolean };

function prepareHero(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, 1750 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) { reject(new Error("Bronfoto kon niet worden voorbereid.")); return; }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.82, 0.7, 0.58]) {
        const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", quality));
        if (blob && blob.size <= 1_900_000) {
          resolve(new File([blob], "AssetPouwer-hero-test.jpg", { type: "image/jpeg" })); return;
        }
      }
      reject(new Error("Bronfoto bleef te groot; er is niets verstuurd."));
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Bronfoto kan niet worden geopend.")); };
    image.src = objectUrl;
  });
}

export default function AdrieVisualReferencePage() {
  const [reference, setReference] = useState<File | null>(null);
  const [hero, setHero] = useState<File | null>(null);
  const [phase, setPhase] = useState("");
  const [result, setResult] = useState("");
  const [attempted, setAttempted] = useState(true);
  const [checking, setChecking] = useState(false);
  const [verifiedVersion, setVerifiedVersion] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setAttempted(Boolean(sessionStorage.getItem(LOCK))); }, []);

  async function verifyBeforeRetry() {
    if (checking || busy) return;
    setChecking(true); setVerifiedVersion(null); setResult("");
    try {
      const response = await fetch("/api/regression/adrie/visual-diagnostic", { cache: "no-store" });
      const data: Diagnostic = await response.json();
      const safe = response.ok && data.verdict === "not_received_version_ready"
        && data.visualMessageReceived === false && data.safeToPrepareOneSubmission === true
        && data.versionStatus === "completed" && typeof data.currentVersionId === "string"
        && /^[A-Za-z0-9_-]{8,128}$/.test(data.currentVersionId);
      if (!safe || !data.currentVersionId) {
        setAttempted(true);
        setResult("Leescontrole geeft geen veilige vrijgave: bericht mogelijk ontvangen of v0-versie niet gereed. Er wordt niets verstuurd.");
        return;
      }
      // The actual API version is carried verbatim, never copied from screenshots or typed manually.
      sessionStorage.removeItem(LOCK);
      setAttempted(false); setVerifiedVersion(data.currentVersionId);
      setResult("Veilig bevestigd: visueel bericht ontbreekt en de huidige v0-versie is gereed. Selecteer beide bestanden en verstuur daarna één keer.");
    } catch {
      setAttempted(true);
      setResult("Leescontrole mislukt. Geen verzending mogelijk.");
    } finally { setChecking(false); }
  }

  async function send() {
    if (!reference || !hero || busy || attempted || !verifiedVersion) return;
    const versionAtApproval = verifiedVersion;
    setBusy(true); setResult(""); setVerifiedVersion(null);
    let requestAttempted = false;
    try {
      if (reference.type !== "image/jpeg" || !/^image\/(?:jpeg|png)$/.test(hero.type)) {
        throw new Error("Kies de JPG-ontwerpreferentie en de losse PNG/JPG-bronfoto uit het overdrachtspakket.");
      }
      if (reference.size > 2_000_000 || hero.size > 6_000_000) throw new Error("Bestand is te groot voor deze test.");
      setPhase("Losse hero-foto verkleinen; exacte ontwerpreferentie ongewijzigd laten…");
      const compactHero = await prepareHero(hero);
      setPhase("Beide bestanden uploaden…");
      const stamp = Date.now();
      const [design, production] = await Promise.all([
        upload(`lumivey/v0/adrie/visual-reference-${stamp}.jpg`, reference, {
          access: "public", handleUploadUrl: "/api/uploads/v0-assets", contentType: reference.type,
        }),
        upload(`lumivey/v0/adrie/hero-source-${stamp}.jpg`, compactHero, {
          access: "public", handleUploadUrl: "/api/uploads/v0-assets", contentType: compactHero.type,
        }),
      ]);
      setPhase("v0-berichtgeschiedenis en de exact gelezen versie controleren; dan één correctie indienen…");
      // A network timeout can happen AFTER the remote service accepted a message: lock before POST.
      sessionStorage.setItem(LOCK, new Date().toISOString());
      setAttempted(true); requestAttempted = true;
      const response = await fetch("/api/regression/adrie/visual-reference", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ confirm: CONFIRM, versionId: versionAtApproval, referenceUrl: design.url, heroUrl: production.url }),
      });
      const payload = await response.json();
      if (!response.ok || payload.submitted !== true) throw new Error(payload.error || `Verzending niet bevestigd (HTTP ${response.status}).`);
      setResult("v0 heeft de visuele correctie geaccepteerd. Nog geen kwaliteitsgoedkeuring. Controleer nu de nieuwe versie.");
    } catch (error) {
      setResult(`${error instanceof Error ? error.message : "Onbekende fout."}${requestAttempted ? " Niet opnieuw verzenden; voer eerst opnieuw de leescontrole uit." : " Er is geen correctiebericht ingediend; controleer v0 opnieuw voordat je opnieuw probeert."}`);
    } finally { setBusy(false); setPhase(""); }
  }

  return <main className="home"><section className="intro" style={{ maxWidth: 800 }}>
    <p className="eyebrow">AssetPouwer — visuele correctie</p>
    <h1>Laat v0 de echte Preview zien</h1>
    <p className="lead">Eén vervolgbericht aan dezelfde chat {CHAT_ID}. Geen nieuwe Lumivey-preview of chat. Selecteer de twee afzonderlijke bestanden uit het bestaande overdrachtspakket.</p>
    <div style={{ padding: 18, border: "1px solid #d8d8d2", borderRadius: 12, marginBottom: 24 }}>
      <p><strong>Verzendbeveiliging</strong></p>
      <p>De versie-ID wordt nu rechtstreeks en zonder overtypen uit v0 gelezen; verwisselbare tekens zoals 0/O en I/l blokkeren de test niet meer. Vlak vóór verzenden controleert de server dezelfde versie en de berichtgeschiedenis opnieuw.</p>
      <button type="button" onClick={verifyBeforeRetry} disabled={checking || busy}>{checking ? "Veiligheid controleren…" : "Controleer v0 en geef verzenden veilig vrij"}</button>
      {verifiedVersion && <p role="status">Leescontrole geslaagd. Exacte v0-versie: <code>{verifiedVersion}</code>. Eén gerichte verzending toegestaan.</p>}
    </div>
    <p><strong>1. Goedgekeurde ontwerpreferentie — JPG, niet als productiebeeld</strong></p>
    <input type="file" accept="image/jpeg" onChange={(event) => setReference(event.target.files?.[0] || null)} disabled={busy || attempted || !verifiedVersion}/>
    <p><strong>2. Losse industriële hero-testfoto — PNG of JPG</strong></p>
    <input type="file" accept="image/png,image/jpeg" onChange={(event) => setHero(event.target.files?.[0] || null)} disabled={busy || attempted || !verifiedVersion}/>
    <p className="quiet">De ontwerpreferentie blijft byte-voor-byte intact en wordt gecontroleerd op de exact goedgekeurde versie. De losse foto wordt voor de upload verkleind zonder uitsnede. Beide bestanden gaan voor deze test naar publiek toegankelijke Blob-URL's. De testfoto is geen geverifieerd portret van Adrie: niet publiceren zonder validatie.</p>
    <button type="button" disabled={!reference || !hero || busy || attempted || !verifiedVersion} onClick={send}>{busy ? "Bezig…" : attempted ? "Verzendpoging geregistreerd — controleer v0" : "Stuur één visuele correctie naar dezelfde v0-chat"}</button>
    {phase && <p aria-live="polite">{phase}</p>}
    {result && <p role="status">{result}</p>}
    <p><a href={`/regression/adrie/build-status?chatId=${CHAT_ID}`}>Bekijk de bestaande chatstatus (alleen lezen)</a></p>
    <p className="quiet">Geen automatische goedkeuring. De verbeterde zakelijke inhoud blijft behouden. Nieuwe desktop- en mobiele website vereisen vergelijking met de Preview, feitencontrole en jouw goedkeuring.</p>
  </section></main>;
}
