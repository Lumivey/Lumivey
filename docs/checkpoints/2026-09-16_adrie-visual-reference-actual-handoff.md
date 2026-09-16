# Adrie visual reference correction — checkpoint (16 September 2026)

Scope: existing v0 chat `jncA2EfHpLj`, corrected version baseline `b_0H3NhLl18e`. No new Lumivey Preview, Discovery, source crawl or new chat.

## Established cause

The earlier correction endpoint submitted only text (`POST /v1/chats/{chatId}/messages` with `{message}`), not the approved Preview image. The screenshot provided by the owner was only in the ChatGPT conversation and not visible to v0. This explains a missing design input; it does not prove v0 will match it when attached.

## Implemented on this branch

- `/regression/adrie/visual-reference` accepts two explicitly chosen separate files from the existing handoff: exact JPG of approved design and separate industrial hero TEST photo. The hero is resized to JPEG without crop if needed; approved reference bytes are not modified.
- The existing client Vercel Blob upload route makes the two images accessible to v0. Clearly warn that they are public asset URLs and the test hero image is not a validated real portrait. Never publish without validation.
- Server route validates same-origin browser request, fixed chat and version, URL host/path, 2 MB file caps, exact reference SHA-256, v0 chat status and absence of prior visual-correction marker; then sends one message with both image attachments and fixed instructions. A network timeout locks the browser UI against blind resubmission. The chat history marker is a second idempotency check, not a transactional lock.
- Preview image is **design reference only**, never a website/OG/background asset; independent hero image is production **test** source. Retain improved actual business service copy and two quality questions. Do not fabricate real logo, credibility claims or contacts.

## Remaining acceptance work

1. Owner chooses the two existing files and explicitly sends once. No send was performed by adding code.
2. Read chat message history and new version ID; measure actual end-to-end time rather than `updatedAt-createdAt` proxy.
3. Check rendered desktop and 390px mobile against the approved Preview: hero one recognizable full head, open corners, connected process, editorial navy band, actual forest image if available, compact proof and contact. Verify standalone test photo owner validation before publication.
4. Examine output source for accidental use of the reference screenshot URL, fictitious logo or unverified details. FAIL if contamination or loss of critical visuals. Independent QA and owner approval required.

## Important limits

This is an internal regression route, not a production customer-facing workflow. Same-origin and exact image-hash validation are not customer authentication. Before general use, add authenticated owner scoping, private reference storage and robust persisted idempotency. The screenshot itself was not committed to source code. The upload route already existed; no general-purpose image module or architecture change was added.
