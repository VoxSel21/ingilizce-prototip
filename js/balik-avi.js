// ================= GÜNLÜK BALIK AVI =================
// Kurallar tek yerde: js/oyun.js (AV_KURAL, Av). Bu dosya yalnız çizer ve dokunuşları kurala iletir.
// Kilo yalnız atılma mesafesini değiştirir (Fit 6, Pofuduk 7, Tombiş 8, Mega Chonk 9 doğruyla balığa yetişir; 10 soru, 30 sn).
// Ağır kedi kilitlenmez; giriş penceresi nedenini söyler ve spora davet eder (U17, 4. aşama).
// Süre gerçek geçen zamandan işler; uygulama arka plana geçince oyun durur, dönünce 3'ten geri sayıp sürer.
// Günlük hak: günün ilk avında ilk cevap verilince hak kullanılır; sonraki oyunlar açıkça ödülsüz pratiktir.
let av = null;
function avOynandiMi() { return !Av.odulluMu(d, bugunNo()); }
function avDugmeCiz() {} // ana sayfa butonu kaldırıldı; durum kedi sekmesindeki kartta gösterilir
const halAdi = () => kiloDurumu().ad.replace(/ \S+$/u, "");
function avKuralYazi() {
  const g = Av.gereken(d.kilo);
  return `${AV_KURAL.soru} kelime, ${AV_KURAL.sure} saniye. Her doğru cevapta ${d.kediAd} balığa doğru atılır. Yanlışta balıkçı bakar ❗; üst üste ${AV_KURAL.ustUsteYanlis} yanlışta bir adım geri kaçar (o zaman 1 doğru daha gerekir). ` +
    `${d.kediAd} şu an ${halAdi()}: balığa ${g} doğru yeter.`;
}
function avAc() {
  if (avOynandiMi()) {
    pencere("🐟", "Bugünkü avını yaptın", `${d.avSonuc || ""} Tekrar oynarsan ödülsüz pratik olur; yarın yeni ödüllü av.`, "Tamam", null);
    avIkinciDugme("Pratik için tekrar oyna (ödülsüz)", () => avBasla(true));
    return;
  }
  const hal = Kilo.hali(d.kilo), agir = hal === "tombis" || hal === "mega";
  const neden = agir ? ` Kilo arttıkça atılma kısalır: her doğruda ${Av.atilma(d.kilo)} adım (Fit kedide ${Av.atilma(KILO.enAz)}). Spor salonunda kilo verirsen daha az doğru yeter.` : "";
  pencere(agir ? "🙀" : "🐟", "Günün balık avı", `${avKuralYazi()}${neden} Balığa ulaşırsan 1 🪙 (günde bir). İlk cevapla bugünkü hak başlar; yarıda bırakırsan sonrası pratik olur.`, "Başla", () => avBasla(false));
  if (agir) avIkinciDugme("Önce spora git 🏋️", sporAc);
}
function avIkinciDugme(yazi, sonra) {
  const p = document.getElementById("pencere"), t = document.createElement("button");
  t.textContent = yazi; t.className = "ikinci-dugme";
  t.onclick = () => { document.getElementById("perde").classList.remove("aktif"); sonra(); }; p.appendChild(t);
}
function avKelimeleri() {
  // Önce çalışılmış kelimeler (tekrar işlevi görür; yakında sorulanlar sona), yetmezse seçili seviyenin yenileri
  const calisilan = Ogrenme.pratikSec(KELIMELER.filter(k => d.kartlar[k[0]]).map(k => k[0]), d.sonSunulan, AV_KURAL.soru);
  const diger = karistir(KELIMELER.filter(k => !d.kartlar[k[0]] && k[5] === d.seviye).map(k => k[0]));
  return calisilan.concat(diger).slice(0, AV_KURAL.soru).map(kelimeAl);
}
function avBasla(pratik = false) {
  av = { s: Av.yeni(d.kilo, pratik), saat: Av.saat(), kelimeler: avKelimeleri(), gorunen: 0, hak: false, bitti: false, kilit: true };
  tamAc("av"); avKonumCiz(); avSoruCiz();
  avUyari();
  document.getElementById("av-balikci").classList.remove("dondu");
  document.getElementById("av-pratik").hidden = !pratik;
  // Avdaki kedi, Kedi sekmesindekiyle aynı çizici: aynı renk, eşyalar ve beden (U17).
  KediCizici.yerlestir(document.getElementById("av-kedi"));
  avGeriSay();
}
function avUyari(m) { document.getElementById("av-uyari").textContent = m || `Balıkçı fark etmeden yetiş! ${Av.gereken(av.s.kilo)} doğru yeter`; }
// Başta ve arka plandan dönüşte 3'ten geri sayılır; bu sırada süre işlemez, cevap verilemez.
function avGeriSay() {
  const gs = document.getElementById("geri-sayim"); gs.classList.add("aktif");
  const oyun = av; let say = 3; gs.textContent = say; av.kilit = true; av.geriSayim = true;
  const t = setInterval(() => {
    if (av !== oyun || oyun.bitti) { clearInterval(t); gs.classList.remove("aktif"); return; }
    say--; if (say > 0) { gs.textContent = say; return; }
    clearInterval(t); gs.classList.remove("aktif"); oyun.geriSayim = false;
    if (document.hidden) return; // dönüşte yeniden sayılır
    oyun.kilit = false; Av.surdur(oyun.saat, performance.now());
    requestAnimationFrame(z => avDongu(z, oyun));
  }, 700);
}
document.addEventListener("visibilitychange", () => {
  if (!av || av.bitti || av.geriSayim) return;
  if (document.hidden) { Av.duraklat(av.s, av.saat, performance.now()); av.kilit = true; }
  else avGeriSay();
});
function avDongu(simdi, oyun) {
  if (av !== oyun || oyun.bitti || oyun.saat.durdu) return; // eski oyunun döngüsü yeni oyuna karışmasın; durunca döngü biter
  const once = oyun.saat.son;
  Av.tik(oyun.s, oyun.saat, simdi);
  // Görünen konum gerçek konuma yaklaşık 0,2 sn'de yetişir (yalnız görüntü; kural konumu anında değişir).
  const fark = oyun.s.konum - oyun.gorunen, adim = 90 * Math.max(0, (simdi - once) / 1000);
  oyun.gorunen += Math.sign(fark) * Math.min(Math.abs(fark), adim);
  avKonumCiz();
  const govde = avKediGovde();
  if (govde && ["bekle", "kos"].includes(govde.dataset.hareket)) govde.dataset.hareket = Math.abs(fark) > 0.5 ? "kos" : "bekle";
  const sonuc = oyun.s.sonuc;
  if (sonuc && (sonuc !== "kazandi" || Math.abs(fark) < 0.5)) return avBitir();
  requestAnimationFrame(z => avDongu(z, oyun));
}
const avKediGovde = () => document.querySelector("#av-kedi .kedi-govde");
function avKonumCiz() {
  const pist = document.getElementById("pist"), kedi = document.getElementById("av-kedi");
  const menzil = pist.clientWidth - 64 - 40 - 6; // balığın soluna kadar
  kedi.style.transform = `translateX(${Math.min(1, av.gorunen / AV_KURAL.yol) * menzil}px)`;
  const s = Av.kalan(av.s);
  document.getElementById("av-sure").textContent = Math.ceil(s);
  const c = document.getElementById("av-sure-cubuk"); c.style.width = (s / AV_KURAL.sure * 100) + "%"; c.classList.toggle("az", s < 8);
  document.getElementById("av-adim").textContent = `🐾 ${av.s.dogru}/${Av.hedefDogru(av.s)} doğru`;
}
function avSoruCiz() {
  if (av.s.i >= av.kelimeler.length) { document.getElementById("av-siklar").innerHTML = ""; return; } // bitiş kontrolü oyun döngüsünde
  const k = av.kelimeler[av.s.i];
  d.sonSunulan = Ogrenme.sunuldu(d.sonSunulan, k[0]);
  document.getElementById("av-kelime").textContent = k[0];
  const siklar = karistir([k[1], ...karistir(KELIMELER.filter(x => x[0] !== k[0] && !anlamCakisir(x, k))).slice(0, 3).map(x => x[1])]);
  document.getElementById("av-siklar").innerHTML = siklar.map(s => `<button class="av-sik">${s}</button>`).join("");
  document.querySelectorAll(".av-sik").forEach(b => b.onclick = () => avCevap(b, b.textContent === k[1], k));
}
function avCevap(b, dogru, k) {
  if (av.kilit || av.bitti || av.s.sonuc) return;
  Av.tik(av.s, av.saat, performance.now()); // cevap anına kadar geçen gerçek süre işlenir; süre dolduysa cevap sayılmaz
  if (av.s.sonuc) return;
  av.kilit = true;
  // Gecikmeli işlemler yalnız kendi av oturumunu etkiler; kapatılıp yeni av başlarsa eskisi yeniye karışmaz.
  const oturum = av, buOturum = () => av === oturum && !oturum.bitti;
  if (!av.s.pratik && !av.hak) { av.hak = true; Av.hakKullan(d, bugunNo()); d.avSonuc = "Av yarıda kaldı."; kaydet(); }
  const olay = Av.cevap(av.s, dogru);
  if (dogru) {
    b.classList.add("dogru"); avEfekt("💨"); Ses.dogru();
    kediHareket(avKediGovde(), "kos", 0);
  } else {
    b.classList.add("yanlis"); avEfekt("💦"); Ses.yanlis();
    const balikci = document.getElementById("av-balikci"), unlem = document.getElementById("av-unlem");
    balikci.classList.add("dondu"); unlem.classList.add("acik");
    setTimeout(() => { balikci.classList.remove("dondu"); unlem.classList.remove("acik"); }, 700);
    if (olay.geriKac) {
      setTimeout(() => Ses.geri(), 150); avEfekt("🙀");
      avUyari(`Balıkçı gördü! ${d.kediAd} geri kaçtı 🙀`);
      setTimeout(() => { if (buOturum()) avUyari(Av.yetisir(oturum.s) ? null : "Bu turda yetişmek zor, pratik say 💪"); }, 1400);
    }
    document.querySelectorAll(".av-sik").forEach(x => { if (x.textContent === k[1]) x.classList.add("dogru"); });
    kediHareket(avKediGovde(), "uzgun", 900);
  }
  // Bilinen kelime kart sistemine de işlenir: yanlış bilinen yarın tekrar gelir
  if (d.kartlar[k[0]] && !dogru) d.kartlar[k[0]] = { kutu: 1, sira: bugunNo() + 1, hata: (d.kartlar[k[0]].hata || 0) + 1 };
  setTimeout(() => { if (!buOturum() || oturum.s.sonuc) return; oturum.kilit = false; avSoruCiz(); }, (dogru ? AV_KURAL.dogruBekleme : AV_KURAL.yanlisBekleme) * 1000);
}
function avEfekt(e) {
  const kedi = document.getElementById("av-kedi"), s = document.createElement("span");
  s.className = "efekt"; s.textContent = e;
  s.style.left = (kedi.getBoundingClientRect().left - document.getElementById("pist").getBoundingClientRect().left - 6) + "px"; s.style.top = "52%";
  document.getElementById("pist").appendChild(s); setTimeout(() => s.remove(), 600);
}
function avBitir() {
  const s = av.s, ulasti = s.sonuc === "kazandi";
  av.bitti = true; av.gorunen = Math.min(av.gorunen, AV_KURAL.yol); avKonumCiz();
  const yuzde = ulasti ? 100 : Math.min(99, Math.floor(s.konum / AV_KURAL.yol * 100));
  // Ödül: günün ödüllü avında balığa ulaşınca 1 altın (defter anahtarı "av:<gün>", günde bir). Pratik ödülsüz: altın ve kilo değişmez.
  const odul = ulasti && !s.pratik ? Ekonomi.kazan(d, "av:" + bugunNo(), EKONOMI.odul.balikAvi.miktar, bugunNo()) : 0;
  if (ulasti && !s.pratik) kiloDegis(KILO.fark.balik); // balığı yedi
  if (!s.pratik) { if (!av.hak) Av.hakKullan(d, bugunNo()); d.avSonuc = `${s.dogru} doğru, ${s.yanlis} yanlış · ${ulasti ? "balığa ulaştın" : "yolun %" + yuzde + "'i"} · +${odul} 🪙.`; }
  gunIsaretle();
  kaydet(); avDugmeCiz();
  if (ulasti) { kediHareket(avKediGovde(), "kutla"); avUyari("Kaptı! 🐟"); Ses.zafer(); }
  else { kediHareket(avKediGovde(), "uzgun"); document.getElementById("av-balikci").classList.add("dondu"); avUyari(s.sonuc === "sure" ? "Süre bitti! ❗" : "Balıkçı fark etti! ❗"); }
  const oyun = av;
  setTimeout(() => {
    if (av !== oyun || !document.getElementById("tam-av").classList.contains("aktif")) return;
    tamKapat();
    const neden = ulasti ? `Kalan süre: ${Math.ceil(Av.kalan(s))} sn.` : `${d.kediAd} yolun %${yuzde}'ine geldi${s.sonuc === "sure" ? ", süre bitti" : ""}.`;
    pencere(ulasti ? "😻" : "🙀", ulasti ? "Balığı kaptın!" : s.sonuc === "sure" ? "Süre bitti!" : "Balıkçı fark etti!",
      `${s.dogru} doğru, ${s.yanlis} yanlış. ${neden} ${s.pratik ? "Pratik turu: ödül yok." : `+${odul} 🪙`}`, "Tamam");
    av = null;
  }, 1100);
}
// Yarıda kapatma (✕ ya da geri tuşu): ödüllü avda ilk cevap verildiyse günün hakkı kullanılmış kalır.
document.getElementById("av-kapat").onclick = () => {
  const hakGitti = av && !av.bitti && !av.s.pratik && av.hak;
  if (av && !av.bitti) { av.bitti = true; av = null; }
  tamKapat();
  if (hakGitti) bildir("🐟 Av yarıda kaldı. Bugün pratik oynayabilirsin, ödüllü av yarın.");
};
