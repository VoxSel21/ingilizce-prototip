// Ana ekrana eklenen uygulama için çevrimdışı destek.
// Ağ önce: internet varken her zaman sunucudaki en yeni sürüm gelir (eski sürüm takılı kalmasın);
// internet yoksa en son kaydedilen kopya açılır.
const ONBELLEK = "pati-v66-dev14";
// Seviye ve özel sohbet modülleri de çevrimdışı kabukta bulunur.
// Uygulama artık parçalı: stil, veri ve kod dosyaları da çevrimdışı açılış için önbelleğe alınır.
const KOD = ["css/stil.css", "vendor/capacitor.js", "veri/kelimeler.js", "veri/phrasal.js", "veri/cumleler.js", "js/yardimci.js", "vendor/ts-fsrs-5.4.2.js", "js/beceri-kural.js", "js/beceri-ekran.js", "js/telaffuz.js", "js/kayit.js", "js/ekonomi.js", "js/ilerleme.js", "js/ogrenme.js", "js/oyun.js", "js/esitleme.js", "js/durum.js", "js/firebase-ayar.js", "js/bulut.js", "js/ana-sayfa.js",
  "js/kelime-calisma.js", "js/ses.js", "js/cihaz.js", "js/alistirmalar.js", "js/odul-takvim.js", "js/hazne.js", "js/sohbet.js", "js/cete.js", "js/sosyal.js", "js/cete-ekran.js",
  "js/gezinme.js", "js/kedi.js", "js/kedi-cizim.js", "js/balik-avi.js", "js/ayarlar.js", "js/baslat.js"];
KOD.push('js/seviye-sinavi.js','js/seviye-ekran.js','js/ozel-veri.js','js/ozel-ekran.js');
KOD.push('js/kupa-eslesme.js','js/kupa-ekran.js','js/ozellestirme.js');
KOD.push('js/durum-modeli.js', 'js/ilerleme-sozlesmesi.js', 'js/yerel-kayit.js', 'js/oturumlar.js', 'js/bulut-veri.js', 'js/cete-veri.js', 'js/calisma-islemi.js', 'js/av-gorunum.js');
KOD.push('js/cete-baglanti.js', 'js/demo-sohbet.js', 'js/savas-ekran.js');
KOD.push('css/menuler.css', 'js/menu-paneller.js', 'js/sevgi.js', 'js/savas-puan.js', 'js/cete-yenilikler.js', 'resim/giy_yaprak.svg', 'resim/esya_yaprak.svg', 'resim/giy_ay.svg', 'resim/esya_ay.svg');
KOD.push("js/arkadas.js", "js/arkadas-veri.js", "js/arkadas-ekran.js");
KOD.push("js/savas-kural.js", "js/savas-veri.js", "js/savas-gercek-ekran.js");
KOD.push("js/konusma-kural.js");
KOD.push("veri/sesler.js", "ses/kaynaklar.json");
KOD.push("veri/kelime-kaynaklari.json", "veri/kelime-kaynaklari.html");
KOD.push("veri/phrasal-kaynaklari.json", "veri/phrasal-kaynaklari.html");
KOD.push("ses/apple.ogg","ses/eat.ogg","ses/book.ogg","ses/bird.ogg","ses/hot.ogg");

KOD.push("js/mini-ders.js","js/pati-gorunum.js","css/pati-dunya.css","resim/pati-ikonlar.svg","resim/PHOSPHOR-LICENSE.txt","veri/pati-gorsel-kaynaklar.html","resim/nesne-apple.svg","resim/nesne-bread.svg","resim/nesne-milk.svg","resim/nesne-tea.svg","resim/nesne-egg.svg","resim/nesne-coffee.svg","resim/nesne-cup.svg","resim/nesne-sugar.svg","resim/nesne-tomato.svg");
KOD.push("resim/nesne-fish.svg","resim/nesne-gift.svg","resim/nesne-coin.svg");
KOD.push("css/degiskenler.css", "css/ana-ekran.css", "css/ders-ekrani.css", "css/takvim-ekrani.css", "css/kedi-ekrani.css", "css/oduller-ekrani.css", "css/sosyal-ekrani.css", "css/alistirma-ekrani.css", "css/oyun-ekrani.css", "css/kucuk-ekranlar.css"); // C · Sakin ve şık arayüzü (2026-11-16)
KOD.push("resim/bg_bahce.jpg", "resim/bg_bahce-ana.jpg", "veri/bahce-kaynaklari.json");
const TEMEL = ["./", "index.html", ...KOD, "manifest.json", "resim/ikon-192.png",
  "resim/kedi_fit.png", "resim/kedi_pofuduk.png", "resim/kedi_tombis.png", "resim/kedi_mega.png", "resim/bg_cayir.jpg"];
for (const id of ['kurdele', 'mantar', 'atki', 'pati', 'yuvarlak', 'uyku']) TEMEL.push(`resim/giy_${id}.svg`, `resim/esya_${id}.svg`);
for (const id of ['sonbahar', 'kitaplik', 'teras', 'sahil', 'kar', 'sakura', 'ev', 'gece']) TEMEL.push(`resim/bg_${id}.jpg`);



self.addEventListener("install", e => {
  // Kurulumda tarayıcının eski, sürüm eksiz HTTP kopyası yeni pakete taşınmasın.
  e.waitUntil(caches.open(ONBELLEK).then(c => c.addAll(TEMEL.map(url => new Request(url, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(adlar => Promise.all(adlar.filter(a => a !== ONBELLEK).map(a => caches.delete(a)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const istek = e.request;
  if (istek.method !== "GET" || new URL(istek.url).origin !== location.origin) return;
  // Sayfa ve kod dosyaları tarayıcı önbelleğinden değil, sunucuya sorularak gelir (yeni ve eski sürüm karışmasın; GitHub Pages 10 dakika eski sürüm verebiliyor).
  const ag = fetch(istek, { cache: "no-cache" });
  e.respondWith(ag.then(yanit => {
    if (yanit.ok) { const kopya = yanit.clone(); caches.open(ONBELLEK).then(c => c.put(istek, kopya)); }
    return yanit;
  // Ana sayfa yedeği yalnız sayfa açılışları için; önbellekte olmayan resme sayfa HTML'i dönmesin, hata dönsün.
  }).catch(() => caches.match(istek, { ignoreSearch: true }).then(m => m || (istek.mode === "navigate" ? caches.match("index.html") : Response.error()))));
});

