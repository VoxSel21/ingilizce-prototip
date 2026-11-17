// Ayrı özelleştirme ekranı: önizleme taslaktır; sahiplik ve bakiye yalnız Uygula'da değişir.
const Ozellestirme={taslak:null,yer:'sapka',sekme:'renk',
  ac(sekme='renk'){
    this.taslak={renk:d.kurkRenk,tema:d.tema,giyili:{...d.giyili}};this.sekme=sekme;this.ciz();tamAc('ozellestirme');document.getElementById('tam-ozellestirme').scrollTop=0;
  },
  dugme(ad,fn,cls=''){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=ad;b.onclick=fn;return b;},
  sekmeAc(ad){this.sekme=ad;document.querySelectorAll('#tam-ozellestirme [data-oz-tab]').forEach(b=>{const sec=b.dataset.ozTab===ad;b.setAttribute('aria-selected',sec);b.tabIndex=sec?0:-1;});for(const id of ['renk','aksesuar','arka'])document.getElementById('oz-'+id).hidden=id!==ad;},
  ciz(){
    const g=this.taslak;if(!g)return;const bul=id=>document.getElementById('oz-'+id);
    bul('bakiye').textContent='🪙 '+d.yildiz;bul('onizleme').style.backgroundImage=`url(resim/bg_${g.tema}.jpg)`;
    kediGuncelle(bul('kedi'),KediCizici.gorunum({renk:g.renk,giyili:{...g.giyili}}));
    bul('renkler').replaceChildren(...HAZIR_RENKLER.concat(Object.values(OZEL_RENKLER).map(x=>[x.ana,x.ad])).map(([hex,ad])=>{
      const b=this.dugme('',()=>{g.renk=hex;this.ciz();},'oz-renk');b.style.background=hex;b.setAttribute('aria-label',ad+(Ekonomi.renkVar(d,hex)?' · sende':' · 10 altın'));b.setAttribute('aria-pressed',g.renk===hex);return b;
    }));
    bul('kod').textContent=g.renk;bul('ozel-renk').value=g.renk;
    document.querySelectorAll('[data-oz-yer]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.ozYer===this.yer));
    const yok=this.dugme('∅\nAksesuar yok',()=>{g.giyili[this.yer]=null;this.ciz();},'oz-urun');yok.setAttribute('aria-pressed',g.giyili[this.yer]===null);
    bul('esyalar').replaceChildren(yok,...ESYALAR.filter(e=>e.yer===this.yer).map(e=>{
      const var_=esyaVarMi(e),kilit=e.rozet&&!var_,b=this.dugme('',()=>{g.giyili[e.yer]=g.giyili[e.yer]===e.id?null:e.id;this.ciz();},'oz-urun');b.disabled=!!kilit;b.setAttribute('aria-pressed',g.giyili[e.yer]===e.id);
      const img=document.createElement('img');img.src=`resim/esya_${e.id}.${esyaUzanti(e.id)}`;img.alt='';const ad=document.createElement('b'),f=document.createElement('small');ad.textContent=e.ad;f.textContent=var_?'Sende ✓':kilit?'Başarımla açılır':e.fiyat+' 🪙';b.append(img,ad,f);return b;
    }));
    bul('temalar').replaceChildren(...Object.entries(TEMALAR).map(([id,t])=>{
      const b=this.dugme('',()=>{g.tema=id;this.ciz();},'oz-urun');b.setAttribute('aria-pressed',g.tema===id);const img=document.createElement('img');img.src=`resim/bg_${id}.jpg`;img.alt='';const ad=document.createElement('b'),f=document.createElement('small');ad.textContent=t.ad;f.textContent=d.temalar.includes(id)?'Sende ✓':t.fiyat+' 🪙';b.append(img,ad,f);return b;
    }));
    const p=Ekonomi.gorunumPlani(d,g,ESYALAR,TEMALAR);bul('toplam').textContent=p.tamam?(p.miktar?p.miktar+' 🪙':'Seçtiklerin koleksiyonunda'):p.hata;
    bul('uygula').textContent=p.tamam&&p.miktar?'Al ve uygula · '+p.miktar+' 🪙':'Değişiklikleri uygula';bul('uygula').disabled=!p.tamam||!p.yeterli;
    bul('bilgi').textContent=p.tamam&&!p.yeterli?'Bu seçimler için altının yetmiyor.':'Önizleme ücretsiz. Alınan renk ve eşyalar tekrar ücret istemez.';this.sekmeAc(this.sekme);
  },
  uygula(){
    const g=this.taslak;if(!g)return;const p=Ekonomi.gorunumPlani(d,g,ESYALAR,TEMALAR);if(!p.tamam||!p.yeterli)return;
    const onceki=d,yedek=JSON.parse(JSON.stringify(d)),izBas=bekleyenDefter.length;
    for(const a of p.al)Ekonomi.satinAl(d,a.liste,a.id,a.miktar);
    d.kurkRenk=g.renk.toUpperCase();d.kurk=Object.keys(OZEL_RENKLER).find(id=>OZEL_RENKLER[id].ana===d.kurkRenk)||'turuncu';d.tema=g.tema;d.giyili={...g.giyili};d.sonRenkler=[d.kurkRenk,...(d.sonRenkler||[]).filter(x=>x!==d.kurkRenk)].slice(0,8);
    if(!kaydet()){
      if(d===onceki){d=yedek;bekleyenDefter.splice(izBas);}
      this.taslak={renk:d.kurkRenk,tema:d.tema,giyili:{...d.giyili}};this.ciz();bildir('Görünüm uygulanamadı; güncel kayıt korundu.');return;
    }
    Ses.altin();this.ciz();herSeyiCiz();bildir('🎨 Görünümün uygulandı');
  },
};
const ozEkran=document.createElement('section');ozEkran.id='tam-ozellestirme';ozEkran.className='tam oz-ekran';
ozEkran.innerHTML=`<div class="oz-ust"><button class="kapat" id="oz-kapat" aria-label="Özelleştirmeyi kapat">✕</button><h2>Özelleştirme</h2><span class="hap" id="oz-bakiye"></span></div><p class="oz-aciklama">Kürkünü, aksesuarlarını ve arka planını birlikte düzenle.</p>
<div class="oz-onizleme" id="oz-onizleme"><small>Görünüm önizlemesi</small><div id="oz-kedi"></div></div>
<div class="oz-sekmeler" role="tablist" aria-label="Özelleştirme kategorileri"><button id="oz-tab-renk" data-oz-tab="renk" role="tab" aria-controls="oz-renk">Kürk rengi</button><button id="oz-tab-aksesuar" data-oz-tab="aksesuar" role="tab" aria-controls="oz-aksesuar">Aksesuar</button><button id="oz-tab-arka" data-oz-tab="arka" role="tab" aria-controls="oz-arka">Arka plan</button></div>
<div class="oz-icerik" id="oz-renk" role="tabpanel" aria-labelledby="oz-tab-renk"><h3>Bir renk seç</h3><div id="oz-renkler"></div><label class="oz-ozel">Rengini kendin oluştur <input type="color" id="oz-ozel-renk" aria-label="Özel kürk rengi"></label><p id="oz-kod"></p></div>
<div class="oz-icerik" id="oz-aksesuar" role="tabpanel" aria-labelledby="oz-tab-aksesuar" hidden><h3>Aksesuarlarını seç</h3><div class="oz-yerler"><button data-oz-yer="sapka">Şapka</button><button data-oz-yer="boyun">Boyun</button><button data-oz-yer="goz">Göz</button></div><div id="oz-esyalar" class="oz-katalog"></div></div>
<div class="oz-icerik" id="oz-arka" role="tabpanel" aria-labelledby="oz-tab-arka" hidden><h3>Bir arka plan seç</h3><div id="oz-temalar" class="oz-katalog oz-temalar"></div></div>
<div class="oz-son"><b id="oz-toplam"></b><div class="oz-aksiyon"><button id="oz-vazgec" class="buyuk-dugme mor">Vazgeç</button><button id="oz-uygula" class="buyuk-dugme">Değişiklikleri uygula</button></div><p id="oz-bilgi" role="status"></p></div>`;
document.getElementById('uygulama').append(ozEkran);
document.getElementById('oz-kapat').onclick=tamKapat;document.getElementById('oz-vazgec').onclick=tamKapat;document.getElementById('oz-uygula').onclick=()=>Ozellestirme.uygula();
document.getElementById('oz-ozel-renk').oninput=e=>{Ozellestirme.taslak.renk=e.target.value.toUpperCase();Ozellestirme.ciz();};
ozEkran.querySelectorAll('[data-oz-tab]').forEach(b=>{b.onclick=()=>Ozellestirme.sekmeAc(b.dataset.ozTab);b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=['renk','aksesuar','arka'],i=e.key==='Home'?0:e.key==='End'?2:(tabs.indexOf(Ozellestirme.sekme)+(e.key==='ArrowRight'?1:2))%3;Ozellestirme.sekmeAc(tabs[i]);document.getElementById('oz-tab-'+tabs[i]).focus();};});
ozEkran.querySelectorAll('[data-oz-yer]').forEach(b=>b.onclick=()=>{Ozellestirme.yer=b.dataset.ozYer;Ozellestirme.ciz();});
Oturumlar.ekle('ozellestirme',()=>{Ozellestirme.taslak=null;});
