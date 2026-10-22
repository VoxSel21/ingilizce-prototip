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
  // Yeni kullanıcı sıfır çalışılmış günle başlar (eski prototipteki 4 sahte gün kaldırıldı, 2026-10-22).
  return { surum: SEMA_SURUM, yildiz: EKONOMI.baslangicAltin, koruyucu: 1, kartlar: {}, gunler: {}, korunan: {},
    bugun: { no: b, sayi: 0, dogru: 0, hediye: false }, cumleDogru: 0, tepki: 0, enUzun: 0, tema: "cayir", temalar: ["cayir"], rozet: {},
    kediAd: "Pati", kilo: 4.0, seviye: "A1", kurk: "turuncu", kurklar: ["turuncu"], esyalar: [], giyili: { sapka: null, boyun: null, goz: null },
    odulDefteri: {}, ayar: { hedef: 10, tema: "sistem", hareket: "sistem", titresim: true, seslendirme: true } };
}
// Kayıt ve yedek: önce Kayit.dogrula (js/kayit.js), sonra Kayit.tasi ile bugünkü biçime getirilir.
// Bozuk kayıt reddedilir; yedek yüklemede mevcut ilerleme hiç değişmez.
const ONCEKI = ANAHTAR + "-onceki";
// Tanınan kimlikler: bilinmeyen kelime/eşya/tema/kürk kimlikleri taşımada atılır.
const izinliKimlikler = () => ({
  kelimeler: new Set(KELIMELER.concat(PHRASAL).map(k => k[0])),
  esyalar: new Set(ESYALAR.map(e => e.id)), temalar: new Set(Object.keys(TEMALAR)), kurklar: new Set(Object.keys(KURKLER)),
});
const durumGecerliMi = v => Kayit.dogrula(v).tamam;
const tamamla = v => Kayit.tasi(v, yeniDurum(), izinliKimlikler());
function okunanDurum(anahtar) {
  try { const v = JSON.parse(localStorage.getItem(anahtar)); return durumGecerliMi(v) ? tamamla(v) : null; } catch (e) { return null; }
}
// Sürüm taşımasından önce eski kayıt bir kez, sürüm numarasıyla ayrı saklanır (geri dönüş yolu).
function surumYedegiAl() {
  try {
    const ham = localStorage.getItem(ANAHTAR); if (!ham) return;
    const eski = (JSON.parse(ham) || {}).surum || 2;
    const yedekAnahtar = `${ANAHTAR}-yedek-s${eski}`;
    if (eski < SEMA_SURUM && !localStorage.getItem(yedekAnahtar)) localStorage.setItem(yedekAnahtar, ham);
  } catch (e) {}
}
// Gün değişimi: uygulama gece açık kalsa da ilk eylemde ve sayfaya dönüldüğünde yeni gün başlar.
function gunuYenile() {
  if (d.bugun.no === bugunNo()) return false;
  koruyucuKontrol(); d.bugun = { no: bugunNo(), sayi: 0, dogru: 0, hediye: false }; Ekonomi.defterTemizle(d, bugunNo()); kaydet();
  return true;
}
// Ortak çalışma kaydı: her öğrenme sorusu (kart, phrasal, harf, Kelime Kur, cümle) buradan sayılır.
function soruCevaplandi(dogru) {
  gunuYenile(); Ilerleme.soruSay(d.bugun, dogru); gunIsaretle();
}
// Nitelikli çalışma günü (js/ilerleme.js kuralı): takvim, seri ve en uzun seri buradan beslenir.
function gunIsaretle() { d.gunler[bugunNo()] = 1; d.enUzun = Math.max(d.enUzun || 0, seri()); }
// Kedi adı sayfaya HTML olarak da yazılıyor; < > & " ' işaretleri ad içinde kod gibi çalışmasın diye atılır.
const temizAd = ad => String(ad || "").replace(/[<>&"'`]/g, "").trim().slice(0, 14);
// Deneme kolaylıkları (?altin=, ?hepsi=1) yalnız geliştirme ortamında çalışır: bilgisayardaki yerel önizleme.
// Yayındaki site ve telefon uygulaması bunları yok sayar.
const GELISTIRME = !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
  && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
function yukle() {
  surumYedegiAl();
  d = okunanDurum(ANAHTAR) || okunanDurum(ONCEKI) || yeniDurum();
  if (d.kilo == null) d.kilo = 4.0;
  if (d.giyili && d.giyili.boyun === "atki") d.giyili.boyun = null;
  if (!d.seviye) d.seviye = "A1";
  d.kediAd = temizAd(d.kediAd) || "Pati";
  gunuYenile();
  const linkte = new URLSearchParams(location.search);
  if (location.search) history.replaceState(null, "", location.pathname);
  if (!GELISTIRME) return;
  const hediyeAltin = parseInt(linkte.get("altin"), 10);
  if (hediyeAltin > 0) {
    d.yildiz += Math.min(hediyeAltin, 9999); kaydet();
    setTimeout(() => bildir(`🪙 ${Math.min(hediyeAltin, 9999)} altın eklendi (geliştirme modu)`), 400);
  }
  if (linkte.get("hepsi") === "1") {
    d.esyalar = ESYALAR.map(e => e.id); d.kurklar = Object.keys(KURKLER); d.temalar = Object.keys(TEMALAR); kaydet();
    setTimeout(() => bildir("🎁 Tüm eşyalar açıldı (geliştirme modu)"), 400);
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
  const r = Ilerleme.koruyucuUygula(d.gunler, d.korunan, d.koruyucu, bugunNo());
  d.koruyucu = r.koruyucu; d.korunan = r.korunan;
}
const gunlukHedef = () => (d && d.ayar && d.ayar.hedef) || 10;
const seri = () => Ilerleme.seri(d.gunler, d.korunan, bugunNo());
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

