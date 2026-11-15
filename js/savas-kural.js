const _SavasP=typeof SavasPuan!=='undefined'?SavasPuan:require('./savas-puan.js').SavasPuan;
const SAVAS = { sureMs:72*3600000, baslangicKupasi:100, davetBeklemeMs:24*3600000, modlar:['hiz','dinle','cumle','esles'], enCokPuan:{hiz:1200,dinle:900,cumle:900,esles:1800} }; // firestore.rules tavan() ile aynı
const SavasKural = {
  skor(p={}) { return Object.fromEntries(SAVAS.modlar.map(m=>[m,Math.max(0,Number(p[m])||0)])); },
  toplam(p={}) { return SAVAS.modlar.reduce((n,m)=>n+(p[m]||0),0); },
  takim(w,id) { return (w.uyeler[id]||[]).reduce((n,uid)=>n+SavasKural.toplam(w.puanlar[uid]),0); },
  siralama(w,id) { return (w.uyeler[id]||[]).map(uid=>({uid,ad:w.uyeAdlari[uid]||'Üye',puan:SavasKural.toplam(w.puanlar[uid])})).sort((a,b)=>b.puan-a.puan||a.uid.localeCompare(b.uid)); },
  bitis(w) { return w.baslangic ? w.baslangic.toMillis()+SAVAS.sureMs : 0; },
  sonuc(w,kupalar) {
    const [a,b]=w.ceteler,pa=SavasKural.takim(w,a),pb=SavasKural.takim(w,b),kazanan=pa===pb?null:pa>pb?a:b,kaybeden=kazanan===a?b:a;
    return {pa,pb,kazanan,miktar:kazanan?Math.min(kupalar[kaybeden],_SavasP.kupa(Math.max(pa,pb),Math.min(pa,pb))):0};
  },
};
if(typeof module==='object'&&module.exports)module.exports={SavasKural,SAVAS};
