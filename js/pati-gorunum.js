// Phosphor regular, yerel sprite. MIT lisansı resim/PHOSPHOR-LICENSE.txt içinde.
function patiIkon(ad) { return `<svg class="pati-ikon" aria-hidden="true"><use href="resim/pati-ikonlar.svg#${ad}"></use></svg>`; }
function kelimeGorseli(k) {
  const cizimler = ['apple','bread','milk','tea','egg','coffee','cup','sugar','tomato'];
  if (k[0] === 'cat') return '<img class="kelime-cizim" src="resim/kedi_fit.png" alt="">';
  if (cizimler.includes(k[0])) return `<img class="kelime-cizim" src="resim/nesne-${k[0]}.svg" alt="">`;
  return k[6] ? `<span aria-hidden="true">${k[2]}</span>` : '';
}
const PatiGorunum = {
  araclar() {
    document.querySelectorAll('.kapat').forEach(b=>{b.innerHTML=patiIkon('x');if(!b.hasAttribute('aria-label'))b.setAttribute('aria-label','Kapat');});
    document.querySelectorAll('.kucuk-ses,#c-ses,#s-ses').forEach(b=>{b.innerHTML=patiIkon('speaker-high');if(!b.hasAttribute('aria-label'))b.setAttribute('aria-label','Sesi dinle');});
  },
  ciz() {
    this.araclar();
    const nav = {ana:'house',takvim:'calendar',kedi:'cat',oduller:'trophy',arkadaslar:'users'};
    document.querySelectorAll('nav [data-sekme]').forEach(b => { const span=b.querySelector('span'); if(span&&!span.querySelector('svg'))span.innerHTML=patiIkon(nav[b.dataset.sekme]); });
    const seri=document.getElementById('seri-hap');seri.innerHTML=patiIkon('paw-print')+' '+seri.textContent.replace(/[^0-9]/g,'');seri.setAttribute('aria-label',`${seri.textContent.trim()} günlük seri`);
    const hedef=document.querySelector('#pist .hedef-balik');if(hedef)hedef.innerHTML='<img src="resim/nesne-fish.svg" alt="Balık">';
    const ad=document.getElementById('kedi-ad');ad.innerHTML=patiIkon('cat')+' '+d.kediAd;ad.setAttribute('aria-label','Kedi adını değiştir');
    const ayar=document.getElementById('ayarlar-ac'); ayar.innerHTML=patiIkon('gear');
    document.querySelectorAll('.ses-dugme').forEach(b => {b.innerHTML=patiIkon(d.sesKapali?'speaker-slash':'speaker-high');});
    for(const id of ['yildiz-hap','yildiz-hap2','yildiz-hap3']) {const el=document.getElementById(id);el.innerHTML=`${patiIkon('coins')} ${d.yildiz}`;el.setAttribute('aria-label',`${d.yildiz} altın`);}
    const kisim=document.getElementById('ekran-ana');
    kisim.querySelectorAll('.menu-links .menu-link').forEach((b,i)=>{if(!b.querySelector('svg'))b.innerHTML=patiIkon(i?'book-open':'paw-print')+b.textContent.replace(/^\S+\s/,'');});
  },
};

function patiPencereGorseli(ikon) {
  if (ikon === '🎁' || ikon === '🪙' || ikon === '🐟') return `<img class="sonuc-cizim" src="resim/nesne-${ikon === '🎁' ? 'gift' : ikon === '🪙' ? 'coin' : 'fish'}.svg" alt="">`;
  return ikon;
}
