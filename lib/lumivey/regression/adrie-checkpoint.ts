import { SourceContext } from "@/lib/lumivey/source-context";

export type AdrieRegressionTurn = {
  turn: number;
  user: string;
  assistant: string;
};

export const ADRIE_REGRESSION_REPLAY: AdrieRegressionTurn[] = [
  {
    turn: 1,
    user: "Ik ben Adrie Pouwer. Mijn bedrijf heet AssetPouwer. Ik wil een nieuwe website. Mijn huidige website is https://www.assetpouwer.nl",
    assistant: "Dank je, Adrie. Op je huidige site zie ik een lange ervaring in assetmanagement en een duidelijke verbinding tussen strategie en uitvoering. Waar is die manier van werken voor jou ontstaan: het grotere overzicht combineren met wat in de praktijk echt moet gebeuren?",
  },
  {
    turn: 2,
    user: "Ik doe strategisch assetmanagement. Vooral overal waar een draadje aan zit: elektrotechniek, industriële automatisering en meet- en regeltechniek. Industrie en infra, zoals tunneltechnische installaties.",
    assistant: "Dat maakt je technische bedding heel concreet. Je adviseert dus niet op afstand van de installatie. Wat trok je oorspronkelijk naar juist die technische wereld?",
  },
  {
    turn: 3,
    user: "Ik zit eigenlijk tussen strategie en operatie in. Ik heb zelf buiten in de kou gewerkt en fabrieken opgestart. Dus ik wil niet alleen mooie plannen maken; het moet buiten ook echt werken.",
    assistant: "Dat verschil tussen een plan dat op papier klopt en een plan dat buiten werkt lijkt een belangrijk deel van je manier van adviseren. Welke ervaring uit die praktijk neem je vandaag nog het sterkst mee?",
  },
  {
    turn: 4,
    user: "Ik ben vrij rustig. Ik luister eerst voordat ik iets zeg. In mijn vrije tijd fotografeer ik graag. Zondagochtend het bos in, rustig kijken naar composities. Dat lijkt eigenlijk wel op hoe ik werk: eerst kijken en begrijpen voordat ik oordeel.",
    assistant: "Dat rustige kijken lijkt sterk op je manier van werken: eerst waarnemen wat er echt speelt, dan pas richting kiezen. Wat zie jij in organisaties vaak eerder dan anderen?",
  },
  {
    turn: 5,
    user: "Een voorbeeld: bij een grote change heb ik de directie laten zien wat de echte impact was op mensen en budgetten. Daardoor hebben ze besloten de verandering over meerdere jaren te spreiden in plaats van in één keer door te drukken.",
    assistant: "Dat maakt je waarde tastbaar: gevolgen zichtbaar maken voordat een besluit wordt doorgedrukt. Daardoor kon de directie niet alleen technisch maar ook menselijk en financieel beter faseren.",
  },
  {
    turn: 6,
    user: "Ik wil vooral benaderd worden voor strategische assetmanagementvraagstukken. Mail, telefoon en LinkedIn zijn prima, maar het liefst gewoon eerst een persoonlijk gesprek of koffie.",
    assistant: "Dat past bij hoe je werkt: eerst goed luisteren en begrijpen wat er speelt, en daarna samen richting geven. Een persoonlijk gesprek of koffie hoort daar logisch bij.",
  },
];

export const ADRIE_REGRESSION_SOURCE_CONTEXTS: SourceContext[] = [
  {
    type: "website",
    sourceId: "assetpouwer-regression-checkpoint",
    url: "https://www.assetpouwer.nl/",
    title: "AssetPouwer — vastgelegde broncheckpoint",
    facts: [
      { statement: "AssetPouwer is een onafhankelijk advies- en interimmanagementbureau op het gebied van assetmanagement.", evidence: "Over AssetPouwer en dienstenpagina's op de bestaande website.", status: "source-only" },
      { statement: "Adrie Pouwer verbindt strategisch-tactisch werk met operationele uitvoering en praktische toepasbaarheid.", evidence: "Over Adrie en Over AssetPouwer beschrijven de koppeling tussen strategie, praktijk en werkvloer.", status: "source-only" },
      { statement: "Zijn technische context omvat onder meer elektrotechniek, industriële automatisering en meet- en regeltechniek in industrie en infrastructuur.", evidence: "Bestaande website en Discovery bevestigen de technische domeinen.", status: "source-only" },
      { statement: "De bestaande website noemt ervaring bij onder meer Lloyd's Register en NedTrain Consulting.", evidence: "Over Adrie-pagina noemt deze organisaties in zijn brede loopbaanervaring.", status: "source-only" },
      { statement: "De bestaande website beschrijft meer dan twintig jaar brede ervaring in assetmanagement en aanpalende vakgebieden.", evidence: "Over Adrie-pagina beschrijft de brede opgebouwde ervaring vóór de start van AssetPouwer.", status: "source-only" },
      { statement: "Adrie richtte AssetPouwer in 2010 op als advies- en interimmanagementbureau voor assetmanagement.", evidence: "Over Adrie-pagina noemt 2010 als startjaar.", status: "source-only" },
      { statement: "De website positioneert Adrie als sparringpartner voor bestuur en hoger management én iemand die praktisch invulling op de werkvloer kan geven.", evidence: "Over Adrie-pagina benoemt verbinding tussen niveaus.", status: "source-only" },
      { statement: "Adrie heeft een IAM Diploma in Asset Management en de site vermeldt dat hij tot de eerste vijf kandidaten in Nederland behoorde die dit diploma ontvingen.", evidence: "Diploma-afbeelding en begeleidende tekst op de Over Adrie-pagina.", status: "source-only" },
      { statement: "De site noemt betrokkenheid bij het Institute of Asset Management en de NEN/ISO Asset Management-omgeving.", evidence: "Over Adrie en kennis-/ISO-pagina's.", status: "source-only" },
      { statement: "De website bevat inhoudelijke artikelen en kenniscontext over onder meer ISO 55000, maturity scans, SAMP, service providers, change management en assetmanagement-exploratie.", evidence: "Meerdere kennis- en artikelpagina's uit de volledige crawl.", status: "source-only" },
      { statement: "De bestaande site gebruikt info[at]assetpouwer.nl als contact-e-mail, telefoon 06 - 212 48 948 en adres Parklaan 23, 3941RD Doorn.", evidence: "Contactfooter op meerdere bestaande pagina's.", status: "source-only" },
    ],
    goldCandidates: [
      { signal: "Strategie krijgt pas waarde wanneer de operatie ermee kan werken.", reason: "Dit onderscheidt Adrie van een adviseur die alleen plannen oplevert." },
      { signal: "Eerst kijken en begrijpen voordat hij oordeelt.", reason: "Zijn rustige fotografie-/observatiehouding sluit rechtstreeks aan op zijn werkstijl." },
      { signal: "Praktijkervaring buiten en bij het opstarten van fabrieken.", reason: "Geeft geloofwaardigheid aan zijn nadruk op uitvoerbaarheid." },
      { signal: "Change-case met zicht op mensen en budgetten en fasering over meerdere jaren.", reason: "Concreet bewijs van de brug tussen analyse, besluitvorming en uitvoerbaarheid." },
      { signal: "IAM Diploma en brede professionele bedding.", reason: "Geeft senioriteit en brononderbouwde geloofwaardigheid zonder dat de homepage een CV hoeft te worden." },
      { signal: "Kennisartikelen rond ISO 55000, maturity scans en SAMP.", reason: "Laat zien dat de oude site inhoudelijk rijk is en verdieping kan voeden." },
    ],
    doors: [],
    uncertainties: [
      "Bestaande website-informatie kan verouderd zijn en blijft bronmateriaal totdat Adrie actuele feiten bevestigt.",
      "Niet iedere opleiding, organisatie, norm of oude activiteit hoeft op de homepage terug te komen; selectie moet bewust gebeuren.",
    ],
    assets: [],
  },
];
