/* =====================================================
   학점은행 플래너 — 서비스 워커
   · 앱 셸 캐시 (오프라인/홈 화면 설치 지원)
   · 알림 클릭 시 앱 열기
   ===================================================== */

const CACHE = 'cbp-shell-v1';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './app.js',
  './config.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 네트워크 우선, 실패 시 캐시 (항상 최신 코드 유지 + 오프라인 대응) */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // CDN 등 외부 요청은 그대로
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      return self.clients.openWindow('./index.html');
    })
  );
});

/* 푸시 서버 연동 시(향후) 백그라운드 푸시 수신 */
self.addEventListener('push', e => {
  let data = { title: '학점은행 플래너', body: '' };
  try { data = Object.assign(data, e.data.json()); } catch (err) { /* 무시 */ }
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: './icon-192.png', badge: './icon-192.png' }));
});
