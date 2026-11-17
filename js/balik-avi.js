// ================= GÜNLÜK BALIK AVI =================
// Kurallar tek yerde: js/oyun.js (AV_KURAL, Av). Bu dosya yalnız çizer ve dokunuşları kurala iletir.
// Kilo yalnız atılma mesafesini değiştirir (Fit 6, Pofuduk 7, Tombiş 8, Mega Chonk 9 doğruyla balığa yetişir; 10 soru, 30 sn).
// Ağır kedi kilitlenmez; giriş penceresi nedenini söyler ve spora davet eder (U17, 4. aşama).
// Süre gerçek geçen zamandan işler; uygulama arka plana geçince oyun durur, dönünce 3'ten geri sayıp sürer.
// Günlük hak: günün ilk avında ilk cevap verilince hak kullanılır; sonraki oyunlar açıkça ödülsüz pratiktir.
let av = null;
Oturumlar.ekle('av', () => {
  if (av) { av.bitti = true; cancelAnimationFrame(av.kareId); if (av.gorunum) av.gorunum.kapat(); } av = null;
}, () => av && !av.bitti, () => av && !av.s.pratik && av.hak ? 'Bugünkü ödüllü av hakkın kullanılmış sayılır; sonra yalnız pratik oynayabilirsin.' : null);
function avOynandiMi() { return !Av.odulluMu(d, bugunNo()); }
function avDugmeCiz() {} // ana sayfa butonu kaldırıldı; durum kedi sekmesindeki kartta gösterilir
const halAdi = () => kiloDurumu().ad.replace(/ \S+$/u, "");
function avKuralYazi() {
  const g = Av.gereken(d.kilo);
  return `${AV_KURAL.soru} kelime, ${AV_KURAL.sure} saniye. Her doğru cevapta ${d.kediAd} balığa doğru atılır. Yanlışta balıkçı bakar ❗; üst üste ${AV_KURAL.ustUsteYanlis} yanlışta bir adım geri kaçar (o zaman 1 doğru daha gerekir). ` +
    `${d.kediAd} şu an ${halAdi()}: balığa ${g} doğru yeter.`;
}
function avAc() {
  const odullu = !avOynandiMi();
  pencere(patiIkon('fish'), 'Pati ile balık avı',
    `Doğru cevapla Pati’yi balığa yaklaştır. Üç soruluk alıştırmada süre ve ödül yok; günlük hakkın korunur.`,
    'Önce alıştır · 3 soru', () => avBasla(true,true));
  avIkinciDugme(odullu ? 'Ödüllü deneme · 30 saniye' : 'Serbest pratik · ödülsüz', () => avBasla(!odullu));
  avIkinciDugme('Kediye dön', avGirisKapat);
  document.getElementById('pencere').dataset.avGiris='1';
  const bilgi=document.createElement('details'), bas=document.createElement('summary'), yazi=document.createElement('p');
  bas.textContent='Diğer kurallar';yazi.textContent=`${avKuralYazi()} Ödüllü denemede ilk cevap veya sürenin bitmesi günlük hakkı kullanır. Sonraki denemeler ödülsüzdür. Alıştırma hiçbir ilerleme veya ödül kaydını değiştirmez.`;
  bilgi.append(bas,yazi);document.getElementById('pencere').append(bilgi);
}

function avGirisKapat() {
  document.getElementById('perde').classList.remove('aktif');
  delete document.getElementById('pencere').dataset.avGiris;
  document.getElementById('kedi-etkinlik')?.focus();
}
document.addEventListener('keydown', e => {
  if(e.key==='Escape' && panelAcikAvGirisi()) { e.preventDefault(); avGirisKapat(); }
});
document.addEventListener('click', e => {
  if(e.target===document.getElementById('perde') && panelAcikAvGirisi()) avGirisKapat();
});
function panelAcikAvGirisi() {
  return document.getElementById('perde').classList.contains('aktif') && document.getElementById('pencere').dataset.avGiris==='1';
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
function avBasla(pratik = false, egitim = false) {
  delete document.getElementById('pencere').dataset.avGiris;
  if (av && av.gorunum) av.gorunum.kapat();
  av = { s: Av.yeni(d.kilo, pratik), egitim, hareketAz: document.documentElement.dataset.hareket === "azalt", saat: Av.saat(), kelimeler: avKelimeleri(), gorunen: 0, hak: false, bitti: false, kilit: true };
  if (egitim) { av.kelimeler=(KELIMELER.filter(k=>d.kartlar[k[0]]).length >= 3 ? av.kelimeler : ["apple","bread","cat"].map(kelimeAl)).slice(0,3);av.s.atilma=34; }
  const oyun = av;
  document.getElementById('av-mod').hidden=!egitim;
  document.getElementById('av-sure').hidden=egitim;
  document.getElementById('av-sure-cubuk').parentElement.hidden=egitim;
  oyun.kare = simdi => avDongu(simdi, oyun);
  tamAc("av");
  oyun.gorunum = AvGorunum.olustur({ pist: document.getElementById('pist'), kedi: document.getElementById('av-kedi'),
    hedef: document.querySelector('#pist .hedef-balik'), cubuk: document.getElementById('av-sure-cubuk'), sure: document.getElementById('av-sure'), adim: document.getElementById('av-adim') }, AV_KURAL.sure);
  oyun.gorunum.sayac(0, Av.hedefDogru(oyun.s)); avKonumCiz(); avSoruCiz();
  avUyari();
  document.getElementById("av-balikci").classList.remove("dondu");
  document.getElementById("av-pratik").hidden = !pratik;
  // Avdaki kedi, Kedi sekmesindekiyle aynı çizici: aynı renk, eşyalar ve beden (U17).
  av.govde = KediCizici.yerlestir(document.getElementById("av-kedi"));
  avGeriSay();
}
function avUyari(m) { document.getElementById("av-uyari").textContent = m || (av.egitim ? "Doğru cevapla Pati’yi yaklaştır." : `Balıkçı fark etmeden yetiş! ${Av.gereken(av.s.kilo)} doğru yeter`); }
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
    oyun.kareId = requestAnimationFrame(oyun.kare);
  }, 700);
}
document.addEventListener("visibilitychange", () => {
  if (!av || av.bitti || av.geriSayim) return;
  if (document.hidden) { cancelAnimationFrame(av.kareId); if(av.egitim) av.saat.durdu=true; else Av.duraklat(av.s, av.saat, performance.now()); av.kilit = true; }
  else avGeriSay();
});
function avDongu(simdi, oyun) {
  if (av !== oyun || oyun.bitti || oyun.saat.durdu) return; // eski oyunun döngüsü yeni oyuna karışmasın; durunca döngü biter
  const once = oyun.saat.son;
  if (!oyun.egitim) Av.tik(oyun.s, oyun.saat, simdi);
  // Görünen konum gerçek konuma yaklaşık 0,2 sn'de yetişir (yalnız görüntü; kural konumu anında değişir).
  const fark = oyun.s.konum - oyun.gorunen, adim = 90 * Math.max(0, (simdi - once) / 1000);
  if(oyun.hareketAz) oyun.gorunen=oyun.s.konum;
  else oyun.gorunen += Math.sign(fark) * Math.min(Math.abs(fark), adim);
  avKonumCiz();
  const govde = avKediGovde();
  if (govde && (govde.dataset.hareket === 'bekle' || govde.dataset.hareket === 'kos')) {
    const hareket = Math.abs(fark) > 0.5 ? 'kos' : 'bekle'; if (govde.dataset.hareket !== hareket) govde.dataset.hareket = hareket;
  }
  const sonuc = oyun.s.sonuc;
  if (sonuc && (sonuc !== "kazandi" || Math.abs(fark) < 0.5)) return avBitir();
  oyun.kareId = requestAnimationFrame(oyun.kare);
}
const avKediGovde = () => av && av.govde;
function avKonumCiz() {
  av.gorunum.ciz(av.gorunen, Av.kalan(av.s), AV_KURAL.yol);
}
function avSoruCiz() {
  if (av.s.i >= av.kelimeler.length) { document.getElementById("av-siklar").innerHTML = ""; return; } // bitiş kontrolü oyun döngüsünde
  const k = av.kelimeler[av.s.i];
  if (!av.egitim) d.sonSunulan = Ogrenme.sunuldu(d.sonSunulan, k[0]);
  document.getElementById("av-kelime").textContent = k[0];
  const siklar = karistir([k[1], ...yanlisSecenekler(k,KELIMELER).map(x => x[1])]);
  document.getElementById("av-siklar").innerHTML = siklar.map(s => `<button class="av-sik">${s}</button>`).join("");
  document.querySelectorAll(".av-sik").forEach(b => b.onclick = () => avCevap(b, b.textContent === k[1], k));
}
function avCevap(b, dogru, k) {
  if (av.kilit || av.bitti || av.s.sonuc) return;
  if (!av.egitim) Av.tik(av.s, av.saat, performance.now()); // cevap anına kadar geçen gerçek süre işlenir; süre dolduysa cevap sayılmaz
  if (av.s.sonuc) return;
  av.kilit = true;
  // Gecikmeli işlemler yalnız kendi av oturumunu etkiler; kapatılıp yeni av başlarsa eskisi yeniye karışmaz.
  const oturum = av, buOturum = () => av === oturum && !oturum.bitti;
  if (!av.s.pratik && !av.hak) { av.hak = true; Av.hakKullan(d, bugunNo()); d.avSonuc = "Av yarıda kaldı."; }
  if (!av.egitim) Ilerleme.kelimeIsaretle(d, k[0]);
  const olay = Av.cevap(av.s, dogru);
  if (av.egitim && av.s.i >= av.kelimeler.length && !av.s.sonuc) av.s.sonuc="soru";
  av.gorunum.sayac(av.s.dogru, Av.hedefDogru(av.s));
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
      avUyari(`Balıkçı gördü! ${d.kediAd} geri kaçtı`);
      setTimeout(() => { if (buOturum()) avUyari(Av.yetisir(oturum.s) ? null : "Bu turda yetişmek zor, pratik say"); }, 1400);
    }
    document.querySelectorAll(".av-sik").forEach(x => { if (x.textContent === k[1]) x.classList.add("dogru"); });
    kediHareket(avKediGovde(), "uzgun", 900);
  }
  // Bilinen kelime kart sistemine de işlenir: yanlış bilinen yarın tekrar gelir
  if (!av.egitim && d.kartlar[k[0]] && !dogru) d.kartlar[k[0]] = { ...d.kartlar[k[0]], kutu: 1, sira: bugunNo() + 1, hata: (d.kartlar[k[0]].hata || 0) + 1 };
  if (!av.egitim) kaydet();
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
  if (!av.egitim) { gunIsaretle(); kaydet(); } avDugmeCiz();
  if (ulasti) { kediHareket(avKediGovde(), "kutla"); avUyari("Kaptı!"); Ses.zafer(); }
  else { kediHareket(avKediGovde(), "uzgun"); document.getElementById("av-balikci").classList.add("dondu"); avUyari(s.sonuc === "sure" ? "Süre bitti!" : "Balıkçı fark etti!"); }
  const oyun = av;
  setTimeout(() => {
    if (av !== oyun || !document.getElementById("tam-av").classList.contains("aktif")) return;
    const neden = ulasti ? `Kalan süre: ${Math.ceil(Av.kalan(s))} sn.` : `${d.kediAd} yolun %${yuzde}'ine geldi${s.sonuc === "sure" ? ", süre bitti" : ""}.`;
    turSonucu(ulasti ? "😻" : "🙀", av.egitim ? "Alıştırma tamam" : ulasti ? "Balığı kaptın!" : s.sonuc === "sure" ? "Süre doldu; bir daha deneyebiliriz" : "Bir tur daha deneyelim mi?",
      `${s.dogru} doğru, ${s.yanlis} yanlış. ${av.egitim ? "Alıştırma tamamlandı; günlük ödüllü hakkın yerinde." : neden} ${s.pratik ? "Ödülsüz pratik." : `+${odul} altın.`} İstersen yeniden deneyebilirsin.`, avAc);
  }, 1100);
}
// Yarıda kapatma (✕ ya da geri tuşu): ödüllü avda ilk cevap verildiyse günün hakkı kullanılmış kalır.
document.getElementById("av-kapat").onclick = () => {
  const hakGitti = av && !av.bitti && !av.s.pratik && av.hak;
  tamKapat();
  if (hakGitti) bildir("🐟 Av yarıda kaldı. Bugün pratik oynayabilirsin, ödüllü av yarın.");
};
