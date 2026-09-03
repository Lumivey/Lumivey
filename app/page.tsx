"use client";

import { FormEvent, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = message.trim();

    if (!trimmed || loading) {
      return;
    }

    setStarted(true);
    setLoading(true);
    setReply("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Er ging iets mis.");
      }

      setReply(data.reply);
    } catch (error) {
      console.error(error);
      setReply("Er ging iets mis. Probeer het nog eens.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="home">
      <section className="intro">
        <p className="eyebrow">Lumivey</p>

        {!started ? (
          <>
            <h1>Vertel eens.</h1>

            <p className="lead">
              Je hoeft nog niet te weten hoe je website eruit moet zien.
              Begin gewoon bij je bedrijf.
            </p>

            <form className="start" onSubmit={handleSubmit}>
              <textarea
                name="message"
                aria-label="Vertel over je bedrijf"
                placeholder="Ik ben..."
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />

              <button type="submit" disabled={loading}>
                {loading ? "Even denken..." : "Verder"}
              </button>
            </form>
          </>
        ) : (
          <div className="conversation">
            <p className="you">{message}</p>

            {loading ? (
              <p className="lead">Even denken...</p>
            ) : (
              <>
                <h1>{reply}</h1>

                <form className="start" onSubmit={handleSubmit}>
                  <textarea
                    name="message"
                    aria-label="Ga verder"
                    placeholder="Vertel verder..."
                    rows={4}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />

                  <button type="submit">
                    Verder
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        <p className="quiet">Keep it simple. Keep it human.</p>
      </section>
    </main>
  );
}