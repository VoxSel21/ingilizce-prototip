// Ana ekrana eklenen uygulama için çevrimdışı destek.
// Ağ önce: internet varken her zaman sunucudaki en yeni sürüm gelir (eski sürüm takılı kalmasın);
// internet yoksa en son kaydedilen kopya açılır.
const ONBELLEK = "pati-v1";
const TEMEL = ["./", "index.html", "manifest.json", "resim/ikon-192.png",
  "resim/kedi_fit.png", "resim/kedi_pofuduk.png", "resim/kedi_tombis.png", "resim/kedi_mega.png", "resim/bg_cayir.jpg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(ONBELLEK).then(c => c.addAll(TEMEL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(adlar => Promise.all(adlar.filter(a => a !== ONBELLEK).map(a => caches.delete(a)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const istek = e.request;
  if (istek.method !== "GET" || new URL(istek.url).origin !== location.origin) return;
  // Sayfanın kendisi tarayıcı önbelleğini de atlasın (GitHub Pages 10 dakika eski sürüm verebiliyor)
  const ag = istek.mode === "navigate" ? fetch(istek.url, { cache: "no-cache" }) : fetch(istek);
  e.respondWith(ag.then(yanit => {
    if (yanit.ok) { const kopya = yanit.clone(); caches.open(ONBELLEK).then(c => c.put(istek, kopya)); }
    return yanit;
  // Ana sayfa yedeği yalnız sayfa açılışları için; önbellekte olmayan resme sayfa HTML'i dönmesin, hata dönsün.
  }).catch(() => caches.match(istek, { ignoreSearch: true }).then(m => m || (istek.mode === "navigate" ? caches.match("index.html") : Response.error()))));
});
