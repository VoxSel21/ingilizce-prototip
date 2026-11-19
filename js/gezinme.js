// ================= GEZİNME =================
function sekme(ad) {
  if (typeof sosyalSohbetKapat === 'function') sosyalSohbetKapat();
  if (ad === 'arkadaslar') {
    const zaten = document.getElementById('ekran-arkadaslar').classList.contains('aktif');
    sosyalBolum = zaten && sosyalBolum === 'arkadas' ? 'cete' : 'arkadas';
  }
  if (typeof ArkadasEkran !== 'undefined' && (ad !== 'arkadaslar' || sosyalBolum !== 'arkadas')) ArkadasEkran.profilDinlemeKapat();
  document.querySelectorAll(".ekran").forEach(e => e.classList.toggle("aktif", e.id === "ekran-" + ad));
  document.querySelectorAll("nav button").forEach(b => {
    const secili = b.dataset.sekme === ad;
    b.classList.toggle("aktif", secili);
    if (secili) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  herSeyiCiz();
  if (ad === 'arkadaslar' && sosyalBolum === 'cete') sosyalSohbetGoster();
}
// Tam ekran alıştırma açılınca klavye odağı ona geçer, arkadaki ekranlar "inert" olur (Tab'la ulaşılmaz);
// kapanınca odak açan düğmeye döner.
// Cevap paneli: Devam yalnız panel açıkken çalışır; panel açılınca odak Devam'a, yeni soru gelince sorunun ilk düğmesine geçer.
const panelAcik = id => document.getElementById(id).classList.contains("acik");
const devamaOdak = id => setTimeout(() => document.getElementById(id).focus(), 60);
function alistirmaOdak() {
  setTimeout(() => {
    // Odak yeni sorunun alanına gider (bir şıkka değil): Enter yanlışlıkla cevap vermez, Tab ilk seçeneğe geçer.
    const t = document.querySelector(".tam.aktif"); if (!t || document.getElementById("perde").classList.contains("aktif")) return;
    const alan = t.querySelector(".k-alan, .tr-cumle"); if (!alan) return;
    alan.tabIndex = -1; alan.focus({ preventScroll: true });
  }, 80);
}
let tamAcan = null;
const tamGecmisi = [];
// Sonuç okunurken oyun arkada kalır; kapatma ve sonraki ödül yalnız onayla çalışır.
let sonucOnayi = null;
function turSonucu(ikon, baslik, yazi, sonra = null) {
  const oyunEkrani = document.querySelector(".tam.aktif");
  if (oyunEkrani) oyunEkrani.inert = true;
  sonucOnayi = () => {
    sonucOnayi = null;
    document.getElementById("perde").classList.remove("aktif");
    tamKapat();
    if (sonra) sonra();
  };
  pencere(ikon, baslik, yazi, "Devam", () => { if (sonucOnayi) sonucOnayi(); });
  document.getElementById("p-dugme").focus();
}
const arkaPlan = () => document.querySelectorAll("#uygulama > .sahne, #uygulama > .ekran, #uygulama > nav");
function tamAc(ad) {
  const t = document.getElementById("tam-" + ad);
  if (t.classList.contains('sosyal-sohbet-gomulu')) { t.classList.add('aktif'); return; }
  const onceki = document.querySelector(".tam.aktif");
  if (onceki === t) return;
  if (!document.querySelector(".tam.aktif")) tamAcan = document.activeElement;
  if (onceki) { tamGecmisi.push({ ekran: onceki, acan: document.activeElement }); onceki.classList.remove("aktif"); }
  t.inert = false; t.classList.add("aktif"); t.setAttribute("role", "dialog"); t.setAttribute("aria-modal", "true");
  arkaPlan().forEach(e => e.inert = true);
  setTimeout(() => { if (!t.classList.contains("aktif") || document.getElementById("perde").classList.contains("aktif")) return; const ilk = t.querySelector("#ayar-hesap-ozet, button:not(.kapat):not([disabled])") || t.querySelector("button"); if (ilk) ilk.focus(); }, 60);
}
function tamKapat() {
  const t = document.querySelector(".tam.aktif");
  if (!t) return;
  Oturumlar.kapat(t.id.replace("tam-", ""));
  t.querySelectorAll(".alt-panel.acik").forEach(altPanelKapat); t.classList.remove("aktif"); t.inert = false;
  // Yarıda kapatılan turun cevap paneli bir sonraki tura taşınmasın (eski "Devam" yeni turu ilerletiyordu).
  t.querySelectorAll(".geri-bildirim").forEach(g => g.className = "geri-bildirim");
  if (t.id === "tam-kartlar") document.getElementById("k-alan").inert = false;
  const onceki = tamGecmisi.pop();
  if (onceki) { onceki.ekran.classList.add("aktif"); if (onceki.acan && document.body.contains(onceki.acan)) onceki.acan.focus(); return; }
  arkaPlan().forEach(e => e.inert = false);
  if (tamAcan && document.body.contains(tamAcan)) { try { tamAcan.focus(); } catch (e) {} } tamAcan = null; herSeyiCiz(); }
document.querySelectorAll("nav button").forEach(b => b.onclick = () => sekme(b.dataset.sekme));

// İsse kararı: kaydırarak ana sekme değiştirme şimdilik devre dışı.
// Kart turu yarıda kapanınca tur kayıtta açık kalır (U16); spor turunda o ana kadarki kazanım gösterilir (U18).
document.querySelectorAll("[data-kapat]").forEach(b => b.onclick = () => { if(b.closest('.sosyal-sohbet-gomulu')) { sekme('arkadaslar');return; } const kartta = !!b.closest("#tam-kartlar"); tamKapat(); if (kartta) turYaridaKaldi(); });
document.getElementById("calisma-turu-sec").onclick = () => beceriSecAc();
const ALISTIRMA = { pv: () => beceriSecAc(PHRASAL), cumle: () => cumleAc(), esles: () => eslesAc(), kur: () => kurAc() };
document.querySelectorAll("[data-ac]").forEach(b => b.onclick = () => ALISTIRMA[b.dataset.ac]());
document.getElementById("basla-dugme").onclick = () => {
  gunuYenile();
  if (acikTur("kelime")) kartlariAc();
  else if (d.bugun.sayi >= gunlukHedef() && !d.bugun.hediye) hediyePenceresi();
  else if (d.bugun.sayi >= gunlukHedef()) gunTamamPenceresi();
  else if (bekleyenler().length) kartlariAc(KELIMELER);
  else cumleAc();
};
