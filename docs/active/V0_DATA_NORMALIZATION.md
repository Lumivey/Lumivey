# v0 data-normalization guard

Lumivey treats AI-extracted Understanding as runtime data, not as trusted TypeScript types.

Before Website Brief → v0 production, values read from AI/source-backed structures must be normalized defensively:

- never call string methods such as `.trim()` directly on model-produced values without checking/coercing the runtime type;
- unexpected objects/arrays/nulls must not crash the production handoff;
- malformed candidates may be stringified only when that is semantically safe; otherwise ignore them and keep the fact missing rather than inventing data;
- contact extraction must accept only validated string values after normalization;
- a type annotation is not evidence that model-generated JSON obeyed that type at runtime.

This is a generic production rule, not an Adrie-specific workaround.
