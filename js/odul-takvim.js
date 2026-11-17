// ================= PENCERELER / ÖDÜL =================
function pencere(ikon, baslik, yazi, dugme, sonra) {
  const p = document.getElementById("pencere");
  delete p.dataset.avGiris;
  p.innerHTML = `<div class="p-ikon">${patiPencereGorseli(ikon)}</div><h3>${baslik}</h3><p>${yazi}</p><button class="buyuk-dugme" id="p-dugme">${dugme}</button>`;
  document.getElementById("perde").classList.add("aktif");
  document.getElementById("p-dugme").onclick = () => { document.getElementById("perde").classList.remove("aktif"); sonra && sonra(); herSeyiCiz(); };
  document.getElementById("p-dugme").focus();
}
function bitisPenceresi() {
  if (d.bugun.sayi >= gunlukHedef() && !d.bugun.hediye) hediyePenceresi();
  else pencere("🃏", "Tur bitti!", `Bugün ${d.bugun.sayi} kart çalıştın.`, "Tamam");
}
function hediyeHazirsaAc() {
  if (d.bugun.sayi >= gunlukHedef() && !d.bugun.hediye) hediyePenceresi();
}
function hediyePenceresi() {
  const p = document.getElementById("pencere");
  Ses.zafer();
  p.innerHTML = `<button class="p-ikon hediye" id="hediye" aria-label="Günlük hediyeyi aç">${patiPencereGorseli("🎁")}</button><h3>Günlük hedef tamam!</h3><p>Hediyeni açmak için kutuya dokun.</p>`;
  document.getElementById("perde").classList.add("aktif");
  setTimeout(() => document.getElementById("hediye").focus(), 60);
  document.getElementById("hediye").onclick = e => {
    // Hızlı ikinci dokunuş ödülü ikinci kez vermesin: önce kilitle, sonra öde.
    e.currentTarget.onclick = null;
    gunuYenile();
    if (d.bugun.hediye) return;
    // Pencere açıkken gece yarısı geçtiyse yeni günün hedefi henüz dolmamıştır: hediye verilmez.
    if (d.bugun.sayi < gunlukHedef()) return pencere("🌙", "Yeni gün başladı", "Bugünkü hedefi tamamlayınca hediyen seni bekliyor.", "Tamam");
    // Ödeme anında gün + hedef + tekil ödeme (defter anahtarı "hediye:<gün>") birlikte kontrol edilir.
    const h = EKONOMI.odul.gunlukHediye, kazanc = Ekonomi.kazan(d, "hediye:" + bugunNo(), h.taban + (Math.random() < h.bonusOlasilik ? h.bonus : 0), bugunNo());
    d.bugun.hediye = true; if (!kazanc) return kaydet(); kaydet(); konfeti(e.target, 16); Ses.altin();
    setTimeout(() => pencere("🪙", `+${kazanc} altın!`, `Serin ${seri()} gün oldu 🔥 ${sonrakiTekrarYazi()}`, "Süper"), 350);
  };
}
function konfeti(el, n) {
  const kok = document.getElementById("uygulama").getBoundingClientRect(), r = el.getBoundingClientRect();
  const parca = ["⭐", "✨", "💜", "🌸", "🎉"];
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span"); s.className = "konfeti"; s.textContent = parca[i % parca.length];
    s.style.left = (r.left - kok.left + r.width / 2) + "px"; s.style.top = (r.top - kok.top + r.height / 2) + "px";
    s.style.setProperty("--x", (Math.random() * 240 - 120) + "px"); s.style.setProperty("--y", (Math.random() * -220 - 30) + "px"); s.style.setProperty("--r", (Math.random() * 360) + "deg");
    document.getElementById("uygulama").appendChild(s); setTimeout(() => s.remove(), 1000);
  }
}
let bildirimZaman;
// Bildirim şeridi emojisiz (C arayüzü, 2026-11-17): "+1 🪙" → "+1 altın", kalan emojiler düşer.
function bildirimMetni(m) { return String(m).replace(/(\+?\d+)\s*🪙/gu, "$1 altın").replace(/[\p{Extended_Pictographic}\u{2691}\u{FE0F}\u{200D}]/gu, "").replace(/\s+([!?.,)])/g, "$1").replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ").trim(); }
function bildir(m) { const b = document.getElementById("bildirim"); b.textContent = bildirimMetni(m); b.classList.add("acik"); clearTimeout(bildirimZaman); bildirimZaman = setTimeout(() => b.classList.remove("acik"), 2400); }

// ================= BAŞARIMLAR =================
const ROZETLER = [
  ["farkli50", "📖", "Kelime gezgini", "50 farklı kelime veya ifadeyi çalış", () => Ilerleme.calisilanSayisi(d) >= 50, EKONOMI.basarim.farkli50],
  ["farkli100", "🗺️", "Kelime kaşifi", "100 farklı kelime veya ifadeyi çalış", () => Ilerleme.calisilanSayisi(d) >= 100, EKONOMI.basarim.farkli100],
  ["ifade10", "💬", "İfade dostu", "10 farklı phrasal verb çalış", () => PHRASAL.filter(k => d.calisilanlar[k[0]] || d.kartlar[k[0]]).length >= 10, EKONOMI.basarim.ifade10],
  ["gun7", "🗓️", "Düzenli adımlar", "Toplam 7 farklı gün çalış", () => Object.keys(d.gunler).length >= 7, EKONOMI.basarim.gun7],
  ["ilk", "🌱", "İlk adım", "İlk kartını çalış", () => Object.keys(d.kartlar).length >= 1, EKONOMI.basarim.ilk],
  ["on", "📚", "10 kelime", "10 kelimeyi çalışılıyor aşamasına (2. kutu) taşı", () => durumdaSay(KELIMELER, "calisiliyor") + durumdaSay(KELIMELER, "ogrenildi") >= 10, EKONOMI.basarim.on],
  ["hedef", "🎯", "Hedefçi", "Bir günlük hedefi bitir", () => d.bugun.hediye || d.bugun.sayi >= gunlukHedef(), EKONOMI.basarim.hedef],
  ["seri5", "🔥", "Ateşli", "5 günlük seriye ulaş", () => seri() >= 5, EKONOMI.basarim.seri5],
  ["seri30", "🌋", "Yanardağ", "30 günlük seriye ulaş", () => seri() >= 30, EKONOMI.basarim.seri30],
  ["cumle", "🧩", "Cümle ustası", "5 cümleyi doğru kur", () => d.cumleDogru >= 5, EKONOMI.basarim.cumle],
  ["ogrendi", "🎓", "Usta", "Bir kelimeyi 4. kutuya taşı (pekişti)", () => durumdaSay(KELIMELER, "ogrenildi") > 0, EKONOMI.basarim.ogrendi],
  ["sosyal", "💌", "Neşe kaynağı", "Arkadaşına tepki gönder", () => d.tepki >= 1, EKONOMI.basarim.sosyal],
  ["cete", "🐾", "Çete ruhu", "Bir haftanın tüm ortak görevlerini bitir", () => ceteHaftaTamam(), EKONOMI.basarim.cete],
  ["ikili", "🤝", "Takım oyuncusu", "Bir arkadaşınla birlikte görev bitir", () => (d.ikiliBiten || 0) >= 1, EKONOMI.basarim.ikili],
  ["savas", "⚔️", "Çete savaşçısı", "Bir haftada savaşın 4 modunu da oyna", () => d.savas && Object.keys(d.savas.en).length >= 4, EKONOMI.basarim.savas],
  ["tema", "🎨", "Dekoratör", "Kedine bir eşya al", () => d.esyalar.length > 0, EKONOMI.basarim.tema],
];
function rozetKontrol() {
  ROZETLER.forEach(([id, ikon, ad, , kosul, odul]) => {
    if (!d.rozet[id] && kosul()) { d.rozet[id] = 1; Ekonomi.kazan(d, "rozet:" + id, odul, bugunNo()); kaydet(); setTimeout(() => { bildir(`${ikon} Başarım: ${ad} (+${odul} 🪙)`); Ses.zafer(); }, 500); }
  });
}
function odulCiz() {
  // C görünümü (2026-11-16): ödül emoji yerine "N altın" yazısıyla; kazanılanda onay ikonu.
  document.getElementById("rozetler").innerHTML = ROZETLER.map(([id, ikon, ad, acik, , odul]) => d.rozet[id]
    ? `<div class="rozet"><div class="r-ikon" aria-hidden="true">${ikon}</div><b>${ad}</b><small class="r-durum">${patiIkon("check")}Kazanıldı</small></div>`
    : `<div class="rozet kilitli"><div class="r-ikon" aria-hidden="true">${ikon}</div><b>${ad}</b><small>${acik}</small><span class="r-odul">${odul} altın</span></div>`).join("");
  const acilan = ROZETLER.filter(r => d.rozet[r[0]]), kazanc = acilan.reduce((t, r) => t + r[5], 0);
  const yaz = (i, v) => { const e = document.getElementById(i); if (e) e.textContent = v; };
  yaz("odul-acilan", acilan.length); yaz("odul-toplam", ROZETLER.length);
  yaz("odul-kazanc", kazanc ? `Başarımlardan ${kazanc} altın kazandın` : "İlk başarımın bir kart uzağında");
  const cubuk = document.getElementById("odul-cubuk"); if (cubuk) cubuk.style.width = Math.round(acilan.length / ROZETLER.length * 100) + "%";
  if (typeof kediGuncelle === "function") kediGuncelle(document.getElementById("odul-kedi"), KediCizici.gorunum());
}
function koruyucuSatisCiz() {
  document.getElementById("koruyucu-satis").innerHTML = `<div class="menu-koruyucu"><span>🧊</span><div><b>Seri koruyucu</b><small>Elinde ${d.koruyucu} · bir günü korur</small></div><button class="al" data-al="koruyucu" ${d.yildiz < EKONOMI.fiyat.koruyucu ? "disabled" : ""}>${EKONOMI.fiyat.koruyucu} 🪙</button></div>`;
  document.querySelector('[data-al="koruyucu"]').onclick = () => { if (!Ekonomi.koruyucuAl(d, EKONOMI.fiyat.koruyucu)) { Ses.yanlis(); return bildir("🪙 Altın yetmiyor"); } kaydet(); Ses.altin(); bildir("🧊 Seri koruyucu alındı"); herSeyiCiz(); };
}

// ================= TAKVİM =================
// Sadece içinde bulunulan ay gösterilir (Serhat, 2026-10-18)
const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const AY_EMOJI = ["❄️","⛄","🌱","🌷","🌸","☀️","🍉","🏖️","🍎","🍂","🍁","🎄"];
const GUN_RENK = [["#FF8A7A","#FFB38A"], ["#FFC94D","#FFDF8A"], ["#5CC9A7","#8FE0C4"], ["#6DB8EE","#9FD2F7"], ["#9F8BEA","#C3B4F5"]];
function takvimCiz() {
  koruyucuSatisCiz();
  // Hap eskiden yalnız anaCiz'de güncelleniyordu: Takvim'de koruyucu alınınca eski sayı kalıyordu.
  document.getElementById("koruyucu-hap").textContent = "🧊 " + d.koruyucu;
  const simdi = new Date(), ay = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
  document.getElementById("ay-adi").textContent = AYLAR[ay.getMonth()] + " " + ay.getFullYear();
  document.getElementById("ay-emoji").textContent = AY_EMOJI[ay.getMonth()];
  let h = ["Pt","Sa","Ça","Pe","Cu","Ct","Pz"].map((g, i) => `<div class="bas ${i > 4 ? "hafta-sonu" : ""}">${g}</div>`).join("");
  const bas = (ay.getDay() + 6) % 7, gunSayi = new Date(ay.getFullYear(), ay.getMonth() + 1, 0).getDate();
  document.getElementById("gunler").style.setProperty('--takvim-hafta', Math.ceil((bas + gunSayi) / 7));
  for (let i = 0; i < bas; i++) h += "<div></div>";
  let calisilan = 0, renkSira = 0;
  for (let g = 1; g <= gunSayi; g++) {
    const t = new Date(ay.getFullYear(), ay.getMonth(), g);
    const no = Math.floor((t.getTime() - t.getTimezoneOffset() * 60000) / GUN_MS);
    let cls = "", stil = "", icerik = g;
    if (d.gunler[no]) { calisilan++; const r = GUN_RENK[renkSira++ % GUN_RENK.length]; cls = "calisti"; stil = `background:linear-gradient(135deg,${r[0]},${r[1]});animation-delay:${renkSira * .04}s`; }
    else if (d.korunan[no]) { cls = "korundu"; icerik = "🧊"; }
    else if (no > bugunNo()) cls = "gelecek";
    else if (no < bugunNo()) cls = "gecti";
    h += `<div class="gun ${cls} ${no === bugunNo() ? "bugun" : ""}" style="${stil}">${icerik}</div>`;
  }
  document.getElementById("gunler").innerHTML = h;
  const gecen = simdi.getDate();
  document.getElementById("ay-ozet").textContent = calisilan ? `Bu ay ${calisilan} gün çalıştın ${calisilan >= gecen * .7 ? "🌟" : "💪"}` : "Bu ayın ilk gününü işaretle!";
  document.getElementById("ay-cubuk").style.width = Math.round(calisilan / gunSayi * 100) + "%";
  // Seri, en uzun seri ve gün sayısı tek özetten (js/ilerleme.js): korunan gün seriyi kesmez, çalışılmış gün sayılmaz.
  const oz = seriOzet();
  document.getElementById("i-seri").textContent = oz.seri;
  document.getElementById("i-enuzun").textContent = oz.enUzun;
  // Takvim'in üstündeki Pati penceresinin yanındaki seri (C görünümü, 2026-11-16)
  document.getElementById("takvim-seri").textContent = oz.seri;
  document.getElementById("takvim-enuzun").textContent = oz.enUzun;
  const kelimeSayisi = KELIMELER.filter(k => d.kartlar[k[0]] || d.calisilanlar?.[k[0]]).length;
  document.getElementById("i-ogrenilen").textContent = kelimeSayisi;
  document.getElementById("i-ogrenilen-not").textContent = `${kelimeSayisi} kelime çalışıldı · ${durumdaSay(KELIMELER, "calisiliyor")} tekrar edildi · ${durumdaSay(KELIMELER, "ogrenildi")} pekişti. Tekrarlarla ilerler.`;
  document.getElementById("i-gun").textContent = oz.calisilanGun;
}


