# Checkpoint — Adrie approved Preview evidence + QA UI

Date: 16 September 2026. Scope: primary circle only, no new Preview or v0 generation was run in this implementation.

## Implemented and compiled

- `lib/lumivey/build-snapshot.ts`: IndexedDB record keyed by v0 chat ID, containing exact approved Preview Blob URL, matching locked PreviewSignature, the returned Website Brief, evaluator status, explicit human WARN approval, saved timestamp, and optionally version-bound QA outcome. Validation fails closed on mismatch or missing approval.
- `app/regression/adrie/preview/page.tsx`: after the existing build API returns, captures the actual returned Brief/signature and approved image URL and saves the record before presenting it as recovered QA context. A storage failure shows an explicit error **and the started v0 chat ID**, so the user is never told to re-build just to retry storage. The link to status appears only when the evidence is saved.
- `app/regression/adrie/build-status/page.tsx`: on chat-ID loads exactly the matching local record and shows whether evidence exists. Only if evidence AND completed version ID exist does it enable the independent QA action; passes original Preview, locked signature, facts/assets and expected version ID to the existing orchestrator. Version mismatch blocks the result. QA result and correction prompt are stored with the version ID. No correction message is sent automatically, no publish approval is issued.
- Vercel GitHub commit status for these changes: success on commit `3175a7c00dd7ad44ec479e2ac1bfe4da9166d38a`. This establishes build compilation, **not live QA**.

## Honest limits / next dependency

- This is local browser/origin IndexedDB persistence for the regression test, not durable account-level server storage. Clearing browser data, changing device/browser or origin loses it. Do not describe as production persistence.
- The ORIGINAL pre-change v0 chat `jncA2EfHpLj` was created before this storage existed. No exact original approved Preview image URL, PreviewSignature and Brief were verified/recovered from accessible project records. The older chat must not be auto-labelled approved from its screenshot, a generic motif description, or a newly generated Preview. It remains FAIL, QA blocked until the original approved artifact and matching signature are recovered or explicitly re-approved as an honest new baseline (not retroactive proof).
- The existing desktop screenshot and mobile full-page 390px render were shown live in the user's screenshots; screenshots alone do not prove mobile interaction/contact works or that WoW is preserved.
- No new v0 generation, website correction, automated completion-triggered QA or historical recovery happened in this change. QA can be triggered manually for future builds with correctly saved artifacts.

## Next focused step

Recover the original approved Adrie Preview from the existing owner's approved image/Blob history if verifiably linked, and the locked signature from the original build response/message if possible. Bind only on confirmed IDs and approval evidence. If unavailable, transparently request the exact existing approved Preview image from the owner ONCE; do not ask them to regenerate. Then compare the existing v0 version, send a single targeted correction to the same chat only after review, and verify with desktop/mobile QA plus latency logs. Before expanding beyond internal regression, implement authenticated account-level private storage and auto-trigger after completion.
