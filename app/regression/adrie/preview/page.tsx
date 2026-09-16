"use client";

import { ChangeEvent, useState } from "react";
import { upload } from "@vercel/blob/client";
import { saveBuildSnapshot, type BuildSnapshot } from "@/lib/lumivey/build-snapshot";
import type { PreviewSignature } from "@/lib/lumivey/preview-signature";

type Status = "PASS" | "WARN" | "FAIL";
type Check = { name: string; status: Status; reason: string };
type SelectedAttachment = { id: string; name: string; mimeType: string; dataUrl: string; size: number };
type StoredAttachment = { id: string; name: string; mimeType: string; url: string; size: number };
type BuildResult = { chatId: string; webUrl?: string; previewUrl?: string };
type Result = {
  case: string;
  purpose: string;
  note: string;
  uploadedPhotoCount?: number;
  evaluation: { overall: Status; diagnosis: string; checks: Check[] };
  previewImpression?: { id?: string; imageDataUrl: string; headline?: string; rationale?: string[]; createdAt?: string } | null;
  previewError?: string;
  replay: Array<{ turn: number; user: string; assistant: string }>;
  sourceContexts: unknown[];
  understanding: unknown;
  artDirection: unknown;
  siteDirection: unknown;
};

const MAX_PHOTOS = 5;
const MAX_EDGE = 1400;
const MAX_BYTES = 1_400_000;
const PREVIEW_PHOTO_EDGE = 1000;
const PREVIEW_PHOTO_BYTES = 420_000;
const BUILD_PHOTO_EDGE = 1100;
const BUILD_PHOTO_BYTES = 300_000;
const BUILD_PREVIEW_EDGE = 1500;
const BUILD_PREVIEW_BYTES = 650_000;

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

function loadFileImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`${file.name} kon niet worden geopend.`)); };
    image.src = url;
  });
}

function loadDataUrlImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Beeld kon niet worden voorbereid."));
    image.src = dataUrl;
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

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, encoded] = dataUrl.split(",", 2);
  if (!meta || !encoded) throw new Error("Beelddata is ongeldig.");
  const mimeType = /data:([^;]+)/.exec(meta)?.[1] || "image/jpeg";
  const bytes = atob(encoded);
  const array = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) array[index] = bytes.charCodeAt(index);
  return new Blob([array], { type: mimeType });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Beeld kon niet worden gecomprimeerd.")), "image/jpeg", quality);
  });
}

async function preparePhoto(file: File): Promise<SelectedAttachment> {
  const image = await loadFileImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Foto kon niet worden voorbereid.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let blob = await canvasToJpeg(canvas, 0.78);
  if (blob.size > MAX_BYTES) blob = await canvasToJpeg(canvas, 0.62);
  if (blob.size > MAX_BYTES) throw new Error(`${file.name} blijft te groot na verkleinen.`);
  return {
    id: `adrie-${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`,
    name: file.name, mimeType: "image/jpeg", dataUrl: await blobToDataUrl(blob), size: blob.size,
  };
}

async function compressDataUrl(dataUrl: string, name: string, maxEdge: number, maxBytes: number): Promise<SelectedAttachment> {
  const image = await loadDataUrlImage(dataUrl);
  let scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  let lastBlob: Blob | null = null;
  for (let resizeAttempt = 0; resizeAttempt < 3; resizeAttempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Beeld kon niet worden voorbereid.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.76, 0.64, 0.54, 0.44]) {
      const blob = await canvasToJpeg(canvas, quality);
      lastBlob = blob;
      if (blob.size <= maxBytes) return {
        id: `v0-${Date.now()}-${Math.random().toString(36).slice(2)}-${name}`,
        name, mimeType: "image/jpeg", dataUrl: await blobToDataUrl(blob), size: blob.size,
      };
    }
    scale *= 0.78;
  }
  if (!lastBlob) throw new Error(`${name} kon niet worden voorbereid.`);
  return {
    id: `v0-${Date.now()}-${Math.random().toString(36).slice(2)}-${name}`,
    name, mimeType: "image/jpeg", dataUrl: await blobToDataUrl(lastBlob), size: lastBlob.size,
  };
}

async function storeForV0(asset: SelectedAttachment, slot: string): Promise<StoredAttachment> {
  const pathname = `lumivey/v0/adrie/${Date.now()}-${slot}.jpg`;
  const stored = await upload(pathname, dataUrlToBlob(asset.dataUrl), {
    access: "public", contentType: asset.mimeType,
    handleUploadUrl: "/api/uploads/v0-assets", clientPayload: JSON.stringify({ case: "adrie", slot }),
  });
  return { id: asset.id, name: asset.name, mimeType: asset.mimeType, url: stored.url, size: asset.size };
}

export default function AdriePreviewOnlyPage() {
  const [checkpoint, setCheckpoint] = useState<Result | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [photos, setPhotos] = useState<SelectedAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildStage, setBuildStage] = useState("");
  const [buildError, setBuildError] = useState("");
  const [build, setBuild] = useState<BuildResult | null>(null);
  const [humanApproved, setHumanApproved] = useState(false);
  const [evidenceSaved, setEvidenceSaved] = useState(false);

  async function loadCheckpoint() {
    if (loading) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/regression/adrie/checkpoint", { cache: "no-store" });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(errorMessage(data?.error || "Checkpoint kon niet worden geladen."));
      setCheckpoint(data); setResult(null); setHumanApproved(false);
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }

  async function handlePhotoSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    event.target.value = ""; setError("");
    if (!files.length) return;
    if (files.length > MAX_PHOTOS) { setError(`Kies maximaal ${MAX_PHOTOS} foto's.`); return; }
    try { setPhotos(await Promise.all(files.map(preparePhoto))); }
    catch (e) { setPhotos([]); setError(errorMessage(e)); }
  }

  async function generatePreview() {
    const base = result || checkpoint;
    if (!base || photos.length === 0 || loading) return;
    setLoading(true); setError(""); setBuild(null); setBuildError(""); setHumanApproved(false); setEvidenceSaved(false);
    try {
      const previewPhotos = await Promise.all(photos.map((photo) => compressDataUrl(photo.dataUrl, photo.name, PREVIEW_PHOTO_EDGE, PREVIEW_PHOTO_BYTES)));
      const response = await fetch("/api/regression/adrie/finalize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replay: base.replay, sourceContexts: base.sourceContexts, understanding: base.understanding, attachments: previewPhotos }),
        cache: "no-store",
      });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(errorMessage(data?.error || "Preview kon niet worden gemaakt."));
      setResult(data);
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }

  async function buildWebsite() {
    const status = result?.evaluation.overall;
    const approved = status === "PASS" || (status === "WARN" && humanApproved);
    if (!result?.previewImpression?.imageDataUrl || !approved || buildLoading) return;
    setBuildLoading(true); setBuildStage("Beelden voorbereiden…"); setBuildError(""); setBuild(null); setEvidenceSaved(false);
    try {
      const compactPreview = await compressDataUrl(result.previewImpression.imageDataUrl, "adrie-approved-preview.jpg", BUILD_PREVIEW_EDGE, BUILD_PREVIEW_BYTES);
      const compactPhotos = await Promise.all(photos.map((photo) => compressDataUrl(photo.dataUrl, photo.name, BUILD_PHOTO_EDGE, BUILD_PHOTO_BYTES)));
      setBuildStage("Preview en foto’s rechtstreeks opslaan…");
      const [storedPreview, ...storedPhotos] = await Promise.all([
        storeForV0(compactPreview, "approved-preview"),
        ...compactPhotos.map((photo, index) => storeForV0(photo, `photo-${index + 1}`)),
      ]);
      setBuildStage("Compacte Website Brief naar v0 sturen…");
      const previewId = result.previewImpression.id || "adrie-approved-preview";
      const response = await fetch("/api/regression/adrie/build-v0", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replay: result.replay, attachments: storedPhotos,
          previewImpression: {
            id: previewId, imageDataUrl: storedPreview.url,
            headline: result.previewImpression.headline || "AssetPouwer — goedgekeurde Adrie Preview",
            rationale: result.previewImpression.rationale || [],
            createdAt: result.previewImpression.createdAt || new Date().toISOString(),
          },
          evaluation: result.evaluation, humanApproved: status === "WARN" && humanApproved,
        }), cache: "no-store",
      });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(errorMessage(data?.error || "Website Brief → v0 kon niet worden uitgevoerd."));
      const startedBuild = data.build as BuildResult;
      setBuild(startedBuild); // Never hide a started v0 chat if evidence storage fails.
      setBuildStage("v0-build gestart; goedkeuringsdossier vastleggen…");
      if (!startedBuild?.chatId || !data.brief?.previewSignature || data.brief.artistImpression?.id !== previewId) {
        throw new Error("v0 is gestart, maar de teruggegeven Brief of gelockte PreviewSignature ontbreekt. Geen QA toegestaan.");
      }
      const snapshot: BuildSnapshot = {
        schemaVersion: 1, chatId: startedBuild.chatId, previewId,
        approvedPreview: storedPreview.url, previewSignature: data.brief.previewSignature as PreviewSignature,
        brief: data.brief as Record<string, unknown>,
        approval: { evaluator: status as "PASS" | "WARN", humanApproved: status === "WARN" && humanApproved },
        savedAt: new Date().toISOString(),
      };
      await saveBuildSnapshot(snapshot);
      setEvidenceSaved(true);
      setBuildStage("v0-build gestart; originele goedgekeurde Preview, signatuur en Brief lokaal gekoppeld aan het chat-ID.");
    } catch (e) {
      const message = errorMessage(e);
      setBuildError(/blob|token|upload/i.test(message) ? `${message} Controleer of een Vercel Blob store aan het Lumivey-project is gekoppeld.` : message);
      setBuildStage("");
    } finally { setBuildLoading(false); }
  }

  const status = result?.evaluation.overall;
  const machinePass = status === "PASS";
  const warnCanBeApproved = status === "WARN" && Boolean(result?.previewImpression?.imageDataUrl);
  const canBuild = Boolean(result?.previewImpression?.imageDataUrl && (machinePass || (warnCanBeApproved && humanApproved)));

  return <main className="home"><section className="intro" style={{ maxWidth: 980 }}>
    <p className="eyebrow">Adrie regressie — Previewfase</p>
    <h1>Preview verbeteren zonder opnieuw te beginnen</h1>
    <p className="lead">Discovery en brononderzoek zijn al afgerond. Deze route hergebruikt een vastgelegde checkpoint en draait géén nieuwe Firecrawl- of gespreksreplay.</p>
    {!checkpoint && <div style={{ margin: "28px 0", padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
      <p><strong>Stap 1.</strong> Laad de bestaande Adrie-checkpoint.</p>
      <button onClick={loadCheckpoint} disabled={loading}>{loading ? "Checkpoint laden…" : "Laad bestaande Discovery + broncontext"}</button>
    </div>}
    {checkpoint && <div style={{ margin: "28px 0", padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
      <p><strong>Stap 2.</strong> Selecteer dezelfde vijf echte Adrie-foto&apos;s als bronpool. Dat is het enige wat opnieuw nodig is.</p>
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePhotoSelection} disabled={loading}/>
      {photos.length > 0 && <p>{photos.length} foto&apos;s klaar: {photos.map((photo) => photo.name).join(", ")}</p>}
      <button onClick={generatePreview} disabled={photos.length === 0 || loading}>{loading ? "Alleen Preview maken…" : result ? "Maak Preview opnieuw met dezelfde state" : "Maak Preview met bestaande state"}</button>
    </div>}
    {error && <div style={{ margin: "24px 0", padding: 18, border: "1px solid #b8b8b0", borderRadius: 14 }}><strong>Fout:</strong> {error}</div>}
    {result && <>
      <div style={{ margin: "28px 0", padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
        <p className="eyebrow">Beoordeling — Preview met bestaande state</p>
        <p><strong>Uitkomst:</strong> {result.evaluation.overall}</p>
        <p><strong>Diagnose:</strong> {result.evaluation.diagnosis}</p>
        {result.evaluation.checks.map((check) => <p key={check.name}><strong>{check.name} — {check.status}:</strong> {check.reason}</p>)}
      </div>
      {result.previewImpression?.imageDataUrl && <div style={{ margin: "32px 0" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={result.previewImpression.imageDataUrl} alt="Adrie AssetPouwer artist impression" style={{ width: "100%", height: "auto", display: "block", borderRadius: 18, border: "1px solid #d8d8d2" }}/>
      </div>}
      {status === "FAIL" && <p className="quiet">FAIL blokkeert de websitebouw. Verbeter eerst de Preview met dezelfde state.</p>}
      {warnCanBeApproved && !humanApproved && <div style={{ margin: "32px 0", padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
        <p><strong>Menselijke gate.</strong> De evaluator geeft WARN, maar als jij de Preview inhoudelijk goed genoeg vindt, mag je hem expliciet goedkeuren. De WARN blijft zichtbaar in het dossier.</p>
        <button onClick={() => setHumanApproved(true)}>Ik keur deze Preview goed</button>
      </div>}
      {status === "WARN" && humanApproved && <p className="quiet">Preview handmatig goedgekeurd. De WARN blijft geregistreerd; websitebouw is nu toegestaan.</p>}
      {canBuild && <div style={{ margin: "32px 0", padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
        <p className="eyebrow">Volgende gate — Website Brief → v0</p>
        <button onClick={buildWebsite} disabled={buildLoading}>{buildLoading ? "v0-overdracht voorbereiden…" : "Bouw website vanuit deze goedgekeurde Preview"}</button>
        {buildStage && <p className="quiet">{buildStage}</p>}
        {buildError && <p role="alert">{buildError}{build?.chatId && ` De bestaande v0-chat ${build.chatId} is wel gestart; NIET opnieuw bouwen.`}</p>}
        {build?.previewUrl && <p><a href={build.previewUrl} target="_blank" rel="noreferrer">Open de technische preview</a></p>}
        {build?.webUrl && <p><a href={build.webUrl} target="_blank" rel="noreferrer">Open de v0-build</a></p>}
        {evidenceSaved && build?.chatId && <p><a href={`/regression/adrie/build-status?chatId=${encodeURIComponent(build.chatId)}`}>Controleer dezelfde build met het opgeslagen goedkeuringsdossier</a></p>}
        <p className="quiet">Dit dossier staat voorlopig uitsluitend lokaal in deze browser op lumivey.vercel.app; geen accountbrede of historische opslag. Wis browsergegevens niet voordat de QA is afgerond.</p>
      </div>}
    </>}
  </section></main>;
}
