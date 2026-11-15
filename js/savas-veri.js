const _Sv=typeof SavasKural!=='undefined'?{SavasKural,SAVAS}:require('./savas-kural.js');
const SavasVeri = {
  ref:(c,id)=>c.db.collection('savaslar').doc(id),durum:(c,id)=>c.db.collection('savasDurum').doc(id),
  // İptalden sonra davet eden kişi aynı çeteyi 24 saat yeniden davet edemez (kural: davetBekleme).
  bekleme:(c,uid,hedef)=>c.db.collection('davetBekleme').doc(uid+'_'+hedef),
  async davet(c,uid,ceteId,kod) {
    const k=await c.db.collection('kodlar').doc(kod).get();if(!k.exists)throw Error('kod-yok');const rakip=k.data().ceteId;if(rakip===ceteId)throw Error('kendi-ceten');
    const ref=c.db.collection('savaslar').doc(),aRef=SavasVeri.durum(c,ceteId),bRef=SavasVeri.durum(c,rakip),bekRef=SavasVeri.bekleme(c,uid,rakip);
    await c.db.runTransaction(async tx=>{const [cs,as,bs]=await Promise.all([tx.get(c.db.collection('ceteler').doc(ceteId)),tx.get(aRef),tx.get(bRef)]);
      if(!cs.exists||cs.data().kurucu!==uid)throw Error('kurucu-gerek');const bk=await tx.get(bekRef);if(bk.exists&&bk.data().zaman&&bk.data().zaman.toMillis()+_Sv.SAVAS.davetBeklemeMs>Date.now())throw Error('davet-bekleme');if(as.data()?.aktif||bs.data()?.aktif)throw Error('savas-var');const a=cs.data();
      tx.set(ref,{kuralSurum:2,rakipKod:kod,ceteler:[ceteId,rakip],adlar:{[ceteId]:a.ad,[rakip]:k.data().ad},gonderen:uid,durum:'davet',davet:c.F.FieldValue.serverTimestamp(),baslangic:null,bitti:null,uyeler:{[ceteId]:a.uyeler,[rakip]:[]},uyeAdlari:Object.fromEntries(a.uyeler.map(u=>[u,a.adlar[u]])),puanlar:{},toplamlar:{[ceteId]:0,[rakip]:0},sonuc:null});
      tx.set(aRef,{aktif:ref.id,kupa:as.exists?as.data().kupa:_Sv.SAVAS.baslangicKupasi,sonuc:as.exists?as.data().sonuc:null});tx.set(bRef,{aktif:ref.id,kupa:bs.exists?bs.data().kupa:_Sv.SAVAS.baslangicKupasi,sonuc:bs.exists?bs.data().sonuc:null});
    });return ref.id;
  },
  async kabul(c,uid,id,ceteId) {
    const ref=SavasVeri.ref(c,id);await c.db.runTransaction(async tx=>{const [s,cs]=await Promise.all([tx.get(ref),tx.get(c.db.collection('ceteler').doc(ceteId))]);if(!s.exists||s.data().durum!=='davet')throw Error('davet-yok');const w=s.data(),cete=cs.data();if(w.ceteler[1]!==ceteId||cete.kurucu!==uid)throw Error('kurucu-gerek');
      tx.update(ref,{durum:'aktif',rakipKod:null,baslangic:c.F.FieldValue.serverTimestamp(),uyeler:{...w.uyeler,[ceteId]:cete.uyeler},uyeAdlari:{...w.uyeAdlari,...Object.fromEntries(cete.uyeler.map(u=>[u,cete.adlar[u]]))}});
    });
  },
  async iptal(c,id,uid,ceteId) {const ref=SavasVeri.ref(c,id);await c.db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists||s.data().durum!=='davet')throw Error('davet-yok');const w=s.data();tx.update(ref,{durum:'iptal',rakipKod:null});if(uid===w.gonderen||ceteId===w.ceteler[1])tx.set(SavasVeri.bekleme(c,w.gonderen,w.ceteler[1]),{zaman:c.F.FieldValue.serverTimestamp()});for(const cid of w.ceteler)tx.update(SavasVeri.durum(c,cid),{aktif:null});});},
  async puan(c,uid,id,ceteId,mod,puan) {
    if(!_Sv.SAVAS.modlar.includes(mod)||!Number.isInteger(puan*2)||puan<0||!(puan<=_Sv.SAVAS.enCokPuan[mod]))throw Error('puan-gecersiz');
    const ref=SavasVeri.ref(c,id);
    for(let deneme=0;deneme<3;deneme++){try{return await c.db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists)throw Error('savas-yok');const w=s.data();if((w.kuralSurum||1)===1&&!Number.isInteger(puan))throw Error('puan-gecersiz');if(w.durum!=='aktif'||_Sv.SavasKural.bitis(w)<=Date.now())throw Error('savas-bitti');if(!w.uyeler[ceteId]?.includes(uid))throw Error('uye-degil');
      const eski=_Sv.SavasKural.skor(w.puanlar[uid]);if(eski[mod]>=puan)return 0;const fark=puan-eski[mod];eski[mod]=puan;tx.update(ref,{['puanlar.'+uid]:{...eski,toplam:_Sv.SavasKural.toplam(eski)},['toplamlar.'+ceteId]:w.toplamlar[ceteId]+fark});return fark;
    });}catch(e){
      if(!/permission|PERMISSION_DENIED/i.test(String(e.code||e.message))||deneme===2)throw e;
      // Eşzamanlı daha yüksek rekor eski transaction'ı kuraldan reddettirebilir.
      const son=await ref.get();if(son.exists&&(son.data().puanlar[uid]?.[mod]||0)>=puan)return 0;
    }}
  },
  async bitir(c,id) {
    const ref=SavasVeri.ref(c,id);try{return await c.db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists)throw Error('savas-yok');const w=s.data();if(w.durum==='bitti')return w.sonuc;if(w.durum!=='aktif'||_Sv.SavasKural.bitis(w)>Date.now())throw Error('sure-dolmadi');
      const states=await Promise.all(w.ceteler.map(cid=>tx.get(SavasVeri.durum(c,cid)))),kupalar=Object.fromEntries(w.ceteler.map((cid,i)=>[cid,states[i].data().kupa])),sonuc=_Sv.SavasKural.sonuc(w,kupalar);
      tx.update(ref,{durum:'bitti',sonuc,bitti:c.F.FieldValue.serverTimestamp()});for(const cid of w.ceteler)tx.update(SavasVeri.durum(c,cid),{aktif:null,sonuc:id,kupa:kupalar[cid]+(sonuc.kazanan?cid===sonuc.kazanan?sonuc.miktar:-sonuc.miktar:0)});return sonuc;
    });}catch(e){if(/permission|PERMISSION_DENIED/i.test(String(e.code||e.message))){const son=await ref.get();if(son.exists&&son.data().durum==='bitti')return son.data().sonuc;}throw e;}
  },
};
if(typeof module==='object'&&module.exports)module.exports={SavasVeri};
