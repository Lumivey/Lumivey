import OpenAI from "openai";
import {
  EMPTY_UNDERSTANDING,
  LumiveyUnderstanding,
} from "@/lib/lumivey/understanding";
import {
  formatSourceContextsForPrompt,
  SourceContext,
} from "@/lib/lumivey/source-context";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function extractUnderstanding(
  messages: ChatMessage[],
  sourceContexts: SourceContext[] = []
): Promise<LumiveyUnderstanding> {
  if (!messages.length) {
    return {
      ...EMPTY_UNDERSTANDING,
      sources: sourceContexts,
    };
  }

  const transcript = messages
    .map((message) => {
      const speaker =
        message.role === "user" ? "Ondernemer" : "Lumivey";

      return `${speaker}: ${message.content}`;
    })
    .join("\n\n");

  const sourcePrompt =
    formatSourceContextsForPrompt(sourceContexts);

  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    instructions: `
Je helpt Lumivey om intern bij te houden wat werkelijk bekend is.

Dit is geen gesprek met de ondernemer.
Dit is interne interpretatie.

Maak streng onderscheid tussen vier lagen:

1. BEVESTIGDE FEITEN
Wat de ondernemer zelf duidelijk heeft gezegd of expliciet heeft bevestigd.
Deze informatie mag naar entrepreneur, business, website en facts.

IDENTITEIT IS ALLEEN BEVESTIGD UIT HET GESPREK
De velden identity.motivation, identity.craftsmanship, identity.pride, identity.story en identity.recognitionAnchors mogen ALLEEN worden gevuld wanneer de ondernemer zelf de betekenis heeft uitgesproken of ondubbelzinnig heeft bevestigd.

ABSOLUTE BETEKENISREGEL
- Een aangeleverde foto, website of document kan een signaal, herkenningsanker, goudkandidaat of deur opleveren, maar nooit automatisch persoonlijke betekenis.
- Alleen het feit dat de ondernemer een bus, logo, project, foto of document aanlevert betekent NIET dat hij daar trots op is.
- Alleen het feit dat iets opvallend of herkenbaar in een bron staat betekent NIET dat het voor de ondernemer een recognitionAnchor in zijn identiteit is.
- Zet bron-afgeleide herkenningssignalen daarom in sourceBacked.visualAnchors, niet in identity.recognitionAnchors.
- Zet mogelijke trots uit bronnen of interpretatie nooit in identity.pride voordat de ondernemer zelf heeft gezegd dat hij daar trots op is of dit duidelijk heeft bevestigd.
- Formuleringen van Lumivey in eerdere assistentberichten tellen niet als bevestiging door de ondernemer.
- Een vraag als "ben je hier trots op?" of "zit hier een verhaal achter?" is nadrukkelijk GEEN bewijs dat het antwoord ja is.

2. INTERPRETATIES
Wat redelijk uit het gesprek lijkt te volgen, maar niet letterlijk als feit is uitgesproken.
Interpretaties mogen voorzichtig mogelijke betekenis benoemen, maar mogen nooit als bevestigde identity-velden worden opgeslagen.

3. SOURCE-BACKED KANDIDATEN
Concrete informatie die aantoonbaar uit een externe bron komt, maar nog NIET door de ondernemer is bevestigd.
Zet zulke informatie NIET in facts en vul er de bevestigde hoofdvelden niet mee.
Zet deze informatie in sourceBacked met exact bewijs.

Gebruik sourceBacked voor concrete preview-relevante kandidaten zoals:
- bedrijfsnaam;
- beroep of bedrijfssoort;
- plaatsnaam;
- diensten;
- contactgegevens;
- visuele herkenningsankers zoals logo, woordmerk, opvallende kleuren of herkenbare bedrijfsbelettering.

Voor ieder sourceBacked-item geldt:
- value moet letterlijk of ondubbelzinnig uit de bron volgen;
- evidence moet het concrete bewijs noemen;
- status is altijd "source-backed-unconfirmed";
- sourceLabel noemt waar mogelijk de website of bestandsnaam.

BELANGRIJK BIJ TEKST UIT AFBEELDINGEN
- Promote GEEN bedrijfsnaam, persoonsnaam, slogan, telefoonnummer of andere tekst naar sourceBacked wanneer de bronanalyse aangeeft dat de tekst onzeker, gedeeltelijk leesbaar, vermoedelijk of niet volledig zeker is.
- Gebruik bij twijfel alleen het betrouwbaar leesbare deel als visueel anker of laat het item weg uit sourceBacked.
- Zet de onzekerheid expliciet in unknowns.
- Als de ondernemer zelf een naam noemt en een afbeelding lijkt een afwijkende naamvorm te tonen, kies niet automatisch één van beide. Houd de bronlezing onzeker totdat de ondernemer bevestigt wat correct is.

4. ONBEKEND / NOG TE BEVESTIGEN
Maak onderscheid tussen echt onbekend en informatie waarvoor al een bronkandidaat bestaat.
Noem een veld NIET simpelweg "onbekend" als sourceBacked al een concrete kandidaat bevat.
Formuleer dan bijvoorbeeld: "Nog te bevestigen: bedrijfsnaam uit de bron" of "Nog te bevestigen: Leeuwarden als vestigingsplaats of werkgebied".

Verzin niets.
Vul geen gaten op.
Maak geen marketingverhaal.
Maak geen aannames over karakter, kwaliteit, doelgroep of bedrijfsvoering zonder voldoende grond.

Zoek alleen naar informatie die later kan helpen om een website te maken waarin de ondernemer zichzelf herkent.

Een korte reactie als "ja", "klopt" of "inderdaad" mag alleen als bevestiging gelden wanneer uit de direct voorafgaande context ondubbelzinnig duidelijk is welk concreet bronfeit of welke concrete betekenis wordt bevestigd.

Geef uitsluitend geldige JSON terug.
Geen uitleg.
Geen markdown.
    `,
    input: `
Lees dit gesprek:

${transcript}

EXTERNE BRONCONTEXT
${sourcePrompt}

Geef exact dit JSON-formaat terug:

{
  "entrepreneur": {
    "name": "",
    "businessName": "",
    "profession": "",
    "location": ""
  },
  "identity": {
    "motivation": [],
    "craftsmanship": [],
    "pride": [],
    "story": [],
    "recognitionAnchors": []
  },
  "business": {
    "services": [],
    "audience": [],
    "existingWebsite": "",
    "importantNeeds": []
  },
  "website": {
    "purpose": [],
    "desiredFeeling": [],
    "usefulContent": []
  },
  "sourceBacked": {
    "businessNames": [
      {
        "value": "",
        "evidence": "",
        "sourceLabel": "",
        "status": "source-backed-unconfirmed"
      }
    ],
    "professions": [],
    "locations": [],
    "services": [],
    "contactDetails": [],
    "visualAnchors": []
  },
  "facts": [],
  "interpretations": [],
  "unknowns": []
}

Gebruik lege strings of lege arrays wanneer iets niet bekend is.
Verwijder het voorbeelditem uit businessNames wanneer er geen concrete kandidaat is.
    `,
  });

  const parsed = JSON.parse(
    response.output_text
  ) as LumiveyUnderstanding;

  return {
    ...parsed,
    sourceBacked: parsed.sourceBacked ?? EMPTY_UNDERSTANDING.sourceBacked,
    sources: sourceContexts,
  };
}
