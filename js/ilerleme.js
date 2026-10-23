// ================= ORTAK İLERLEME KURALLARI =================
// Saf mantık (Node testleri de yükler). Seri, takvim ve rozetler aynı kuralı kullanır.
// Nitelikli çalışma günü: o gün en az bir öğrenme sorusu cevaplandı (kart, phrasal, harf, Kelime Kur, cümle)
// ya da kelimeli bir oyun bitirildi (Pati Çabukluğu, balık avı, çete savaşı). Sohbete yazmak gün saymaz.
// Seri koruyucu: dün çalışılmadıysa ve önceki gün çalışıldıysa bir koruyucu harcanır, dün "korunan" olur.
// Korunan gün seriyi kesmez ama çalışılmış gün sayılmaz (seri uzunluğuna eklenmez).
const Ilerleme = {
  seri(gunler, korunan, bugun) {
    let s = 0, g = bugun;
    if (!gunler[g]) g--;
    while (gunler[g] || korunan[g]) { if (gunler[g]) s++; g--; }
    return s;
  },
  // Gün değişince bir kez çağrılır. Yeni koruyucu sayısını ve korunan günleri döndürür.
  koruyucuUygula(gunler, korunan, koruyucu, bugun) {
    const dun = bugun - 1;
    if (!gunler[dun] && !korunan[dun] && gunler[dun - 1] && koruyucu > 0) return { koruyucu: koruyucu - 1, korunan: { ...korunan, [dun]: 1 } };
    return { koruyucu, korunan };
  },
  // En uzun seri geçmişin tamamından aynı kuralla hesaplanır (korunan gün köprü olur, sayılmaz).
  enUzunSeri(gunler, korunan) {
    const hepsi = [...new Set([...Object.keys(gunler), ...Object.keys(korunan)].map(Number))].sort((a, b) => a - b);
    let en = 0, s = 0, onceki = null;
    for (const g of hepsi) {
      if (onceki !== null && g !== onceki + 1) s = 0;
      if (gunler[g]) s++;
      en = Math.max(en, s); onceki = g;
    }
    return en;
  },
  // Takvim, seri rozeti ve en uzun seri bu tek özetten okunur. kayitliEnUzun: eski sürümlerden gelen değer (düşürülmez).
  ozet(gunler, korunan, bugun, kayitliEnUzun = 0) {
    const seri = Ilerleme.seri(gunler, korunan, bugun);
    return { seri, enUzun: Math.max(kayitliEnUzun || 0, seri, Ilerleme.enUzunSeri(gunler, korunan)),
      calisilanGun: Object.keys(gunler).length, korunanGun: Object.keys(korunan).filter(g => !gunler[g]).length };
  },
  // Saat dilimi değişimi ya da saat geri alınması: kayıttaki gün en çok 1 gün ilerideyse o gün sürer (bugünkü sayaç sıfırlanmaz,
  // dünün ödülü yeniden açılmaz). Daha büyük geri sıçramada gerçek takvime dönülür; ödül defteri aynı günü ikinci kez ödemez.
  // İleri alınan saate karşı çevrimdışı tam koruma yoktur (raporda yazılı).
  etkinGun(gercek, kayitli) { return Number.isInteger(kayitli) && kayitli > gercek && kayitli - gercek <= 1 ? kayitli : gercek; },
  // Günlük hedefe giden yol: hedef cevap sayısıyla dolar (doğru ya da yanlış, her cevap çalışmadır); doğru sayısı ayrıca gösterilir.
  // Ara işaretler (EKONOMI.hedefIsaret oranları) altın vermez; ilerlemenin hissedilmesi içindir.
  hedefDurumu(sayi, dogru, hedef, oranlar = [0.3, 0.6]) {
    const isaretler = [...new Set(oranlar.map(o => Math.max(1, Math.round(hedef * o))))].filter(n => n < hedef);
    return { sayi, dogru, hedef, kalan: Math.max(0, hedef - sayi), tamam: sayi >= hedef, yuzde: Math.min(100, Math.round(sayi / hedef * 100)), isaretler };
  },
  // Bu cevapla bir işarete ya da hedefe varıldı mı? "isaret" | "hedef" | null (her biri günde bir kez, sayaç tek yönlü artar).
  isaretGecildi(onceki, sonraki, hedef, oranlar) {
    if (onceki < hedef && sonraki >= hedef) return "hedef";
    return Ilerleme.hedefDurumu(sonraki, 0, hedef, oranlar).isaretler.some(n => onceki < n && sonraki >= n) ? "isaret" : null;
  },
  // Bir soru cevaplandı: günlük hedef deneme sayısını sayar (yanlış da çalışmadır), doğrular ayrıca tutulur.
  soruSay(bugunKaydi, dogru) {
    bugunKaydi.sayi = (bugunKaydi.sayi || 0) + 1;
    if (dogru) bugunKaydi.dogru = (bugunKaydi.dogru || 0) + 1;
    return bugunKaydi;
  },
};

if (typeof module === "object" && module.exports) module.exports = { Ilerleme };
