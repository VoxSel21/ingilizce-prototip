// ================= KEDİ =================
// Eski hazır kürkler: 4. kayıt sürümünden beri renk serbest (js/kayit.js ESKI_KURK_RENK). Liste, eski kayıt ve yedeklerdeki
// satın alınmış kürk kimlikleri tanınsın diye duruyor; ekranda artık kullanılmıyor.
const KURKLER = {
  turuncu: { ad: "Turuncu", ana: "#F6A04D", koyu: "#DB7A2A", fiyat: 0 },
  krem:    { ad: "Krem", ana: "#F1DDBF", koyu: "#D2B48A", fiyat: 3 },
  gri:     { ad: "Gri", ana: "#A9AAB8", koyu: "#7E7F90", fiyat: 3 },
  siyah:   { ad: "Gece", ana: "#4A4458", koyu: "#2E2A3A", fiyat: 5 },
  beyaz:   { ad: "Beyaz", ana: "#FFFFFF", koyu: "#D9D9E0", fiyat: 4 },
};
const ESYALAR = [
  { id: "kasket", yer: "sapka", ad: "Kasket", fiyat: 2 },
  { id: "hasir", yer: "sapka", ad: "Hasır şapka", fiyat: 3 },
  { id: "silindir", yer: "sapka", ad: "Silindir", fiyat: 5 },
  { id: "kep", yer: "sapka", ad: "Mezuniyet kepi", fiyat: 0, rozet: "ogrendi" },
  { id: "tac", yer: "sapka", ad: "Taç", fiyat: 10 },
  { id: "fiyonk", yer: "boyun", ad: "Papyon", fiyat: 2 },
  { id: "zil", yer: "boyun", ad: "Zilli tasma", fiyat: 3 },
  { id: "gozluk", yer: "goz", ad: "Gözlük", fiyat: 3 },
  { id: "gunes", yer: "goz", ad: "Kalpli gözlük", fiyat: 5 },
];
// Çizimler Gemini'den (cizim/gemini-komutlari.md), cizim/hazirla.py ile temizlendi.
// Kedi dört kilo halinde de aynı pozda; eşyaların yeri tek ayarla hepsine oturur.
// Gerçek giydirme (2026-10-19): Gemini her eşyayı kediye giydirdi; giydirilmiş resimle çıplak resmin
// farkı katman (giy_*.png, 600x500, kedi çerçevesi + çeyrek pay) olarak çıkarıldı (cizim/giydirme.py).
// Şapkanın altında kalan kulak uçları silme maskesiyle (sil_*.png) kediden silinir, sonra katman konur.
// Kedinin çizimi, kürk rengi ve hareketleri tek yerde: js/kedi-cizim.js (KediCizici, kediHareket).
const SILME_VAR = ["kasket", "hasir", "silindir"];
function kediHali() { return d.kilo < 4.5 ? "fit" : d.kilo < 6 ? "pofuduk" : d.kilo < 7.5 ? "tombis" : "mega"; }
const resimOnbellek = {};
function resimYukle(src) {
  // Yüklenemeyen resim önbellekte "başarısız" olarak takılı kalmasın; bağlantı gelince yeniden denensin.
  return resimOnbellek[src] ||= new Promise((ok, hata) => { const r = new Image(); r.onload = () => ok(r); r.onerror = e => { delete resimOnbellek[src]; hata(e); }; r.src = src; });
}
// Aynı görünüm zaten çiziliyse kedi yeniden kurulmaz (animasyon baştan başlamasın, gereksiz boyama olmasın).
function kediGuncelle(kap, g = KediCizici.gorunum()) {
  if (!kap) return null;
  const anahtar = JSON.stringify(g);
  if (kap._kediAnahtar === anahtar && kap.querySelector(".kedi-govde")) return kap.querySelector(".kedi-govde");
  kap._kediAnahtar = anahtar;
  return KediCizici.yerlestir(kap, g);
}
// Gardıropta denenen (alınmamış) eşya yalnız görünüştür, satın alma yapmaz; panel kapanınca biter.
// Renk taslağı da öyle: Kaydet'e basılmadan kayda geçmez.
let dolapYer = "sapka", denenen = null, renkTaslak = null;
function sahneGorunumu() {
  const g = KediCizici.gorunum();
  const e = denenen && ESYALAR.find(x => x.id === denenen);
  if (e) g.giyili[e.yer] = e.id;
  if (renkTaslak) g.renk = renkTaslak;
  return g;
}
const esyaVarMi = e => d.esyalar.includes(e.id) || !!(e.rozet && d.rozet[e.rozet]);
const sahneGovde = () => document.querySelector("#kedi-kutu .kedi-govde");
const kediHareketSahne = (ad, sure) => kediHareket(sahneGovde(), ad, sure);
function kediCiz() {
  document.getElementById("kedi-ad").textContent = `🐱 ${d.kediAd} ✏️`;
  document.getElementById("kedi-sahne").style.backgroundImage = `url(resim/bg_${d.tema}.jpg)`;
  kediGuncelle(document.getElementById("kedi-kutu"), sahneGorunumu());
  kediGuncelle(document.getElementById("ana-kedi"));
  const kd = kiloDurumu();
  for (const id of ["kilo-durum", "kilo-durum2"]) document.getElementById(id).textContent = kd.ad;
  for (const id of ["kilo-kg", "kilo-kg2"]) document.getElementById(id).textContent = d.kilo.toFixed(1) + " kg";
  document.getElementById("kilo-isaret").style.left = ((d.kilo - 3) / 6.5 * 100) + "%";
  // Günün avı kartı
  const oynandi = avOynandiMi();
  document.getElementById("av-kart").classList.toggle("oynandi", oynandi);
  document.getElementById("av-kart-yazi").textContent = oynandi ? "Bugünkü avını yaptın. Yarın yeni balık!" : "30 saniye, 10 kelime. Balığa ulaşırsan 1 🪙";
  dolapCiz(); sahnelerCiz();
}
function dolapCiz() {
  document.querySelectorAll("#dolap-sekme button").forEach(b => { b.classList.toggle("aktif", b.dataset.yer === dolapYer); b.setAttribute("aria-selected", b.dataset.yer === dolapYer); });
  let h = "";
  for (const e of ESYALAR.filter(x => x.yer === dolapYer)) {
    const var_ = esyaVarMi(e), giyili = d.giyili[e.yer] === e.id, dene = denenen === e.id;
    const kilit = e.rozet && !d.rozet[e.rozet];
    const etiket = giyili ? "Giyili ✓" : var_ ? "Giy" : dene ? "Deneniyor" : kilit ? "🔒 Başarım" : "🪙 " + e.fiyat;
    h += `<button class="esya-kart ${giyili ? "giyili" : ""} ${dene ? "deneniyor" : ""}" data-esya="${e.id}" aria-pressed="${giyili || dene}">
      <span class="e-ikon"><img src="resim/esya_${e.id}.png" alt=""></span><b>${e.ad}</b><span class="esya-etiket">${etiket}</span></button>`;
  }
  document.getElementById("dolap").innerHTML = h;
  // Deneme çubuğu: denenen eşyanın adı, fiyatı ve "Al ve giy"
  const yazi = document.getElementById("dene-yazi"), e = ESYALAR.find(x => x.id === denenen);
  yazi.textContent = "";
  if (!e) yazi.textContent = "Bir eşyaya dokun: önce üstünde dene, beğenirsen al.";
  else {
    const b = document.createElement("b"); b.textContent = `${e.ad} deneniyor`; yazi.appendChild(b);
    if (e.rozet && !d.rozet[e.rozet]) yazi.append(" · “Usta” başarımıyla açılır.");
    else {
      const al = document.createElement("button"); al.className = "al"; al.id = "dene-al";
      al.textContent = d.yildiz < e.fiyat ? `🪙 ${e.fiyat} · altın yetmiyor` : `🪙 ${e.fiyat} · Al ve giy`; al.disabled = d.yildiz < e.fiyat;
      al.onclick = () => esyaAl(e); yazi.appendChild(al);
    }
  }
  document.querySelectorAll("#dolap [data-esya]").forEach(b => b.onclick = () => {
    const e = ESYALAR.find(x => x.id === b.dataset.esya);
    Ses.pop();
    if (esyaVarMi(e)) { denenen = null; d.giyili[e.yer] = d.giyili[e.yer] === e.id ? null : e.id; kaydet(); kediSoyle(d.giyili[e.yer] ? "Yakıştı mı? 😸" : "Böyle de fena değilim 😼"); }
    else { denenen = denenen === e.id ? null : e.id; if (denenen) kediSoyle("Bir bakalım... 👀"); }
    kediCiz(); kediHareketSahne("dokun", 420);
    const ayni = document.querySelector(`#dolap [data-esya="${e.id}"]`); if (ayni) ayni.focus(); // liste yenilendi, odak kaybolmasın
  });
}
// Satın alma: bakiye ve sahiplik Ekonomi.satinAl içinde yeniden denetlenir; çift dokunuş çift ödeme yapmaz.
function esyaAl(e) {
  if (!esyaVarMi(e)) {
    if (Ekonomi.satinAl(d, "esyalar", e.id, e.fiyat) === "yetersiz") { Ses.yanlis(); return bildir("🪙 Altın yetmiyor"); }
    bildir(`✨ ${e.ad} alındı!`); Ses.altin();
  }
  denenen = null; d.giyili[e.yer] = e.id;
  kaydet(); rozetKontrol(); herSeyiCiz(); kediSoyle("Yakıştı mı? 😸"); kediHareketSahne("kutla", 1000);
}
function sahnelerCiz() {
  let s = "";
  for (const [k, t2] of Object.entries(TEMALAR)) {
    const var_ = d.temalar.includes(k), secili = d.tema === k;
    s += `<div class="kart urun"><div class="u-ikon" style="background:url(resim/bg_${k}.jpg) center 60% / cover"></div><div><b>${t2.ad}</b><small>Ana sayfa ve kedinin arka planı</small></div>
      <button class="al ${secili ? "secili" : ""}" data-sahne="${k}" ${!var_ && d.yildiz < t2.fiyat ? "disabled" : ""}>${secili ? "Seçili" : var_ ? "Kullan" : "🪙 " + t2.fiyat}</button></div>`;
  }
  document.getElementById("sahneler").innerHTML = s;
  document.querySelectorAll("#sahneler [data-sahne]").forEach(b => b.onclick = () => {
    const k = b.dataset.sahne;
    if (!d.temalar.includes(k)) {
      if (Ekonomi.satinAl(d, "temalar", k, TEMALAR[k].fiyat) === "yetersiz") { Ses.yanlis(); return bildir("🪙 Altın yetmiyor"); }
      bildir(TEMALAR[k].ikon + " Yeni arka plan açıldı!"); Ses.altin();
    }
    d.tema = k; kaydet(); herSeyiCiz();
  });
}

// ---------- Kedi panelleri (gardırop, renk, arka plan, durum): alttan açılır, geri tuşuyla kapanır (U13) ----------
// Panel açıkken alt menü, üst çubuk ve sahne düğmeleri tıklanmaz (inert); kapanınca odak açan düğmeye döner (js/cihaz.js).
const PANEL_ARKASI = "nav, #ekran-kedi > .ust, .sahne-dugmeler, #kilo-hap";
function kediPanelAc(id) {
  document.querySelectorAll(".kedi-panel.acik").forEach(p => altPanelKapat(p));
  document.getElementById("ekran-kedi").classList.add("panelli");
  if (id === "panel-renk") renkPanelHazirla();
  altPanelAc(id);
  document.querySelectorAll(PANEL_ARKASI).forEach(e => e.inert = true);
}
document.querySelectorAll(".kedi-panel").forEach(p => p._kapaninca = () => {
  if (p.id === "panel-renk") renkTaslak = null;     // kaydedilmeden kapanan renk geri alınır
  if (p.id === "panel-gardirop") denenen = null;    // denenen eşya üstünden çıkar
  if (!document.querySelector(".kedi-panel.acik")) {
    document.getElementById("ekran-kedi").classList.remove("panelli");
    document.querySelectorAll(PANEL_ARKASI).forEach(e => e.inert = false);
  }
  kediCiz();
});
document.querySelectorAll(".sahne-dugmeler [data-panel]").forEach(b => b.onclick = () => { Ses.pop(); kediPanelAc(b.dataset.panel); });
document.getElementById("kilo-hap").onclick = () => kediPanelAc("panel-durum");
document.querySelectorAll(".kedi-panel [data-panel-kapat]").forEach(b => b.onclick = () => altPanelKapat(b.closest(".alt-panel")));

// ---------- Renk paneli (U03): hazır renkler, ton/canlılık/açıklık, HEX, son kullanılanlar; Kaydet/İptal ----------
// Renk ücretsiz. Kaydet'e kadar yalnız sahnedeki kedi önizlenir; İptal, ✕ ve geri tuşu eski rengi bırakır.
const HAZIR_RENKLER = [["#FDBE86", "Turuncu"], ["#F1DDBF", "Krem"], ["#D9A066", "Bal"], ["#8B5E3C", "Kahve"], ["#5D4037", "Çikolata"], ["#A9AAB8", "Gri"],
  ["#6E7B8B", "Mavi gri"], ["#4A4458", "Gece"], ["#F7F7FA", "Beyaz"], ["#F4A7B9", "Pembe"], ["#B39DDB", "Lila"], ["#81C7D4", "Mavi"],
  ["#9CCC65", "Yeşil"], ["#FFD54F", "Sarı"], ["#E57373", "Kırmızı"], ["#2E2A3A", "Kömür"]];
const renkDugmesi = (hex, ad) => `<button class="renk-dugme" data-renk="${hex}" style="background:${hex}" aria-label="${ad || hex}" aria-pressed="false"></button>`;
let renkOnizlemeIstek = 0;
function renkPanelHazirla() {
  renkTaslak = d.kurkRenk;
  document.getElementById("renk-hazir").innerHTML = HAZIR_RENKLER.map(([h, ad]) => renkDugmesi(h, ad)).join("");
  document.getElementById("renk-son").innerHTML = (d.sonRenkler || []).map(h => renkDugmesi(h)).join("");
  document.getElementById("renk-son-kutu").hidden = !(d.sonRenkler || []).length;
  document.querySelectorAll("#panel-renk [data-renk]").forEach(b => b.onclick = () => { Ses.pop(); renkSec(b.dataset.renk); });
  renkSec(renkTaslak);
}
// kaynak: değişikliği yapan girdi; kendi değerini yeniden yazmasın (yazarken imleç zıplamasın)
function renkSec(hex, kaynak) {
  if (!hexGecerli(hex)) return;
  renkTaslak = hex.toUpperCase();
  const [h, s, l] = rgbHsl(...hexRgb(renkTaslak));
  if (kaynak !== "kaydir") {
    document.getElementById("renk-ton").value = Math.round(h);
    document.getElementById("renk-doy").value = Math.round(s * 100);
    document.getElementById("renk-acik").value = Math.round(l * 100);
  }
  if (kaynak !== "hex") document.getElementById("renk-hex").value = renkTaslak;
  document.getElementById("renk-hex").classList.remove("hatali");
  document.getElementById("renk-ornek").style.background = renkTaslak;
  document.querySelectorAll("#panel-renk [data-renk]").forEach(b => b.setAttribute("aria-pressed", b.dataset.renk.toUpperCase() === renkTaslak));
  // Canlı önizleme: kaydırırken her olayda değil, ekran karesi başına bir kez boyanır.
  const istek = ++renkOnizlemeIstek;
  requestAnimationFrame(() => { if (istek === renkOnizlemeIstek && renkTaslak) kediGuncelle(document.getElementById("kedi-kutu"), sahneGorunumu()); });
}
function kaydiriciRenk() {
  const deger = id => +document.getElementById(id).value;
  renkSec(rgbHex(...hslRgb(deger("renk-ton"), deger("renk-doy") / 100, deger("renk-acik") / 100)), "kaydir");
}
["renk-ton", "renk-doy", "renk-acik"].forEach(id => document.getElementById(id).oninput = kaydiriciRenk);
document.getElementById("renk-hex").oninput = e => {
  let v = e.target.value.trim(); if (v && v[0] !== "#") v = "#" + v;
  if (hexGecerli(v)) renkSec(v, "hex"); else e.target.classList.add("hatali");
};
document.getElementById("renk-varsayilan").onclick = () => renkSec(KURK_VARSAYILAN);
document.getElementById("renk-iptal").onclick = () => altPanelKapat(document.getElementById("panel-renk"));
document.getElementById("renk-kaydet").onclick = () => {
  const yeni = renkTaslak;
  if (hexGecerli(yeni)) {
    d.kurkRenk = yeni;
    d.sonRenkler = [yeni, ...(d.sonRenkler || []).filter(x => x !== yeni)].slice(0, 8);
    if (kaydet()) { Ses.altin(); bildir("🎨 Kürk rengi kaydedildi"); }
  }
  renkTaslak = null;
  altPanelKapat(document.getElementById("panel-renk"));
  kediHareketSahne("kutla", 1000);
};

function kediSoyle(m) { const b = document.getElementById("kedi-balon"); b.textContent = m; b.animate([{ transform: "scale(.8)" }, { transform: "none" }], { duration: 250, easing: "cubic-bezier(.3,1.6,.5,1)" }); }
function kediLafi() {
  const calisilan = KELIMELER.filter(k => d.kartlar[k[0]]);
  const secenek = [`Miyav! Bugün ${d.bugun.sayi} kart çalıştın 💪`];
  if (calisilan.length) { const k = calisilan[Math.floor(Math.random() * calisilan.length)]; secenek.push(`"${k[0]}" = ${k[1]} ${k[2]} Unutma!`, `${k[2]} ${k[0]}... ${k[0]}... aklımda kalsın diye tekrar ediyorum`); }
  if (!avOynandiMi()) secenek.push("Kovada balık var... günün avına çıkalım mı? 🎣");
  secenek.push(kiloDurumu().lafi);
  if (d.yildiz === 0) secenek.push("Kumbaramız bomboş 🥺 Biraz kelime çalışalım mı?");
  secenek.push("Her gün biraz, kedi adımlarıyla 🐾", "Yanlış yapmak da öğrenmenin parçası, miyav!", "Bugün bir kelime daha öğrenirsek mama bonusu? 🍣", "Patilerim hazır, sen de hazır mısın? ✨");
  const zor = zorlandiklar();
  if (zor.length) secenek.push(`"${zor[0][0]}" biraz inatçı çıktı 😼 Zorlandıkların'a bakalım mı?`);
  return secenek[Math.floor(Math.random() * secenek.length)];
}
document.querySelectorAll("#dolap-sekme button").forEach(b => b.onclick = () => { dolapYer = b.dataset.yer; dolapCiz(); });
document.getElementById("sev-dugme").onclick = () => {
  kediHareketSahne("sev", 900);
  kediSoyle("Mırrr... 💜");
  kalpUcur(["💕", "💗", "💞"]);
};
// Kalpler başın üstünden yavaşça süzülür
function kalpUcur(kalpler) {
  const k = document.getElementById("kedi-kutu"), sahne = document.getElementById("kedi-sahne"), kr = k.getBoundingClientRect(), sr = sahne.getBoundingClientRect();
  kalpler.forEach((kalp, i) => setTimeout(() => {
    const el = document.createElement("span"); el.className = "kalp"; el.textContent = kalp;
    el.style.left = (kr.left - sr.left + kr.width * (0.45 + i * 0.12)) + "px"; el.style.top = (kr.top - sr.top - 30) + "px"; // şapkanın üstünden başlasın
    el.style.setProperty("--x", ((i - 1) * 18) + "px");
    sahne.appendChild(el); setTimeout(() => el.remove(), 1900);
  }, i * 220));
}
// Kediye dokununca: küçük zıplama, mutlu yüz, bir kalp, miyav ve bir laf (eşyalar sadece görünüş)
function kediyeDokun() { kediHareketSahne("dokun", 420); kalpUcur(["💗"]); Ses.miyav(); kediSoyle(kediLafi()); }
document.getElementById("kedi-kutu").onclick = kediyeDokun;
document.getElementById("kedi-kutu").onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); kediyeDokun(); } };
document.getElementById("ana-kedi").onclick = () => { Ses.pop(); sekme("kedi"); };
document.getElementById("kedi-ad").onclick = () => {
  const ad = prompt("Kedinin adı ne olsun?", d.kediAd);
  if (ad && ad.trim()) { d.kediAd = temizAd(ad); kaydet(); kediCiz(); }
};
document.getElementById("av-kart").onclick = () => { altPanelKapat(document.getElementById("panel-durum")); avAc(); };

// ================= KİLO VE SPOR SALONU =================
// Arkadaşın uygulamasındaki gibi: Fit 3,5 · Tombiş 6 · Mega Chonk 8,5 kg. Kilo 3–9,5 arasında kalır.
function kiloDurumu() {
  const k = d.kilo;
  return k < 4.5 ? { ad: "Fit 💪", lafi: "Bugün çok çevikim, balığa koşmaya hazırım!" }
    : k < 6 ? { ad: "Pofuduk 🐾", lafi: "Ne fit ne tombiş, tam kıvamındayım 😸" }
    : k < 7.5 ? { ad: "Tombiş 🍙", lafi: "Biraz tombişledim galiba... spor salonuna mı gitsek?" }
    : { ad: "Mega Chonk 🙀", lafi: "Kalkamıyorum! Eski kelimelerle biraz spor lazım." };
}
function kiloDegis(fark) {
  if (!fark) return;
  d.kilo = Math.round(Math.min(9.5, Math.max(3, d.kilo + fark)) * 100) / 100;
  kaydet();
}
function sporAc() {
  // Spor = öğrenilmiş kelimelerden 10 soru; her doğru cevap 0,15 kg verdirir
  const calisilan = KELIMELER.filter(k => d.kartlar[k[0]]);
  if (calisilan.length < 3) { pencere("🏋️", "Önce birkaç kelime öğren", "Spor salonunda eski kelimeler tekrar edilir. En az 3 kelimeyle tanışınca gel!", "Tamam"); return; }
  kO = { sira: karistir(calisilan).slice(0, 10).map(k => ({ tip: "soru", k })), i: 0, dogru: 0, yanlis: 0, kilit: false, kiloBas: d.kilo, spor: true };
  tamAc("kartlar"); adimGoster();
}
// Antrenman sahnesi: spor turunda kartların üstünde kedi bantta çalışır; her doğru cevapta sevinip devam eder.
// (Ayrıntılı ilerleme ve sonuç ekranı 4. aşamada, U18.)
function antrenmanCiz() {
  const alan = document.getElementById("antrenman");
  alan.hidden = !(kO && kO.spor);
  if (alan.hidden) return;
  const govde = kediGuncelle(document.getElementById("antrenman-kedi"));
  if (govde && govde.dataset.hareket === "bekle") govde.dataset.hareket = "antrenman";
  const fark = d.kilo - kO.kiloBas;
  document.getElementById("antrenman-yazi").textContent = `🏋️ ${kO.dogru} tekrar · ${fark <= 0 ? "−" : "+"}${Math.abs(fark).toFixed(2).replace(".", ",")} kg`;
}
function antrenmanSevin() {
  const govde = document.querySelector("#antrenman-kedi .kedi-govde");
  kediHareket(govde, "kutla", 700, "antrenman");
  antrenmanCiz();
}
document.getElementById("spor-kart").onclick = () => { altPanelKapat(document.getElementById("panel-durum")); sporAc(); };
