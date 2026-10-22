// ================= CİHAZ: titreşim, geri tuşu, tema ve hareket =================
// Telefonda (Capacitor) yerel eklentiler kullanılır; tarayıcıda olabildiğince aynı davranış, olmazsa sessizce geçilir.
const YERLI = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
const yerliEklenti = ad => { try { return YERLI && Capacitor.registerPlugin ? Capacitor.registerPlugin(ad) : null; } catch (e) { return null; } };

// ---------- Dokunuş hissi (haptik) ----------
// "pushback" = ekrana dokunduğunu hissettiren kısa titreşim (bildirim değil). Ayarlardan ses ayarından bağımsız kapatılır.
// Seçim hafif, doğru cevap ve ödül kısa olumlu, yanlış ayırt edilebilir ama yumuşak. Hızlı yinelenen dokunuşlar seyreltilir.
const Dokunus = (() => {
  const Haptics = yerliEklenti("Haptics");
  const izin = sinirleyici(70);
  const tarayici = { secim: 8, olumlu: [14, 40, 14], olumsuz: [30, 50, 30], odul: [18, 30, 18, 30, 24] };
  return {
    titret(tur) {
      if (!d || !d.ayar || !d.ayar.titresim || !izin()) return;
      try {
        if (Haptics) {
          if (tur === "secim") Haptics.impact({ style: "LIGHT" });
          else if (tur === "olumsuz") Haptics.impact({ style: "MEDIUM" });
          else Haptics.notification({ type: "SUCCESS" });
        } else if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(tarayici[tur] || 8);
      } catch (e) {}
    },
  };
})();
// Ses efektleri çalınırken ilgili titreşim de verilir (ses kapalı olsa bile titreşim ayarı ayrı çalışır).
for (const [ad, tur] of Object.entries({ pop: "secim", dogru: "olumlu", yanlis: "olumsuz", altin: "odul", zafer: "odul", geri: "olumsuz" })) {
  const asil = Ses[ad]; Ses[ad] = (...a) => { Dokunus.titret(tur); return asil(...a); };
}

// ---------- Tema ve hareket ----------
const sistemKoyu = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
const sistemAzalt = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
function gorunumUygula() {
  const a = d.ayar || {};
  const tema = a.tema === "sistem" ? (sistemKoyu && sistemKoyu.matches ? "koyu" : "pastel") : a.tema || "pastel";
  const azalt = a.hareket === "azalt" || (a.hareket !== "normal" && sistemAzalt && sistemAzalt.matches);
  document.documentElement.dataset.tema = tema;
  document.documentElement.dataset.hareket = azalt ? "azalt" : "normal";
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = getComputedStyle(document.documentElement).getPropertyValue("--krem").trim() || "#FFFBF4";
}
// Kullanıcı "Sistem" seçtiyse telefonun koyu/açık ve hareket tercihi değişince uygulama da değişir; açık seçim etkilenmez.
[sistemKoyu, sistemAzalt].forEach(m => m && m.addEventListener && m.addEventListener("change", () => d && gorunumUygula()));

// ---------- Geri: Android geri tuşu, tarayıcı geri düğmesi ve uygulama içi geri tek yerden ----------
// Sıra: açık pencere → açık tam ekran (oyunda yarıda kalacaksa önce sorulur) → ana sekme dışındaysa ana sayfa.
// Ana sayfada geri uygulamayı kapatmaz (telefonda); tarayıcıda siteden çıkmaya izin verilir.
const OYUN_EKRANLARI = { av: () => av && !av.bitti, savas: () => sv && !sv.bitti, esles: () => es && !es.bitti };
function onayPenceresi(baslik, yazi, evet, hayir, sonra) {
  const p = document.getElementById("pencere");
  p.innerHTML = `<div class="p-ikon">🐾</div><h3></h3><p></p><div class="onay-dugmeler"><button class="buyuk-dugme mor" id="onay-hayir"></button><button class="buyuk-dugme" id="onay-evet"></button></div>`;
  p.querySelector("h3").textContent = baslik; p.querySelector("p").textContent = yazi;
  p.querySelector("#onay-evet").textContent = evet; p.querySelector("#onay-hayir").textContent = hayir;
  document.getElementById("perde").classList.add("aktif");
  const kapat = () => document.getElementById("perde").classList.remove("aktif");
  p.querySelector("#onay-hayir").onclick = kapat;
  p.querySelector("#onay-evet").onclick = () => { kapat(); sonra(); };
  setTimeout(() => p.querySelector("#onay-hayir").focus(), 60);
}
function tamEkraniKapat(t) {
  const dugme = t.querySelector("#av-kapat, [data-kapat], .kapat");
  if (dugme) dugme.click(); else tamKapat();
}
const Geri = {
  // true: bir katman kapatıldı; false: kapatılacak bir şey yoktu (ana sayfadayız).
  bas() {
    const perde = document.getElementById("perde");
    if (perde.classList.contains("aktif")) { perde.classList.remove("aktif"); herSeyiCiz(); return true; }
    const altPanel = document.querySelector(".alt-panel.acik");
    if (altPanel) { altPanelKapat(altPanel); return true; }
    const t = document.querySelector(".tam.aktif");
    if (t) {
      const ad = t.id.replace("tam-", ""), oyunda = OYUN_EKRANLARI[ad] && OYUN_EKRANLARI[ad]();
      if (oyunda) onayPenceresi("Oyundan çıkılsın mı?", "Bu turdaki ilerleme sayılmaz.", "Çık", "Devam et", () => tamEkraniKapat(t));
      else tamEkraniKapat(t);
      return true;
    }
    const aktifSekme = document.querySelector(".ekran.aktif");
    if (aktifSekme && aktifSekme.id !== "ekran-ana") { sekme("ana"); return true; }
    return false;
  },
  kur() {
    const App = yerliEklenti("App");
    if (App) { App.addListener("backButton", () => { Geri.bas(); }); return; } // telefonda: ana sayfada hiçbir şey yapma
    // Tarayıcı: geçmişe tek bir işaret konur; geri düğmesi önce uygulama içi katmanı kapatır.
    history.replaceState({ pati: "kok" }, ""); history.pushState({ pati: "ic" }, "");
    addEventListener("popstate", () => { if (Geri.bas()) history.pushState({ pati: "ic" }, ""); else history.back(); });
  },
};

// ---------- Alt panel (ayarlar içindeki yedek ve kaynaklar pencereleri) ----------
let altPanelAcan = null;
function altPanelAc(id) {
  altPanelAcan = document.activeElement;
  const p = document.getElementById(id); p.classList.add("acik"); p.setAttribute("aria-hidden", "false");
  setTimeout(() => { const ilk = p.querySelector("button, textarea, select, input"); if (ilk) ilk.focus(); }, 60);
}
function altPanelKapat(p) {
  p.classList.remove("acik"); p.setAttribute("aria-hidden", "true");
  if (altPanelAcan && document.body.contains(altPanelAcan)) try { altPanelAcan.focus(); } catch (e) {}
}
