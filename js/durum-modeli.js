// Hesap başlangıcı ve cihaz tercihleri için ortak sözleşme; DOM/depolama bilmez.
const _ModelKayit = typeof SEMA_SURUM !== 'undefined' ? SEMA_SURUM : require('./kayit.js').SEMA_SURUM;
const _ModelEkonomi = typeof EKONOMI !== 'undefined' ? EKONOMI : require('./ekonomi.js').EKONOMI;
const DurumModeli = {
  cihazAlanlari: ['ayar', 'sesKapali', 'konusmaKapali', 'sonRenkler'],
  yeni(gun) {
    return { surum: _ModelKayit, yildiz: _ModelEkonomi.baslangicAltin, koruyucu: 1, kartlar: {}, calisilanlar: {}, gunler: {}, korunan: {},
      bugun: { no: gun, sayi: 0, dogru: 0, hediye: false }, cumleDogru: 0, tepki: 0, enUzun: 0, tema: 'bahce', temalar: ['bahce', 'cayir'], rozet: {},
      kediAd: 'Pati', kediStil:'klasik', kilo: 4, seviye: 'A1', kurk: 'turuncu', kurklar: ['turuncu'], kurkRenk: '#FDBE86', sonRenkler: [], esyalar: [], giyili: { sapka: null, boyun: null, goz: null },
      odulDefteri: {}, ayar: { hedef: 10, tema: 'sistem', hareket: 'sistem', titresim: true, seslendirme: true },
      oturum: null, sonSunulan: [], antrenman: null, ilkDers: 0, kimlik: null, sevgi: null, sohbetOkundu: {}, savasRekorlari: {}, seviyeSinav:null, degerlendirme:null };
  },
};
if (typeof module === 'object' && module.exports) module.exports = { DurumModeli };
