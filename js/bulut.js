// ================= BULUT: hesap (Firebase Auth) ve eşitleme (Firestore) =================
// 5. aşama 2. parça (2026-10-23). Kurallar esitleme.js'te; burası yalnız onları buluta bağlar.
// - Hesap yokken hiçbir şey değişmez: Firebase dosyaları bile yüklenmez, uygulama misafir olarak çalışır.
// - Giriş: e-posta + şifre (şifreyi Firebase saklar, biz görmeyiz). İlk girişte misafir ilerlemesi hesaba
//   bir kez taşınır (misafirTasi); sonra olaylar hesaba gider.
// - Gönderim tek parça işlemle (transaction): hesap hali okunur, olaylar kurallarla uygulanır, işlenen her olay
//   ayrı bir işaret belgesi olarak yazılır. Aynı olay tekrar gelirse işaret zaten vardır, ikinci kez uygulanmaz.
//   İki cihaz aynı anda yazarsa Firebase işlemi baştan çalıştırır; sonuç hep aynı kurallarla birleşir.
// - İnternet yoksa olaylar kuyrukta bekler (esitleme.js'teki artan bekleme); bağlantı gelince gönderilir.
// - Hesap hali cihaza yalnız bu hesabın gönderilmemiş olayı kalmadığında yazılır (yerel değişiklik ezilmez).
const _Es = typeof Esitleme !== "undefined" ? Esitleme : require("./esitleme.js").Esitleme;

// Ağ işinin saf olmayan ama tarayıcıdan bağımsız çekirdeği (Node emülatör testleri de bunu kullanır).
const BulutCekirdek = (typeof BulutVeri !== "undefined" ? BulutVeri : require("./bulut-veri.js").BulutVeri).olustur(_Es);

// ---------- Tarayıcı tarafı: giriş, kuyruk gönderimi, ekran durumu ----------
// Hesap sahipliği KayitDeposu içindedir; kullanıcıya verilen ilerleme yedeğine eklenmez.
const FIREBASE_DOSYALAR = ["firebase-app-compat.js", "firebase-auth-compat.js", "firebase-firestore-compat.js"];
const GIRIS_HATALARI = {
  "auth/email-already-in-use": "Bu e-postayla zaten hesap var; Giriş yap'ı dene.",
  "auth/invalid-email": "E-posta adresi geçerli görünmüyor.",
  "auth/missing-password": "Şifreyi yaz.",
  "auth/weak-password": "Şifre en az 6 karakter olmalı.",
  "auth/invalid-credential": "E-posta ya da şifre yanlış.",
  "auth/wrong-password": "E-posta ya da şifre yanlış.",
  "auth/user-not-found": "E-posta ya da şifre yanlış.",
  "auth/network-request-failed": "Hesap sunucusuna ulaşılamadı; internetini kontrol edip tekrar dene.",
  "auth/too-many-requests": "Çok fazla deneme oldu; biraz bekleyip tekrar dene.",
};

const Bulut = {
  durum: "yerel",      // yerel | hazirDegil | yukleniyor | esitleniyor | esitlendi | bekliyor | tekrar | cevrimdisi
  kullanici: null, hata: "", _auth: null, _db: null, _calisiyor: false, _tekrar: false,
  _nesil: 0, _gorev: null,
  oturumDegisti() { Bulut._nesil++; Bulut._gorev = null; Bulut._calisiyor = false; Bulut._tekrar = false; },
  // Hesap yalnız iki durumda kullanılabilir: gerçek proje ayarı girilmişse ya da emülatör ayarlıyken
  // bilgisayardaki geliştirme sunucusundaysak (telefonda emülatöre ulaşılamaz).
  hazirMi() {
    if (typeof FIREBASE_AYAR === "undefined" || !FIREBASE_AYAR.proje || !FIREBASE_AYAR.proje.apiKey) return false;
    if (!FIREBASE_AYAR.emulator) return true;
    return typeof GELISTIRME !== "undefined" && GELISTIRME && location.port !== "";
  },
  hkOku() { return KayitDeposu.hesapOku(); },
  hkYaz(hk) { KayitDeposu.hesapYaz(hk); },
  sahip() { return _Es.sahip(Bulut.hkOku(), d); },

  _betik: src => new Promise((tamam, hata) => { const s = document.createElement("script"); s.src = src; s.onload = tamam; s.onerror = () => hata(new Error("betik yüklenemedi: " + src)); document.head.append(s); }),
  async baslat() {
    if (!Bulut.hazirMi()) { Bulut.durum = "hazirDegil"; return; }
    if (Bulut._auth) return;
    Bulut.durum = "yukleniyor";
    try { if (!window.firebase) for (const f of FIREBASE_DOSYALAR) await Bulut._betik(`vendor/firebase/${f}?v=13.1.0`); }
    catch (e) { Bulut.durum = "hazirDegil"; Bulut.hata = "Hesap dosyaları açılamadı."; Bulut._ciz(); return; }
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_AYAR.proje);
    Bulut._auth = app.auth(); Bulut._db = app.firestore();
    const em = FIREBASE_AYAR.emulator;
    if (em) { Bulut._auth.useEmulator(em.auth, { disableWarnings: true }); Bulut._db.useEmulator(em.firestoreHost, em.firestorePort); }
    Bulut._auth.onAuthStateChanged(u => {
      Bulut.oturumDegisti();
      Bulut.kullanici = u || null;
      Bulut.durum = u ? "bekliyor" : "yerel";
      Bulut._ciz();
      if (u) Bulut.esitle();
      if (typeof ceteYenile === "function") ceteYenile(); // gerçek çete (js/cete-ekran.js)
      if (typeof ArkadasEkran !== 'undefined') ArkadasEkran.baslat(u);
    });
    window.addEventListener("online", () => Bulut.esitle());
    document.addEventListener("visibilitychange", () => { if (!document.hidden) Bulut.esitle(); });
    setInterval(() => { if (!document.hidden) Bulut.esitle(); }, 60000);
    // Kuyruğa yeni olay girince kısa bir beklemeden sonra gönder (her dokunuşta ağa çıkılmasın).
    Bulut._kayitSonrasi = () => { clearTimeout(Bulut._zamanlayici); Bulut._zamanlayici = setTimeout(() => Bulut.esitle(), 3000); };
  },
  _kayitSonrasi() {},
  hesapYenilendi() {},
  _ciz() { const t = document.getElementById("tam-ayarlar"); if (t && t.classList.contains("aktif") && typeof ayarlarCiz === "function") ayarlarCiz(); },
  _kuyrukYaz: k => KayitDeposu.kuyrukYaz(k),
  ceteBaglantisi() { return { db: Bulut._db, F: firebase.firestore }; },

  async giris(eposta, sifre, yeni) {
    Bulut.hata = "";
    try {
      const r = yeni ? await Bulut._auth.createUserWithEmailAndPassword(eposta, sifre) : await Bulut._auth.signInWithEmailAndPassword(eposta, sifre);
      // Hesap sahipliği ilk eşitleme planı tarafından değiştirilir; eski sahibin izi önceden silinmez.
      return { tamam: true };
    } catch (e) { return { tamam: false, hata: GIRIS_HATALARI[e.code] || "Giriş olmadı; biraz sonra tekrar dene." }; }
  },
  // Çıkış: cihazdaki ilerleme silinmez; yeni bir misafir kimliği başlar. Aynı hesaba dönülürse yalnız aradaki
  // kazanç taşınır; başka hesaba girilirse bu ilerleme o hesaba geçmez (yerelde yedeklenir).
  async cikis() {
    const hk = Bulut.hkOku(), uid = hk.uid;
    Bulut.oturumDegisti();
    await Bulut._auth.signOut();
    const eskiKimlik = d.kimlik; d.kimlik = { misafir: _Es.yeniKimlik() };
    const yeniHesap = { oncekiUid: uid, tabanAltin: Math.floor(d.yildiz) || 0, tabanMisafir: d.kimlik.misafir, tabanIlerleme: _Es.ilerlemeAnlik(d) };
    if (!kaydet(yeniHesap)) { d.kimlik = eskiKimlik; throw new Error('Çıkış bilgisi kaydedilemedi'); }
    Bulut.durum = "yerel";
  },
  bekleyenSayisi(uid) { return kuyrukOku().olaylar.filter(o => o.sahip === uid).length; },

  async esitle() {
    if (!Bulut._auth || !Bulut._auth.currentUser) return;
    if (Bulut._calisiyor) { Bulut._tekrar = true; return; }
    Bulut._calisiyor = true;
    const gorev = Bulut._gorev = { uid: Bulut._auth.currentUser.uid, nesil: Bulut._nesil };
    const gecerli = () => Bulut._gorev === gorev && Bulut._nesil === gorev.nesil
      && Bulut._auth.currentUser && Bulut._auth.currentUser.uid === gorev.uid;
    const zd = () => firebase.firestore.FieldValue.serverTimestamp();
    try {
      const u = Bulut._auth.currentUser, uid = u.uid, db = Bulut._db;
      let hk = Bulut.hkOku();
      const plan = _Es.girisPlani(hk, d, uid);
      if (navigator.onLine === false) { Bulut.durum = "cevrimdisi"; return; }
      Bulut.durum = "esitleniyor"; Bulut._ciz();
      let tam = false, sonH = null;
      if (plan.tur === "degistir") {
        // Bu cihazdaki ilerleme önceki hesaba ait: silinmez, ayrı anahtarda saklanır; yeni hesabın hali açılır.
        const yedek = `${ANAHTAR}-yedek-hesap-${plan.onceki}-r${d.rev || 0}`;
        if (!localStorage.getItem(yedek)) localStorage.setItem(yedek, JSON.stringify(d));
        hk = { uid, eposta: u.email, tasinanMisafir: d.kimlik.misafir }; tam = true;
      } else if (plan.tur === "tasi") {
        const misafir = d.kimlik.misafir, sonSayac = kuyrukOku().sayac, anlik = JSON.parse(JSON.stringify(d));
        const r = await BulutCekirdek.esitle(db, zd, uid, [], { anlik, tabanAltin: plan.tabanAltin, tabanIlerleme: plan.tabanIlerleme });
        if (!gecerli()) return;
        Bulut._kuyrukYaz(_Es.misafirDevret(kuyrukOku(), misafir, sonSayac, uid));
        hk = { uid, eposta: u.email, tasinanMisafir: misafir }; Bulut.hkYaz(hk); sonH = r.h;
        const o = r.tasima && r.tasima.tasindi && r.tasima.ozet;
        if (o && o.kart + o.altin + o.esya > 0) { // taşınacak bir şey yoksa (ör. çıkıp aynı hesaba dönüş) pencere açılmaz
          setTimeout(() => pencere("☁️", "İlerlemen hesaba taşındı", `${o.kart} kelime, ${o.altin} altın ve ${o.esya} eşya hesabına eklendi. Artık başka cihazda da aynı hesapla girebilirsin.`, "Harika"), 50);
        }
      }
      for (let tur = 0; tur < 20; tur++) {
        const liste = _Es.gonderilecek(kuyrukOku(), uid, Date.now());
        if (!liste.length) break;
        const idler = liste.map(o => o.id);
        Bulut._kuyrukYaz(_Es.gonderimBasladi(kuyrukOku(), idler));
        try {
          const r = await BulutCekirdek.esitle(db, zd, uid, liste);
          if (!gecerli()) return;
          Bulut._kuyrukYaz(_Es.onaylandi(kuyrukOku(), r.onay)); sonH = r.h;
        } catch (e) { if (!gecerli()) return; Bulut._kuyrukYaz(_Es.basarisiz(kuyrukOku(), idler, Date.now())); throw e; }
      }
      if (!sonH) sonH = await BulutCekirdek.oku(db, uid);
      if (!gecerli()) return;
      if (Bulut.bekleyenSayisi(uid) === 0 && Bulut._yereleYaz(sonH, tam, tam ? hk : undefined) === false) throw new Error('Yerel kayıt yazılamadı');
      Bulut.durum = _Es.durumEtiketi(kuyrukOku(), uid);
    } catch (e) {
      if (!gecerli()) return;
      Bulut.durum = navigator.onLine === false ? "cevrimdisi" : "tekrar";
    } finally {
      if (Bulut._gorev !== gorev) return;
      Bulut._gorev = null;
      Bulut._calisiyor = false; Bulut._ciz();
      if (Bulut._tekrar) { Bulut._tekrar = false; setTimeout(() => Bulut.esitle(), 500); }
    }
  },
  // Hesaptaki hali cihaz kaydına yazar. Olay tabanı da güncellenir: bu değişiklik buluta geri olay olarak gitmez.
  _yereleYaz(h, tam, hesap) {
    const yeni = _Es.hesaptanYerele(d, h, tam);
    if (JSON.stringify(yeni) === JSON.stringify(d) && !hesap) return true;
    const onceki = d, oncekiTaban = olayTabani, oncekiDefter = bekleyenDefter;
    d = yeni; olayTabani = JSON.parse(JSON.stringify(d)); bekleyenDefter = [];
    if (kaydet(hesap)) {
      if (tam) Bulut.hesapYenilendi();
      if (typeof herSeyiCiz === "function") herSeyiCiz();
      const hk = Bulut.hkOku(), gorulen = new Set(hk.gorulenRet || []);
      const yeniRet = Object.values(h.alimRet || {}).filter(r => !gorulen.has(r.olay));
      if (yeniRet.length) {
        hk.gorulenRet = [...gorulen, ...yeniRet.map(r => r.olay)].slice(-200); Bulut.hkYaz(hk);
        if (typeof bildir === 'function') bildir('🪙 Hesap bakiyesi yetmediği için yeni alışveriş onaylanmadı. Altın kesilmedi.');
      }
      return true;
    }
    d = onceki; olayTabani = oncekiTaban; bekleyenDefter = oncekiDefter; return false;
  },
  // Ekranda gösterilecek tek satır. Bulut onayı gelmeden "yedeklendi" denmez.
  etiket() {
    return { yerel: "Yalnız bu cihazda kayıtlı", hazirDegil: "Yalnız bu cihazda kayıtlı", yukleniyor: "Hesap hazırlanıyor…",
      esitleniyor: "Eşitleniyor…", esitlendi: "✓ Bulutta yedekli", bekliyor: "Gönderilmeyi bekleyen değişiklik var",
      tekrar: "Gönderilemedi; birazdan tekrar denenecek", cevrimdisi: "İnternet yok; bağlanınca gönderilecek" }[Bulut.durum] || "";
  },
};

if (typeof module === "object" && module.exports) module.exports = { BulutCekirdek };
