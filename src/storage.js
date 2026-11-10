const DB_NAME = "ants-pixel-hunt";
const STORE = "saves";
const KEY = "level-1";

function openDatabase() {
  return new Promise((resolve,reject) => {
    if (!("indexedDB" in globalThis)) return reject(new Error("IndexedDB недоступен"));
    const request = indexedDB.open(DB_NAME,1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocal(data) {
  try {
    const db = await openDatabase();
    await new Promise((resolve,reject) => {
      const tx = db.transaction(STORE,"readwrite");
      tx.objectStore(STORE).put(data,KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    try { localStorage.setItem(KEY,JSON.stringify(data)); return true; }
    catch { return false; }
  }
}

export async function loadLocal() {
  try {
    const db = await openDatabase();
    const result = await new Promise((resolve,reject) => {
      const request = db.transaction(STORE,"readonly").objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (result) return result;
  } catch {}
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
  catch { return null; }
}

export async function clearLocal() {
  try {
    const db = await openDatabase();
    await new Promise((resolve,reject) => {
      const tx = db.transaction(STORE,"readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {}
  try { localStorage.removeItem(KEY); } catch {}
}
