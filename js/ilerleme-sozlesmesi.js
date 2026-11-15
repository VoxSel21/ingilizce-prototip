// Hesap ilerlemesinin birleştirme kuralları; zaman, ağ ve DOM bağımlılığı yoktur.
const _IlModel = typeof DurumModeli !== 'undefined' ? DurumModeli : require('./durum-modeli.js').DurumModeli;
const ILERLEME_ALAN = {
  kilo: 'topla', koruyucu: 'topla', cumleDogru: 'topla', tepki: 'topla', ikiliBiten: 'topla', kurSira: 'topla',
  enUzun: 'enBuyuk', ilkDers: 'enBuyuk', avGunu: 'enBuyuk', eslesGunu: 'enBuyuk', sohbetOdulGunu: 'enBuyuk',
  eslesRekor: 'enKucuk', rozet: 'birlesim', calisilanlar: 'birlesim', sohbetOkundu: 'birlesim', korunan: 'birlesim', avlar: 'birlesim', ceteOdul: 'birlesim', tanisGun: 'sayacHaritasi',
  bugun: 'gunluk', antrenman: 'antrenman', savas: 'rekorlar', savasRekorlari:'savasArsiv', ikili: 'son', avSonuc: 'son', miyav: 'son', sevgi: 'son', seviyeSinav:'son', degerlendirme:'son',
};
const IlSozlesme = {
  cikar(d) { const v = {}; for (const ad of Object.keys(ILERLEME_ALAN)) if (d[ad] !== undefined) v[ad] = JSON.parse(JSON.stringify(d[ad])); return v; },
  farklar(once, simdi) {
    const out = [];
    for (const [ad, tur] of Object.entries(ILERLEME_ALAN)) {
      const a = once[ad], b = simdi[ad]; if (b === undefined || JSON.stringify(a) === JSON.stringify(b)) continue;
      let deger = b;
      if (tur === 'topla') deger = Math.round(((Number(b) || 0) - (Number(a) || 0)) * 10000) / 10000;
      if (tur === 'sayacHaritasi') { deger = {}; for (const k of Object.keys(b)) if (b[k] !== (a || {})[k]) deger[k] = b[k] - ((a || {})[k] || 0); }
      if (tur === 'savasArsiv') { deger={};for(const id of Object.keys(b))if(JSON.stringify(b[id])!==JSON.stringify((a||{})[id]))deger[id]=b[id]; }
      if (tur === 'gunluk' || tur === 'antrenman') {
        const gunAlan = tur === 'gunluk' ? 'no' : 'gun';
        const eski = a && a[gunAlan] === b[gunAlan] ? a : {};
        deger = { ...b };
        for (const k of tur === 'gunluk' ? ['sayi', 'dogru'] : ['tekrar', 'kg']) deger[k] = (b[k] || 0) - (eski[k] || 0);
      }
      out.push({ tur: 'ilerleme', veri: { ad, deger } });
    }
    return out;
  },
  uygula(h, ad, deger, zaman = 0, olay = '') {
    const tur = ILERLEME_ALAN[ad]; if (!tur) return;
    const eski = h.ilerleme[ad], taban = _IlModel.yeni(0)[ad];
    let yeni;
    if (tur === 'topla') {
      if (!Number.isFinite(deger)) return;
      yeni = Math.round(((Number(eski === undefined ? taban : eski) || 0) + deger) * 10000) / 10000;
      yeni = ad === 'kilo' ? Math.min(9.5, Math.max(3, yeni)) : Math.max(0, yeni);
    } else if (tur === 'enBuyuk' || tur === 'enKucuk') {
      if (!Number.isFinite(deger)) return;
      yeni = tur === 'enBuyuk' ? Math.max(eski || 0, deger) : eski > 0 ? Math.min(eski, deger) : deger;
    } else if (tur === 'birlesim' || tur === 'sayacHaritasi') {
      if (!deger || typeof deger !== 'object' || Array.isArray(deger)) return;
      yeni = { ...(eski || {}) };
      for (const k of Object.keys(deger)) if (Number.isFinite(deger[k])) yeni[k] = tur === 'sayacHaritasi' ? Math.max(0, (yeni[k] || 0) + deger[k]) : Math.max(yeni[k] || 0, deger[k]);
    } else if (tur === 'gunluk' || tur === 'antrenman') {
      if (!deger || typeof deger !== 'object') return;
      const gun = tur === 'gunluk' ? 'no' : 'gun';
      if (eski && eski[gun] > deger[gun]) return;
      const a = eski && eski[gun] === deger[gun] ? eski : {};
      yeni = { ...deger };
      for (const k of tur === 'gunluk' ? ['sayi', 'dogru'] : ['tekrar', 'kg']) yeni[k] = Math.round(((a[k] || 0) + (deger[k] || 0)) * 10000) / 10000;
      if (tur === 'gunluk') yeni.hediye = !!(a.hediye || deger.hediye);
    } else if (tur === 'savasArsiv') {
      if(!deger || typeof deger!=='object' || Array.isArray(deger))return;
      yeni=JSON.parse(JSON.stringify(eski||{}));
      for(const [id,p]of Object.entries(deger).slice(0,500)){
        if(!/^[A-Za-z0-9]{20}$/.test(id)||!p||typeof p!=='object')continue;
        yeni[id] ||= {};
        for(const mod of ['hiz','dinle','cumle','esles'])if(Number.isInteger(p[mod]*2)&&p[mod]>=0&&p[mod]<=10000)yeni[id][mod]=Math.max(yeni[id][mod]||0,p[mod]);
      }
      while(Object.keys(yeni).length>500)delete yeni[Object.keys(yeni)[0]];
    } else if (tur === 'rekorlar') {
      if (!deger || typeof deger !== 'object') return;
      if (eski && eski.hafta > deger.hafta) return;
      yeni = { hafta: deger.hafta, kuralSurum:deger.kuralSurum||1, eskiEn:deger.eskiEn||{}, en: { ...(eski && eski.hafta === deger.hafta && (eski.kuralSurum||1)===(deger.kuralSurum||1) ? eski.en : {}) } };
      for (const k of Object.keys(deger.en || {})) yeni.en[k] = Math.max(yeni.en[k] || 0, deger.en[k]);
    } else {
      const son = h.ilerlemeSaat[ad];
      if (son && (son.zaman > zaman || (son.zaman === zaman && son.olay >= olay))) return;
      h.ilerlemeSaat[ad] = { zaman, olay }; yeni = deger;
    }
    h.ilerleme[ad] = JSON.parse(JSON.stringify(yeni));
  },
};
if (typeof module === 'object' && module.exports) module.exports = { IlSozlesme, ILERLEME_ALAN };
