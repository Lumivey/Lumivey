"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import type { ArtistImpression, WebsiteAsset, WebsiteBrief } from "@/lib/lumivey/primary-flow";
import type { LumiveyUnderstanding } from "@/lib/lumivey/understanding";

type PreparedImage = {
  name: string;
  dataUrl: string;
};

type BuildResult = {
  chatId: string;
  webUrl?: string;
  previewUrl?: string;
};

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

function loadDataUrlImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Preview kon niet worden verwerkt voor Asset Mapping."));
    image.src = dataUrl;
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

async function cropPreview(
  dataUrl: string,
  crop: { x: number; y: number; width: number; height: number },
  name: string
): Promise<PreparedImage> {
  const image = await loadDataUrlImage(dataUrl);
  const sx = Math.round(image.naturalWidth * crop.x);
  const sy = Math.round(image.naturalHeight * crop.y);
  const sw = Math.max(1, Math.round(image.naturalWidth * crop.width));
  const sh = Math.max(1, Math.round(image.naturalHeight * crop.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(1200, sw);
  canvas.height = Math.max(1, Math.round((sh / sw) * canvas.width));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Preview-asset kon niet worden uitgesneden.");
  context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return { name, dataUrl: canvas.toDataURL("image/jpeg", 0.9) };
}

async function buildPreviewAssetPack(previewDataUrl: string): Promise<WebsiteAsset[]> {
  const [storyPhoto, porscheDetail, signature, ctaCar] = await Promise.all([
    cropPreview(previewDataUrl, { x: 0.0, y: 0.565, width: 0.42, height: 0.19 }, "preview-porsche-vader.jpg"),
    cropPreview(previewDataUrl, { x: 0.73, y: 0.56, width: 0.27, height: 0.2 }, "preview-porsche-detail.jpg"),
    cropPreview(previewDataUrl, { x: 0.42, y: 0.705, width: 0.39, height: 0.085 }, "preview-signature.jpg"),
    cropPreview(previewDataUrl, { x: 0.0, y: 0.775, width: 0.6, height: 0.225 }, "preview-yellow-car-cta.jpg"),
  ]);

  return [
    {
      name: storyPhoto.name,
      kind: "image",
      dataUrl: storyPhoto.dataUrl,
      purpose: "supporting",
      aiStatus: "artist-interpretation",
      origin: "preview-derived",
      validationStatus: "replace-with-real-if-available",
      role: "Porsche 356 oorsprongsverhaal — vader/zoon beeld",
      source: "Rechtstreeks uitgesneden uit de door de klant goedgekeurde Preview.",
      productionInstruction: "Gebruik dit beeld voor het emotionele oorsprongsverhaal. Vraag vóór definitieve livegang of Michael een echte oude foto heeft; die mag door AI worden hersteld en in dezelfde stijl gebracht. Als hij deze artistieke interpretatie goed vindt, mag die blijven.",
    },
    {
      name: porscheDetail.name,
      kind: "image",
      dataUrl: porscheDetail.dataUrl,
      purpose: "supporting",
      aiStatus: "artist-interpretation",
      origin: "preview-derived",
      validationStatus: "approved",
      role: "Porsche 356 detail / textuur",
      source: "Rechtstreeks uitgesneden uit de goedgekeurde Preview.",
      productionInstruction: "Gebruik als kleine visuele detaildrager naast het oorsprongsverhaal; niet als hoofdbeeld van de site.",
    },
    {
      name: signature.name,
      kind: "image",
      dataUrl: signature.dataUrl,
      purpose: "supporting",
      aiStatus: "artist-interpretation",
      origin: "preview-derived",
      validationStatus: "needs-owner-validation",
      role: "Grafische Michael-signature",
      source: "Rechtstreeks uitgesneden uit de goedgekeurde Preview.",
      productionInstruction: "Gebruik als grafisch stijlelement. Voor livegang Michael laten kiezen: deze artistieke signature behouden, echte handtekening aanleveren of typografisch vervangen.",
    },
    {
      name: ctaCar.name,
      kind: "image",
      dataUrl: ctaCar.dataUrl,
      purpose: "supporting",
      aiStatus: "artist-interpretation",
      origin: "preview-derived",
      validationStatus: "approved",
      role: "Gele sportwagen / CTA-visuele climax",
      source: "Rechtstreeks uitgesneden uit de goedgekeurde Preview.",
      productionInstruction: "Gebruik als rijke beeldlaag richting de afsluitende CTA. Behoud de warme gele lak, glans en premium sfeer uit de Preview.",
    },
  ];
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

    try {
      const previewAssets = await buildPreviewAssetPack(preview.dataUrl);
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
        productionInstruction: "Gebruik als primaire menselijke productie-asset en als bron voor geel/goud, licht en sfeer. Vervang Michael niet door een gegenereerde persoon.",
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
        assets: [realHeroAsset, ...previewAssets],
        pages: [
          { name: "Home", purpose: "De goedgekeurde Preview als werkende responsive homepage realiseren", knownContent: ["Michael", "Werkwijze", "Diensten", "Porsche 356 oorsprongsverhaal", "Contact"] },
          { name: "Over Michael", purpose: "Persoonlijke achtergrond en oorsprong", knownContent: ["Porsche 356 van zijn vader als ondersteunend verhaal"] },
          { name: "Diensten", purpose: "Detailingdiensten uitleggen", knownContent: ["Reinigen", "Kleien", "Polijsten", "Beschermen", "Wetlook-afwerking"] },
          { name: "Contact", purpose: "Kennismaking en aanvraag", knownContent: [] },
        ],
        functionalRequirements: ["Responsive desktop en mobiel", "Contactmogelijkheid", "Sterke beeldgedreven homepage"],
        constraints: [
          "De Preview is de design authority; de brief is alleen vangrail voor feiten, functies en assetbetekenis.",
          "Gebruik de meegeleverde Asset Mapping zodat zichtbare Preview-elementen niet door generieke lege vlakken worden vervangen.",
          "Gebruik de echte foto van Michael als primaire menselijke bron.",
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "v0-build kon niet worden gestart.");
    } finally {
      setBuilding(false);
    }
  }

  return (
    <main className="home">
      <section className="intro" style={{ maxWidth: 900 }}>
        <p className="eyebrow">Michael Golden Path — Asset Mapping</p>
        <h1>Preview → productiepack → v0</h1>
        <p className="lead">Deze test maakt van de goedgekeurde Preview niet alleen een designreferentie, maar ook een assetblauwdruk. De echte foto van Michael gaat mee én betekenisvolle Preview-beelden worden automatisch als losse productie-assets aan v0 geleverd.</p>

        <form className="start" onSubmit={handleBuild} style={{ gap: 20 }}>
          <label>
            1. Goedgekeurde Preview
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onImage(e, "preview")} required />
          </label>
          {preview && <p className="quiet">Geladen: {preview.name} — hieruit worden Porsche-verhaal, signature en CTA-beeld automatisch gemapt.</p>}

          <label>
            2. Originele foto van Michael met de gele auto
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onImage(e, "source")} required />
          </label>
          {sourcePhoto && <p className="quiet">Geladen: {sourcePhoto.name} — echte primaire hero-asset.</p>}

          <button type="submit" disabled={!preview || !sourcePhoto || building}>
            {building ? "Productiepack maken en naar v0 sturen..." : "Maak productiepack en bouw website"}
          </button>
        </form>

        <div style={{ marginTop: 28, padding: 18, border: "1px solid #d8d8d2", borderRadius: 16 }}>
          <strong>Deze test levert automatisch mee:</strong>
          <p className="quiet">Preview (design authority) · echte Michael-foto · Porsche/vader-beeld uit Preview · Porsche-detail · signature · gele CTA-auto · lichte feiten/functionele vangrail.</p>
        </div>

        {error && <p style={{ marginTop: 20 }}>{error}</p>}

        {build && (
          <div style={{ marginTop: 32, padding: 22, border: "1px solid #d8d8d2", borderRadius: 18 }}>
            <h2>Productiepack is naar v0 gestuurd.</h2>
            <p><strong>Chat-id:</strong> {build.chatId}</p>
            {build.previewUrl && <p><a href={build.previewUrl} target="_blank" rel="noreferrer">Open technische preview</a></p>}
            {build.webUrl && <p><a href={build.webUrl} target="_blank" rel="noreferrer">Open v0-build</a></p>}
            <p className="quiet">Nu beoordelen we of v0 met dezelfde Preview maar een rijker productiepack dichter bij het goedgekeurde WoW-beeld komt.</p>
          </div>
        )}
      </section>
    </main>
  );
}
