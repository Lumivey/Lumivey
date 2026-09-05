"use client";

import { useState } from "react";

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

type Props = {
  site: SiteDescription;
  imageBrief?: ImageBrief | null;
};

export default function WarmCraftPreview({
  site,
  imageBrief,
}: Props) {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [detailImage, setDetailImage] = useState<string | null>(null);

  const [heroLoading, setHeroLoading] = useState(false);
  const [storyLoading, setStoryLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [heroError, setHeroError] = useState("");
  const [storyError, setStoryError] = useState("");
  const [detailError, setDetailError] = useState("");

  async function generateImage(
    brief: ImageBriefItem | undefined,
    setImage: (value: string) => void,
    setLoading: (value: boolean) => void,
    setError: (value: string) => void
  ) {
    if (!brief) {
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
      setError("Het tijdelijke beeld kon niet worden gemaakt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wc-page">
      <section className="wc-hero">
        <div className="wc-hero-copy">
          <p className="wc-kicker">Preview</p>

          <h1>{site.title}</h1>

          {site.subtitle && (
            <p className="wc-subtitle">
              {site.subtitle}
            </p>
          )}
        </div>

        <div className="wc-hero-image">
          {heroImage ? (
            <img
              src={heroImage}
              alt=""
              className="wc-generated-image"
            />
          ) : (
            <div className="wc-image-placeholder">
              <span>Beeldrichting</span>

              {imageBrief?.hero ? (
                <>
                  <p>{imageBrief.hero.subject}</p>

                  <button
                    type="button"
                    className="wc-generate-image"
                    onClick={() =>
                      generateImage(
                        imageBrief.hero,
                        setHeroImage,
                        setHeroLoading,
                        setHeroError
                      )
                    }
                    disabled={heroLoading}
                  >
                    {heroLoading
                      ? "Beeld wordt gemaakt..."
                      : "Maak tijdelijk beeld"}
                  </button>

                  {heroError && (
                    <p className="wc-image-error">
                      {heroError}
                    </p>
                  )}
                </>
              ) : (
                <p>
                  Authentieke fotografie van werk,
                  materiaal en afwerking.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {site.intro && (
        <section className="wc-intro">
          <p>{site.intro}</p>
        </section>
      )}

      {site.story && (
        <section className="wc-story">
          <div className="wc-story-copy">
            <p className="wc-section-label">
              Verhaal
            </p>

            {site.storyTitle && (
              <h2>{site.storyTitle}</h2>
            )}

            <p>{site.story}</p>
          </div>

          <div className="wc-story-image">
            {storyImage ? (
              <img
                src={storyImage}
                alt=""
                className="wc-generated-image"
              />
            ) : (
              <div className="wc-image-placeholder small">
                <span>Werkbeeld</span>

                {imageBrief?.story ? (
                  <>
                    <p>{imageBrief.story.subject}</p>

                    <button
                      type="button"
                      className="wc-generate-image"
                      onClick={() =>
                        generateImage(
                          imageBrief.story,
                          setStoryImage,
                          setStoryLoading,
                          setStoryError
                        )
                      }
                      disabled={storyLoading}
                    >
                      {storyLoading
                        ? "Beeld wordt gemaakt..."
                        : "Maak tijdelijk beeld"}
                    </button>

                    {storyError && (
                      <p className="wc-image-error">
                        {storyError}
                      </p>
                    )}
                  </>
                ) : (
                  <p>
                    Voorbereiding, handen aan het werk
                    en zorgvuldig vakmanschap.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {site.services.length > 0 && (
        <section className="wc-services">
          <p className="wc-section-label">
            Werkzaamheden
          </p>

          <h2>
            {site.servicesTitle || "Waarmee ik help"}
          </h2>

          <div className="wc-service-list">
            {site.services.map((service, index) => (
              <article key={index}>
                <span>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3>{service}</h3>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="wc-process">
        <div className="wc-process-heading">
          <p className="wc-section-label">
            Werkwijze
          </p>

          <h2>
            Goed werk begint voordat het eindresultaat zichtbaar is.
          </h2>
        </div>

        <div className="wc-process-steps">
          <article>
            <span>01</span>
            <h3>Voorbereiden</h3>
            <p>
              Afplakken, schoonmaken, schuren en gronden.
            </p>
          </article>

          <article>
            <span>02</span>
            <h3>Uitvoeren</h3>
            <p>
              Rustig werken, laag voor laag, met aandacht
              voor materiaal en omgeving.
            </p>
          </article>

          <article>
            <span>03</span>
            <h3>Afwerken</h3>
            <p>
              Netjes opleveren en zorgen dat het resultaat
              ook echt klopt.
            </p>
          </article>
        </div>
      </section>

      {imageBrief?.detail && (
        <section className="wc-detail">
          <div className="wc-detail-image">
            {detailImage ? (
              <img
                src={detailImage}
                alt=""
                className="wc-generated-image"
              />
            ) : (
              <div className="wc-image-placeholder detail">
                <span>Detailbeeld</span>
                <p>{imageBrief.detail.subject}</p>

                <button
                  type="button"
                  className="wc-generate-image"
                  onClick={() =>
                    generateImage(
                      imageBrief.detail,
                      setDetailImage,
                      setDetailLoading,
                      setDetailError
                    )
                  }
                  disabled={detailLoading}
                >
                  {detailLoading
                    ? "Beeld wordt gemaakt..."
                    : "Maak tijdelijk beeld"}
                </button>

                {detailError && (
                  <p className="wc-image-error">
                    {detailError}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="wc-detail-copy">
            <p className="wc-section-label">
              Afwerking
            </p>

            <h2>
              Het verschil zit vaak in wat je pas later ziet.
            </h2>

            <p>
              Goede voorbereiding, meerdere lagen waar nodig
              en een afwerking waar de kwaliteit in terugkomt.
            </p>
          </div>
        </section>
      )}

      {(site.contactTitle || site.contactText) && (
        <section className="wc-contact">
          <div>
            <p className="wc-section-label">
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