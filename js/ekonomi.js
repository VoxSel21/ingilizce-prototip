// ================= EKONOMİ: altının bütün girişleri ve çıkışları =================
// Saf mantık (Node testleri de yükler). Ödül miktarları burada, eşya/kürk/arka plan fiyatları kendi
// tablolarında (ESYALAR, KURKLER, TEMALAR). Arayüz altını doğrudan değiştirmez: Ekonomi.kazan / harca / satinAl.
// Miktarlar 1. aşamada eskisiyle aynı bırakıldı (yalnız cümle turu ödülüne günlük sınır kondu);
// denge ayarı 4. aşamada simülasyon tablosuyla yapılacak: araclar/ekonomi-simulasyon.cjs.
const EKONOMI = {
  baslangicAltin: 3,
  odul: {
    gunlukHediye: { taban: 2, bonus: 1, bonusOlasilik: 0.3 }, // günlük hedef (10 soru) dolunca, günde bir
    cumleTuru: { miktar: 1, enAzDogru: 3, gunlukSinir: 3 },   // 5 cümlede en az 3 doğru; günde en çok 3 tur
    eslesme: { miktar: 1, sureSiniri: 45 },                    // Pati Çabukluğu 45 sn altı, günde bir
    balikAvi: { miktar: 1 },                                   // balığa ulaşınca, günde bir; sonrakiler ödülsüz pratik
    sohbet: { miktar: 1 },                                     // öğrenilen kelimeyi sohbette kullanmak, günde bir
  },
  fiyat: { koruyucu: 3 },
  // Günlük ödül anahtarlarının ön ekleri: defterde 90 günden eskileri silinir; rozet/çete/ikili kalıcıdır.
  gunlukOnEk: ["hediye", "cumle", "esles", "av", "sohbet"],
};

const Ekonomi = {
  tamSayi: x => Math.max(0, Math.floor(Number(x) || 0)),

  // Aynı anahtar (ör. "hediye:20748", "rozet:on") bir kez ödenir. Ödenen miktarı döndürür (zaten ödendiyse 0).
  kazan(d, anahtar, miktar, bugun) {
    d.odulDefteri = d.odulDefteri || {};
    miktar = Ekonomi.tamSayi(miktar);
    if (!anahtar || d.odulDefteri[anahtar] != null || miktar === 0) return 0;
    d.odulDefteri[anahtar] = bugun != null ? bugun : 0;
    d.yildiz = Ekonomi.tamSayi(d.yildiz) + miktar;
    return miktar;
  },
  // Günde birden çok kez verilebilen ödül: "cumle:<gün>:0", ":1"... ilk boş sıraya yazılır.
  kazanSinirli(d, onEk, bugun, sinir, miktar) {
    for (let i = 0; i < sinir; i++) {
      const a = `${onEk}:${bugun}:${i}`;
      if (!(d.odulDefteri || {})[a]) return Ekonomi.kazan(d, a, miktar, bugun);
    }
    return 0;
  },
  odendiMi: (d, anahtar) => !!(d.odulDefteri && d.odulDefteri[anahtar] != null),

  // Bakiye yetmezse hiçbir şey değişmez; bakiye hiçbir zaman eksiye düşmez.
  harca(d, miktar) {
    if (!Number.isInteger(miktar) || miktar < 0) return false;
    const bakiye = Ekonomi.tamSayi(d.yildiz);
    if (bakiye < miktar) return false;
    d.yildiz = bakiye - miktar;
    return true;
  },
  // Sahiplik ve bakiye aynı anda kontrol edilir: sahip olunan tekrar ücretlendirilmez, çift dokunma çift ödeme yapmaz.
  // Sonuç: "tamam" | "zaten" | "yetersiz".
  satinAl(d, liste, id, fiyat) {
    d[liste] = d[liste] || [];
    if (d[liste].includes(id)) return "zaten";
    if (!Ekonomi.harca(d, fiyat)) return "yetersiz";
    d[liste].push(id);
    return "tamam";
  },
  defterTemizle(d, bugun, gun = 90) {
    for (const [a, g] of Object.entries(d.odulDefteri || {}))
      if (EKONOMI.gunlukOnEk.includes(a.split(":")[0]) && g < bugun - gun) delete d.odulDefteri[a];
  },
};

if (typeof module === "object" && module.exports) module.exports = { EKONOMI, Ekonomi };
