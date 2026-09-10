"use client";

import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
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

export type SourceImageAsset = {
  sourceId: string;
  name: string;
  dataUrl: string;
};

type Props = {
  composition: PreviewComposition;
  imageBrief?: ImageBrief | null;
  sourceAssets?: SourceImageAsset[];
  onImagesChange?: (images: GeneratedImages) => void;
  initialImages?: GeneratedImages;
  allowGeneration?: boolean;
};

const emptyImages: GeneratedImages = {
  heroImage: null,
  storyImage: null,
  detailImage: null,
};

const FALLBACK_PALETTE = {
  background: "#F6F5F1",
  surface: "#FFFFFF",
  text: "#1B1B19",
  muted: "#6F6F69",
  accent: "#B6914C",
  dark: "#151515",
};

function safeHex(value: string | undefined, fallback: string) {
  return value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
}

export default function RecognitionPreview({
  composition,
  imageBrief,
  sourceAssets = [],
  onImagesChange,
  initialImages = emptyImages,
  allowGeneration = true,
}: Props) {
  const [images, setImages] = useState<GeneratedImages>(initialImages);
  const [loadingSlots, setLoadingSlots] = useState<Array<"hero" | "story" | "detail">>([]);
  const [errorSlots, setErrorSlots] = useState<Array<"hero" | "story" | "detail">>([]);
  const autoGenerationStarted = useRef(false);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages.heroImage, initialImages.storyImage, initialImages.detailImage]);

  const sourceAssetMap = useMemo(() => {
    return new Map(sourceAssets.map((asset) => [asset.sourceId, asset]));
  }, [sourceAssets]);

  const sourceBySlot = useMemo(() => {
    const mapping: Partial<Record<"hero" | "story" | "detail", SourceImageAsset>> = {};

    if (composition.hero.imageSlot && composition.hero.sourceAssetId) {
      const asset = sourceAssetMap.get(composition.hero.sourceAssetId);
      if (asset) mapping[composition.hero.imageSlot] = asset;
    }

    composition.sections.forEach((section) => {
      if (!section.imageSlot || !section.sourceAssetId || mapping[section.imageSlot]) return;
      const asset = sourceAssetMap.get(section.sourceAssetId);
      if (asset) mapping[section.imageSlot] = asset;
    });

    return mapping;
  }, [composition, sourceAssetMap]);

  const effectiveImages = useMemo<GeneratedImages>(() => ({
    heroImage: sourceBySlot.hero?.dataUrl ?? images.heroImage,
    storyImage: sourceBySlot.story?.dataUrl ?? images.storyImage,
    detailImage: sourceBySlot.detail?.dataUrl ?? images.detailImage,
  }), [images, sourceBySlot]);

  useEffect(() => {
    onImagesChange?.(effectiveImages);
  }, [effectiveImages, onImagesChange]);

  const usedSlots = useMemo(() => {
    const slots = new Set<"hero" | "story" | "detail">();
    if (composition.hero.imageSlot) slots.add(composition.hero.imageSlot);
    composition.sections.forEach((section) => {
      if (section.imageSlot) slots.add(section.imageSlot);
    });
    return Array.from(slots);
  }, [composition]);

  async function generate(slot: "hero" | "story" | "detail") {
    if (!allowGeneration || !imageBrief?.[slot] || sourceBySlot[slot]) return;

    setLoadingSlots((current) => current.includes(slot) ? current : [...current, slot]);
    setErrorSlots((current) => current.filter((item) => item !== slot));

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
      setErrorSlots((current) => current.includes(slot) ? current : [...current, slot]);
    } finally {
      setLoadingSlots((current) => current.filter((item) => item !== slot));
    }
  }

  useEffect(() => {
    if (!allowGeneration || !imageBrief || autoGenerationStarted.current) return;
    autoGenerationStarted.current = true;

    const missingSlots = usedSlots.filter((slot) => {
      if (sourceBySlot[slot]) return false;
      if (slot === "hero") return !images.heroImage;
      if (slot === "story") return !images.storyImage;
      return !images.detailImage;
    });

    void Promise.all(missingSlots.map((slot) => generate(slot)));
  // Alleen starten bij de eerste complete compositie. Daarna geen automatische retry-loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowGeneration, imageBrief, usedSlots, sourceBySlot]);

  function generatedSlotImage(slot?: "hero" | "story" | "detail" | null) {
    if (!slot) return null;
    return slot === "hero"
      ? images.heroImage
      : slot === "story"
        ? images.storyImage
        : images.detailImage;
  }

  function renderImage(
    slot?: "hero" | "story" | "detail" | null,
    label = "Beeld",
    sourceAssetId?: string | null,
    crop: PreviewSection["imageCrop"] = "landscape"
  ) {
    if (!slot && !sourceAssetId) return null;

    const sourceAsset = sourceAssetId ? sourceAssetMap.get(sourceAssetId) : undefined;
    if (sourceAsset) {
      return (
        <figure className={`rp-source-figure rp-crop-${crop}`}>
          <img className="rp-image rp-source-image" src={sourceAsset.dataUrl} alt="" />
        </figure>
      );
    }

    if (!slot) return null;
    const src = generatedSlotImage(slot);
    const brief = imageBrief?.[slot];
    const loading = loadingSlots.includes(slot);
    const hasError = errorSlots.includes(slot);

    if (src) {
      return <img className={`rp-image rp-crop-${crop}`} src={src} alt="" />;
    }

    return (
      <div className={`rp-image-placeholder rp-crop-${crop} ${loading ? "is-loading" : ""}`}>
        <span>{loading ? "Tijdelijk beeld wordt gemaakt" : label}</span>
        {brief?.subject && <p>{brief.subject}</p>}
        {allowGeneration && brief && !loading && (
          <button type="button" onClick={() => generate(slot)}>
            {hasError ? "Probeer beeld opnieuw" : "Maak tijdelijk beeld"}
          </button>
        )}
        {hasError && <p className="rp-image-error">Het tijdelijke beeld kon niet worden gemaakt.</p>}
      </div>
    );
  }

  function renderSection(section: PreviewSection, index: number) {
    const hasImage = Boolean(section.imageSlot || section.sourceAssetId);
    const tone = section.tone || "base";
    const emphasis = section.emphasis || "normal";
    const crop = section.imageCrop || "landscape";

    return (
      <section
        key={`${section.type}-${index}`}
        className={`rp-section rp-section-${section.layout} rp-tone-${tone} rp-emphasis-${emphasis} ${hasImage ? "rp-section-with-image" : ""}`}
      >
        <div className="rp-section-inner">
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
          {(section.imageSlot || section.sourceAssetId) && (
            <div className="rp-section-image">
              {renderImage(
                section.imageSlot,
                section.eyebrow || section.title || "Beeld",
                section.sourceAssetId,
                crop
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  const palette = composition.design.palette || FALLBACK_PALETTE;
  const cssVariables = {
    "--rp-bg": safeHex(palette.background, FALLBACK_PALETTE.background),
    "--rp-surface": safeHex(palette.surface, FALLBACK_PALETTE.surface),
    "--rp-text": safeHex(palette.text, FALLBACK_PALETTE.text),
    "--rp-muted": safeHex(palette.muted, FALLBACK_PALETTE.muted),
    "--rp-accent": safeHex(palette.accent, FALLBACK_PALETTE.accent),
    "--rp-dark": safeHex(palette.dark, FALLBACK_PALETTE.dark),
  } as CSSProperties;

  return (
    <div
      style={cssVariables}
      className={`rp-page rp-density-${composition.design.density} rp-contrast-${composition.design.contrast} rp-images-${composition.design.imagePresence} rp-shapes-${composition.design.shapeLanguage} rp-theme-${composition.design.theme} rp-type-${composition.design.typeCharacter} rp-hero-scale-${composition.design.heroScale} rp-sections-${composition.design.sectionTreatment} rp-image-style-${composition.design.imageTreatment}`}
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
        {(composition.hero.imageSlot || composition.hero.sourceAssetId) && (
          <div className="rp-hero-image">
            {renderImage(
              composition.hero.imageSlot,
              "Hoofdbeeld",
              composition.hero.sourceAssetId,
              "wide"
            )}
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
