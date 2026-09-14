import OpenAI from "openai";
import { createArtDirection } from "@/lib/lumivey/art-direction";
import { createSiteDescription } from "@/lib/lumivey/site-description";
import { LumiveyUnderstanding } from "@/lib/lumivey/understanding";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type PreviewReferenceImage = {
  name: string;
  dataUrl: string;
};

function compactUnderstanding(understanding: LumiveyUnderstanding) {
  return {
    entrepreneur: understanding.entrepreneur,
    identity: understanding.identity,
    humanSignals: understanding.humanSignals,
    business: understanding.business,
    website: understanding.website,
    facts: understanding.facts,
    interpretations: understanding.interpretations,
    unknowns: understanding.unknowns,
    sourceBacked: understanding.sourceBacked,
  };
}

function collectUploadedReferenceImages(understanding: LumiveyUnderstanding): PreviewReferenceImage[] {
  const sources = Array.isArray((understanding as any).sources)
    ? (understanding as any).sources
    : [];

  const images: PreviewReferenceImage[] = [];

  for (const source of sources) {
    const assets = Array.isArray(source?.assets) ? source.assets : [];
    for (const asset of assets) {
      if (
        asset?.kind === "image" &&
        asset?.origin === "uploaded" &&
        typeof asset?.dataUrl === "string" &&
        asset.dataUrl.startsWith("data:image/")
      ) {
        images.push({
          name: typeof asset.name === "string" ? asset.name : "Aangeleverde foto",
          dataUrl: asset.dataUrl,
        });
      }
    }
  }

  return images.slice(0, 5);
}

async function generateWithReferenceImages(prompt: string, images: PreviewReferenceImage[]) {
  const content: any[] = [
    {
      type: "input_text",
      text: `${prompt}\n\nAANGELEVERDE FOTO'S\nDe onderstaande beelden zijn door de ondernemer aangeleverd als visuele bron. Gebruik ze als echte referentiebeelden. Behoud de persoon herkenbaar en verander zijn identiteit niet. Kies zelf welke beelden de compositie het beste ondersteunen; je hoeft ze niet allemaal te gebruiken. Genereer nu één Lumivey Preview met de image_generation tool.`,
    },
    ...images.map((image) => ({
      type: "input_image",
      image_url: image.dataUrl,
      detail: "high",
    })),
  ];

  const response: any = await openai.responses.create({
    model: "gpt-5.6-terra",
    input: [{ role: "user", content }],
    tools: [
      {
        type: "image_generation",
        model: "gpt-image-2",
        size: "1024x1536",
        quality: "medium",
        action: "auto",
      },
    ] as any,
  } as any);

  const imageCall = Array.isArray(response.output)
    ? response.output.find((item: any) => item?.type === "image_generation_call" && typeof item?.result === "string")
    : null;

  return imageCall?.result || "";
}

export async function createLumiveyPreview(understanding: LumiveyUnderstanding) {
  const [site, artDirection] = await Promise.all([
    createSiteDescription(understanding),
    createArtDirection(understanding),
  ]);

  const highHumanSignals = (understanding.humanSignals || [])
    .filter((item) => item.previewRelevance === "high")
    .slice(0, 4);

  const referenceImages = collectUploadedReferenceImages(understanding);

  const prompt = `
Create ONE polished visual artist impression of a future website for an entrepreneur.
This is a Lumivey Preview: a high-fidelity website concept image whose purpose is recognition and WoW before the real website is built.

IMPORTANT
- Output a single vertical website screenshot / concept board, not browser chrome and not a collage of multiple alternatives.
- It must look like a believable future website, but it is an image, not working HTML.
- The approved real website will later be built by a production engine from this creative direction, so keep the concept technically realistic for modern responsive web development.
- Do not invent factual claims, contact details, awards, clients, prices, addresses, opening hours or biography.
- Unknown facts must not appear as invented copy.
- Prioritize identity, atmosphere, visual hierarchy, image/story combination and entrepreneur-specific recognition.
- Avoid generic template aesthetics.
- Avoid excessive dashboard/card UI unless the business genuinely calls for it.
- Use concise Dutch website copy where copy is visible.
- The design should be strong enough that the entrepreneur can react: “Ja, dit ben ik.”

LUMIVEY HOMEPAGE BALANCE RULE
- The homepage should normally combine BOTH a professional anchor and a personal recognition anchor when the evidence supports both.
- The professional anchor must make the entrepreneur's real work/domain credible and concrete.
- The personal anchor must make the homepage feel like this specific human, not merely a website for this profession.
- A personal anchor can be a person, first name(s), meaningful object, scene, phrase, story cue, ritual, atmosphere or visual motif.
- Do NOT use the same device for every entrepreneur. A handwritten signature may fit one person and be wrong for another.
- If the current understanding explicitly says the entrepreneur does not want personal material on the homepage, respect that and do not force it.
- Personal meaning must not erase professional credibility; professional content must not flatten the entrepreneur into a generic sector template.

HUMAN RECOGNITION RULE
When HIGH-RELEVANCE HUMAN SIGNALS are provided below, use at least one of them meaningfully in the VISUAL COMPOSITION or IMAGE LANGUAGE, not only as copy, unless doing so would be inappropriate or technically unrealistic.
If a high-relevance signal concerns a personal ritual, hobby or way of observing the world, it may shape atmosphere, imagery, pacing or composition, but must never be presented as a service unless the evidence says it is one.
Do not reduce a meaningful human signal to a decorative hobby card.
Never extend the signal beyond its evidence.

SOURCE-RICHNESS RULE
- Preserve relevant confirmed source-backed facts instead of silently dropping them.
- If confirmed contact details are available, the concept may show them in a realistic contact/footer treatment; never invent missing values.
- Use distinctive professional context from sources when it helps recognition, but treat the old website as evidence rather than a design blueprint.

REAL-IMAGE RULE
- If entrepreneur-supplied photos are available, they are visual source authority and should be preferred over invented replacements.
- Uploaded photos are a SOURCE POOL, never a quota. Curate hard; do not show an image merely because it was supplied.
- Do not repeat the same person across the homepage just because several photos are available. Normally show that person only once or twice; use a third appearance only when it adds a clearly different, evidence-backed role or story beat.
- Prefer variation after the main personal image: technical environment, meaningful detail, work context or atmosphere can carry identity without repeating the face.
- Do not change a real person's identity, facial features or apparent age.
- Do not unintentionally crop off the head or face in prominent compositions.
- A personal hobby image may support identity and atmosphere but must never be presented as a professional service unless confirmed.

RECOGNIZABILITY TEST
Before finalizing the concept, ask yourself: if the company name and profession were covered, would this still feel recognizably like this entrepreneur? If not, strengthen the evidence-backed personal layer without inventing facts.

HIGH-RELEVANCE HUMAN SIGNALS
${JSON.stringify(highHumanSignals, null, 2)}

CURRENT LUMIVEY UNDERSTANDING
${JSON.stringify(compactUnderstanding(understanding), null, 2)}

CREATIVE DIRECTION
${JSON.stringify(artDirection, null, 2)}

CONTENT DIRECTION
${JSON.stringify(site, null, 2)}

MAKEABILITY RULE
Do not show visual or interaction ideas that a modern production engine such as v0/Vercel could not reasonably reproduce in a responsive website. Prefer strong composition, typography, photography, spacing and color over impossible effects.
`;

  let imageBase64 = "";

  if (referenceImages.length > 0) {
    imageBase64 = await generateWithReferenceImages(prompt, referenceImages);
  } else {
    const result = await openai.images.generate({
      model: "gpt-image-2",
      prompt,
      size: "1024x1536",
      quality: "medium",
    });
    imageBase64 = result.data?.[0]?.b64_json || "";
  }

  if (!imageBase64) {
    throw new Error("Geen artist impression ontvangen.");
  }

  return {
    impression: {
      id: `impression-${Date.now()}`,
      imageDataUrl: `data:image/png;base64,${imageBase64}`,
      headline: site.title || "Eerste impressie",
      rationale: [
        ...highHumanSignals.map((item) => item.signal),
        ...(artDirection.personality || []).slice(0, 3),
        ...(understanding.identity.recognitionAnchors || []).slice(0, 3),
      ].filter(Boolean).slice(0, 6),
      createdAt: new Date().toISOString(),
    },
    artDirection,
    siteDirection: site,
    referenceImageCount: referenceImages.length,
  };
}
