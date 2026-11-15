// Küçük editoryal seçki: Pati / Codex, 2026-11-07, CC BY-SA 4.0.
// Ana havuzun kimlikleri, örnekleri ve kaynak kayıtları değiştirilmez.
const MINI_DURUMLAR = [
  { id: 'masa', ad: 'Pati ile masanın başında', not: 'Elma, ekmek… Pati de masanın yanında.',
    kelimeler: ['cat', 'apple', 'bread'],
    ornekler: {cat:['The cat is by the table.','Kedi masanın yanında.'],apple:['The apple is on the table.','Elma masanın üstünde.'],bread:['The bread is on the table.','Ekmek masanın üstünde.']},
    cumleler: [['Elma masanın üstünde.','The apple is on the table',[],'A1','apple'],['Ekmek masanın üstünde.','The bread is on the table',[],'A1','bread'],['Kedi masanın yanında.','The cat is by the table',[],'A1','cat']] },
  { id: 'kahvalti', ad: 'Kahvaltıyı hazırlayalım', not: 'Pati bakıyor; kahvaltıyı sen hazırlıyorsun.',
    kelimeler: ['milk','tea','egg'],
    ornekler: {milk:['I drink milk at breakfast.','Kahvaltıda süt içerim.'],tea:['The tea is in the cup.','Çay fincanda.'],egg:['I have an egg for breakfast.','Kahvaltıda bir yumurta yerim.']},
    cumleler: [['Kahvaltıda süt içerim.','I drink milk at breakfast',[],'A1','milk'],['Çay fincanda.','The tea is in the cup',[],'A1','tea'],['Bir yumurta istiyorum.','I want an egg',[],'A1','egg']] },
  { id: 'kafe', ad: 'Kafede küçük bir sipariş', not: 'Pati pencereye yerleşti. Bir şey içelim mi?',
    kelimeler: ['coffee','cup','sugar'],
    ornekler: {coffee:['I want a coffee, please.','Bir kahve istiyorum, lütfen.'],cup:['This is my cup.','Bu benim fincanım.'],sugar:['No sugar, please.','Şekersiz olsun, lütfen.']},
    cumleler: [['Bir kahve istiyorum, lütfen.','I want a coffee please',[],'A1','coffee'],['Bu benim fincanım.','This is my cup',[],'A1','cup'],['Şekersiz olsun, lütfen.','No sugar please',[],'A1','sugar']] },
];
const MiniDers = {
  boy(sayi, hedef) { return sayi >= hedef ? 3 : Math.min(3, Math.max(1, hedef - sayi)); },
  durum(kartlar, seviye, konu) {
    if (seviye !== 'A1' || konu) return null;
    return MINI_DURUMLAR.find(s => s.kelimeler.some(id => !kartlar[id])) || null;
  },
  ozet(tur) {
    const sorular = tur.sira.slice(0, tur.i).filter(a => a.tip === 'soru');
    return {kelime: new Set(sorular.map(a => a.id)).size, yeni: tur.sira.slice(0,tur.i).filter(a => a.tip === 'tanis').length,
      cevap: tur.dogru + tur.yanlis, dogru: tur.dogru, yanlis: tur.yanlis};
  },
};
if (typeof module === 'object' && module.exports) module.exports = { MiniDers, MINI_DURUMLAR };
