"use client";

import { useEffect, useState } from "react";

const CHAT_ID = "jncA2EfHpLj";
const STATUS_URL = `/api/regression/adrie/build-status?chatId=${CHAT_ID}`;
const ATTEMPT_PREFIX = "lumivey-adrie-correction-attempt-";

type Status = { status: string; versionId?: string | null; checkedAt?: string; error?: string };
type Submission = { submitted?: boolean; chatId?: string; previousVersionId?: string; submissionMs?: number; note?: string; error?: string; messageId?: string | null };

export default function AdrieSendExistingCorrectionPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Submission | null>(null);
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(STATUS_URL, { cache: "no-store" });
        const value = (await response.json()) as Status;
        if (!response.ok) throw new Error(value.error || "v0-statuscontrole is niet bereikbaar.");
        if (!cancelled) {
          setStatus(value);
          setAttempted(Boolean(value.versionId && sessionStorage.getItem(ATTEMPT_PREFIX + value.versionId)));
        }
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Statuscontrole mislukt."); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  async function submitCorrection() {
    if (sending || attempted || status?.status !== "completed" || !status.versionId) return;
    const versionId = status.versionId;
    // Store attempt BEFORE making any network request: a timeout may occur after v0 has accepted it.
    sessionStorage.setItem(ATTEMPT_PREFIX + versionId, new Date().toISOString());
    setAttempted(true); setSending(true); setError("");
    try {
      const response = await fetch("/api/regression/adrie/correct-existing", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ chatId: CHAT_ID, confirm: "CORRIGEER_BESTAANDE_ADRIE", expectedVersionId: versionId }),
      });
      const payload = (await response.json()) as Submission;
      if (!response.ok || payload.submitted !== true) throw new Error(payload.error || `v0 heeft de correctie niet bevestigd (HTTP ${response.status}).`);
      setResult(payload);
    } catch (cause) {
      setError(`${cause instanceof Error ? cause.message : "Correctie kon niet bevestigd worden."} Verzend niet opnieuw: bij een netwerkfout kan v0 het bericht al ontvangen hebben. Controleer eerst de bestaande chatstatus.`);
    } finally { setSending(false); }
  }

  return <main className="home"><section className="intro" style={{ maxWidth: 850 }}>
    <p className="eyebrow">AssetPouwer — bestaande build gericht corrigeren</p>
    <h1>Eén correctie, dezelfde v0-chat</h1>
    <p className="lead">Deze test gebruikt de afgekeurde originele v0-chat. Hij maakt geen nieuwe chat en genereert geen nieuwe Lumivey-preview. Het vaste correctiebericht bevat zowel Preview-WoW als begrijpelijke dienstverlening en correct merkgebruik.</p>
    <p><strong>Chat-ID:</strong> {CHAT_ID}</p>
    <p><strong>Actuele v0-status:</strong> {loading ? "controleren…" : status?.status || "onbekend"}</p>
    <p><strong>Bestaande versie:</strong> {status?.versionId || "niet beschikbaar"}</p>
    {status?.status === "completed" && !attempted && <div style={{ padding: 20, border: "1px solid #d8d8d2", borderRadius: 14, margin: "24px 0" }}>
      <h2>Herstelopdracht versturen</h2>
      <p>Dit is één bewuste correctie binnen dezelfde chat. v0 kan hiervoor generatiecredits gebruiken. Er wordt geen tweede portret, fictief logo of onbevestigde bedrijfsclaim toegestaan. Het werkelijk gerenderde resultaat moet daarna nog onafhankelijk gecontroleerd worden.</p>
      <button type="button" disabled={sending} onClick={submitCorrection}>{sending ? "Correctie indienen…" : "Verstuur één correctie naar bestaande Adrie-chat"}</button>
    </div>}
    {status && status.status !== "completed" && <p role="alert">De bestaande versie is niet als gereed bevestigd. Daarom wordt geen correctie verstuurd.</p>}
    {attempted && !result && !error && <p>Er is in deze browsersessie al een verzendpoging gedaan voor dit versie-ID. Geen tweede verzoek zonder statuscontrole.</p>}
    {result?.submitted && <div style={{ padding: 20, border: "1px solid #d8d8d2", borderRadius: 14, margin: "24px 0" }}>
      <h2>Correctieverzoek door v0 geaccepteerd</h2>
      <p>{result.note}</p><p>Indientijd: {result.submissionMs} ms. Dit is niet de generatie- of QA-tijd.</p>
      <p><a href="https://v0.app/ruud-s-lumivey1/chat/assetpouwer-website-build-jncA2EfHpLj" target="_blank" rel="noreferrer">Bekijk dezelfde v0-chat</a></p>
      <p><a href={`/regression/adrie/build-status?chatId=${CHAT_ID}`}>Controleer het nieuwe versie-ID en de desktop-/mobielrenders</a></p>
    </div>}
    {attempted && !result && !error && <p>Controleer of een nieuwe versie verschijnt; verstuur dit verzoek niet nogmaals.</p>}
    {attempted && !result && <p><a href={`/regression/adrie/build-status?chatId=${CHAT_ID}`}>Bekijk de bestaande v0-status</a></p>}
    {error && <p role="alert">{error}</p>}
    <p className="quiet">Dit scherm is een eenmalige interne regressietest, geen algemene productiebediening. De originele Preview is alleen als menselijke ontwerpreferentie gebruikt; niet als afbeelding op de website geplaatst. Een geslaagd API-verzoek betekent nog geen goede website.</p>
  </section></main>;
}
