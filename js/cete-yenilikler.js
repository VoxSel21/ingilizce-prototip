// Mesaj araçları ve uygulama içi okunmamış göstergesi; kimlik değişince dinleme kapanır.
let ceteSonDinleyici = null, ceteSonMesaj = null;
function sohbetDilUyari(metin=''){const el=document.getElementById('sohbet-dil-uyari');el.textContent=metin;el.hidden=!metin;}
document.getElementById('sohbet-girdi').addEventListener('input',e=>sohbetDilUyari(CeteKural.ingilizceUyari(e.target.value)?'🇬🇧 Türkçe harfler gördüm. İngilizce yazarak pratik yapabilirsin.':''));
function ceteBildirimKapat() { if (ceteSonDinleyici) ceteSonDinleyici(); ceteSonDinleyici = null; ceteSonMesaj = null; ceteNokta(false); }
function ceteNokta(varMi) {
  const b = document.querySelector('nav [data-sekme="arkadaslar"]');
  b.classList.toggle('yeni-mesaj-var', varMi); b.setAttribute('aria-label', varMi ? 'Sosyal · Yeni mesaj' : 'Sosyal');
}
function ceteBildirimBaslat() {
  const c = CeteEkran.cete, uid = CeteEkran.uid; if (!c || !Bulut.kullanici) return;
  ceteSonDinleyici = CeteCekirdek.mesajlar(ceteC(), c.id).orderBy('zaman','desc').limit(1).onSnapshot(s => {
    if (CeteEkran.uid !== uid || CeteEkran.cete?.id !== c.id) return;
    const m = s.docs[0]; ceteSonMesaj = m ? { ...m.data(), id:m.id } : null;
    ceteOkunduIsaretle();
  }, () => ceteNokta(false));
}
function ceteOkunduIsaretle() {
  const m=ceteSonMesaj, c=CeteEkran.cete; if (!m || !c || !m.zaman || typeof m.zaman.toMillis !== 'function') return;
  const zaman=m.zaman.toMillis(), l=document.getElementById('sohbet-liste');
  const gorunur = CeteEkran.sohbet && !document.hidden && document.getElementById('tam-sohbet').classList.contains('aktif') && Sohbet.alttaMi(l.scrollTop,l.scrollHeight,l.clientHeight) && CeteEkran.mesajlar.some(x=>x.id===m.id);
  d.sohbetOkundu ||= {};
  if (gorunur && (d.sohbetOkundu[c.id]||0)<zaman) { d.sohbetOkundu[c.id]=zaman; kaydet(); }
  ceteNokta(m.uid!==CeteEkran.uid && zaman>(d.sohbetOkundu[c.id]||0));
}
document.getElementById('sohbet-liste').addEventListener('scroll',ceteOkunduIsaretle);
document.getElementById('sohbet-yeni').addEventListener('click',ceteOkunduIsaretle);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)ceteOkunduIsaretle()});
function ceteYanitSec(m) {
  CeteEkran.yanitId=m ? m.id : null;
  let el=document.getElementById('sohbet-yanit');
  if(!el){el=ceteEl('div','sohbet-yanit');el.id='sohbet-yanit';document.getElementById('sohbet-girdi').parentElement.before(el);}
  el.replaceChildren();el.hidden=!m;
  if(m)el.append(ceteEl('span',null,m.ad+': '+m.metin.slice(0,70)),dugmeEl('✕',()=>ceteYanitSec(null)));
}
function ceteMesajHareketi(el, mesaj, yanit = () => ceteYanitSec(mesaj), menu = () => ceteMesajSecenek(mesaj)) {
  let bas = null, zaman, tikEngelle = 0;
  el.addEventListener('click', e => { if(performance.now()<tikEngelle){e.preventDefault();e.stopPropagation();} },true);
  const iptal = () => { clearTimeout(zaman); bas = null; el.style.transform = ''; };
  el.addEventListener('pointerdown', e => {
    if (e.isPrimary === false || e.button !== 0 || e.target.closest('button')) return;
    bas = { x: e.clientX, y: e.clientY, zaman: performance.now() };
    zaman = setTimeout(() => { iptal(); tikEngelle=performance.now()+500; menu(); }, 550);
  });
  el.addEventListener('pointermove', e => {
    if (!bas) return;
    const dx = e.clientX - bas.x, dy = e.clientY - bas.y;
    if (Math.hypot(dx, dy) > 8) { clearTimeout(zaman); tikEngelle=performance.now()+500; }
    if (Math.abs(dy) > 28 || dx < -12) return iptal();
    if(dx>8)try{el.setPointerCapture(e.pointerId);}catch(e){} // Kısa mesajın dışına sürüklenince de yanıt tamamlanabilsin.
    el.style.transform = `translateX(${Math.max(0, Math.min(72, dx))}px)`;
  });
  el.addEventListener('pointerup', e => {
    const sec = bas && Sohbet.yanitKaydirmasi(e.clientX - bas.x, e.clientY - bas.y, performance.now() - bas.zaman);
    iptal();
    if (sec) { yanit(); Dokunus.titret('secim'); }
  });
  for (const tur of ['pointercancel', 'pointerleave']) el.addEventListener(tur, iptal);
}
function ceteMesajSecenek(m) {
  if(!CeteEkran.sohbet)return;
  cetePencere('💬','Mesaj seçenekleri',[ceteEl('p',null,m.ad+': '+m.metin)],[
    ['Yanıtla',()=>{ceteYanitSec(m);document.getElementById('sohbet-girdi').focus()}],
    ['Şikâyet et',()=>{setTimeout(()=>{const neden=girdiEl('Bildirme nedeni',240);cetePencere('🚩','Mesajı bildir',[ceteEl('p',null,'Çete kurucusunun listesine kaydedilir. İnceleme veya işlem garantisi yoktur.'),neden],[['Bildir',async()=>{if(!neden.value.trim())return 'Nedenini yaz.';await CeteCekirdek.sikayet(ceteC(),CeteEkran.uid,CeteEkran.cete.id,m.id,neden.value);bildir('🚩 Bildirimin kaydedildi')}],['Vazgeç',null,true]])},0)}],['Vazgeç',null,true]]);
}
async function ceteSikayetleriAc() {
  const c=CeteEkran.cete,uid=CeteEkran.uid;if(!c||c.kurucu!==uid)return;
  try{const s=await CeteCekirdek.cete(ceteC(),c.id).collection('sikayetler').orderBy('zaman','desc').limit(30).get();
    if(CeteEkran.uid!==uid||CeteEkran.cete?.id!==c.id)return;
    const body=document.getElementById('tam-menu-bildirimler').querySelector('.menu-panel-ic');body.replaceChildren();
    for(const doc of s.docs){const v=doc.data();const m=await CeteCekirdek.mesajlar(ceteC(),c.id).doc(v.mesajId).get();if(CeteEkran.uid!==uid||CeteEkran.cete?.id!==c.id)return;body.append(ceteEl('p','kart',(m.exists ? m.data().ad+': '+m.data().metin : 'Mesaj artık görüntülenemiyor')+' · Bildirme nedeni: '+v.neden));}
    if(s.empty)body.append(ceteEl('p',null,'Henüz bildirim yok.'));tamAc('menu-bildirimler');
  }catch(e){bildir(ceteHataMetni(e));}
}
document.getElementById('sohbet-girdi').addEventListener('input',e=>{
  const match=e.target.value.match(/(?:^|\s)@([^@\n]*)$/);if(!match||!CeteEkran.cete)return;
  const alan=document.getElementById('sohbet-oneri');alan.replaceChildren();
  for(const uid of CeteEkran.cete.uyeler){const ad=ceteAd(CeteEkran.cete,uid);if(!ad.toLocaleLowerCase('tr').startsWith(match[1].toLocaleLowerCase('tr')))continue;
    alan.append(dugmeEl('@'+ad,()=>{e.target.value=e.target.value.slice(0,e.target.value.lastIndexOf('@'))+'@'+ad+' ';e.target.focus();oneriCiz()}));}
});
