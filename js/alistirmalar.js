// ================= KUTU İÇERİĞİ ve ZORLANDIKLARIN =================
// Kutuya dokununca içindeki kelimeler dönen kartlarla listelenir (sınav yok, göz gezdirme).
// 1. kutu ekranda "1. kutu", yanlış bilinip başa dönenler de burada (kutu 0 ve 1 birlikte).
const kutudaMi = (c, i) => i === 1 ? c.kutu <= 1 : i === 4 ? c.kutu >= 4 : c.kutu === i;
function kutuAc(i) {
  const liste = KELIMELER.filter(k => d.kartlar[k[0]] && kutudaMi(d.kartlar[k[0]], i));
  document.getElementById("kutu-baslik").textContent = i === 4 ? "⭐ Öğrenildi" : `${i}. kutu`;
  document.getElementById("kutu-ozet").textContent = `${liste.length} kelime · karta dokun, arkasını gör · 🔊 ile dinle`;
  kartlariListele(liste);
  tamAc("kutu"); document.getElementById("tam-kutu").scrollTop = 0;
}
function kartlariListele(liste) {
  const el = document.getElementById("kutu-liste");
  el.innerHTML = liste.map((k, n) => `<div class="cevir" data-n="${n}"><div class="cevir-ic">
    <div class="on"><button class="kucuk-ses" data-oku="${k[0]}">🔊</button><span>${k[2]}</span><b>${k[0]}</b></div>
    <div class="arka"><b>${k[1]}</b><small>${k[3]}</small></div></div></div>`).join("");
  el.querySelectorAll(".cevir").forEach(c => c.onclick = () => { c.classList.toggle("dondu"); Ses.pop(); });
  el.querySelectorAll("[data-oku]").forEach(b => b.onclick = e => { e.stopPropagation(); seslendir(b.dataset.oku); });
}
// En çok yanlış yapılanlar: hata sayısı 2 ve üstü (doğru bildikçe azalır)
function zorlandiklar() {
  return KELIMELER.concat(PHRASAL).filter(k => d.kartlar[k[0]] && (d.kartlar[k[0]].hata || 0) >= 2)
    .sort((a, b) => d.kartlar[b[0]].hata - d.kartlar[a[0]].hata);
}
document.getElementById("zor-dugme").onclick = () => {
  const zor = zorlandiklar().slice(0, 8);
  if (!zor.length) return;
  kO = { sira: karistir(zor).map(k => ({ tip: "soru", k })), i: 0, dogru: 0, yanlis: 0, kilit: false, kiloBas: d.kilo, zor: true };
  tamAc("kartlar"); adimGoster();
};

// ================= PATİ ÇABUKLUĞU =================
// 3 tur x 4 çift. Süre ileri sayar, yanlış eşleştirme +2 sn. Rekor saklanır;
// günde bir kez 45 saniyenin altında bitirene 1 🪙.
let es = null;
function eslesKelimeleri() {
  const tanis = karistir(KELIMELER.filter(k => d.kartlar[k[0]]));
  const yeni = karistir(KELIMELER.filter(k => !d.kartlar[k[0]] && k[5] === d.seviye));
  const secilen = [], anlamlar = new Set();
  for (const k of tanis.concat(yeni)) { if (secilen.length >= 12) break; if (!anlamlar.has(k[1])) { secilen.push(k); anlamlar.add(k[1]); } }
  return secilen;
}
function eslesAc(savas = false) {
  es = { kelimeler: eslesKelimeleri(), tur: 0, bulunan: 0, ceza: 0, bas: performance.now(), secili: null, bitti: false, savas };
  tamAc("esles"); eslesTurCiz();
  const oyun = es;
  const t = setInterval(() => { if (es !== oyun || es.bitti) return clearInterval(t); eslesSureCiz(); }, 100);
}
const eslesSure = () => (performance.now() - es.bas) / 1000 + es.ceza;
function eslesSureCiz() { document.getElementById("e-sure").textContent = eslesSure().toFixed(1); }
function eslesTurCiz() {
  const grup = es.kelimeler.slice(es.tur * 4, es.tur * 4 + 4);
  const sol = karistir(grup).map(k => `<button class="en" data-k="${k[0]}">${k[0]}</button>`);
  const sag = karistir(grup).map(k => `<button data-k="${k[0]}">${k[1]}</button>`);
  document.getElementById("esles").innerHTML = sol.map((b, i) => b + sag[i]).join("");
  document.getElementById("e-cubuk").style.width = (es.bulunan / es.kelimeler.length * 100) + "%";
  document.querySelectorAll("#esles button").forEach(b => b.onclick = () => eslesSec(b));
}
function eslesSec(b) {
  if (es.bitti || b.classList.contains("bitti")) return;
  const s = es.secili;
  if (!s || s.classList.contains("en") === b.classList.contains("en")) { // ilk seçim ya da aynı sütundan başka kart
    if (s) s.classList.remove("secili");
    es.secili = b; b.classList.add("secili"); Ses.pop();
    if (b.classList.contains("en")) seslendir(b.dataset.k, true);
    return;
  }
  es.secili = null; s.classList.remove("secili");
  if (s.dataset.k === b.dataset.k) {
    s.classList.add("bitti"); b.classList.add("bitti"); es.bulunan++; Ses.dogru();
    document.getElementById("e-cubuk").style.width = (es.bulunan / es.kelimeler.length * 100) + "%";
    if (es.bulunan % 4 === 0 || es.bulunan === es.kelimeler.length) {
      if (es.bulunan >= es.kelimeler.length) return eslesBitir();
      es.tur++; const oyun = es; setTimeout(() => { if (es === oyun && !oyun.bitti) eslesTurCiz(); }, 350); // kapatıldıysa çizme
    }
  } else {
    es.ceza += 2; Ses.yanlis();
    [s, b].forEach(x => { x.classList.add("hata"); setTimeout(() => x.classList.remove("hata"), 400); });
  }
}
function eslesBitir() {
  es.bitti = true; const sure = eslesSure();
  const oyun = es; // sonuç penceresi yalnız bu oyun hâlâ açıksa (kapatıldıysa yeni bir oyunu kapatmasın)
  if (es.savas) { const puan = Math.max(20, Math.round(240 - sure * 4)); Ses.dogru(); setTimeout(() => { if (es === oyun) savasSonuc("esles", puan); }, 500); return; }
  const rekor = !d.eslesRekor || sure < d.eslesRekor;
  if (rekor) d.eslesRekor = Math.round(sure * 10) / 10;
  const odul = sure < EKONOMI.odul.eslesme.sureSiniri ? Ekonomi.kazan(d, "esles:" + bugunNo(), EKONOMI.odul.eslesme.miktar, bugunNo()) : 0;
  if (odul) d.eslesGunu = bugunNo();
  gunIsaretle(); kaydet(); rozetKontrol();
  rekor || odul ? Ses.zafer() : Ses.dogru();
  const cift = es.kelimeler.length, ceza = es.ceza;
  setTimeout(() => {
    if (es !== oyun) return;
    tamKapat();
    pencere("🐾", rekor ? "Yeni rekor!" : "Hepsini eşleştirdin!", `${cift} çift, ${sure.toFixed(1)} saniye${ceza ? ` (${ceza} sn ceza dahil)` : ""}. Rekorun: ${d.eslesRekor} sn.${odul ? " +1 🪙" : d.eslesGunu === bugunNo() ? "" : " 45 saniyenin altında bitirirsen 1 🪙."}`, "Tamam");
  }, 500);
}

// ================= KELİME KUR =================
// Öğrendiğin kelimeler öğrenme sırasıyla gelir (kaldığın yerden devam). Kutuyu değiştirmez;
// yanlışlar "Zorlandıkların"a sayılır, doğrular günlük hedefe.
let kur = null;
function kurKelimeleri() {
  const sirali = Object.keys(d.kartlar).map(w => KELIMELER.find(k => k[0] === w)).filter(k => k && k[0].length >= 3 && k[0].length <= 10 && /^[a-z]+$/.test(k[0]));
  if (!sirali.length) return [];
  const bas = (d.kurSira || 0) % sirali.length;
  return sirali.slice(bas).concat(sirali.slice(0, bas)).slice(0, 8);
}
function kurAc() {
  const liste = kurKelimeleri();
  if (liste.length < 3) { pencere("🔤", "Önce birkaç kelime öğren", "Kelime Kur, tanıştığın kelimelerle çalışır. Kartlarda en az 3 kelimeyle tanış, sonra gel!", "Tamam"); return; }
  kur = { liste, i: 0, dogru: 0 };
  tamAc("kur"); kurAdim();
}
function kurAdim() {
  const k = kur.liste[kur.i];
  document.getElementById("kur-sayac").textContent = `${kur.i}/${kur.liste.length}`;
  document.getElementById("kur-cubuk").style.width = (kur.i / kur.liste.length * 100) + "%";
  const alan = document.getElementById("kur-alan");
  alan.innerHTML = `<div class="soru-kart"><div class="s-yon">Harfleri sırayla dizip kelimeyi kur</div><div class="s-resim" style="font-size:56px">${k[2]}</div><div class="soluk" style="font-size:14px;font-weight:800;">${k[0].length} harf · ${k[7]}</div></div>`;
  harfDizme(alan, k[0], (dogru, yuva) => {
    const c = d.kartlar[k[0]] || { kutu: 1, sira: bugunNo() };
    c.hata = Math.max(0, (c.hata || 0) + (dogru ? -1 : 1)); d.kartlar[k[0]] = c;
    if (dogru) { kur.dogru++; konfeti(yuva, 6); }
    soruCevaplandi(dogru); d.kurSira = (d.kurSira || 0) + 1; kaydet(); rozetKontrol();
    sonucSesi(dogru); setTimeout(() => seslendir(k[0], true), 450);
    const gb = document.getElementById("kur-gb");
    gb.className = "geri-bildirim acik " + (dogru ? "dogru" : "yanlis"); devamaOdak("kur-gb-devam");
    document.getElementById("kur-gb-baslik").textContent = dogru ? ["Harika! 🎉", "Aynen öyle! 😸", "Süpersin! ✨"][Math.floor(Math.random() * 3)] : "Neredeyse! 💪";
    document.getElementById("kur-gb-yazi").textContent = `${k[2]} ${k[0]} = ${k[1]}${dogru ? "" : " · Doğrusu: " + k[0]}`;
  });
}
document.getElementById("kur-gb-devam").onclick = () => {
  if (!panelAcik("kur-gb")) return;
  document.getElementById("kur-gb").className = "geri-bildirim";
  kur.i++;
  if (kur.i < kur.liste.length) { kurAdim(); return alistirmaOdak(); }
  const sonuc = kur; kur = null; tamKapat();
  if (d.bugun.sayi >= gunlukHedef() && !d.bugun.hediye) return hediyePenceresi();
  pencere("🔤", "Kelime Kur bitti!", `${sonuc.dogru}/${sonuc.liste.length} kelimeyi doğru kurdun. Bir sonraki turda kaldığın yerden devam edersin.`, "Tamam");
};

// Yedek alma ve yükleme Ayarlar ekranına taşındı: js/ayarlar.js.

// ================= CÜMLE =================
let cDeste = [], cIndex = 0, dizilen = [], cTurDogru = 0, cSavas = false;
function cumleAc() {
  // Önce tanıştığın kelime ve phrasal verb'lerin cümleleri (kutusu düşük olan öne: tekrar gibi çalışır),
  // yetmezse seçili seviyenin genel cümleleri.
  const bagli = karistir(CUMLELER.filter(c => c[4] && d.kartlar[c[4]])).sort((a, b) => d.kartlar[a[4]].kutu - d.kartlar[b[4]].kutu);
  const secilen = [];
  for (const c of bagli) { if (secilen.length >= 5) break; if (!secilen.some(x => x[4] === c[4])) secilen.push(c); }
  const genel = karistir(CUMLELER.filter(c => !c[4] && c[3] === d.seviye));
  while (secilen.length < 5 && genel.length) secilen.push(genel.pop());
  cDeste = karistir(secilen);
  cIndex = 0; cTurDogru = 0; tamAc("cumle"); cumleGoster();
}
function cumleGoster() {
  const c = cDeste[cIndex];
  document.getElementById("c-tr").textContent = c[0];
  const ipucu = document.getElementById("c-ipucu");
  const kaynak = c[4] && (KELIMELER.find(k => k[0] === c[4]) || PHRASAL.find(k => k[0] === c[4]));
  ipucu.innerHTML = kaynak ? `🔑 Öğrendiğin: <b>${kaynak[0]}</b> = ${kaynak[1]}` : "";
  ipucu.style.display = kaynak ? "" : "none";
  document.getElementById("c-sayac").textContent = `${cIndex}/${cDeste.length}`;
  document.getElementById("c-cubuk").style.width = (cIndex / cDeste.length * 100) + "%";
  const cumleKel = c[1].toLowerCase().split(" ");
  const celdirici = c[2].length ? c[2] : karistir(KELIMELER.filter(k => k[5] === c[3] && !cumleKel.includes(k[0]))).slice(0, 2).map(k => k[0]);
  const bloklar = karistir(c[1].split(" ").concat(celdirici));
  dizilen = []; cDegerlendi = false;
  document.getElementById("havuz").innerHTML = bloklar.map((b, i) => `<button class="blok" data-i="${i}">${b}</button>`).join("");
  document.getElementById("dizi").innerHTML = "";
  document.getElementById("kontrol").disabled = true;
  document.querySelectorAll("#havuz .blok").forEach(b => b.onclick = () => {
    if (b.classList.contains("bos")) return;
    b.classList.add("bos");
    const yeni = document.createElement("button");
    yeni.className = "blok"; yeni.textContent = b.textContent;
    yeni.onclick = () => { yeni.remove(); b.classList.remove("bos"); dizilen = dizilen.filter(x => x !== yeni); kontrolDurum(); };
    document.getElementById("dizi").appendChild(yeni); dizilen.push(yeni); kontrolDurum();
  });
}
// Her cümle sorusu bir kez değerlendirilir; ikinci "Kontrol et" (çift dokunuş, Enter) yok sayılır.
let cDegerlendi = false;
const kontrolDurum = () => document.getElementById("kontrol").disabled = cDegerlendi || !dizilen.length;
document.getElementById("kontrol").onclick = () => {
  if (cDegerlendi) return;
  cDegerlendi = true; document.getElementById("kontrol").disabled = true;
  const c = cDeste[cIndex];
  const cevap = [...document.querySelectorAll("#dizi .blok")].map(b => b.textContent).join(" ");
  const dogru = cevap.toLowerCase() === c[1].toLowerCase();
  const gb = document.getElementById("geri-bildirim");
  gb.className = "geri-bildirim acik " + (dogru ? "dogru" : "yanlis"); devamaOdak("gb-devam");
  document.getElementById("gb-baslik").textContent = dogru ? "Harika! 🎉" : "Neredeyse! 💪";
  document.getElementById("gb-yazi").textContent = dogru ? c[1] : "Doğrusu: " + c[1];
  if (dogru) { d.cumleDogru++; cTurDogru++; konfeti(document.getElementById("kontrol"), 10); }
  soruCevaplandi(dogru); // cümle sorusu da günlük hedefe sayılır (Serhat kararı, 2026-10-22)
  sonucSesi(dogru); setTimeout(() => seslendir(c[1], true), 450);
  kaydet(); rozetKontrol();
};
document.getElementById("gb-devam").onclick = () => {
  if (!panelAcik("geri-bildirim") || !cDegerlendi) return; // cevaplanmamış soru Devam'la atlanamaz
  document.getElementById("geri-bildirim").className = "geri-bildirim";
  cIndex++;
  if (cIndex >= cDeste.length && cSavas) { cSavas = false; savasSonuc("cumle", cTurDogru * 30); return; }
  if (cIndex >= cDeste.length) { const c3 = EKONOMI.odul.cumleTuru, o = cTurDogru >= c3.enAzDogru ? Ekonomi.kazanSinirli(d, "cumle", bugunNo(), c3.gunlukSinir, c3.miktar) : 0; kaydet(); if (o) Ses.altin(); tamKapat(); if (d.bugun.sayi >= gunlukHedef() && !d.bugun.hediye) return hediyePenceresi(); pencere("🧩", "Cümleler bitti!", `${cTurDogru}/${cDeste.length} doğru. ${o ? `+${o} 🪙 kazandın!` : cTurDogru >= c3.enAzDogru ? "Bugünkü cümle altınları tamam, pratik devam! 💪" : `${c3.enAzDogru} doğru yaparsan ${c3.miktar} 🪙 kazanırsın.`}`, "Tamam"); } else { cumleGoster(); alistirmaOdak(); }
};

