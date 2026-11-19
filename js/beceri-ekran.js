// Mevcut kart oturumu, ortak sayaç ve kayıt akışını kullanır.
function beceriSecAc(deste = KELIMELER) {
  const menu=ceteEl('div','beceri-sec');
  if (acikTur(deste === PHRASAL ? 'phrasal' : 'kelime')) menu.append(dugmeEl('↩ Kayıtlı tura devam',()=>{document.getElementById('perde').classList.remove('aktif');turBaslat(acikTur(deste===PHRASAL?'phrasal':'kelime'),true);}));
  menu.append(dugmeEl((deste===PHRASAL?'Phrasal verb turu · ':'Uzun kelime turu · ')+turBoyu(deste)+(deste===PHRASAL?' ifade':' kelime'),()=>{document.getElementById('perde').classList.remove('aktif');kartlariAc(deste);}));
  for(const [mod,ad]of Object.entries(BECERILER))menu.append(dugmeEl(ad,()=>{document.getElementById('perde').classList.remove('aktif');beceriBaslat(mod,deste);}));
  cetePencere('📚','Nasıl çalışmak istersin?',[menu,ceteEl('p','mikrofon-not','Tüm türler açık. Ortak günlük hedefin korunur. Telaffuz deneme aşamasında; puanı ilerlemeyi ve ödülleri etkilemez.')],[['Kapat',null,true]]);
}
function beceriBaslat(mod,deste=KELIMELER) {
  const tur=deste===PHRASAL?'phrasal':'kelime',eski=acikTur(tur);
  if(eski?.beceriMod===mod)return turBaslat(eski,true);
  const zaman=Date.now(),gun=bugunNo(),tipler=BeceriKural.turler(mod,Telaffuz.hazir()),sira=[],secilen=new Set();
  const havuz=karistir(deste.filter(k=>d.kartlar[k[0]]||k[5]===d.seviye&&(!d.konu||deste!==KELIMELER||konuOf(k[0])===d.konu)));
  for(let i=0;i<turBoyu(deste);i++){
    const beceri=tipler[i%tipler.length];
    const adaylar=havuz.filter(k=>!secilen.has(k[0])&&(beceri==='telaffuz'||!d.kartlar[k[0]]?.beceriler?.[beceri]||Date.parse(d.kartlar[k[0]].beceriler[beceri].kart.due)<=zaman));
    adaylar.sort((a,b)=>(Date.parse(d.kartlar[a[0]]?.beceriler?.[beceri]?.kart.due)||0)-(Date.parse(d.kartlar[b[0]]?.beceriler?.[beceri]?.kart.due)||0));
    const k=adaylar[0];if(!k)continue;secilen.add(k[0]);
    if(!d.kartlar[k[0]])sira.push({tip:'tanis',id:k[0]});
    sira.push({tip:'soru',id:k[0],beceri});
  }
  if(!sira.length){bildir('Bu beceride zamanı gelen tekrar yok. Başka bir tür seçebilirsin.');return;}
  turBaslat({deste:tur,beceriMod:mod,gun,sira:mod==='telaffuz'?Ogrenme.bilgilerOnce(sira):Ogrenme.gruplar(sira),i:0,dogru:0,yanlis:0,kiloBas:d.kilo,kiloAdim:[],cevaplanan:null},false);
}
function beceriSoruCiz(a) {
  const o=kO,k=kelimeAl(a),alan=document.getElementById('k-alan');
  if(a.beceri==='telaffuz'&&o.beceriMod==='karma'&&!Telaffuz.hazir()){
    a.beceri='secme'; // Bağlantı/izin/kota değişirse soru ve ilerleme kaybolmaz.
  }
  alan.replaceChildren();o.kilit=false;
  const kart=ceteEl('div','soru-kart');kart.append(ceteEl('div','s-yon',BECERILER[a.beceri]),ceteEl('h2','s-ana',a.beceri==='dinleme'?'🎧 Dinle ve yaz':a.beceri==='yazma'?k[1]:k[0]));
  const b=d.kartlar[k[0]]?.beceriler?.[a.beceri];
  const durum={yeni:'Yeni',gelisiyor:'Gelişiyor',pekismis:'Pekişmiş'}[BeceriKural.durum(b)];
  kart.append(ceteEl('small','beceri-ozet',a.beceri==='telaffuz'?'Puansız pratik veya çevrimiçi değerlendirme':a.pekistir?'Pekiştirme':durum));alan.append(kart);
  if(a.beceri==='telaffuz')return telaffuzSoruCiz(a,k,alan,o);
  if(a.beceri==='secme'){
    const siklar=ceteEl('div','k-siklar');const diger=yanlisSecenekler(k,k[7]==='phrasal verb'?PHRASAL:KELIMELER);
    for(const x of karistir([k,...diger]))siklar.append(dugmeEl(x[1],e=>{if(kO!==o||o.kilit)return;const ok=x[0]===k[0];const el=e.currentTarget;el.classList.add(ok?'dogru':'yanlis');cevapla(a,ok,el);},'k-sik'));
    alan.append(siklar);return;
  }
  const form=ceteEl('form','beceri-yazi'),g=girdiEl('İngilizcesini yaz',80),kontrol=dugmeEl('Kontrol et',()=>{},'menu-link');kontrol.type='submit';g.autocomplete='off';g.autocapitalize='none';g.spellcheck=false;
  form.append(g,kontrol);alan.append(form);
  form.onsubmit=e=>{e.preventDefault();if(kO!==o||o.kilit||!g.value.trim())return;g.disabled=kontrol.disabled=true;cevapla(a,SavasPuan.yazim(g.value)===SavasPuan.yazim(k[0]),kontrol);};
  if(a.beceri==='dinleme'){
    const dinle=dugmeEl('🔊 Örnek sesi dinle',oku,'menu-link'),not=ceteEl('p','mikrofon-not');alan.insertBefore(dinle,form);alan.insertBefore(not,form);g.disabled=kontrol.disabled=true;
    async function oku(){const ok=await seslendir(k[0],false,{hata:()=>{if(kO===o)not.textContent='Ses oynatılamadı. Tekrar dene veya soruyu puansız geç.';}});if(kO===o&&o.sira[o.i]===a&&ok){g.disabled=kontrol.disabled=false;g.focus();}}
    alan.append(dugmeEl('Ses yok · puansız geç',()=>{if(kO===o&&o.sira[o.i]===a)ilerle();},'menu-link'));oku();
  }else g.focus();
}
function telaffuzSoruCiz(a,k,alan,o){
  alan.append(ceteEl('p','soluk',k[1]),dugmeEl('🔊 Örnek sesi dinle',()=>seslendir(k[0]),'menu-link'));
  const sonuc=ceteEl('p','konus-durum');alan.append(sonuc);
  const mik=dugmeEl('🎤 Telaffuzumu değerlendir',async()=>{
    if(kO!==o||o.kilit||o.sira[o.i]!==a)return;
    mik.disabled=true;sonuc.textContent='Dinliyorum…';
    try{const r=await Telaffuz.degerlendir(k[0]);if(kO!==o||o.sira[o.i]!==a)return;sonuc.textContent='Telaffuz: '+Math.round(r.puan)+'/100 · Deneme sonucu, ilerlemeye etki etmez.';}
    catch(e){if(kO===o&&o.sira[o.i]===a&&sonuc.isConnected){sonuc.textContent=e.message;if(o.beceriMod==='karma'&&!Telaffuz.hazir()){a.beceri='secme';beceriSoruCiz(a);bildir('Telaffuz kullanılamıyor; seçmeli soruyla devam.');}}}
    finally{if(kO===o)mik.disabled=!Telaffuz.hazir();}
  },'menu-link');mik.disabled=!Telaffuz.hazir();alan.append(mik);
  sonuc.textContent=Telaffuz.hazir()?'Ses yalnız değerlendirme düğmesine basınca Azure’a gönderilir.':'Şu an puansız pratik açık. İnternet, mikrofon veya değerlendirme bağlantısı hazır değil. Örnek ses çevrimdışı için indirilmiş olmalı.';
  alan.append(dugmeEl('Pratiği bitir · devam',()=>{if(kO===o&&o.sira[o.i]===a){Telaffuz.kapat();ilerle();}},'menu-link'));
}
for(const olay of ['online','offline'])window.addEventListener(olay,()=>{
  if(olay==='offline')Telaffuz.kapat();
  if(kO?.sira[kO.i]?.beceri==='telaffuz'&&document.getElementById('tam-kartlar').classList.contains('aktif')&&!Telaffuz.aktif)beceriSoruCiz(kO.sira[kO.i]);
});
