# Adrie visual transfer: verified cause and safe remedy (2026-09-16)

## Verified in source
- `app/api/regression/adrie/correct-existing/route.ts` invokes `correctV0Build(CHAT_ID, CORRECTION)` with only a plain text instruction. No approved Preview image was attached in the corrective request. The v0 model therefore could not inspect its actual composition in that message. This is verified causality for the *missing visual input*, not proof that supplying an image alone will solve fidelity.
- `lib/lumivey/v0-adapter.ts` originally deliberately removed the full-page Preview from **production assets** because earlier v0 turned the screenshot itself into a website image. Valid safety concern, but reference and production assets need to be handled as different roles, not conflated.
- Owner screenshots of corrected v0 version `b_0H3NhLl18e`: commercial content improved, desktop hero head remains cropped, distinctive approved editorial layout / tech-detail / nature scene and meaningful framing lost; unverified logo. No formal QA pass or >85% proven.

## Remedy contract
1. Let the owner supply the SAME already-approved image once as a **non-production visual reference** to the existing chat; never trigger another Discovery/Preview/full rebuild. Use v0 API documented `attachments:[{url}]` for chat follow-up, while explicit prompt forbids referencing the design-reference URL in code, `img`, CSS, metadata or embedding the entire screenshot.
2. Explicitly instruct a *small visual delta* preserving the improved commercial copy, contact structure and true sourced facts. Require hero face safety, editorial asymmetry, frame/focus lines, photo/technical-detail and small nature beat. If the actual source hero/logo is missing, flag rather than synthesize an Adrie face or invent a brand.
3. Prevent repeat submissions with a server-side message-marker check and expected-version lock, as well as a browser attempt latch. Require explicit owner click, note that v0 credits are spent on generation.
4. After generation, compare actual desktop and mobile against approved reference. Ref-image URL must not appear in generated code. Publication remains blocked until independent QA and owner approval.

Note: v0 official v1 `POST /chats/{chatId}/messages` supports optional attachments (each URL). v2 docs also show the same, but beta should not be adopted during this repair.
