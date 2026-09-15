import { NextResponse } from "next/server";
import { extractUnderstanding } from "@/lib/lumivey/extract-understanding";
import { ADRIE_REGRESSION_REPLAY, ADRIE_REGRESSION_SOURCE_CONTEXTS } from "@/lib/lumivey/regression/adrie-checkpoint";

export const maxDuration = 120;

function errorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (typeof object.message === "string") return object.message;
    if (typeof object.error === "string") return object.error;
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value || "Onbekende fout");
}

export async function GET() {
  try {
    const messages = ADRIE_REGRESSION_REPLAY.flatMap((turn) => [
      { role: "user" as const, content: turn.user },
      { role: "assistant" as const, content: turn.assistant },
    ]);

    const understanding = await extractUnderstanding(messages, ADRIE_REGRESSION_SOURCE_CONTEXTS);

    return NextResponse.json({
      case: "Adrie Pouwer / AssetPouwer",
      purpose: "Vastgelegde regressiecheckpoint na afgeronde Discovery en broncontrole.",
      note: "Deze checkpoint hergebruikt de reeds verworven Discovery en broncontext. Er wordt geen nieuwe crawl of gespreksreplay uitgevoerd.",
      replay: ADRIE_REGRESSION_REPLAY,
      sourceContexts: ADRIE_REGRESSION_SOURCE_CONTEXTS,
      understanding,
      uploadedPhotoCount: 0,
      evaluation: {
        overall: "WARN",
        diagnosis: "Checkpoint geladen. Selecteer de bestaande fotobronpool en genereer alleen de Preview opnieuw.",
        checks: [],
      },
      artDirection: null,
      siteDirection: null,
      previewImpression: null,
      previewError: "",
    });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error), stage: "adrie-checkpoint" }, { status: 500 });
  }
}
