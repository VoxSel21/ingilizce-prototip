// ================= DURUM (telefonda saklanır) =================
const ANAHTAR = "ing-prototip-v2";
const KayitDeposu = YerelKayit.olustur(localStorage, ANAHTAR);
const GUN_MS = 86400000;
// Yerel takvim günü. Saat dilimi değişip gün bir geri giderse kayıttaki gün sürer (js/ilerleme.js etkinGun).
const gercekGun = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / GUN_MS);
const bugunNo = () => Ilerleme.etkinGun(gercekGun(), d && d.bugun && d.bugun.no);
const ARALIK = [0, 1, 3, 7, 21]; // kutu -> kaç gün sonra tekrar
// Ortak öğrenme durumu: her ekran, sayaç ve rozet bunu kullanır (1. kutu tanışıldı, 2-3 çalışılıyor, 4 öğrenildi).
const DURUM = { tanisildi: "Çalışıldı", calisiliyor: "Tekrar edildi", ogrenildi: "Pekişti ⭐" };
const durumu = c => !c ? null : c.kutu >= 4 ? "ogrenildi" : c.kutu >= 2 ? "calisiliyor" : "tanisildi";
const durumdaSay = (deste, dr) => deste.filter(k => durumu(d.kartlar[k[0]]) === dr).length;
let d;

function yeniDurum() {
  return DurumModeli.yeni(bugunNo());
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
  try { const v = JSON.parse(anahtar === ANAHTAR ? KayitDeposu.oku().durum : localStorage.getItem(anahtar)); return durumGecerliMi(v) ? tamamla(v) : null; } catch (e) { return null; }
}
// Sürüm taşımasından önce eski kayıt bir kez, sürüm numarasıyla ayrı saklanır (geri dönüş yolu).
function surumYedegiAl() {
  try {
    const ham = KayitDeposu.oku().durum; if (!ham) return;
    const eski = (JSON.parse(ham) || {}).surum || 2;
    const yedekAnahtar = `${ANAHTAR}-yedek-s${eski}`;
    if (eski < SEMA_SURUM && !localStorage.getItem(yedekAnahtar)) localStorage.setItem(yedekAnahtar, ham);
  } catch (e) {}
}
// Gün değişimi: uygulama gece açık kalsa da ilk eylemde ve sayfaya dönüldüğünde yeni gün başlar.
function gunuYenile() {
  if (d.bugun.no === bugunNo()) return false;
  // Defter temizliği kayıttaki günden en çok bir gün ileri gider: saat bir anda aylarca ileri alınsa da
  // bugünün ödül kayıtları silinmez, saat geri alınınca aynı ödül ikinci kez ödenmez. Dürüst kullanıcı
  // bir şey kaybetmez; ara verilen günlerde temizlik yalnız biraz gecikir.
  const onceki = d.bugun.no;
  koruyucuKontrol(); d.bugun = { no: bugunNo(), sayi: 0, dogru: 0, hediye: false };
  Ekonomi.defterTemizle(d, Ekonomi.temizlikGunu(onceki, d.bugun.no)); kaydet();
  return true;
}
// Ortak çalışma kaydı: her öğrenme sorusu (kart, phrasal, harf, Kelime Kur, cümle) buradan sayılır.
// Ödül hissi (U04): hedefin ara işaretlerinde ve hedefte kısa bildirim, öğrenmeyi bölen pencere yok. Altın yalnız hediyede.
function soruCevaplandi(dogru) {
  gunuYenile();
  const once = d.bugun.sayi, hedef = gunlukHedef();
  Ilerleme.soruSay(d.bugun, dogru); gunIsaretle();
  const isaret = Ilerleme.isaretGecildi(once, d.bugun.sayi, hedef, EKONOMI.hedefIsaret);
  if (isaret === "hedef") { bildir("🎯 Günlük hedef tamam! Tur bitince hediyeni aç 🎁"); Ses.altin(); }
  else if (isaret === "isaret") { bildir(`🐾 Güzel gidiyorsun! ${d.bugun.sayi}/${hedef} · hediyeye ${hedef - d.bugun.sayi} cevap`); Ses.pop(); }
  hedefSeritCiz();
}
// Nitelikli çalışma günü (js/ilerleme.js kuralı): takvim, seri ve en uzun seri buradan beslenir.
function gunIsaretle() { d.gunler[bugunNo()] = 1; d.enUzun = seriOzet().enUzun; }
// Kedi adı sayfaya HTML olarak da yazılıyor; < > & " ' işaretleri ad içinde kod gibi çalışmasın diye atılır.
const temizAd = ad => String(ad || "").replace(/[<>&"'`]/g, "").trim().slice(0, 14);
// Deneme kolaylıkları (?altin=, ?hepsi=1) yalnız geliştirme ortamında çalışır: bilgisayardaki yerel önizleme.
// Yayındaki site ve telefon uygulaması bunları yok sayar.
const GELISTIRME = !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
  && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
function yukle() {
  surumYedegiAl();
  d = okunanDurum(ANAHTAR) || okunanDurum(ONCEKI) || yeniDurum();
  d.kilo = Kilo.sinirla(d.kilo);
  if (d.giyili && d.giyili.boyun === "atki") d.giyili.boyun = null;
  if (!d.seviye) d.seviye = "A1";
  d.kediAd = temizAd(d.kediAd) || "Pati";
  // Misafir kimliği bir kez verilir ve yedekle taşınır: aynı yedek iki cihazdan yüklense de hesaba bir kez aktarılır.
  if (!d.kimlik) d.kimlik = { misafir: Esitleme.yeniKimlik() };
  olayTabani = JSON.parse(JSON.stringify(d));
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
const kayitliRev = () => { try { return (JSON.parse(KayitDeposu.oku().durum) || {}).rev || 0; } catch (e) { return 0; } };
let kayitUyarildi = false;
// Durum, olay kuyruğu ve hesap sahipliği tek zarfta saklanır. UI yedeği yalnız ilerleme kaydını içerir.
let olayTabani = null, bekleyenDefter = [];
Ekonomi.iz = satir => bekleyenDefter.push(satir);
function kuyrukOku() {
  const k = KayitDeposu.oku().kuyruk;
  return Esitleme.kuyrukDuzelt(k, Esitleme.yeniKimlik("c"));
}
function kuyrugaYaz(metin, hesap) {
    // Sahip: misafir ilerlemesi hesaba taşındıysa hesap, yoksa misafir (js/bulut.js, Esitleme.sahip).
    const k = kuyrukOku(), zaman = Date.now(), sahip = hesap ? Esitleme.sahip(hesap, d) : typeof Bulut !== "undefined" ? Bulut.sahip() : d.kimlik && d.kimlik.misafir;
    const olaylar = Esitleme.farkOlaylari(olayTabani, d, bekleyenDefter);
    for (const o of olaylar) Esitleme.olayEkle(k, o.tur, o.veri, sahip, zaman);
    KayitDeposu.yaz(metin, Esitleme.sikistir(k), hesap);
    olayTabani = JSON.parse(metin); bekleyenDefter = [];
    if (olaylar.length && typeof Bulut !== "undefined") Bulut._kayitSonrasi();
}
function kaydet(hesap) {
  try {
    if (kayitliRev() > (d.rev || 0)) {
      const guncel = okunanDurum(ANAHTAR);
      if (guncel) { d = guncel; olayTabani = JSON.parse(JSON.stringify(d)); bekleyenDefter = []; setTimeout(() => { herSeyiCiz(); bildir("🔄 Başka sekmedeki değişiklik yüklendi"); }, 0); return false; }
    }
    const oncekiRev = d.rev || 0;
    d.esitlemeSurum = 1;
    d.rev = oncekiRev + 1;
    const metin = JSON.stringify(d);
    try { kuyrugaYaz(metin, hesap); } catch (e) { d.rev = oncekiRev; throw e; }
    kayitUyarildi = false;
    if(typeof ArkadasEkran !== 'undefined') ArkadasEkran.katkiGonder();
    if(typeof SavasEkran !== 'undefined') SavasEkran.gonder();
    if(typeof OzelSohbet !== 'undefined') OzelSohbet.profilGuncelle();
    return true;
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
const seriOzet = () => Ilerleme.ozet(d.gunler, d.korunan, bugunNo(), d.enUzun);
const kartDurum = k => d.kartlar[k] || { kutu: 0, sira: 0, yeni: true };
function bekleyenler(deste = KELIMELER) {
  const b = bugunNo();
  // Biriken tekrarlar tek dev tura dönmesin: bir turda en çok 20 tekrar, en çok gecikenler önce; kalanı sonraki turda.
  const eski = deste.filter(k => d.kartlar[k[0]] && d.kartlar[k[0]].sira <= b)
    .sort((x, y) => d.kartlar[x[0]].sira - d.kartlar[y[0]].sira).slice(0, 20);
  const yeni = yeniHavuz(deste);
  return eski.concat(yeni.slice(0, Math.max(0, turBoyu(deste) - eski.length)));
}
const turBoyu = deste => deste === PHRASAL ? 6 : 10;
// Yeni kelime havuzu: seçili seviye ve konu (sıra js/ogrenme.js'de karışır).
function yeniHavuz(deste = KELIMELER) {
  const yeni = deste.filter(k => !d.kartlar[k[0]] && k[5] === d.seviye && (deste !== KELIMELER || !d.konu || konuOf(k[0]) === d.konu));
  // Phrasal verb'ler az: seçili seviyede yeni kalmadıysa diğer seviyelerden gelsin
  const havuz=deste === PHRASAL && !yeni.length ? deste.filter(k => !d.kartlar[k[0]]) : yeni;
  if(!d.degerlendirme?.atlaBilinen)return havuz;
  // Her turda bir alt seviye örneği geri kontrol edilir; hiçbir kart otomatik öğrenildi yapılmaz.
  const alt=deste.filter(k=>!d.kartlar[k[0]]&&SINAV_SEVIYELER.indexOf(k[5])<SINAV_SEVIYELER.indexOf(d.degerlendirme.seviye));
  return alt.length?[karistir(alt)[0],...havuz]:havuz;
}

