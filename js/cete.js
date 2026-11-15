// ================= ÇETE: gerçek çete sohbeti (Firestore) =================
// Ek iş, 1. parça (2026-10-23). Plan: degerlendirmeler/cete-sohbeti-plani.md. Erişim kuralları: firestore.rules.
// - Hesabı olan herkes çete kurabilir; arkadaşlar 6 harfli kodla ya da kodu içeren bağlantıyla katılır. En çok 10 üye,
//   kişi aynı anda yalnız bir çetede (uyelik/{uid} belgesi); üyeyken yeni çete kuramaz. Kurucu üye çıkarabilir;
//   çıkarılan tekrar giremez.
// - Mesaj: en çok 160 harf, iki mesaj arası en az 2 sn (kural zorlar). Kendi mesajını silebilirsin; 30 günden eski
//   mesajları sohbeti açan uygulama siler (ücretsiz planda sunucu kodu yok).
// - İngilizce dışı harf yalnız uyarı verir, mesaj yine gider (Serhat kararı).
// Saf kısım (CeteKural) ve veritabanını dışarıdan alan çekirdek (CeteCekirdek); Node emülatör testleri de bunu kullanır.
// c = { db, F }: db = firebase.firestore() (compat), F = firebase.firestore (FieldValue için).
const CETE = { alfabe: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", kodUzunluk: 6, enCokUye: 10, mesajSinir: 160, adSinir: 20,
  ceteAdSinir: 24, araSaniye: 2, saklamaGun: 30, sonMesaj: 50, site: "https://voxsel21.github.io/ingilizce-prototip/" };

const CeteKural = {
  kodUret(rastgele = Math.random) {
    let k = "";
    for (let i = 0; i < CETE.kodUzunluk; i++) k += CETE.alfabe[Math.floor(rastgele() * CETE.alfabe.length)];
    return k;
  },
  // Kullanıcının yazdığı kodu düzeltir: büyük harf (Türkçe "i" de "I" olur), boşluk ve tire atılır.
  // Alfabede karışan harfler (0/O, 1/I) yok; yazılırsa kod geçersiz sayılır.
  kodDuzelt(metin) {
    return String(metin == null ? "" : metin).toLocaleUpperCase("en").replace(/[\s-]/g, "").slice(0, 12);
  },
  kodGecerli: k => new RegExp(`^[${CETE.alfabe}]{${CETE.kodUzunluk}}$`).test(String(k || "")),
  ceteIdUret(rastgele = Math.random) {
    const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let s = "";
    for (let i = 0; i < 20; i++) s += a[Math.floor(rastgele() * a.length)];
    return s;
  },
  baglanti: (kod, site = CETE.site) => `${site}?katil=${encodeURIComponent(kod)}`,
  // Adres satırındaki ?katil=KOD; geçerli değilse null.
  kodAdrestenAl(arama) {
    let k = null;
    try { k = new URLSearchParams(arama || "").get("katil"); } catch (e) {}
    k = k && CeteKural.kodDuzelt(k);
    return k && CeteKural.kodGecerli(k) ? k : null;
  },
  adTemizle(ad, sinir = CETE.adSinir) {
    return String(ad == null ? "" : ad).replace(/[\u0000-\u001F\u007F​-‏‪-‮⁦-⁩]/g, " ")
      .replace(/\s+/g, " ").trim().slice(0, sinir);
  },
  // Türkçe harf varsa uyarı (gönderimi durdurmaz).
  ingilizceUyari: metin => /[çğıöşüÇĞİÖŞÜ]/.test(String(metin || "")),
  // 30 günden eski mesajın sınır zamanı (ms).
  saklamaSiniri: (simdi = Date.now()) => simdi - CETE.saklamaGun * 24 * 3600 * 1000,
  // Firebase hatasını kısa bir türe çevirir (ekran Türkçe metni buna göre seçer).
  hataTuru(e) {
    const s = String((e && (e.code || e.message)) || e || "");
    if (/permission|PERMISSION_DENIED|insufficient/i.test(s)) return "izin";
    if (/unavailable|network|offline|deadline/i.test(s)) return "baglanti";
    return "bilinmeyen";
  },
};

if (typeof module === "object" && module.exports) module.exports = { CETE, CeteKural };
