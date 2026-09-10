import OpenAI from "openai";
import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";
import { ArtDirection } from "@/lib/lumivey/art-direction";
import { formatPreviewContext } from "@/lib/lumivey/preview-context";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ImageBrief = {
  hero: {
    purpose: string;
    subject: string;
    setting: string;
    composition: string;
    atmosphere: string;
    avoid: string[];
  };

  story: {
    purpose: string;
    subject: string;
    setting: string;
    composition: string;
    atmosphere: string;
    avoid: string[];
  };

  detail: {
    purpose: string;
    subject: string;
    setting: string;
    composition: string;
    atmosphere: string;
    avoid: string[];
  };
};

export async function createImageBrief(
  understanding: LumiveyUnderstanding,
  artDirection: ArtDirection
): Promise<ImageBrief> {
  const response = await openai.responses.create({
    model: "gpt-5.6-terra",

    instructions: `
Je bent de beeldredacteur van Lumivey.

Je ontvangt:
1. Lumiveys interne begrip in gescheiden waarheidslagen;
2. de gekozen art direction.

Maak voor drie beeldplekken een concrete beeldbriefing:
- hero
- story
- detail

DOEL
De beelden moeten helpen bewijzen dat Lumivey DEZE ondernemer heeft begrepen. Ze zijn geen opvulling en geen stockachtige illustratie van de branche.

Kies daarom per slot een andere functie:
- HERO: het sterkste visuele statement van de onderneming of het werk;
- STORY: een beeld dat betekenis, oorsprong, mens, omgeving of verhaal ondersteunt;
- DETAIL: een nabij beeld van iets dat kenmerkend is voor vakmanschap, materiaal, resultaat of werkwijze.

HERKENNING
- Zoek eerst naar bevestigde herkenningsankers, specifieke objecten, materialen, voertuigen, panden, werksoorten, omgevingen, historie of terugkerende visuele motieven.
- Als het gesprek een betekenisvol verhaal bevat, laat minstens één briefing daar visueel op aansluiten als dat eerlijk kan zonder feiten te verzinnen.
- Beelden moeten onderling verschillen in afstand, compositie en functie.
- Vermijd drie veilige beelden die alleen algemeen laten zien wat de branche doet.

WAARHEIDSREGELS
- Bevestigde informatie mag als inhoudelijke basis worden gebruikt.
- Bron-gesteunde visuele ankers, werkzaamheden, materiaal, omgeving of bedrijfsdetails mogen als beeldrichting worden gebruikt wanneer ze concreet uit het bewijs volgen.
- Bron-gesteunde informatie is geen toestemming om ontbrekende details te verzinnen.
- Maak van een bronkandidaat nooit een fictief portret, fictieve locatie, fictief gebouw of verzonnen project.
- Als een aangeleverde bron een echt herkenningsanker toont, mag de briefing dat anker benoemen als bruikbare richting voor een eigen afbeelding of een niet-identiteitsvervangend tijdelijk beeld.
- Onzekerheden en interpretaties mogen niet als zichtbare feiten worden uitgebeeld.
- Bij twijfel: kies een neutraler, eerlijker beeld of laat de briefing terughoudend zijn.

BELANGRIJK
- geen verzonnen personen, locaties, gebouwen of bedrijfsdetails;
- geen generieke stockfotografie;
- geen clichématige vakbeelden;
- geen onnatuurlijke poses;
- geen overdreven reclame-esthetiek;
- geen visuele elementen die niet bij de ondernemer passen;
- geen willekeurige luxeproducten alleen omdat de doelgroep premium is;
- geen merklogo's of herkenbare merkidentiteit genereren als die niet als echt beeld is aangeleverd.

Als een echt portret van de ondernemer niet beschikbaar is, maak daar dan geen fictief portret van.
Een hero hoeft dus niet altijd een persoon te tonen. Het kan werk, materiaal, omgeving of resultaat tonen als dat sterker en eerlijker is.

Denk expliciet aan camera-afstand, licht, uitsnede, textuur, achtergrond en wat visueel dominant moet zijn. Laat de art direction voelbaar terugkomen.

Geef uitsluitend geldige JSON terug.
Geen markdown.
Geen uitleg.
    `,

    input: `
PREVIEW-CONTEXT:

${formatPreviewContext(understanding)}

ART DIRECTION:

${JSON.stringify(artDirection, null, 2)}

Geef exact dit JSON-formaat terug:

{
  "hero": {
    "purpose": "",
    "subject": "",
    "setting": "",
    "composition": "",
    "atmosphere": "",
    "avoid": []
  },
  "story": {
    "purpose": "",
    "subject": "",
    "setting": "",
    "composition": "",
    "atmosphere": "",
    "avoid": []
  },
  "detail": {
    "purpose": "",
    "subject": "",
    "setting": "",
    "composition": "",
    "atmosphere": "",
    "avoid": []
  }
}
    `,
  });

  return JSON.parse(response.output_text) as ImageBrief;
}
