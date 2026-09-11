"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };
type UnderstandingState = { sources?: unknown[]; [key: string]: unknown };
type SelectedAttachment = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  size: number;
};
type ArtistImpression = {
  id: string;
  imageDataUrl: string;
  headline: string;
  rationale: string[];
  createdAt: string;
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
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Afbeelding kon niet worden voorbereid.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const toJpeg = (quality: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Afbeelding kon niet worden voorbereid."))), "image/jpeg", quality);
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
    throw new Error("Dit bestand is nog te groot voor deze bouwfase. Kies een bestand kleiner dan ongeveer 2,5 MB.");
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
  const [previewLoading, setPreviewLoading] = useState(false);
  const [impression, setImpression] = useState<ArtistImpression | null>(null);
  const [approved, setApproved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAttachmentError("");
    try {
      setAttachment(await prepareAttachment(file));
    } catch (error) {
      setAttachment(null);
      setAttachmentError(error instanceof Error ? error.message : "Bestand kon niet worden toegevoegd.");
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
    const nextMessages = [...messages, { role: "user" as const, content: userContent }];

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
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
      setUnderstanding(data.understanding);
      clearAttachment();
    } catch (error) {
      console.error(error);
      setMessages([...nextMessages, { role: "assistant", content: "Er ging iets mis. Probeer het nog eens." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handlePreview() {
    if (!understanding || previewLoading) return;
    setPreviewLoading(true);
    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ understanding }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Preview kon niet worden gemaakt.");
      setImpression(data.impression);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Preview kon niet worden gemaakt.");
    } finally {
      setPreviewLoading(false);
    }
  }

  function approveImpression() {
    if (!impression) return;
    localStorage.setItem("lumivey-approved-impression", JSON.stringify(impression));
    localStorage.setItem("lumivey-understanding", JSON.stringify(understanding));
    setApproved(true);
  }

  if (approved) {
    return (
      <main className="home">
        <section className="intro" style={{ maxWidth: 760 }}>
          <p className="eyebrow">Lumivey</p>
          <h1>Mooi. Dan gaan we hem echt maken.</h1>
          <p className="lead">
            De richting staat. Vanaf hier bewaren we de case als echte klantcase, verifiëren we wat al uit gesprek, website en assets bekend is en vullen we alleen aan wat nog ontbreekt.
          </p>
          <div className="preview-actions">
            <button disabled>Account aanmaken — volgende bouwstap</button>
          </div>
          <p className="quiet">Pas na account, verificatie en Build Readiness gaat de echte website naar de productiemotor.</p>
        </section>
      </main>
    );
  }

  if (impression) {
    return (
      <main className="home">
        <section className="intro" style={{ maxWidth: 980 }}>
          <p className="eyebrow">Eerste impressie</p>
          <h1>{impression.headline || "Dit is wat ik voor me zie."}</h1>
          <p className="lead">Geen definitieve website. Wel mijn beeld van wat ik tot nu toe van je bedrijf heb begrepen.</p>

          <div style={{ margin: "32px auto", maxWidth: 780 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={impression.imageDataUrl}
              alt="Lumivey artist impression"
              style={{ width: "100%", height: "auto", borderRadius: 20, display: "block", boxShadow: "0 20px 70px rgba(0,0,0,.12)" }}
            />
          </div>

          <div className="preview-buttons" style={{ justifyContent: "center" }}>
            <button onClick={approveImpression}>Deze klopt — ga door</button>
            <button onClick={() => setImpression(null)}>Dit wil ik aanpassen</button>
          </div>

          <p className="quiet">De vraag is niet of elk detail af is. De vraag is: heb ik je goed begrepen?</p>
        </section>
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
            <p className="lead">Je hoeft nog niet te weten hoe je website eruit moet zien. Begin gewoon bij je bedrijf.</p>
          </>
        ) : (
          <div className="conversation">
            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "message user-message" : "message assistant-message"}>
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

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              aria-label="Bestand toevoegen"
              title="Bestand toevoegen"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              style={{ width: 38, height: 38, padding: 0, borderRadius: 999, fontSize: 24, lineHeight: 1 }}
            >
              +
            </button>
            {attachment && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span>{attachment.name}</span>
                <button type="button" aria-label="Bestand verwijderen" onClick={clearAttachment} disabled={loading} style={{ padding: 0, background: "transparent", color: "inherit", border: 0, fontSize: 18 }}>×</button>
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
              {previewLoading ? "Even kijken wat past..." : "Laat iets zien"}
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
