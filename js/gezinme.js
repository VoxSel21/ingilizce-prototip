// ================= GEZİNME =================
function sekme(ad) {
  document.querySelectorAll(".ekran").forEach(e => e.classList.toggle("aktif", e.id === "ekran-" + ad));
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("aktif", b.dataset.sekme === ad));
  herSeyiCiz();
}
// Tam ekran alıştırma açılınca klavye odağı ona geçer, arkadaki ekranlar "inert" olur (Tab'la ulaşılmaz);
// kapanınca odak açan düğmeye döner.
// Cevap paneli: Devam yalnız panel açıkken çalışır; panel açılınca odak Devam'a, yeni soru gelince sorunun ilk düğmesine geçer.
const panelAcik = id => document.getElementById(id).classList.contains("acik");
const devamaOdak = id => setTimeout(() => document.getElementById(id).focus(), 60);
function alistirmaOdak() {
  setTimeout(() => {
    // Odak yeni sorunun alanına gider (bir şıkka değil): Enter yanlışlıkla cevap vermez, Tab ilk seçeneğe geçer.
    const t = document.querySelector(".tam.aktif"); if (!t) return;
    const alan = t.querySelector(".k-alan, .tr-cumle"); if (!alan) return;
    alan.tabIndex = -1; alan.focus({ preventScroll: true });
  }, 80);
}
let tamAcan = null;
const arkaPlan = () => document.querySelectorAll("#uygulama > .sahne, #uygulama > .ekran, #uygulama > nav");
function tamAc(ad) {
  const t = document.getElementById("tam-" + ad);
  if (!document.querySelector(".tam.aktif")) tamAcan = document.activeElement;
  t.classList.add("aktif"); t.setAttribute("role", "dialog"); t.setAttribute("aria-modal", "true");
  arkaPlan().forEach(e => e.inert = true);
  setTimeout(() => { const ilk = t.querySelector("button:not(.kapat):not([disabled])") || t.querySelector("button"); if (ilk) ilk.focus(); }, 60);
}
function tamKapat() { document.querySelectorAll(".tam").forEach(t => t.classList.remove("aktif"));
  // Yarıda kapatılan turun cevap paneli bir sonraki tura taşınmasın (eski "Devam" yeni turu ilerletiyordu).
  document.querySelectorAll(".geri-bildirim").forEach(g => g.className = "geri-bildirim");
  arkaPlan().forEach(e => e.inert = false);
  if (tamAcan && document.body.contains(tamAcan)) { try { tamAcan.focus(); } catch (e) {} } tamAcan = null; speechSynthesis && speechSynthesis.cancel(); if (es) { es.bitti = true; es = null; } if (sv) { sv.bitti = true; sv = null; } cSavas = false; kur = null; try { konusmaAktif && konusmaAktif.abort(); } catch (e) {} herSeyiCiz(); }
document.querySelectorAll("nav button").forEach(b => b.onclick = () => sekme(b.dataset.sekme));
document.querySelectorAll("[data-kapat]").forEach(b => b.onclick = tamKapat);
const ALISTIRMA = { pv: () => kartlariAc(PHRASAL), cumle: () => cumleAc(), esles: () => eslesAc(), kur: () => kurAc() };
document.querySelectorAll("[data-ac]").forEach(b => b.onclick = () => ALISTIRMA[b.dataset.ac]());
document.getElementById("basla-dugme").onclick = () => {
  if (d.bugun.sayi >= 10 && !d.bugun.hediye) hediyePenceresi();
  else if (bekleyenler().length) kartlariAc(); else cumleAc();
};
