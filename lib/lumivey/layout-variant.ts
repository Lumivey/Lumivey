import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";

export type LayoutVariant =
  | "quiet-editorial"
  | "warm-craft"
  | "clean-professional";

export function chooseLayoutVariant(
  understanding: LumiveyUnderstanding
): LayoutVariant {
  const text = JSON.stringify(understanding).toLowerCase();

  let quietEditorial = 0;
  let warmCraft = 0;
  let cleanProfessional = 0;

  const warmCraftSignals = [
    "schilder",
    "hovenier",
    "timmerman",
    "stukadoor",
    "loodgieter",
    "elektricien",
    "garage",
    "detailer",
    "detailing",
    "ambacht",
    "vakmanschap",
    "voorwerk",
    "afwerking",
    "materiaal",
    "handwerk",
    "werkplaats",
    "particulier",
    "bij mensen thuis",
    "kwaliteit",
    "netjes werken",
  ];

  const cleanProfessionalSignals = [
    "consultant",
    "consultancy",
    "advies",
    "strategisch",
    "management",
    "assetmanagement",
    "professional",
    "zakelijk",
    "technisch",
    "organisatie",
    "bedrijf",
    "expertise",
    "interim",
    "dienstverlening",
  ];

  const quietEditorialSignals = [
    "persoonlijk verhaal",
    "visie",
    "filosofie",
    "gedachten",
    "reflectie",
    "ervaring",
    "verhaal",
    "identiteit",
    "persoonlijke ontwikkeling",
    "schrijver",
    "coach",
  ];

  for (const signal of warmCraftSignals) {
    if (text.includes(signal)) {
      warmCraft += 1;
    }
  }

  for (const signal of cleanProfessionalSignals) {
    if (text.includes(signal)) {
      cleanProfessional += 1;
    }
  }

  for (const signal of quietEditorialSignals) {
    if (text.includes(signal)) {
      quietEditorial += 1;
    }
  }

  if (
    warmCraft >= cleanProfessional &&
    warmCraft >= quietEditorial
  ) {
    return "warm-craft";
  }

  if (cleanProfessional >= quietEditorial) {
    return "clean-professional";
  }

  return "quiet-editorial";
}