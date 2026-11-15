const OzelVeri={
  ref:(c,id)=>c.db.collection('ozelSohbetler').doc(id),
  profil:(c,uid)=>c.db.collection('gorunenProfiller').doc(uid),
  engel:(c,uid,hedef)=>c.db.collection('engeller').doc(uid).collection('kisiler').doc(hedef),
  async ac(c,uid,hedef){
    const id=[uid,hedef].sort().join('--');if(uid===hedef)throw Error('kendin');
    const ref=OzelVeri.ref(c,id);await c.db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists)tx.set(ref,{uyeler:[uid,hedef].sort()});});return id;
  },
  gonder(c,uid,id,metin,yanitId=null){
    metin=String(metin).replace(/[\u0000-\u001f\u007f]/g,' ').trim();if(!metin||metin.length>160)throw Error('mesaj-gecersiz');
    return OzelVeri.ref(c,id).collection('mesajlar').add({uid,metin,yanitId,zaman:c.F.FieldValue.serverTimestamp()});
  },
  dinle(c,id,geri,hata){return OzelVeri.ref(c,id).collection('mesajlar').orderBy('zaman','desc').limit(30).onSnapshot(s=>geri(s.docs.map(x=>({id:x.id,...x.data()})).reverse()),hata);},
  eski(c,id,ilk){return OzelVeri.ref(c,id).collection('mesajlar').orderBy('zaman','desc').startAfter(ilk.zaman).limit(30).get();},
};
if(typeof module==='object'&&module.exports)module.exports={OzelVeri};
