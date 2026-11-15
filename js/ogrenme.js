// ================= KELİME TURU: sıra, karıştırma, açık oturum (U16, 4. aşama) =================
// Saf mantık (Node testleri de yükler). Tur bir kez kurulur ve kayda yazılır (d.oturum): ekrandan çıkıp dönmek ya da
// sayfayı yenilemek sırayı değiştirmez, soru atlatmaz. Yeni tur kurulurken:
// - Bekleyen tekrarlar en çok gecikenden başlar; aynı gün gecikmiş olanlar kendi arasında karışır. Tekrar tarihine dokunulmaz.
// - Yeni kelimeler seviye/konu havuzundan eşit olasılıkla karışır (Fisher–Yates); yakında sunulanlar sona itilir.
// - Aynı kelime bir turda iki kez planlanmaz. Yanlış bilinen kelimenin turun sonundaki tekrarı bu sınıra girmez.
const OGRENME = { enCokTekrar: 20, sonSunulan: 40 };
const _karistir = typeof karistir === "function" ? karistir : require("./yardimci.js").karistir;

const Ogrenme = {
  bilgilerOnce(sira) {
    return sira.filter(a => a.tip === "tanis").concat(sira.filter(a => a.tip === "soru"));
  },
  // Yeni turlarda en çok üç tanışma, ardından yalnız o grubun soruları.
  gruplar(sira, boy = 3) {
    const bilgiler = sira.filter(a => a.tip === "tanis"), sonuc = [], eklenen = new Set();
    for (let i = 0; i < bilgiler.length; i += boy) {
      const grup = bilgiler.slice(i, i + boy), ids = new Set(grup.map(a => a.id));
      sonuc.push(...grup);
      sira.forEach((a, n) => { if (a.tip === "soru" && ids.has(a.id)) { sonuc.push(a); eklenen.add(n); } });
    }
    return sonuc.concat(sira.filter((a, n) => a.tip === "soru" && !eklenen.has(n)));
  },
  bagliCumleler(sira, cumleler, enCok = 2) {
    const ids = new Set(sira.filter(a => a.tip === "soru").map(a => a.id));
    const secilen = [];
    // Aynı cümle iki kelimeye bağlı olabilir (ör. brother + drive): kelimeye ve cümle metnine göre tekil.
    for (const c of cumleler) if (ids.has(c[4]) && !secilen.some(x => x[4] === c[4] || x[0] === c[0])) {
      secilen.push(c); if (secilen.length === enCok) break;
    }
    return secilen;
  },
  // bekleyen: [{ id, sira }] tekrar günü gelmiş kelimeler · yeniler: [id] havuz · son: yakın geçmişte sunulanlar
  turOlustur({ bekleyen = [], yeniler = [], son = [], turBoyu = 10, tekrarSiniri = OGRENME.enCokTekrar, rastgele = Math.random }) {
    const gorulen = new Set();
    const tekil = x => !gorulen.has(x) && gorulen.add(x);
    // Gecikme önceliği: önce sıra gününe göre gruplanır, her grup kendi içinde karışır.
    const gunler = [...new Set(bekleyen.map(b => b.sira))].sort((a, b) => a - b);
    const eski = gunler.flatMap(g => _karistir(bekleyen.filter(b => b.sira === g).map(b => b.id), rastgele)).filter(tekil).slice(0, tekrarSiniri);
    const yakin = new Set(son);
    const karisik = _karistir(yeniler, rastgele);
    const yeni = karisik.filter(k => !yakin.has(k)).concat(karisik.filter(k => yakin.has(k))).filter(tekil).slice(0, Math.max(0, turBoyu - eski.length));
    // Önce tüm yeni kelimelerle tanışılır, sonra soruları ve gecikmiş tekrarlar gelir.
    const sira = yeni.map(id => ({ tip: "tanis", id }));
    _karistir(yeni, rastgele).forEach(id => sira.push({ tip: "soru", id, yeni: true }));
    eski.forEach(id => sira.push({ tip: "soru", id }));
    return Ogrenme.gruplar(sira);
  },

  // Kayıttaki açık tur geri yüklenebilir mi? Aynı gün, aynı deste, tanınan kelimeler ve bitmemiş olmalı.
  // Cevaplanmış ama "Devam"a basılmamış soru (sayfa o anda kapandıysa) yeniden sorulmaz: i bir ilerler.
  geriYukle(o, { gun, deste, bilinen }) {
    if (!o || typeof o !== "object" || o.gun !== gun || o.deste !== deste || !Array.isArray(o.sira)) return null;
    if (!o.sira.every(a => a && typeof a.id === "string" && bilinen.has(a.id) && (a.tip === "tanis" || a.tip === "soru"))) return null;
    let i = Number.isInteger(o.i) && o.i >= 0 ? o.i : 0;
    if (o.cevaplanan === i) i++;
    if (i >= o.sira.length) return o.cevaplanan === o.i && o.i === o.sira.length - 1 ? { ...o } : null;
    // Eski ve yeni kayıtlı turların tamamı kendi sırasını korur.
    const sira = o.sira.slice();
    return { ...o, sira, i, cevaplanan: null };
  },

  // Yakın geçmişte sunulan kelimeler (en yenisi başta, tekil, sınırlı)
  sunuldu(son, id) { return [id, ...(son || []).filter(x => x !== id)].slice(0, OGRENME.sonSunulan); },

  // Serbest pratik (spor, av) için seçim: yakın zamanda sunulmamış olanlar öne, kalan karışık.
  pratikSec(adaylar, son, n, rastgele = Math.random) {
    const yakin = new Set(son || []), k = _karistir(adaylar, rastgele);
    return k.filter(x => !yakin.has(x)).concat(k.filter(x => yakin.has(x))).slice(0, n);
  },
};

if (typeof module === "object" && module.exports) module.exports = { Ogrenme, OGRENME };

