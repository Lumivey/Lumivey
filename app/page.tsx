"use client";

import { FormEvent, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [understanding, setUnderstanding] = useState<object | null>(null);

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
                : "Vertel verder..."
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
          <details className="understanding">
            <summary>Intern begrip</summary>
            <pre>{JSON.stringify(understanding, null, 2)}</pre>
          </details>
        )}

        <p className="quiet">Keep it simple. Keep it human.</p>
      </section>
    </main>
  );
}