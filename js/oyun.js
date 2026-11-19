// ================= KİLO, ANTRENMAN VE BALIK AVI KURALLARI (U17, U18, 4. aşama) =================
// Saf mantık (Node testleri de yükler). Kedinin kilosu yalnız buradan değişir; avın bütün kuralları
// (doğru, yanlış, üst üste yanlış, balıkçı, süre, kazanma) tek tanımdan gelir. Ekran yalnız çizer.

// ---------- Kilo ----------
// Kilo 3–9,5 kg. Yeni kelime öğrenmek besler, tekrar ve spor yakar, avda yakalanan balık besler.
const KILO = {
  enAz: 3, enCok: 9.5, baslangic: 4,
  hal: [[4.5, "fit"], [6, "pofuduk"], [7.5, "tombis"], [Infinity, "mega"]],   // üst sınır (hariç) → hal
  fark: { yeniKelime: 0.1, tekrar: -0.1, spor: -0.15, balik: 0.5 },
};
const UNUTMA = { gecikme: 3, kelimeBasi: 0.02, gunlukEnCok: 0.2, araEnCok: 1 };
const Kilo = {
  sinirla: k => { const n = typeof k === "number" || typeof k === "string" ? Number(k) : NaN;
    return Math.round(Math.min(KILO.enCok, Math.max(KILO.enAz, Number.isFinite(n) && k !== "" ? n : KILO.baslangic)) * 100) / 100; },
  degis: (k, fark) => Kilo.sinirla(Kilo.sinirla(k) + (Number(fark) || 0)),
  hali: k => KILO.hal.find(([ust]) => Kilo.sinirla(k) < ust)[1],
  // Bir kart cevabının kilo etkisi. Yanlış cevap ve turun içindeki ikinci deneme kiloyu değiştirmez.
  cevapFarki({ dogru, spor, yeni, tekrar }) {
    if (!dogru) return 0;
    if (spor) return KILO.fark.spor;
    if (yeni) return KILO.fark.yeniKelime;
    return tekrar ? 0 : KILO.fark.tekrar;
  },
  // Unutma kilosu (Halim'in isteği, 2026-11-19): tekrar günü UNUTMA.gecikme gün geçmiş, pekişmemiş her kelime
  // her gün kediye biraz ağırlık yapar. Pekişti kutusundaki kelime ağırlık yapmaz. Tavanlar geri dönen kullanıcıyı
  // kaçırmamak için: günde en çok UNUTMA.gunlukEnCok, bir aradan (iki açılış arası) en çok UNUTMA.araEnCok kg.
  // oncekiGun: kayıttaki son gün, bugun: yeni gün. Eklenecek kg'ı döndürür (0 ya da pozitif).
  unutma(kartlar, oncekiGun, bugun) {
    if (!Number.isInteger(oncekiGun) || !Number.isInteger(bugun) || bugun <= oncekiGun) return 0;
    const geciken = Object.values(kartlar || {}).filter(c => c && c.kutu < 4 && Number.isInteger(c.sira)).map(c => c.sira + UNUTMA.gecikme);
    let toplam = 0;
    for (let g = Math.max(oncekiGun + 1, bugun - 60); g <= bugun && toplam < UNUTMA.araEnCok; g++)
      toplam += Math.min(UNUTMA.gunlukEnCok, geciken.filter(s => s <= g).length * UNUTMA.kelimeBasi);
    return Math.round(Math.min(UNUTMA.araEnCok, toplam) * 100) / 100;
  },
  // Aynı turdaki aynı adım kiloyu bir kez değiştirir (çift dokunuş, sayfa yenileme, geri yükleme).
  // o.kiloAdim: bu turda kilosu işlenmiş adımlar. Uygulanan farkı döndürür; adım zaten işlendiyse null.
  adimUygula(d, o, adim, fark) {
    o.kiloAdim = o.kiloAdim || [];
    if (o.kiloAdim.includes(adim)) return null;   // bu adım zaten işlendi
    o.kiloAdim.push(adim);
    if (!fark) return 0;
    const once = d.kilo; d.kilo = Kilo.degis(d.kilo, fark);
    return Math.round((d.kilo - once) * 100) / 100;
  },
};

// ---------- Antrenman (spor salonu) ----------
// Sonuç kalıcıdır: kilo her doğru cevapta kaydedilir, günün toplamı d.antrenman'da durur. Yarıda çıkılan tur
// kayıtta açık kalır (d.oturum), geri gelince kaldığı yerden sürer; bitmiş adım ikinci kez sayılmaz.
const Antrenman = {
  // Günün toplamına bir doğru tekrar ekler (gün değişince sıfırdan başlar).
  say(d, gun, fark) {
    const a = d.antrenman && d.antrenman.gun === gun ? d.antrenman : { gun, tekrar: 0, kg: 0 };
    a.tekrar++; a.kg = Math.round((a.kg + fark) * 100) / 100;
    d.antrenman = a;
    return a;
  },
  ozet(kiloBas, kiloSon, dogru, toplam) {
    const fark = Math.round((kiloSon - kiloBas) * 100) / 100;
    return { dogru, toplam, fark, halBas: Kilo.hali(kiloBas), halSon: Kilo.hali(kiloSon) };
  },
};

// ---------- Balık avı ----------
// Kilo yalnız bir şeyi etkiler: bir doğru cevapta kedinin ne kadar atıldığı. Ağır kedi aynı yolu daha çok doğruyla
// yürür; yol, süre ve ceza herkes için aynı. Gereken doğru sayısı her kiloda soru sayısının altında: hep kazanılabilir.
const AV_KURAL = {
  yol: 100, sure: 30, soru: 10,
  gerekenDogru: { fit: 6, pofuduk: 7, tombis: 8, mega: 9 },
  ustUsteYanlis: 2,          // bu kadar art arda yanlışta kedi bir atılma geri kaçar
  dogruBekleme: 0.25, yanlisBekleme: 1,     // yanlışta doğru cevap bir saniye görünür; süre işlemeye devam eder
};
const Av = {
  atilma: kilo => Math.ceil(AV_KURAL.yol / AV_KURAL.gerekenDogru[Kilo.hali(kilo)]),
  gereken: kilo => AV_KURAL.gerekenDogru[Kilo.hali(kilo)],
  yeni: (kilo, pratik = false) => ({ pratik, kilo, atilma: Av.atilma(kilo), konum: 0, gecen: 0, i: 0, dogru: 0, yanlis: 0, ust: 0, sonuc: null }),
  // Bir cevap: konum ve sayaçlar güncellenir. Olay: { geriKac } (balıkçı gördü, kedi bir atılma geri).
  cevap(s, dogru) {
    if (s.sonuc) return { gecersiz: true };
    s.i++;
    let geriKac = false;
    if (dogru) { s.dogru++; s.ust = 0; s.konum += s.atilma; }
    else {
      s.yanlis++; s.ust++;
      if (s.ust >= AV_KURAL.ustUsteYanlis) { s.ust = 0; geriKac = true; s.konum = Math.max(0, s.konum - s.atilma); }
    }
    Av.denetle(s);
    return { geriKac };
  },
  // Gerçek geçen süre (sn) eklenir; ekran karesinin süresine bağlı değil. Uygulama arka plandayken çağrılmaz (duraklar).
  zaman(s, sn) { if (!s.sonuc && sn > 0) { s.gecen += sn; Av.denetle(s); } },
  kalan: s => Math.max(0, AV_KURAL.sure - s.gecen),
  denetle(s) {
    if (s.sonuc) return s.sonuc;
    if (s.konum >= AV_KURAL.yol) s.sonuc = "kazandi";
    else if (s.gecen >= AV_KURAL.sure) s.sonuc = "sure";
    else if (s.i >= AV_KURAL.soru) s.sonuc = "soru";   // sorular bitti, balığa yetişemedi
    return s.sonuc;
  },
  // Şu ana kadarki cevaplarla balığa toplam kaç doğru gerekiyor (geri kaçışlar sayıyı artırır)
  hedefDogru: s => s.dogru + Math.max(0, Math.ceil((AV_KURAL.yol - s.konum) / s.atilma)),
  // Bu kiloda kalan sorularla hâlâ yetişilebilir mi? (ekranda "son şans" uyarısı için)
  yetisir: s => s.konum + (AV_KURAL.soru - s.i) * s.atilma >= AV_KURAL.yol,
  // Saat: süre gerçek geçen zamandan işler; uygulama arka plandayken durur (duraklat/surdur), dönünce kaldığı yerden sürer.
  saat: () => ({ son: null, durdu: false }),
  tik(s, saat, simdi) { if (saat.durdu) return; if (saat.son != null) Av.zaman(s, (simdi - saat.son) / 1000); saat.son = simdi; },
  duraklat(s, saat, simdi) { Av.tik(s, saat, simdi); saat.durdu = true; },
  surdur(saat, simdi) { saat.durdu = false; saat.son = simdi; },
  // Günlük hak: günün ilk avı ödüllü; ilk cevap verilince hak kullanılmış sayılır (yarıda kapatmak yeniden ödül denemesi açmaz).
  odulluMu: (d, gun) => d.avGunu !== gun,
  hakKullan(d, gun) { d.avGunu = gun; (d.avlar = d.avlar || {})[gun] = 1; },
};

if (typeof module === "object" && module.exports) module.exports = { KILO, UNUTMA, Kilo, Antrenman, AV_KURAL, Av };
