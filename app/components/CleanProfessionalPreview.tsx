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

export default function CleanProfessionalPreview({
  site,
  imageBrief,
}: Props) {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroError, setHeroError] = useState("");

  async function generateHeroImage() {
    if (!imageBrief?.hero || heroLoading) {
      return;
    }

    setHeroLoading(true);
    setHeroError("");

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brief: imageBrief.hero,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Het beeld kon niet worden gemaakt."
        );
      }

      setHeroImage(data.image);
    } catch (error) {
      console.error(error);
      setHeroError("Het tijdelijke beeld kon niet worden gemaakt.");
    } finally {
      setHeroLoading(false);
    }
  }

  return (
    <div className="cp-page">
      <section className="cp-hero">
        <div className="cp-hero-copy">
          <p className="cp-kicker">Preview</p>

          <h1>{site.title}</h1>

          {site.subtitle && (
            <p className="cp-subtitle">{site.subtitle}</p>
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
            <div className="cp-image-placeholder">
              <span>Beeldrichting</span>

              {imageBrief?.hero ? (
                <>
                  <p>{imageBrief.hero.subject}</p>

                  <button
                    type="button"
                    className="cp-generate-image"
                    onClick={generateHeroImage}
                    disabled={heroLoading}
                  >
                    {heroLoading
                      ? "Beeld wordt gemaakt..."
                      : "Maak tijdelijk beeld"}
                  </button>

                  {heroError && (
                    <p className="cp-image-error">
                      {heroError}
                    </p>
                  )}
                </>
              ) : (
                <p>
                  Authentieke fotografie die past bij het werk,
                  de omgeving en het vakmanschap.
                </p>
              )}
            </div>
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
            {site.storyTitle && <h2>{site.storyTitle}</h2>}
            <p>{site.story}</p>
          </div>

          <div className="cp-story-image">
            <div className="cp-image-placeholder small">
              <span>Werkbeeld</span>

              {imageBrief?.story ? (
                <p>{imageBrief.story.subject}</p>
              ) : (
                <p>
                  Detail van voorbereiding, uitvoering of
                  afwerking.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {site.services.length > 0 && (
        <section className="cp-services">
          <div className="cp-section-heading">
            <p>Diensten</p>
            <h2>{site.servicesTitle || "Waarmee ik help"}</h2>
          </div>

          <div className="cp-service-grid">
            {site.services.map((service, index) => (
              <article className="cp-service-card" key={index}>
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
          <p className="cp-section-label-text">Werkwijze</p>
          <h2>
            Rust in het proces. Duidelijkheid in het resultaat.
          </h2>
        </div>

        <div className="cp-process-grid">
          <div>
            <span>01</span>
            <h3>Begrijpen</h3>
            <p>
              Eerst helder krijgen wat belangrijk is en waar
              het werk echt om draait.
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

      {(site.contactTitle || site.contactText) && (
        <section className="cp-contact">
          <div>
            <p className="cp-section-label-text">Contact</p>

            <h2>{site.contactTitle || "Kennismaken?"}</h2>

            {site.contactText && <p>{site.contactText}</p>}
          </div>

          <button type="button">
            Neem contact op
          </button>
        </section>
      )}
    </div>
  );
}