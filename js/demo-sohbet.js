// ================= ÇETE SOHBETİ (örnek) =================
// Amaç: gerçek insanlarla öğrendiğin dilde pratik. Prototipte mesajlar örnek, cevaplar hazır.
// Gerçekte: sunucu, moderasyon, bildir/engelle, yaş kuralları gerekir (README).
const CETE_UYELER = [["Ahmet", "#FF8A7A"], ["Elif", "#5CC9A7"], ["Mert", "#6DB8EE"], ["Zeynep", "#F5A3C7"]];
const SOHBET_ORNEK = [
  ["Elif", "Good morning team! I learned the word \"journey\" today 🧳"],
  ["Ahmet", "Nice! Can you make a sentence with it?"],
  ["Elif", "My journey to school takes twenty minutes."],
  ["Mert", "I am tired but I will study ten cards tonight 💪"],
  ["Zeynep", "Who wants to practice phrasal verbs? I can't figure out \"put up with\" 😅"],
];
const SOHBET_CEVAP = ["Great sentence! 👏", "Nice! I didn't know that word.", "Good job! Keep going 💪", "Haha, me too 😄", "Can you use it in another sentence?", "Wow, your English is getting better!"];
// Kaba ifadeler kelime sınırıyla aranır: "normal day" içindeki "mal" gibi kelime parçaları engellenmez.
// Türkçe kökler (aptallık, salaklar...) ekli halleriyle de yakalanır; "mal" yalnız tek başına.
const HARF = "a-zçğıöşü";
const YASAKLI = [["stupid", 1], ["idiot", 1], ["shut up"], ["hate you"], ["dumb"], ["aptal", 1], ["salak", 1], ["gerizekal", 1], ["mal"]]
  .map(([s, kok]) => new RegExp(`(^|[^${HARF}])${s}${kok ? "" : `(?=$|[^${HARF}])`}`));
const bildirilen = new Set();
// Sohbet güvenliği (R02): mesajlar HTML metni olarak değil, öğe öğe (textContent) kurulur.
// Yedekten ya da dışarıdan gelen metin ne içerirse içersin sayfada kod olarak çalışamaz.
function ogrenilenleriIsaretle(metin) {
  const kullanilan = [], parcalar = [];
  let son = 0;
  for (const m of String(metin).matchAll(/[A-Za-z']+/g)) {
    const k = KELIMELER.find(x => x[0] === m[0].toLowerCase());
    if (k && d.kartlar[k[0]] && !kullanilan.includes(k[0])) {
      kullanilan.push(k[0]);
      parcalar.push({ metin: metin.slice(son, m.index) }, { metin: m[0], isaretli: true });
      son = m.index + m[0].length;
    }
  }
  parcalar.push({ metin: String(metin).slice(son) });
  return { parcalar, kullanilan };
}
function sohbetMesajEl(kim, metin, ben, n, zaman) {
  const el = document.createElement("div"); el.className = "mesaj" + (ben ? " ben" : "");
  if (!ben) {
    const k = document.createElement("span"); k.className = "kim"; k.textContent = kim;
    const o = document.createElement("span"); o.className = "ornek-etiket"; o.textContent = "örnek"; k.append(o);
    const b = document.createElement("button"); b.className = "bildir"; b.dataset.bildir = n; b.setAttribute("aria-label", "Bu mesajı gizle"); b.textContent = "⚑";
    el.append(k, b, document.createTextNode(metin));
    if (zaman) { const saat=document.createElement('time');saat.className='mesaj-saati';saat.textContent=Sohbet.saat(zaman);el.append(saat); }
  return el;
  }
  const o = ogrenilenleriIsaretle(metin);
  for (const p of o.parcalar) {
    if (!p.isaretli) { el.append(document.createTextNode(p.metin)); continue; }
    const m = document.createElement("mark"); m.textContent = p.metin; el.append(m);
  }
  if (o.kullanilan.length) { const s = document.createElement("span"); s.className = "ogrendi"; s.textContent = `✓ Öğrendiğin ${o.kullanilan.length} kelimeyi kullandın`; el.append(s); }
  if (zaman) { const saat=document.createElement('time');saat.className='mesaj-saati';saat.textContent=Sohbet.saat(zaman);el.append(saat); }
  return el;
}
// Ekran durumu (U07): kim yazıyor, son kayıt hatası, kaç mesaj çizildi (yeni mesajı anlamak için).
const sohbetEkran = { yaziyor: null, hata: null, sayi: 0 };
let altaInIstek = 0;
function sohbetAltDugmeCiz(yeni = false) {
  const liste = document.getElementById('sohbet-liste'), b = document.getElementById('sohbet-yeni');
  b.hidden = Sohbet.alttaMi(liste.scrollTop, liste.scrollHeight, liste.clientHeight);
  if (b.hidden) delete b.dataset.yeni;
  else if (yeni) b.dataset.yeni = '1';
  b.textContent = b.dataset.yeni ? '↓ Yeni mesaj · En alta in' : '↓ En alta in';
}
function sohbetAltaIn() {
  const liste = document.getElementById('sohbet-liste'), istek = ++altaInIstek;
  const oturum = CeteEkran.sohbet;
  const uygula = () => {
    if (istek !== altaInIstek || CeteEkran.sohbet !== oturum || !document.getElementById('tam-sohbet').classList.contains('aktif')) return;
    liste.scrollTop = liste.scrollHeight;
    sohbetAltDugmeCiz();
  };
  uygula(); requestAnimationFrame(() => { uygula(); requestAnimationFrame(uygula); });
}
for (const tur of ['pointerdown', 'wheel']) document.getElementById('sohbet-liste').addEventListener(tur, () => { altaInIstek++; }, { passive: true });
function sohbetDurumCiz(mesajSayisi) {
  const el = document.getElementById("sohbet-durum");
  const s = Sohbet.durumSatiri({ mesajSayisi, cevrimici: navigator.onLine, yaziyor: sohbetEkran.yaziyor, hata: sohbetEkran.hata });
  el.hidden = !s; el.textContent = s ? s.metin : ""; el.className = "sohbet-durum" + (s ? " " + s.tur : "");
}
function sohbetCiz(benim) {
  d.sohbet = d.sohbet || [];
  const liste = document.getElementById("sohbet-liste");
  const altta = Sohbet.alttaMi(liste.scrollTop, liste.scrollHeight, liste.clientHeight);
  const ogeler = SOHBET_ORNEK.map(([kim, m], n) => bildirilen.has("o" + n) ? null : sohbetMesajEl(kim, m, false, "o" + n));
  const bas = Math.max(0, d.sohbet.length - SOHBET.gosterilen);
  d.sohbet.slice(bas).forEach((m, n) => { if (!bildirilen.has("s" + (bas + n))) ogeler.push(sohbetMesajEl(m.kim, m.metin, m.kim === "Sen", "s" + (bas + n), m.zaman)); });
  const cizilen = ogeler.filter(Boolean), yeniVar = d.sohbet.length > sohbetEkran.sayi, ust = liste.scrollTop;
  liste.replaceChildren(...cizilen);
  // Eski mesajları okurken zorla aşağı kaydırma yok; yeni mesaj gelince gösterge çıkar.
  const karar = Sohbet.kaydirmaKarari({ altta, benim: !!benim || !sohbetEkran.sayi, yeniVar });
  if (karar === "in") sohbetAltaIn();
  else { liste.scrollTop = ust; sohbetAltDugmeCiz(karar === "goster"); }
  sohbetEkran.sayi = d.sohbet.length;
  sohbetDurumCiz(cizilen.length);
  liste.querySelectorAll("[data-bildir]").forEach(b => b.onclick = () => {
    bildirilen.add(b.dataset.bildir); Ses.pop(); bildir("🚩 Mesaj senden gizlendi. Bu demoda kimseye gönderilmez."); sohbetCiz();
  });
  // Öneri çipleri: son öğrendiğin kelimelerden
  const son = KELIMELER.filter(k => d.kartlar[k[0]]).slice(-6).map(k => k[0]);
  document.getElementById("sohbet-oneri").innerHTML = (son.length ? son : ["hello", "today", "study"]).map(w => `<button data-oner="${Sohbet.kacis(w)}">${Sohbet.kacis(w)}</button>`).join("");
  document.querySelectorAll("[data-oner]").forEach(b => b.onclick = () => { const g = document.getElementById("sohbet-girdi"); g.value = (g.value + " " + b.dataset.oner).trim() + " "; g.focus(); });
}
let sohbetCevapZaman;
function sohbetGonder() {
  if (CeteEkran.sohbet) { gercekGonder(); return; } // gerçek çete sohbeti (js/cete-ekran.js)
  const g = document.getElementById("sohbet-girdi"), metin = Sohbet.temizle(g.value);
  if (!metin) return;
  const kucuk = metin.toLocaleLowerCase("tr");
  if (YASAKLI.some(y => y.test(kucuk))) { Ses.yanlis(); pencere("🙀", "Bu mesaj gönderilemedi", "Çete'de nazik dil kuralı var. Başka türlü söylemeyi dene.", "Tamam"); return; }
  if (/[çğıöşüÇĞİÖŞÜ]/.test(metin)) { Ses.yanlis(); sohbetDilUyari("🇬🇧 Çete sohbeti İngilizce. Öneri çiplerindeki kelimelerle dene!"); return; }
  const o = ogrenilenleriIsaretle(metin);
  d.sohbet = d.sohbet || []; d.sohbet.push({ kim: "Sen", metin: metin.replace(/[<>]/g, ""), zaman: Date.now() });
  let odul = 0;
  if (o.kullanilan.length) { odul = Ekonomi.kazan(d, "sohbet:" + bugunNo(), EKONOMI.odul.sohbet.miktar, bugunNo()); if (odul) d.sohbetOdulGunu = bugunNo(); }
  // Sohbete yazmak çalışma günü saymaz (js/ilerleme.js kuralı).
  const kaydedildi = kaydet();
  sohbetEkran.hata = kaydedildi ? null : "⚠️ Mesaj bu cihaza kaydedilemedi; uygulamayı kapatırsan kaybolabilir.";
  Ses.pop(); g.value = ""; sohbetCiz(true);
  if (!kaydedildi) { const ben = document.querySelectorAll("#sohbet-liste .mesaj.ben"); if (ben.length) ben[ben.length - 1].classList.add("kaydedilemedi"); }
  if (odul) { Ses.altin(); bildir(`✨ Öğrendiğin kelimeyi sohbette kullandın! +1 🪙 (günde bir kez)`); }
  // Örnek cevap: bir çete üyesi (demo) yazar
  const uye = CETE_UYELER[Math.floor(Math.random() * CETE_UYELER.length)][0];
  sohbetEkran.yaziyor = uye; sohbetDurumCiz(1);
  clearTimeout(sohbetCevapZaman);
  sohbetCevapZaman = setTimeout(() => {
    sohbetEkran.yaziyor = null;
    if (!document.getElementById("tam-sohbet").classList.contains("aktif")) return;
    const cevap = o.kullanilan.length && Math.random() < .6 ? `Nice use of "${o.kullanilan[0]}"! 👏` : SOHBET_CEVAP[Math.floor(Math.random() * SOHBET_CEVAP.length)];
    d.sohbet.push({ kim: uye, metin: cevap, zaman: Date.now() }); kaydet(); Ses.pop(); sohbetCiz();
  }, 1400);
}
document.getElementById("sohbet-gonder").onclick = sohbetGonder;
// Dokunma alanı odağı girdiden almasın; kapatılmış klavyeyi programlı olarak yeniden açmayız.
document.getElementById('sohbet-gonder').addEventListener('pointerdown', e => {
  if (document.activeElement === document.getElementById('sohbet-girdi')) e.preventDefault();
});
document.getElementById("sohbet-girdi").onkeydown = e => { if (e.key === "Enter") sohbetGonder(); };
document.getElementById("sohbet-ac").onclick = () => { sohbetBaslik(false); document.getElementById("sohbet-girdi").disabled = document.getElementById("sohbet-gonder").disabled = false; sohbetEkran.sayi = 0; sohbetEkran.hata = null; tamAc("sohbet"); sohbetCiz(); };
document.getElementById("sohbet-yeni").onclick = sohbetAltaIn;
document.getElementById('sohbet-yeni').addEventListener('pointerdown', e => {
  if (document.activeElement === document.getElementById('sohbet-girdi')) e.preventDefault();
});
let sohbetAltta = true;
document.getElementById("sohbet-liste").addEventListener("scroll", e => {
  const l = e.currentTarget; sohbetAltta = Sohbet.alttaMi(l.scrollTop, l.scrollHeight, l.clientHeight);
  sohbetAltDugmeCiz();
});
["online", "offline"].forEach(o => window.addEventListener(o, () => { if (document.getElementById("tam-sohbet").classList.contains("aktif")) { if (CeteEkran.sohbet) gercekDurumCiz(); else sohbetDurumCiz(1); } }));
// Klavye: görünen alan küçülünce aradaki fark sohbet ekranının altına boşluk olur; gönderme alanı klavyenin üstünde kalır.
if (window.visualViewport) {
  const vv = window.visualViewport;
  const klavye = () => {
    // Resize olayı geldiğinde liste zaten küçülmüştür; önceki scroll durumunu koru.
    const l = document.getElementById("sohbet-liste"), altta = sohbetAltta;
    const bosluk = Sohbet.klavyeBoslugu(window.innerHeight, vv.height, vv.offsetTop);
    document.documentElement.style.setProperty("--klavye", bosluk + "px");
    // Klavye açıkken kural bandı ve öneri çipleri gizlenir; mesaj listesine yer kalsın.
    document.documentElement.classList.toggle("klavye-acik", bosluk > 80);
    if (altta) sohbetAltaIn(); else sohbetAltDugmeCiz();
  };
  vv.addEventListener("resize", klavye); vv.addEventListener("scroll", klavye);
}


Oturumlar.ekle('demo-sohbet', () => { clearTimeout(sohbetCevapZaman); }, undefined, undefined, 'sohbet');
