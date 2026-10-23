// ================= KAYIT ŞEMASI, DOĞRULAMA VE SÜRÜM TAŞIMA =================
// Saf mantık: tarayıcıya bağlı değil, Node testleri de aynı dosyayı yükler (tests/).
// Kayıt ve yedek kodu önce burada doğrulanır; bozuk ya da tehlikeli veri mevcut ilerlemenin yerine geçmez.
// Kayıt biçimi geçmişi          // 3: sürüm alanı, ödül defteri, ayrıntılı doğrulama (2026-10-22) · 4: serbest kürk rengi (2026-10-23)
                                 // 5: açık kelime turu (oturum), yakında sunulanlar, günün antrenmanı (2026-10-23)
const SEMA_SURUM = 6;            // 6: misafir kimliği (kimlik.misafir), hesaba tek seferlik taşıma için (2026-10-23)
const MISAFIR_DESENI = /^m-[0-9a-z]{6,32}$/;
const YEDEK_EN_FAZLA = 1500000;  // yedek kodunun en fazla karakteri (bozuk ya da şişirilmiş yedeğe karşı)
const SINIR = { sohbet: 200, metin: 500, kim: 30, kediAd: 14, liste: 500 };
// Ayarlar ekranının izinli değerleri; bilinmeyen değer varsayılana döner.
// 4. sürüm: eski hazır kürkler (renk süzgeci) serbest renge çevrilir. Satın alınmış kürk listesi silinmez.
const ESKI_KURK_RENK = { turuncu: "#FDBE86", krem: "#F1DDBF", gri: "#A9AAB8", siyah: "#4A4458", beyaz: "#F7F7FA" };
const RENK_DESENI = /^#[0-9a-f]{6}$/i;
const AYAR_SECENEK = { hedef: [5, 10, 15, 20], tema: ["sistem", "pastel", "koyu", "kontrast"], hareket: ["sistem", "azalt", "normal"] };

const Kayit = {
  // Sonuç: { tamam: true } ya da { tamam: false, hata: "kullanıcıya gösterilecek kısa neden" }.
  dogrula(v) {
    const nesne = x => x !== null && typeof x === "object" && !Array.isArray(x);
    const sayi = x => typeof x === "number" && isFinite(x);
    const hata = h => ({ tamam: false, hata: h });
    if (!nesne(v)) return hata("Kayıt biçimi tanınmadı.");
    if (v.surum != null && (!Number.isInteger(v.surum) || v.surum > SEMA_SURUM))
      return hata("Bu yedek uygulamanın daha yeni bir sürümünden. Önce uygulamayı güncelle.");
    if (!sayi(v.yildiz) || v.yildiz < 0) return hata("Altın bilgisi bozuk.");
    if (!nesne(v.kartlar)) return hata("Kelime ilerlemesi bulunamadı.");
    if (Object.keys(v.kartlar).length > 5000) return hata("Kelime ilerlemesi beklenenden büyük.");
    for (const c of Object.values(v.kartlar)) {
      if (!nesne(c) || !Number.isInteger(c.kutu) || c.kutu < 0 || c.kutu > 4 || !Number.isInteger(c.sira)) return hata("Bir kelimenin tekrar bilgisi bozuk.");
      if (c.hata != null && (!sayi(c.hata) || c.hata < 0)) return hata("Bir kelimenin hata sayısı bozuk.");
    }
    for (const alan of ["gunler", "korunan", "avlar", "tanisGun", "rozet", "ceteOdul", "odulDefteri"]) {
      if (v[alan] == null) continue;
      if (!nesne(v[alan]) || Object.keys(v[alan]).length > 5000) return hata(`"${alan}" alanı bozuk.`);
      if (!Object.values(v[alan]).every(sayi)) return hata(`"${alan}" alanında sayı olmayan değer var.`);
    }
    if (v.bugun != null && !(nesne(v.bugun) && Number.isInteger(v.bugun.no))) return hata("Günlük bilgi bozuk.");
    for (const alan of ["esyalar", "temalar", "kurklar"]) {
      if (v[alan] != null && (!Array.isArray(v[alan]) || v[alan].length > SINIR.liste)) return hata(`"${alan}" listesi bozuk.`);
    }
    if (v.icerikBildirim != null && (!Array.isArray(v.icerikBildirim) || v.icerikBildirim.length > SINIR.liste)) return hata("İçerik bildirimleri bozuk.");
    if (v.sohbet != null && (!Array.isArray(v.sohbet) || v.sohbet.length > SINIR.sohbet * 5)) return hata("Sohbet kaydı bozuk.");
    if (v.kediAd != null && typeof v.kediAd !== "string") return hata("Kedi adı bozuk.");
    if (v.kurkRenk != null && !(typeof v.kurkRenk === "string" && RENK_DESENI.test(v.kurkRenk))) return hata("Kürk rengi bozuk.");
    if (v.sonRenkler != null && (!Array.isArray(v.sonRenkler) || v.sonRenkler.length > 50)) return hata("Son renkler listesi bozuk.");
    if (v.ayar != null && !nesne(v.ayar)) return hata("Ayarlar bozuk.");
    if (v.oturum != null && !(nesne(v.oturum) && Array.isArray(v.oturum.sira) && v.oturum.sira.length <= 200)) return hata("Açık kelime turu bozuk.");
    if (v.sonSunulan != null && (!Array.isArray(v.sonSunulan) || v.sonSunulan.length > 200)) return hata("Son kelimeler listesi bozuk.");
    if (v.antrenman != null && !(nesne(v.antrenman) && ["gun", "tekrar", "kg"].every(a => sayi(v.antrenman[a])))) return hata("Antrenman bilgisi bozuk.");
    if (v.kimlik != null && !nesne(v.kimlik)) return hata("Kimlik bilgisi bozuk.");
    return { tamam: true };
  },

  // Eski kayıtları bugünkü biçime getirir. Tekrar çalıştırmak sonucu değiştirmez (idempotent):
  // hiçbir değer artırılmaz, yalnız eksikler tamamlanır, bozuk parçalar atılır, sınır dışı değerler sınıra çekilir.
  // izin: { kelimeler, esyalar, temalar, kurklar } — tanınan kimlik kümeleri (Set).
  tasi(v, varsayilan, izin) {
    const t = varsayilan, eskiSurum = Number.isInteger(v.surum) ? v.surum : 2;
    for (const a in t) if (v[a] == null || typeof v[a] !== typeof t[a]) v[a] = t[a];
    const liste = (a, kume) => (Array.isArray(v[a]) ? v[a] : t[a]).filter(x => typeof x === "string" && (!kume || kume.has(x)));
    v.yildiz = Math.max(0, Math.floor(v.yildiz));
    v.temalar = liste("temalar", izin && izin.temalar);
    v.kurklar = liste("kurklar", izin && izin.kurklar);
    v.esyalar = [...new Set(liste("esyalar", izin && izin.esyalar))];
    // Başlangıçta ücretsiz verilenler hep sahiplikte kalır.
    for (const a of ["temalar", "kurklar"]) for (const x of t[a]) if (!v[a].includes(x)) v[a].unshift(x);
    if (izin && izin.kelimeler) for (const k of Object.keys(v.kartlar)) if (!izin.kelimeler.has(k)) delete v.kartlar[k];
    for (const c of Object.values(v.kartlar)) { c.kutu = Math.min(4, Math.max(0, c.kutu)); if (c.hata != null) c.hata = Math.max(0, Math.floor(c.hata)); }
    if (v.sohbet != null) v.sohbet = (Array.isArray(v.sohbet) ? v.sohbet : [])
      .filter(m => m && typeof m.kim === "string" && typeof m.metin === "string")
      .slice(-SINIR.sohbet).map(m => ({ kim: m.kim.slice(0, SINIR.kim), metin: m.metin.slice(0, SINIR.metin) }));
    if (v.icerikBildirim != null) v.icerikBildirim = (Array.isArray(v.icerikBildirim) ? v.icerikBildirim : [])
      .filter(x => x && typeof x.kelime === "string" && Number.isInteger(x.gun)).slice(-200).map(x => ({ kelime: x.kelime.slice(0, 40), gun: x.gun }));
    if (!v.giyili || typeof v.giyili !== "object" || Array.isArray(v.giyili)) v.giyili = t.giyili;
    for (const y of Object.keys(t.giyili)) if (v.giyili[y] != null && !(typeof v.giyili[y] === "string" && v.esyalar.includes(v.giyili[y]))) v.giyili[y] = null;
    if (eskiSurum < 4 || !RENK_DESENI.test(v.kurkRenk)) v.kurkRenk = ESKI_KURK_RENK[v.kurk] || t.kurkRenk;
    v.kurkRenk = v.kurkRenk.toUpperCase();
    v.sonRenkler = [...new Set((Array.isArray(v.sonRenkler) ? v.sonRenkler : []).filter(x => typeof x === "string" && RENK_DESENI.test(x)).map(x => x.toUpperCase()))].slice(0, 8);
    if (typeof v.bugun.sayi !== "number" || v.bugun.sayi < 0) v.bugun.sayi = 0;
    if (typeof v.bugun.hediye !== "boolean") v.bugun.hediye = false;
    if (!v.odulDefteri || typeof v.odulDefteri !== "object") v.odulDefteri = {};
    // 5. sürüm: açık tur yalnız biçimi sağlamsa kalır (içeriği açılırken Ogrenme.geriYukle ayrıca denetler); bozuksa tur yeniden kurulur.
    const adim = a => a && typeof a === "object" && typeof a.id === "string" && (a.tip === "tanis" || a.tip === "soru") && (!izin || !izin.kelimeler || izin.kelimeler.has(a.id));
    if (!(v.oturum && typeof v.oturum === "object" && !Array.isArray(v.oturum) && Array.isArray(v.oturum.sira) && v.oturum.sira.every(adim))) v.oturum = null;
    v.sonSunulan = [...new Set((Array.isArray(v.sonSunulan) ? v.sonSunulan : []).filter(x => typeof x === "string" && (!izin || !izin.kelimeler || izin.kelimeler.has(x))))].slice(0, 40);
    // İlk ders kutlaması yalnız yeni kullanıcıya: daha önce kelime çalışmış eski kayıt kutlamayı görmüş sayılır.
    if (typeof v.ilkDers !== "number") v.ilkDers = 0;
    if (eskiSurum < 5 && Object.keys(v.kartlar).length) v.ilkDers = 1;
    if (!(v.antrenman && typeof v.antrenman === "object" && ["gun", "tekrar", "kg"].every(a => typeof v.antrenman[a] === "number" && isFinite(v.antrenman[a])))) v.antrenman = null;
    v.ayar = { ...t.ayar, ...(v.ayar && typeof v.ayar === "object" && !Array.isArray(v.ayar) ? v.ayar : {}) };
    for (const [a, l] of Object.entries(AYAR_SECENEK)) if (!l.includes(v.ayar[a])) v.ayar[a] = t.ayar[a];
    for (const a of ["titresim", "seslendirme"]) if (typeof v.ayar[a] !== "boolean") v.ayar[a] = t.ayar[a];
    for (const a of Object.keys(v.ayar)) if (!(a in t.ayar)) delete v.ayar[a];
    // 6. sürüm: misafir kimliği yalnız biçimi doğruysa kalır; yoksa null (yeni kimliği durum.js yükledikten sonra verir).
    v.kimlik = v.kimlik && typeof v.kimlik === "object" && MISAFIR_DESENI.test(v.kimlik.misafir) ? { misafir: v.kimlik.misafir } : null;
    v.surum = SEMA_SURUM;
    return v;
  },
};

if (typeof module === "object" && module.exports) module.exports = { Kayit, ESKI_KURK_RENK, SEMA_SURUM, MISAFIR_DESENI, YEDEK_EN_FAZLA, SINIR, AYAR_SECENEK };
