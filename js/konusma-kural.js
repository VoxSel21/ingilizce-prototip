const KonusmaKural={
  temizle(t){return String(t).toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z' ]/g,' ').replace(/\s+/g,' ').trim();},
  sonuc(hedef,liste){const duyulan=(liste||[]).map(KonusmaKural.temizle).filter(Boolean),h=KonusmaKural.temizle(hedef);return duyulan.length?{ok:duyulan.some(t=>t===h||(' '+t+' ').includes(' '+h+' ')),duyulan:duyulan[0]}:{hata:'bos'};},
};
if(typeof module==='object'&&module.exports)module.exports={KonusmaKural};
