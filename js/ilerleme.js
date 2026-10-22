// ================= ORTAK İLERLEME KURALLARI =================
// Saf mantık (Node testleri de yükler). Seri, takvim ve rozetler aynı kuralı kullanır.
// Nitelikli çalışma günü: o gün en az bir öğrenme sorusu cevaplandı (kart, phrasal, harf, Kelime Kur, cümle)
// ya da kelimeli bir oyun bitirildi (Pati Çabukluğu, balık avı, çete savaşı). Sohbete yazmak gün saymaz.
// Seri koruyucu: dün çalışılmadıysa ve önceki gün çalışıldıysa bir koruyucu harcanır, dün "korunan" olur.
// Korunan gün seriyi kesmez ama çalışılmış gün sayılmaz (seri uzunluğuna eklenmez).
const Ilerleme = {
  seri(gunler, korunan, bugun) {
    let s = 0, g = bugun;
    if (!gunler[g]) g--;
    while (gunler[g] || korunan[g]) { if (gunler[g]) s++; g--; }
    return s;
  },
  // Gün değişince bir kez çağrılır. Yeni koruyucu sayısını ve korunan günleri döndürür.
  koruyucuUygula(gunler, korunan, koruyucu, bugun) {
    const dun = bugun - 1;
    if (!gunler[dun] && !korunan[dun] && gunler[dun - 1] && koruyucu > 0) return { koruyucu: koruyucu - 1, korunan: { ...korunan, [dun]: 1 } };
    return { koruyucu, korunan };
  },
  // Bir soru cevaplandı: günlük hedef deneme sayısını sayar (yanlış da çalışmadır), doğrular ayrıca tutulur.
  soruSay(bugunKaydi, dogru) {
    bugunKaydi.sayi = (bugunKaydi.sayi || 0) + 1;
    if (dogru) bugunKaydi.dogru = (bugunKaydi.dogru || 0) + 1;
    return bugunKaydi;
  },
};

if (typeof module === "object" && module.exports) module.exports = { Ilerleme };
