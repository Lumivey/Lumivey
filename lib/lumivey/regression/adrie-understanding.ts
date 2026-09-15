import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";
import { ADRIE_REGRESSION_SOURCE_CONTEXTS } from "@/lib/lumivey/regression/adrie-checkpoint";

export const ADRIE_CHECKPOINT_UNDERSTANDING: LumiveyUnderstanding = {
  entrepreneur: {
    name: "Adrie Pouwer",
    businessName: "AssetPouwer",
    profession: "Strategisch assetmanagementconsultant",
  },
  identity: {
    craftsmanship: [
      "Verbindt strategie met operatie en praktische uitvoerbaarheid.",
      "Technische bedding in elektrotechniek, industriële automatisering en meet- en regeltechniek.",
      "Kijkt eerst wat er werkelijk speelt voordat hij richting geeft.",
    ],
    pride: [
      "Plannen moeten niet alleen op papier kloppen maar buiten ook werken.",
      "Maakt gevolgen voor mensen en budgetten zichtbaar zodat besluiten uitvoerbaar gefaseerd kunnen worden.",
    ],
    story: [
      "Heeft zelf buiten in de kou gewerkt en fabrieken opgestart.",
      "Fotografeert in zijn vrije tijd; zondagochtend in de natuur rustig kijken naar composities weerspiegelt zijn manier van werken.",
    ],
    recognitionAnchors: [
      "Eerst kijken en begrijpen voordat ik oordeel.",
      "Strategie krijgt pas waarde als de operatie ermee kan werken.",
      "Rustige, observerende senioriteit met technische praktijkervaring.",
    ],
  },
  humanSignals: [
    {
      signal: "Rustig en luisterend; eerst waarnemen, dan oordelen.",
      evidence: "Adrie koppelt zijn zondagochtendfotografie en kijken naar compositie zelf aan zijn manier van werken.",
      confidence: "high",
      previewRelevance: "high",
    },
    {
      signal: "Praktijkgerichte geloofwaardigheid.",
      evidence: "Adrie heeft buiten gewerkt, fabrieken opgestart en benadrukt dat plannen in de praktijk moeten werken.",
      confidence: "high",
      previewRelevance: "high",
    },
    {
      signal: "Besluitvorming met oog voor mensen, budget en tempo.",
      evidence: "Bij een grote change maakte hij de impact zichtbaar waarna de verandering over meerdere jaren werd gefaseerd.",
      confidence: "high",
      previewRelevance: "high",
    },
  ],
  business: {
    services: [
      "Strategisch assetmanagement",
      "Assetmanagement op het snijvlak van strategie, tactiek en operatie",
      "Vraagstukken rond elektrotechniek, industriële automatisering en meet- en regeltechniek",
      "Assetmanagement voor industrie, infrastructuur en tunneltechnische installaties",
    ],
    audience: [
      "Organisaties in industrie en infrastructuur met strategische assetmanagementvraagstukken",
      "Bestuur, hoger management en teams die strategie naar uitvoerbare operatie moeten vertalen",
    ],
    existingWebsite: "https://www.assetpouwer.nl/",
    importantNeeds: [
      "Nieuwe website die rust, vertrouwen, senioriteit en uitvoerbaarheid uitstraalt.",
      "Persoonlijk gesprek of koffie als natuurlijke eerste stap.",
    ],
  },
  website: {
    purpose: [
      "Adrie herkenbaar positioneren voor strategische assetmanagementvraagstukken.",
      "De brug tussen strategie en operatie zichtbaar maken.",
      "Professionele bronrijkdom behouden zonder een CV-site te worden.",
    ],
    desiredFeeling: [
      "Rust",
      "Vertrouwen",
      "Overzicht",
      "Senioriteit",
      "Technische geloofwaardigheid",
      "Menselijkheid zonder hobbydominantie",
    ],
    usefulContent: [
      "Strategie die buiten moet werken",
      "Technische expertise en werkvelden",
      "Praktijkervaring buiten en bij fabrieken",
      "Change-case met mensen, budget en fasering",
      "Subtiele persoonlijke observatielaag rond natuur/fotografie",
      "IAM Diploma en relevante professionele bedding als verdieping",
      "Kenniscontext zoals ISO 55000, maturity scans en SAMP waar relevant",
      "Gevalideerde contactmogelijkheden",
    ],
  },
  sourceBacked: {
    businessNames: [
      {
        value: "AssetPouwer",
        evidence: "Bestaande website en Discovery.",
        sourceLabel: "assetpouwer.nl",
        status: "source-backed-unconfirmed",
      },
    ],
    professions: [
      {
        value: "Advies- en interimmanagementbureau op het gebied van assetmanagement",
        evidence: "Bestaande website.",
        sourceLabel: "assetpouwer.nl",
        status: "source-backed-unconfirmed",
      },
    ],
    locations: [
      {
        value: "Parklaan 23, 3941RD Doorn",
        evidence: "Contactfooter op de bestaande website.",
        sourceLabel: "assetpouwer.nl",
        status: "source-backed-unconfirmed",
      },
    ],
    services: [
      {
        value: "Strategisch assetmanagement",
        evidence: "Discovery en bestaande website.",
        sourceLabel: "Discovery + assetpouwer.nl",
        status: "source-backed-unconfirmed",
      },
      {
        value: "Maturity scans, SAMP en ISO 55000-gerelateerde kenniscontext",
        evidence: "Kennis- en artikelpagina's uit de volledige crawl.",
        sourceLabel: "assetpouwer.nl",
        status: "source-backed-unconfirmed",
      },
    ],
    contactDetails: [
      {
        value: "info[at]assetpouwer.nl",
        evidence: "Contactfooter op de bestaande website.",
        sourceLabel: "assetpouwer.nl",
        status: "source-backed-unconfirmed",
      },
      {
        value: "06 - 212 48 948",
        evidence: "Contactfooter op de bestaande website.",
        sourceLabel: "assetpouwer.nl",
        status: "source-backed-unconfirmed",
      },
    ],
    visualAnchors: [],
  },
  facts: [
    "Adrie Pouwer is de ondernemer achter AssetPouwer.",
    "Hij wil vooral benaderd worden voor strategische assetmanagementvraagstukken.",
    "Zijn technische focus ligt onder meer op elektrotechniek, industriële automatisering en meet- en regeltechniek in industrie en infrastructuur.",
    "Hij positioneert zichzelf tussen strategie en operatie.",
    "Hij heeft buiten in de kou gewerkt en fabrieken opgestart.",
    "Hij fotografeert in zijn vrije tijd en verbindt rustig kijken naar compositie aan zijn werkstijl.",
    "In een change-case maakte hij impact op mensen en budgetten zichtbaar waarna de verandering over meerdere jaren werd gefaseerd.",
  ],
  interpretations: [
    "Adries onderscheid zit in rustige observatie, senior technische geloofwaardigheid en de vertaling van strategische keuzes naar uitvoerbare praktijk.",
    "De persoonlijke laag moet op de homepage subtiel zijn: één betekenisvol natuur/fotografie-anker is voldoende.",
    "De oude website bevat rijke professionele bewijsvoering die verdieping moet voeden zonder de nieuwe homepage te overladen.",
  ],
  unknowns: [
    "Welke oude websitefeiten en professionele lidmaatschappen nog actueel zijn moet Adrie vóór livegang bevestigen.",
    "Welke concrete bronfeiten uiteindelijk op homepage versus verdiepingspagina's komen blijft een ontwerpkeuze.",
  ],
  sources: ADRIE_REGRESSION_SOURCE_CONTEXTS,
};
