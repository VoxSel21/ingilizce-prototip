// Durum ve gönderim kuyruğu tek setItem ile kalıcılaşır. Eski anahtarlar geri dönüş için korunur.
const YerelKayit = {
  olustur(depo, anahtar) {
    const butun = anahtar + '-butun';
    function oku() {
      const ham = depo.getItem(butun);
      if (ham != null) {
        const v = JSON.parse(ham);
        if (!v || v.surum !== 1 || typeof v.durum !== 'string' || !v.kuyruk || typeof v.kuyruk !== 'object') throw new Error('Kayıt zarfı bozuk');
        return v;
      }
      const hamKuyruk = depo.getItem(anahtar + '-kuyruk');
      return { surum: 1, durum: depo.getItem(anahtar), kuyruk: hamKuyruk ? JSON.parse(hamKuyruk) : null };
    }
    return {
      oku,
      yaz(durum, kuyruk, hesap) {
        if (hesap === undefined) hesap = this.hesapOku();
        depo.setItem(butun, JSON.stringify({ surum: 1, durum, kuyruk, hesap }));
      },
      kuyrukYaz(kuyruk) {
        const v = oku();
        if (typeof v.durum !== 'string') throw new Error('Ana kayıt hazır değil');
        this.yaz(v.durum, kuyruk);
      },
      hesapOku() {
        const v = oku();
        if (v.hesap && typeof v.hesap === 'object') return v.hesap;
        return JSON.parse(depo.getItem(anahtar + '-hesap')) || {};
      },
      hesapYaz(hesap) {
        const v = oku();
        if (typeof v.durum === 'string') this.yaz(v.durum, v.kuyruk || {}, hesap);
        else depo.setItem(anahtar + '-hesap', JSON.stringify(hesap));
      },
    };
  },
};
if (typeof module === 'object' && module.exports) module.exports = { YerelKayit };
