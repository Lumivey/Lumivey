/** Protect independent QA from screenshots of private v0 loading/auth screens.
 * This is a conservative preflight, not proof that a screenshot is visually correct.
 */
export function validateAdrieMobileScrape(payload: unknown, imageBytes: number): string | null {
  const root = payload as Record<string, any> | null;
  const data = root?.data ?? root;
  const markdown = typeof data?.markdown === "string" ? data.markdown : "";
  const title = typeof data?.metadata?.title === "string" ? data.metadata.title : "";
  const text = `${title}\n${markdown}`;
  if (/\b(sign in|log in|login|unauthorized|forbidden|access denied|authentication required)\b/i.test(title)) {
    return "De mobiele preview toont een aanmeld- of toegangsscherm; de inhoud van de website is niet gerenderd.";
  }
  if (!/asset\s*pouwer|adrie pouwer|strategie die buiten ook werkt/i.test(text)) {
    return "Firecrawl kan de inhoud van AssetPouwer niet bevestigen. Mogelijk is de private v0-preview niet toegankelijk of is de pagina niet geladen.";
  }
  // A full-page 390px screenshot of this text-and-image-heavy test site should not compress to an almost empty image.
  // This only rejects suspiciously tiny renders; sufficiently large renders still require independent visual QA.
  if (imageBytes < 12_000) {
    return "De mobiele screenshot is verdacht klein en waarschijnlijk leeg. Onafhankelijke QA blijft geblokkeerd.";
  }
  return null;
}
