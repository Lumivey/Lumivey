# Adrie same-chat API correction — checkpoint (16 Sept 2026)

## Objective and evidence

Original v0 chat `jncA2EfHpLj` renders desktop and mobile but has rejected quality. UI displays old version read-only; its Duplicate Chat created an empty new chat, not usable recovery. The owner provided the actual approved artist impression as an image in the project conversation. The v0 Platform API docs at https://v0.dev/docs/v0-platform-api/chats/chats.sendMessage define POST `/v1/chats/{chatId}/messages` for continuing an existing chat; they do not establish that this specific legacy chat accepts modification.

## Implemented on main

- `app/api/regression/adrie/correct-existing/route.ts`: narrowly scoped same-origin browser POST to the fixed original ID, accepts no user-defined prompts, checks an explicit confirmation and the current completed v0 version ID before sending a single fixed correction message through the already-existing `correctV0Build` adapter. Contains recognition/WoW + client clarity + brand/fact restrictions. Does NOT upload the full-page preview as a production asset. Responds with submitted status and API submission latency, not fictitious generation/QA time.
- `app/regression/adrie/send-correction/page.tsx`: reads the existing API status and requires a visible user click to submit. A sessionStorage attempt marker is set before sending to avoid blind retries after timeout; UI directs verification back to the original build-status page. No new v0 chats are created by this code.
- Commits: `320af2a25f3a6d3317844f56e4e08adc99e92651`, `4aaf55fda27b1c5c3780b6ef1e465077fb902f6b`. GitHub Vercel status on the latter was SUCCESS (build compilation), not a live API proof.

## Not yet proven / important security boundary

- The assistant cannot issue HTTP POST to this deployed route with the currently exposed connectors; Vercel's read-only fetch still returned 403. **The correction was NOT submitted.** One direct owner click on the internal test page is required to exercise the POST. Do not claim v0 accepted the correction until an actual submitted:true response.
- The route is hardcoded to one original chat and has Origin/Sec-Fetch guards, but does not constitute account-level authentication or distributed idempotency. Keep scoped to internal regression; before production, add genuine auth, a transactional dedupe/approval record and rate limiting. Do not generalize this endpoint for other entrepreneurs.
- The original approved Preview/signature/brief do not have proven original persistent association with this old chat, so this is a human-directed recovery rather than a retroactively certified QA baseline. Re-evaluate the actual resulting desktop + mobile and have owner approve before any publication.
- The public `/regression/adrie/correct-existing` page still contains a copy-and-paste path; for the old read-only chat, use `/regression/adrie/send-correction` instead.

## Next

Owner opens https://lumivey.vercel.app/regression/adrie/send-correction and presses the single explicit correction button. If v0 reports a conflict/read-only, do not retry or regenerate; inspect the sanitized status/log and choose a compatible version or verified recoverable file route. If v0 accepts, poll existing chat/version, capture desktop + mobile screenshots, assess against supplied approved artist impression and both quality gates, and correct remaining defects within same chat if supported. Track actual generation latency, not createdAt/updatedAt proxy alone.
