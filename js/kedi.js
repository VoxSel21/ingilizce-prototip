// ================= KEDİ =================
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
const SILME_VAR = ["kasket", "hasir", "silindir"];
// Kürk rengi tek çizimden renk süzgeciyle üretilir (prototip için; gerçek uygulamada ayrı çizim olabilir)
const KURK_SUZGEC = { turuncu: "none", krem: "sepia(.35) saturate(.55) brightness(1.12)", gri: "grayscale(1) brightness(1.08)", siyah: "grayscale(1) brightness(.55) contrast(1.25)", beyaz: "grayscale(1) brightness(1.4) contrast(1.1)" };
function kediHali() { return d.kilo < 4.5 ? "fit" : d.kilo < 6 ? "pofuduk" : d.kilo < 7.5 ? "tombis" : "mega"; }
function kediHTML() {
  let h = `<div class="kedi-govde"><canvas class="kedi-resim" id="kedi-tuval" width="400" height="400" aria-label="${d.kediAd}" style="filter:${KURK_SUZGEC[d.kurk] || "none"}"></canvas>`;
  for (const yer of ["boyun", "goz", "sapka"]) {
    const e = ESYALAR.find(x => x.id === d.giyili[yer]); if (!e) continue;
    h += `<img class="giy" src="resim/giy_${e.id}.png" alt="${e.ad}">`;
  }
  return h + "</div>";
}
const resimOnbellek = {};
function resimYukle(src) {
  // Yüklenemeyen resim önbellekte "başarısız" olarak takılı kalmasın; bağlantı gelince yeniden denensin.
  return resimOnbellek[src] ||= new Promise((ok, hata) => { const r = new Image(); r.onload = () => ok(r); r.onerror = e => { delete resimOnbellek[src]; hata(e); }; r.src = src; });
}
async function kediTuvaleCiz() {
  const tuval = document.getElementById("kedi-tuval"); if (!tuval) return;
  const silinecek = Object.values(d.giyili).filter(id => SILME_VAR.includes(id));
  const [kedi, ...maskeler] = await Promise.all([`resim/kedi_${kediHali()}.png`, ...silinecek.map(id => `resim/sil_${id}.png`)].map(resimYukle));
  const c = tuval.getContext("2d");
  c.clearRect(0, 0, 400, 400); c.drawImage(kedi, 0, 0, 400, 400);
  c.globalCompositeOperation = "destination-out";
  for (const m of maskeler) c.drawImage(m, 0, 0, 400, 400);
  c.globalCompositeOperation = "source-over";
}
let dolapYer = "sapka";
function kediCiz() {
  document.getElementById("kedi-ad").textContent = `🐱 ${d.kediAd} ✏️`;
  const t = TEMALAR[d.tema];
  document.getElementById("kedi-sahne").style.background = `url(resim/bg_${d.tema}.jpg) center 62% / cover`;
  document.getElementById("kedi-kutu").innerHTML = kediHTML(); kediTuvaleCiz();
  const kd = kiloDurumu();
  document.getElementById("kilo-durum").textContent = kd.ad;
  document.getElementById("kilo-kg").textContent = d.kilo.toFixed(1) + " kg";
  document.getElementById("kilo-isaret").style.left = ((d.kilo - 3) / 6.5 * 100) + "%";
  // Günün avı kartı
  const oynandi = avOynandiMi();
  document.getElementById("av-kart").classList.toggle("oynandi", oynandi);
  document.getElementById("av-kart-yazi").textContent = oynandi ? "Bugünkü avını yaptın. Yarın yeni balık!" : "30 saniye, 10 kelime. Balığa ulaşırsan 1 🪙";
  // Gardırop
  document.querySelectorAll("#dolap-sekme button").forEach(b => b.classList.toggle("aktif", b.dataset.yer === dolapYer));
  let h = "";
  if (dolapYer === "kurk") {
    for (const [id, k] of Object.entries(KURKLER)) {
      const var_ = d.kurklar.includes(id), secili = d.kurk === id;
      h += `<div class="esya-kart ${secili ? "giyili" : ""}"><div class="e-ikon"><img src="resim/kedi_pofuduk.png" alt="" style="filter:${KURK_SUZGEC[id]}"></div><b>${k.ad}</b>
        <button class="al ${secili ? "secili" : ""}" data-kurk="${id}" ${!var_ && d.yildiz < k.fiyat ? "disabled" : ""}>${secili ? "Seçili" : var_ ? "Seç" : "🪙 " + k.fiyat}</button></div>`;
    }
  } else {
    for (const e of ESYALAR.filter(x => x.yer === dolapYer)) {
      const var_ = d.esyalar.includes(e.id) || (e.rozet && d.rozet[e.rozet]), giyili = d.giyili[e.yer] === e.id;
      const kilit = e.rozet && !d.rozet[e.rozet];
      const etiket = giyili ? "Çıkar" : var_ ? "Giy" : kilit ? "🔒 Başarım" : "🪙 " + e.fiyat;
      h += `<div class="esya-kart ${giyili ? "giyili" : ""}"><div class="e-ikon"><img src="resim/esya_${e.id}.png" alt=""></div><b>${e.ad}</b>
        <button class="al ${giyili ? "secili" : ""}" data-esya="${e.id}" ${kilit || (!var_ && d.yildiz < e.fiyat) ? "disabled" : ""}>${etiket}</button></div>`;
    }
  }
  document.getElementById("dolap").innerHTML = h;
  document.querySelectorAll("[data-esya]").forEach(b => b.onclick = () => {
    const e = ESYALAR.find(x => x.id === b.dataset.esya);
    if (!d.esyalar.includes(e.id) && !(e.rozet && d.rozet[e.rozet])) { d.yildiz -= e.fiyat; d.esyalar.push(e.id); bildir(`✨ ${e.ad} alındı!`); Ses.altin(); }
    d.giyili[e.yer] = d.giyili[e.yer] === e.id ? null : e.id;
    kaydet(); rozetKontrol(); herSeyiCiz(); kediSoyle(d.giyili[e.yer] ? "Yakıştı mı? 😸" : "Böyle de fena değilim 😼");
  });
  document.querySelectorAll("[data-kurk]").forEach(b => b.onclick = () => {
    const id = b.dataset.kurk;
    if (!d.kurklar.includes(id)) { d.yildiz -= KURKLER[id].fiyat; d.kurklar.push(id); bildir("🎨 Yeni kürk rengi!"); Ses.altin(); }
    d.kurk = id; kaydet(); herSeyiCiz();
  });
  // Arka planlar (eskiden yıldız dükkânındaydı)
  let s = "";
  for (const [k, t2] of Object.entries(TEMALAR)) {
    const var_ = d.temalar.includes(k), secili = d.tema === k;
    s += `<div class="kart urun"><div class="u-ikon" style="background:url(resim/bg_${k}.jpg) center 60% / cover"></div><div><b>${t2.ad}</b><small>Ana sayfa ve kedinin arka planı</small></div>
      <button class="al ${secili ? "secili" : ""}" data-tema="${k}" ${!var_ && d.yildiz < t2.fiyat ? "disabled" : ""}>${secili ? "Seçili" : var_ ? "Kullan" : "🪙 " + t2.fiyat}</button></div>`;
  }
  document.getElementById("sahneler").innerHTML = s;
  document.querySelectorAll("[data-tema]").forEach(b => b.onclick = () => {
    const k = b.dataset.tema;
    if (!d.temalar.includes(k)) { d.yildiz -= TEMALAR[k].fiyat; d.temalar.push(k); bildir(TEMALAR[k].ikon + " Yeni arka plan açıldı!"); Ses.altin(); }
    d.tema = k; kaydet(); herSeyiCiz();
  });
}
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
document.querySelectorAll("#dolap-sekme button").forEach(b => b.onclick = () => { dolapYer = b.dataset.yer; kediCiz(); });
document.getElementById("sev-dugme").onclick = e => {
  const k = document.getElementById("kedi-kutu"); k.classList.remove("mirr"); void k.offsetWidth; k.classList.add("mirr");
  kediSoyle("Mırrr... 💜");
  kalpUcur(["💕", "💗", "💞"]);
};
// Kalpler başın üstünden yavaşça süzülür
function kalpUcur(kalpler) {
  const k = document.getElementById("kedi-kutu"), sahne = document.getElementById("kedi-sahne"), kr = k.getBoundingClientRect(), sr = sahne.getBoundingClientRect();
  kalpler.forEach((kalp, i) => setTimeout(() => {
    const el = document.createElement("span"); el.className = "kalp"; el.textContent = kalp;
    el.style.left = (kr.left - sr.left + kr.width * (0.45 + i * 0.12)) + "px"; el.style.top = (kr.top - sr.top - 64) + "px"; // şapkanın üstünden başlasın
    el.style.setProperty("--x", ((i - 1) * 18) + "px");
    sahne.appendChild(el); setTimeout(() => el.remove(), 1900);
  }, i * 220));
}
// Kediye dokununca: küçük zıplama, bir kalp, miyav ve bir laf (eşyalar sadece görünüş)
document.getElementById("kedi-kutu").onclick = () => {
  const g = document.querySelector("#kedi-kutu .kedi-govde");
  if (g) g.animate([{ transform: "none" }, { transform: "translateY(-14px) scale(1.02, .98)" }, { transform: "none" }], { duration: 380, easing: "cubic-bezier(.3,1.4,.5,1)" });
  kalpUcur(["💗"]); Ses.miyav(); kediSoyle(kediLafi());
};
document.getElementById("kedi-ad").onclick = () => {
  const ad = prompt("Kedinin adı ne olsun?", d.kediAd);
  if (ad && ad.trim()) { d.kediAd = temizAd(ad); kaydet(); kediCiz(); }
};
document.getElementById("av-kart").onclick = () => avAc();

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
document.getElementById("spor-kart").onclick = () => sporAc();

