"use client";

import {
  FormEvent,
  useCallback,
  useState,
} from "react";

import CleanProfessionalPreview from "@/app/components/CleanProfessionalPreview";
import WarmCraftPreview, {
  GeneratedImages,
} from "@/app/components/WarmCraftPreview";

import { storeImage } from "@/lib/lumivey/image-store";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type UnderstandingState = {
  sources?: unknown[];
  [key: string]: unknown;
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

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const [understanding, setUnderstanding] =
    useState<UnderstandingState | null>(null);

  const [previewLoading, setPreviewLoading] =
    useState(false);

  const [site, setSite] =
    useState<SiteDescription | null>(null);

  const [artDirection, setArtDirection] =
    useState<ArtDirection | null>(null);

  const [layoutVariant, setLayoutVariant] =
    useState<LayoutVariant | null>(null);

  const [imageBrief, setImageBrief] =
    useState<ImageBrief | null>(null);

  const [generatedImages, setGeneratedImages] =
    useState<GeneratedImages>(emptyGeneratedImages);

  const [approveLoading, setApproveLoading] =
    useState(false);

  const handleImagesChange = useCallback(
    (images: GeneratedImages) => {
      setGeneratedImages(images);
    },
    []
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmed = input.trim();

    if (!trimmed || loading) {
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: trimmed,
      },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
          sourceContexts: understanding?.sources ?? [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Er ging iets mis."
        );
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);

      setUnderstanding(data.understanding);
    } catch (error) {
      console.error(error);

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "Er ging iets mis. Probeer het nog eens.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handlePreview() {
    if (!understanding || previewLoading) {
      return;
    }

    setPreviewLoading(true);
    setGeneratedImages(emptyGeneratedImages);

    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          understanding,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Preview kon niet worden gemaakt."
        );
      }

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
    setSite(null);
    setInput("");
  }

  async function handleApprove() {
    if (!site || approveLoading) {
      return;
    }

    setApproveLoading(true);

    try {
      const heroKey = generatedImages.heroImage
        ? "lumivey-approved-hero"
        : null;

      const storyKey = generatedImages.storyImage
        ? "lumivey-approved-story"
        : null;

      const detailKey = generatedImages.detailImage
        ? "lumivey-approved-detail"
        : null;

      if (heroKey && generatedImages.heroImage) {
        await storeImage(
          heroKey,
          generatedImages.heroImage
        );
      }

      if (storyKey && generatedImages.storyImage) {
        await storeImage(
          storyKey,
          generatedImages.storyImage
        );
      }

      if (detailKey && generatedImages.detailImage) {
        await storeImage(
          detailKey,
          generatedImages.detailImage
        );
      }

      const approvedPackage: ApprovedSitePackage = {
        site,
        layoutVariant,
        artDirection,
        imageBrief,
        images: {
          heroKey,
          storyKey,
          detailKey,
        },
      };

      localStorage.setItem(
        "lumivey-approved-package",
        JSON.stringify(approvedPackage)
      );

      window.location.href = "/site";
    } catch (error) {
      console.error(
        "Goedkeuren mislukt:",
        error
      );

      alert(
        "De goedgekeurde versie kon niet worden opgeslagen."
      );
    } finally {
      setApproveLoading(false);
    }
  }

  function countGeneratedImages() {
    return [
      generatedImages.heroImage,
      generatedImages.storyImage,
      generatedImages.detailImage,
    ].filter(Boolean).length;
  }

  function renderPreviewMeta() {
    return (
      <section className="preview-section preview-meta">
        {layoutVariant && (
          <p>
            Gekozen layout:{" "}
            <strong>{layoutVariant}</strong>
          </p>
        )}

        {(layoutVariant === "warm-craft" ||
          layoutVariant === "clean-professional") && (
          <p>
            Gegenereerde beelden:{" "}
            <strong>
              {countGeneratedImages()} / 3
            </strong>
          </p>
        )}

        {artDirection && (
          <details className="understanding">
            <summary>Art direction</summary>

            <pre>
              {JSON.stringify(
                artDirection,
                null,
                2
              )}
            </pre>
          </details>
        )}

        {imageBrief && (
          <details className="understanding">
            <summary>Image brief</summary>

            <pre>
              {JSON.stringify(
                imageBrief,
                null,
                2
              )}
            </pre>
          </details>
        )}

        <div className="preview-buttons">
          <button
            onClick={handleApprove}
            disabled={approveLoading}
          >
            {approveLoading
              ? "Even opslaan..."
              : "Deze klopt"}
          </button>

          <button
            onClick={handleBackToConversation}
            disabled={approveLoading}
          >
            Dit wil ik aanpassen
          </button>
        </div>
      </section>
    );
  }

  if (site) {
    if (layoutVariant === "warm-craft") {
      return (
        <main className="preview-page layout-warm-craft">
          <WarmCraftPreview
            site={site}
            imageBrief={imageBrief}
            onImagesChange={handleImagesChange}
          />

          {renderPreviewMeta()}
        </main>
      );
    }

    if (layoutVariant === "clean-professional") {
      return (
        <main className="preview-page layout-clean-professional">
          <CleanProfessionalPreview
            site={site}
            imageBrief={imageBrief}
            onImagesChange={handleImagesChange}
          />

          {renderPreviewMeta()}
        </main>
      );
    }

    const layoutClass = layoutVariant
      ? `layout-${layoutVariant}`
      : "";

    return (
      <main
        className={`preview-page ${layoutClass}`}
      >
        <section className="preview-hero">
          <p className="eyebrow">
            Preview
          </p>

          <h1>{site.title}</h1>

          {site.subtitle && (
            <p className="preview-subtitle">
              {site.subtitle}
            </p>
          )}
        </section>

        {site.intro && (
          <section className="preview-section">
            <p className="preview-intro">
              {site.intro}
            </p>
          </section>
        )}

        {site.story && (
          <section className="preview-section">
            {site.storyTitle && (
              <h2>{site.storyTitle}</h2>
            )}

            <p>{site.story}</p>
          </section>
        )}

        {site.services.length > 0 && (
          <section className="preview-section">
            {site.servicesTitle && (
              <h2>
                {site.servicesTitle}
              </h2>
            )}

            <ul>
              {site.services.map(
                (service, index) => (
                  <li key={index}>
                    {service}
                  </li>
                )
              )}
            </ul>
          </section>
        )}

        {(site.contactTitle ||
          site.contactText) && (
          <section className="preview-section">
            {site.contactTitle && (
              <h2>
                {site.contactTitle}
              </h2>
            )}

            {site.contactText && (
              <p>{site.contactText}</p>
            )}
          </section>
        )}

        {renderPreviewMeta()}
      </main>
    );
  }

  return (
    <main className="home">
      <section className="intro">
        <p className="eyebrow">
          Lumivey
        </p>

        {messages.length === 0 ? (
          <>
            <h1>Vertel eens.</h1>

            <p className="lead">
              Je hoeft nog niet te weten hoe je
              website eruit moet zien. Begin gewoon
              bij je bedrijf.
            </p>
          </>
        ) : (
          <div className="conversation">
            {messages.map(
              (message, index) => (
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
              )
            )}

            {loading && (
              <div className="message assistant-message">
                Even denken...
              </div>
            )}
          </div>
        )}

        <form
          className="start"
          onSubmit={handleSubmit}
        >
          <textarea
            name="message"
            aria-label="Vertel verder"
            placeholder={
              messages.length === 0
                ? "Ik ben..."
                : "Vertel wat je wilt veranderen..."
            }
            rows={4}
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Even denken..."
              : "Verder"}
          </button>
        </form>

        {understanding && (
          <div className="preview-actions">
            <button
              onClick={handlePreview}
              disabled={previewLoading}
            >
              {previewLoading
                ? "Even maken..."
                : "Laat iets zien"}
            </button>

            <details className="understanding">
              <summary>
                Intern begrip
              </summary>

              <pre>
                {JSON.stringify(
                  understanding,
                  null,
                  2
                )}
              </pre>
            </details>
          </div>
        )}

        <p className="quiet">
          Keep it simple. Keep it human.
        </p>
      </section>
    </main>
  );
}