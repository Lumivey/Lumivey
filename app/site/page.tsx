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
  visualDirection: {
    mood: string;
    tone: string;
  };
};

export default function SitePage() {
  const [site, setSite] = useState<SiteDescription | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lumivey-approved-site");

    if (!stored) {
      return;
    }

    setSite(JSON.parse(stored));
  }, []);

  if (!site) {
    return (
      <main className="published-site">
        <section className="published-section">
          <h1>Nog geen website goedgekeurd.</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="published-site">
      <section className="published-hero">
        <h1>{site.title}</h1>

        {site.subtitle && (
          <p className="published-subtitle">{site.subtitle}</p>
        )}
      </section>

      {site.intro && (
        <section className="published-section">
          <p className="published-intro">{site.intro}</p>
        </section>
      )}

      {site.story && (
        <section className="published-section">
          {site.storyTitle && <h2>{site.storyTitle}</h2>}
          <p>{site.story}</p>
        </section>
      )}

      {site.services.length > 0 && (
        <section className="published-section">
          {site.servicesTitle && <h2>{site.servicesTitle}</h2>}

          <ul>
            {site.services.map((service, index) => (
              <li key={index}>{service}</li>
            ))}
          </ul>
        </section>
      )}

      {(site.contactTitle || site.contactText) && (
        <section className="published-section">
          {site.contactTitle && <h2>{site.contactTitle}</h2>}
          {site.contactText && <p>{site.contactText}</p>}
        </section>
      )}
    </main>
  );
}