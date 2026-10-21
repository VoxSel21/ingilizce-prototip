// ================= PENCERELER / ÖDÜL =================
function pencere(ikon, baslik, yazi, dugme, sonra) {
  const p = document.getElementById("pencere");
  p.innerHTML = `<div class="p-ikon">${ikon}</div><h3>${baslik}</h3><p>${yazi}</p><button class="buyuk-dugme" id="p-dugme">${dugme}</button>`;
  document.getElementById("perde").classList.add("aktif");
  document.getElementById("p-dugme").onclick = () => { document.getElementById("perde").classList.remove("aktif"); sonra && sonra(); herSeyiCiz(); };
}
function bitisPenceresi() {
  if (d.bugun.sayi >= 10 && !d.bugun.hediye) hediyePenceresi();
  else pencere("🃏", "Tur bitti!", `Bugün ${d.bugun.sayi} kart çalıştın.`, "Tamam");
}
function hediyePenceresi() {
  const p = document.getElementById("pencere");
  Ses.zafer();
  p.innerHTML = `<button class="p-ikon hediye" id="hediye" aria-label="Günlük hediyeyi aç">🎁</button><h3>Günlük hedef tamam!</h3><p>Hediyeni açmak için kutuya dokun.</p>`;
  document.getElementById("perde").classList.add("aktif");
  setTimeout(() => document.getElementById("hediye").focus(), 60);
  document.getElementById("hediye").onclick = e => {
    // Hızlı ikinci dokunuş ödülü ikinci kez vermesin: önce kilitle, sonra öde.
    e.currentTarget.onclick = null;
    gunuYenile();
    if (d.bugun.hediye) return;
    const kazanc = 2 + (Math.random() < .3 ? 1 : 0);
    d.yildiz += kazanc; d.bugun.hediye = true; kaydet(); konfeti(e.target, 16); Ses.altin();
    setTimeout(() => pencere("🪙", `+${kazanc} altın!`, `Serin ${seri()} gün oldu 🔥 Yarın yine bekleriz.`, "Süper"), 350);
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
function bildir(m) { const b = document.getElementById("bildirim"); b.textContent = m; b.classList.add("acik"); clearTimeout(bildirimZaman); bildirimZaman = setTimeout(() => b.classList.remove("acik"), 2400); }

// ================= BAŞARIMLAR =================
const ROZETLER = [
  ["ilk", "🌱", "İlk adım", "İlk kartını çalış", () => Object.keys(d.kartlar).length >= 1, 1],
  ["on", "📚", "10 kelime", "10 kelimeyi çalışılıyor aşamasına (2. kutu) taşı", () => durumdaSay(KELIMELER, "calisiliyor") + durumdaSay(KELIMELER, "ogrenildi") >= 10, 3],
  ["hedef", "🎯", "Hedefçi", "Bir günlük hedefi bitir", () => d.bugun.hediye || d.bugun.sayi >= 10, 2],
  ["seri5", "🔥", "Ateşli", "5 günlük seriye ulaş", () => seri() >= 5, 2],
  ["seri30", "🌋", "Yanardağ", "30 günlük seriye ulaş", () => seri() >= 30, 10],
  ["cumle", "🧩", "Cümle ustası", "5 cümleyi doğru kur", () => d.cumleDogru >= 5, 2],
  ["ogrendi", "🎓", "Usta", "Bir kelimeyi tamamen öğren (4. kutu)", () => durumdaSay(KELIMELER, "ogrenildi") > 0, 3],
  ["sosyal", "💌", "Neşe kaynağı", "Arkadaşına tepki gönder", () => d.tepki >= 1, 1],
  ["cete", "🐾", "Çete ruhu", "Bir haftanın tüm ortak görevlerini bitir", () => ceteHaftaTamam(), 5],
  ["ikili", "🤝", "Takım oyuncusu", "Bir arkadaşınla birlikte görev bitir", () => (d.ikiliBiten || 0) >= 1, 2],
  ["savas", "⚔️", "Çete savaşçısı", "Bir haftada savaşın 4 modunu da oyna", () => d.savas && Object.keys(d.savas.en).length >= 4, 3],
  ["tema", "🎨", "Dekoratör", "Kedine bir eşya al", () => d.esyalar.length > 0, 1],
];
function rozetKontrol() {
  ROZETLER.forEach(([id, ikon, ad, , kosul, odul]) => {
    if (!d.rozet[id] && kosul()) { d.rozet[id] = 1; d.yildiz += odul; kaydet(); setTimeout(() => { bildir(`${ikon} Başarım: ${ad} (+${odul} 🪙)`); Ses.zafer(); }, 500); }
  });
}
function odulCiz() {
  document.getElementById("rozetler").innerHTML = ROZETLER.map(([id, ikon, ad, acik, , odul]) =>
    `<div class="rozet ${d.rozet[id] ? "" : "kilitli"}"><div class="r-ikon">${ikon}</div><b>${ad}</b><small>${d.rozet[id] ? "Kazanıldı ✓" : acik + " · " + odul + " 🪙"}</small></div>`).join("");
  let h = `<div class="kart urun"><div class="u-ikon" style="background:var(--gok-a)">🧊</div><div><b>Seri koruyucu</b><small>Kaçırdığın bir günü kurtarır. Elinde: ${d.koruyucu}</small></div><button class="al" data-al="koruyucu" ${d.yildiz < 3 ? "disabled" : ""}>🪙 3</button></div>`;
  document.getElementById("magaza").innerHTML = h;
  document.querySelector('[data-al="koruyucu"]').onclick = () => { d.yildiz -= 3; d.koruyucu++; kaydet(); Ses.altin(); bildir("🧊 Seri koruyucu alındı"); herSeyiCiz(); };
}

// ================= TAKVİM =================
// Sadece içinde bulunulan ay gösterilir (Serhat, 2026-10-18)
const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const AY_EMOJI = ["❄️","⛄","🌱","🌷","🌸","☀️","🍉","🏖️","🍎","🍂","🍁","🎄"];
const GUN_RENK = [["#FF8A7A","#FFB38A"], ["#FFC94D","#FFDF8A"], ["#5CC9A7","#8FE0C4"], ["#6DB8EE","#9FD2F7"], ["#9F8BEA","#C3B4F5"]];
function takvimCiz() {
  const simdi = new Date(), ay = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
  document.getElementById("ay-adi").textContent = AYLAR[ay.getMonth()] + " " + ay.getFullYear();
  document.getElementById("ay-emoji").textContent = AY_EMOJI[ay.getMonth()];
  let h = ["Pt","Sa","Ça","Pe","Cu","Ct","Pz"].map((g, i) => `<div class="bas ${i > 4 ? "hafta-sonu" : ""}">${g}</div>`).join("");
  const bas = (ay.getDay() + 6) % 7, gunSayi = new Date(ay.getFullYear(), ay.getMonth() + 1, 0).getDate();
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
  document.getElementById("i-seri").textContent = seri();
  document.getElementById("i-enuzun").textContent = Math.max(d.enUzun, seri());
  document.getElementById("i-ogrenilen").textContent = durumdaSay(KELIMELER, "ogrenildi");
  document.getElementById("i-gun").textContent = Object.keys(d.gunler).length;
}

