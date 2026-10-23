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

const CeteCekirdek = {
  cete: (c, id) => c.db.collection("ceteler").doc(id),
  mesajlar: (c, id) => c.db.collection("ceteler").doc(id).collection("mesajlar"),
  uyelikBelge: (c, uid) => c.db.collection("uyelik").doc(uid),
  kodBelge: (c, kod) => c.db.collection("kodlar").doc(kod),

  // Yeni çete: çete + kod + kendi üyeliğin tek toplu yazmada. Kod çakışırsa (kural reddeder) yeni kodla tekrar dener.
  async kur(c, uid, { ad, takmaAd }, rastgele = Math.random) {
    const ceteAd = CeteKural.adTemizle(ad, CETE.ceteAdSinir), takma = CeteKural.adTemizle(takmaAd);
    if (!ceteAd || !takma) throw new Error("ad-bos");
    // Bir çeteye üye olan yeni çete kuramaz (Serhat); kural da reddeder, burada anlaşılır hata için önce bakılır.
    if (await CeteCekirdek.benimCetem(c, uid)) throw new Error("zaten-cetede");
    let son;
    for (let deneme = 0; deneme < 4; deneme++) {
      const ceteId = CeteKural.ceteIdUret(rastgele), kod = CeteKural.kodUret(rastgele);
      const b = c.db.batch();
      b.set(CeteCekirdek.cete(c, ceteId), { ad: ceteAd, kurucu: uid, uyeler: [uid], adlar: { [uid]: takma },
        cikarilanlar: [], kod, olusturma: c.F.FieldValue.serverTimestamp() });
      b.set(CeteCekirdek.kodBelge(c, kod), { ceteId, ad: ceteAd });
      b.set(CeteCekirdek.uyelikBelge(c, uid), { ceteId, son: new Date(0) });
      try { await b.commit(); return { ceteId, kod }; } catch (e) {
        son = e;
        if (CeteKural.hataTuru(e) !== "izin" || await CeteCekirdek.uyelikOku(c, uid)) throw e; // başka çetedeyse çakışma değil
      }
    }
    throw son;
  },
  async kodBul(c, kod) {
    if (!CeteKural.kodGecerli(kod)) return null;
    const s = await CeteCekirdek.kodBelge(c, kod).get();
    return s.exists ? { ceteId: s.data().ceteId, ad: s.data().ad } : null;
  },
  // Kodla katılma. Sonuç { ceteId, ad } ya da { hata: "kod" | "izin" } (izin: çete dolu, çıkarıldın ya da başka çetedesin).
  async katil(c, uid, kod, takmaAd) {
    const takma = CeteKural.adTemizle(takmaAd);
    if (!takma) throw new Error("ad-bos");
    const bulunan = await CeteCekirdek.kodBul(c, kod);
    if (!bulunan) return { hata: "kod" };
    const b = c.db.batch();
    b.update(CeteCekirdek.cete(c, bulunan.ceteId), { uyeler: c.F.FieldValue.arrayUnion(uid), [`adlar.${uid}`]: takma });
    b.set(CeteCekirdek.uyelikBelge(c, uid), { ceteId: bulunan.ceteId, son: new Date(0) });
    try { await b.commit(); } catch (e) { if (CeteKural.hataTuru(e) === "izin") return { hata: "izin" }; throw e; }
    return bulunan;
  },
  async uyelikOku(c, uid) {
    const s = await CeteCekirdek.uyelikBelge(c, uid).get();
    return s.exists ? s.data() : null;
  },
  // Çete belgesi; üye değilsen (çıkarıldın/silindi) null.
  async ceteOku(c, ceteId) {
    try {
      const s = await CeteCekirdek.cete(c, ceteId).get();
      return s.exists ? { id: ceteId, ...s.data() } : null;
    } catch (e) { if (CeteKural.hataTuru(e) === "izin") return null; throw e; }
  },
  // Açılışta: üyelik varsa ve hâlâ üyeysen çeteyi döndürür; çıkarıldıysan ya da çete silindiyse üyeliği temizler.
  async benimCetem(c, uid) {
    const u = await CeteCekirdek.uyelikOku(c, uid);
    if (!u) return null;
    const cete = await CeteCekirdek.ceteOku(c, u.ceteId);
    if (cete && cete.uyeler.includes(uid)) return cete;
    await CeteCekirdek.uyelikBelge(c, uid).delete();
    return null;
  },
  // Ayrılma. Kurucu ayrılırsa kuruculuk en eski üyeye geçer. Son üye ayrılırsa mesajlar, çete ve kod silinir.
  async ayril(c, uid, ceteId, { mesajlarimiSil = false } = {}) {
    const cete = await CeteCekirdek.ceteOku(c, ceteId);
    if (!cete || !cete.uyeler.includes(uid)) { await CeteCekirdek.uyelikBelge(c, uid).delete(); return; }
    const kalan = cete.uyeler.filter(x => x !== uid);
    if (!kalan.length) {
      await CeteCekirdek.topluSil(c, CeteCekirdek.mesajlar(c, ceteId));
      const b = c.db.batch();
      b.delete(CeteCekirdek.cete(c, ceteId)); b.delete(CeteCekirdek.kodBelge(c, cete.kod)); b.delete(CeteCekirdek.uyelikBelge(c, uid));
      await b.commit(); return;
    }
    if (mesajlarimiSil) await CeteCekirdek.topluSil(c, CeteCekirdek.mesajlar(c, ceteId).where("uid", "==", uid));
    const b = c.db.batch();
    const degisen = { uyeler: c.F.FieldValue.arrayRemove(uid) };
    if (cete.kurucu === uid) degisen.kurucu = kalan[0];
    b.update(CeteCekirdek.cete(c, ceteId), degisen);
    b.delete(CeteCekirdek.uyelikBelge(c, uid));
    await b.commit();
  },
  // Yalnız kurucu: üyeyi çıkarır; çıkarılan aynı çeteye tekrar katılamaz.
  async cikar(c, ceteId, uid) {
    await CeteCekirdek.cete(c, ceteId).update({ uyeler: c.F.FieldValue.arrayRemove(uid), cikarilanlar: c.F.FieldValue.arrayUnion(uid) });
  },
  // Mesaj + "son mesaj zamanı" tek toplu yazmada (hız sınırı kuralı ikisine birlikte bakar).
  async gonder(c, uid, ceteId, ad, metin) {
    const temiz = CeteKural.adTemizle(metin, CETE.mesajSinir);
    if (!temiz) throw new Error("metin-bos");
    const zd = c.F.FieldValue.serverTimestamp();
    const ref = CeteCekirdek.mesajlar(c, ceteId).doc();
    const b = c.db.batch();
    b.set(ref, { uid, ad, metin: temiz, zaman: zd });
    b.update(CeteCekirdek.uyelikBelge(c, uid), { son: zd });
    await b.commit();
    return ref.id;
  },
  sil: (c, ceteId, mesajId) => CeteCekirdek.mesajlar(c, ceteId).doc(mesajId).delete(),
  // 30 günden eski mesajları siler (sohbet açılınca bir kez). Silinen sayısını döndürür.
  temizle: (c, ceteId, simdi = Date.now()) =>
    CeteCekirdek.topluSil(c, CeteCekirdek.mesajlar(c, ceteId).where("zaman", "<", new Date(CeteKural.saklamaSiniri(simdi)))),
  async topluSil(c, sorgu, parca = 100) {
    let toplam = 0;
    for (;;) {
      const s = await sorgu.limit(parca).get();
      if (s.empty) return toplam;
      const b = c.db.batch();
      s.docs.forEach(d => b.delete(d.ref));
      await b.commit();
      toplam += s.size;
      if (s.size < parca) return toplam;
    }
  },
  // Son 50 mesajı canlı dinler (eskiden yeniye). Dönen fonksiyon dinlemeyi kapatır.
  dinle(c, ceteId, geri, hata = () => {}) {
    return CeteCekirdek.mesajlar(c, ceteId).orderBy("zaman", "desc").limit(CETE.sonMesaj).onSnapshot(s => {
      const liste = s.docs.map(d => {
        const v = d.data({ serverTimestamps: "estimate" });
        return { id: d.id, uid: v.uid, ad: v.ad, metin: v.metin, zaman: v.zaman ? v.zaman.toMillis() : 0, bekliyor: d.metadata.hasPendingWrites };
      }).reverse();
      geri(liste);
    }, hata);
  },
};

if (typeof module === "object" && module.exports) module.exports = { CETE, CeteKural, CeteCekirdek };
