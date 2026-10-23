// ================= KEDİ ÇİZİCİ: tek karakter sistemi (3. aşama, 2026-10-23) =================
// Ana sayfa, Kedi sekmesi, balık avı ve antrenman aynı çiziciyi kullanır: aynı kürk rengi, aynı eşyalar, aynı beden.
// Kürk rengi: çizimdeki turuncu kürk pikselleri ton/doygunluk/parlaklıkla bulunur ve yalnız onlar seçilen renge boyanır.
// Göz, burun, kontur, pembe yanak, krem göbek ve eşyalar boyanmaz. Saf kısım Node testlerinde de çalışır (tests/).
const KURK_TABAN = "#FDBE86";      // çizimdeki ana kürk rengi (resim/kedi_*.png ölçümü)
const KURK_VARSAYILAN = KURK_TABAN;
const hexGecerli = h => typeof h === "string" && /^#[0-9a-f]{6}$/i.test(h);
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgbHex = (r, g, b) => "#" + [r, g, b].map(x => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, "0")).join("").toUpperCase();
function rgbHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const en = Math.max(r, g, b), az = Math.min(r, g, b), l = (en + az) / 2, f = en - az;
  if (!f) return [0, 0, l];
  const s = f / (1 - Math.abs(2 * l - 1));
  const h = en === r ? ((g - b) / f + 6) % 6 : en === g ? (b - r) / f + 2 : (r - g) / f + 4;
  return [h * 60, s, l];
}
function hslRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
const sinirla = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
// Bir pikselin ne kadar "kürk" olduğu (0–1). Kürk ve çizgileri turuncu tonda, doygun ve aydınlık;
// kontur ve gözler koyu, göbek az doygun, yanaklar pembe tonda. Kenarlarda yumuşak geçiş: kontura yapışık pikseller yarım boyanır.
function kurkAgirlik(r, g, b) {
  const en = Math.max(r, g, b), az = Math.min(r, g, b);
  if (!en) return 0;
  const v = en / 255, s = (en - az) / en;
  let h = 0;
  if (en !== az) h = en === r ? ((g - b) / (en - az) + 6) % 6 * 60 : en === g ? ((b - r) / (en - az) + 2) * 60 : ((r - g) / (en - az) + 4) * 60;
  if (h < 8 || h > 45) return 0;
  return sinirla((s - 0.2) / 0.12) * sinirla((v - 0.4) / 0.2);
}
// px: RGBA dizisi (canvas ImageData.data). Kürk pikselleri hedef renge boyanır; açık/koyu farkları (çizgiler, gölge) korunur.
function kurkBoya(px, hex) {
  const [th, ts, tl] = rgbHsl(...hexRgb(hex)), [, bs, bl] = rgbHsl(...hexRgb(KURK_TABAN));
  const koyuluk = tl < 0.3 ? 0.5 : 1; // çok koyu renkte çizgiler simsiyaha gömülmesin
  for (let i = 0; i < px.length; i += 4) {
    if (!px[i + 3]) continue;
    const r = px[i], g = px[i + 1], b = px[i + 2], w = kurkAgirlik(r, g, b);
    if (!w) continue;
    const [, ps, pl] = rgbHsl(r, g, b);
    const [nr, ng, nb] = hslRgb(th, sinirla(ts * ps / bs), sinirla(tl + (pl - bl) * koyuluk, 0.03, 0.98));
    px[i] = r + (nr - r) * w; px[i + 1] = g + (ng - g) * w; px[i + 2] = b + (nb - b) * w;
  }
  return px;
}
// Göz merkezleri (400 px çizimde). Fit halinin gözleri zaten mutlu-kapalı çizili; ona ek göz çizilmez.
const GOZLER = { pofuduk: [[179.5, 129.5], [294.5, 122.5]], tombis: [[179.5, 129.5], [294.5, 122.5]], mega: [[179.5, 129.5], [294.5, 122.5]], fit: null };

if (typeof module === "object" && module.exports) module.exports = { KURK_TABAN, KURK_VARSAYILAN, hexGecerli, hexRgb, rgbHex, rgbHsl, hslRgb, kurkAgirlik, kurkBoya, GOZLER };

// ---------- Tarayıcı kısmı: çizim, önbellek ve hareket ----------
// Her kedi üç üst üste kareden oluşur: açık göz, kırpma (kapalı göz) ve mutlu yüz (^^). Hangisinin görüneceğini
// CSS seçer; böylece göz kırpma ve nefes JavaScript zamanlayıcısı gerektirmez, ekran değişince eski döngü kalmaz.
// Hareket durumu (bekle/dokun/kutla/kos/uzgun/antrenman) kedi gövdesindeki data-hareket ile tek yerden yönetilir.
const YUZLER = ["acik", "kirp", "mutlu"];
const KediCizici = {
  onbellek: new Map(),
  gorunum: (ek = {}) => ({ hal: kediHali(), renk: hexGecerli(d.kurkRenk) ? d.kurkRenk : KURK_VARSAYILAN, giyili: { ...d.giyili }, ...ek }),
  html(g) {
    let h = `<div class="kedi-govde" data-hareket="bekle" role="img" aria-label="${temizAd(d.kediAd)}">`;
    for (const y of YUZLER) h += `<canvas class="kedi-kare" data-yuz="${y}" width="400" height="400" aria-hidden="true"></canvas>`;
    for (const yer of ["boyun", "goz", "sapka"]) {
      const e = ESYALAR.find(x => x.id === g.giyili[yer]); if (!e) continue;
      h += `<img class="giy" src="resim/giy_${e.id}.png" alt="" aria-hidden="true">`;
    }
    return h + "</div>";
  },
  // kap içine kediyi yerleştirir ve çizer; kediyi taşıyan gövde öğesini döndürür.
  yerlestir(kap, g = KediCizici.gorunum()) {
    if (!kap) return null;
    kap.innerHTML = KediCizici.html(g);
    const govde = kap.querySelector(".kedi-govde");
    KediCizici.ciz(govde, g);
    return govde;
  },
  async ciz(govde, g = KediCizici.gorunum(), yalniz) {
    if (!govde) return;
    const no = govde._cizimNo = (govde._cizimNo || 0) + 1; // eski (yavaş) çizim yenisinin üstüne yazmasın
    const silinecek = Object.values(g.giyili).filter(id => SILME_VAR.includes(id));
    let resimler;
    try { resimler = await Promise.all([`resim/kedi_${g.hal}.png`, ...silinecek.map(id => `resim/sil_${id}.png`)].map(resimYukle)); }
    catch (e) { return; } // resim gelmezse boş kalır; bağlantı gelince bir sonraki çizim dener
    if (govde._cizimNo !== no) return;
    for (const yuz of yalniz ? [yalniz] : YUZLER) {
      const kare = govde.querySelector(`[data-yuz="${yuz}"]`); if (!kare) continue;
      const c = kare.getContext("2d");
      c.clearRect(0, 0, 400, 400); c.drawImage(KediCizici.kare(g, yuz, resimler), 0, 0);
    }
  },
  kare(g, yuz, [kedi, ...maskeler]) {
    const anahtar = [g.hal, g.renk.toUpperCase(), yuz, ...Object.values(g.giyili).filter(id => SILME_VAR.includes(id)).sort()].join("|");
    if (KediCizici.onbellek.has(anahtar)) return KediCizici.onbellek.get(anahtar);
    const t = document.createElement("canvas"); t.width = t.height = 400;
    const c = t.getContext("2d");
    c.drawImage(kedi, 0, 0, 400, 400);
    if (yuz !== "acik" && GOZLER[g.hal]) gozCiz(c, GOZLER[g.hal], yuz);
    if (g.renk.toUpperCase() !== KURK_TABAN) {
      try { const v = c.getImageData(0, 0, 400, 400); kurkBoya(v.data, g.renk); c.putImageData(v, 0, 0); } catch (e) {} // dosyadan açılışta okuma yasak: turuncu kalır
    }
    c.globalCompositeOperation = "destination-out";
    for (const m of maskeler) c.drawImage(m, 0, 0, 400, 400);
    if (KediCizici.onbellek.size > 40) KediCizici.onbellek.delete(KediCizici.onbellek.keys().next().value);
    KediCizici.onbellek.set(anahtar, t);
    return t;
  },
};
// Kapalı ve mutlu göz: gözün üstü kürk rengiyle örtülür (sonra kürkle birlikte boyanır), üstüne kontur renginde yay çizilir.
function gozCiz(c, gozler, yuz) {
  c.save();
  for (const [x, y] of gozler) {
    c.fillStyle = KURK_TABAN; c.beginPath(); c.ellipse(x, y, 13, 13, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#4A2A1E"; c.lineWidth = 4.5; c.lineCap = "round"; c.beginPath();
    if (yuz === "kirp") c.arc(x, y - 5, 9, Math.PI * 0.18, Math.PI * 0.82);       // ‿ huzurlu kapalı göz
    else c.arc(x, y + 6, 9, Math.PI * 1.18, Math.PI * 1.82);                      // ^ mutlu göz
    c.stroke();
  }
  c.restore();
}
// Geçici hareket: süre dolunca "sonra"ya (çoğunlukla beklemeye) döner. Aynı kediye yeni hareket gelirse
// eskisinin zamanlayıcısı iptal edilir; kedi sayfadan kalkmışsa zamanlayıcı hiçbir şeye dokunmaz.
function kediHareket(govde, ad, sure, sonra = "bekle") {
  if (!govde) return;
  clearTimeout(govde._hareketZaman);
  delete govde.dataset.hareket; void govde.offsetWidth; // aynı hareket art arda gelirse animasyon baştan başlasın
  govde.dataset.hareket = ad;
  if (sure) govde._hareketZaman = setTimeout(() => { if (govde.isConnected && govde.dataset.hareket === ad) govde.dataset.hareket = sonra; }, sure);
}
// Uygulama arka plandayken kedi animasyonları durur (CSS: :root[data-gorunmez]).
if (typeof document === "object") document.addEventListener("visibilitychange", () => {
  if (document.hidden) document.documentElement.dataset.gorunmez = "1"; else delete document.documentElement.dataset.gorunmez;
});
