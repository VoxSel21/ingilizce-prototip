const _CalOyun = typeof Kilo !== 'undefined' ? { Kilo, Antrenman } : require('./oyun.js');
const _CalIlerleme = typeof Ilerleme !== 'undefined' ? Ilerleme : require('./ilerleme.js').Ilerleme;
const _CalBeceri = typeof BeceriKural !== 'undefined' ? BeceriKural : require('./beceri-kural.js').BeceriKural;
// Bir cevabın kalıcı etkisi; çizim, ses, zamanlayıcı veya depolama çalıştırmaz.
const CalismaIslemi = {
  cevapla(d, o, a, id, dogru, gun, aralik) {
    if (o.cevaplanan === o.i) return null;
    _CalIlerleme.kelimeIsaretle(d, id);
    o.kilit = true; o.cevaplanan = o.i;
    const c = d.kartlar[id]; let kg = null;
    // Aynı turda tanışılan kelimenin yazma pratiği: doğruysa yalnız sayılır (kilo ve kutu yok); önceki yanlış
    // kelimeyi bugüne bıraktıysa yarına geri alır. Yanlışı aşağıdaki normal yanlış yolundan geçer.
    if (a.pekistir && dogru) {
      o.dogru++;
      if (c && c.sira <= gun) d.kartlar[id] = { ...c, sira: gun + 1 };
      return { kg };
    }
    if (!c) { d.tanisGun = d.tanisGun || {}; d.tanisGun[gun] = (d.tanisGun[gun] || 0) + 1; }
    if (dogru) {
      o.dogru++;
      kg = _CalOyun.Kilo.adimUygula(d, o, o.i, _CalOyun.Kilo.cevapFarki({ dogru, spor: o.spor, yeni: !c, tekrar: a.tekrar }));
      if (o.spor && kg !== null) { _CalOyun.Antrenman.say(d, gun, kg); o.sonKg = kg; }
      const hata = Math.max(0, ((c && c.hata) || 0) - (a.tekrar ? 0 : 1));
      if (a.tekrar || !c) d.kartlar[id] = { ...c, kutu: 1, sira: gun + 1, hata };
      else if (c.sira <= gun) { const kutu = Math.min(4, c.kutu + 1); d.kartlar[id] = { ...c, kutu, sira: gun + aralik[kutu], hata }; }
      else d.kartlar[id] = { ...c, hata };
    } else {
      o.yanlis++; d.kartlar[id] = { ...c, kutu: 1, sira: gun, hata: ((c && c.hata) || 0) + 1 };
      o.sira.push({ tip: 'soru', id, tekrar: true, ...(a.beceri ? { beceri: a.beceri } : {}), ...(a.pekistir ? { pekistir: true } : {}) });
    }
    if (a.beceri && !a.pekistir && ['secme', 'yazma', 'dinleme'].includes(a.beceri)) {
      const beceriler = { ...(c?.beceriler || {}) };
      beceriler[a.beceri] = _CalBeceri.cevapla(beceriler[a.beceri], dogru, gun, o.cevapZamani || Date.now(), !!a.tekrar);
      const b = beceriler[a.beceri], yeni = d.kartlar[id];
      // Kutu ve sıra yukarıdaki Leitner sonucundan (yeni) gelir, eski karttan (c) değil: yanlış cevap kutuyu 1'e
      // indirir ve kelimeyi bugüne bırakır; doğru cevapta FSRS tarihi ve beceri durumu kutuyu yükseltebilir.
      // Doğru cevap kelimeyi en erken yarına atar: aynı gün tekrar havuzunda kalıp kutuyu şişirmez.
      d.kartlar[id] = dogru
        ? { ...yeni, beceriler, kutu: Math.max(yeni.kutu || 0, _CalBeceri.durum(b) === 'pekismis' ? 4 : 2),
            sira: gun + Math.max(1, Math.ceil((Date.parse(b.kart.due) - (o.cevapZamani || Date.now())) / 86400000)) }
        : { ...yeni, beceriler };
    }
    return { kg };
  },
};
if (typeof module === 'object' && module.exports) module.exports = { CalismaIslemi };
