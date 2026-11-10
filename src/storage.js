const DB_NAME = "ants-pixel-hunt";
const STORE = "saves";
const LEGACY_KEY = "level-1";
const LAST_KEY = "ants-last-level";
const keyFor = levelId => "level-" + (levelId || "meadow-01");

function openDatabase() {
  return new Promise((resolve,reject) => {
    if (!("indexedDB" in globalThis)) return reject(new Error("IndexedDB недоступен"));
    const request = indexedDB.open(DB_NAME,1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readDatabase(key) {
  const db = await openDatabase();
  const result = await new Promise((resolve,reject) => {
    const request = db.transaction(STORE,"readonly").objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

export async function saveLocal(data) {
  const key = keyFor(data?.levelId);
  try {
    const db = await openDatabase();
    await new Promise((resolve,reject) => {
      const tx = db.transaction(STORE,"readwrite");
      tx.objectStore(STORE).put(data,key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
    try { localStorage.setItem(LAST_KEY,data?.levelId||"meadow-01"); } catch {}
    return true;
  } catch {
    try {
      localStorage.setItem(key,JSON.stringify(data));
      localStorage.setItem(LAST_KEY,data?.levelId||"meadow-01");
      return true;
    } catch { return false; }
  }
}

export async function loadLocal() {
  let levelId="meadow-01";
  try { levelId=localStorage.getItem(LAST_KEY)||levelId; } catch {}
  const key=keyFor(levelId);
  try {
    const result=await readDatabase(key);
    if(result)return result;
    if(levelId==="meadow-01"){
      const legacy=await readDatabase(LEGACY_KEY);
      if(legacy)return legacy;
    }
  } catch {}
  try {
    const current=JSON.parse(localStorage.getItem(key)||"null");
    if(current)return current;
    if(levelId==="meadow-01")return JSON.parse(localStorage.getItem(LEGACY_KEY)||"null");
  } catch {}
  return null;
}

export async function clearLocal(levelId="meadow-01") {
  const key=keyFor(levelId);
  try {
    const db = await openDatabase();
    await new Promise((resolve,reject) => {
      const tx = db.transaction(STORE,"readwrite");
      tx.objectStore(STORE).delete(key);
      if(levelId==="meadow-01")tx.objectStore(STORE).delete(LEGACY_KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {}
  try {
    localStorage.removeItem(key);
    if(levelId==="meadow-01")localStorage.removeItem(LEGACY_KEY);
  } catch {}
}
