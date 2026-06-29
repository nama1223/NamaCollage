// NamaCollage Service Worker
//
// 更新ポリシー:
//   - CACHE_NAME は「キャッシュを完全リセットしたい時だけ」バージョンを上げる。
//   - SW 自体（このファイル）を変更すれば、ブラウザが自動的に再登録する。

const CACHE_NAME = 'namacollage-v3'; // キャッシュをパージさせるため念のためv3などに上げるのをおすすめします

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './NamaCollageLogo192.png',
  './NamaCollageLogo512.png',
];

// ============================================================
// Install: プリキャッシュ（HTTPキャッシュを無視して強制取得）
// ============================================================
let _isUpdate = false;

self.addEventListener('install', event => {
  _isUpdate = !!self.registration.active;
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // cache.add() だとHTTPキャッシュが使われる可能性があるため、
        // cache: 'reload' を指定して強制的にネットワークから最新を取得する
        return Promise.allSettled(PRECACHE.map(async url => {
          try {
            const req = new Request(url, { cache: 'reload' });
            const res = await fetch(req);
            if (res.ok) await cache.put(url, res);
          } catch (e) {
            console.warn(`SW: Failed to precache ${url}`, e);
          }
        }));
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================================
// Activate: 古いキャッシュを削除
// ============================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(async () => {
        if (_isUpdate) {
          const clients = await self.clients.matchAll({ type: 'window' });
          for (const client of clients) {
            client.postMessage({ type: 'sw_updated' });
          }
        }
      })
  );
});

// ============================================================
// Fetch: 戦略の使い分け（HTMLはNetwork-First, 他はSWR）
// ============================================================
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // --- Web Share Target: POST /share-target ---
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith(handleShareTarget(event.request));
    return;
  }

  // GET のみ対象、外部オリジンはスキップ
  if (event.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  // 1. HTMLリクエスト（画面遷移）は Network-First
  // 常に最新版を見に行き、オフライン時のみキャッシュを使う
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return response;
        })
        .catch(() => {
          // オフライン時はキャッシュから返す
          return caches.match('./index.html', { ignoreSearch: true });
        })
    );
    return;
  }

  // 2. それ以外（画像やJSなど）は Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        const revalidate = fetch(event.request)
          .then(response => {
            if (response && response.ok && response.type === 'basic') {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => null);

        return cached || revalidate;
      })
    )
  );
});

// ============================================================
// Share Target & IndexedDB ハンドラ（変更なし）
// ============================================================
async function handleShareTarget(request) {
  let formData;
  try { formData = await request.formData(); }
  catch(e) { return Response.redirect('./', 303); }

  const files = formData.getAll('images').filter(f => f instanceof File);

  if (files.length) {
    try {
      const db = await openDB();
      const tx = db.transaction('pending_shares', 'readwrite');
      const store = tx.objectStore('pending_shares');
      store.clear();
      for (const file of files) {
        const buf = await file.arrayBuffer();
        store.add({ name: file.name, type: file.type, blob: new Blob([buf], { type: file.type }) });
      }
      await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
      db.close();

      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.postMessage({ type: 'share_received' });
      }
    } catch(e) {
      console.warn('SW: share save error', e);
    }
  }

  return Response.redirect('./?share_pending=1', 303);
}

function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('NamaCollage_v1', 2);
    r.onupgradeneeded = e => {
      const db = r.result;
      if (!db.objectStoreNames.contains('imgs'))           db.createObjectStore('imgs', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('meta'))           db.createObjectStore('meta');
      if (!db.objectStoreNames.contains('pending_shares')) db.createObjectStore('pending_shares', { autoIncrement: true });
    };
    r.onsuccess = () => res(r.result);
    r.onerror   = () => rej(r.error);
  });
}