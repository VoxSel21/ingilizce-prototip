// ================= ÇETE (örnek veri) =================
const ARKADASLAR = [
  ["Ahmet", "#FF8A7A", 9, 145, "bugün 12 kart çalıştı"],
  ["Elif", "#5CC9A7", 21, 210, "yeni bir başarım kazandı 🎓"],
  ["Mert", "#6DB8EE", 2, 60, "bugün henüz girmedi"],
];
const tepkiler = {};
// Ortak görevler: üyelerin katkısı örnek veri, seninki gerçek. Hafta pazartesi başlar.
const haftaBasi = () => { const b = bugunNo(); return b - ((new Date().getDay() + 6) % 7); };
const haftaSay = obj => Object.keys(obj || {}).filter(g => +g >= haftaBasi() && +g <= bugunNo()).length;
const CETE_GOREVLER = [
  { id: "tanis", ikon: "🃏", ad: "Çetece 60 yeni kelimeyle tanışın", hedef: 60, odul: 2,
    uyeler: [["Ahmet", 18], ["Elif", 19], ["Mert", 4], ["Zeynep", 11]], sen: () => Object.entries(d.tanisGun || {}).filter(([g]) => +g >= haftaBasi() && +g <= bugunNo()).reduce((t, [, n]) => t + n, 0) },
  { id: "gun", ikon: "📅", ad: "Herkes bu hafta en az 3 gün çalışsın", hedef: 3, herkes: true, odul: 3,
    uyeler: [["Ahmet", 4], ["Elif", 3], ["Mert", 2], ["Zeynep", 3]], sen: () => haftaSay(d.gunler) },
  { id: "av", ikon: "🎣", ad: "Çetece 6 balık avına çıkın", hedef: 6, odul: 2,
    uyeler: [["Ahmet", 2], ["Elif", 2], ["Mert", 0], ["Zeynep", 1]], sen: () => haftaSay(d.avlar) },
];
function ceteDurum(g) {
  const sen = g.sen(), hepsi = g.uyeler.concat([["Sen", sen]]);
  if (g.herkes) { const tamam = hepsi.filter(u => u[1] >= g.hedef).length; return { hepsi, deger: tamam, hedef: hepsi.length, bitti: tamam === hepsi.length }; }
  const toplam = hepsi.reduce((s, u) => s + u[1], 0); return { hepsi, deger: Math.min(toplam, g.hedef), hedef: g.hedef, bitti: toplam >= g.hedef };
}
const ceteAnahtar = g => haftaBasi() + g.id;
function ceteHaftaTamam() { return CETE_GOREVLER.every(g => (d.ceteOdul || {})[ceteAnahtar(g)]); }
function ceteCiz() {
  d.ceteOdul = d.ceteOdul || {};
  document.getElementById("cete-gorevler").innerHTML = CETE_GOREVLER.map((g, i) => {
    const s = ceteDurum(g), alindi = d.ceteOdul[ceteAnahtar(g)];
    const uyeler = s.hepsi.map(u => `<span class="${g.herkes && u[1] >= g.hedef ? "tamam" : ""}">${u[0]} ${g.herkes ? u[1] + " gün" : "+" + u[1]}</span>`).join("");
    return `<div class="kart cete-gorev"><div class="g-ust"><span class="g-ikon">${g.ikon}</span><div><b>${g.ad}</b><small>${g.herkes ? s.deger + "/" + s.hedef + " kişi tamam" : s.deger + "/" + s.hedef}</small></div>
      <button class="al" data-cete="${i}" ${!s.bitti || alindi ? "disabled" : ""}>${alindi ? "Alındı ✓" : "🪙 " + g.odul}</button></div>
      <div class="cete-cubuk"><i style="width:${s.deger / s.hedef * 100}%"></i></div><div class="cete-uyeler">${uyeler}</div></div>`;
  }).join("") + `<div class="kart" style="background:var(--gunes-a);margin-bottom:10px;"><b style="font-weight:900;">🎁 Haftanın hepsi biterse</b>
      <p class="soluk" style="font-size:14px;margin-top:4px;">"Çete ruhu" başarımı (+5 🪙) ve yalnız çeteyle kazanılan 🧣 Çete bandanası (Kedi > Gardırop > Boyun).</p></div>`;
  document.querySelectorAll("[data-cete]").forEach(b => b.onclick = () => {
    const g = CETE_GOREVLER[+b.dataset.cete]; if (d.ceteOdul[ceteAnahtar(g)]) return;
    d.ceteOdul[ceteAnahtar(g)] = 1; Ekonomi.kazan(d, "cete:" + ceteAnahtar(g), g.odul, bugunNo()); kaydet(); Ses.altin(); konfeti(b, 8); bildir(`${g.ikon} Çete görevi bitti! +${g.odul} 🪙`); rozetKontrol(); herSeyiCiz();
  });
}
function arkadasCiz() {
  document.querySelectorAll("[data-sosyal]").forEach(b => b.classList.toggle("aktif", b.dataset.sosyal === sosyalBolum));
  document.getElementById("sosyal-arkadas").style.display = sosyalBolum === "arkadas" ? "" : "none";
  document.getElementById("sosyal-cete").style.display = sosyalBolum === "cete" ? "" : "none";
  ceteCiz(); ikiliCiz(); savasCiz();
  const sonMesaj = (d.sohbet && d.sohbet.length) ? d.sohbet[d.sohbet.length - 1] : { kim: SOHBET_ORNEK[SOHBET_ORNEK.length - 1][0], metin: SOHBET_ORNEK[SOHBET_ORNEK.length - 1][1] };
  document.getElementById("sohbet-son").textContent = `${sonMesaj.kim}: ${sonMesaj.metin}`;
  const sen = ["Sen", "#9F8BEA", seri(), d.bugun.sayi * 10 + d.cumleDogru * 15 + 80];
  const lig = ARKADASLAR.map(a => a.slice(0, 4)).concat([sen]).sort((a, b) => b[3] - a[3]);
  document.getElementById("lig").innerHTML = lig.map((a, i) => `<div class="arkadas ${a[0] === "Sen" ? "sen" : ""}"><span class="sira">${["🥇","🥈","🥉"][i] || i + 1}</span><div class="avatar" style="background:${a[1]};width:40px;height:40px;font-size:16px;">${a[0][0]}</div><div><b>${a[0]}</b><small>🔥 ${a[2]} gün</small></div><b>${a[3]} XP</b></div>`).join("");
  const bugun = bugunNo(); d.miyav = d.miyav || {};
  document.getElementById("arkadas-listesi").innerHTML = ARKADASLAR.map((a, i) => `<div class="kart arkadas-kart">
    <div class="arkadas"><div class="avatar" style="background:${a[1]}">${a[0][0]}</div><div><b>${a[0]}</b><small>${a[4]}</small></div></div>
    <div class="alt-satir">${["👏","🔥","💜"].map(t => `<button class="tepki ${tepkiler[i + t] ? "gonderildi" : ""}" data-t="${i}|${t}">${t}</button>`).join("")}
      <button class="miyav-dugme ${d.miyav[a[0]] === bugun ? "gonderildi" : ""}" data-miyav="${i}">${d.miyav[a[0]] === bugun ? "😺 Miyavlandı" : "🐱 Miyavla"}</button></div>
    ${(d.ikili || []).some(g => g.arkadas === a[0]) ? "" : `<button class="ikili-dugme" data-ikili="${i}">🤝 Birlikte görev</button>`}</div>`).join("");
  document.querySelectorAll("[data-ikili]").forEach(b => b.onclick = () => ikiliBaslat(+b.dataset.ikili));
  // Prototip: Elif sana miyavlamış gibi gösterilir
  const elifeDondun = d.miyav["Elif"] === bugun;
  document.getElementById("gelen-miyav").innerHTML = `<div class="kart gelen-miyav"><span class="g-ikon">😺</span>
    <div><b>Elif sana miyavladı!</b><small>"Hadi kelime zamanı 🐾" · 1 saat önce</small></div>
    <button class="miyav-dugme ${elifeDondun ? "gonderildi" : ""}" style="flex:none;padding:0 14px;" data-miyav="1">${elifeDondun ? "😺 Döndün" : "Geri miyavla"}</button></div>`;
  document.querySelectorAll("[data-miyav]").forEach(b => b.onclick = () => miyavla(+b.dataset.miyav, b));
  document.querySelectorAll("[data-t]").forEach(b => b.onclick = () => {
    const [i, t] = b.dataset.t.split("|");
    if (tepkiler[i + t]) return;
    tepkiler[i + t] = 1; d.tepki++; kaydet(); konfeti(b, 5); bildir(`${ARKADASLAR[i][0]}'e ${t} gönderildi`); rozetKontrol(); arkadasCiz();
  });
}
// Miyavlama: arkadaşa "hadi çalış" dürtmesi. Spam olmasın diye her arkadaşa günde bir kez.
let tbZaman;
function miyavla(i, b) {
  const a = ARKADASLAR[i], bugun = bugunNo(); d.miyav = d.miyav || {};
  if (d.miyav[a[0]] === bugun) { bildir(`Bugün ${a[0]}'e zaten miyavladın, yarın yine 🐾`); return; }
  d.miyav[a[0]] = bugun; d.tepki++; kaydet(); rozetKontrol(); konfeti(b, 6);
  Ses.miyav();
  const tb = document.getElementById("telefon-bildirim");
  tb.innerHTML = `<span class="b-ikon">🐱</span><div><b>${d.kediAd} sana miyavladı!</b><small>İngilizce Kedi · şimdi</small><p>Hadi, bugünkü kelimelerin seni bekliyor 🐾</p></div><span class="kimde">${a[0]}'in telefonunda böyle görünecek</span>`;
  tb.classList.add("acik"); clearTimeout(tbZaman); tbZaman = setTimeout(() => tb.classList.remove("acik"), 3200);
  arkadasCiz();
}
document.getElementById("ekle-dugme").onclick = () => pencere("🐾", sosyalBolum === "cete" ? "Çeteye kat" : "Arkadaş ekle", sosyalBolum === "cete" ? "Gerçek uygulamada arkadaşın bu kodla çetene katılacak. Çete kodun: <b style='color:#6B55C9'>KUZU-4821</b>" : "Gerçek uygulamada arkadaşının kullanıcı adını ya da davet kodunu yazacaksın. Senin kodun: <b style='color:#6B55C9'>PATI-1907</b>", "Tamam");

// ================= SOSYAL: bölümler =================
let sosyalBolum = "arkadas";
document.querySelectorAll("[data-sosyal]").forEach(b => b.onclick = () => { sosyalBolum = b.dataset.sosyal; Ses.pop(); arkadasCiz(); });

// ================= BİRLİKTE GÖREVLER (arkadaşla ikili) =================
// Seçilen arkadaşla ortak hedef. Senin ilerlemen gerçek, arkadaşınki örnek (gün geçtikçe ilerler).
const IKILI_SABLON = [
  { id: "gun3", ikon: "📅", ad: "3 gün boyunca ikiniz de çalışın", hedef: 3, odul: 3, birim: "gün",
    sen: g => Object.keys(d.gunler).filter(x => +x >= g.bas).length },
  { id: "kelime20", ikon: "🌱", ad: "20 yeni kelimeyle tanışın", hedef: 20, odul: 2, birim: "kelime",
    sen: g => Math.max(0, Object.keys(d.kartlar).length - g.basKelime) },
  { id: "cumle5", ikon: "🧩", ad: "5 cümleyi doğru kurun", hedef: 5, odul: 2, birim: "cümle",
    sen: g => Math.max(0, d.cumleDogru - g.basCumle) },
];
function ikiliArkadasIlerleme(g, sablon) {
  // Örnek veri: arkadaş her gün hedefin yaklaşık üçte birini yapar (Mert daha yavaş)
  const gecen = bugunNo() - g.bas + 1, hiz = g.arkadas === "Mert" ? .25 : .4;
  return Math.min(sablon.hedef, Math.floor(sablon.hedef * hiz * gecen));
}
function ikiliCiz() {
  d.ikili = d.ikili || [];
  const el = document.getElementById("ikili-gorevler");
  if (!d.ikili.length) { el.innerHTML = `<div class="kart ikili-kart"><p class="soluk" style="font-size:14px;">Henüz birlikte görevin yok. Aşağıdan bir arkadaşının kartında "🤝 Birlikte görev"e dokun.</p></div>`; return; }
  el.innerHTML = d.ikili.map((g, i) => {
    const sb = IKILI_SABLON.find(x => x.id === g.sablon), sen = Math.min(sb.hedef, sb.sen(g)), o = ikiliArkadasIlerleme(g, sb);
    const bitti = sen >= sb.hedef && o >= sb.hedef;
    return `<div class="kart ikili-kart"><div class="g-ust"><span style="font-size:28px">${sb.ikon}</span><div><b>${g.arkadas} ile: ${sb.ad}</b><small>Ödül: ikinize de ${sb.odul} 🪙</small></div></div>
      <div class="ikili-satir"><span>Sen</span><div class="cete-cubuk"><i style="width:${sen / sb.hedef * 100}%"></i></div>${sen}/${sb.hedef}</div>
      <div class="ikili-satir"><span>${g.arkadas}</span><div class="cete-cubuk"><i style="width:${o / sb.hedef * 100}%"></i></div>${o}/${sb.hedef}</div>
      ${bitti ? `<button class="ikili-dugme" data-ikili-al="${i}">🎉 Ödülü al (+${sb.odul} 🪙)</button>` : ""}</div>`;
  }).join("");
  document.querySelectorAll("[data-ikili-al]").forEach(b => b.onclick = () => {
    b.onclick = null; // çift dokunma başka görevin ödülünü almasın
    const g = d.ikili[+b.dataset.ikiliAl], sb = g && IKILI_SABLON.find(x => x.id === g.sablon); if (!sb) return;
    Ekonomi.kazan(d, `ikili:${g.sablon}:${g.arkadas}:${g.bas}`, sb.odul, bugunNo()); d.ikiliBiten = (d.ikiliBiten || 0) + 1; d.ikili.splice(+b.dataset.ikiliAl, 1);
    kaydet(); Ses.zafer(); konfeti(b, 12); bildir(`🤝 ${g.arkadas} ile görev bitti! +${sb.odul} 🪙`); rozetKontrol(); herSeyiCiz();
  });
}
function ikiliBaslat(i) {
  const a = ARKADASLAR[i];
  if ((d.ikili || []).some(g => g.arkadas === a[0])) { bildir(`${a[0]} ile zaten bir görevin var`); return; }
  const p = document.getElementById("pencere");
  p.innerHTML = `<div class="p-ikon">🤝</div><h3>${a[0]} ile ne yapalım?</h3><p>Görevi seç, ${a[0]}'e davet gider.</p>
    <div class="sablon-sec">${IKILI_SABLON.map(sb => `<button data-sablon="${sb.id}"><span style="font-size:24px">${sb.ikon}</span><span>${sb.ad}<br><small class="soluk">İkinize de ${sb.odul} 🪙</small></span></button>`).join("")}</div>
    <button class="buyuk-dugme" id="p-dugme" style="margin-top:12px;background:var(--krem);color:var(--murekkep);box-shadow:none;">Vazgeç</button>`;
  document.getElementById("perde").classList.add("aktif");
  document.getElementById("p-dugme").onclick = () => document.getElementById("perde").classList.remove("aktif");
  p.querySelectorAll("[data-sablon]").forEach(b => b.onclick = () => {
    d.ikili = d.ikili || [];
    d.ikili.push({ arkadas: a[0], sablon: b.dataset.sablon, bas: bugunNo(), basKelime: Object.keys(d.kartlar).length, basCumle: d.cumleDogru });
    kaydet(); Ses.pop(); document.getElementById("perde").classList.remove("aktif");
    bildir(`🤝 ${a[0]} daveti kabul etti!`); herSeyiCiz();
  });
}

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
function sohbetMesajEl(kim, metin, ben, n) {
  const el = document.createElement("div"); el.className = "mesaj" + (ben ? " ben" : "");
  if (!ben) {
    const k = document.createElement("span"); k.className = "kim"; k.textContent = kim;
    k.style.color = (CETE_UYELER.find(u => u[0] === kim) || [, "#9F8BEA"])[1];
    const b = document.createElement("button"); b.className = "bildir"; b.dataset.bildir = n; b.setAttribute("aria-label", "Bildir"); b.textContent = "🚩";
    el.append(k, b, document.createTextNode(metin));
    return el;
  }
  const o = ogrenilenleriIsaretle(metin);
  for (const p of o.parcalar) {
    if (!p.isaretli) { el.append(document.createTextNode(p.metin)); continue; }
    const m = document.createElement("mark"); m.textContent = p.metin; el.append(m);
  }
  if (o.kullanilan.length) { const s = document.createElement("span"); s.className = "ogrendi"; s.textContent = `✓ Öğrendiğin ${o.kullanilan.length} kelimeyi kullandın`; el.append(s); }
  return el;
}
function sohbetCiz() {
  d.sohbet = d.sohbet || [];
  const liste = document.getElementById("sohbet-liste");
  const ogeler = SOHBET_ORNEK.map(([kim, m], n) => bildirilen.has("o" + n) ? null : sohbetMesajEl(kim, m, false, "o" + n));
  const bas = Math.max(0, d.sohbet.length - 30);
  d.sohbet.slice(bas).forEach((m, n) => { if (!bildirilen.has("s" + (bas + n))) ogeler.push(sohbetMesajEl(m.kim, m.metin, m.kim === "Sen", "s" + (bas + n))); });
  liste.replaceChildren(...ogeler.filter(Boolean)); liste.scrollTop = liste.scrollHeight;
  liste.querySelectorAll("[data-bildir]").forEach(b => b.onclick = () => {
    bildirilen.add(b.dataset.bildir); Ses.pop(); bildir("🚩 Bildirildi. Moderatör inceleyecek, mesaj senden gizlendi."); sohbetCiz();
  });
  // Öneri çipleri: son öğrendiğin kelimelerden
  const son = KELIMELER.filter(k => d.kartlar[k[0]]).slice(-6).map(k => k[0]);
  document.getElementById("sohbet-oneri").innerHTML = (son.length ? son : ["hello", "today", "study"]).map(w => `<button data-oner="${w}">${w}</button>`).join("");
  document.querySelectorAll("[data-oner]").forEach(b => b.onclick = () => { const g = document.getElementById("sohbet-girdi"); g.value = (g.value + " " + b.dataset.oner).trim() + " "; g.focus(); });
}
function sohbetGonder() {
  const g = document.getElementById("sohbet-girdi"), metin = g.value.trim();
  if (!metin) return;
  const kucuk = metin.toLocaleLowerCase("tr");
  if (YASAKLI.some(y => y.test(kucuk))) { Ses.yanlis(); pencere("🙀", "Bu mesaj gönderilemedi", "Çete'de nazik dil kuralı var. Başka türlü söylemeyi dene.", "Tamam"); return; }
  if (/[çğıöşüÇĞİÖŞÜ]/.test(metin)) { Ses.yanlis(); bildir("🇬🇧 Çete sohbeti İngilizce. Öneri çiplerindeki kelimelerle dene!"); return; }
  const o = ogrenilenleriIsaretle(metin);
  d.sohbet = d.sohbet || []; d.sohbet.push({ kim: "Sen", metin: metin.replace(/[<>]/g, "") });
  let odul = 0;
  if (o.kullanilan.length) { odul = Ekonomi.kazan(d, "sohbet:" + bugunNo(), EKONOMI.odul.sohbet.miktar, bugunNo()); if (odul) d.sohbetOdulGunu = bugunNo(); }
  kaydet(); // sohbete yazmak çalışma günü saymaz (js/ilerleme.js kuralı) Ses.pop(); g.value = ""; sohbetCiz();
  if (odul) { Ses.altin(); bildir(`✨ Öğrendiğin kelimeyi gerçek sohbette kullandın! +1 🪙 (günde bir kez)`); }
  // Örnek cevap: bir çete üyesi yazar
  setTimeout(() => {
    if (!document.getElementById("tam-sohbet").classList.contains("aktif")) return;
    const uye = CETE_UYELER[Math.floor(Math.random() * CETE_UYELER.length)][0];
    const cevap = o.kullanilan.length && Math.random() < .6 ? `Nice use of "${o.kullanilan[0]}"! 👏` : SOHBET_CEVAP[Math.floor(Math.random() * SOHBET_CEVAP.length)];
    d.sohbet.push({ kim: uye, metin: cevap }); kaydet(); Ses.pop(); sohbetCiz();
  }, 1400);
}
document.getElementById("sohbet-gonder").onclick = sohbetGonder;
document.getElementById("sohbet-girdi").onkeydown = e => { if (e.key === "Enter") sohbetGonder(); };
document.getElementById("sohbet-ac").onclick = () => { sohbetCiz(); tamAc("sohbet"); };

// ================= ÇETE SAVAŞI =================
// Haftalık, eş zamansız: her üye 4 moddan puan toplar; modda en iyi puanın çeteye yazılır.
// Rakip ve üyelerin puanı örnek veri. "Savaş" bir oyun modu adı: hepsi dil pratiği.
const SAVAS_MODLAR = [
  { id: "hiz", ikon: "⚡", ad: "Kelime Yarışı", acik: "45 sn, en çok doğru", ac: () => savasHizliAc("hiz") },
  { id: "dinle", ikon: "🎧", ad: "Kulak Kabart", acik: "Duy, doğru yazılışı seç", ac: () => savasHizliAc("dinle") },
  { id: "cumle", ikon: "🧩", ad: "Cümle Düellosu", acik: "5 cümle, her doğru 30", ac: () => { cSavas = true; cumleAc(); } },
  { id: "esles", ikon: "🐾", ad: "Pati Çabukluğu", acik: "Ne kadar hızlı, o kadar puan", ac: () => eslesAc(true) },
];
const SAVAS_UYE_PUAN = [["Ahmet", 420], ["Elif", 510], ["Mert", 180], ["Zeynep", 350]];
function savasDurum() {
  if (!d.savas || d.savas.hafta !== haftaBasi()) d.savas = { hafta: haftaBasi(), en: {} };
  const gun = bugunNo() - haftaBasi(); // 0 = pazartesi
  const benim = Object.values(d.savas.en).reduce((a, b) => a + b, 0);
  const biz = SAVAS_UYE_PUAN.reduce((a, u) => a + Math.round(u[1] * (0.4 + gun * 0.1)), 0) + benim;
  const rakip = 1200 + gun * 130;
  return { gun, benim, biz, rakip, kalan: 6 - gun };
}
function savasCiz() {
  const s = savasDurum(), oran = s.biz / (s.biz + s.rakip) * 100;
  document.getElementById("savas-kart").innerHTML = `<div class="kart">
    <div class="savas-skor"><div class="taraf">🐾 Patiler<b>${s.biz}</b></div><span>VS</span><div class="taraf">🦊 Tilkiler<b>${s.rakip}</b></div></div>
    <div class="savas-cubuk"><i style="width:${oran}%"></i></div>
    <p class="soluk" style="font-size:13px;text-align:center;">${s.biz >= s.rakip ? "Öndeyiz! 🎉" : `${s.rakip - s.biz} puan gerideyiz`} · ${s.kalan > 0 ? `${s.kalan} gün kaldı` : "son gün!"} · Senin katkın: ${s.benim}</p>
    <div class="savas-modlar">${SAVAS_MODLAR.map((m, i) => `<button data-mod="${i}"><span class="m-ikon">${m.ikon}</span><b>${m.ad}</b><small>${d.savas.en[m.id] ? "En iyin: " + d.savas.en[m.id] : m.acik}</small></button>`).join("")}</div>
    <p class="soluk" style="font-size:12px;margin-top:8px;">Her modda en iyi puanın çetene yazılır. Hafta sonunda kazanan çeteye ödül.</p></div>`;
  document.querySelectorAll("[data-mod]").forEach(b => b.onclick = () => SAVAS_MODLAR[+b.dataset.mod].ac());
}
function savasSonuc(mod, puan) {
  savasDurum();
  const m = SAVAS_MODLAR.find(x => x.id === mod), eski = d.savas.en[mod] || 0, rekor = puan > eski;
  if (rekor) d.savas.en[mod] = puan;
  gunIsaretle(); kaydet(); rozetKontrol();
  rekor ? Ses.zafer() : Ses.dogru();
  tamKapat();
  pencere(m.ikon, rekor ? "Yeni en iyi puan!" : `${m.ad} bitti`, `${puan} puan. ${rekor ? `Çetene ${puan - eski} puan eklendi ⚔️` : `En iyin ${eski}; çeteye en iyi puanın sayılır.`}`, "Tamam");
}
// Hızlı modlar: Kelime Yarışı (İngilizce → Türkçe) ve Kulak Kabart (duy → doğru yazılış)
let sv = null;
function savasKelimeleri() {
  const tanis = karistir(KELIMELER.filter(k => d.kartlar[k[0]]));
  return tanis.concat(karistir(KELIMELER.filter(k => !d.kartlar[k[0]] && k[5] === d.seviye))).slice(0, 30);
}
function savasHizliAc(mod) {
  sv = { mod, kelimeler: savasKelimeleri(), i: 0, puan: 0, dogru: 0, sure: mod === "hiz" ? 45 : 60, bas: performance.now(), kilit: false, bitti: false };
  if (mod === "dinle") sv.kelimeler = sv.kelimeler.slice(0, 8);
  document.getElementById("sv-yon").textContent = mod === "hiz" ? "Türkçesi ne? (her doğru 10)" : "Dinle, doğru yazılışı seç (her doğru 15)";
  tamAc("savas"); savasSoru();
  const oyun = sv;
  const t = setInterval(() => {
    if (sv !== oyun || sv.bitti) return clearInterval(t);
    const kalan = Math.max(0, sv.sure - (performance.now() - sv.bas) / 1000);
    document.getElementById("sv-sure").textContent = Math.ceil(kalan);
    document.getElementById("sv-cubuk").style.width = (kalan / sv.sure * 100) + "%";
    if (kalan <= 0) savasHizliBitir();
  }, 100);
}
function savasSoru() {
  if (sv.i >= sv.kelimeler.length) return savasHizliBitir();
  const k = sv.kelimeler[sv.i];
  let siklar, dogru;
  if (sv.mod === "hiz") {
    document.getElementById("sv-soru").textContent = k[0];
    dogru = k[1]; siklar = [k[1], ...karistir(KELIMELER.filter(x => x[1] !== k[1])).slice(0, 3).map(x => x[1])];
  } else {
    document.getElementById("sv-soru").innerHTML = `<button class="dinle-dugme" id="sv-ses" style="margin:4px auto 0;">🔊</button>`;
    document.getElementById("sv-ses").onclick = () => seslendir(k[0]);
    setTimeout(() => seslendir(k[0]), 200);
    // Çeldiriciler: benzer uzunlukta, aynı harfle başlayan kelimeler (duyulana benzesin)
    const benzer = KELIMELER.filter(x => x[0] !== k[0] && !x[0].includes(" ") && (x[0][0] === k[0][0] || Math.abs(x[0].length - k[0].length) <= 1));
    dogru = k[0]; siklar = [k[0], ...karistir(benzer).slice(0, 3).map(x => x[0])];
  }
  document.getElementById("sv-siklar").innerHTML = karistir(siklar).map(x => `<button class="av-sik">${x}</button>`).join("");
  sv.kilit = false;
  document.querySelectorAll("#sv-siklar .av-sik").forEach(b => b.onclick = () => {
    if (sv.kilit || sv.bitti) return; sv.kilit = true;
    const ok = b.textContent === dogru;
    b.classList.add(ok ? "dogru" : "yanlis");
    if (!ok) document.querySelectorAll("#sv-siklar .av-sik").forEach(x => { if (x.textContent === dogru) x.classList.add("dogru"); });
    if (ok) { sv.dogru++; sv.puan += sv.mod === "hiz" ? 10 : 15; Ses.dogru(); } else Ses.yanlis();
    document.getElementById("sv-puan").textContent = `⚔️ ${sv.puan} puan`;
    const oyun = sv; setTimeout(() => { if (sv !== oyun || oyun.bitti) return; sv.i++; savasSoru(); }, ok ? 250 : 700);
  });
}
function savasHizliBitir() {
  if (!sv || sv.bitti) return; sv.bitti = true;
  const mod = sv.mod, puan = sv.puan; sv = null;
  savasSonuc(mod, puan);
}

