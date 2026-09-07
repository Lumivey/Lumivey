const DB_NAME = "lumivey-preview-storage";
const DB_VERSION = 1;
const STORE_NAME = "images";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const database = request.result;

      if (
        !database.objectStoreNames.contains(
          STORE_NAME
        )
      ) {
        database.createObjectStore(STORE_NAME);
      }
    };
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");

  if (!header || !base64) {
    throw new Error("Ongeldige afbeelding.");
  }

  const mimeMatch = header.match(
    /data:(.*?);base64/
  );

  const mimeType =
    mimeMatch?.[1] || "image/png";

  const binary = atob(base64);

  const bytes = new Uint8Array(
    binary.length
  );

  for (
    let index = 0;
    index < binary.length;
    index += 1
  ) {
    bytes[index] =
      binary.charCodeAt(index);
  }

  return new Blob([bytes], {
    type: mimeType,
  });
}

export async function storeImage(
  key: string,
  dataUrl: string
): Promise<void> {
  const database = await openDatabase();
  const blob = dataUrlToBlob(dataUrl);

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store =
      transaction.objectStore(STORE_NAME);

    const request = store.put(
      blob,
      key
    );

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function getImage(
  key: string
): Promise<string | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      STORE_NAME,
      "readonly"
    );

    const store =
      transaction.objectStore(STORE_NAME);

    const request = store.get(key);

    request.onerror = () => {
      database.close();
      reject(request.error);
    };

    request.onsuccess = () => {
      const blob = request.result as
        | Blob
        | undefined;

      database.close();

      if (!blob) {
        resolve(null);
        return;
      }

      resolve(
        URL.createObjectURL(blob)
      );
    };
  });
}

export async function deleteImage(
  key: string
): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      STORE_NAME,
      "readwrite"
    );

    transaction
      .objectStore(STORE_NAME)
      .delete(key);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}