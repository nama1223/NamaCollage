// NamaCollage Service Worker
//
// 更新ポリシー:
//   - CACHE_NAME は「キャッシュを完全リセットしたい時だけ」バージョンを上げる。
//     index.html や画像ファイルの更新だけなら変更不要（stale-while-revalidate で自動更新）。
//   - SW 自体（このファイル）を変更すれば、ブラウザが自動的に再登録する。

const CACHE_NAME = 'namacollage-v2';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './NamaCollageLogo192.png',
  './NamaCollageLogo512.png',
];

// ============================================================
// Install: プリキャッシュ（失敗しても続行）
// ============================================================
let _isUpdate = false; // 初回インストールか更新かを判別

self.addEventListener('install', event => {
  // 既存のアクティブなSWがあれば更新と判断
  _isUpdate = !!self.registration.active;
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(PRECACHE.map(url => cache.add(url))))
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
          // 更新完了を開いているウィンドウに通知
          const clients = await self.clients.matchAll({ type: 'window' });
          for (const client of clients) {
            client.postMessage({ type: 'sw_updated' });
          }
        }
      })
  );
});

// ============================================================
// Fetch: Share Target POST + Stale-While-Revalidate
// ============================================================
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // --- Web Share Target: POST /share-target ---
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith(handleShareTarget(event.request));
    return;
  }

  // GET のみキャッシュ対象
  if (event.request.method !== 'GET') return;
  // 外部オリジンはスキップ
  if (url.origin !== location.origin) return;

  // Stale-While-Revalidate:
  //   1. キャッシュがあれば即座に返す（オフライン対応・高速起動）
  //   2. バックグラウンドで常に最新版を取得しキャッシュを更新
  //   3. キャッシュなし → ネットワークを待つ
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
// Share Target ハンドラ
//   受け取ったファイルを IndexedDB(pending_shares) に保存し
//   メインページにリダイレクト。
//   メインページ側は起動時に pending_shares を読み取って処理する。
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
      // 古い未処理分をクリア
      store.clear();
      for (const file of files) {
        const buf = await file.arrayBuffer();
        store.add({ name: file.name, type: file.type, blob: new Blob([buf], { type: file.type }) });
      }
      await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
      db.close();

      // 開いているウィンドウに通知（既にアプリが起動中の場合）
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

// SW 内で IndexedDB を開く（バージョンは index.html と揃える）
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
