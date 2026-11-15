// Arkadaşlık çete üyeliğinden bağımsızdır. Eşleşme için iki kişinin de kabulü gerekir.
const _ArkEk=typeof EKONOMI!=='undefined'?EKONOMI:require('./ekonomi.js').EKONOMI;
const ARKADAS_GOREV = {
  kelime: { ad:'20 yeni kelime veya ifade çalışın', hedef:20, odul:_ArkEk.odul.arkadas.kelime },
  cumle: { ad:'İkiniz de 5 doğru cümle kurun', hedef:5, odul:_ArkEk.odul.arkadas.cumle },
  gun: { ad:'İkiniz de 3 farklı gün çalışın', hedef:3, odul:_ArkEk.odul.arkadas.gun },
};
const ArkadasKural = {
  kimlik(a,b) { if(!a||!b||a===b)throw Error('kendin');return [a,b].sort().join('--'); },
  bitis(g) { return g.baslangic ? g.baslangic.toMillis()+7*86400000 : Infinity; },
  toplam(d,tur) { return tur==='kelime' ? new Set([...Object.keys(d.kartlar||{}),...Object.keys(d.calisilanlar||{})]).size : tur==='cumle' ? d.cumleDogru||0 : Object.keys(d.gunler||{}).length; },
  ilerleme(taban,toplam,hedef) { return Math.min(hedef,Math.max(0,toplam-taban)); },
  bitti(g) { return g.uyeler.every(uid => g.katki[uid] && g.katki[uid].deger>=g.hedef); },
};
if(typeof module==='object'&&module.exports)module.exports={ArkadasKural,ARKADAS_GOREV};
