import OpenAI from "openai";
import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type PreviewReadiness = {
  ready: boolean;
  confidence: "low" | "medium" | "high";
  reason: string;
  strongSignals: string[];
  missingForRecognition: string[];
};

export async function assessPreviewReadiness(
  understanding: LumiveyUnderstanding
): Promise<PreviewReadiness> {
  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: `
Je beoordeelt voor Lumivey of er voldoende betekenisvol begrip is om een eerste homepage-preview te tonen waarin de ondernemer zichzelf kan herkennen.

Dit is GEEN volledigheidscheck en GEEN intakecheck.
Administratieve volledigheid is niet vereist.
Een telefoonnummer, volledig adres, KvK-nummer of alle diensten hoeven niet bekend te zijn.

De centrale vraag is:
KAN LUMIVEY NU EEN EERSTE HOMEPAGE MAKEN WAARVAN DE ONDERNEMER REDELIJKERWIJS KAN DENKEN: "Ja, dit ben ik / dit is mijn onderneming"?

Beoordeel vooral of er samenhang is tussen meerdere van deze betekenisvolle lagen:
- wie de ondernemer of organisatie is;
- wat hij/zij doet;
- waarom of vanuit welke drijfveer;
- vakmanschap of kenmerkende werkwijze;
- verhaal, geschiedenis of ambitie;
- herkenningsankers;
- gewenste verandering of richting voor de website;
- bestaand beeldmateriaal, website of andere bronnen die herkenning kunnen ondersteunen.

BELANGRIJK:
- Een bron kan sterke feitelijke of visuele grondstof leveren, maar vervangt geen persoonlijk begrip wanneer de identiteit of bedoeling nog onduidelijk is.
- Een starter zonder website kan wél ready zijn als gesprek + aangeleverde beelden genoeg samenhang geven.
- Een ervaren ondernemer zonder website kan wél ready zijn als het gesprek genoeg herkenning oplevert.
- Een ondernemer met een bestaande website kan veel broninformatie hebben en tóch niet ready zijn als Lumivey de mens, veranderwens of betekenis nog nauwelijks begrijpt.
- Veel informatie is niet hetzelfde als goed begrip.
- Eén oppervlakkige beurt plus een URL is normaal gesproken onvoldoende voor een WoW-preview.
- Zeg alleen ready=true wanneer er genoeg basis is voor herkenning, niet alleen voor een correcte zakelijke samenvatting.

Gebruik alleen wat in het interne begrip staat. Verzin niets.

Geef uitsluitend geldige JSON terug, zonder markdown of uitleg.
    `,
    input: `
INTERNE BEGRIP:
${JSON.stringify(understanding, null, 2)}

Geef exact dit JSON-formaat terug:
{
  "ready": false,
  "confidence": "low",
  "reason": "",
  "strongSignals": [],
  "missingForRecognition": []
}
    `,
  });

  return JSON.parse(response.output_text) as PreviewReadiness;
}
