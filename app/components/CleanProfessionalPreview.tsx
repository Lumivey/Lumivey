"use client";

import { useEffect, useState } from "react";

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
};

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

export type GeneratedImages = {
  heroImage: string | null;
  storyImage: string | null;
  detailImage: string | null;
};

type Props = {
  site: SiteDescription;
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

export default function CleanProfessionalPreview({
  site,
  imageBrief,
  onImagesChange,
  initialImages = emptyImages,
  allowGeneration = true,
}: Props) {
  const [heroImage, setHeroImage] = useState<string | null>(
    initialImages.heroImage
  );

  const [storyImage, setStoryImage] = useState<string | null>(
    initialImages.storyImage
  );

  const [detailImage, setDetailImage] = useState<string | null>(
    initialImages.detailImage
  );

  const [heroLoading, setHeroLoading] = useState(false);
  const [storyLoading, setStoryLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [heroError, setHeroError] = useState("");
  const [storyError, setStoryError] = useState("");
  const [detailError, setDetailError] = useState("");

  /*
    Belangrijk voor /site:
    de opgeslagen afbeeldingen worden asynchroon uit IndexedDB geladen.
    Zodra initialImages daarna veranderen, moet dit component zijn eigen
    interne image-state daarmee synchroniseren.
  */
  useEffect(() => {
    setHeroImage(initialImages.heroImage);
    setStoryImage(initialImages.storyImage);
    setDetailImage(initialImages.detailImage);
  }, [
    initialImages.heroImage,
    initialImages.storyImage,
    initialImages.detailImage,
  ]);

  useEffect(() => {
    onImagesChange?.({
      heroImage,
      storyImage,
      detailImage,
    });
  }, [
    heroImage,
    storyImage,
    detailImage,
    onImagesChange,
  ]);

  async function generateImage(
    brief: ImageBriefItem | undefined,
    setImage: (value: string) => void,
    setLoading: (value: boolean) => void,
    setError: (value: string) => void
  ) {
    if (!brief || !allowGeneration) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brief,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Het beeld kon niet worden gemaakt."
        );
      }

      setImage(data.image);
    } catch (error) {
      console.error(error);

      setError(
        "Het tijdelijke beeld kon niet worden gemaakt."
      );
    } finally {
      setLoading(false);
    }
  }

  function renderPlaceholder(
    label: string,
    brief: ImageBriefItem | undefined,
    loading: boolean,
    error: string,
    onGenerate: () => void,
    extraClass = ""
  ) {
    return (
      <div
        className={`cp-image-placeholder ${extraClass}`}
      >
        <span>{label}</span>

        {brief ? (
          <>
            <p>{brief.subject}</p>

            {allowGeneration === true && (
              <button
                type="button"
                className="cp-generate-image"
                onClick={onGenerate}
                disabled={loading}
              >
                {loading
                  ? "Beeld wordt gemaakt..."
                  : "Maak tijdelijk beeld"}
              </button>
            )}

            {error && (
              <p className="cp-image-error">
                {error}
              </p>
            )}
          </>
        ) : (
          <p>
            Authentieke fotografie die past bij het werk,
            de omgeving en de inhoud.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="cp-page">
      <section className="cp-hero">
        <div className="cp-hero-copy">
          {allowGeneration && (
            <p className="cp-kicker">
              Preview
            </p>
          )}

          <h1>{site.title}</h1>

          {site.subtitle && (
            <p className="cp-subtitle">
              {site.subtitle}
            </p>
          )}
        </div>

        <div className="cp-hero-image">
          {heroImage ? (
            <img
              src={heroImage}
              alt=""
              className="cp-generated-image"
            />
          ) : (
            renderPlaceholder(
              "Beeldrichting",
              imageBrief?.hero,
              heroLoading,
              heroError,
              () =>
                generateImage(
                  imageBrief?.hero,
                  setHeroImage,
                  setHeroLoading,
                  setHeroError
                )
            )
          )}
        </div>
      </section>

      {site.intro && (
        <section className="cp-intro">
          <p>{site.intro}</p>
        </section>
      )}

      {site.story && (
        <section className="cp-story">
          <div className="cp-section-label">
            <span>Verhaal</span>
          </div>

          <div className="cp-story-copy">
            {site.storyTitle && (
              <h2>{site.storyTitle}</h2>
            )}

            <p>{site.story}</p>
          </div>

          <div className="cp-story-image">
            {storyImage ? (
              <img
                src={storyImage}
                alt=""
                className="cp-generated-image"
              />
            ) : (
              renderPlaceholder(
                "Werkbeeld",
                imageBrief?.story,
                storyLoading,
                storyError,
                () =>
                  generateImage(
                    imageBrief?.story,
                    setStoryImage,
                    setStoryLoading,
                    setStoryError
                  ),
                "small"
              )
            )}
          </div>
        </section>
      )}

      {site.services.length > 0 && (
        <section className="cp-services">
          <div className="cp-section-heading">
            <p>Diensten</p>

            <h2>
              {site.servicesTitle || "Waarmee ik help"}
            </h2>
          </div>

          <div className="cp-service-grid">
            {site.services.map((service, index) => (
              <article
                className="cp-service-card"
                key={index}
              >
                <span className="cp-service-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3>{service}</h3>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="cp-process">
        <div>
          <p className="cp-section-label-text">
            Werkwijze
          </p>

          <h2>
            Rust in het proces. Duidelijkheid in het resultaat.
          </h2>
        </div>

        <div className="cp-process-grid">
          <div>
            <span>01</span>
            <h3>Begrijpen</h3>

            <p>
              Eerst helder krijgen wat belangrijk is en
              waar het werk echt om draait.
            </p>
          </div>

          <div>
            <span>02</span>
            <h3>Voorbereiden</h3>

            <p>
              Zorgvuldig werken begint voordat het zichtbare
              resultaat ontstaat.
            </p>
          </div>

          <div>
            <span>03</span>
            <h3>Afmaken</h3>

            <p>
              Geen half werk, maar een resultaat waar alles
              klopt.
            </p>
          </div>
        </div>
      </section>

      {imageBrief?.detail && (
        <section className="cp-detail">
          <div className="cp-detail-image">
            {detailImage ? (
              <img
                src={detailImage}
                alt=""
                className="cp-generated-image"
              />
            ) : (
              renderPlaceholder(
                "Detailbeeld",
                imageBrief.detail,
                detailLoading,
                detailError,
                () =>
                  generateImage(
                    imageBrief.detail,
                    setDetailImage,
                    setDetailLoading,
                    setDetailError
                  ),
                "detail"
              )
            )}
          </div>

          <div className="cp-detail-copy">
            <p className="cp-section-label-text">
              Verdieping
            </p>

            <h2>
              Van overzicht naar wat er werkelijk speelt.
            </h2>

            <p>
              De kwaliteit zit niet alleen in het advies,
              maar ook in het begrijpen van de context,
              de gevolgen en de werkelijkheid achter
              besluiten.
            </p>
          </div>
        </section>
      )}

      {(site.contactTitle || site.contactText) && (
        <section className="cp-contact">
          <div>
            <p className="cp-section-label-text">
              Contact
            </p>

            <h2>
              {site.contactTitle || "Kennismaken?"}
            </h2>

            {site.contactText && (
              <p>{site.contactText}</p>
            )}
          </div>

          <button type="button">
            Neem contact op
          </button>
        </section>
      )}
    </div>
  );
}