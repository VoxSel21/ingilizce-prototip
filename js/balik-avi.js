// ================= GÜNLÜK BALIK AVI =================
// Denge (Serhat, 2026-10-18): kedi kendiliğinden yürümez. Sadece doğru cevapta 15 birim atılır,
// yanlışta yerinde kalır. Yol 100: 7 doğru = 105 (ulaşır), 6 doğru = 90 (kaçırır). Süre 30 sn.
const AV = { YOL: 100, SURE: 30, ATILMA: 15 };
let av = null;
function avOynandiMi() { return d.avGunu === bugunNo(); }
function avDugmeCiz() {} // ana sayfa butonu kaldırıldı; durum kedi sekmesindeki kartta gösterilir
function avAc() {
  if (d.kilo >= 8 && !avOynandiMi()) {
    pencere("🙀", `${d.kediAd} çok tombiş!`, "Balığa koşacak hali yok. Önce spor salonunda biraz eski kelime tekrarı yapalım, sonra ava çıkarız.", "Spora git", sporAc);
    return;
  }
  if (avOynandiMi()) {
    pencere("🐟", "Bugünkü avını yaptın", d.avSonuc || "Yarın yeni balık gelecek.", "Tamam", null);
    // Prototipte denemeyi kolaylaştırmak için tekrar oynama yolu
    const p = document.getElementById("pencere"); const t = document.createElement("button");
    t.textContent = "Test için tekrar oyna"; t.style.cssText = "margin-top:12px;font-weight:800;color:var(--soluk);text-decoration:underline;font-size:13px;";
    t.onclick = () => { document.getElementById("perde").classList.remove("aktif"); avBasla(); }; p.appendChild(t);
    return;
  }
  pencere("🐟", "Günün balık avı", "10 kelime, 30 saniye. Her doğru cevapta kedi balığa doğru atılır. Yanlışta balıkçı fark eder ❗; üst üste iki yanlışta kedi bir adım geri kaçar. 10 kelimenin 7'sini bilirsen balığa ulaşırsın. Balıkçı fark etmeden yetiş! Balığa ulaşırsan 1 🪙 kazanırsın. Günde bir kez oynanır.", "Başla", avBasla);
}
function avKelimeleri() {
  // Önce çalışılmış kelimeler (tekrar işlevi görür), yetmezse yenileri
  const calisilan = KELIMELER.filter(k => d.kartlar[k[0]]), diger = KELIMELER.filter(k => !d.kartlar[k[0]] && k[5] === d.seviye);
  return [...calisilan].sort(() => Math.random() - .5).concat([...diger].sort(() => Math.random() - .5)).slice(0, 10);
}
function avBasla() {
  av = { kelimeler: avKelimeleri(), i: 0, konum: 0, kalan: AV.SURE, durma: 0, atilma: 0, dogru: 0, yanlis: 0, ust: 0, bitti: false, kilit: true };
  tamAc("av"); avKonumCiz(); avSoruCiz();
  document.getElementById("av-uyari").textContent = "Balıkçı fark etmeden balığa ulaş!";
  document.getElementById("av-balikci").classList.remove("dondu");
  document.getElementById("av-kedi").textContent = "🐱";
  const gs = document.getElementById("geri-sayim"); gs.classList.add("aktif");
  let say = 3; gs.textContent = say;
  const oyunu = av;
  const t = setInterval(() => {
    if (av !== oyunu) return clearInterval(t);
    say--; if (say > 0) { gs.textContent = say; return; }
    clearInterval(t); gs.classList.remove("aktif");
    av.kilit = false; av.son = performance.now();
    const oyun = av; requestAnimationFrame(t => avDongu(t, oyun));
  }, 700);
}
function avDongu(simdi, oyun) {
  if (!av || av !== oyun || av.bitti) return; // eski oyunun döngüsü yeni oyuna karışmasın
  const dt = Math.min(.1, (simdi - av.son) / 1000); av.son = simdi;
  av.kalan -= dt;
  if (av.atilma > 0) { const adim = Math.min(av.atilma, 80 * dt); av.konum += adim; av.atilma -= adim; } // atılma 0,15 sn'de akar
  if (av.konum >= AV.YOL) return avBitir(true);
  if (av.kalan <= 0) return avBitir(false);
  if (av.i >= av.kelimeler.length && av.atilma <= 0) return avBitir(false); // kelimeler bitti, yetişemedi
  avKonumCiz();
  requestAnimationFrame(t => avDongu(t, oyun));
}
function avKonumCiz() {
  const pist = document.getElementById("pist"), kedi = document.getElementById("av-kedi");
  const menzil = pist.clientWidth - 64 - 40 - 6; // balığın soluna kadar
  kedi.style.transform = `translateX(${Math.min(1, av.konum / AV.YOL) * menzil}px)`;
  const s = Math.max(0, av.kalan);
  document.getElementById("av-sure").textContent = Math.ceil(s);
  const c = document.getElementById("av-sure-cubuk"); c.style.width = (s / AV.SURE * 100) + "%"; c.classList.toggle("az", s < 8);
}
function avSoruCiz() {
  if (av.i >= av.kelimeler.length) { // kelimeler bitti; ulaşamadıysa süreyi beklemeye gerek yok
    document.getElementById("av-siklar").innerHTML = "";
    return; } // bitiş kontrolü oyun döngüsünde
  const k = av.kelimeler[av.i];
  document.getElementById("av-kelime").textContent = k[0];
  const siklar = [k[1], ...KELIMELER.filter(x => x[0] !== k[0]).sort(() => Math.random() - .5).slice(0, 3).map(x => x[1])].sort(() => Math.random() - .5);
  document.getElementById("av-siklar").innerHTML = siklar.map(s => `<button class="av-sik">${s}</button>`).join("");
  document.querySelectorAll(".av-sik").forEach(b => b.onclick = () => avCevap(b, b.textContent === k[1], k));
}
function avCevap(b, dogru, k) {
  if (av.kilit || av.bitti) return; av.kilit = true;
  // Gecikmeli işlemler yalnız kendi av oturumunu etkiler; kapatılıp yeni av başlarsa eskisi yeniye karışmaz.
  const oturum = av, buOturum = () => av === oturum && !oturum.bitti;
  const kedi = document.getElementById("av-kedi");
  if (dogru) {
    b.classList.add("dogru"); av.dogru++; av.ust = 0; av.atilma += AV.ATILMA; avEfekt("💨"); Ses.dogru();
    kedi.animate([{ transform: kedi.style.transform + " scaleX(1.3)" }, { transform: kedi.style.transform }], { duration: 200 });
  } else {
    b.classList.add("yanlis"); av.yanlis++; av.ust = (av.ust || 0) + 1; avEfekt("💦"); Ses.yanlis();
    // Balıkçı her yanlışta bakar (❗); üst üste ikinci yanlışta kedi bir adım geri kaçar
    const balikci = document.getElementById("av-balikci"), unlem = document.getElementById("av-unlem");
    balikci.classList.add("dondu"); unlem.classList.add("acik");
    setTimeout(() => { balikci.classList.remove("dondu"); unlem.classList.remove("acik"); }, 700);
    if (av.ust >= 2) {
      av.ust = 0; av.atilma = 0; av.konum = Math.max(0, av.konum - AV.ATILMA);
      setTimeout(() => Ses.geri(), 150); avEfekt("🙀");
      document.getElementById("av-uyari").textContent = "Balıkçı gördü! Pati geri kaçtı 🙀";
      setTimeout(() => { if (buOturum()) document.getElementById("av-uyari").textContent = "Balıkçı fark etmeden balığa ulaş!"; }, 1400);
    }
    document.querySelectorAll(".av-sik").forEach(x => { if (x.textContent === k[1]) x.classList.add("dogru"); });
    kedi.textContent = "😿"; setTimeout(() => { if (buOturum()) kedi.textContent = "🐱"; }, 900);
  }
  // Bilinen kelime kart sistemine de işlenir: yanlış bilinen yarın tekrar gelir
  if (d.kartlar[k[0]] && !dogru) d.kartlar[k[0]] = { kutu: 1, sira: bugunNo() + 1, hata: (d.kartlar[k[0]].hata || 0) + 1 };
  setTimeout(() => { if (!buOturum()) return; av.i++; av.kilit = false; avSoruCiz(); }, dogru ? 250 : 600);
}
function avEfekt(e) {
  const kedi = document.getElementById("av-kedi"), s = document.createElement("span");
  s.className = "efekt"; s.textContent = e;
  s.style.left = (kedi.getBoundingClientRect().left - document.getElementById("pist").getBoundingClientRect().left - 6) + "px"; s.style.top = "52%";
  document.getElementById("pist").appendChild(s); setTimeout(() => s.remove(), 600);
}
function avBitir(ulasti) {
  av.bitti = true; avKonumCiz();
  const kedi = document.getElementById("av-kedi"); kedi.classList.remove("kosuyor");
  const yuzde = ulasti ? 100 : Math.min(99, Math.floor(av.konum / AV.YOL * 100));
  // Ödül kademeli: ulaşırsa büyük ödül, ulaşamazsa yaklaştığı kadar küçük teselli
  const odul = ulasti ? 1 : 0; // Serhat: oyunu bitirmek 1 altın
  if (ulasti) kiloDegis(0.5); // balığı yedi
  d.yildiz += odul; d.avGunu = bugunNo(); (d.avlar = d.avlar || {})[bugunNo()] = 1;
  d.avSonuc = `${av.dogru} doğru, ${av.yanlis} yanlış · ${ulasti ? "balığa ulaştın" : "yolun %" + yuzde + "'i"} · +${odul} 🪙`;
  kaydet(); avDugmeCiz();
  if (ulasti) { kedi.textContent = "😻"; document.getElementById("av-uyari").textContent = "Kaptı! 🐟"; Ses.zafer(); }
  else { kedi.textContent = "🙀"; document.getElementById("av-balikci").classList.add("dondu"); document.getElementById("av-uyari").textContent = "Balıkçı fark etti! ❗"; }
  setTimeout(() => {
    tamKapat();
    pencere(ulasti ? "😻" : "🙀", ulasti ? "Balığı kaptın!" : "Balıkçı fark etti!",
      `${av.dogru} doğru, ${av.yanlis} yanlış. ${ulasti ? `Kalan süre: ${Math.ceil(av.kalan)} sn.` : `Kedi yolun %${yuzde}'ine geldi.`} +${odul} 🪙`, "Tamam");
    av = null;
  }, 1100);
}
document.getElementById("av-kapat").onclick = () => { if (av && !av.bitti) { av.bitti = true; av = null; } tamKapat(); };

