"use client";

import { ChangeEvent, useEffect, useState } from "react";

type Status = "PASS" | "WARN" | "FAIL";
type Check = { name: string; status: Status; reason: string };
type Turn = { turn: number; user: string; assistant: string };
type ChatMessage = { role: "user" | "assistant"; content: string };
type SelectedAttachment = { id: string; name: string; mimeType: string; dataUrl: string; size: number };
type BuildResult = { chatId: string; webUrl?: string; previewUrl?: string };

type Result = {
  case: string;
  purpose: string;
  note: string;
  uploadedPhotoCount?: number;
  evaluation: { overall: Status; diagnosis: string; checks: Check[] };
  previewImpression?: { id?: string; imageDataUrl: string; headline?: string; rationale?: string[]; createdAt?: string } | null;
  previewError?: string;
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

const MAX_PHOTOS = 5;
const MAX_EDGE = 1400;
const MAX_BYTES = 1_400_000;

function errorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (typeof object.message === "string") return object.message;
    if (typeof object.error === "string") return object.error;
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value || "Onbekende fout");
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { throw new Error(`Route gaf geen JSON terug: ${text.slice(0, 180)}`); }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postChatWithRetry(payload: unknown, attempts = 3): Promise<{ response: Response; data: any }> {
  let lastResponse: Response | null = null;
  let lastData: any = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(payload as object), diagnostic: true }),
      cache: "no-store",
    });
    const data = await readJsonResponse(response);
    lastResponse = response;
    lastData = data;

    if (response.status !== 429 || attempt === attempts - 1) {
      return { response, data };
    }

    const retryAfterSeconds = Number(response.headers.get("Retry-After") || "60");
    await sleep(Math.max(10, retryAfterSeconds) * 1000);
  }

  return { response: lastResponse as Response, data: lastData };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`${file.name} kon niet worden geopend.`)); };
    image.src = url;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Foto kon niet worden gelezen."));
    reader.readAsDataURL(blob);
  });
}

async function preparePhoto(file: File): Promise<SelectedAttachment> {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Foto kon niet worden voorbereid.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const makeJpeg = (quality: number) => new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Foto kon niet worden voorbereid.")), "image/jpeg", quality);
  });

  let blob = await makeJpeg(0.78);
  if (blob.size > MAX_BYTES) blob = await makeJpeg(0.62);
  if (blob.size > MAX_BYTES) throw new Error(`${file.name} blijft te groot na verkleinen.`);

  return {
    id: `adrie-${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`,
    name: file.name,
    mimeType: "image/jpeg",
    dataUrl: await blobToDataUrl(blob),
    size: blob.size,
  };
}

export default function AdrieRegressionPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("Start Adrie-case…");
  const [photos, setPhotos] = useState<SelectedAttachment[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [run2Loading, setRun2Loading] = useState(false);
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildError, setBuildError] = useState("");
  const [build, setBuild] = useState<BuildResult | null>(null);
  const [sourceSummary, setSourceSummary] = useState<{ crawlMode?: string; pageCount?: number; websiteFacts?: number; goldCandidates?: number; uploadedRealImages?: number } | null>(null);

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

          const { response, data } = await postChatWithRetry({ messages, sourceContexts });
          if (!response.ok) {
            const stage = data?.stage ? ` (${data.stage})` : "";
            throw new Error(`${errorMessage(data?.error || `Adrie replay stopte bij beurt ${index + 1}.`)}${stage}`);
          }

          const assistant = String(data.reply || "");
          messages.push({ role: "assistant", content: assistant });
          replay.push({ turn: index + 1, user, assistant });
          understanding = data.understanding;
          sourceContexts = Array.isArray(data?.understanding?.sources) ? data.understanding.sources : sourceContexts;

          if (index < ADRIE_TURNS.length - 1) await sleep(2500);
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
        if (!finalizeResponse.ok) {
          const stage = finalData?.stage ? ` (${finalData.stage})` : "";
          throw new Error(`${errorMessage(finalData?.error || "Adrie-finalisatie kon niet worden uitgevoerd.")}${stage}`);
        }

        if (!cancelled) {
          setResult(finalData);
          setProgress("Gereed");
        }
      } catch (e) {
        if (!cancelled) setError(errorMessage(e));
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);

  async function handlePhotoSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    event.target.value = "";
    setPhotoError("");
    if (!files.length) return;
    if (files.length > MAX_PHOTOS) {
      setPhotoError(`Kies maximaal ${MAX_PHOTOS} foto's voor deze Run 2.`);
      return;
    }
    try {
      setPhotos(await Promise.all(files.map(preparePhoto)));
    } catch (e) {
      setPhotos([]);
      setPhotoError(errorMessage(e));
    }
  }

  async function runWithPhotos() {
    if (!result || photos.length === 0 || run2Loading) return;
    setRun2Loading(true);
    setPhotoError("");
    setBuild(null);
    try {
      const response = await fetch("/api/regression/adrie/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replay: result.replay,
          sourceContexts: result.sourceContexts,
          understanding: result.understanding,
          attachments: photos,
        }),
        cache: "no-store",
      });
      const data = await readJsonResponse(response);
      if (!response.ok) {
        const stage = data?.stage ? ` (${data.stage})` : "";
        throw new Error(`${errorMessage(data?.error || "Run 2 kon niet worden uitgevoerd.")}${stage}`);
      }
      setResult(data);
    } catch (e) {
      setPhotoError(errorMessage(e));
    } finally {
      setRun2Loading(false);
    }
  }

  async function buildApprovedPreview() {
    if (!result || !result.previewImpression?.imageDataUrl || result.evaluation.overall !== "PASS" || buildLoading) return;
    setBuildLoading(true);
    setBuildError("");
    setBuild(null);
    setSourceSummary(null);
    try {
      const response = await fetch("/api/regression/adrie/build-v0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replay: result.replay,
          sourceContexts: result.sourceContexts,
          understanding: result.understanding,
          previewImpression: {
            id: result.previewImpression.id || "adrie-approved-preview",
            imageDataUrl: result.previewImpression.imageDataUrl,
            headline: result.previewImpression.headline || "AssetPouwer — goedgekeurde Adrie Preview",
            rationale: result.previewImpression.rationale || [],
            createdAt: result.previewImpression.createdAt || new Date().toISOString(),
          },
          evaluation: result.evaluation,
        }),
        cache: "no-store",
      });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(errorMessage(data?.error || "Website Brief → v0 kon niet worden uitgevoerd."));
      setBuild(data.build as BuildResult);
      setSourceSummary(data.sourceSummary || null);
    } catch (e) {
      setBuildError(errorMessage(e));
    } finally {
      setBuildLoading(false);
    }
  }

  const hasRun2 = Boolean(result?.uploadedPhotoCount);
  const canBuildApproved = Boolean(hasRun2 && result?.evaluation.overall === "PASS" && result?.previewImpression?.imageDataUrl);

  return (
    <main className="home">
      <section className="intro" style={{ maxWidth: 980 }}>
        <p className="eyebrow">Contrastcase na Michael</p>
        <h1>Adrie / AssetPouwer</h1>
        <p className="lead">Bestaande website als bron + vastgelegde referentie-inhoud → Discovery → Understanding → creatieve richting → Preview.</p>

        {!result && !error && <p>{progress}</p>}
        {error && (
          <div style={{ marginTop: 24, padding: 18, border: "1px solid #b8b8b0", borderRadius: 14 }}>
            <p className="eyebrow">Test stopte</p><p>{error}</p>
          </div>
        )}

        {result && (
          <>
            {!hasRun2 && (
              <div style={{ margin: "28px 0", padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
                <p className="eyebrow">Run 2 — aangeleverde Adrie-foto&apos;s</p>
                <p>Selecteer in één keer maximaal vijf foto&apos;s. Lumivey analyseert ze als bronpool, kiest zelf slechts de sterkste passende beelden en maakt daarna opnieuw de Preview.</p>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePhotoSelection} disabled={run2Loading} />
                {photos.length > 0 && <p>{photos.length} foto&apos;s klaar voor Run 2: {photos.map((photo) => photo.name).join(", ")}</p>}
                {photoError && <p className="quiet">{photoError}</p>}
                <button onClick={runWithPhotos} disabled={photos.length === 0 || run2Loading}>
                  {run2Loading ? "Foto's verwerken en nieuwe Preview maken…" : "Run 2 met deze foto's"}
                </button>
              </div>
            )}

            <div style={{ margin: "28px 0", padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
              <p className="eyebrow">Beoordeling {hasRun2 ? "— Run 2 met foto's" : "— Run 1"}</p>
              <p><strong>Uitkomst:</strong> {result.evaluation.overall}</p>
              <p><strong>Diagnose:</strong> {result.evaluation.diagnosis}</p>
              {result.evaluation.checks.map((check) => (
                <p key={check.name}><strong>{check.name} — {check.status}:</strong> {check.reason}</p>
              ))}
            </div>

            {result.previewError && (
              <div style={{ margin: "28px 0", padding: 18, border: "1px solid #b8b8b0", borderRadius: 14 }}>
                <p className="eyebrow">Preview-substap</p>
                <p>{result.previewError}</p>
              </div>
            )}

            {result.previewImpression?.imageDataUrl && (
              <div style={{ margin: "32px 0" }}>
                <p className="eyebrow">Artist impression {hasRun2 ? `— met ${result.uploadedPhotoCount} aangeleverde foto’s als bronpool` : "— nog zonder aangeleverde Adrie-foto's"}</p>
                <p>{hasRun2 ? "De foto’s zijn vóór de Preview als echte visuele bron verwerkt; Lumivey hoeft ze niet allemaal te tonen." : "Run 1 test eerst de interpretatielaag zonder aangeleverde foto’s."}</p>
                <img src={result.previewImpression.imageDataUrl} alt="Adrie AssetPouwer artist impression" style={{ width: "100%", height: "auto", display: "block", borderRadius: 18, border: "1px solid #d8d8d2" }} />
              </div>
            )}

            {canBuildApproved && (
              <div style={{ margin: "32px 0", padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
                <p className="eyebrow">Volgende gate — Website Brief → v0</p>
                <p>Deze PASS-preview wordt als design authority gebruikt. Lumivey crawlt AssetPouwer opnieuw met de herstelde bronlaag, verrijkt de Website Brief en geeft v0 alleen gevalideerde echte klantbeelden als productie-assets.</p>
                <button onClick={buildApprovedPreview} disabled={buildLoading}>
                  {buildLoading ? "Bronlaag verversen, Website Brief maken en v0 bouwen…" : "Bouw website vanuit deze goedgekeurde Preview"}
                </button>
                {buildError && <p className="quiet" style={{ marginTop: 16 }}>{buildError}</p>}
                {sourceSummary && (
                  <p className="quiet" style={{ marginTop: 16 }}>
                    Bronlaag: {sourceSummary.crawlMode || "onbekend"} · {sourceSummary.pageCount ?? 0} pagina&apos;s · {sourceSummary.websiteFacts ?? 0} bronfeiten · {sourceSummary.goldCandidates ?? 0} goudkandidaten · {sourceSummary.uploadedRealImages ?? 0} echte geüploade beelden.
                  </p>
                )}
                {build && (
                  <div style={{ marginTop: 18 }}>
                    <p><strong>v0-build gestart.</strong> Chat-id: {build.chatId}</p>
                    {build.previewUrl && <p><a href={build.previewUrl} target="_blank" rel="noreferrer">Open de technische preview</a></p>}
                    {build.webUrl && <p><a href={build.webUrl} target="_blank" rel="noreferrer">Open de v0-build</a></p>}
                  </div>
                )}
              </div>
            )}

            {result.replay.map((turn) => (
              <article key={turn.turn} style={{ margin: "30px 0", paddingBottom: 28, borderBottom: "1px solid #deded8" }}>
                <p className="eyebrow">Beurt {turn.turn}</p>
                <p><strong>Adrie:</strong> {turn.user}</p>
                <p><strong>Lumivey:</strong> {turn.assistant}</p>
              </article>
            ))}

            <details style={{ margin: "34px 0" }}><summary>Broncontext bekijken</summary><pre style={{ whiteSpace: "pre-wrap", marginTop: 18, fontSize: 13 }}>{JSON.stringify(result.sourceContexts, null, 2)}</pre></details>
            <details style={{ margin: "34px 0" }}><summary>Understanding bekijken</summary><pre style={{ whiteSpace: "pre-wrap", marginTop: 18, fontSize: 13 }}>{JSON.stringify(result.understanding, null, 2)}</pre></details>
            <details style={{ margin: "34px 0" }}><summary>Creatieve richting bekijken</summary><pre style={{ whiteSpace: "pre-wrap", marginTop: 18, fontSize: 13 }}>{JSON.stringify({ artDirection: result.artDirection, siteDirection: result.siteDirection }, null, 2)}</pre></details>
          </>
        )}
      </section>
    </main>
  );
}
