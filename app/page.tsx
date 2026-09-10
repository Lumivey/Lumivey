"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useRef,
  useState,
} from "react";

import RecognitionPreview from "@/app/components/RecognitionPreview";
import type { GeneratedImages } from "@/app/components/WarmCraftPreview";
import type { PreviewComposition } from "@/lib/lumivey/preview-composition";
import { storeImage } from "@/lib/lumivey/image-store";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type UnderstandingState = {
  sources?: unknown[];
  [key: string]: unknown;
};

type SelectedAttachment = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  size: number;
};

type SiteDescription = {
  title: string;
  subtitle: string;
  intro: string;
  storyTitle?: string;
  story?: string;
  servicesTitle?: string;
  services: string[];
  contactTitle: string;
  contactText: string;
  visualDirection: {
    mood: string;
    tone: string;
  };
};

type ArtDirection = {
  personality: string[];
  visualMood: string;
  layoutStyle: string;
  heroStyle: string;
  imageStyle: string;
  colorDirection: string;
  typographyDirection: string;
  sectionRhythm: string;
  emphasis: string[];
  avoid: string[];
};

type LayoutVariant =
  | "quiet-editorial"
  | "warm-craft"
  | "clean-professional";

type ImageBriefItem = {
  purpose: string;
  subject: string;
  setting: string;
  composition: string;
  atmosphere: string;
  avoid: string[];
};

type ImageBrief = {
  hero: ImageBriefItem;
  story: ImageBriefItem;
  detail: ImageBriefItem;
};

type PreviewReadiness = {
  ready: boolean;
  confidence: "low" | "medium" | "high";
  reason: string;
  strongSignals: string[];
  missingForRecognition: string[];
};

type ApprovedSitePackage = {
  site: SiteDescription;
  layoutVariant: LayoutVariant | null;
  artDirection: ArtDirection | null;
  imageBrief: ImageBrief | null;
  images: {
    heroKey: string | null;
    storyKey: string | null;
    detailKey: string | null;
  };
};

const emptyGeneratedImages: GeneratedImages = {
  heroImage: null,
  storyImage: null,
  detailImage: null,
};

const MAX_DIRECT_FILE_BYTES = 2_500_000;
const MAX_IMAGE_EDGE = 1800;

function blobToDataUrl(blob: Blob): Promise<string> {
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
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Afbeelding kon niet worden geopend."));
    };

    image.src = objectUrl;
  });
}

async function compressImage(file: File): Promise<Blob> {
  const image = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight)
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Afbeelding kon niet worden voorbereid.");

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const toJpeg = (quality: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Afbeelding kon niet worden voorbereid.")),
        "image/jpeg",
        quality
      );
    });

  let blob = await toJpeg(0.84);
  if (blob.size > MAX_DIRECT_FILE_BYTES) blob = await toJpeg(0.68);
  return blob;
}

async function prepareAttachment(file: File): Promise<SelectedAttachment> {
  const isImage = file.type.startsWith("image/");
  let uploadBlob: Blob = file;
  let mimeType = file.type || "application/octet-stream";

  if (isImage && file.size > MAX_DIRECT_FILE_BYTES) {
    uploadBlob = await compressImage(file);
    mimeType = "image/jpeg";
  }

  if (uploadBlob.size > MAX_DIRECT_FILE_BYTES) {
    throw new Error(
      "Dit bestand is nog te groot voor deze bouwfase. Kies een bestand kleiner dan ongeveer 2,5 MB."
    );
  }

  return {
    id: `${Date.now()}-${file.name}-${file.size}`,
    name: file.name,
    mimeType,
    dataUrl: await blobToDataUrl(uploadBlob),
    size: uploadBlob.size,
  };
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [understanding, setUnderstanding] = useState<UnderstandingState | null>(null);
  const [attachment, setAttachment] = useState<SelectedAttachment | null>(null);
  const [attachmentError, setAttachmentError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [site, setSite] = useState<SiteDescription | null>(null);
  const [composition, setComposition] = useState<PreviewComposition | null>(null);
  const [readiness, setReadiness] = useState<PreviewReadiness | null>(null);
  const [artDirection, setArtDirection] = useState<ArtDirection | null>(null);
  const [layoutVariant, setLayoutVariant] = useState<LayoutVariant | null>(null);
  const [imageBrief, setImageBrief] = useState<ImageBrief | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImages>(emptyGeneratedImages);
  const [approveLoading, setApproveLoading] = useState(false);

  const handleImagesChange = useCallback((images: GeneratedImages) => {
    setGeneratedImages(images);
  }, []);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAttachmentError("");
    try {
      setAttachment(await prepareAttachment(file));
    } catch (error) {
      setAttachment(null);
      setAttachmentError(
        error instanceof Error ? error.message : "Bestand kon niet worden toegevoegd."
      );
    }
  }

  function clearAttachment() {
    setAttachment(null);
    setAttachmentError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if ((!trimmed && !attachment) || loading) return;

    const userContent = attachment
      ? `${trimmed || "Ik deel hierbij een bestand."}\n\nBijlage: ${attachment.name}`
      : trimmed;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userContent },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          sourceContexts: understanding?.sources ?? [],
          attachment,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Er ging iets mis.");

      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.reply },
      ]);
      setUnderstanding(data.understanding);
      clearAttachment();
    } catch (error) {
      console.error(error);
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Er ging iets mis. Probeer het nog eens." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handlePreview() {
    if (!understanding || previewLoading) return;

    setPreviewLoading(true);
    setGeneratedImages(emptyGeneratedImages);

    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ understanding }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Preview kon niet worden gemaakt.");
      }

      setReadiness(data.readiness ?? null);
      setComposition(data.composition ?? null);
      setSite(data.site);
      setArtDirection(data.artDirection);
      setLayoutVariant(data.layoutVariant);
      setImageBrief(data.imageBrief);
    } catch (error) {
      console.error(error);
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleBackToConversation() {
    setComposition(null);
    setSite(null);
    setInput("");
  }

  async function handleApprove() {
    if (!site || approveLoading) return;
    setApproveLoading(true);

    try {
      const heroKey = generatedImages.heroImage ? "lumivey-approved-hero" : null;
      const storyKey = generatedImages.storyImage ? "lumivey-approved-story" : null;
      const detailKey = generatedImages.detailImage ? "lumivey-approved-detail" : null;

      if (heroKey && generatedImages.heroImage) {
        await storeImage(heroKey, generatedImages.heroImage);
      }
      if (storyKey && generatedImages.storyImage) {
        await storeImage(storyKey, generatedImages.storyImage);
      }
      if (detailKey && generatedImages.detailImage) {
        await storeImage(detailKey, generatedImages.detailImage);
      }

      const approvedPackage: ApprovedSitePackage = {
        site,
        layoutVariant,
        artDirection,
        imageBrief,
        images: { heroKey, storyKey, detailKey },
      };

      localStorage.setItem(
        "lumivey-approved-package",
        JSON.stringify(approvedPackage)
      );
      window.location.href = "/site";
    } catch (error) {
      console.error("Goedkeuren mislukt:", error);
      alert("De goedgekeurde versie kon niet worden opgeslagen.");
    } finally {
      setApproveLoading(false);
    }
  }

  function renderPreviewMeta() {
    return (
      <section className="preview-section preview-meta">
        {readiness && (
          <details className="understanding">
            <summary>
              Preview readiness: {readiness.ready ? "ready" : "nog niet ready"}
            </summary>
            <pre>{JSON.stringify(readiness, null, 2)}</pre>
          </details>
        )}

        {composition && (
          <details className="understanding">
            <summary>Recognition composition</summary>
            <pre>{JSON.stringify(composition, null, 2)}</pre>
          </details>
        )}

        {artDirection && (
          <details className="understanding">
            <summary>Art direction</summary>
            <pre>{JSON.stringify(artDirection, null, 2)}</pre>
          </details>
        )}

        {imageBrief && (
          <details className="understanding">
            <summary>Image brief</summary>
            <pre>{JSON.stringify(imageBrief, null, 2)}</pre>
          </details>
        )}

        <div className="preview-buttons">
          <button onClick={handleApprove} disabled={approveLoading}>
            {approveLoading ? "Even opslaan..." : "Deze klopt"}
          </button>
          <button onClick={handleBackToConversation} disabled={approveLoading}>
            Dit wil ik aanpassen
          </button>
        </div>
      </section>
    );
  }

  if (composition) {
    return (
      <main className="recognition-preview-shell">
        <RecognitionPreview
          composition={composition}
          imageBrief={imageBrief}
          onImagesChange={handleImagesChange}
        />
        {renderPreviewMeta()}
      </main>
    );
  }

  return (
    <main className="home">
      <section className="intro">
        <p className="eyebrow">Lumivey</p>

        {messages.length === 0 ? (
          <>
            <h1>Vertel eens.</h1>
            <p className="lead">
              Je hoeft nog niet te weten hoe je website eruit moet zien. Begin gewoon bij je bedrijf.
            </p>
          </>
        ) : (
          <div className="conversation">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "message user-message"
                    : "message assistant-message"
                }
              >
                {message.content}
              </div>
            ))}
            {loading && <div className="message assistant-message">Even denken...</div>}
          </div>
        )}

        <form className="start" onSubmit={handleSubmit}>
          <textarea
            name="message"
            aria-label="Vertel verder"
            placeholder={messages.length === 0 ? "Ik ben..." : "Vertel verder..."}
            rows={4}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.txt,.md"
            onChange={handleFileChange}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              aria-label="Bestand toevoegen"
              title="Bestand toevoegen"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              style={{ width: "38px", height: "38px", padding: 0, borderRadius: "999px", fontSize: "24px", lineHeight: 1 }}
            >
              +
            </button>

            {attachment && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span>{attachment.name}</span>
                <button
                  type="button"
                  aria-label="Bestand verwijderen"
                  onClick={clearAttachment}
                  disabled={loading}
                  style={{ padding: 0, background: "transparent", color: "inherit", border: 0, fontSize: "18px" }}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {attachmentError && <p className="quiet">{attachmentError}</p>}

          <button type="submit" disabled={loading || (!input.trim() && !attachment)}>
            {loading ? "Even denken..." : "Verder"}
          </button>
        </form>

        {understanding && (
          <div className="preview-actions">
            <button onClick={handlePreview} disabled={previewLoading}>
              {previewLoading ? "Even maken..." : "Laat iets zien"}
            </button>

            <details className="understanding">
              <summary>Intern begrip</summary>
              <pre>{JSON.stringify(understanding, null, 2)}</pre>
            </details>
          </div>
        )}

        <p className="quiet">Keep it simple. Keep it human.</p>
      </section>
    </main>
  );
}
