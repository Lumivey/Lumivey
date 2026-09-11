"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ArtistImpression, WebsiteBrief, WebsiteFact } from "@/lib/lumivey/primary-flow";
import type { LumiveyUnderstanding, SourceBackedCandidate } from "@/lib/lumivey/understanding";

type BuildResult = {
  chatId: string;
  webUrl?: string;
  previewUrl?: string;
};

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function firstCandidate(candidates: SourceBackedCandidate[] | undefined): string {
  return candidates?.find((item) => item.value?.trim())?.value?.trim() || "";
}

function findContactCandidate(
  candidates: SourceBackedCandidate[] | undefined,
  kind: "email" | "phone" | "link"
): string {
  const values = (candidates || []).map((item) => item.value?.trim()).filter(Boolean) as string[];

  if (kind === "email") {
    return values.find((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value)) || "";
  }

  if (kind === "link") {
    return (
      values.find((value) => /linkedin\.com|instagram\.com|facebook\.com|https?:\/\//i.test(value)) ||
      ""
    );
  }

  return (
    values.find((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 8 && !value.includes("@");
    }) || ""
  );
}

export default function PreparePage() {
  const [understanding, setUnderstanding] = useState<LumiveyUnderstanding | null>(null);
  const [impression, setImpression] = useState<ArtistImpression | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [services, setServices] = useState("");
  const [pages, setPages] = useState("Home\nOver ons / Over mij\nDiensten\nContact");
  const [notes, setNotes] = useState("");
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState("");
  const [build, setBuild] = useState<BuildResult | null>(null);

  useEffect(() => {
    try {
      const rawUnderstanding = localStorage.getItem("lumivey-understanding");
      const rawImpression = localStorage.getItem("lumivey-approved-impression");

      if (rawUnderstanding) {
        const parsed = JSON.parse(rawUnderstanding) as LumiveyUnderstanding;
        setUnderstanding(parsed);

        const sourceBacked = parsed.sourceBacked;
        const sourceBusinessName = firstCandidate(sourceBacked?.businessNames);
        const sourceLocation = firstCandidate(sourceBacked?.locations);
        const sourceEmail = findContactCandidate(sourceBacked?.contactDetails, "email");
        const sourcePhone = findContactCandidate(sourceBacked?.contactDetails, "phone");
        const sourceLink = findContactCandidate(sourceBacked?.contactDetails, "link");
        const sourceServices = (sourceBacked?.services || []).map((item) => item.value);

        setName(parsed.entrepreneur?.name || "");
        setBusinessName(parsed.entrepreneur?.businessName || sourceBusinessName);
        setLocation(parsed.entrepreneur?.location || sourceLocation);
        setContactEmail(sourceEmail);
        setPhone(sourcePhone);
        setLinkedin(sourceLink);
        setServices(unique([...(parsed.business?.services || []), ...sourceServices]).join("\n"));
      }

      if (rawImpression) {
        setImpression(JSON.parse(rawImpression) as ArtistImpression);
      }
    } catch (loadError) {
      console.error(loadError);
      setError("De goedgekeurde Preview kon niet worden geladen.");
    }
  }, []);

  const canBuild = useMemo(() => {
    return Boolean(
      understanding &&
        impression &&
        accountEmail.trim() &&
        businessName.trim() &&
        name.trim() &&
        (contactEmail.trim() || phone.trim()) &&
        splitLines(pages).length > 0
    );
  }, [understanding, impression, accountEmail, businessName, name, contactEmail, phone, pages]);

  async function handleBuild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!understanding || !impression || !canBuild || building) return;

    setBuilding(true);
    setError("");
    setBuild(null);

    const facts: WebsiteFact[] = [
      { key: "entrepreneur.name", value: name.trim(), status: "confirmed", source: "verified-after-preview" },
      { key: "business.name", value: businessName.trim(), status: "confirmed", source: "verified-after-preview" },
      { key: "business.location", value: location.trim() || null, status: location.trim() ? "confirmed" : "missing", source: "verified-after-preview" },
      { key: "contact.email", value: contactEmail.trim() || null, status: contactEmail.trim() ? "confirmed" : "missing", source: "verified-after-preview" },
      { key: "contact.phone", value: phone.trim() || null, status: phone.trim() ? "confirmed" : "missing", source: "verified-after-preview" },
      { key: "contact.linkedin", value: linkedin.trim() || null, status: linkedin.trim() ? "confirmed" : "missing", source: "verified-after-preview" },
    ];

    const brief: WebsiteBrief = {
      version: 1,
      understanding: {
        ...understanding,
        entrepreneur: {
          ...understanding.entrepreneur,
          name: name.trim(),
          businessName: businessName.trim(),
          location: location.trim(),
        },
        business: {
          ...understanding.business,
          services: splitLines(services),
        },
      },
      artistImpression: impression,
      facts,
      assets: (understanding.sources || []).map((source, index) => ({
        name: `Bron ${index + 1}`,
        kind: "other" as const,
        source: typeof source === "object" ? JSON.stringify(source) : String(source),
      })),
      pages: splitLines(pages).map((page) => ({
        name: page,
        purpose: page.toLowerCase().includes("contact") ? "Contact en kennismaking" : "Onderdeel van de gevalideerde website",
        knownContent: [],
      })),
      functionalRequirements: ["Responsive desktop en mobiel", "Contactmogelijkheid"],
      constraints: [
        "Gebruik geen onbevestigde feiten als waarheid.",
        "Behoud de creatieve richting en herkenning van de goedgekeurde artist impression.",
        "Gebruik echte assets wanneer beschikbaar vóór generieke alternatieven.",
        notes.trim() ? `Aanvullende productienotitie: ${notes.trim()}` : "",
      ].filter(Boolean),
      unknowns: [],
    };

    localStorage.setItem("lumivey-test-account", JSON.stringify({ email: accountEmail.trim() }));
    localStorage.setItem("lumivey-website-brief", JSON.stringify(brief));

    try {
      const response = await fetch("/api/build/v0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });

      const data = await response.json();
      if (!response.ok) {
        const blockers = Array.isArray(data.blockers) ? ` ${data.blockers.join(" ")}` : "";
        throw new Error(`${data.error || "De website kon niet worden gestart."}${blockers}`);
      }

      setBuild(data.build as BuildResult);
      localStorage.setItem("lumivey-v0-build", JSON.stringify(data.build));
    } catch (buildError) {
      setError(buildError instanceof Error ? buildError.message : "De website kon niet worden gestart.");
    } finally {
      setBuilding(false);
    }
  }

  if (!understanding || !impression) {
    return (
      <main className="home">
        <section className="intro" style={{ maxWidth: 760 }}>
          <p className="eyebrow">Lumivey</p>
          <h1>Eerst een goedgekeurde Preview.</h1>
          <p className="lead">Ga terug naar het gesprek, maak de artist impression en kies daarna “Deze klopt — ga door”.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="home">
      <section className="intro" style={{ maxWidth: 860 }}>
        <p className="eyebrow">Bouwvoorbereiding</p>
        <h1>De richting staat. Nu maken we het dossier compleet.</h1>
        <p className="lead">
          Lumivey heeft al veel uit het gesprek en de bronnen gehaald. Controleer wat bekend is en vul alleen aan wat nodig is voor een sterke eerste build.
        </p>

        <form className="start" onSubmit={handleBuild} style={{ gap: 18 }}>
          <label>
            Account e-mail
            <input value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} type="email" required />
          </label>

          <label>
            Naam
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label>
            Bedrijfsnaam
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </label>

          <label>
            Vestigingsplaats / basis
            <input value={location} onChange={(e) => setLocation(e.target.value)} />
          </label>

          <label>
            E-mail op de website
            <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" />
          </label>

          <label>
            Telefoon op de website
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>

          <label>
            LinkedIn of andere relevante link
            <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
          </label>

          <label>
            Diensten — één per regel
            <textarea rows={5} value={services} onChange={(e) => setServices(e.target.value)} />
          </label>

          <label>
            Pagina's — één per regel
            <textarea rows={5} value={pages} onChange={(e) => setPages(e.target.value)} />
          </label>

          <label>
            Nog iets dat v0 moet weten voor deze test?
            <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <button type="submit" disabled={!canBuild || building}>
            {building ? "Website wordt gebouwd..." : "Bouw eerste website"}
          </button>
        </form>

        {error && <p className="quiet" style={{ marginTop: 18 }}>{error}</p>}

        {build && (
          <div className="preview-actions" style={{ marginTop: 28 }}>
            <h2>v0-build gestart.</h2>
            <p>Chat-id: {build.chatId}</p>
            {build.previewUrl && <p><a href={build.previewUrl} target="_blank" rel="noreferrer">Open de technische preview</a></p>}
            {build.webUrl && <p><a href={build.webUrl} target="_blank" rel="noreferrer">Open de v0-build</a></p>}
            <p className="quiet">Voor deze eerste ketentest blijft QA handmatig. Nog geen automatische correctielus.</p>
          </div>
        )}

        <p className="quiet" style={{ marginTop: 28 }}>
          Testfase: de account-e-mail wordt lokaal in deze browser bewaard. Echte authenticatie en klantopslag volgen nadat de primaire keten bewezen is.
        </p>
      </section>
    </main>
  );
}
