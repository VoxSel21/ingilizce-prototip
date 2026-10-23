// ================= KELİME TURU: sıra, karıştırma, açık oturum (U16, 4. aşama) =================
// Saf mantık (Node testleri de yükler). Tur bir kez kurulur ve kayda yazılır (d.oturum): ekrandan çıkıp dönmek ya da
// sayfayı yenilemek sırayı değiştirmez, soru atlatmaz. Yeni tur kurulurken:
// - Bekleyen tekrarlar en çok gecikenden başlar; aynı gün gecikmiş olanlar kendi arasında karışır. Tekrar tarihine dokunulmaz.
// - Yeni kelimeler seviye/konu havuzundan eşit olasılıkla karışır (Fisher–Yates); yakında sunulanlar sona itilir.
// - Aynı kelime bir turda iki kez planlanmaz. Yanlış bilinen kelimenin turun sonundaki tekrarı bu sınıra girmez.
const OGRENME = { enCokTekrar: 20, grup: 3, sonSunulan: 40 };
const _karistir = typeof karistir === "function" ? karistir : require("./yardimci.js").karistir;

const Ogrenme = {
  // bekleyen: [{ id, sira }] tekrar günü gelmiş kelimeler · yeniler: [id] havuz · son: yakın geçmişte sunulanlar
  turOlustur({ bekleyen = [], yeniler = [], son = [], turBoyu = 10, rastgele = Math.random }) {
    const gorulen = new Set();
    const tekil = x => !gorulen.has(x) && gorulen.add(x);
    // Gecikme önceliği: önce sıra gününe göre gruplanır, her grup kendi içinde karışır.
    const gunler = [...new Set(bekleyen.map(b => b.sira))].sort((a, b) => a - b);
    const eski = gunler.flatMap(g => _karistir(bekleyen.filter(b => b.sira === g).map(b => b.id), rastgele)).filter(tekil).slice(0, OGRENME.enCokTekrar);
    const yakin = new Set(son);
    const karisik = _karistir(yeniler, rastgele);
    const yeni = karisik.filter(k => !yakin.has(k)).concat(karisik.filter(k => yakin.has(k))).filter(tekil).slice(0, Math.max(0, turBoyu - eski.length));
    // Yeniler üçlü gruplar: önce tanışma kartları, sonra aynı üçü karışık sorular. Ardından tekrarlar gecikme sırasıyla.
    const sira = [];
    for (let i = 0; i < yeni.length; i += OGRENME.grup) {
      const grup = yeni.slice(i, i + OGRENME.grup);
      grup.forEach(id => sira.push({ tip: "tanis", id }));
      _karistir(grup, rastgele).forEach(id => sira.push({ tip: "soru", id, yeni: true }));
    }
    eski.forEach(id => sira.push({ tip: "soru", id }));
    return sira;
  },

  // Kayıttaki açık tur geri yüklenebilir mi? Aynı gün, aynı deste, tanınan kelimeler ve bitmemiş olmalı.
  // Cevaplanmış ama "Devam"a basılmamış soru (sayfa o anda kapandıysa) yeniden sorulmaz: i bir ilerler.
  geriYukle(o, { gun, deste, bilinen }) {
    if (!o || typeof o !== "object" || o.gun !== gun || o.deste !== deste || !Array.isArray(o.sira)) return null;
    if (!o.sira.every(a => a && typeof a.id === "string" && bilinen.has(a.id) && (a.tip === "tanis" || a.tip === "soru"))) return null;
    let i = Number.isInteger(o.i) && o.i >= 0 ? o.i : 0;
    if (o.cevaplanan === i) i++;
    if (i >= o.sira.length) return null;
    return { ...o, i, cevaplanan: null };
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
