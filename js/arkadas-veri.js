// Compat Firestore adaptörü; bütün yetkiler ayrıca firestore.rules ile sınırlanır.
const _ArkK = typeof ArkadasKural!=='undefined' ? {ArkadasKural,ARKADAS_GOREV} : require('./arkadas.js');
const ArkadasVeri = {
  ref:(c,id)=>c.db.collection('arkadasliklar').doc(id),
  profil:(c,uid)=>c.db.collection('arkadasProfilleri').doc(uid),
  async kodOlustur(c,uid,ad,kodUret) {
    const ref=ArkadasVeri.profil(c,uid),s=await ref.get();if(s.exists)return s.data();
    ad=String(ad).trim().slice(0,20);if(!ad)throw Error('ad-bos');
    for(let i=0;i<4;i++){const kod=kodUret();try{await c.db.runTransaction(async tx=>{const p=await tx.get(ref),k=c.db.collection('arkadasKodlari').doc(kod);if(p.exists)return;
      if((await tx.get(k)).exists)throw Error('kod-cakisti');tx.set(ref,{kod,ad});tx.set(k,{uid,ad});});return (await ref.get()).data();}catch(e){if(i===3||!String(e.message).includes('kod-cakisti'))throw e;}}
  },
  async istek(c,uid,kod) {
    const s=await c.db.collection('arkadasKodlari').doc(kod).get();if(!s.exists)throw Error('kod-yok');
    const hedef=s.data().uid,id=_ArkK.ArkadasKural.kimlik(uid,hedef),p=await ArkadasVeri.profil(c,uid).get();if(!p.exists)throw Error('profil-yok');
    const uyeler=[uid,hedef].sort(),ref=ArkadasVeri.ref(c,id);
    await c.db.runTransaction(async tx=>{const eski=await tx.get(ref);if(eski.exists)throw Error(eski.data().durum==='kabul'?'zaten-arkadas':'istek-var');
      tx.set(ref,{uyeler,adlar:{[uid]:p.data().ad,[hedef]:s.data().ad},baslatan:uid,hedef,hedefKod:kod,durum:'bekliyor',zaman:c.F.FieldValue.serverTimestamp(),aktif:null});});return id;
  },
  kabul:(c,id)=>ArkadasVeri.ref(c,id).update({durum:'kabul'}),
  sil:(c,id)=>ArkadasVeri.ref(c,id).delete(),
  dinle(c,uid,geri,hata){return c.db.collection('arkadasliklar').where('uyeler','array-contains',uid).onSnapshot(s=>geri(s.docs.map(x=>({id:x.id,...x.data()}))),hata);},
  async gorevBaslat(c,uid,arkadas,tur,toplam) {
    const sb=_ArkK.ARKADAS_GOREV[tur];if(!sb)throw Error('gorev-yok');
    const parent=ArkadasVeri.ref(c,arkadas.id),ref=parent.collection('gorevler').doc();
    await c.db.runTransaction(async tx=>{const p=await tx.get(parent);if(!p.exists||p.data().durum!=='kabul')throw Error('arkadas-degil');
      if(p.data().aktif){const old=await tx.get(parent.collection('gorevler').doc(p.data().aktif));if(old.exists&&_ArkK.ArkadasKural.bitis(old.data())>Date.now()&&!_ArkK.ArkadasKural.bitti(old.data()))throw Error('aktif-gorev');}
      tx.set(ref,{uyeler:p.data().uyeler,tur,hedef:sb.hedef,odul:sb.odul,baslangic:c.F.FieldValue.serverTimestamp(),katki:{[uid]:{taban:toplam,deger:0}}});tx.update(parent,{aktif:ref.id});});return ref.id;
  },
  gorevDinle(c,id,gorev,geri,hata){return ArkadasVeri.ref(c,id).collection('gorevler').doc(gorev).onSnapshot(s=>geri(s.exists?{id:s.id,...s.data()}:null),hata);},
  async katki(c,uid,id,gorev,toplam) {
    const ref=ArkadasVeri.ref(c,id).collection('gorevler').doc(gorev);
    return c.db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists)return;const g=s.data();if(_ArkK.ArkadasKural.bitis(g)<=Date.now())return;
      const eski=g.katki[uid],taban=eski?eski.taban:toplam,deger=_ArkK.ArkadasKural.ilerleme(taban,toplam,g.hedef);
      if(eski&&eski.deger>=deger)return;tx.update(ref,{['katki.'+uid]:{taban,deger}});});
  },
};
if(typeof module==='object'&&module.exports)module.exports={ArkadasVeri};
