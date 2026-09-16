"use client";

import { useState } from "react";

const CHAT_ID = "jncA2EfHpLj";
const V0_URL = "https://v0.app/ruud-s-lumivey1/chat/assetpouwer-website-build-jncA2EfHpLj";

/** Human-reviewed direction from the actual approved 16 Sept image and the original source checkpoint.
 * This is a correction instruction, not a fabricated locked signature or retroactive AI QA.
 * Never upload the approved full-page screenshot as a production image.
 */
const CORRECTION = `LUMIVEY — CORRECT EXISTING ASSETPOUWER VERSION IN THIS SAME v0 CHAT.
Do NOT start a new chat, recreate the website from scratch, regenerate Discovery or generate a new artist impression. Update the existing code. The approved Lumivey image shown to the owner is design authority. Do not embed any full-page screenshot in the website or use it as a giant background image. Produce genuine responsive HTML/CSS/SVG components. Preserve known working content and behavior.

TWO INDEPENDENT HARD QUALITY GATES:
A. Does Adrie recognize his technical expertise, calm character, working method and the specific approved creative design?
B. Does a prospective client understand WHAT AssetPouwer offers, FOR WHOM, WHEN to engage Adrie, why the claims are credible and HOW to contact him?
Passing B by turning A into a generic consultant template is a FAIL. Passing A while hiding the services is also a FAIL.

RECONSTRUCT THE APPROVED HOMEPAGE IN THIS EXACT EDITORIAL SEQUENCE:
1 HERO: The actual approved composition has AssetPouwer navigation at top, the headline 'Strategisch assetmanagement dat ook buiten moet werken.' on the left, ONE prominent recognizable full-head photograph of Adrie walking on an industrial installation on the right, subtle open frame corners, and the overlaid caption 'Strategie ↔ operatie' in the lower-right of the image. Use one authentic professional photograph; never crop off Adrie's head or hide his face. Fix the current disconnected portrait-in-a-box layout. No second prominent recognizable Adrie image anywhere on the homepage.
2 METHOD: 'Eerst kijken. Dan richting geven.' Use explanatory copy on left and technical blue-pipe detail on right. Implement ONE continuous thin-line progression with four connected stages: 'Verkennen & luisteren' → 'Analyse & inzicht' → 'Richting & keuzes' → 'Besluit & uitvoeren', with small focus/reticle markers. No generic four service cards. On mobile, stack the same connected process vertically if needed.
3 DARK EDITORIAL PRACTICE SECTION: Large quote on left: 'Een plan is pas sterk als het in de praktijk werkt.' On right: compact numbered account connecting analysis to executable change. The actual Discovery example: for a substantial change, Adrie made the impact on people and budgets visible to management, enabling a decision to phase it over several years. Do not invent numeric results, customer identity or testimonials. Rebuild the asymmetrical dark-navy block and focus motif rather than generic alternating sections.
4 COMPACT PROFESSIONAL PROOF BAND: A low-height light band, not three large consultancy cards. Explain independent asset-management advice and interim management, and relevant technical competence. Existing website SOURCE-ONLY facts include 2010 founding and an IAM Diploma; they require explicit current owner validation before appearing as published factual claims. Knowledge context includes ISO 55000, maturity scans, SAMP and change management; do not falsely imply formal certifications in those topics. Do not claim projects, companies or services not confirmed.
5 PERSONAL FOOTNOTE: One comparatively compact landscape/forest image, NO SECOND AD RIE PORTRAIT. 'Op zondagochtend het bos in. Rustig kijken naar composities.' Photography is a personal hobby and a metaphor for his observant method, NEVER a paid service. Subtle framing marks only; this section must not rival the professional hero in size or importance.
6 CONTACT: Rebuild the calm green 'Eerst eens kennismaken.' closing band and a clear, working contact route. Show only verified, up-to-date contacts: the old site's email, phone and address are source-only and need confirmation; never fabricate alternatives, never publish an unverified address as fact. If verification is missing, retain a truthful available contact route and explicitly flag the missing datum.

VISITOR-FACING COMMERCIAL CLARITY — weave into the existing sections, not another landing-page template:
- The company supplies independent advice and interim management in strategic asset management, linking strategy/tactics with operational reality.
- Relevant contexts in Discovery: organisations with technical assets in industry and infrastructure, especially electrotechnics, industrial automation, instrumentation and control, including tunnel technical installations. Do not imply an exclusive audience or list fake clients.
- Make the engagement trigger concrete: decisions about technical asset strategy, a disconnect between boardroom policy and plant-floor practice, or a major change whose human, technical and budget impact needs to become explicit. These are descriptions inferred from the actual Discovery; do not present them as verified quantitative outcomes or an exhaustive service catalogue.
- Demonstrate value through the genuine change example and his working method (listen/observe → analyse → decide → executable plan). No fabricated ROI, testimonials, diploma or years-of-experience claims.
- A reader should understand the offer, intended context, credible evidence and contact next step from the actual homepage, without forcing Adrie to disclose a personal life story.

BRAND AND TRUTH HARD STOP:
- The genuine original AssetPouwer logo is a brand asset. Current handoff has not verified an actual production logo file. Do not substitute a newly invented logo or imply the text treatment is the original logo. If the original file is absent, explicitly report 'Original logo asset missing; owner file/approval required', and keep a neutral temporary wordmark clearly marked as provisional in the implementation notes, NOT as owner-approved branding.
- Only use original supplied images in appropriate roles. If the original approved hero photo is unavailable in existing chat attachments, say so; do not synthesize Adrie's face.
- Old website source-only facts (2010, IAM Diploma, email, phone, address) require owner confirmation before publication. Do not infer current validity from scraped content or the artist impression alone.
- Protect meaningful typography and negative space but eliminate huge empty blocks and unnecessary repetition. Make a genuine mobile composition at 390px with readable type, working navigation/CTA and uncropped people. No made-up information.

DELIVERABLE:
Edit THIS existing v0 project only; return its updated preview URL and briefly identify the actual file/component changes, which approved design motifs survived, any unavailable original logo/hero assets, and any unverified factual claims omitted. Check desktop AND 390px mobile renders before claiming completion. The independent Lumivey QA and owner approval are separate; never self-assert a QA PASS. Never suggest that a rendered screenshot alone proves that a contact link functions.`;

export default function AdrieExistingCorrectionPage() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function copyCorrection() {
    try {
      await navigator.clipboard.writeText(CORRECTION);
      setCopied(true);
      setError("");
    } catch {
      setCopied(false);
      setError("Automatisch kopiëren lukt niet. Selecteer de opdracht hieronder en kopieer deze handmatig.");
    }
  }

  return <main className="home"><section className="intro" style={{ maxWidth: 950 }}>
    <p className="eyebrow">Adrie regressie — gerichte correctie</p>
    <h1>Herstel dezelfde v0-build</h1>
    <p className="lead">Deze instructie behoudt het goedgekeurde Lumivey-ontwerp én maakt de zakelijke propositie begrijpelijk. Er wordt op deze pagina niets gegenereerd, verstuurd of gepubliceerd.</p>
    <p><strong>Bestaande chat:</strong> {CHAT_ID}</p>
    <p><strong>Ontwerpanker:</strong> de door Ruud op 16 september gedeelde AssetPouwer-preview. De oude chat mist het oorspronkelijke opgeslagen goedkeuringsdossier; dit is een menselijke herstelopdracht, geen achteraf verzonnen QA-goedkeuring.</p>
    <div style={{ border: "1px solid #d8d8d2", padding: 20, borderRadius: 14, margin: "24px 0" }}>
      <h2>Wat je doet</h2>
      <p>Kopieer de gerichte opdracht. Open daarna de bestaande v0-chat en plak de opdracht als één vervolgbericht. Upload de volledige Preview-screenshot niet als productieasset.</p>
      <button type="button" onClick={copyCorrection}>{copied ? "Opdracht gekopieerd" : "Kopieer gerichte correctieopdracht"}</button>
      <p><a href={V0_URL} target="_blank" rel="noreferrer">Open dezelfde AssetPouwer-chat in v0 →</a></p>
      {error && <p role="alert">{error}</p>}
      <p className="quiet">Dit verstuurt zelf niets en maakt geen nieuwe v0-chat. Na correctie moet de echte desktop- en mobiele website opnieuw worden beoordeeld.</p>
    </div>
    <h2>De exacte opdracht</h2>
    <textarea aria-label="V0-correctieopdracht" readOnly value={CORRECTION} rows={22} style={{ width: "100%", boxSizing: "border-box", padding: 16, fontFamily: "monospace", lineHeight: 1.5 }}/>
    <p><a href={`/regression/adrie/build-status?chatId=${CHAT_ID}`}>Terug naar bestaande buildstatus en renders →</a></p>
  </section></main>;
}
