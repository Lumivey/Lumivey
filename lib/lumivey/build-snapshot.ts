import type { PreviewSignature } from "@/lib/lumivey/preview-signature";

/** Local regression evidence: no server upload, no third-party API, no screenshot regeneration.
 * Scoped to this browser/origin. This is NOT yet an account-level production dossier.
 */
export type BuildSnapshot = {
  schemaVersion: 1;
  chatId: string;
  previewId: string;
  approvedPreview: string;
  previewSignature: PreviewSignature;
  brief: Record<string, unknown>;
  approval: { evaluator: "PASS" | "WARN"; humanApproved: boolean };
  savedAt: string;
  qa?: { versionId: string; overall: string; checkedAt: string; report: unknown };
};

const DB = "lumivey-regression-evidence";
const STORE = "builds";
const CHAT_ID = /^[a-zA-Z0-9_-]{8,128}$/;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("Lokale opslag is niet beschikbaar."));
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "chatId" });
    };
    request.onerror = () => reject(request.error || new Error("Lokale opslag openen mislukt."));
    request.onsuccess = () => resolve(request.result);
  });
}

export function validateBuildSnapshot(value: unknown): value is BuildSnapshot {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<BuildSnapshot>;
  const impression = data.brief?.artistImpression as { id?: unknown } | undefined;
  return data.schemaVersion === 1 && typeof data.chatId === "string" && CHAT_ID.test(data.chatId)
    && typeof data.previewId === "string" && data.previewId.length > 0
    && typeof data.approvedPreview === "string" && /^https:\/\//.test(data.approvedPreview)
    && data.previewSignature?.previewId === data.previewId && impression?.id === data.previewId
    && (data.approval?.evaluator === "PASS" || (data.approval?.evaluator === "WARN" && data.approval.humanApproved === true));
}

export async function saveBuildSnapshot(value: BuildSnapshot): Promise<void> {
  if (!validateBuildSnapshot(value)) throw new Error("Ongeldig goedkeuringsdossier: Preview-ID, signatuur of goedkeuring klopt niet.");
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Goedkeuringsdossier opslaan mislukt."));
      tx.onabort = () => reject(tx.error || new Error("Opslag van dossier afgebroken."));
    });
  } finally { db.close(); }
}

export async function loadBuildSnapshot(chatId: string): Promise<BuildSnapshot | null> {
  if (!CHAT_ID.test(chatId)) return null;
  const db = await openDB();
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(chatId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Dossier laden mislukt."));
    });
    return validateBuildSnapshot(value) ? value : null;
  } finally { db.close(); }
}
