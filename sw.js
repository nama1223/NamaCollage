// NamaCollage Service Worker
//
// 更新ポリシー:
//   - CACHE_NAME は「キャッシュを完全リセットしたい時だけ」バージョンを上げる。
//   - SW 自体（このファイル）を変更すれば、ブラウザが自動的に再登録する。
//
// v4 変更点（オフライン起動不良の修正）:
//   旧実装は index.html のプリキャッシュが何らかの理由（一時的な通信不調など）で
//   失敗しても Promise.allSettled により「install 成功」として扱われ、
//   その直後の activate で古いキャッシュ（＝それまで正常にオフライン動作していたキャッシュ）を
//   問答無用で削除していた。これにより一度でもプリキャッシュに失敗すると、新旧どちらの
//   キャッシュにも index.html が存在しない状態になり、オフライン起動が壊れたまま
//   （次に確実に成功するまで）直らないという構造的な不具合があった。
//   → index.html などの「無いとアプリが起動できない必須リソース」は取得に失敗したら
//     install 自体を失敗させ、ブラウザに古いSW（＝古いキャッシュ）をそのまま維持させる。
//     これにより「新しいキャッシュへの中途半端な切り替え」が起こらなくなる。

const CACHE_NAME = 'namacollage-v4';

// 無いとアプリが起動できない必須リソース。1つでも取得失敗したら install 自体を失敗させる。
const CRITICAL = [
  './',
  './index.html',
];
// あれば嬉しい程度のリソース（アイコン・マニフェスト・Webフォント）。
// 失敗しても install は続行する（allSettled）。
const OPTIONAL = [
  './manifest.json',
  './NamaCollageLogo192.png',
  './NamaCollageLogo512.png',
  'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Kaisei+Decol:wght@700&family=Mochiy+Pop+One&family=Noto+Sans+JP:wght@700&family=Noto+Serif+JP:wght@700&family=Yomogi&display=swap',
];

// ============================================================
// Install: プリキャッシュ（HTTPキャッシュを無視して強制取得）
// ============================================================
let _isUpdate = false;

self.addEventListener('install', event => {
  _isUpdate = !!self.registration.active;
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        // 1. 必須リソース: 1つでも失敗したら例外を投げて install 自体を失敗させる
        //    （失敗時はブラウザが古いSW/古いキャッシュをそのまま維持し、次回リトライする）
        for (const url of CRITICAL) {
          const req = new Request(url, { cache: 'reload' });
          const res = await fetch(req); // 失敗すればここで例外→install失敗
          if (!res.ok) throw new Error(`SW: precache failed (${res.status}) for ${url}`);
          await cache.put(url, res.clone());
        }
        // 2. 任意リソース（アイコン・マニフェスト・Webフォント等）: ベストエフォート
        //    cache: 'reload' を指定して強制的にネットワークから最新を取得する
        await Promise.allSettled(OPTIONAL.map(async url => {
          try {
            const req = new Request(url, { cache: 'reload' });
            const res = await fetch(req);
            if (res.ok || res.type === 'opaque') await cache.put(url, res);
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
const FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // --- Web Share Target: POST /share-target ---
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith(handleShareTarget(event.request));
    return;
  }

  // GET のみ対象
  if (event.request.method !== 'GET') return;

  // 同一オリジン以外は、Webフォント（Google Fonts）だけ例外的にSWR対象にする。
  // それ以外の外部オリジンはブラウザの通常挙動に任せる（オフライン時は自然に失敗＝フォールバック）。
  const isSameOrigin = url.origin === location.origin;
  const isFontOrigin = FONT_ORIGINS.includes(url.origin);
  if (!isSameOrigin && !isFontOrigin) return;

  // 1. HTMLリクエスト（画面遷移）は Network-First
  // 常に最新版を見に行き、オフライン時のみキャッシュから返す
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return response;
        })
        .catch(async () => {
          // オフライン時はキャッシュから返す。
          // './index.html' と './' のどちらにも念のためフォールバックを試みる。
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match('./index.html', { ignoreSearch: true }))
              || (await cache.match('./', { ignoreSearch: true }))
              || Response.error();
        })
    );
    return;
  }

  // 2. それ以外（画像やフォントなど）は Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        const revalidate = fetch(event.request)
          .then(response => {
            // basic: 同一オリジン / opaque: フォントなどno-corsクロスオリジン
            if (response && (response.ok && response.type === 'basic' || response.type === 'opaque')) {
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
