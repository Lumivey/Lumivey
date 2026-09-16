<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Lumivey mandatory build boot sequence

Before changing product code, read:

1. `docs/active/CURRENT_STATE.md`
2. `docs/active/NON_NEGOTIABLES.md`
3. `docs/active/BUILD_METHOD.md`
4. `docs/active/PREVIEW_WOW_RETENTION.md` for any Preview → Website Brief → v0 → QA work
5. `docs/active/RECOVERY_PLAN.md` while recovery is active
6. the relevant reference/checkpoint for the task

Do not infer a new product direction from the latest chat or local code alone.

Plan v0.4 and proven reference behavior are authoritative unless an explicit later decision changes them.

Before substantial technical work, check:
- real functional goal;
- relevant plan/reference;
- CORE vs commodity;
- whether an existing tool already solves the commodity part better;
- risk of losing facts, provenance, corrections, assets, meaning or preview fidelity.

**Hard WoW preservation rule:** once an entrepreneur approves a Preview, lock the reason for recognition, the entrepreneur-specific creative mechanism, visual motifs and word-image links. The website must preserve them as real web components. A technically attractive website that loses this creative signature fails QA. Do not replace it with a generic site, attach a full-page Preview screenshot as an asset, or invent the same visual motifs for every entrepreneur. Read `docs/active/PREVIEW_WOW_RETENTION.md` before altering either side of this gate.

Do not silently redesign the primary flow.
Do not add new frameworks or services unless they demonstrably improve the current Lumivey core chain.
If implementation conflicts with a non-negotiable, stop and surface the conflict instead of improvising around it.
