// ================= FIREBASE AYARI: hesap ve bulut eşitlemesinin TEK ayar yeri =================
// Şimdilik gerçek Firebase projesi yok: "demo-" ile başlayan proje kimliği yalnız bilgisayardaki emülatörde
// (Firebase'in deneme sürümü) çalışır, hiçbir hesap istemez. Emülatör yalnız geliştirme sunucusunda
// (localhost + port) kullanılır; yayındaki site ve telefon uygulamasında hesap bölümü "henüz hazır değil" der.
// Gerçek projeye geçiş (degerlendirmeler/asama-5-plani.md): Firebase konsolundaki web uygulaması ayarını
// "proje" içine yapıştır, emulator'ü null yap. Bu değerler gizli değildir (her web uygulamasında görünür);
// verinin korunmasını firestore.rules sağlar.
const FIREBASE_AYAR = {
  proje: {
    apiKey: "demo-anahtar",
    authDomain: "demo-pati.firebaseapp.com",
    projectId: "demo-pati",
    appId: "demo-pati",
  },
  emulator: { auth: "http://127.0.0.1:9099", firestoreHost: "127.0.0.1", firestorePort: 8080 },
};

if (typeof module === "object" && module.exports) module.exports = { FIREBASE_AYAR };
