// ================= HARF DİZME (Kelime Kur ve kartlardaki harf sorusu ortak) =================
// Harflere sırayla dokun, boşluklara dolar. Dolu boşluğa dokununca o harf geri döner. Bitince "Onayla".
function harfDizme(kok, kelime, bitti) {
  const harfler = karistir([...kelime]);
  kok.insertAdjacentHTML("beforeend", `<div class="harf-yuva">${[...kelime].map(() => "<span></span>").join("")}</div>
    <div class="harf-havuz">${harfler.map((c, i) => `<button class="blok" data-hi="${i}">${c}</button>`).join("")}</div>
    <div class="harf-eylem"><button class="temizle">↺ Temizle</button><button class="onayla" disabled>Onayla ✓</button></div>`);
  const yuva = kok.querySelector(".harf-yuva"), bloklar = [...kok.querySelectorAll(".harf-havuz .blok")];
  const onayla = kok.querySelector(".onayla"); let secilen = [], kilit = false;
  const ciz = () => {
    [...yuva.children].forEach((sp, i) => { sp.textContent = secilen[i] !== undefined ? harfler[secilen[i]] : ""; sp.classList.toggle("dolu", secilen[i] !== undefined); });
    bloklar.forEach((b, i) => b.classList.toggle("bos", secilen.includes(i)));
    onayla.disabled = secilen.length !== kelime.length;
  };
  bloklar.forEach((b, i) => b.onclick = () => { if (kilit || secilen.includes(i) || secilen.length >= kelime.length) return; secilen.push(i); Ses.pop(); ciz(); });
  [...yuva.children].forEach((sp, i) => sp.onclick = () => { if (kilit || secilen[i] === undefined) return; secilen.splice(i, 1); ciz(); });
  kok.querySelector(".temizle").onclick = () => { if (kilit) return; secilen = []; ciz(); };
  onayla.onclick = () => {
    if (kilit) return; kilit = true;
    const yazilan = secilen.map(i => harfler[i]).join(""), dogru = yazilan === kelime;
    yuva.classList.add(dogru ? "dogru" : "yanlis");
    kok.querySelector(".harf-eylem").style.visibility = "hidden";
    bitti(dogru, yuva);
  };
}

// ================= MİKROFONLA SÖYLEME =================
// Tarayıcının konuşma tanıması: telaffuzu puanlamaz, "söylediğin kelime anlaşıldı mı" diye bakar.
// Chrome/Android ve Safari'de çalışır; ses tanıma için Google/Apple sunucusuna gider (README).
const KonusmaTanima = window.SpeechRecognition || window.webkitSpeechRecognition;
let konusmaAktif = null;
const konusmaHataYazi = h => h === "not-allowed" || h === "service-not-allowed" ? "Mikrofon izni verilmedi." : h === "no-speech" || h === "bos" ? "Ses duyamadım, bir daha dene." : h === "network" ? "İnternet gerekli." : "Olmadı, bir daha dene.";
function konusmaDinle(hedef, bitti) {
  if (!KonusmaTanima) return bitti({ hata: "yok" });
  try { konusmaAktif && konusmaAktif.abort(); } catch (e) {}
  const r = new KonusmaTanima(); konusmaAktif = r;
  r.lang = "en-US"; r.maxAlternatives = 5; r.interimResults = false; r.continuous = false;
  let duyulan = null, hata = null, bitirildi = false;
  const temiz = t => t.toLowerCase().replace(/[^a-z' ]/g, " ").replace(/\s+/g, " ").trim();
  r.onresult = e => { duyulan = [...e.results[0]].map(x => temiz(x.transcript)); };
  r.onerror = e => { hata = e.error; };
  r.onend = () => {
    if (bitirildi) return; bitirildi = true; konusmaAktif = null;
    if (!duyulan || !duyulan.length) return bitti({ hata: hata || "bos" });
    const h = temiz(hedef), ok = duyulan.some(t => t === h || (" " + t + " ").includes(" " + h + " "));
    bitti({ ok, duyulan: duyulan[0] });
  };
  try { r.start(); } catch (e) { bitirildi = true; bitti({ hata: "baslamadi" }); }
}
const konusmaAcik = () => KonusmaTanima && !((d.konusmaKapali || 0) > Date.now());
function seviyeCiz() {
  document.getElementById("seviye-sec").innerHTML = SEVIYELER.map(([s, ad]) => {
    const top = KELIMELER.filter(k => k[5] === s).length, bilinen = KELIMELER.filter(k => k[5] === s && d.kartlar[k[0]]).length;
    return `<button class="${d.seviye === s ? "aktif" : ""}" data-seviye="${s}">${s}<small>${ad} · ${bilinen}/${top}</small></button>`;
  }).join("");
  document.querySelectorAll("[data-seviye]").forEach(b => b.onclick = () => { if (d.seviye !== b.dataset.seviye) d.konu = ""; d.seviye = b.dataset.seviye; kaydet(); bildir(`Seviye: ${d.seviye} 📚 Aşağıdan konu da seçebilirsin`); herSeyiCiz(); });
  konuCiz();
}
function anaCiz() {
  seviyeCiz();
  const sr = seri(), say = d.bugun.sayi, bek = bekleyenler().length;
  document.getElementById("seri-hap").textContent = "🔥 " + sr;
  ["yildiz-hap", "yildiz-hap2", "yildiz-hap3"].forEach(i => document.getElementById(i).textContent = "🪙 " + d.yildiz);
  document.getElementById("koruyucu-hap").textContent = "🧊 " + d.koruyucu;
  const hedef = gunlukHedef(), yuzde = Math.min(100, Math.round(say / hedef * 100));
  document.getElementById("halka").style.setProperty("--yuzde", yuzde);
  document.getElementById("halka-yazi").textContent = Math.min(say, hedef) + "/" + hedef;
  // Hedef cevap sayısıyla dolar (doğru ya da yanlış); doğrular ayrıca yazılır (U04).
  document.getElementById("hedef-yazi").textContent = say >= hedef ? (d.bugun.hediye ? "Bugünkü hedef tamam! Yarın görüşürüz 💜" : "Hedef tamam! Hediyeni aç 🎁") : `${hedef - say} cevap daha, hediyeni al 🎁 · bugün ${d.bugun.dogru || 0} doğru`;
  document.getElementById("selam-alt").textContent = sr > 0 ? `${sr} günlük serin var, bozmayalım!` : "Bugün birkaç kelime öğrenelim mi?";
  const pvBek = bekleyenler(PHRASAL).length, pvTanis = PHRASAL.filter(k => d.kartlar[k[0]]).length;
  document.getElementById("pv-yazi").textContent = pvBek ? `${pvTanis}/${PHRASAL.length} · ${pvBek} bekliyor` : "Bugünlük bitti 🎉";
  const bd = document.getElementById("basla-dugme");
  bd.textContent = say >= hedef && !d.bugun.hediye ? "🎁 Hediyeni aç" : bek ? "Kartlara başla" : "Cümle alıştırması yap";
  const sayac = [0, 0, 0, 0, 0];
  KELIMELER.forEach(k => { const c = d.kartlar[k[0]]; if (c) sayac[Math.min(c.kutu, 4)]++; });
  const yeniSayi = KELIMELER.filter(k => !d.kartlar[k[0]]).length;
  const renk = ["var(--krem)", "var(--mercan-a)", "var(--gunes-a)", "var(--nane-a)", "var(--lavanta-a)"];
  const ad = ["Yeni", "1. kutu", "2. kutu", "3. kutu", "Öğrenildi ⭐"];
  const deger = [yeniSayi, sayac[1] + sayac[0], sayac[2], sayac[3], sayac[4]];
  const tanisSayi = KELIMELER.filter(k => d.kartlar[k[0]]).length;
  document.getElementById("hazne-dugme-yazi").textContent = tanisSayi ? `${tanisSayi} kelime · seviyeye ve alfabeye göre` : "Tanıştığın kelimeler burada birikir";
  // Dolu kutular gerçek düğme: klavyeyle de seçilip Enter/Boşluk ile açılır.
  document.getElementById("kutular").innerHTML = deger.map((v, i) => i && v
    ? `<button class="kutu tikla" data-kutu="${i}" style="background:${renk[i]}" aria-label="${ad[i].replace(" ⭐", "")}: ${v} kelime, aç"><b>${v}</b><small>${ad[i]}</small></button>`
    : `<div class="kutu" style="background:${renk[i]}"><b>${v}</b><small>${ad[i]}</small></div>`).join("");
  document.querySelectorAll("[data-kutu]").forEach(b => b.onclick = () => kutuAc(+b.dataset.kutu));
  const zor = zorlandiklar();
  document.getElementById("zor-dugme").style.display = zor.length ? "" : "none";
  document.getElementById("zor-yazi").textContent = `${zor.length} kelime sık sık başa döndü · hızlı tekrar`;
}

// ================= KELİME ÇALIŞMA =================
// Yeni kelimeler 3'lü gruplar halinde önce "tanışma kartı"yla gösterilir (sınav yok),
// sonra o 3 kelime karışık sorularla sorulur. Tekrar zamanı gelen eski kelimeler sadece soruyla gelir.
// Cevabı uygulama değerlendirir; yanlış bilinen kelime turun sonunda bir daha sorulur.
// Tur sırası bir kez kurulur (js/ogrenme.js) ve kayda yazılır (d.oturum = kO): kapatıp açınca, sayfayı yenileyince
// aynı tur kaldığı yerden sürer (U16). Tur türleri: kelime, phrasal, spor (antrenman), zor (zorlandıkların). Bir anda tek açık tur.
let kO = null;
const KELIME_HARITA = new Map(KELIMELER.concat(PHRASAL).map(k => [k[0], k]));
const kelimeAl = a => KELIME_HARITA.get(typeof a === "string" ? a : a.id);
// Kayıttaki açık tur bu türdense onu döndürür (aynı gün, kelimeleri tanınıyor, bitmemiş); değilse null.
function acikTur(tur) { return Ogrenme.geriYukle(d.oturum, { gun: bugunNo(), deste: tur, bilinen: KELIME_HARITA }); }
function turBaslat(o, devam) {
  kO = o; d.oturum = kO; kaydet();
  tamAc("kartlar"); adimGoster();
  if (devam && kO.i > 0) bildir("↩️ Kaldığın yerden devam");
}
function kartlariAc(deste = KELIMELER) {
  const tur = deste === PHRASAL ? "phrasal" : "kelime", acik = acikTur(tur);
  if (acik) return turBaslat(acik, true);
  if (!bekleyenler(deste).length) { bildir(deste === PHRASAL ? "Bugünlük phrasal verb kalmadı 🎉" : "Bugünlük kelime kalmadı 🎉 Cümle kurmaya ne dersin?"); return; }
  const b = bugunNo(), tohum = Math.floor(Math.random() * 4294967296);
  const sira = Ogrenme.turOlustur({
    bekleyen: deste.filter(k => d.kartlar[k[0]] && d.kartlar[k[0]].sira <= b).map(k => ({ id: k[0], sira: d.kartlar[k[0]].sira })),
    yeniler: yeniHavuz(deste).map(k => k[0]), son: d.sonSunulan, turBoyu: turBoyu(deste), rastgele: tohumlu(tohum) });
  turBaslat({ deste: tur, gun: b, tohum, sira, i: 0, dogru: 0, yanlis: 0, kiloBas: d.kilo, kiloAdim: [], cevaplanan: null }, false);
}
function adimGoster() {
  const a = kO.sira[kO.i];
  document.getElementById("k-sayac").textContent = `${kO.i}/${kO.sira.length}`;
  document.getElementById("k-cubuk").style.width = (kO.i / kO.sira.length * 100) + "%";
  d.sonSunulan = Ogrenme.sunuldu(d.sonSunulan, a.id);
  antrenmanCiz(); hedefSeritCiz();
  if (a.tip === "tanis") tanisCiz(kelimeAl(a)); else soruCiz(a);
}
function tanisCiz(k) {
  document.getElementById("k-alan").innerHTML = `
    <div class="tanis">
      <button class="hata-bildir" id="t-hata" aria-label="Bu kartta hata bildir">⚑ Hata?</button>
      <span class="yeni-etiket">${k[7] === "phrasal verb" ? "YENİ PHRASAL VERB" : "YENİ KELİME"}</span>
      <button class="ses" id="t-ses">🔊</button>
      <div class="resim">${k[2]}</div>
      <div class="kelime">${k[0]}</div>
      <div class="tur">${k[7]}</div>
      <div class="anlam">${k[1]}</div>
      <div class="ornek">${k[3]} <button class="kucuk-ses" id="t-ses2">🔊</button><i>${k[4]}</i></div>
      ${KonusmaTanima ? `<button class="soyle-dugme" id="t-soyle">🎤 Sen de söyle</button><div class="soyle-sonuc" id="t-soyle-sonuc"></div>` : ""}
    </div>
    <div class="k-alt"><button class="buyuk-dugme" id="t-devam">Tanıştık ›</button></div>`;
  seslendir(k[0], true);
  document.getElementById("t-ses").onclick = () => seslendir(k[0]);
  document.getElementById("t-ses2").onclick = () => seslendir(k[3]);
  document.getElementById("t-devam").onclick = ilerle;
  document.getElementById("t-hata").onclick = e => {
    d.icerikBildirim = (d.icerikBildirim || []).filter(x => x.kelime !== k[0]).concat({ kelime: k[0], gun: bugunNo() }).slice(-200);
    kaydet(); e.currentTarget.disabled = true; e.currentTarget.textContent = "✓ Not edildi"; bildir("⚑ Teşekkürler! Bu kart kontrol listesine eklendi.");
  };
  const ts = document.getElementById("t-soyle");
  if (ts) ts.onclick = () => {
    const sonuc = document.getElementById("t-soyle-sonuc");
    ts.disabled = true; ts.textContent = "🎤 Dinliyorum..."; sonuc.textContent = "";
    konusmaDinle(k[0], o => {
      ts.disabled = false; ts.textContent = "🎤 Tekrar söyle";
      if (o.hata) { sonuc.textContent = konusmaHataYazi(o.hata); return; }
      sonuc.textContent = o.ok ? "✓ Harika, anlaşıldı!" : `Duyduğum: "${o.duyulan}". Bir daha dene 🙂`;
      sonuc.style.color = o.ok ? "#2E8C6E" : "#C9503E"; o.ok ? Ses.dogru() : Ses.yanlis();
    });
  };
}
function soruTipi(a) {
  const k = kelimeAl(a), c = d.kartlar[k[0]];
  let tipler = a.yeni ? ["resim", "anlam"] : (!c || c.kutu <= 2) ? ["resim", "anlam", "ters", "dinle", "soyle"] : ["ters", "dinle", "harf", "soyle"];
  if (!konusmaAcik() || a.sesYok) tipler = tipler.filter(t => t !== "soyle");
  if (k[0].length > 7 || k[0].includes(" ")) tipler = tipler.filter(t => t !== "harf");
  if (!k[6]) tipler = tipler.filter(t => t !== "resim"); // soyut kelimenin resmi cevabı ele vermez, tahmin ettirir
  return tipler[Math.floor(Math.random() * tipler.length)] || "ters";
}
function soruCiz(a) {
  const k = kelimeAl(a), tip = soruTipi(a);
  const digerleri = karistir((k[7] === "phrasal verb" ? PHRASAL : KELIMELER).filter(x => x[0] !== k[0] && !anlamCakisir(x, k))).slice(0, 3);
  let ust = "", siklar = null, dogruCevap = k[0];
  if (tip === "resim") { ust = `<div class="s-yon">Bu hangisi?</div><div class="s-resim">${k[2]}</div>`; siklar = [k[0], ...digerleri.map(x => x[0])]; }
  if (tip === "anlam") { ust = `<div class="s-yon">Türkçesi ne?</div><div class="s-ana">${k[0]}<button class="kucuk-ses" id="s-ses">🔊</button></div>`; siklar = [k[1], ...digerleri.map(x => x[1])]; dogruCevap = k[1]; }
  if (tip === "ters") { ust = `<div class="s-yon">İngilizcesi ne?</div><div class="s-ana">${k[1]}</div>`; siklar = [k[0], ...digerleri.map(x => x[0])]; }
  if (tip === "dinle") { ust = `<div class="s-yon">Dinle ve doğru kelimeyi seç</div><button class="dinle-dugme" id="s-ses">🔊</button>`; siklar = [k[0], ...digerleri.map(x => x[0])]; }
  if (tip === "harf") ust = `<div class="s-yon">Harfleri dizerek yaz</div><div class="s-resim" style="font-size:56px">${k[2]}</div><div class="s-ana" style="font-size:26px">${k[1]}</div>`;
  if (tip === "soyle") ust = `<div class="s-yon">Bu kelimeyi sesli söyle</div><div class="s-ana">${k[0]}<button class="kucuk-ses" id="s-ses">🔊</button></div><div class="soluk" style="font-size:15px;">${k[1]}</div>`;
  let h = `<div class="soru-kart">${ust}</div>`;
  if (siklar) h += `<div class="k-siklar">${karistir(siklar).map(s => `<button class="k-sik">${s}</button>`).join("")}</div>`;
  if (tip === "soyle") h += `<button class="mikrofon" id="mik">🎤</button><div class="konus-durum" id="konus-durum">Mikrofona dokun ve söyle</div><button class="konus-gec" id="konus-gec">Şu an konuşamıyorum</button>`;
  document.getElementById("k-alan").innerHTML = h;
  const ses = document.getElementById("s-ses"); if (ses) ses.onclick = () => seslendir(k[0]);
  if (tip === "dinle") setTimeout(() => seslendir(k[0]), 250);
  kO.kilit = false;
  if (siklar) document.querySelectorAll(".k-sik").forEach(b => b.onclick = () => {
    if (kO.kilit) return;
    const dogru = b.textContent === dogruCevap;
    b.classList.add(dogru ? "dogru" : "yanlis");
    if (!dogru) document.querySelectorAll(".k-sik").forEach(x => { if (x.textContent === dogruCevap) x.classList.add("dogru"); });
    cevapla(a, dogru, b);
  });
  else if (tip === "harf") harfDizme(document.getElementById("k-alan"), k[0], (dogru, el) => cevapla(a, dogru, el));
  else if (tip === "soyle") {
    let deneme = 0;
    const mik = document.getElementById("mik"), durum = document.getElementById("konus-durum");
    mik.onclick = () => {
      if (kO.kilit || mik.classList.contains("dinliyor")) return;
      mik.classList.add("dinliyor"); durum.textContent = "Dinliyorum...";
      konusmaDinle(k[0], o => {
        mik.classList.remove("dinliyor");
        if (o.hata) { durum.textContent = konusmaHataYazi(o.hata); if (o.hata === "not-allowed" || o.hata === "service-not-allowed") { d.konusmaKapali = Date.now() + 15 * 60000; kaydet(); a.sesYok = true; const tur = kO; setTimeout(() => { if (kO === tur && kO.sira[kO.i] === a) soruCiz(a); }, 900); } return; }
        if (o.ok) return cevapla(a, true, mik);
        deneme++; Ses.yanlis();
        if (deneme >= 3) return cevapla(a, false, mik);
        durum.textContent = `Duyduğum: "${o.duyulan}" · ${3 - deneme} hakkın kaldı`;
      });
    };
    document.getElementById("konus-gec").onclick = () => { d.konusmaKapali = Date.now() + 15 * 60000; kaydet(); a.sesYok = true; bildir("🎤 15 dakika sesli soru gelmeyecek"); soruCiz(a); };
  }
}
function cevapla(a, dogru, el) {
  if (kO.cevaplanan === kO.i) return; // aynı soru ikinci kez değerlendirilmez
  kO.kilit = true; kO.cevaplanan = kO.i;
  const k = kelimeAl(a), c = d.kartlar[k[0]], bugun = bugunNo();
  // İlk tanışma günü sayılır: haftalık "yeni kelime" görevi geçmiş haftaların kelimelerini saymasın.
  if (!c) { d.tanisGun = d.tanisGun || {}; d.tanisGun[bugun] = (d.tanisGun[bugun] || 0) + 1; }
  if (dogru) {
    kO.dogru++; konfeti(el, 6);
    // Yeni kelime = Pati beslenir; eski kelime tekrarı = spor. Spor salonunda daha çok yakar (js/oyun.js Kilo).
    const kg = Kilo.adimUygula(d, kO, kO.i, Kilo.cevapFarki({ dogru, spor: kO.spor, yeni: !c, tekrar: a.tekrar }));
    if (kO.spor && kg !== null) { Antrenman.say(d, bugun, kg); kO.sonKg = kg; }
    // hata: kaç kez yanlış bilindi (doğru bildikçe azalır); "Zorlandıkların" bununla seçilir
    const hata = Math.max(0, ((c && c.hata) || 0) - (a.tekrar ? 0 : 1));
    if (a.tekrar || !c) d.kartlar[k[0]] = { kutu: 1, sira: bugun + 1, hata };   // yeni ya da bu turda bir kez kaçırılmış: yarın tekrar
    // Kutu yalnız tekrar günü gelmişse yükselir. Günü gelmemiş kelimeyi çalışmak (spor, kutu açma,
    // zorlandıkların) serbest pratiktir: puan ve kedi etkisi var, kutu ve tekrar günü değişmez.
    else if (c.sira <= bugun) { const kutu = Math.min(4, c.kutu + 1); d.kartlar[k[0]] = { kutu, sira: bugun + ARALIK[kutu], hata }; }
    else d.kartlar[k[0]] = { ...c, hata };
  } else {
    kO.yanlis++;
    d.kartlar[k[0]] = { kutu: 1, sira: bugun, hata: ((c && c.hata) || 0) + 1 };
    kO.sira.push({ tip: "soru", id: k[0], tekrar: true }); // turun sonunda bir daha sor
  }
  soruCevaplandi(dogru);
  kaydet(); rozetKontrol();
  if (kO.spor && dogru) antrenmanSevin();
  sonucSesi(dogru); setTimeout(() => seslendir(k[0], true), 450);
  const gb = document.getElementById("k-gb");
  gb.className = "geri-bildirim acik " + (dogru ? "dogru" : "yanlis"); devamaOdak("k-gb-devam");
  document.getElementById("k-gb-baslik").textContent = dogru ? ["Harika! 🎉", "Süpersin! ✨", "Aynen öyle! 😸"][Math.floor(Math.random() * 3)] : "Bir dahakine! 💪";
  document.getElementById("k-gb-yazi").textContent = `${k[2]} ${k[0]} = ${k[1]}${dogru ? "" : " · Turun sonunda bir daha soracağım."}`;
}
document.getElementById("k-gb-devam").onclick = () => { if (!panelAcik("k-gb")) return; document.getElementById("k-gb").className = "geri-bildirim"; ilerle(); alistirmaOdak(); };
function ilerle() {
  kO.i++;
  if (kO.i < kO.sira.length) { kaydet(); return adimGoster(); }
  // Tur bitti: açık tur kayıttan silinir, sonuç gösterilir.
  const bitti = kO; d.oturum = null; kO = null; kaydet();
  tamKapat();
  // İlk dersin sonu bir kez kutlanır (U04): ne yapıldı ve sıradaki ödüle ne kadar kaldı.
  if (!d.ilkDers && (bitti.deste === "kelime" || bitti.deste === "phrasal")) {
    d.ilkDers = 1; kaydet(); Ses.zafer();
    const hediyeHazir = d.bugun.sayi >= gunlukHedef() && !d.bugun.hediye; // kutlamadan sonra hediye kutusu açılır
    pencere("🎉", "İlk dersin bitti!", `${bitti.sira.filter(a => a.tip === "tanis").length} yeni kelimeyle tanıştın, ${bitti.dogru} doğru cevap verdin. ${sonrakiOdulYazi()}`, hediyeHazir ? "Hediyeni aç 🎁" : "Süper", hediyeHazir ? hediyePenceresi : null);
    return setTimeout(() => konfeti(document.getElementById("pencere"), 18), 50);
  }
  if (d.bugun.sayi >= gunlukHedef() && !d.bugun.hediye) return hediyePenceresi();
  if (bitti.spor) return antrenmanSonuc(bitti, true);
  const fark = d.kilo - bitti.kiloBas;
  pencere(bitti.zor ? "🔥" : "🃏", bitti.zor ? "Zorlu tekrar bitti!" : "Tur bitti!", `${bitti.dogru} doğru, ${bitti.yanlis} yanlış. ${d.kediAd}: ${fark >= 0 ? "+" : ""}${fark.toFixed(1)} kg (${d.kilo.toFixed(1)} kg, ${kiloDurumu().ad}). ${sonrakiOdulYazi()}`, "Tamam");
}
// Yarıda kapatılan tur kayıtta açık kalır; spor turunda o ana kadarki kazanım gösterilir.
function turYaridaKaldi() {
  if (!kO) return;
  const o = kO; kO = null;
  if (o.spor && o.dogru) antrenmanSonuc(o, false);
  else if (o.i > 0) bildir("💾 Tur kaydedildi, kaldığın yerden devam edersin");
}
// Sonraki ödüle açık mesafe (U04): günlük hediye mi, yoksa yarın mı.
function sonrakiOdulYazi() {
  const h = Ilerleme.hedefDurumu(d.bugun.sayi, d.bugun.dogru || 0, gunlukHedef(), EKONOMI.hedefIsaret);
  if (!h.tamam) return `🎁 Günlük hediyeye ${h.kalan} cevap kaldı.`;
  return d.bugun.hediye ? "Bugünkü hediye alındı; yarın yenisi 🔥" : "🎁 Hediyen hazır!";
}
// Günlük hedef şeridi: kart, Kelime Kur ve cümle ekranlarında aynı kural (her cevap sayılır, doğrular ayrıca yazılır).
function hedefSeritCiz() {
  const h = Ilerleme.hedefDurumu(d.bugun.sayi, d.bugun.dogru || 0, gunlukHedef(), EKONOMI.hedefIsaret);
  const durum = h.tamam ? (d.bugun.hediye ? "Hedef tamam ✓" : "🎁 Hediye hazır") : `🎁 ${h.kalan} cevap kaldı`;
  document.querySelectorAll(".hedef-serit").forEach(el => {
    el.innerHTML = `<span>🎯 Günlük hedef <b>${Math.min(h.sayi, h.hedef)}/${h.hedef}</b> cevap · ${h.dogru} doğru</span><small>${durum}</small>
      <span class="hs-cubuk"><i style="width:${h.yuzde}%"></i>${h.isaretler.map(n => `<em style="left:${n / h.hedef * 100}%" class="${h.sayi >= n ? "gecti" : ""}"></em>`).join("")}</span>`;
  });
}
