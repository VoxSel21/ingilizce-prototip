// Saf savaş hesabı: toplamı tekrar eklemek yerine yalnız rekor farkı.
const SavasPuan = {
  fark(eski,yeni) { return Math.max(0,(Number(yeni)||0)-Math.max(0,Number(eski)||0)); },
  net(mod,dogru,yanlis,surum=2) {
    const deger={hiz:10,dinle:15,esles:20,cumle:30}[mod]||0;
    return Math.max(0,Math.round((dogru*deger-(surum>=2?yanlis*deger*.3:0))*10)/10);
  },
  havuz(liste,adet,karistir,seviyeIndisi=5) {
    const seviyeler=[...new Set(liste.map(x=>x[seviyeIndisi]))].sort(), gruplar=seviyeler.map(s=>karistir(liste.filter(x=>x[seviyeIndisi]===s))), sonuc=[];
    while(sonuc.length<adet&&gruplar.some(g=>g.length))for(const g of gruplar)if(g.length&&sonuc.length<adet)sonuc.push(g.pop());
    return karistir(sonuc);
  },
  yazim(s) { return String(s).normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").trim().replace(/\s+/g,' '); },
  kupa(kazanan,kaybeden) { return Math.max(25,Math.min(35,25+Math.round(10*(kazanan-kaybeden)/Math.max(kazanan,1)))); },
};
if(typeof module==='object'&&module.exports)module.exports={SavasPuan};
