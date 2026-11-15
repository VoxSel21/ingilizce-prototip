const KupaEslesme={
  aralik(zaman,simdi=Date.now()){return Math.min(300,50+Math.floor(Math.max(0,simdi-zaman)/60000)*50);},
  uygun(a,b,simdi=Date.now()){
    return a.id!==b.id&&simdi-a.zaman>=0&&simdi-b.zaman>=0&&simdi-a.zaman<300000&&simdi-b.zaman<300000&&Math.abs(a.kupa-b.kupa)<=Math.min(KupaEslesme.aralik(a.zaman,simdi),KupaEslesme.aralik(b.zaman,simdi));
  },
};
const _KupaSavas=typeof SavasVeri!=='undefined'?SavasVeri:require('./savas-veri.js').SavasVeri;
const KupaVeri={
  ref:(c,id)=>c.db.collection('savasKuyruk').doc(id),
  // Kuyruk kaydı eşleşme için çetenin ad/üye/takma ad kopyasını taşır; rakip çete belgesi (davet kodu) okunmaz.
  async ara(c,uid,cid){const [durum,cete]=await Promise.all([_KupaSavas.durum(c,cid).get(),c.db.collection('ceteler').doc(cid).get()]);const k=cete.data();await KupaVeri.ref(c,cid).set({uid,kupa:durum.exists?durum.data().kupa:100,zaman:c.F.FieldValue.serverTimestamp(),ad:k.ad,uyeler:k.uyeler,adlar:k.adlar});},
  async eslestir(c,uid,a,b){
    const ref=c.db.collection('savaslar').doc();
    return c.db.runTransaction(async tx=>{
      const [qa,qb,ca,sa,sb]=await Promise.all([tx.get(KupaVeri.ref(c,a)),tx.get(KupaVeri.ref(c,b)),tx.get(c.db.collection('ceteler').doc(a)),tx.get(_KupaSavas.durum(c,a)),tx.get(_KupaSavas.durum(c,b))]);
      if(!qa.exists||!qb.exists||!ca.exists||!Array.isArray(qb.data().uyeler)||ca.data().kurucu!==uid||sa.data()?.aktif||sb.data()?.aktif)throw Error('eslesme-degisti');
      const x={id:a,...qa.data(),zaman:qa.data().zaman.toMillis()},y={id:b,...qb.data(),zaman:qb.data().zaman.toMillis()};
      if(!KupaEslesme.uygun(x,y)||x.kupa!==(sa.exists?sa.data().kupa:100)||y.kupa!==(sb.exists?sb.data().kupa:100))throw Error('uygun-rakip-yok');
      const aa=ca.data(),bb=qb.data(),z=c.F.FieldValue.serverTimestamp();
      tx.set(ref,{kuralSurum:2,rakipKod:null,ceteler:[a,b],adlar:{[a]:aa.ad,[b]:bb.ad},gonderen:uid,durum:'aktif',davet:z,baslangic:z,bitti:null,uyeler:{[a]:aa.uyeler,[b]:bb.uyeler},uyeAdlari:Object.fromEntries([...aa.uyeler.map(u=>[u,aa.adlar[u]]),...bb.uyeler.map(u=>[u,bb.adlar[u]])]),puanlar:{},toplamlar:{[a]:0,[b]:0},sonuc:null});
      for(const [cid,s]of [[a,sa],[b,sb]])tx.set(_KupaSavas.durum(c,cid),{aktif:ref.id,kupa:s.exists?s.data().kupa:100,sonuc:s.exists?s.data().sonuc:null});
      tx.delete(qa.ref);tx.delete(qb.ref);return ref.id;
    });
  },
};
if(typeof module==='object'&&module.exports)module.exports={KupaEslesme,KupaVeri};
