const KupaEkran={key:null,kapat:null,zaman:null,q:null,mesaj:'',mesgul:false,
  bagla(){
    const cid=CeteEkran.cete?.id,uid=Bulut.kullanici?.uid,key=cid&&uid?uid+'/'+cid:null;if(key===this.key)return;
    if(this.kapat)this.kapat();clearInterval(this.zaman);this.key=key;this.q=null;this.mesaj='';if(!key)return;
    this.kapat=KupaVeri.ref(ceteC(),cid).onSnapshot(s=>{if(this.key!==key)return;this.q=s.exists?{id:cid,...s.data(),zaman:s.data().zaman?.toMillis()||Date.now()}:null;SavasEkran.ciz();this.kontrol();},()=>{if(this.key===key){this.mesaj='Kupa kuyruğu alınamadı.';SavasEkran.ciz();}});
    this.zaman=setInterval(()=>this.kontrol(),10000);
  },
  async kontrol(){
    const q=this.q,key=this.key,uid=Bulut.kullanici?.uid,cid=CeteEkran.cete?.id;
    if(!q||!key||this.mesgul||CeteEkran.cete?.kurucu!==uid||document.hidden)return;
    if(Date.now()-q.zaman>=300000){this.mesaj='5 dakikada uygun rakip bulunamadı. Tekrar arayabilirsin.';try{await KupaVeri.ref(ceteC(),cid).delete();}catch(e){}SavasEkran.ciz();return;}
    if(SavasEkran.durum?.aktif)return;this.mesgul=true;
    try{
      const n=KupaEslesme.aralik(q.zaman),s=await ceteC().db.collection('savasKuyruk').where('kupa','>=',q.kupa-n).where('kupa','<=',q.kupa+n).limit(50).get();
      if(this.key!==key)return;
      const adaylar=s.docs.map(x=>({id:x.id,...x.data(),zaman:x.data().zaman?.toMillis()||0})).filter(x=>KupaEslesme.uygun(q,x)).sort((a,b)=>Math.abs(a.kupa-q.kupa)-Math.abs(b.kupa-q.kupa)||a.zaman-b.zaman);
      for(const a of adaylar){if(this.key!==key)return;try{await KupaVeri.eslestir(ceteC(),uid,cid,a.id);this.mesaj='Rakip bulundu! 72 saatlik savaş başladı.';break;}catch(e){if(!/eslesme-degisti|uygun-rakip-yok|permission/i.test(String(e.code||e.message)))throw e;}}
    }catch(e){if(this.key===key)this.mesaj='Arama sürüyor; bağlantı gelince tekrar denenecek.';}finally{this.mesgul=false;if(this.key===key)SavasEkran.ciz();}
  },
  ciz(el,c){
    this.bagla();const uid=Bulut.kullanici?.uid;
    if(this.mesaj)el.append(ceteEl('p','soluk',this.mesaj));
    if(this.q){el.append(ceteEl('p',null,`Kupa rakibi aranıyor · ±${KupaEslesme.aralik(this.q.zaman)} kupa · ${Math.max(0,Math.ceil((300000-Date.now()+this.q.zaman)/1000))} sn kaldı`));if(c.kurucu===uid)el.append(dugmeEl('Aramayı iptal et',arkadasIslem(()=>KupaVeri.ref(ceteC(),c.id).delete())));}
    else if(c.kurucu===uid&&!SavasEkran.durum?.aktif)el.append(dugmeEl('🏆 Kupaya göre rakip bul',arkadasIslem(async()=>{this.mesaj='';await KupaVeri.ara(ceteC(),uid,c.id);})));
  },
};
