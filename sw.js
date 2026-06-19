// NamaCollage Service Worker
//
// 更新ポリシー:
//   - CACHE_NAME のバージョンは「キャッシュを完全リセットしたい時だけ」上げる。
//     index.html や画像ファイルだけを更新した場合は変更不要。
//   - stale-while-revalidate 方式のため、オンライン時は常にバックグラウンドで
//     最新版を取得・キャッシュし、次回アクセス時に自動適用される。

const CACHE_NAME = 'namacollage-v1';

// 起動時にプリキャッシュするファイル
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './NamaCollageLogo192.png',
  './NamaCollageLogo512.png',
];

// ============================================================
// Install: プリキャッシュ（失敗しても続行: allSettled）
// ============================================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(PRECACHE.map(url => cache.add(url))))
      .then(() => self.skipWaiting())  // 待機せず即アクティブ化
  );
});

// ============================================================
// Activate: 古いバージョンのキャッシュを削除
// ============================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())  // 即座に全クライアントを制御下に
  );
});

// ============================================================
// Fetch: Stale-While-Revalidate
//   1. キャッシュがあれば即座に返す（オフライン対応・高速）
//   2. 常にバックグラウンドでネットワークから取得してキャッシュを更新
//   3. キャッシュがなければネットワークを待つ
// ============================================================
self.addEventListener('fetch', event => {
  // GETリクエストのみ処理（POST等はスキップ）
  if (event.request.method !== 'GET') return;

  // 同一オリジンのリクエストのみ（CDN等の外部リソースは除外）
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {

        // バックグラウンドで最新版を取得してキャッシュ更新
        const revalidate = fetch(event.request)
          .then(response => {
            if (response && response.ok && response.type === 'basic') {
              // レスポンスをキャッシュに保存（cloneが必要: bodyは1回しか読めない）
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => null);  // オフライン時はnullを返す（キャッシュで対応）

        // キャッシュヒット: すぐ返してバックグラウンドで更新（stale-while-revalidate）
        // キャッシュミス: ネットワーク応答を待つ
        return cached || revalidate;
      })
    )
  );
});
