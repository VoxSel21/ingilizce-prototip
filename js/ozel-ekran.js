// Özel mesajlar hesap/kişi değişiminde kapanır. Taslaklar yalnız bu cihazda, hesap+oda anahtarıyla tutulur.
const OzelSohbet={oturum:null,profilZaman:null,sonProfil:null,
  kapat(){const s=this.oturum;this.oturum=null;if(!s)return;s.kapat.forEach(f=>f());this.taslakYaz(s);},
  taslakAnahtar:s=>'pati-ozel-taslak:'+s.uid+':'+s.id,
  taslakYaz(s){try{localStorage.setItem(this.taslakAnahtar(s),s.g.value);}catch(e){s.durum.textContent='Taslak bu cihaza kaydedilemedi.';}},
  profilGuncelle(){
    clearTimeout(this.profilZaman);const uid=Bulut.kullanici?.uid;if(!uid)return;
    this.profilZaman=setTimeout(async()=>{
      if(Bulut.kullanici?.uid!==uid)return;
      const veri={ad:temizAd(ArkadasEkran.profil?.ad||d.kediAd).slice(0,20),kod:ArkadasEkran.profil?.kod||null,renk:d.kurkRenk,hal:kediHali(),giyili:{...d.giyili},seviye:d.degerlendirme?.tamam?d.degerlendirme.seviye:null,olcum:d.degerlendirme?.tamam?d.degerlendirme.zaman:0,ceteId:null,ceteAd:CeteEkran.cete?.ad||null};
      const imza=uid+JSON.stringify(veri);if(this.sonProfil===imza)return;
      try{await OzelVeri.profil(ceteC(),uid).set(veri);if(Bulut.kullanici?.uid===uid)this.sonProfil=imza;}catch(e){/* Çevrimdışında sonraki kayıt/giriş tekrar dener. */}
    },800);
  },
  async ac(hedef,ad){
    const uid=Bulut.kullanici?.uid;if(!uid||uid===hedef)return;
    this.kapat();const id=[uid,hedef].sort().join('--');
    const s={uid,id,hedef,ad,kapat:[],mesajlar:[],eski:[],yanit:null,ilk:true,gonderiyor:false};this.oturum=s;
    const panel=document.getElementById('tam-ozel'),ic=document.getElementById('ozel-ic');ic.replaceChildren();
    document.getElementById('ozel-baslik').textContent=ad;
    const arac=ceteEl('div','menu-links');arac.append(dugmeEl('Profil',()=>profilAc(hedef)),dugmeEl('Önceki mesajlar',()=>this.eski(s)));ic.append(arac);
    s.liste=ceteEl('div','sohbet-liste');s.liste.setAttribute('role','log');s.liste.setAttribute('aria-live','polite');s.liste.setAttribute('aria-label','Özel mesajlar');s.liste.tabIndex=0;
    s.govde=ceteEl('div','sohbet-govde');s.govde.append(s.liste);s.yeni=dugmeEl('↓ Yeni mesaj',()=>{s.liste.scrollTop=s.liste.scrollHeight;s.yeni.hidden=true;},'sohbet-yeni');s.yeni.hidden=true;s.govde.append(s.yeni);ic.append(s.govde);
    s.durum=ceteEl('p','sohbet-durum','Mesajlar yükleniyor…');s.durum.setAttribute('role','status');ic.append(s.durum);
    s.alinti=ceteEl('div','sohbet-yanit');s.alinti.hidden=true;ic.append(s.alinti);
    const yaz=ceteEl('form','sohbet-yaz');s.g=document.createElement('input');s.g.maxLength=160;s.g.setAttribute('aria-label','Özel mesajın');s.g.placeholder='Mesajını yaz…';s.g.autocomplete='off';
    try{s.g.value=localStorage.getItem(this.taslakAnahtar(s))||'';}catch(e){}
    s.g.addEventListener('input',()=>this.taslakYaz(s));const gonder=ceteEl('button');gonder.innerHTML=patiIkon('arrow-right');gonder.type='submit';gonder.setAttribute('aria-label','Gönder');
    gonder.addEventListener('pointerdown',e=>{if(document.activeElement===s.g)e.preventDefault();});yaz.onsubmit=e=>{e.preventDefault();this.gonder(s);};yaz.append(s.g,gonder);ic.append(yaz);
    s.izin=ceteEl('p','soluk','Yalnız iki katılımcı okuyabilir. Arkadaşlık kaldırılır veya biri engellerse yeni mesaj kapanır; eski geçmiş korunur. Otomatik silme yok.');ic.append(s.izin);
    tamAc('ozel');
    try{
      const ref=OzelVeri.ref(ceteC(),id),kayit=await ref.get();
      if(this.oturum!==s||Bulut.kullanici?.uid!==uid)return;
      if(!kayit.exists)await OzelVeri.ac(ceteC(),uid,hedef);
      if(this.oturum!==s)return;
      s.kapat.push(OzelVeri.dinle(ceteC(),id,m=>{if(this.oturum!==s)return;s.mesajlar=m;this.ciz(s);},()=>{if(this.oturum===s)s.durum.textContent='Mesajlar alınamadı. Bağlantını kontrol edip sohbeti yeniden aç.';}));
      s.kapat.push(ArkadasVeri.ref(ceteC(),id).onSnapshot(a=>{if(this.oturum!==s)return;s.arkadas=a.exists&&a.data().durum==='kabul';this.izin(s);},()=>{s.arkadas=false;this.izin(s);}));
      s.engel={};for(const [a,b]of [[uid,hedef],[hedef,uid]])s.kapat.push(OzelVeri.engel(ceteC(),a,b).onSnapshot(x=>{if(this.oturum!==s)return;s.engel[a]=x.exists;this.izin(s);},()=>{s.engel[a]=true;this.izin(s);}));
    }catch(e){if(this.oturum===s)s.durum.textContent='Sohbet açılamadı. Önce arkadaşlık isteğinin kabul edilmesi gerekir; engelleme veya bağlantı durumunu da kontrol et.';}
  },
  izin(s){if(this.oturum!==s)return;s.yazabilir=!!s.arkadas&&Object.keys(s.engel||{}).length===2&&!Object.values(s.engel).some(Boolean);s.g.disabled=!s.yazabilir;s.g.nextElementSibling.disabled=!s.yazabilir;if(!s.yazabilir)s.durum.textContent='Yeni mesaj kapalı: arkadaşlık veya engelleme durumu değişti. Eski geçmişi okuyabilirsin.';else s.durum.textContent=navigator.onLine?'':'Çevrimdışısın; bağlantı gelince tekrar gönder.';},
  yanit(s,m){s.yanit=m;s.alinti.replaceChildren();s.alinti.hidden=!m;if(m)s.alinti.append(ceteEl('span',null,(m.uid===s.uid?'Sen':s.ad)+': '+m.metin),dugmeEl('✕',()=>this.yanit(s,null)));},
  async eski(s){
    const ilk=s.eski[0]||s.mesajlar[0];if(this.oturum!==s||!ilk?.zaman||s.eskiYukleniyor)return;s.eskiYukleniyor=true;
    try{const snap=await OzelVeri.eski(ceteC(),s.id,ilk);if(this.oturum!==s)return;s.eski=[...snap.docs.map(x=>({id:x.id,...x.data()})).reverse(),...s.eski];this.ciz(s,true);if(snap.empty)s.durum.textContent='Geçmişin başına geldin.';}catch(e){if(this.oturum===s)s.durum.textContent='Önceki mesajlar alınamadı; tekrar dene.';}finally{s.eskiYukleniyor=false;}
  },
  ciz(s,eskiYukleme=false){
    if(this.oturum!==s)return;const l=s.liste,altta=Sohbet.alttaMi(l.scrollTop,l.scrollHeight,l.clientHeight),ust=l.scrollTop,yukseklik=l.scrollHeight;
    const onceSon=s.sonId,m=[...new Map([...s.eski,...s.mesajlar].map(x=>[x.id,x])).values()];
    // Son 30'un dışına düşen okunmuş mesajlar, açık oturum boyunca kaybolmaz.
    s.eski=m.filter(x=>!s.mesajlar.some(y=>y.id===x.id));l.replaceChildren();
    for(const mesaj of m){
      const el=ceteEl('div','mesaj'+(mesaj.uid===s.uid?' ben':''));el.append(ceteEl('span','kim',mesaj.uid===s.uid?'Sen':s.ad));
      if(mesaj.yanitId){const eski=m.find(x=>x.id===mesaj.yanitId);el.append(ceteEl('blockquote','mesaj-alinti',eski?eski.metin:'Önceki mesajı görüntülemek için geçmişi yükle.'));}
      el.append(ceteEl('span',null,mesaj.metin),ceteEl('time','mesaj-saati',Sohbet.saat(mesaj.zaman)),dugmeEl('Yanıtla',()=>this.yanit(s,mesaj),'mesaj-secenek'),dugmeEl('Bildir',()=>this.bildir(s,mesaj),'mesaj-secenek'));
      ceteMesajHareketi(el,mesaj,()=>this.yanit(s,mesaj),()=>this.yanit(s,mesaj));l.append(el);
    }
    const son=m.at(-1);s.sonId=son?.id;
    if(eskiYukleme)l.scrollTop=ust+l.scrollHeight-yukseklik;
    else if(s.ilk||altta||(son?.uid===s.uid&&s.sonId!==onceSon)){l.scrollTop=l.scrollHeight;requestAnimationFrame(()=>{if(this.oturum===s&&document.getElementById('tam-ozel').classList.contains('aktif'))l.scrollTop=l.scrollHeight;});s.yeni.hidden=true;}
    else{l.scrollTop=ust;s.yeni.hidden=s.sonId===onceSon;}
    s.ilk=false;if(s.yazabilir)s.durum.textContent='';
  },
  async gonder(s){
    if(this.oturum!==s||s.gonderiyor||!s.yazabilir)return;const metin=Sohbet.temizle(s.g.value),yanit=s.yanit;if(!metin)return;
    s.gonderiyor=true;s.g.value='';this.taslakYaz(s);this.yanit(s,null);
    try{await OzelVeri.gonder(ceteC(),s.uid,s.id,metin,yanit?.id||null);}
    catch(e){if(this.oturum===s){if(!s.g.value){s.g.value=metin;this.taslakYaz(s);if(!s.yanit)this.yanit(s,yanit);}s.durum.textContent='Gönderilemedi. Taslağın korundu; bağlantı ve arkadaşlık durumunu kontrol et.';}}
    finally{s.gonderiyor=false;}
  },
  bildir(s,m){const neden=girdiEl('Bildirme nedeni',240);cetePencere('🚩','Özel mesajı bildir',[ceteEl('p',null,'Bildirim kaydedilir; otomatik denetim veya cevap garantisi yoktur.'),neden],[['Bildir',async()=>{if(!neden.value.trim())return 'Nedenini yaz.';await OzelVeri.ref(ceteC(),s.id).collection('bildirimler').add({uid:s.uid,mesajId:m.id,neden:neden.value.trim(),zaman:ceteC().F.FieldValue.serverTimestamp()});bildir('Bildirim kaydedildi.');}],['Vazgeç',null,true]]);},
};
Oturumlar.ekle('ozel-sohbet',()=>OzelSohbet.kapat(),undefined,undefined,'ozel');
const ozelPanel=ceteEl('section','tam');ozelPanel.id='tam-ozel';const ozelUst=ceteEl('div','ust');const ozelBaslik=ceteEl('h2');ozelBaslik.id='ozel-baslik';ozelUst.append(dugmeEl('✕',tamKapat,'kapat'),ozelBaslik);const ozelIc=ceteEl('div');ozelIc.id='ozel-ic';ozelPanel.append(ozelUst,ozelIc);document.getElementById('uygulama').append(ozelPanel);

async function profilAc(uid){
  const ben=Bulut.kullanici?.uid;if(!ben)return;const nesil=ArkadasEkran.nesil;
  try{
    const snap=await OzelVeri.profil(ceteC(),uid).get();if(Bulut.kullanici?.uid!==ben||nesil!==ArkadasEkran.nesil)return;
    const p=snap.exists?snap.data():{ad:CeteEkran.cete?.adlar?.[uid]||'Üye'},id=uid===ben?null:ArkadasKural.kimlik(ben,uid);
    const a=id?(await ArkadasVeri.ref(ceteC(),id).get()):null;if(Bulut.kullanici?.uid!==ben)return;
    const iliski=a?.exists?{id:a.id,...a.data()}:null,govde=[ceteEl('h3',null,p.ad)];
    if(p.renk){const k=ceteEl('div','profil-kedi');KediCizici.yerlestir(k,{hal:p.hal,renk:p.renk,giyili:p.giyili||{}});govde.push(k);}
    govde.push(ceteEl('p',null,p.seviye?'Tahmini seviye: '+p.seviye+' · kısa değerlendirme':'Seviye henüz ölçülmedi'));
    if(p.ceteAd||p.ceteId)govde.push(ceteEl('p',null,'Çete: '+(p.ceteAd||'Çeteye üye')));
    const butonlar=[];
    if(uid!==ben){
      if(iliski?.durum==='kabul')butonlar.push(['Özel sohbet',()=>setTimeout(()=>OzelSohbet.ac(uid,p.ad),0)]);
      else if(iliski?.hedef===ben)butonlar.push(['Kabul et',()=>ArkadasVeri.kabul(ceteC(),id)]);
      else if(iliski)govde.push(ceteEl('p',null,'İstek gönderildi.'));
      else if(p.kod)butonlar.push(['Arkadaş ekle',async()=>{await ArkadasVeri.istek(ceteC(),ben,p.kod);bildir('İstek gönderildi.');}]);
      else govde.push(ceteEl('p','soluk','Bu üye henüz arkadaş kodu oluşturmamış.'));
      const engel=await OzelVeri.engel(ceteC(),ben,uid).get();if(Bulut.kullanici?.uid!==ben)return;
      butonlar.push([engel.exists?'Engeli kaldır':'Engelle',async()=>{if(engel.exists)await engel.ref.delete();else await engel.ref.set({zaman:ceteC().F.FieldValue.serverTimestamp()});bildir(engel.exists?'Engel kaldırıldı.':'Yeni özel mesajlar engellendi.');}]);
      // Kaldırılmış arkadaşlıkta geçmiş oda hâlâ katılımcıya açıktır.
      if(!iliski){const eski=await OzelVeri.ref(ceteC(),id).get();if(eski.exists)butonlar.push(['Eski sohbet geçmişi',()=>setTimeout(()=>OzelSohbet.ac(uid,p.ad),0)]);}
    }
    if(Bulut.kullanici?.uid!==ben||nesil!==ArkadasEkran.nesil)return;
    cetePencere('👤','Profil',govde,[...butonlar,['Kapat',null,true]]);
  }catch(e){bildir('Profil alınamadı. Bağlantını kontrol et.');}
}
async function ozelListeAc(){
  const uid=Bulut.kullanici?.uid;if(!uid)return;
  try{
    const snap=await ceteC().db.collection('ozelSohbetler').where('uyeler','array-contains',uid).get();
    const satirlar=await Promise.all(snap.docs.map(async doc=>{const hedef=doc.data().uyeler.find(x=>x!==uid);const p=await OzelVeri.profil(ceteC(),hedef).get();const ad=p.exists?p.data().ad:'Eski arkadaş';return dugmeEl(ad,()=>{document.getElementById('perde').classList.remove('aktif');OzelSohbet.ac(hedef,ad);},'menu-link');}));
    if(Bulut.kullanici?.uid!==uid)return;
    cetePencere('💬','Özel sohbetler',satirlar.length?satirlar:[ceteEl('p',null,'Henüz özel sohbet yok. Arkadaşının profilinden başlatabilirsin.')],[['Kapat',null,true]]);
  }catch(e){bildir('Sohbet listesi alınamadı. Bağlantını kontrol et.');}
}
const ceteSeviyeOnbellek=new Map();
async function ceteSeviyeCiz(kap,c){
  const el=ceteEl('p','soluk','Dil seviyesi yükleniyor…');kap.append(el);const uid=Bulut.kullanici?.uid;
  try{
    const key=c.id+':'+c.uyeler.join(','),once=ceteSeviyeOnbellek.get(key);
    const profiller=once&&Date.now()-once.zaman<60000?once.profiller:await Promise.all(c.uyeler.map(async u=>{const p=await OzelVeri.profil(ceteC(),u).get();return p.exists?p.data():null;}));
    if(Bulut.kullanici?.uid!==uid||CeteEkran.cete?.id!==c.id)return;
    ceteSeviyeOnbellek.set(key,{profiller,zaman:Date.now()});const r=SeviyeSinavi.ortalama(profiller,c.uyeler.length);
    el.textContent=r.etiket?`Yaklaşık dil seviyesi ${r.etiket} · ${r.olculen}/${r.uyeSayisi} üye değerlendirildi · ${Object.entries(r.dagilim).filter(([,n])=>n).map(([s,n])=>n+' '+s).join(', ')}. Kupa eşleştirmesini etkilemez.`:`Dil seviyesi için yeterli bilgi yok · 0/${r.uyeSayisi} üye değerlendirildi.`;
  }catch(e){el.textContent='Dil seviyesi bilgisi alınamadı.';}
}
