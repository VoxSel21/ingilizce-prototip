function seviyeSinavAc(){
  if(!d.seviyeSinav||d.seviyeSinav.tamam)d.seviyeSinav=SeviyeSinavi.yeni();
  d.seviyeSinav.atlandi=false;kaydet();tamAc('seviye');seviyeSinavCiz();
}
function seviyeSinavCiz(){
  const s=d.seviyeSinav,el=document.getElementById('seviye-ic');el.replaceChildren();
  if(s.tamam){
    const r=SeviyeSinavi.sonuc(s);el.append(ceteEl('p','seviye-sonuc-etiket','Tahmini seviye'),ceteEl('h2','seviye-sonuc',r.seviye),ceteEl('p','soluk','Kısa örneklem · güven sınırlı. Resmî CEFR sonucu değildir. Geçmiş ilerlemen ve kelime kutuların korunur.'));
    for(const [tur,k]of Object.entries(r.konular)){const satir=ceteEl('p','kart');satir.append(ceteEl('span',null,tur),ceteEl('span','seviye-konu-sonuc',`${k.sayi?k.dogru+'/'+k.sayi+' · ':''}${k.guven}`));el.append(satir);}
    el.append(dugmeEl('Bu seviyeden çalış · alt seviyeleri örnekleyerek kontrol et',()=>{d.seviye=r.seviye;d.degerlendirme={...r,atlaBilinen:true};kaydet();tamKapat();herSeyiCiz();},'k-ana'),dugmeEl('Çalışma seviyemi koru',()=>{tamKapat();},'k-ikinci'),dugmeEl('Yeni değerlendirme',()=>{d.seviyeSinav=null;seviyeSinavAc();},'k-yazi'));return;
  }
  const q=SeviyeSinavi.soru(s,KELIMELER,karistir);kaydet();
  const cubuk=ceteEl('div','seviye-cubuk'),dolu=document.createElement('i');dolu.style.width=(s.i/16*100)+'%';cubuk.append(dolu);
  el.append(ceteEl('p','soluk',`${s.i+1}/16 · ${q.tur} · ${q.seviye}`),cubuk,ceteEl('h2',null,q.metin));
  for(const cevap of q.siklar)el.append(dugmeEl(cevap,()=>{
    const aktif=d.seviyeSinav;if(!aktif)return;
    if(aktif.i!==s.i||aktif.sorular[aktif.i]?.metin!==q.metin)return seviyeSinavCiz();
    SeviyeSinavi.cevap(aktif,cevap);if(aktif.tamam)d.degerlendirme={...SeviyeSinavi.sonuc(aktif),atlaBilinen:false};kaydet();seviyeSinavCiz();
  },'menu-link'));
  el.append(dugmeEl('Ara ver · sonra devam et',()=>{if(d.seviyeSinav)d.seviyeSinav.atlandi=true;kaydet();tamKapat();},'k-yazi'));
}
const seviyePanel=document.createElement('section');seviyePanel.className='tam';seviyePanel.id='tam-seviye';
const seviyeUst=ceteEl('div','ust');seviyeUst.append(dugmeEl('✕',tamKapat,'kapat'),ceteEl('h2',null,'Seviye değerlendirmesi'));
const seviyeIc=ceteEl('div','menu-panel-ic');seviyeIc.id='seviye-ic';seviyePanel.append(seviyeUst,seviyeIc);document.getElementById('uygulama').append(seviyePanel);
const ayarSeviyeDugmesi = dugmeEl('Seviye değerlendirmesi', seviyeSinavAc, 'ayar-arac');
ayarSeviyeDugmesi.id = 'ayar-seviye-degerlendirmesi';
document.getElementById('ayar-liste').append(ayarSeviyeDugmesi);
