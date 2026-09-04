"use client";

import { FormEvent, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
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

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [understanding, setUnderstanding] = useState<object | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [site, setSite] = useState<SiteDescription | null>(null);
  const [approvedSite, setApprovedSite] = useState<SiteDescription | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Er ging iets mis.");
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
          content: "Er ging iets mis. Probeer het nog eens.",
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
        throw new Error(data.error || "Preview kon niet worden gemaakt.");
      }

      setSite(data.site);
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

function handleApprove() {
  if (!site) {
    return;
  }

  localStorage.setItem("lumivey-approved-site", JSON.stringify(site));

  setApprovedSite(site);
  setSite(null);
}

  if (approvedSite) {
    return (
      <main className="preview-page">
        <section className="preview-hero">
          <p className="eyebrow">Goedgekeurde versie</p>

          <h1>{approvedSite.title}</h1>

          {approvedSite.subtitle && (
            <p className="preview-subtitle">
              {approvedSite.subtitle}
            </p>
          )}
        </section>

        {approvedSite.intro && (
          <section className="preview-section">
            <p className="preview-intro">
              {approvedSite.intro}
            </p>
          </section>
        )}

        {approvedSite.story && (
          <section className="preview-section">
            {approvedSite.storyTitle && (
              <h2>{approvedSite.storyTitle}</h2>
            )}

            <p>{approvedSite.story}</p>
          </section>
        )}

        {approvedSite.services.length > 0 && (
          <section className="preview-section">
            {approvedSite.servicesTitle && (
              <h2>{approvedSite.servicesTitle}</h2>
            )}

            <ul>
              {approvedSite.services.map((service, index) => (
                <li key={index}>{service}</li>
              ))}
            </ul>
          </section>
        )}

        {(approvedSite.contactTitle ||
          approvedSite.contactText) && (
          <section className="preview-section">
            {approvedSite.contactTitle && (
              <h2>{approvedSite.contactTitle}</h2>
            )}

            {approvedSite.contactText && (
              <p>{approvedSite.contactText}</p>
            )}
          </section>
        )}

        <section className="preview-section preview-meta">
          <p>Deze versie is goedgekeurd voor publicatie.</p>

          <button
            onClick={() => {
              setApprovedSite(null);
              setSite(null);
            }}
          >
            Terug naar gesprek
          </button>
        </section>
      </main>
    );
  }

  if (site) {
    return (
      <main className="preview-page">
        <section className="preview-hero">
          <p className="eyebrow">Preview</p>

          <h1>{site.title}</h1>

          {site.subtitle && (
            <p className="preview-subtitle">
              {site.subtitle}
            </p>
          )}
        </section>

        {site.intro && (
          <section className="preview-section">
            <p className="preview-intro">{site.intro}</p>
          </section>
        )}

        {site.story && (
          <section className="preview-section">
            {site.storyTitle && <h2>{site.storyTitle}</h2>}
            <p>{site.story}</p>
          </section>
        )}

        {site.services.length > 0 && (
          <section className="preview-section">
            {site.servicesTitle && <h2>{site.servicesTitle}</h2>}

            <ul>
              {site.services.map((service, index) => (
                <li key={index}>{service}</li>
              ))}
            </ul>
          </section>
        )}

        {(site.contactTitle || site.contactText) && (
          <section className="preview-section">
            {site.contactTitle && <h2>{site.contactTitle}</h2>}
            {site.contactText && <p>{site.contactText}</p>}
          </section>
        )}

        <section className="preview-section preview-meta">
          <p>
            Richting: {site.visualDirection.mood} /{" "}
            {site.visualDirection.tone}
          </p>

          <div className="preview-buttons">
            <button onClick={handleApprove}>
              Deze klopt
            </button>

            <button onClick={handleBackToConversation}>
              Dit wil ik aanpassen
            </button>
          </div>
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

            <p className="lead">
              Je hoeft nog niet te weten hoe je website eruit moet zien.
              Begin gewoon bij je bedrijf.
            </p>
          </>
        ) : (
          <div className="conversation">
            {messages.map((message, index) => (
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
            ))}

            {loading && (
              <div className="message assistant-message">
                Even denken...
              </div>
            )}
          </div>
        )}

        <form className="start" onSubmit={handleSubmit}>
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
            onChange={(event) => setInput(event.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Even denken..." : "Verder"}
          </button>
        </form>

        {understanding && (
          <div className="preview-actions">
            <button onClick={handlePreview} disabled={previewLoading}>
              {previewLoading ? "Even maken..." : "Laat iets zien"}
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