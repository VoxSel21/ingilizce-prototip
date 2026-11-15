// FSRS zamanlaması + Pati'nin beceri/pekişme sözleşmesi. DOM, ağ ve depolama içermez.
const _Fsrs = typeof FSRS !== 'undefined' ? FSRS : require('ts-fsrs');
const BECERILER = { secme: 'Dört seçenek', yazma: 'Anlamından yaz', dinleme: 'Dinlediğini yaz', telaffuz: 'Telaffuz', karma: 'Karma' };
const BeceriKural = {
  zamanlayici: _Fsrs.fsrs({ request_retention: 0.9, enable_fuzz: false, enable_short_term: true }),
  durum(b) { return !b ? 'yeni' : b.gunler.length >= 3 && b.sonIki.length === 2 && b.sonIki.every(Boolean) ? 'pekismis' : 'gelisiyor'; },
  cevapla(eski, dogru, gun, zaman, duzeltme = false) {
    const b = eski ? JSON.parse(JSON.stringify(eski)) : { gunler: [], sonIki: [], sonGun: null, kart: null };
    // Aynı gün tekrarlamak veya cevabı az önce görmek, uzun süreli hatırlama kanıtı değildir.
    const planli = !duzeltme && b.sonGun !== gun && (!b.kart || new Date(b.kart.due).getTime() <= zaman);
    if (planli || !dogru) {
      const kart = b.kart ? { ...b.kart, due: new Date(b.kart.due), last_review: b.kart.last_review ? new Date(b.kart.last_review) : undefined } : _Fsrs.createEmptyCard(new Date(zaman));
      b.kart = this.zamanlayici.next(kart, new Date(zaman), dogru ? _Fsrs.Rating.Good : _Fsrs.Rating.Again).card;
    }
    if (planli) {
      b.sonIki = [...b.sonIki, dogru].slice(-2);
      b.sonGun = gun;
      if (dogru) b.gunler = [...new Set([...b.gunler, gun])].slice(-3);
    } else if (!dogru) b.sonIki = [...b.sonIki, false].slice(-2);
    return JSON.parse(JSON.stringify(b));
  },
  gecerli(b) {
    return !!b && Array.isArray(b.gunler) && b.gunler.length <= 3 && b.gunler.every(Number.isInteger)
      && Array.isArray(b.sonIki) && b.sonIki.length <= 2 && b.sonIki.every(x => typeof x === 'boolean')
      && (b.sonGun === null || Number.isInteger(b.sonGun)) && !!b.kart
      && Number.isFinite(Date.parse(b.kart.due)) && Number.isFinite(Date.parse(b.kart.last_review))
      && ['stability', 'difficulty', 'elapsed_days', 'scheduled_days', 'reps', 'lapses', 'learning_steps', 'state'].every(k => Number.isFinite(b.kart[k]) && b.kart[k] >= 0)
      && Number.isInteger(b.kart.state) && b.kart.state <= 3 && b.kart.difficulty <= 10;
  },
  turler(mod, telaffuzVar, rastgele = Math.random) {
    if (mod !== 'karma') return [mod];
    const turler = ['secme', 'yazma', 'dinleme'];
    if (telaffuzVar) turler.push('telaffuz');
    for (let i = turler.length - 1; i > 0; i--) { const j = Math.floor(rastgele() * (i + 1)); [turler[i], turler[j]] = [turler[j], turler[i]]; }
    return turler;
  },
  birlestir(a = {}, b = {}, bYeni = true) {
    const sonuc = { ...(bYeni ? a : b), ...(bYeni ? b : a) }, beceriler = { ...(a.beceriler || {}) };
    for (const [ad, gelen] of Object.entries(b.beceriler || {})) {
      if (!['secme','yazma','dinleme'].includes(ad) || !this.gecerli(gelen)) continue;
      const eski = beceriler[ad], gt = Date.parse(gelen.kart.last_review), et = Date.parse(eski?.kart?.last_review) || 0;
      const son = !eski || gt > et || gt === et && bYeni ? gelen : eski;
      beceriler[ad] = { ...son, gunler: [...new Set([...(eski?.gunler || []), ...gelen.gunler])].sort((x,y)=>x-y).slice(-3) };
    }
    if (Object.keys(beceriler).length) sonuc.beceriler = beceriler;
    return sonuc;
  },
};
if (typeof module === 'object' && module.exports) module.exports = { BeceriKural, BECERILER };
