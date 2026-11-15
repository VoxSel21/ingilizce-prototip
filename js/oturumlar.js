// Ekran kapatma, oyunların iç değişkenlerini bilmez; her özellik kendi temizliğine sahiptir.
const Oturumlar = (() => {
  const kayitlar = new Map();
  return {
    ekle(ad, kapat, aktif = () => false, uyari = () => null, ekran = ad) { kayitlar.set(ad, { kapat, aktif, uyari, ekran }); },
    aktif(ad) { for (const [isim, k] of kayitlar) if ((isim === ad || k.ekran === ad) && k.aktif()) return true; return false; },
    uyari(ad) { for (const [isim, k] of kayitlar) if (isim === ad || k.ekran === ad) { const yazi = k.uyari(); if (yazi) return yazi; } return null; },
    kapat(ekran = null) { for (const k of kayitlar.values()) if (!ekran || k.ekran === ekran || k.ekran === '*') k.kapat(); },
  };
})();
if (typeof module === 'object' && module.exports) module.exports = { Oturumlar };
