"use client";

import { useEffect, useState } from "react";
import type { GeneratedImages } from "@/app/components/WarmCraftPreview";
import type { PreviewComposition, PreviewSection } from "@/lib/lumivey/preview-composition";

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

type Props = {
  composition: PreviewComposition;
  imageBrief?: ImageBrief | null;
  onImagesChange?: (images: GeneratedImages) => void;
  initialImages?: GeneratedImages;
  allowGeneration?: boolean;
};

const emptyImages: GeneratedImages = {
  heroImage: null,
  storyImage: null,
  detailImage: null,
};

export default function RecognitionPreview({
  composition,
  imageBrief,
  onImagesChange,
  initialImages = emptyImages,
  allowGeneration = true,
}: Props) {
  const [images, setImages] = useState<GeneratedImages>(initialImages);
  const [loadingSlot, setLoadingSlot] = useState<"hero" | "story" | "detail" | null>(null);
  const [errorSlot, setErrorSlot] = useState<"hero" | "story" | "detail" | null>(null);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages.heroImage, initialImages.storyImage, initialImages.detailImage]);

  useEffect(() => {
    onImagesChange?.(images);
  }, [images, onImagesChange]);

  async function generate(slot: "hero" | "story" | "detail") {
    if (!allowGeneration || !imageBrief?.[slot]) return;

    setLoadingSlot(slot);
    setErrorSlot(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: imageBrief[slot] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Beeld kon niet worden gemaakt.");

      setImages((current) => ({
        ...current,
        ...(slot === "hero" ? { heroImage: data.image } : {}),
        ...(slot === "story" ? { storyImage: data.image } : {}),
        ...(slot === "detail" ? { detailImage: data.image } : {}),
      }));
    } catch (error) {
      console.error(error);
      setErrorSlot(slot);
    } finally {
      setLoadingSlot(null);
    }
  }

  function slotImage(slot?: "hero" | "story" | "detail" | null) {
    if (!slot) return null;
    return slot === "hero"
      ? images.heroImage
      : slot === "story"
        ? images.storyImage
        : images.detailImage;
  }

  function renderImage(slot?: "hero" | "story" | "detail" | null, label = "Beeld") {
    if (!slot) return null;
    const src = slotImage(slot);
    const brief = imageBrief?.[slot];

    if (src) {
      return <img className="rp-image" src={src} alt="" />;
    }

    return (
      <div className="rp-image-placeholder">
        <span>{label}</span>
        {brief?.subject && <p>{brief.subject}</p>}
        {allowGeneration && brief && (
          <button type="button" onClick={() => generate(slot)} disabled={loadingSlot === slot}>
            {loadingSlot === slot ? "Beeld wordt gemaakt..." : "Maak tijdelijk beeld"}
          </button>
        )}
        {errorSlot === slot && <p>Het tijdelijke beeld kon niet worden gemaakt.</p>}
      </div>
    );
  }

  function renderSection(section: PreviewSection, index: number) {
    const hasImage = Boolean(section.imageSlot);
    return (
      <section
        key={`${section.type}-${index}`}
        className={`rp-section rp-section-${section.layout} ${hasImage ? "rp-section-with-image" : ""}`}
      >
        <div className="rp-section-copy">
          {section.eyebrow && <p className="rp-eyebrow">{section.eyebrow}</p>}
          {section.title && <h2>{section.title}</h2>}
          {section.body && <p className="rp-body">{section.body}</p>}
          {section.items && section.items.length > 0 && (
            <div className={`rp-items rp-items-${section.layout}`}>
              {section.items.map((item, itemIndex) => (
                <article key={itemIndex}>
                  <span>{String(itemIndex + 1).padStart(2, "0")}</span>
                  <h3>{item}</h3>
                </article>
              ))}
            </div>
          )}
        </div>
        {section.imageSlot && (
          <div className="rp-section-image">
            {renderImage(section.imageSlot, section.eyebrow || section.title || "Beeld")}
          </div>
        )}
      </section>
    );
  }

  return (
    <div
      className={`rp-page rp-density-${composition.design.density} rp-contrast-${composition.design.contrast} rp-images-${composition.design.imagePresence} rp-shapes-${composition.design.shapeLanguage}`}
    >
      <header className="rp-header">
        <strong className="rp-brand">{composition.brandName}</strong>
        {composition.navigation.length > 0 && (
          <nav>
            {composition.navigation.slice(0, 6).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </nav>
        )}
      </header>

      <section className={`rp-hero rp-hero-${composition.hero.layout}`}>
        <div className="rp-hero-copy">
          {composition.hero.eyebrow && <p className="rp-eyebrow">{composition.hero.eyebrow}</p>}
          <h1>{composition.hero.title}</h1>
          {composition.hero.subtitle && <p className="rp-hero-subtitle">{composition.hero.subtitle}</p>}
          {composition.hero.primaryAction && <button type="button">{composition.hero.primaryAction}</button>}
        </div>
        {composition.hero.imageSlot && (
          <div className="rp-hero-image">
            {renderImage(composition.hero.imageSlot, "Hoofdbeeld")}
          </div>
        )}
      </section>

      {composition.sections.map(renderSection)}

      <footer className="rp-footer">
        <strong>{composition.brandName}</strong>
        {composition.pageHints.length > 0 && (
          <div className="rp-page-hints">
            {composition.pageHints.slice(0, 5).map((page) => (
              <span key={page.label}>{page.label}</span>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}
