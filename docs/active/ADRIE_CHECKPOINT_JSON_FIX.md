# Adrie checkpoint JSON fix

The preview checkpoint must not depend on a fresh AI `extractUnderstanding` call just to restore already-acquired project state. That call could fail on model JSON formatting and unnecessarily reintroduce latency and nondeterminism.

The checkpoint route now restores a deterministic saved Understanding object assembled from the already-validated Adrie Discovery and source checkpoint. Preview iteration can therefore start without a crawl, replay, or fresh Understanding extraction.
