// Kısa örneklem: tahmin üretir, CEFR belgesi veya bütün kelimelerin bilindiği iddiası değildir.
const SINAV_SEVIYELER=['A1','A2','B1','B2'];
const SINAV_DIL=[
 ['She ___ a student.','is',['are','am','be']],
 ['We ___ to the cinema yesterday.','went',['go','going','have go']],
 ['If I had more time, I ___ more books.','would read',['will read','readed','am read']],
 ['By the time we arrived, the film ___.','had started',['has start','was start','will started']],
];
const SINAV_OKUMA=[
 ['Mia has a cat. Its name is Snow. What is the cat called?','Snow',['Mia','Cat','Tom']],
 ['Leo usually walks to school, but today it is raining, so he takes the bus. How does he travel today?','By bus',['On foot','By train','By bicycle']],
 ['The library closes at six. Nia arrived at five thirty and borrowed a book before leaving. Why was she able to borrow it?','She arrived before closing time.',['The library was already closed.','She works at the library.','It closes at five.']],
 ['Although the trial was promising, the researchers cautioned that the sample was too small to draw firm conclusions. What did they suggest?','More evidence is needed.',['The treatment certainly works.','The trial should be ignored.','The sample proved every claim.']],
];
// Aynı seviyede kalan kişiye aynı dilbilgisi/okuma sorusu yeniden sorulmaz.
const SINAV_EK_DIL=[
 [['They ___ my friends.','are',['is','am','be']],['I have ___ apple.','an',['a','two','many']],['There ___ two cats here.','are',['is','am','be']]],
 [['She ___ breakfast when I called.','was having',['has','have','is have']],['Have you ___ visited London?','ever',['yesterday','ago','last']],['This book is ___ than that one.','more interesting',['most interesting','interestinger','much interesting']]],
 [['I have lived here ___ 2020.','since',['for','during','until']],['The letter ___ yesterday.','was sent',['sent','has send','is sending']],['You ___ wear a helmet; it is required.','must',['might','could perhaps','would']]],
 [['I wish I ___ about the delay earlier.','had known',['have known','will know','know']],['Not only ___ late, but he also forgot the tickets.','was he',['he was','he is being','he has']],['She denied ___ the confidential report.','sharing',['to share','share','to sharing']]],
];
const SINAV_EK_OKUMA=[
 [['Tom is ten. His sister is eight. Who is older?','Tom',['His sister','They are the same age','Their father']],['The shop opens at nine. It is eight now. Is it open?','No',['Yes','Only on Monday','It never closes']],['Ana drinks water with lunch. What does she drink?','Water',['Coffee','Milk','Juice']]],
 [['Sara missed the bus, so she called a taxi. Why did she need a taxi?','She missed the bus.',['She lost her phone.','She wanted to walk.','The taxi was free.']],['The sign says: Please return books by Friday. When should the books be returned?','No later than Friday.',['Only on Saturday.','Next month.','After Friday.']],['Ben wanted to swim, but the pool was closed for repairs. Why could he not swim there?','The pool needed repairs.',['He could not find his towel.','He was too tired.','The weather was cold.']]],
 [['The train was delayed, yet Maya reached the meeting on time because she had left early. What helped her?','Leaving early.',['Cancelling the meeting.','Taking a later train.','Working from home.']],['Customers may exchange unused items within fourteen days with a receipt. Which item can be exchanged?','An unused item bought a week ago with its receipt.',['A used item bought yesterday.','An unused item without a receipt.','An item bought two months ago.']],['The café stopped using plastic cups to reduce waste, even though reusable cups cost more at first. What was its main goal?','Reducing waste.',['Cutting every initial cost.','Serving fewer customers.','Closing the café.']]],
 [['The proposal was welcomed in principle, but approval was withheld pending a detailed budget. What is required before approval?','A detailed budget.',['A different proposal with no budget.','Immediate implementation.','Public rejection.']],['Demand rose despite a price increase, suggesting customers valued the product beyond its cost. What does this imply?','Price was not the only factor in demand.',['The price definitely fell.','Customers stopped buying it.','Cost had no relevance to anyone.']],['The author acknowledges the policy’s short-term benefits while questioning its long-term viability. How is the author’s position best described?','Qualified support with reservations.',['Complete rejection of all benefits.','Unconditional approval.','Indifference to the policy.']]],
];
const SeviyeSinavi={
  gecerli(s){return s&&s.surum===1&&Number.isInteger(s.i)&&s.i>=0&&s.i<=16&&Number.isInteger(s.duzey)&&s.duzey>=0&&s.duzey<=3&&typeof s.atlandi==='boolean'&&s.tamam===(s.i===16)&&Number.isFinite(s.zaman)&&Array.isArray(s.cevaplar)&&s.cevaplar.length===s.i&&s.cevaplar.every(c=>c&&['kelime','dilbilgisi','okuma'].includes(c.tur)&&SINAV_SEVIYELER.includes(c.seviye)&&typeof c.dogru==='boolean')&&Array.isArray(s.sorular)&&s.sorular.length<=16&&s.sorular.length>=s.i&&s.sorular.every(q=>q&&['kelime','dilbilgisi','okuma'].includes(q.tur)&&SINAV_SEVIYELER.includes(q.seviye)&&typeof q.metin==='string'&&q.metin.length<=600&&typeof q.dogru==='string'&&Array.isArray(q.siklar)&&q.siklar.length===4&&q.siklar.every(x=>typeof x==='string'&&x.length<=240)&&q.siklar.includes(q.dogru));},
  yeni(){return {surum:1,i:0,duzey:0,sorular:[],cevaplar:[],tamam:false,atlandi:false,zaman:Date.now()};},
  soru(s,kelimeler,karistir){
    if(s.sorular[s.i])return s.sorular[s.i];
    const seviye=SINAV_SEVIYELER[s.duzey],tur=['kelime','dilbilgisi','okuma','kelime'][s.i%4];
    let metin,dogru,diger;
    if(tur==='kelime'){
      const once=new Set(s.sorular.map(x=>x.kelime)),havuz=kelimeler.filter(k=>k[5]===seviye&&!once.has(k[0]));
      const k=karistir(havuz)[0]||kelimeler[0];metin=`“${k[0]}” ne demek?`;dogru=k[1];
      diger=[...new Set(karistir(kelimeler.filter(x=>x[1]!==dogru)).map(x=>x[1]))].slice(0,3);
      s.sorular[s.i]={tur,seviye,metin,dogru,siklar:karistir([dogru,...diger]),kelime:k[0]};
    }else{const n=s.sorular.filter(q=>q.tur===tur&&q.seviye===seviye).length,ilk=(tur==='dilbilgisi'?SINAV_DIL:SINAV_OKUMA)[s.duzey],ek=(tur==='dilbilgisi'?SINAV_EK_DIL:SINAV_EK_OKUMA)[s.duzey];[metin,dogru,diger]=[ilk,...ek][n];s.sorular[s.i]={tur,seviye,metin,dogru,siklar:karistir([dogru,...diger])};}
    return s.sorular[s.i];
  },
  cevap(s,cevap){
    const q=s.sorular[s.i];if(!q||!q.siklar.includes(cevap)||s.tamam)return false;
    const dogru=cevap===q.dogru;s.cevaplar.push({tur:q.tur,seviye:q.seviye,dogru});s.i++;
    // Her dört sorudan sonra basamak değişir; aynı sorular yeniden seçilmez.
    if(s.i%4===0){const n=s.cevaplar.slice(-4).filter(x=>x.dogru).length;s.duzey=Math.max(0,Math.min(3,s.duzey+(n>=3?1:n<=1?-1:0)));}
    s.tamam=s.i>=16;s.zaman=Date.now();return true;
  },
  sonuc(s){
    const konular={};for(const tur of ['kelime','dilbilgisi','okuma','dinleme']){const c=s.cevaplar.filter(x=>x.tur===tur);konular[tur]={sayi:c.length,dogru:c.filter(x=>x.dogru).length,guven:c.length>=6?'orta':c.length?'sınırlı':'henüz ölçülmedi'};}
    const kanit=SINAV_SEVIYELER.filter(l=>{const c=s.cevaplar.filter(x=>x.seviye===l);return c.length>=4&&c.filter(x=>x.dogru).length/c.length>=.7;});
    return {seviye:kanit.at(-1)||'A1',guven:'sınırlı',konular,tamam:s.tamam,zaman:s.zaman};
  },
  ortalama(profiller,uyeSayisi){
    const olculen=profiller.filter(p=>SINAV_SEVIYELER.includes(p?.seviye)),dagilim=Object.fromEntries(SINAV_SEVIYELER.map(s=>[s,olculen.filter(p=>p.seviye===s).length]));
    const etiket=olculen.length?SINAV_SEVIYELER[Math.round(olculen.reduce((n,p)=>n+SINAV_SEVIYELER.indexOf(p.seviye),0)/olculen.length)]:null;
    return {etiket,dagilim,olculen:olculen.length,uyeSayisi};
  },
};
if(typeof module==='object'&&module.exports)module.exports={SeviyeSinavi,SINAV_SEVIYELER};
