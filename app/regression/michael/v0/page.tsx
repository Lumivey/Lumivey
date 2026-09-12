"use client";

import { ChangeEvent, FormEvent, useState } from "react";

type PreparedImage = { name: string; dataUrl: string };
type BuildResult = { chatId: string; webUrl?: string; previewUrl?: string };

const MAX_EDGE = 1200;
const MAX_BYTES = 700_000;

function fileToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Bestand kon niet worden gelezen."));
    reader.readAsDataURL(blob);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Afbeelding kon niet worden geopend."));
    };
    image.src = url;
  });
}

async function prepareImage(file: File): Promise<PreparedImage> {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Afbeelding kon niet worden voorbereid.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const makeBlob = (quality: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Afbeelding kon niet worden voorbereid."))), "image/jpeg", quality);
    });

  let blob = await makeBlob(0.78);
  if (blob.size > MAX_BYTES) blob = await makeBlob(0.62);
  if (blob.size > MAX_BYTES) blob = await makeBlob(0.48);
  if (blob.size > MAX_BYTES) throw new Error("Afbeelding blijft te groot voor deze test.");
  return { name: file.name, dataUrl: await fileToDataUrl(blob) };
}

export default function MichaelV0Page() {
  const [preview, setPreview] = useState<PreparedImage | null>(null);
  const [sourcePhoto, setSourcePhoto] = useState<PreparedImage | null>(null);
  const [building, setBuilding] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [build, setBuild] = useState<BuildResult | null>(null);
  const [assetSummary, setAssetSummary] = useState<Array<{ name: string; role?: string; validationStatus?: string }>>([]);

  async function onImage(event: ChangeEvent<HTMLInputElement>, kind: "preview" | "source") {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const prepared = await prepareImage(file);
      if (kind === "preview") setPreview(prepared);
      else setSourcePhoto(prepared);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Afbeelding kon niet worden voorbereid.");
    }
  }

  async function handleBuild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview || !sourcePhoto || building || build) return;

    setBuilding(true);
    setError("");
    setAssetSummary([]);
    setStatus("Lumivey maakt server-side schone productie-assets en stuurt daarna één productiepack naar v0...");

    try {
      const response = await fetch("/api/regression/michael/build-clean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview, sourcePhoto }),
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || `Onverwachte serverrespons (${response.status}).`);
      }

      if (!response.ok) throw new Error(data.error || "Clean productiepack kon niet worden gebouwd.");
      setBuild(data.build as BuildResult);
      setAssetSummary(Array.isArray(data.assetSummary) ? data.assetSummary : []);
      setStatus("GEREED — clean productiepack is naar v0 gestuurd. Open hieronder de v0-build.");
      setTimeout(() => document.getElementById("build-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clean productiepack kon niet worden gebouwd.");
      setStatus("");
    } finally {
      setBuilding(false);
    }
  }

  return (
    <main className="home">
      <section className="intro" style={{ maxWidth: 900 }}>
        <p className="eyebrow">Michael Golden Path — Clean Asset Mapping</p>
        <h1>Preview → schone assets → productiepack → v0</h1>
        <p className="lead">De Preview bepaalt wat visueel nodig is, maar wordt niet in stukken geknipt. Lumivey maakt server-side schone losse productiebeelden zonder ingebakken website-tekst of layout en stuurt die samen met de echte Michael-foto rechtstreeks naar v0.</p>

        <form className="start" onSubmit={handleBuild} style={{ gap: 20 }}>
          <label>
            1. Goedgekeurde Preview
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onImage(e, "preview")} required disabled={Boolean(build)} />
          </label>
          {preview && <p className="quiet">Geladen: {preview.name} — design authority en assetblauwdruk.</p>}

          <label>
            2. Originele foto van Michael met de gele auto
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onImage(e, "source")} required disabled={Boolean(build)} />
          </label>
          {sourcePhoto && <p className="quiet">Geladen: {sourcePhoto.name} — echte primaire hero-asset.</p>}

          <button type="submit" disabled={!preview || !sourcePhoto || building || Boolean(build)}>
            {build ? "GEREED — v0-build staat hieronder" : building ? "Schone assets genereren en v0 bouwen..." : "Maak clean productiepack en bouw website"}
          </button>
        </form>

        <div style={{ marginTop: 28, padding: 18, border: "1px solid #d8d8d2", borderRadius: 16 }}>
          <strong>Deze run levert mee:</strong>
          <p className="quiet">Preview (design authority) · echte Michael-foto · los Porsche/vader-conceptbeeld · los Porsche-detail · losse gele CTA-auto · los detailing-procesbeeld · lichte feiten/functionele vangrail.</p>
          <p className="quiet">Geen enkele productie-asset wordt uit de platte Preview uitgesneden.</p>
        </div>

        {status && <p style={{ marginTop: 20, fontWeight: build ? 700 : 400 }}>{status}</p>}
        {error && <p style={{ marginTop: 20 }}>{error}</p>}

        {build && (
          <div id="build-result" style={{ marginTop: 32, padding: 22, border: "2px solid #171714", borderRadius: 18, scrollMarginTop: 24 }}>
            <h2>GEREED — clean productiepack is naar v0 gestuurd.</h2>
            <p><strong>Chat-id:</strong> {build.chatId}</p>
            {build.webUrl && <p><a href={build.webUrl} target="_blank" rel="noreferrer"><strong>Open v0-build</strong></a></p>}
            {build.previewUrl && <p><a href={build.previewUrl} target="_blank" rel="noreferrer">Open technische preview</a></p>}
            {assetSummary.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <strong>Gegenereerde productie-assets:</strong>
                <ul>
                  {assetSummary.map((asset) => (
                    <li key={asset.name}>{asset.name}{asset.role ? ` — ${asset.role}` : ""}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="quiet">Deze pagina start na succes geen tweede build meer. Herlaad de pagina alleen wanneer je bewust een nieuwe test wilt uitvoeren.</p>
          </div>
        )}
      </section>
    </main>
  );
}
