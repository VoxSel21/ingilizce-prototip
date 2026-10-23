// ================= FIREBASE AYARI: hesap ve bulut eşitlemesinin TEK ayar yeri =================
// İki proje var, hangisinin kullanılacağına sayfa açılırken bir kez karar verilir (firebaseAyarSec):
// - GERCEK_PROJE (pati-ingilizce, Spark/ücretsiz): yayındaki site ve telefon uygulaması (APK) bunu kullanır.
// - DENEME_PROJE (demo-pati) + emülatör: yalnız bilgisayardaki geliştirme sunucusu (localhost/127.0.0.1 + port)
//   ve Node testleri. "demo-" ile başlayan proje yalnız emülatörde çalışır; deneme verisi gerçek projeye karışmaz.
//   APK da adres olarak "localhost" kullanır ama port yoktur ve Capacitor içindedir: o yüzden gerçek projeye gider.
// - Geliştirme sunucusunda gerçek projeyi denemek için adrese ?bulut=gercek eklenir (o sekme boyunca geçerli).
// Bu değerler gizli değildir (her web uygulamasında görünür); verinin korunmasını firestore.rules sağlar.
const GERCEK_PROJE = {
  apiKey: "AIzaSyAj3uBBmf2eV-X98LdBpsHZZzB7zXj5wMo",
  authDomain: "pati-ingilizce.firebaseapp.com",
  projectId: "pati-ingilizce",
  storageBucket: "pati-ingilizce.firebasestorage.app",
  messagingSenderId: "575532567314",
  appId: "1:575532567314:web:72fa678bb599b1bb8341cb",
};
const DENEME_PROJE = { apiKey: "demo-anahtar", authDomain: "demo-pati.firebaseapp.com", projectId: "demo-pati", appId: "demo-pati" };
const EMULATOR = { auth: "http://127.0.0.1:9099", firestoreHost: "127.0.0.1", firestorePort: 8080 };

// Saf karar: { hostname, port, yerli (Capacitor içinde mi), gercekIste (?bulut=gercek) } → { proje, emulator }.
function firebaseAyarSec(o) {
  const gelistirme = !o.yerli && /^(localhost|127\.0\.0\.1)$/.test(o.hostname || "") && (o.port || "") !== "";
  return gelistirme && !o.gercekIste ? { proje: DENEME_PROJE, emulator: EMULATOR } : { proje: GERCEK_PROJE, emulator: null };
}

const FIREBASE_AYAR = typeof location === "undefined" ? { proje: DENEME_PROJE, emulator: EMULATOR } : (() => {
  let gercekIste = false;
  try {
    if (new URLSearchParams(location.search).get("bulut") === "gercek") sessionStorage.setItem("pati-bulut-gercek", "1");
    gercekIste = sessionStorage.getItem("pati-bulut-gercek") === "1";
  } catch (e) {}
  const yerli = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  return firebaseAyarSec({ hostname: location.hostname, port: location.port, yerli, gercekIste });
})();

if (typeof module === "object" && module.exports) module.exports = { FIREBASE_AYAR, GERCEK_PROJE, DENEME_PROJE, firebaseAyarSec };
