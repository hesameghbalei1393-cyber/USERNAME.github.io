// سرویس‌ورکر نسخه ۲: صفحه‌ها اول از اینترنت گرفته می‌شوند (نسخه‌ی جدید زود دیده شود)،
// و اگر اینترنت نبود از حافظه خوانده می‌شوند. فایل‌های سنگین مدل بعد از بار اول ذخیره می‌مانند.
const CACHE = 'finger-draw-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const put = (req, res) => { if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return res; };

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isCdn = /(^|\.)jsdelivr\.net$|(^|\.)unpkg\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isCdn) return;

  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (isPage) {
    e.respondWith(fetch(req).then(r => put(req, r)).catch(() => caches.match(req).then(h => h || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => put(req, r)).catch(() => Response.error())));
});
