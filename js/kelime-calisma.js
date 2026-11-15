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
const YerliKonusma = (()=>{try{const c=window.Capacitor;return c?.isNativePlatform?.()&&c.registerPlugin?c.registerPlugin('PatiSpeech'):null;}catch(e){return null;}})();
const KonusmaDestegi=!!(YerliKonusma||KonusmaTanima);
let konusmaAktif=null,konusmaNesil=0;
function konusmaIptal(){konusmaNesil++;try{konusmaAktif?.abort()}catch(e){}konusmaAktif=null;}
Oturumlar.ekle('mikrofon',konusmaIptal,undefined,undefined,'kartlar');
document.addEventListener('visibilitychange',()=>{if(document.hidden)konusmaIptal()});
const konusmaHataYazi=h=>h==='not-allowed'||h==='service-not-allowed'?'Mikrofon izni verilmedi. İstersen telefon ayarlarından izin verebilirsin.':h==='yok'?'Cihazında konuşma tanıma servisi bulunamadı. Diğer soru türleriyle devam edebilirsin.':h==='no-speech'||h==='bos'?'Ses duyamadım, bir daha dene.':h==='network'?'Konuşma tanıma için internet gerekli.':'Dinleme tamamlanamadı; bir daha dene.';
function konusmaDinle(hedef,bitti){
  konusmaIptal();const nesil=konusmaNesil;let son=false,zaman;
  const bitir=r=>{if(son||nesil!==konusmaNesil)return;son=true;clearTimeout(zaman);konusmaAktif=null;bitti(r)};
  if(YerliKonusma){konusmaAktif={abort:()=>YerliKonusma.stop().catch(()=>{})};YerliKonusma.recognize().then(r=>bitir(KonusmaKural.sonuc(hedef,r.duyulan))).catch(e=>bitir({hata:e.code||'baslamadi'}));return;}
  if(!KonusmaTanima)return bitir({hata:'yok'});
  const r=new KonusmaTanima();konusmaAktif=r;r.lang='en-US';r.maxAlternatives=5;r.interimResults=false;r.continuous=false;
  let duyulan=[],hata=null;r.onresult=e=>{duyulan=[...e.results[0]].map(x=>x.transcript)};r.onerror=e=>{hata=e.error};
  r.onend=()=>bitir(duyulan.length?KonusmaKural.sonuc(hedef,duyulan):{hata:hata||'bos'});
  try{r.start();zaman=setTimeout(()=>{try{r.abort()}catch(e){}bitir({hata:'no-speech'})},12000)}catch(e){bitir({hata:'baslamadi'})}
}
const konusmaAcik=()=>KonusmaDestegi&&!((d.konusmaKapali||0)>Date.now());
function seviyeCiz() {
  document.getElementById("seviye-sec").innerHTML = SEVIYELER.map(([s, ad]) => {
    return `<button class="${d.seviye === s ? "aktif" : ""}" aria-pressed="${d.seviye === s}" data-seviye="${s}">${s}<small>${ad}</small></button>`;
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
  const hediyeNotu = say >= hedef ? (d.bugun.hediye ? "Hediye alındı" : "Hediye hazır") : `Hediyeye ${hedef - say} cevap kaldı`;
  document.getElementById("hedef-yazi").textContent = `${hediyeNotu} · ${d.bugun.dogru || 0} doğru`;
  const pvBek = bekleyenler(PHRASAL).length, pvTanis = PHRASAL.filter(k => d.kartlar[k[0]]).length;
  document.getElementById("pv-yazi").textContent = pvBek ? `${pvTanis}/${PHRASAL.length} · ${pvBek} bekliyor` : "Bugünlük bitti 🎉";
  const bd = document.getElementById("basla-dugme");
  const acik = acikTur("kelime"), tekrar = KELIMELER.filter(k => d.kartlar[k[0]]?.sira <= bugunNo()).length;
  const boy = kisaTurBoyu();
  bd.textContent = acik ? "Kayıtlı çalışmana devam et" : say >= hedef ? (!d.bugun.hediye ? "Hediyeni aç" : "Bugünlük tamam") : !bek ? "Cümle alıştırmasına başla" : tekrar ? `${Math.min(boy, tekrar)} kelimeyi hatırla` : !d.ilkDers ? "İlk mini dersine başla" : `${Math.min(boy, bek)} kelime daha`;
  const dersBasligi = document.getElementById("mini-ders-baslik");
  const dersNotu = document.getElementById("mini-ders-not");
  if (acik) {
    dersBasligi.textContent = MINI_DURUMLAR.find(s => s.id === acik.durum)?.ad || "Kaldığın yerden";
    dersNotu.textContent = `${new Set(acik.sira.map(adim => adim.id)).size} kelimelik kayıtlı tur`;
  } else if (say >= hedef) {
    dersBasligi.textContent = "Günlük hedef tamam";
    dersNotu.textContent = sonrakiTekrarYazi();
  } else if (!bek) {
    dersBasligi.textContent = "Cümle kurma";
    dersNotu.textContent = "Kısa bir cümle alıştırması";
  } else {
    const sahne = MiniDers.durum(d.kartlar, d.seviye, d.konu);
    const konu = KONULAR.concat([KONU_GENEL]).find(([kod]) => kod === d.konu)?.[1].replace(/^[^\p{L}]+/u, "");
    const adet = Math.min(boy, bek);
    dersBasligi.textContent = tekrar ? "Kelime tekrarı" : sahne?.ad || konu || "Yeni kelimeler";
    dersNotu.textContent = `${adet} kelime · yaklaşık ${adet === 1 ? "1" : "2"} dk`;
  }
  const sayac = [0, 0, 0, 0, 0];
  KELIMELER.forEach(k => { const c = d.kartlar[k[0]]; if (c) sayac[Math.min(c.kutu, 4)]++; });
  const yeniSayi = KELIMELER.filter(k => !d.kartlar[k[0]]).length;
  const renk = ["var(--krem)", "var(--mercan-a)", "var(--gunes-a)", "var(--nane-a)", "var(--lavanta-a)"];
  const ad = ["Yeni", "Çalışıldı", "Tekrar · 2", "Tekrar · 3", "Pekişti ⭐"];
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
// Yeni kelimeler üçlü tanışma gruplarıyla gösterilir (sınav yok),
// her grubun ardından soruları gelir. Tekrar zamanı gelen eski kelimeler sadece soruyla gelir.
// Cevabı uygulama değerlendirir; yanlış bilinen kelime turun sonunda bir daha sorulur.
// Tur sırası bir kez kurulur (js/ogrenme.js) ve kayda yazılır (d.oturum = kO): kapatıp açınca, sayfayı yenileyince
// aynı tur kaldığı yerden sürer (U16). Tur türleri: kelime, phrasal, spor (antrenman), zor (zorlandıkların). Bir anda tek açık tur.
let kO = null;
function kartOturumunuBirak() { kO = null; }
const KELIME_HARITA = new Map(KELIMELER.concat(PHRASAL).map(k => [k[0], k]));
const kelimeAl = a => {
  const k = KELIME_HARITA.get(typeof a === "string" ? a : a.id);
  const sahne = MINI_DURUMLAR.find(s => s.id === kO?.durum), ornek = sahne?.ornekler[k?.[0]];
  return ornek ? [k[0],k[1],k[2],ornek[0],ornek[1],...k.slice(5)] : k;
};
// Kayıttaki açık tur bu türdense onu döndürür (aynı gün, kelimeleri tanınıyor, bitmemiş); değilse null.
function acikTur(tur) { return Ogrenme.geriYukle(d.oturum, { gun: bugunNo(), deste: tur, bilinen: KELIME_HARITA }); }
function turBaslat(o, devam) {
  kO = o; d.oturum = kO; kaydet();
  tamAc("kartlar"); if (kO.i === kO.sira.length - 1 && kO.cevaplanan === kO.i) return ilerle(); adimGoster();
  if (devam && kO.i > 0) bildir("↩️ Kaldığın yerden devam");
}
function kartlariAc(deste = KELIMELER, mini = false) {
  const tur = deste === PHRASAL ? "phrasal" : "kelime", acik = acikTur(tur);
  if (acik) return turBaslat(acik, true);
  if (!bekleyenler(deste).length) { bildir(deste === PHRASAL ? "Bugünlük phrasal verb kalmadı 🎉" : "Bugünlük kelime kalmadı 🎉 Cümle kurmaya ne dersin?"); return; }
  const b = bugunNo(), tohum = Math.floor(Math.random() * 4294967296);
  const boy = mini ? kisaTurBoyu(deste) : turBoyu(deste);
  const durum = mini && deste === KELIMELER && !deste.some(k=>d.kartlar[k[0]]?.sira<=b) ? MiniDers.durum(d.kartlar,d.seviye,d.konu) : null;
  const sira = Ogrenme.turOlustur({
    bekleyen: deste.filter(k => d.kartlar[k[0]] && d.kartlar[k[0]].sira <= b).map(k => ({ id: k[0], sira: d.kartlar[k[0]].sira })), tekrarSiniri: mini ? boy : OGRENME.enCokTekrar,
    yeniler: durum ? durum.kelimeler.filter(id => !d.kartlar[id]) : yeniHavuz(deste).map(k => k[0]), son: d.sonSunulan, turBoyu: boy, rastgele: tohumlu(tohum) });
  turBaslat({ deste: tur, mini, durum: durum?.id || null, gun: b, tohum, sira, i: 0, dogru: 0, yanlis: 0, kiloBas: d.kilo, kiloAdim: [], cevaplanan: null }, false);
}
function adimGoster() {
  const a = kO.sira[kO.i];
  const once = kO.sira.slice(0, kO.i), tanis = kO.sira.filter(x => x.tip === "tanis").length;
  document.getElementById("k-sayac").textContent = `Tanışma ${once.filter(x => x.tip === "tanis").length}/${tanis} · Cevap ${once.filter(x => x.tip === "soru").length}/${kO.sira.length - tanis}`;
  document.getElementById("k-cubuk").style.width = (kO.i / kO.sira.length * 100) + "%";
  d.sonSunulan = Ogrenme.sunuldu(d.sonSunulan, a.id);
  antrenmanCiz(); hedefSeritCiz();
  if (a.tip === "tanis") tanisCiz(kelimeAl(a)); else soruCiz(a);
  PatiGorunum.araclar();
}
function tanisCiz(k) {
  document.getElementById("k-alan").innerHTML = `
    <div class="tanis">
      <p class="durum-baslik">${kO.durum ? MINI_DURUMLAR.find(s=>s.id===kO.durum)?.ad || "" : k[7] === "phrasal verb" ? "Yeni phrasal verb" : "Yeni kelime"}</p>
      <div class="resim">${kelimeGorseli(k)}</div>
      <div class="tanis-kelime"><div class="kelime" lang="en">${k[0]}</div><button class="kucuk-ses" id="t-ses" aria-label="Kelimeyi dinle">${patiIkon("speaker-high")}</button></div>
      <div class="tur">${k[7]}</div>
      <div class="anlam">${k[1]}</div>
      <div class="ornek"><span lang="en">${k[3]}</span> <button class="kucuk-ses" id="t-ses2" aria-label="Örnek cümleyi dinle">${patiIkon("speaker-high")}</button><i>${k[4]}</i></div>
      ${KonusmaDestegi ? `<button class="soyle-dugme" id="t-soyle" aria-describedby="t-mikrofon-not">Sen de söyle</button><div class="soyle-sonuc" id="t-soyle-sonuc" aria-live="polite"></div><p class="mikrofon-not" id="t-mikrofon-not">Bazen internet gerekir. Ses kaydı saklanmaz, telaffuz puanı verilmez.</p>` : ""}
      <button class="hata-bildir" id="t-hata" aria-label="Bu kartta hata bildir">Hata bildir</button>
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
    ts.disabled = true; ts.textContent = "Dinliyorum…"; sonuc.textContent = "";
    konusmaDinle(k[0], o => {
      ts.disabled = false; ts.textContent = "Tekrar söyle";
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
  if(a.beceri) return beceriSoruCiz(a);
  const k = kelimeAl(a), tip = soruTipi(a);
  const digerleri = yanlisSecenekler(k, k[7] === "phrasal verb" ? PHRASAL : KELIMELER);
  let ust = "", siklar = null, dogruCevap = k[0];
  if (tip === "resim") { ust = `<div class="s-yon">Bu hangisi?</div><div class="s-resim">${kelimeGorseli(k)}</div>`; siklar = [k[0], ...digerleri.map(x => x[0])]; }
  if (tip === "anlam") { ust = `<div class="s-yon">Türkçesi ne?</div><div class="s-ana">${k[0]}<button class="kucuk-ses" id="s-ses">🔊</button></div>`; siklar = [k[1], ...digerleri.map(x => x[1])]; dogruCevap = k[1]; }
  if (tip === "ters") { ust = `<div class="s-yon">İngilizcesi ne?</div><div class="s-ana">${k[1]}</div>`; siklar = [k[0], ...digerleri.map(x => x[0])]; }
  if (tip === "dinle") { ust = `<div class="s-yon">Dinle ve doğru kelimeyi seç</div><button class="dinle-dugme" id="s-ses">🔊</button>`; siklar = [k[0], ...digerleri.map(x => x[0])]; }
  if (tip === "harf") ust = `<div class="s-yon">Harfleri dizerek yaz</div><div class="s-resim" style="font-size:56px">${kelimeGorseli(k)}</div><div class="s-ana" style="font-size:26px">${k[1]}</div>`;
  if (tip === "soyle") ust = `<div class="s-yon">Bu kelimeyi sesli söyle</div><div class="s-ana">${k[0]}<button class="kucuk-ses" id="s-ses">🔊</button></div><div class="soluk" style="font-size:15px;">${k[1]}</div>`;
  let h = `<div class="soru-kart">${ust}</div>`;
  if (siklar) h += `<div class="k-siklar">${karistir(siklar).map(s => `<button class="k-sik">${s}</button>`).join("")}</div>`;
  if (tip === "soyle") h += `<button class="mikrofon" id="mik">🎤</button><div class="konus-durum" id="konus-durum">Mikrofona dokun ve söyle</div><button class="konus-gec" id="konus-gec">Şu an konuşamıyorum</button>`;
  document.getElementById("k-alan").innerHTML = h;
  if (tip === "resim") {
    const resim = document.querySelector("#k-alan .s-resim");
    resim.setAttribute("role", "img");
    resim.setAttribute("aria-label", k[1]);
  }
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
  const k = kelimeAl(a);
  if (!CalismaIslemi.cevapla(d, kO, a, k[0], dogru, bugunNo(), ARALIK)) return;
  
  soruCevaplandi(dogru);
  kaydet(); rozetKontrol();
  if (kO.spor && dogru) antrenmanSevin();
  sonucSesi(dogru); setTimeout(() => seslendir(k[0], true), 450);
  const gb = document.getElementById("k-gb");
  document.getElementById("k-alan").inert = true;
  gb.className = "geri-bildirim acik " + (dogru ? "dogru" : "yanlis"); devamaOdak("k-gb-devam");
  document.getElementById("k-gb-baslik").textContent = dogru ? `${k[0]}: doğru hatırladın.` : "Tur sonunda tekrar";
  document.getElementById("k-gb-yazi").textContent = `${k[0]} = ${k[1]}`;
}
document.getElementById("k-gb-devam").onclick = () => { if (!panelAcik("k-gb")) return; document.getElementById("k-gb").className = "geri-bildirim"; document.getElementById("k-alan").inert = false; ilerle(); alistirmaOdak(); };
function ilerle() {
  kO.i++;
  if (kO.i < kO.sira.length) { kaydet(); return adimGoster(); }
  // Tur bitti: açık tur kayıttan silinir, sonuç gösterilir.
  const bitti = kO; d.oturum = null; kO = null; kaydet();
  if (bitti.mini) {
    if (!d.ilkDers) { d.ilkDers = 1; kaydet(); }
    return miniDersSonucu(bitti);
  }
  // İlk dersin sonu bir kez kutlanır (U04): ne yapıldı ve sıradaki ödüle ne kadar kaldı.
  if (!d.ilkDers && (bitti.deste === "kelime" || bitti.deste === "phrasal")) {
    d.ilkDers = 1; kaydet(); Ses.zafer();
    turSonucu("🎉", "İlk dersin bitti!", `${bitti.sira.filter(a => a.tip === "tanis").length} yeni kelimeyle tanıştın, ${bitti.dogru} doğru, ${bitti.yanlis} yanlış. ${sonrakiOdulYazi()}`, () => kelimeDevami(bitti));
    return setTimeout(() => konfeti(document.getElementById("pencere"), 18), 50);
  }
  if (bitti.spor) return antrenmanSonuc(bitti, true);
  const fark = d.kilo - bitti.kiloBas;
  turSonucu(bitti.zor ? "🔥" : "🃏", bitti.zor ? "Zorlu tekrar bitti!" : "Tur bitti!", `${bitti.dogru} doğru, ${bitti.yanlis} yanlış. ${d.kediAd}: ${fark >= 0 ? "+" : ""}${fark.toFixed(1)} kg (${d.kilo.toFixed(1)} kg, ${kiloDurumu().ad}). ${sonrakiOdulYazi()}`, () => kelimeDevami(bitti));
}
// Yalnız bu turda gerçekten cevaplanan kelimelere bağlı, mevcut cümleler önerilir.
function kelimeDevami(tur) {
  const cumleler = Ogrenme.bagliCumleler(tur.sira.filter((a, i) => i < tur.i), CUMLELER);
  if (tur.spor || !cumleler.length) return hediyeHazirsaAc();
  pencere("🧩", "Kelimeleri cümlede kullan", `${cumleler.length} kısa cümleyle devam edebilirsin. ${sonrakiTekrarYazi()}`, `Öğrendiklerinle ${cumleler.length} cümle kur`, () => cumleAc(cumleler));
  const bitir = document.createElement("button"); bitir.className = "menu-link"; bitir.textContent = "Bugünlük bitir";
  bitir.onclick = () => { document.getElementById("perde").classList.remove("aktif"); hediyeHazirsaAc(); };
  document.getElementById("pencere").append(bitir);
}
function sonrakiTekrarYazi() {
  const b = bugunNo(), kartlar = KELIMELER.concat(PHRASAL).map(k => d.kartlar[k[0]]).filter(Boolean);
  const bek = kartlar.filter(c => c.sira <= b).length;
  if (bek) return `${bek} kelimenin tekrar zamanı geldi; ana sayfadan devam edebilirsin.`;
  const yarin = kartlar.filter(c => c.sira === b + 1).length;
  if (yarin) return `Yarın ${yarin} kelimeyi hatırlamayı deneyeceğiz. Tekrarlar ana sayfada hazır olacak.`;
  return "Yeni kelimelerle veya cümlelerle istediğin zaman devam edebilirsin.";
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
    if (el.parentElement.id === "tam-kartlar") {
      const hediye = h.tamam ? (d.bugun.hediye ? " · hediye alındı" : " · hediye hazır") : "";
      el.innerHTML = `Günlük hedef <b>${Math.min(h.sayi, h.hedef)}/${h.hedef}</b> cevap · ${h.dogru} doğru${hediye}`;
      return;
    }
    el.innerHTML = `<span>Günlük hedef <b>${Math.min(h.sayi, h.hedef)}/${h.hedef}</b> cevap · ${h.dogru} doğru</span><small>${durum}</small>
      <span class="hs-cubuk"><i style="width:${h.yuzde}%"></i>${h.isaretler.map(n => `<em style="left:${n / h.hedef * 100}%" class="${h.sayi >= n ? "gecti" : ""}"></em>`).join("")}</span>`;
  });
}


function miniDersSonucu(tur, cumleSonuc = null) {
  const oz = MiniDers.ozet(tur), durum = MINI_DURUMLAR.find(s=>s.id===tur.durum);
  const havuz = durum ? durum.cumleler : CUMLELER;
  const cumleler = Ogrenme.bagliCumleler(tur.sira.slice(0,tur.i),havuz);
  const tamam = d.bugun.sayi >= gunlukHedef(), hediye = tamam && !d.bugun.hediye;
  const metin = `${oz.yeni ? `${oz.yeni} kelimeyle tanıştın.` : `${oz.kelime} kelimeyi tekrar ettin.`}<br>${oz.dogru} doğru, ${oz.yanlis} yanlış` +
    (cumleSonuc ? `<br>${cumleSonuc.toplam} cümle denedin, ${cumleSonuc.dogru} doğru kurdun.` : '.');
  const devam = () => kartlariAc(KELIMELER,true), cumle = () => cumleAc(cumleler,tur);
  tamKapat();
  pencere(patiIkon('check'), 'Küçük dersin tamam', metin,
    hediye ? 'Hediyeni aç' : tamam ? 'Bugünlük bitir' : !cumleSonuc && cumleler.length ? `${cumleler.length} cümlede kullan` : `${kisaTurBoyu()} kelimeyle devam`,
    hediye ? hediyeHazirsaAc : tamam ? null : !cumleSonuc && cumleler.length ? cumle : devam);
  if (!tamam || hediye) miniEkDugme('Bugünlük bitir',()=>{});
  if(tamam && !cumleSonuc && cumleler.length) miniEkDugme(`İstersen ${cumleler.length} cümlede kullan`,cumle);
  const bilgi=document.createElement('details'), bas=document.createElement('summary'), aciklama=document.createElement('p');
  bas.textContent='Çalışma ayrıntıları';aciklama.textContent=`${oz.cevap} kelime cevabı. ${sonrakiTekrarYazi()} Günlük hedef: ${Math.min(d.bugun.sayi,gunlukHedef())}/${gunlukHedef()} cevap.`;
  bilgi.append(bas,aciklama);document.getElementById('pencere').append(bilgi);
  const tekrar=document.createElement('p');tekrar.className='ozet-tekrar';tekrar.textContent=sonrakiTekrarYazi();document.getElementById('pencere').querySelector('#p-dugme').before(tekrar);
}
function miniEkDugme(yazi, sonra) {
  const b=document.createElement('button');b.className='menu-link';b.textContent=yazi;
  b.onclick=()=>{document.getElementById('perde').classList.remove('aktif');sonra();herSeyiCiz();};
  document.getElementById('pencere').append(b);
}
function gunTamamPenceresi() {
  pencere(patiIkon('paw-print'),'Bugünlük tamam',`Günlük hedefin tamamlandı. ${sonrakiTekrarYazi()}`,'Bugünlük bitir');
  if (kisaTurBoyu()) miniEkDugme(`İstersen ${kisaTurBoyu()} kelime daha`,()=>kartlariAc(KELIMELER,true));
}

function kisaTurBoyu(deste = KELIMELER) {
  const sahne=deste===KELIMELER?MiniDers.durum(d.kartlar,d.seviye,d.konu):null;
  const tekrar=deste.filter(k=>d.kartlar[k[0]]?.sira<=bugunNo()).length;
  const yeni=sahne?sahne.kelimeler.filter(id=>!d.kartlar[id]).length:yeniHavuz(deste).length;
  return Math.min(MiniDers.boy(d.bugun.sayi,gunlukHedef()),tekrar || yeni);
}
