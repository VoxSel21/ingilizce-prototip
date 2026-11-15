const SavasEkran={key:null,kapat:[],wKapat:null,w:null,durum:null,hata:'',baglam:null,zaman:null,sonGonderilen:new Map(),gonderiyor:false,bitiriyor:false,
  bagla(){if(typeof KupaEkran!=="undefined")KupaEkran.bagla();const uid=Bulut.kullanici?.uid,cid=CeteEkran.cete?.id,key=uid&&cid?uid+'/'+cid:null;if(key===this.key)return;
    this.kapat.forEach(f=>f());this.kapat=[];if(this.wKapat)this.wKapat();this.wKapat=null;clearInterval(this.zaman);this.key=key;this.w=null;this.durum=null;this.hata='';this.baglam=null;this.sonGonderilen.clear();if(!key){this.ciz();return;}
    const c=ceteC();this.kapat.push(SavasVeri.durum(c,cid).onSnapshot(s=>{if(this.key!==key)return;this.durum=s.exists?s.data():null;const id=this.durum?.aktif||this.durum?.sonuc;
      if(this.w?.id!==id){if(this.wKapat)this.wKapat();this.wKapat=null;this.w=null;if(id)this.wKapat=SavasVeri.ref(c,id).onSnapshot(doc=>{if(this.key!==key)return;this.w=doc.exists?{id:doc.id,...doc.data()}:null;this.ciz();this.gonder();this.sureKontrol();},e=>{if(this.key===key){this.hata=ceteHataMetni(e);this.ciz()}});}
      this.ciz();},e=>{if(this.key===key){this.hata=ceteHataMetni(e);this.ciz()}}));
    this.zaman=setInterval(()=>{if(!document.hidden)this.sureKontrol()},15000);
  },
  sureKontrol(){const w=this.w;if(w?.durum!=='aktif'||!w.baslangic)return;const kalan=SavasKural.bitis(w)-Date.now(),el=document.getElementById('gercek-savas-kalan');if(el)el.textContent=kalan>0?Math.ceil(kalan/3600000)+' saat kaldı':'Süre doldu';if(kalan<=0&&!this.bitiriyor)this.bitir();else if(kalan>0)this.gonder();},
  async bitir(){const w=this.w,key=this.key;if(!w||w.durum!=='aktif')return;this.bitiriyor=true;try{await SavasVeri.bitir(ceteC(),w.id)}catch(e){if(this.key===key){this.hata='Sonuç hesaplanamadı; bağlantı gelince tekrar dene.';this.ciz()}}finally{this.bitiriyor=false}},
  modAc(i){const w=this.w,c=CeteEkran.cete,uid=Bulut.kullanici?.uid;this.baglam=w?.durum==='aktif'&&SavasKural.bitis(w)>Date.now()&&w.uyeler[c.id]?.includes(uid)?{id:w.id,cid:c.id,uid,surum:w.kuralSurum||1}:null;SAVAS_MODLAR[i].ac();},
  kaydet(mod,puan){const b=this.baglam;this.baglam=null;if(!b||b.uid!==Bulut.kullanici?.uid)return null;
    d.savasRekorlari ||= {};if(!d.savasRekorlari[b.id]&&Object.keys(d.savasRekorlari).length>=500)delete d.savasRekorlari[Object.keys(d.savasRekorlari)[0]];const p=d.savasRekorlari[b.id] ||= {};p[mod]=Math.max(p[mod]||0,Math.min(SAVAS.enCokPuan[mod],puan));return b;
  },
  async gonder(){const w=this.w,key=this.key,uid=Bulut.kullanici?.uid,cid=CeteEkran.cete?.id;if(this.gonderiyor||w?.durum!=='aktif'||SavasKural.bitis(w)<=Date.now()||!w.uyeler[cid]?.includes(uid))return;
    const p={...(d.savasRekorlari?.[w.id]||{})};const gorev={key};this.gonderiyor=gorev;
    try{for(const mod of SAVAS.modlar){if(this.key!==key)return;const puan=Math.min(SAVAS.enCokPuan[mod],p[mod]||0);if(puan<=(w.puanlar[uid]?.[mod]||0)||puan<=(this.sonGonderilen.get(w.id+mod)||0))continue;await SavasVeri.puan(ceteC(),uid,w.id,cid,mod,puan);if(this.key===key)this.sonGonderilen.set(w.id+mod,puan);}if(this.key===key)this.hata='';
    }catch(e){if(this.key===key){this.hata='Puan cihaza kaydedildi. Süre bitmeden bağlantı kurarak eşitle; süresi dolmuş veya ayrıldığın savaşa puan gönderilemez.';this.ciz();}}finally{if(this.gonderiyor===gorev)this.gonderiyor=false;}
  },
  ciz(){const el=document.getElementById('savas-kart');if(!el||!Bulut.kullanici)return;el.replaceChildren();const c=CeteEkran.cete;if(!c){el.append(ceteEl('p','kart','Gerçek çete savaşına katılmak için önce bir çete kur veya katıl.'));return;}
    KupaEkran.ciz(el,c);const uid=Bulut.kullanici.uid,w=this.w;el.append(ceteEl('b',null,'🏆 Çetenin kupası: '+(this.durum?.kupa??SAVAS.baslangicKupasi)));
    if(this.hata)el.append(ceteEl('p','soluk',this.hata));
    if(!this.durum?.aktif&&c.kurucu===uid)el.append(dugmeEl('⚔️ Çete Savaşı Başlat',()=>{const kod=girdiEl('Rakip çetenin 6 karakterli kodu',6);cetePencere('⚔️','Savaş daveti',[ceteEl('p',null,'Karşı kurucu kabul edince 72 saat başlar. Bir çetenin tek bekleyen/aktif savaşı olabilir.'),kod],[['Davet gönder',async()=>{const k=CeteKural.kodDuzelt(kod.value);if(!CeteKural.kodGecerli(k))return 'Geçerli bir çete kodu yaz.';try{await SavasVeri.davet(ceteC(),uid,c.id,k)}catch(e){if(e.message==='savas-var')return 'İki çeteden birinin zaten bekleyen/aktif savaşı var.';if(e.message==='davet-bekleme')return 'Bu çeteye son davet iptal edildi; 24 saat sonra yeniden davet edebilirsin.';return ceteHataMetni(e)}}],['Vazgeç',null,true]])}));
    if(w){el.append(ceteEl('p','soluk',(w.kuralSurum||1)>=2?'Kural v2 · yanlış cezası doğru puanının %30’u · tüm seviyelerden ortak havuz.':'Kural v1 · bu savaş bitene kadar eski puanlama ve havuz korunur.'));el.append(ceteEl('h3',null,w.adlar[w.ceteler[0]]+' — '+w.adlar[w.ceteler[1]]));
      if(w.durum==='davet'){el.append(ceteEl('p',null,w.ceteler[1]===c.id?'Rakipten savaş daveti var.':'Karşı kurucunun kabulü bekleniyor.'));if(c.kurucu===uid){if(w.ceteler[1]===c.id)el.append(dugmeEl('Daveti kabul et',arkadasIslem(()=>SavasVeri.kabul(ceteC(),uid,w.id,c.id))));el.append(dugmeEl('Daveti reddet / iptal et',arkadasIslem(()=>SavasVeri.iptal(ceteC(),w.id,uid,c.id))));}}
      if(w.durum==='aktif'||w.durum==='bitti'){const box=ceteEl('div','kart');box.append(ceteEl('b',null,SavasKural.takim(w,w.ceteler[0])+' — '+SavasKural.takim(w,w.ceteler[1])));const sure=ceteEl('p','soluk');sure.id='gercek-savas-kalan';sure.textContent=w.durum==='bitti'?'Savaş tamamlandı':Math.max(0,Math.ceil((SavasKural.bitis(w)-Date.now())/3600000))+' saat kaldı';box.append(sure);
        if(w.durum==='bitti'){const s=w.sonuc;box.append(ceteEl('p',null,s.kazanan?w.adlar[s.kazanan]+' kazandı · '+s.miktar+' kupa aktarıldı.':'Berabere · kupalar değişmedi.'));}
        else if(SavasKural.bitis(w)<=Date.now())box.append(dugmeEl('Sonucu hesapla',()=>this.bitir()));
        for(const cid of w.ceteler){box.append(ceteEl('b',null,w.adlar[cid]+' · Katkı sıralaması'));for(const [i,u]of SavasKural.siralama(w,cid).entries())box.append(ceteEl('p',null,(i+1)+'. '+u.ad+' · '+u.puan));}el.append(box);
      }
    }
    const katkili=w?.durum==='aktif'&&SavasKural.bitis(w)>Date.now()&&w.uyeler[c.id]?.includes(uid);el.append(ceteEl('p','soluk',katkili?'Her modda en iyi puanın bu savaşa katkı sağlar.':'Pratik · Bu tur aktif savaşa katkı sağlamaz. Yeni üyeler sonraki savaşı bekler.'));
    const modlar=ceteEl('div','savas-modlar');for(const [i,m]of SAVAS_MODLAR.entries())modlar.append(dugmeEl(m.ikon+' '+m.ad,()=>this.modAc(i)));el.append(modlar);
  },
};
window.addEventListener('online',()=>SavasEkran.gonder());
