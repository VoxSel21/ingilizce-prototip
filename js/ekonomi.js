// ================= EKONOMİ: altının bütün girişleri ve çıkışları =================
// Saf mantık (Node testleri de yükler). Ödül miktarları burada, eşya/kürk/arka plan fiyatları kendi
// tablolarında (ESYALAR, KURKLER, TEMALAR). Arayüz altını doğrudan değiştirmez: Ekonomi.kazan / harca / satinAl.
// Denge (4. aşama, 2026-10-23): kazanç miktarları değişmedi (normal kullanıcı günde ~4 altın); dükkân fiyatları üç basamağa
// oturtuldu: küçük 5–8 (1–2 gün), orta 17–29 (4–7 gün), özel 42–59 (10–14 gün). Kimsenin bakiyesi ya da aldığı eşya değişmez.
// Tablo: node araclar/ekonomi-simulasyon.cjs → degerlendirmeler/ekonomi-simulasyon.md
const EKONOMI = {
  baslangicAltin: 3,
  odul: {
    gunlukHediye: { taban: 2, bonus: 1, bonusOlasilik: 0.3 }, // günlük hedef (10 soru) dolunca, günde bir
    cumleTuru: { miktar: 1, enAzDogru: 3, gunlukSinir: 3 },   // 5 cümlede en az 3 doğru; günde en çok 3 tur
    eslesme: { miktar: 1, sureSiniri: 45 },                    // Pati Çabukluğu 45 sn altı, günde bir
    balikAvi: { miktar: 1 },                                   // balığa ulaşınca, günde bir; sonrakiler ödülsüz pratik
    sohbet: { miktar: 1 },                                     // öğrenilen kelimeyi sohbette kullanmak, günde bir
    arkadas: { kelime:2, cumle:2, gun:3 },
    cete: { tanis:2, av:2 },
  },
  fiyat: { koruyucu: 10,
    esya: { kasket:5, hasir:6, silindir:8, kep:0, tac:42, fiyonk:5, zil:6, gozluk:6, gunes:8, bere:6, kravat:6, asci:18, inci:18, korsan:20, yildiz:20, cicek:22, monokl:45, bandana:0, yaprak:6, ay:18, kurdele:8, mantar:18, atki:8, pati:6, yuvarlak:8, uyku:17 },
    tema: { cayir:0, sahil:17, kar:18, sakura:20, ev:18, gece:25, sonbahar:18, kitaplik:22, teras:25 },
    renk: { mercan:10, deniz:10, lavanta:10 }, yeniRenk:10,
  },
  basarim: { ilk:1, on:3, hedef:2, seri5:2, seri30:10, cumle:2, ogrendi:3, sosyal:1, cete:5, ikili:2, savas:3, tema:1, farkli50:3, farkli100:5, ifade10:3, gun7:3 },
  basamak: { kucuk: [5, 8], orta: [17, 29], ozel: [42, 59] },   // fiyat basamakları (testler her ürünün birine girdiğini denetler)
  // Erken ödül hissi (U04): günlük hedefin %30 ve %60'ında küçük işaret (altın yok), hedefte hediye.
  hedefIsaret: [0.3, 0.6],
  // Günlük ödül anahtarlarının ön ekleri: defterde 90 günden eskileri silinir; rozet/çete/ikili kalıcıdır.
  gunlukOnEk: ["hediye", "cumle", "esles", "av", "sohbet"],
};

const Ekonomi = {
  gorunumPlani(d,g,esyalar,temalar) {
    if(!g||!/^#[0-9A-F]{6}$/i.test(g.renk)||!Object.hasOwn(temalar,g.tema)||!g.giyili)return {tamam:false,hata:'Görünüm seçimi geçersiz.'};
    const al=[];
    if(!Ekonomi.renkVar(d,g.renk))al.push({liste:'kurklar',id:g.renk.toUpperCase(),miktar:EKONOMI.fiyat.yeniRenk});
    if(!(d.temalar||[]).includes(g.tema))al.push({liste:'temalar',id:g.tema,miktar:temalar[g.tema].fiyat});
    for(const yer of ['sapka','boyun','goz']){
      const id=g.giyili[yer];if(id==null)continue;
      const e=esyalar.find(x=>x.id===id&&x.yer===yer);if(!e)return {tamam:false,hata:'Aksesuar seçimi geçersiz.'};
      const sahip=(d.esyalar||[]).includes(id),rozet=!!(e.rozet&&d.rozet?.[e.rozet]);
      if(e.rozet&&!sahip&&!rozet)return {tamam:false,hata:'Bu aksesuar için önce ilgili başarımı açmalısın.'};
      if(!sahip)al.push({liste:'esyalar',id,miktar:rozet?0:e.fiyat});
    }
    const miktar=al.reduce((n,x)=>n+x.miktar,0);
    if(!al.every(x=>Number.isInteger(x.miktar)&&x.miktar>=0))return {tamam:false,hata:'Ürün fiyatı geçersiz.'};
    return {tamam:true,al,miktar,yeterli:Ekonomi.tamSayi(d.yildiz)>=miktar};
  },
  renkVar(d,hex) {
    const renk=String(hex).toUpperCase();
    const eski={turuncu:'#FDBE86',krem:'#F1DDBF',gri:'#A9AAB8',siyah:'#4A4458',beyaz:'#FFFFFF',mercan:'#EF8D83',deniz:'#69B8BA',lavanta:'#9681BD'};
    return renk==='#FDBE86'||(d.kurklar||[]).some(id=>String(id).toUpperCase()===renk||eski[id]===renk);
  },
  renkAl(d,hex) {
    if(!/^#[0-9A-F]{6}$/i.test(hex))return 'gecersiz';
    if(Ekonomi.renkVar(d,hex))return 'zaten';
    return Ekonomi.satinAl(d,'kurklar',hex.toUpperCase(),EKONOMI.fiyat.yeniRenk);
  },
  // İz: altın her değiştiğinde çağrılır (durum.js eşitleme kuyruğu için bağlar; testlerde boş).
  iz: null,
  tamSayi: x => Math.max(0, Math.floor(Number(x) || 0)),

  // Aynı anahtar (ör. "hediye:20748", "rozet:on") bir kez ödenir. Ödenen miktarı döndürür (zaten ödendiyse 0).
  kazan(d, anahtar, miktar, bugun) {
    d.odulDefteri = d.odulDefteri || {};
    miktar = Ekonomi.tamSayi(miktar);
    if (!anahtar || d.odulDefteri[anahtar] != null || miktar === 0) return 0;
    d.odulDefteri[anahtar] = bugun != null ? bugun : 0;
    d.yildiz = Ekonomi.tamSayi(d.yildiz) + miktar;
    if (Ekonomi.iz) Ekonomi.iz({ tur: "kazan", anahtar, miktar });
    return miktar;
  },
  // Günde birden çok kez verilebilen ödül: "cumle:<gün>:0", ":1"... ilk boş sıraya yazılır.
  kazanSinirli(d, onEk, bugun, sinir, miktar) {
    for (let i = 0; i < sinir; i++) {
      const a = `${onEk}:${bugun}:${i}`;
      if (!(d.odulDefteri || {})[a]) return Ekonomi.kazan(d, a, miktar, bugun);
    }
    return 0;
  },
  odendiMi: (d, anahtar) => !!(d.odulDefteri && d.odulDefteri[anahtar] != null),

  // Bakiye yetmezse hiçbir şey değişmez; bakiye hiçbir zaman eksiye düşmez.
  // neden: satın alınan şeyin kimliği ("esyalar:tac"); eşitlemede aynı şey iki cihazdan alınsa da bir kez ücretlenir.
  harca(d, miktar, neden) {
    if (!Number.isInteger(miktar) || miktar < 0) return false;
    const bakiye = Ekonomi.tamSayi(d.yildiz);
    if (bakiye < miktar) return false;
    d.yildiz = bakiye - miktar;
    if (Ekonomi.iz) Ekonomi.iz({ tur: "harca", miktar, neden: neden || null });
    return true;
  },
  // Sahiplik ve bakiye aynı anda kontrol edilir: sahip olunan tekrar ücretlendirilmez, çift dokunma çift ödeme yapmaz.
  // Sonuç: "tamam" | "zaten" | "yetersiz".
  satinAl(d, liste, id, fiyat) {
    d[liste] = d[liste] || [];
    if (d[liste].includes(id)) return "zaten";
    if (!Number.isInteger(fiyat) || fiyat < 0 || Ekonomi.tamSayi(d.yildiz) < fiyat) return 'yetersiz';
    d.yildiz = Ekonomi.tamSayi(d.yildiz) - fiyat;
    d[liste].push(id);
    if (Ekonomi.iz) Ekonomi.iz({ tur: 'satinAl', liste, id, miktar: fiyat });
    return "tamam";
  },
  // Temizlik günü kayıttaki günden en çok bir gün ileri: saat aylarca ileri alınsa da bugünün kayıtları kalır (bkz. durum.js gunuYenile).
  temizlikGunu: (onceki, bugun) => Number.isInteger(onceki) ? Math.min(bugun, onceki + 1) : bugun,
  defterTemizle(d, bugun, gun = 90) {
    for (const [a, g] of Object.entries(d.odulDefteri || {}))
      if (EKONOMI.gunlukOnEk.includes(a.split(":")[0]) && g < bugun - gun) delete d.odulDefteri[a];
  },
  koruyucuAl(d, fiyat) {
    if (!Number.isInteger(fiyat) || fiyat < 0 || Ekonomi.tamSayi(d.yildiz) < fiyat) return false;
    d.yildiz = Ekonomi.tamSayi(d.yildiz) - fiyat; d.koruyucu++;
    if (Ekonomi.iz) Ekonomi.iz({ tur: 'koruyucuAl', miktar: fiyat });
    return true;
  },
};

if (typeof module === "object" && module.exports) module.exports = { EKONOMI, Ekonomi };
