// ================= DURUM (telefonda saklanır) =================
const ANAHTAR = "ing-prototip-v2";
const GUN_MS = 86400000;
const bugunNo = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / GUN_MS);
const ARALIK = [0, 1, 3, 7, 21]; // kutu -> kaç gün sonra tekrar
// Ortak öğrenme durumu: her ekran, sayaç ve rozet bunu kullanır (1. kutu tanışıldı, 2-3 çalışılıyor, 4 öğrenildi).
const DURUM = { tanisildi: "Tanışıldı", calisiliyor: "Çalışılıyor", ogrenildi: "Öğrenildi ⭐" };
const durumu = c => !c ? null : c.kutu >= 4 ? "ogrenildi" : c.kutu >= 2 ? "calisiliyor" : "tanisildi";
const durumdaSay = (deste, dr) => deste.filter(k => durumu(d.kartlar[k[0]]) === dr).length;
let d;

function yeniDurum() {
  const b = bugunNo();
  // Prototipte takvim boş görünmesin diye son 4 gün çalışılmış sayılır.
  return { yildiz: 3, koruyucu: 1, kartlar: {}, gunler: { [b-1]:1, [b-2]:1, [b-3]:1, [b-4]:1 }, korunan: {},
    bugun: { no: b, sayi: 0, hediye: false }, cumleDogru: 0, tepki: 0, enUzun: 4, tema: "cayir", temalar: ["cayir"], rozet: {},
    kediAd: "Pati", kilo: 4.0, seviye: "A1", kurk: "turuncu", kurklar: ["turuncu"], esyalar: [], giyili: { sapka: null, boyun: null, goz: null } };
}
// Kayıt ve yedek doğrulama: temel alanların türü doğruysa eksik alanlar yeni durumdan tamamlanır;
// temel alanlar bozuksa kayıt reddedilir (yedek yüklemede eski ilerleme hiç değişmez).
const ONCEKI = ANAHTAR + "-onceki";
function durumGecerliMi(v) {
  const nesne = x => x && typeof x === "object" && !Array.isArray(x);
  if (!nesne(v) || !nesne(v.kartlar) || typeof v.yildiz !== "number" || !isFinite(v.yildiz)) return false;
  if (v.gunler != null && !nesne(v.gunler)) return false;
  if (v.bugun != null && !(nesne(v.bugun) && typeof v.bugun.no === "number")) return false;
  return Object.values(v.kartlar).every(c => nesne(c) && typeof c.kutu === "number" && typeof c.sira === "number");
}
function tamamla(v) {
  const t = yeniDurum();
  for (const a in t) if (v[a] == null || typeof v[a] !== typeof t[a]) v[a] = t[a];
  if (!Array.isArray(v.temalar)) v.temalar = t.temalar;
  if (!Array.isArray(v.kurklar)) v.kurklar = t.kurklar;
  if (!Array.isArray(v.esyalar)) v.esyalar = t.esyalar;
  return v;
}
function okunanDurum(anahtar) {
  try { const v = JSON.parse(localStorage.getItem(anahtar)); return durumGecerliMi(v) ? tamamla(v) : null; } catch (e) { return null; }
}
// Gün değişimi: uygulama gece açık kalsa da ilk eylemde ve sayfaya dönüldüğünde yeni gün başlar.
function gunuYenile() {
  if (d.bugun.no === bugunNo()) return false;
  koruyucuKontrol(); d.bugun = { no: bugunNo(), sayi: 0, hediye: false }; kaydet();
  return true;
}
// Kedi adı sayfaya HTML olarak da yazılıyor; < > & " ' işaretleri ad içinde kod gibi çalışmasın diye atılır.
const temizAd = ad => String(ad || "").replace(/[<>&"'`]/g, "").trim().slice(0, 14);
function yukle() {
  d = okunanDurum(ANAHTAR) || okunanDurum(ONCEKI) || yeniDurum();
  if (d.kilo == null) d.kilo = 4.0;
  if (d.giyili && d.giyili.boyun === "atki") d.giyili.boyun = null;
  if (!d.seviye) d.seviye = "A1";
  d.kediAd = temizAd(d.kediAd) || "Pati";
  gunuYenile();
  // Deneme kolaylığı: linkin sonuna ?altin=500 eklenirse o kadar altın verilir, sonra adres temizlenir
  // (yenileyince tekrar vermesin). Gerçek uygulamada olmayacak.
  const linkte = new URLSearchParams(location.search);
  if (location.search) history.replaceState(null, "", location.pathname);
  const hediyeAltin = parseInt(linkte.get("altin"), 10);
  if (hediyeAltin > 0) {
    d.yildiz += Math.min(hediyeAltin, 9999); kaydet();
    setTimeout(() => bildir(`🪙 ${Math.min(hediyeAltin, 9999)} altın eklendi`), 400);
  }
  // ?hepsi=1 → tüm eşyalar, kürkler ve arka planlar açılır (deneme kolaylığı)
  if (linkte.get("hepsi")) {
    d.esyalar = ESYALAR.map(e => e.id); d.kurklar = Object.keys(KURK_SUZGEC); d.temalar = Object.keys(TEMALAR); kaydet();
    setTimeout(() => bildir("🎁 Tüm eşyalar açıldı"), 400);
  }
}
// İki sekme: her kayıt bir sıra numarası (rev) taşır. Başka sekme daha yeni bir kayıt yazdıysa
// bu sekme eski halini üstüne yazmaz; güncel hali yükler. "storage" olayı diğer sekmeleri anında günceller.
const kayitliRev = () => { try { return (JSON.parse(localStorage.getItem(ANAHTAR)) || {}).rev || 0; } catch (e) { return 0; } };
let kayitUyarildi = false;
function kaydet() {
  try {
    if (kayitliRev() > (d.rev || 0)) {
      const guncel = okunanDurum(ANAHTAR);
      if (guncel) { d = guncel; setTimeout(() => { herSeyiCiz(); bildir("🔄 Başka sekmedeki değişiklik yüklendi"); }, 0); return false; }
    }
    d.rev = (d.rev || 0) + 1;
    localStorage.setItem(ANAHTAR, JSON.stringify(d)); kayitUyarildi = false; return true;
  }
  catch (e) {
    // Sessizce geçme: ilerleme ekranda artıp telefona yazılmıyorsa kullanıcı bilmeli.
    if (!kayitUyarildi) { kayitUyarildi = true; setTimeout(() => pencere("⚠️", "İlerleme kaydedilemedi", "Telefonun bu sayfaya kayıt izni vermiyor ya da yer dolu. Ödüller > İlerleme yedeği'nden yedek kodunu al, sonra tekrar dene.", "Tamam"), 50); }
    return false;
  }
}

function koruyucuKontrol() {
  // Dün çalışılmadıysa ve koruyucu varsa dünü korunmuş say.
  const dun = bugunNo() - 1;
  if (!d.gunler[dun] && !d.korunan[dun] && d.gunler[dun - 1] && d.koruyucu > 0) { d.koruyucu--; d.korunan[dun] = 1; }
}
function seri() {
  let s = 0, g = bugunNo();
  if (!d.gunler[g]) g--;
  while (d.gunler[g] || d.korunan[g]) { if (d.gunler[g]) s++; g--; }
  return s;
}
const kartDurum = k => d.kartlar[k] || { kutu: 0, sira: 0, yeni: true };
function bekleyenler(deste = KELIMELER) {
  const b = bugunNo();
  // Biriken tekrarlar tek dev tura dönmesin: bir turda en çok 20 tekrar, en çok gecikenler önce; kalanı sonraki turda.
  const eski = deste.filter(k => d.kartlar[k[0]] && d.kartlar[k[0]].sira <= b)
    .sort((x, y) => d.kartlar[x[0]].sira - d.kartlar[y[0]].sira).slice(0, 20);
  let yeni = deste.filter(k => !d.kartlar[k[0]] && k[5] === d.seviye && (deste !== KELIMELER || !d.konu || konuOf(k[0]) === d.konu));
  // Phrasal verb'ler az: seçili seviyede yeni kalmadıysa diğer seviyelerden gelsin
  if (deste === PHRASAL && !yeni.length) yeni = deste.filter(k => !d.kartlar[k[0]]);
  const tur = deste === PHRASAL ? 6 : 10;
  return eski.concat(yeni.slice(0, Math.max(0, tur - eski.length)));
}

