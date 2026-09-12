"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import type { ArtistImpression, WebsiteAsset, WebsiteBrief } from "@/lib/lumivey/primary-flow";
import type { LumiveyUnderstanding } from "@/lib/lumivey/understanding";

type PreparedImage = { name: string; dataUrl: string };
type BuildResult = { chatId: string; webUrl?: string; previewUrl?: string };

const MAX_EDGE = 1800;
const MAX_BYTES = 1_600_000;

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

  let blob = await makeBlob(0.82);
  if (blob.size > MAX_BYTES) blob = await makeBlob(0.66);
  if (blob.size > MAX_BYTES) blob = await makeBlob(0.5);
  if (blob.size > MAX_BYTES) throw new Error("Afbeelding blijft te groot voor deze test.");
  return { name: file.name, dataUrl: await fileToDataUrl(blob) };
}

const understanding: LumiveyUnderstanding = {
  entrepreneur: { name: "Michael", profession: "High-end car detailer" },
  identity: {
    motivation: ["Wil als student bijverdienen met werk waar zijn fascinatie voor bijzondere auto's in terugkomt."],
    craftsmanship: [
      "Kiest bewust voor zorgvuldig reinigen, kleien, polijsten en beschermen in plaats van snelle wasstraatbehandeling.",
      "Let op swirls, lakbehoud, glans en afwerking.",
    ],
    story: ["Zijn fascinatie voor bijzondere auto's begon bij de oude Porsche 356 van zijn vader."],
    recognitionAnchors: [
      "Michael zelf, geconcentreerd werkend aan de lak van een gele sportwagen.",
      "Donkere premium sfeer met geel/goud als accent uit de aangeleverde foto.",
      "Porsche 356 als ondersteunend oorsprongsverhaal, niet als hoofdonderwerp.",
    ],
  },
  humanSignals: [{
    signal: "Michael reageert fel op wasstraten en swirls; voor hem gaat detailing om behoud en respect voor lak, niet alleen schoonmaken.",
    evidence: "‘Haha een wasstraat? Daar krijg je alleen maar swirls van in je lak. Nooit doen!’",
    confidence: "high",
    previewRelevance: "high",
  }],
  business: {
    services: ["Reinigen", "Kleien", "Polijsten", "Beschermen", "Wetlook-afwerking"],
    audience: ["Eigenaren van luxe auto's en sportwagens", "Topsegment"],
    importantNeeds: ["Klanten vinden voor high-end detailing"],
  },
  website: {
    purpose: ["Nieuwe klanten laten zien dat Michael zorgvuldig en op topsegmentniveau werkt", "Contact mogelijk maken"],
    desiredFeeling: ["Premium", "Precies", "Persoonlijk", "Rustig en zelfverzekerd"],
    usefulContent: ["Werkwijze", "Diensten", "Verhaal achter de Porsche 356", "Contact"],
  },
  sourceBacked: { businessNames: [], professions: [], locations: [], services: [], contactDetails: [], visualAnchors: [] },
  facts: [
    "Michael is student en wil bijverdienen.",
    "Hij wil luxe auto's en sportwagens detailen in het topsegment.",
    "Hij gebruikt Meguiar's producten.",
    "Hij noemt reinigen, kleien, polijsten, harde wax en optioneel wetlook.",
    "Zijn fascinatie begon bij de oude Porsche 356 van zijn vader.",
    "Hij vermijdt wasstraten vanwege swirls in de lak.",
  ],
  interpretations: ["De visuele richting mag precisie, lakbehoud en respect voor bijzondere auto's sterker maken dan algemene luxe-clichés."],
  unknowns: [],
  sources: [],
};

export default function MichaelV0Page() {
  const [preview, setPreview] = useState<PreparedImage | null>(null);
  const [sourcePhoto, setSourcePhoto] = useState<PreparedImage | null>(null);
  const [building, setBuilding] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [build, setBuild] = useState<BuildResult | null>(null);

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
    if (!preview || !sourcePhoto || building) return;

    setBuilding(true);
    setError("");
    setBuild(null);
    setStatus("Schone productie-assets genereren uit de goedgekeurde Preview...");

    try {
      const assetResponse = await fetch("/api/regression/michael/production-assets", { method: "POST" });
      const assetData = await assetResponse.json();
      if (!assetResponse.ok) throw new Error(assetData.error || "Schone productie-assets konden niet worden gemaakt.");
      const generatedAssets = assetData.assets as WebsiteAsset[];

      setStatus("Productiepack samenstellen en naar v0 sturen...");

      const impression: ArtistImpression = {
        id: "michael-approved-preview-2026-09-12",
        imageDataUrl: preview.dataUrl,
        headline: "Michael — High-End Detailing",
        rationale: [
          "Michael zelf is de primaire herkenningsdrager.",
          "Geel/goud uit de echte bronfoto bepaalt de accentkleur.",
          "Topsegment detailing is het hoofdverhaal.",
          "Porsche 356 blijft ondersteunend als oorsprongsverhaal.",
          "De pagina voelt als één ontworpen geheel, niet als een stapel blokken.",
        ],
        createdAt: new Date().toISOString(),
      };

      const realHeroAsset: WebsiteAsset = {
        name: sourcePhoto.name || "Michael bronfoto",
        kind: "image",
        dataUrl: sourcePhoto.dataUrl,
        purpose: "primary",
        aiStatus: "real",
        origin: "customer",
        validationStatus: "approved",
        role: "Primaire hero en herkenningsanker — Michael werkend aan gele auto",
        source: "Echte aangeleverde foto van Michael werkend aan de gele auto.",
        productionInstruction: "Gebruik als primaire menselijke productie-asset en bron voor geel/goud, licht en sfeer. Vervang Michael niet door een gegenereerde persoon.",
      };

      const brief: WebsiteBrief = {
        version: 1,
        understanding,
        artistImpression: impression,
        facts: [
          { key: "entrepreneur.name", value: "Michael", status: "confirmed", source: "Golden Path reference" },
          { key: "business.positioning", value: "High-end detailing voor luxe auto's en sportwagens", status: "confirmed", source: "Golden Path reference" },
          { key: "business.origin", value: "Fascinatie begon bij de Porsche 356 van zijn vader", status: "confirmed", source: "Golden Path reference" },
          { key: "business.products", value: "Meguiar's", status: "confirmed", source: "Golden Path reference" },
        ],
        assets: [realHeroAsset, ...generatedAssets],
        pages: [
          { name: "Home", purpose: "De goedgekeurde Preview als werkende responsive homepage realiseren", knownContent: ["Michael", "Werkwijze", "Diensten", "Porsche 356 oorsprongsverhaal", "Contact"] },
          { name: "Over Michael", purpose: "Persoonlijke achtergrond en oorsprong", knownContent: ["Porsche 356 van zijn vader als ondersteunend verhaal"] },
          { name: "Diensten", purpose: "Detailingdiensten uitleggen", knownContent: ["Reinigen", "Kleien", "Polijsten", "Beschermen", "Wetlook-afwerking"] },
          { name: "Contact", purpose: "Kennismaking en aanvraag", knownContent: [] },
        ],
        functionalRequirements: ["Responsive desktop en mobiel", "Contactmogelijkheid", "Sterke beeldgedreven homepage"],
        constraints: [
          "De Preview is de design authority; de brief is alleen vangrail voor feiten, functies en assetbetekenis.",
          "Gebruik uitsluitend schone productie-assets; gebruik geen uitsneden van de Preview als achtergrond- of contentbeeld.",
          "Gebruik de echte foto van Michael als primaire menselijke bron.",
          "Gebruik gegenereerde assets om de visuele rijkdom van de goedgekeurde Preview te realiseren zonder UI/tekst uit de Preview in beelden te bakken.",
          "Verzin geen contactgegevens, adres, openingstijden, prijzen, certificeringen of andere niet-bevestigde feiten.",
          "Persoonlijke artistieke elementen mogen creatief blijven zolang hun validatiestatus wordt gerespecteerd.",
        ],
        unknowns: [],
      };

      const response = await fetch("/api/build/v0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "v0-build kon niet worden gestart.");
      setBuild(data.build as BuildResult);
      setStatus("Productiepack verstuurd.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "v0-build kon niet worden gestart.");
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
        <p className="lead">De Preview bepaalt wat visueel nodig is, maar wordt niet meer in stukken geknipt. Lumivey maakt schone losse productiebeelden zonder ingebakken website-tekst of layout en levert die samen met de echte Michael-foto aan v0.</p>

        <form className="start" onSubmit={handleBuild} style={{ gap: 20 }}>
          <label>
            1. Goedgekeurde Preview
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onImage(e, "preview")} required />
          </label>
          {preview && <p className="quiet">Geladen: {preview.name} — design authority en assetblauwdruk.</p>}

          <label>
            2. Originele foto van Michael met de gele auto
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onImage(e, "source")} required />
          </label>
          {sourcePhoto && <p className="quiet">Geladen: {sourcePhoto.name} — echte primaire hero-asset.</p>}

          <button type="submit" disabled={!preview || !sourcePhoto || building}>
            {building ? "Schone productie-assets maken en bouwen..." : "Maak clean productiepack en bouw website"}
          </button>
        </form>

        <div style={{ marginTop: 28, padding: 18, border: "1px solid #d8d8d2", borderRadius: 16 }}>
          <strong>Deze run levert mee:</strong>
          <p className="quiet">Preview (design authority) · echte Michael-foto · los Porsche/vader-conceptbeeld · los Porsche-detail · losse gele CTA-auto · los detailing-procesbeeld · lichte feiten/functionele vangrail.</p>
          <p className="quiet">Geen enkele productie-asset wordt nog uit de platte Preview uitgesneden.</p>
        </div>

        {status && <p style={{ marginTop: 20 }}>{status}</p>}
        {error && <p style={{ marginTop: 20 }}>{error}</p>}

        {build && (
          <div style={{ marginTop: 32, padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
            <h2>Clean productiepack is naar v0 gestuurd.</h2>
            <p><strong>Chat-id:</strong> {build.chatId}</p>
            {build.previewUrl && <p><a href={build.previewUrl} target="_blank" rel="noreferrer">Open technische preview</a></p>}
            {build.webUrl && <p><a href={build.webUrl} target="_blank" rel="noreferrer">Open v0-build</a></p>}
            <p className="quiet">Nu toetsen we of v0 de WoW-rijkdom behoudt zonder tekst/layout dubbel in gegenereerde beeldlagen te krijgen.</p>
          </div>
        )}
      </section>
    </main>
  );
}
