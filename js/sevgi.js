// Görsel bağ; öğrenme puanı/altını etkilemez. Aynı anda iki cihazda son etkileşim kazanır.
const Sevgi = {
  deger(s, simdi = Date.now()) {
    if (!s) return 30;
    return Math.max(0, Math.min(100, s.deger - Math.max(0, simdi - s.zaman) / 3600000));
  },
  oksa(s, simdi = Date.now()) {
    if (s && simdi - s.zaman < 2000) return s;
    return { deger: Math.min(100, Sevgi.deger(s, simdi) + 5), zaman: simdi };
  },
};
if (typeof module === 'object' && module.exports) module.exports = { Sevgi };
