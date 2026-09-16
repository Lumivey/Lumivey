"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";

const CHAT_ID = "jncA2EfHpLj";
const EXPECTED_VERSION = "b_0H3NhLl18e";
const CONFIRM = "LUMIVEY-ADRIE-VISUAL-REFERENCE-ONE-SHOT";
const LOCK = `lumivey-adrie-visual-attempt-${EXPECTED_VERSION}`;

function prepareHero(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, 1750 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
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
  const [busy, setBusy] = useState(false);

  useEffect(() => { setAttempted(Boolean(sessionStorage.getItem(LOCK))); }, []);

  async function send() {
    if (!reference || !hero || busy || attempted) return;
    setBusy(true); setResult("");
    let requestAttempted = false;
    try {
      if (reference.type !== "image/jpeg" || !/^image\/(?:jpeg|png)$/.test(hero.type)) {
        throw new Error("Kies de JPG-ontwerpreferentie en de losse PNG/JPG-bronfoto uit het overdrachtspakket.");
      }
      if (reference.size > 2_000_000 || hero.size > 6_000_000) throw new Error("Bestand is te groot voor deze test.");
      setPhase("Losse hero-foto veilig verkleinen, ontwerpreferentie ongewijzigd laten…");
      const compactHero = await prepareHero(hero);
      setPhase("Ontwerpreferentie en losse bronfoto uploaden…");
      const stamp = Date.now();
      const [design, production] = await Promise.all([
        upload(`lumivey/v0/adrie/visual-reference-${stamp}.jpg`, reference, {
          access: "public", handleUploadUrl: "/api/uploads/v0-assets", contentType: reference.type,
        }),
        upload(`lumivey/v0/adrie/hero-source-${stamp}.jpg`, compactHero, {
          access: "public", handleUploadUrl: "/api/uploads/v0-assets", contentType: compactHero.type,
        }),
      ]);
      setPhase("Exacte v0-versie controleren; daarna één correctie indienen…");
      // A network timeout can happen after v0 accepted a correction. Never automatically retry.
      sessionStorage.setItem(LOCK, new Date().toISOString());
      setAttempted(true); requestAttempted = true;
      const response = await fetch("/api/regression/adrie/visual-reference", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ confirm: CONFIRM, versionId: EXPECTED_VERSION, referenceUrl: design.url, heroUrl: production.url }),
      });
      const payload = await response.json();
      if (!response.ok || payload.submitted !== true) throw new Error(payload.error || `Verzending niet bevestigd (HTTP ${response.status}).`);
      setResult("v0 heeft de visuele correctie geaccepteerd. Nog geen kwaliteitsgoedkeuring. Controleer nu de nieuwe versie.");
    } catch (error) {
      setResult(`${error instanceof Error ? error.message : "Onbekende fout."}${requestAttempted ? " Niet opnieuw verzenden; controleer eerst de chatstatus." : " Er is geen correctiebericht ingediend."}`);
    } finally { setBusy(false); setPhase(""); }
  }

  return <main className="home"><section className="intro" style={{ maxWidth: 800 }}>
    <p className="eyebrow">AssetPouwer — visuele correctie</p>
    <h1>Laat v0 de echte Preview zien</h1>
    <p className="lead">Eén vervolgbericht aan dezelfde chat {CHAT_ID}. Geen nieuwe Lumivey-preview of chat. Selecteer de twee afzonderlijke bestanden uit het bestaande overdrachtspakket.</p>
    <p><strong>1. Goedgekeurde ontwerpreferentie — JPG, niet als productiebeeld</strong></p>
    <input type="file" accept="image/jpeg" onChange={(event) => setReference(event.target.files?.[0] || null)} disabled={busy || attempted}/>
    <p><strong>2. Losse industriële hero-testfoto — PNG of JPG</strong></p>
    <input type="file" accept="image/png,image/jpeg" onChange={(event) => setHero(event.target.files?.[0] || null)} disabled={busy || attempted}/>
    <p className="quiet">De ontwerpreferentie blijft byte-voor-byte intact en wordt gecontroleerd op de exact goedgekeurde versie. De losse foto wordt voor de upload verkleind, zonder uitsnede. Beide bestanden gaan naar publiek toegankelijke Blob-URL's voor deze test. Gebruik geen vertrouwelijke beelden. Deze testfoto is geen geverifieerd portret van Adrie; niet publiceren zonder validatie.</p>
    <button type="button" disabled={!reference || !hero || busy || attempted} onClick={send}>{busy ? "Bezig…" : attempted ? "Verzendpoging al geregistreerd — status controleren" : "Stuur één visuele correctie naar dezelfde v0-chat"}</button>
    {phase && <p aria-live="polite">{phase}</p>}
    {result && <p role="status">{result}</p>}
    <p><a href={`/regression/adrie/build-status?chatId=${CHAT_ID}`}>Bekijk de bestaande chatstatus (alleen lezen)</a></p>
    <p className="quiet">De verbeterde zakelijke inhoud blijft behouden. Nieuwe desktop- en mobiele website vereisen daarna nog onafhankelijke vergelijking met de Preview, feitencontrole en jouw goedkeuring.</p>
  </section></main>;
}
