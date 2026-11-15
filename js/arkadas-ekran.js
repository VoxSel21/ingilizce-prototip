const ArkadasEkran = { profiller:new Map(), profilKapat:new Map(), uid:null, profil:null, liste:[], gorevler:new Map(), kapat:[], gorevKapat:new Map(), nesil:0, zaman:null, hata:'', sonToplam:new Map(),
  async baslat(u) {
    if (this.uid !== (u?.uid || null)) { sosyalSohbetKapat(); sosyalBolum='arkadas'; if(typeof Telaffuz!=='undefined')Telaffuz.kapat(); }
    if(typeof OzelSohbet!=='undefined'){
      OzelSohbet.kapat();OzelSohbet.sonProfil=null;document.getElementById('ozel-ic').replaceChildren();
      if(this.uid&&this.uid!==u?.uid){
        ceteSohbetKapat();CeteEkran.mesajlar=[];CeteEkran.sonId=null;ceteYanitSec(null);sohbetEkran.sayi=0;
        document.getElementById('sohbet-liste').replaceChildren();document.getElementById('sohbet-girdi').value='';
        document.getElementById('perde').classList.remove('aktif');while(document.querySelector('.tam.aktif'))tamKapat();
      }
    }
    this.profilDinlemeKapat();this.profiller.clear();
    this.nesil++;const nesil=this.nesil;this.kapat.forEach(f=>f());this.kapat=[];this.gorevKapat.forEach(f=>f());this.gorevKapat.clear();this.gorevler.clear();this.sonToplam.clear();clearTimeout(this.zaman);
    this.uid=u?.uid||null;this.profil=null;this.liste=[];this.hata='';
    if(!u){arkadasCiz();return;}arkadasCiz();
    try{const p=await ArkadasVeri.profil(ceteC(),u.uid).get();if(nesil!==this.nesil)return;this.profil=p.exists?p.data():null;
      this.kapat.push(ArkadasVeri.dinle(ceteC(),u.uid,liste=>{if(nesil!==this.nesil)return;this.liste=liste;this.gorevBagla(nesil);arkadasGercekCiz();},()=>{if(nesil===this.nesil){this.hata='Arkadaşlar alınamadı; bağlantını kontrol et.';arkadasGercekCiz();}}));
    }catch(e){if(nesil===this.nesil){this.hata=ceteHataMetni(e);arkadasGercekCiz();}}
    if(typeof OzelSohbet!=='undefined')OzelSohbet.profilGuncelle();
  },
  gorevBagla(nesil) {
    const keys=new Set();for(const a of this.liste){if(a.durum!=='kabul'||!a.aktif)continue;const key=a.id+'/'+a.aktif;keys.add(key);if(this.gorevKapat.has(key))continue;
      this.gorevKapat.set(key,ArkadasVeri.gorevDinle(ceteC(),a.id,a.aktif,g=>{if(nesil!==this.nesil)return;this.gorevler.set(key,g);this.katkiGonder();arkadasGercekCiz();},()=>{}));}
    for(const [key,f]of this.gorevKapat)if(!keys.has(key)){f();this.gorevKapat.delete(key);this.gorevler.delete(key);}
  },
  katkiGonder() {
    clearTimeout(this.zaman);const nesil=this.nesil,uid=this.uid;if(!uid)return;
    this.zaman=setTimeout(async()=>{for(const [key,g]of this.gorevler){if(nesil!==this.nesil)return;if(!g||ArkadasKural.bitis(g)<=Date.now())continue;
      const toplam=ArkadasKural.toplam(d,g.tur);if(this.sonToplam.get(key)===toplam)continue;const [id,gorev]=key.split('/');
      try{await ArkadasVeri.katki(ceteC(),uid,id,gorev,toplam);if(nesil===this.nesil)this.sonToplam.set(key,toplam);}catch(e){/* Bağlantı gelince sonraki kayıt yeniden dener. */}
    }},400);
  },
};
const arkadasAdi=a=>a.adlar[a.uyeler.find(uid=>uid!==ArkadasEkran.uid)]||'Arkadaş';
function arkadasIslem(fn){return async()=>{try{await fn();}catch(e){const m={'kendin':'Kendini arkadaş ekleyemezsin.','kod-yok':'Bu arkadaş kodu bulunamadı.','profil-yok':'Önce kendi arkadaş kodunu oluştur.','istek-var':'Zaten bekleyen bir isteğiniz var.','zaten-arkadas':'Zaten arkadaşsınız.','aktif-gorev':'Bu arkadaşla devam eden bir görev var.'};bildir(m[e.message]||ceteHataMetni(e));}};}
function arkadasEkleAc() {
  if(!Bulut.kullanici){ayarlarCiz();tamAc('ayarlar');return;}
  const profil=ArkadasEkran.profil,ad=girdiEl('Görünecek adın',20,takmaOku()||d.kediAd);
  if(!profil){cetePencere('👫','Arkadaş kodunu oluştur',[ad],[['Oluştur',async()=>{const uid=ArkadasEkran.uid;const p=await ArkadasVeri.kodOlustur(ceteC(),uid,CeteKural.adTemizle(ad.value),()=>CeteKural.kodUret()+CeteKural.kodUret().slice(0,2));if(uid===ArkadasEkran.uid){ArkadasEkran.profil=p;OzelSohbet.profilGuncelle();takmaYaz(p.ad);arkadasGercekCiz();setTimeout(arkadasEkleAc,0);}}],['Vazgeç',null,true]]);return;}
  const kod=girdiEl('Arkadaşının 8 karakterli kodu',8);kod.autocapitalize='characters';
  const kopya=dugmeEl('📋 Kodumu kopyala',async()=>{try{await navigator.clipboard.writeText(profil.kod);bildir('Kodun kopyalandı')}catch(e){bildir('Kodun: '+profil.kod)}});
  cetePencere('👫','Arkadaş ekle',[ceteEl('p',null,'Senin kodun: '+profil.kod),kopya,kod],[['İstek gönder',async()=>{const k=kod.value.toUpperCase().replace(/\s/g,'');if(!/^[A-HJ-NP-Z2-9]{8}$/.test(k))return 'Kod 8 karakter olmalı.';await ArkadasVeri.istek(ceteC(),ArkadasEkran.uid,k);bildir('Arkadaşlık isteği gönderildi')}],['Kapat',null,true]]);
}
function arkadasGercekCiz() {
  if(!Bulut.kullanici)return;const uid=ArkadasEkran.uid,yer=document.getElementById('arkadas-listesi');if(!yer)return;
  document.getElementById('cete-gercek-arkadas').replaceChildren();document.getElementById('gelen-miyav').replaceChildren();yer.replaceChildren();
  if(ArkadasEkran.hata)yer.append(ceteEl('p',null,ArkadasEkran.hata));
  yer.append(dugmeEl(ArkadasEkran.profil?'＋ Kodla arkadaş ekle · '+ArkadasEkran.profil.kod:'＋ Arkadaş kodumu oluştur',arkadasEkleAc));

  const gorevYer=document.getElementById('ikili-gorevler');gorevYer.replaceChildren();
  for(const a of ArkadasEkran.liste){
    const ad=arkadasAdi(a),hedef=a.uyeler.find(x=>x!==uid);
    const kart=dugmeEl('',()=>arkadasMenuAc(a),'arkadas-satir');
    const avatar=ceteEl('span','arkadas-kedi');avatar.dataset.uid=hedef;avatar.setAttribute('aria-hidden','true');
    const bilgi=ceteEl('span','arkadas-bilgi');bilgi.append(ceteEl('b',null,ad),ceteEl('small',null,a.durum==='kabul'?'Sohbet ve birlikte görev ›':a.baslatan===uid?'İstek yanıt bekliyor':'Arkadaşlık isteği'));
    kart.append(avatar,bilgi);yer.append(kart);arkadasKediCiz(avatar,ArkadasEkran.profiller.get(hedef));
    const g=ArkadasEkran.gorevler.get(a.id+'/'+a.aktif);if(g)gorevYer.append(arkadasGorevKarti(a,g));
  }
  arkadasProfilBagla();
  if(!ArkadasEkran.liste.length)yer.append(ceteEl('p','soluk','Kodunu arkadaşınla paylaş; isteği kabul edince burada görünür.'));
  if(!gorevYer.children.length)gorevYer.append(ceteEl('p','soluk','Arkadaş kartından birlikte görev başlatabilirsin.'));
  document.getElementById('lig').replaceChildren(ceteEl('p','soluk','Lig örnek puanları gerçek arkadaşlarına uygulanmaz. Savaş katkılarını Çete Savaşı bölümünde görebilirsin.'));
}
function arkadasGorevSec(a){const govde=[ceteEl('p',null,'7 gün içinde ikiniz de hedefe ulaşın. Sayım, her kişinin görevi ilk açtığı ilerlemeden başlar.')];
  for(const [tur,s]of Object.entries(ARKADAS_GOREV))govde.push(dugmeEl(s.ad+' · '+s.odul+' 🪙',arkadasIslem(async()=>{await ArkadasVeri.gorevBaslat(ceteC(),ArkadasEkran.uid,a,tur,ArkadasKural.toplam(d,tur));document.getElementById('perde').classList.remove('aktif');bildir('Birlikte görev başladı')})));
  cetePencere('🤝',arkadasAdi(a)+' ile görev',govde,[['Kapat',null,true]]);
}
function arkadasGorevKarti(a,g){const k=ceteEl('div','kart');k.append(ceteEl('b',null,arkadasAdi(a)+' · '+ARKADAS_GOREV[g.tur].ad));
  for(const uid of g.uyeler)k.append(ceteEl('p',null,(uid===ArkadasEkran.uid?'Sen':a.adlar[uid])+': '+(g.katki[uid]?.deger||0)+'/'+g.hedef+(!g.katki[uid]?' · başlaması bekleniyor':'')));
  const key='arkadas:'+a.id+':'+g.id;
  if(ArkadasKural.bitti(g)){k.append(dugmeEl(Ekonomi.odendiMi(d,key)?'Ödül alındı ✓':'Ödülü al · '+g.odul+' 🪙',()=>{if(!Ekonomi.kazan(d,key,g.odul,bugunNo()))return;d.ikiliBiten=(d.ikiliBiten||0)+1;kaydet();rozetKontrol();arkadasGercekCiz();bildir('🤝 Görev ödülün alındı')}));}
  else k.append(ceteEl('small','soluk',ArkadasKural.bitis(g)<=Date.now()?'Süre doldu':'7 günlük ortak görev'));
  return k;
}
async function arkadasGecmis(a){await arkadasIslem(async()=>{const uid=ArkadasEkran.uid,s=await ArkadasVeri.ref(ceteC(),a.id).collection('gorevler').orderBy('baslangic','desc').limit(20).get();if(uid!==ArkadasEkran.uid)return;const body=document.getElementById('tam-menu-arkadas-gecmis').querySelector('.menu-panel-ic');body.replaceChildren();for(const doc of s.docs)body.append(arkadasGorevKarti(a,{id:doc.id,...doc.data()}));if(s.empty)body.append(ceteEl('p',null,'Henüz görev yok.'));tamAc('menu-arkadas-gecmis');})();}

// Profiller yalnız arkadaş listesi görünürken dinlenir; hesap ve ekran değişince abonelikler kapanır.
ArkadasEkran.profilDinlemeKapat=function(){this.profilKapat.forEach(f=>f());this.profilKapat.clear();};
function arkadasKediCiz(el,p){
  const hal=['fit','pofuduk','tombis','mega'].includes(p?.hal)?p.hal:'fit';
  const giyili={};for(const yer of ['sapka','boyun','goz'])giyili[yer]=ESYALAR.some(e=>e.id===p?.giyili?.[yer])?p.giyili[yer]:null;
  const govde=KediCizici.yerlestir(el,{hal,renk:hexGecerli(p?.renk)?p.renk:KURK_VARSAYILAN,giyili});
  // Listede tek yüz ve 128px tampon yeterli; tam boy animasyonlar her arkadaş için tutulmaz.
  govde.querySelectorAll('canvas').forEach(c=>{if(c.dataset.yuz!=='acik')c.remove();else{c.width=c.height=128;c.getContext('2d').setTransform(.32,0,0,.32,0,0);}});
}
function arkadasProfilBagla(){
  const a=ArkadasEkran;if(!document.getElementById('ekran-arkadaslar').classList.contains('aktif')||sosyalBolum!=='arkadas')return a.profilDinlemeKapat();
  const hedefler=new Set(a.liste.map(x=>x.uyeler.find(id=>id!==a.uid)));
  for(const [id,f]of a.profilKapat)if(!hedefler.has(id)){f();a.profilKapat.delete(id);a.profiller.delete(id);}
  const nesil=a.nesil;
  for(const id of hedefler)if(!a.profilKapat.has(id))a.profilKapat.set(id,OzelVeri.profil(ceteC(),id).onSnapshot(s=>{
    if(nesil!==a.nesil)return;const p=s.exists?s.data():null;a.profiller.set(id,p);
    document.querySelectorAll('.arkadas-kedi').forEach(el=>{if(el.dataset.uid===id)arkadasKediCiz(el,p);});
  },()=>{}));
}
function arkadasMenuAc(a){
  const uid=ArkadasEkran.uid,nesil=ArkadasEkran.nesil,hedef=a.uyeler.find(x=>x!==uid),ad=arkadasAdi(a);
  const menu=ceteEl('div','arkadas-menu');
  const ekle=(yazi,fn)=>menu.append(dugmeEl(yazi,()=>{if(uid!==ArkadasEkran.uid||nesil!==ArkadasEkran.nesil)return;document.getElementById('perde').classList.remove('aktif');fn();}));
  ekle('👤 Profil',()=>profilAc(hedef));
  if(a.durum==='kabul'){
    ekle('💬 Sohbet et',()=>OzelSohbet.ac(hedef,ad));
    const g=ArkadasEkran.gorevler.get(a.id+'/'+a.aktif);
    if(g)menu.append(arkadasGorevKarti(a,g));
    ekle('🤝 Birlikte görev',()=>arkadasGorevSec(a));
    ekle('Görev geçmişi / ödüller',()=>arkadasGecmis(a));
    ekle('Arkadaşlıktan çıkar',()=>cetePencere('👫',ad+' ile arkadaşlığı kaldır?',[ceteEl('p',null,'İlerleme ve kazanılan ödüller korunur.')],[['Kaldır',()=>ArkadasVeri.sil(ceteC(),a.id)],['Vazgeç',null,true]]));
  }else{
    if(a.hedef===uid)ekle('Kabul et',arkadasIslem(()=>ArkadasVeri.kabul(ceteC(),a.id)));
    ekle(a.baslatan===uid?'İsteği iptal et':'Reddet',arkadasIslem(()=>ArkadasVeri.sil(ceteC(),a.id)));
  }
  cetePencere('🐾',ad,[menu],[['Kapat',null,true]]);
}
