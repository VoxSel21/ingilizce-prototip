// Başlangıç bileşimi: saf çete kuralları ile Firestore adaptörünü burada bağla.
const _CeteVeri = typeof CeteVeri !== 'undefined' ? CeteVeri : require('./cete-veri.js').CeteVeri;
const _CeteKural = typeof CeteKural !== 'undefined' ? { CeteKural, CETE } : require('./cete.js');
const CeteCekirdek = _CeteVeri.olustur(_CeteKural.CeteKural, _CeteKural.CETE);
if (typeof module === 'object' && module.exports) module.exports = { CeteCekirdek };
