import { NextResponse } from "next/server";
import { ADRIE_REGRESSION_REPLAY, ADRIE_REGRESSION_SOURCE_CONTEXTS } from "@/lib/lumivey/regression/adrie-checkpoint";
import { ADRIE_CHECKPOINT_UNDERSTANDING } from "@/lib/lumivey/regression/adrie-understanding";

export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({
    case: "Adrie Pouwer / AssetPouwer",
    purpose: "Vastgelegde regressiecheckpoint na afgeronde Discovery en broncontrole.",
    note: "Deze checkpoint hergebruikt de reeds verworven Discovery en broncontext. Er wordt geen nieuwe crawl, gespreksreplay of AI-extractie uitgevoerd.",
    replay: ADRIE_REGRESSION_REPLAY,
    sourceContexts: ADRIE_REGRESSION_SOURCE_CONTEXTS,
    understanding: ADRIE_CHECKPOINT_UNDERSTANDING,
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
}
