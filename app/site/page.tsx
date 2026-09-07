"use client";

import { useEffect, useState } from "react";

import WarmCraftPreview, {
  GeneratedImages,
} from "@/app/components/WarmCraftPreview";

import CleanProfessionalPreview from "@/app/components/CleanProfessionalPreview";

import { getImage } from "@/lib/lumivey/image-store";

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

const emptyImages: GeneratedImages = {
  heroImage: null,
  storyImage: null,
  detailImage: null,
};

export default function SitePage() {
  const [approvedPackage, setApprovedPackage] =
    useState<ApprovedSitePackage | null>(null);

  const [images, setImages] =
    useState<GeneratedImages>(emptyImages);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadApprovedSite() {
      try {
        const stored = localStorage.getItem(
          "lumivey-approved-package"
        );

        if (!stored) {
          setError(
            "Er is nog geen goedgekeurde website opgeslagen."
          );
          return;
        }

        const parsed = JSON.parse(
          stored
        ) as ApprovedSitePackage;

        setApprovedPackage(parsed);

        const [
          heroImage,
          storyImage,
          detailImage,
        ] = await Promise.all([
          parsed.images.heroKey
            ? getImage(parsed.images.heroKey)
            : Promise.resolve(null),

          parsed.images.storyKey
            ? getImage(parsed.images.storyKey)
            : Promise.resolve(null),

          parsed.images.detailKey
            ? getImage(parsed.images.detailKey)
            : Promise.resolve(null),
        ]);

        setImages({
          heroImage,
          storyImage,
          detailImage,
        });
      } catch (loadError) {
        console.error(
          "Goedgekeurde site laden mislukt:",
          loadError
        );

        setError(
          "De goedgekeurde website kon niet worden geladen."
        );
      } finally {
        setLoading(false);
      }
    }

    loadApprovedSite();
  }, []);

  if (loading) {
    return (
      <main className="home">
        <section className="intro">
          <p className="eyebrow">
            Lumivey
          </p>

          <h1>Even laden...</h1>
        </section>
      </main>
    );
  }

  if (error || !approvedPackage) {
    return (
      <main className="home">
        <section className="intro">
          <p className="eyebrow">
            Lumivey
          </p>

          <h1>
            Nog geen site.
          </h1>

          <p className="lead">
            {error ||
              "Er is nog geen goedgekeurde website opgeslagen."}
          </p>

          <a href="/">
            Terug naar Lumivey
          </a>
        </section>
      </main>
    );
  }

  const {
    site,
    layoutVariant,
    imageBrief,
  } = approvedPackage;

  if (layoutVariant === "warm-craft") {
    return (
      <main className="preview-page layout-warm-craft">
        <WarmCraftPreview
          site={site}
          imageBrief={imageBrief}
          initialImages={images}
          allowGeneration={false}
        />
      </main>
    );
  }

  if (layoutVariant === "clean-professional") {
    return (
      <main className="preview-page layout-clean-professional">
        <CleanProfessionalPreview
          site={site}
          imageBrief={imageBrief}
        />
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
            <h2>{site.servicesTitle}</h2>
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
    </main>
  );
}