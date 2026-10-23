// ================= SOHBET: kaydırma, klavye, metin kuralları =================
// Saf mantık (Node testleri de yükler). 6. aşama 1. parça (2026-10-23, U07):
// - Kullanıcı eski mesajları okurken liste zorla en alta inmez; "yeni mesaj" göstergesi çıkar.
// - Kendi mesajını gönderince her zaman en alta iner.
// - Klavye açılınca ekranın görünen yüksekliği küçülür; aradaki fark gönderme alanının altına boşluk olur.
// - Metin: kontrol karakterleri ve fazla boşluk temizlenir, sınırdan uzunu kesilir; gösterim her zaman textContent.
const SOHBET = { altEsik: 48, mesajSinir: 160, gosterilen: 30 };

const Sohbet = {
  // Liste en alttaysa (birkaç piksel pay ile) true.
  alttaMi(ustKaydirma, toplamYukseklik, gorunenYukseklik, esik = SOHBET.altEsik) {
    return toplamYukseklik - ustKaydirma - gorunenYukseklik <= esik;
  },
  // Yeni çizimden sonra ne yapılacak: "in" (en alta kaydır), "goster" (yeni mesaj göstergesi), "dur" (dokunma).
  kaydirmaKarari({ altta, benim, yeniVar }) {
    if (benim) return "in";
    if (!yeniVar) return "dur";
    return altta ? "in" : "goster";
  },
  // Klavyenin kapladığı yükseklik: sayfa yüksekliği − görünen alan. Sayfa zaten küçüldüyse (Android) 0 çıkar.
  klavyeBoslugu(sayfaYukseklik, gorunenYukseklik, gorunenUst = 0) {
    const fark = Math.round(sayfaYukseklik - gorunenYukseklik - gorunenUst);
    return fark > 0 ? fark : 0;
  },
  temizle(metin, sinir = SOHBET.mesajSinir) {
    return String(metin == null ? "" : metin)
      .replace(/[\u0000-\u001F\u007F​-‏‪-‮⁦-⁩]/g, " ")
      .replace(/\s+/g, " ").trim().slice(0, sinir);
  },
  // Ekranın üstündeki durum satırı: önce hata, sonra bağlantı, sonra "yazıyor", yoksa boş durum.
  durumSatiri({ mesajSayisi, cevrimici, yaziyor, hata }) {
    if (hata) return { tur: "hata", metin: hata };
    if (cevrimici === false) return { tur: "baglanti", metin: "📴 Bağlantı yok. Demo sohbet bu cihazda çalışmaya devam eder; mesajların yalnız burada." };
    if (yaziyor) return { tur: "yaziyor", metin: `${yaziyor} yazıyor…` };
    if (!mesajSayisi) return { tur: "bos", metin: "Henüz mesaj yok. İlk mesajı sen yaz: öğrendiğin bir kelimeyle cümle kur!" };
    return null;
  },
  // Şablon metinlere giren her ad bundan geçer (sabit örnek veri bile olsa, ileride dışarıdan gelebilir).
  kacis(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },
};

if (typeof module === "object" && module.exports) module.exports = { SOHBET, Sohbet };
