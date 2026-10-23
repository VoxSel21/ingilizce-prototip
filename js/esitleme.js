// ================= EŞİTLEME: yerel olay kuyruğu, misafir kimliği, birleştirme kuralları =================
// Saf mantık (Node testleri de yükler). 5. aşama 1. parça (2026-10-23): sunucu yok; her kayıtta ne değiştiyse
// küçük "olay"lar halinde ayrı bir kuyruğa yazılır. Hesap bağlanınca (2. parça) bu olaylar sunucuya gider;
// sunucu `uygula` kurallarını çalıştırır. Kural özeti:
// - Her olayın benzersiz kimliği var (cihaz:sayaç); aynı olay ikinci kez uygulanmaz.
// - Kuyruktaki olay ancak onay gelince silinir; hata alırsa bekleyip yeniden denenir.
// - Kart, ayar ve tek değerli alanlar: en son yapılan değişiklik kalır. Eşya/tema/kürk ve çalışılan günler: birleşim.
// - Altın: ödül anahtarı bir kez ödenir, aynı eşya bir kez ücretlendirilir; açıklanamayan altın farkı (eski yedek,
//   geliştirme kolaylığı) güvenilir bakiyeye eklenmez, ayrı not edilir.
// - Misafir ilerlemesi hesaba misafir kimliği başına bir kez taşınır (aynı yedek iki cihazdan yüklense de).
// - Olaylar sahibine (misafir ya da hesap kimliği) bağlıdır: hesap değişince önceki kişinin olayı yeni hesaba gitmez.
// 2. parça (2026-10-23): ücretsiz Firebase planında sunucuda kod çalışmaz; `uygula` ve `misafirTasi` bulut.js'te
// istemcinin yaptığı tek parça (transaction) işlemde çalışır. Erişim kuralları (firestore.rules) yalnız sahibine izin verir.
const ESITLEME = {
  kuyrukSurum: 1,
  misafirSinir: 3000,                     // hesapsızken kuyrukta tutulan en çok olay
  paket: 50,                            // bir gönderimde en çok olay
  bekleme: { taban: 5000, tavan: 600000 }, // hata sonrası yeniden deneme: 5 sn, 10 sn, 20 sn ... en çok 10 dk
  listeler: ["esyalar", "temalar", "kurklar"],
  alanlar: ["kediAd", "kurk", "kurkRenk", "tema", "seviye", "giyili", "konu"],
};

const _kopya = x => x == null ? x : JSON.parse(JSON.stringify(x));
const _ayni = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// "Daha yeni" karşılaştırması: önce zaman, eşitse olay kimliği (iki cihaz aynı anda yazsa da herkes aynı sonucu bulur).
const _dahaYeni = (o, eski) => !eski || o.zaman > eski.zaman || (o.zaman === eski.zaman && o.id > eski.olay);

const Esitleme = {
  yeniKimlik(on = "m", rastgele = Math.random) {
    let s = "";
    while (s.length < 16) s += Math.floor(rastgele() * 36).toString(36);
    return `${on}-${s}`;
  },
  kuyrukYeni: cihaz => ({ surum: ESITLEME.kuyrukSurum, cihaz, sayac: 0, olaylar: [] }),
  // Bozuk ya da eksik kuyruk okunursa boş kuyruk; cihaz kimliği ve sayaç korunur.
  kuyrukDuzelt(k, cihaz) {
    if (!k || typeof k !== "object" || typeof k.cihaz !== "string") return Esitleme.kuyrukYeni(cihaz);
    k.sayac = Number.isInteger(k.sayac) && k.sayac >= 0 ? k.sayac : 0;
    k.olaylar = Array.isArray(k.olaylar) ? k.olaylar.filter(o => o && typeof o.id === "string" && o.tur) : [];
    for (const o of k.olaylar) if (o.durum === "gonderiliyor") o.durum = "bekliyor"; // yarıda kalan gönderim yeniden denenir
    return k;
  },

  // Olay kuyruğa eklenir; sayaç hiç geri gitmez, böylece kimlik bu cihazda tekrarlanmaz.
  olayEkle(k, tur, veri, sahip, zaman) {
    k.sayac += 1;
    const o = { id: `${k.cihaz}:${k.sayac}`, tur, veri, sahip, zaman, durum: "bekliyor", deneme: 0 };
    k.olaylar.push(o);
    return o;
  },
  // Aynı karta/ayara/alana ait henüz gönderilmemiş eski olaylar atılır (yalnız sonuncusu önemli). Altın olayları atılmaz.
  sikistir(k) {
    const anahtar = o => ["kart", "ayar", "alan"].includes(o.tur) && o.durum === "bekliyor" ? `${o.sahip}|${o.tur}|${o.veri.id || o.veri.ad}` : null;
    const son = new Map();
    k.olaylar.forEach((o, i) => { const a = anahtar(o); if (a) son.set(a, i); });
    k.olaylar = k.olaylar.filter((o, i) => { const a = anahtar(o); return !a || son.get(a) === i; });
    // Misafir olayları hesaba taşımada tam kayıtla zaten aktarılır; kuyruk şişmesin diye en eskileri atılabilir.
    // Hesaba ait olaylar hiçbir zaman atılmaz.
    let fazla = k.olaylar.length - ESITLEME.misafirSinir;
    if (fazla > 0) k.olaylar = k.olaylar.filter(o => !(fazla > 0 && /^m-/.test(o.sahip) && o.durum === "bekliyor" && fazla--));
    return k;
  },
  // Gönderilecekler: yalnız o anki sahibin, bekleme süresi dolmuş olayları, eklenme sırasıyla.
  gonderilecek(k, sahip, zaman, en = ESITLEME.paket) {
    return k.olaylar.filter(o => o.sahip === sahip && o.durum === "bekliyor" && !(o.sonraki > zaman)).slice(0, en);
  },
  gonderimBasladi(k, idler) { for (const o of k.olaylar) if (idler.includes(o.id)) o.durum = "gonderiliyor"; return k; },
  // Sunucu onayladı: olay kuyruktan çıkar. Onay gelmeyen hiçbir olay silinmez.
  onaylandi(k, idler) { k.olaylar = k.olaylar.filter(o => !idler.includes(o.id)); return k; },
  basarisiz(k, idler, zaman) {
    for (const o of k.olaylar) if (idler.includes(o.id)) {
      o.durum = "bekliyor"; o.deneme = (o.deneme || 0) + 1;
      o.sonraki = zaman + Math.min(ESITLEME.bekleme.tavan, ESITLEME.bekleme.taban * 2 ** (o.deneme - 1));
    }
    return k;
  },
  // Ekranda gösterilecek durum. Hesap yoksa asla "eşitlendi" denmez.
  durumEtiketi(k, hesap) {
    if (!hesap) return "yerel";
    const benim = k.olaylar.filter(o => o.sahip === hesap);
    if (benim.some(o => o.durum === "gonderiliyor")) return "esitleniyor";
    if (benim.some(o => o.deneme > 0)) return "tekrar";
    return benim.length ? "bekliyor" : "esitlendi";
  },

  // İki kayıt arasındaki farkı olaylara çevirir. defter: Ekonomi'nin bu arada yazdığı altın satırları.
  farkOlaylari(once, simdi, defter = []) {
    const out = [];
    const o = once || {}, s = simdi || {};
    const ok = o.kartlar || {}, sk = s.kartlar || {};
    for (const id of Object.keys(sk)) if (!_ayni(ok[id], sk[id])) out.push({ tur: "kart", veri: { id, kart: _kopya(sk[id]) } });
    const oa = o.ayar || {}, sa = s.ayar || {};
    for (const ad of Object.keys(sa)) if (!_ayni(oa[ad], sa[ad])) out.push({ tur: "ayar", veri: { ad, deger: _kopya(sa[ad]) } });
    for (const ad of ESITLEME.alanlar) if (ad in s && !_ayni(o[ad], s[ad])) out.push({ tur: "alan", veri: { ad, deger: _kopya(s[ad]) } });
    for (const liste of ESITLEME.listeler) {
      const eski = new Set(o[liste] || []);
      const yeni = (s[liste] || []).filter(x => !eski.has(x));
      if (yeni.length) out.push({ tur: "liste", veri: { liste, idler: yeni } });
    }
    const gunler = Object.keys(s.gunler || {}).filter(g => !(o.gunler || {})[g]);
    if (gunler.length) out.push({ tur: "gun", veri: { gunler: gunler.map(Number) } });
    let aciklanan = 0;
    const anahtarli = new Set();
    for (const satir of defter) {
      if (satir.tur === "kazan") { aciklanan += satir.miktar; anahtarli.add(satir.anahtar); out.push({ tur: "kazan", veri: { anahtar: satir.anahtar, miktar: satir.miktar } }); }
      else if (satir.tur === "harca") { aciklanan -= satir.miktar; out.push({ tur: "harca", veri: { miktar: satir.miktar, neden: satir.neden || null } }); }
    }
    // Defterde karşılığı olmayan ödül işaretleri (ör. yedekten gelen): altınsız, yalnız "ödendi" bilgisi.
    const isaret = Object.keys(s.odulDefteri || {}).filter(a => (o.odulDefteri || {})[a] == null && !anahtarli.has(a));
    if (isaret.length) out.push({ tur: "odulIsaret", veri: { anahtarlar: isaret } });
    const fark = (Number(s.yildiz) || 0) - (Number(o.yildiz) || 0) - aciklanan;
    if (once && fark !== 0) out.push({ tur: "altinFark", veri: { fark } });
    return out;
  },

  // ---- Sunucu tarafı kurallar (2. parçada sunucu da aynı kuralları uygulayacak; burada test edilir) ----
  hesapYeni: () => ({ uygulanan: {}, altin: 0, odul: {}, alinan: {}, kartlar: {}, ayar: {}, alan: {},
    listeler: { esyalar: [], temalar: [], kurklar: [] }, gunler: {}, tasinan: {}, guvenilmezFark: 0, reddedilen: [] }),
  // Olayları hesaba uygular. Aynı olay (aynı kimlik) ikinci kez gelirse yok sayılır. Onaylanan kimlikleri döndürür.
  uygula(h, olaylar, sahip) {
    const onay = [];
    for (const o of olaylar) {
      if (!o || !o.id || o.sahip !== sahip) continue; // başka kişinin olayı bu hesaba yazılmaz
      onay.push(o.id);
      if (h.uygulanan[o.id]) continue;
      h.uygulanan[o.id] = 1;
      const v = o.veri || {};
      if (o.tur === "kart" || o.tur === "ayar" || o.tur === "alan") {
        const yer = o.tur === "kart" ? h.kartlar : o.tur === "ayar" ? h.ayar : h.alan;
        const ad = o.tur === "kart" ? v.id : v.ad;
        if (_dahaYeni(o, yer[ad])) yer[ad] = { deger: o.tur === "kart" ? v.kart : v.deger, zaman: o.zaman, olay: o.id };
      } else if (o.tur === "liste" && h.listeler[v.liste]) {
        for (const id of v.idler || []) if (!h.listeler[v.liste].includes(id)) h.listeler[v.liste].push(id);
      } else if (o.tur === "gun") {
        for (const g of v.gunler || []) h.gunler[g] = 1;
      } else if (o.tur === "kazan") {
        if (!h.odul[v.anahtar]) { h.odul[v.anahtar] = 1; h.altin += Math.max(0, Math.floor(v.miktar) || 0); }
      } else if (o.tur === "odulIsaret") {
        for (const a of v.anahtarlar || []) h.odul[a] = h.odul[a] || 1;
      } else if (o.tur === "harca") {
        const m = Math.max(0, Math.floor(v.miktar) || 0);
        if (v.neden && h.alinan[v.neden]) continue;        // aynı eşya iki cihazdan alındı: bir kez ücret
        if (h.altin < m) { h.reddedilen.push(o.id); continue; } // bakiye eksiye düşmez
        h.altin -= m;
        if (v.neden) h.alinan[v.neden] = 1;
      } else if (o.tur === "altinFark") {
        h.guvenilmezFark += Number(v.fark) || 0;
      }
    }
    return onay;
  },
  // Misafir ilerlemesinin hesaba tek seferlik taşınması. anlik: misafirin kayıt nesnesi (d).
  // tabanAltin: çıkış yapılınca cihazda kalan hesap altını; o misafirin yalnız sonradan kazandığı kısmı taşınır.
  misafirTasi(h, anlik, tabanAltin = 0) {
    const misafir = anlik && anlik.kimlik && anlik.kimlik.misafir;
    if (!misafir) return { tasindi: false, neden: "kimlik yok" };
    if (h.tasinan[misafir]) return { tasindi: false, neden: "zaten taşındı" };
    const ozet = { kart: 0, altin: 0, esya: 0 };
    for (const [id, kart] of Object.entries(anlik.kartlar || {})) {
      const var_ = h.kartlar[id] && h.kartlar[id].deger;
      // Taşımada daha ilerideki kart kalır (öğrenilmiş bir kelime geri gitmez).
      if (!var_ || kart.kutu > var_.kutu || (kart.kutu === var_.kutu && kart.sira > var_.sira)) {
        h.kartlar[id] = { deger: _kopya(kart), zaman: 0, olay: `tasima:${misafir}` }; ozet.kart++;
      }
    }
    for (const liste of ESITLEME.listeler)
      for (const id of anlik[liste] || []) if (!h.listeler[liste].includes(id)) { h.listeler[liste].push(id); if (liste === "esyalar") ozet.esya++; }
    for (const g of Object.keys(anlik.gunler || {})) h.gunler[g] = 1;
    for (const a of Object.keys(anlik.odulDefteri || {})) h.odul[a] = h.odul[a] || 1;
    for (const [ad, deger] of Object.entries(anlik.ayar || {})) if (!h.ayar[ad]) h.ayar[ad] = { deger, zaman: 0, olay: `tasima:${misafir}` };
    ozet.altin = Math.max(0, Math.floor((Number(anlik.yildiz) || 0) - (Number(tabanAltin) || 0)));
    h.altin += ozet.altin;
    h.tasinan[misafir] = { altin: ozet.altin };
    return { tasindi: true, ozet };
  },

  // ---- 2. parça: hesap bağlantısı (bulut.js bunları kullanır; ağ yok, saf mantık) ----
  // Sunucudan gelen hesap belgesi eksik/bozuksa boş alanlar tamamlanır. "uygulanan" sunucuda tutulmaz
  // (her olay ayrı belge), bu yüzden burada hep boş başlar.
  hesapDuzelt(v) {
    const h = Esitleme.hesapYeni();
    if (!v || typeof v !== "object") return h;
    for (const a of ["odul", "alinan", "kartlar", "ayar", "alan", "gunler", "tasinan"]) if (v[a] && typeof v[a] === "object" && !Array.isArray(v[a])) h[a] = v[a];
    for (const l of ESITLEME.listeler) if (v.listeler && Array.isArray(v.listeler[l])) h.listeler[l] = v.listeler[l].filter(x => typeof x === "string");
    h.altin = Math.max(0, Math.floor(Number(v.altin) || 0));
    h.guvenilmezFark = Number(v.guvenilmezFark) || 0;
    h.reddedilen = Array.isArray(v.reddedilen) ? v.reddedilen.slice(-200) : [];
    return h;
  },
  sunucuHali(h) { const s = _kopya(h); delete s.uygulanan; s.reddedilen = (s.reddedilen || []).slice(-200); return s; },
  // Hangi kimliğin olayları gönderilecek: misafir ilerlemesi bu hesaba taşınmışsa hesap, yoksa hâlâ misafir.
  sahip(hk, d) {
    const misafir = d && d.kimlik && d.kimlik.misafir;
    return hk && hk.uid && hk.tasinanMisafir === misafir ? hk.uid : misafir;
  },
  // Girişten sonra ilk eşitlemede ne yapılacağı. hk: cihazdaki hesap kaydı.
  // - "tamam": bu misafir zaten bu hesaba taşındı.
  // - "degistir": cihazdaki ilerleme başka bir hesaptan kaldı; o hesaba ait, yeni hesaba taşınmaz (yerelde yedeklenir).
  // - "tasi": misafir ilerlemesi hesaba eklenir (çıkıştan sonra kalan hesap altını hariç).
  girisPlani(hk, d, uid) {
    const misafir = d.kimlik && d.kimlik.misafir;
    if (hk.tasinanMisafir === misafir) return { tur: "tamam" };
    const cikistan = hk.tabanMisafir && hk.tabanMisafir === misafir;
    if (cikistan && hk.oncekiUid && hk.oncekiUid !== uid) return { tur: "degistir", onceki: hk.oncekiUid };
    return { tur: "tasi", tabanAltin: cikistan ? Number(hk.tabanAltin) || 0 : 0 };
  },
  // Taşıma onaylanınca: anlık kayıttan önceki misafir olayları kuyruktan bırakılır (zaten taşındı);
  // anlıktan sonra yazılanlar kaybolmasın diye hesaba devredilir. sonSayac: anlık alınırken kuyruk sayacı.
  misafirDevret(k, misafir, sonSayac, uid) {
    const no = o => Number(String(o.id).split(":").pop()) || 0;
    k.olaylar = k.olaylar.filter(o => !(o.sahip === misafir && o.id.startsWith(k.cihaz + ":") && no(o) <= sonSayac));
    for (const o of k.olaylar) if (o.sahip === misafir) o.sahip = uid;
    return k;
  },
  // Hesaptaki hali cihaz kaydına yazar (yeni nesne döner, d değişmez). Kuyrukta bu hesabın gönderilmemiş olayı
  // varken çağrılmamalı. tam: hesap değişiminde yerel kartlar/eşyalar korunmaz (önce yerelde yedeklenir).
  hesaptanYerele(d, h, tam = false) {
    const y = _kopya(d);
    const kartlar = tam ? {} : y.kartlar || {};
    for (const [id, k] of Object.entries(h.kartlar)) if (k && k.deger) kartlar[id] = _kopya(k.deger);
    y.kartlar = kartlar;
    for (const [ad, a] of Object.entries(h.ayar)) if (a && a.deger !== undefined && y.ayar && ad in y.ayar) y.ayar[ad] = _kopya(a.deger);
    for (const [ad, a] of Object.entries(h.alan)) if (ESITLEME.alanlar.includes(ad) && a && a.deger !== undefined) y[ad] = _kopya(a.deger);
    for (const l of ESITLEME.listeler) y[l] = [...new Set([...(tam ? [] : y[l] || []), ...h.listeler[l]])];
    y.gunler = tam ? {} : y.gunler || {};
    for (const g of Object.keys(h.gunler)) y.gunler[g] = 1;
    y.odulDefteri = tam ? {} : y.odulDefteri || {};
    for (const a of Object.keys(h.odul)) if (y.odulDefteri[a] == null) y.odulDefteri[a] = 1;
    // Görünen bakiye: güvenilir altın + ayrı not edilen fark (kullanıcının altını sessizce kesilmez; harcama yalnız güvenilir altından onaylanır).
    y.yildiz = Math.max(0, h.altin + (Number(h.guvenilmezFark) || 0));
    return y;
  },
};

if (typeof module === "object" && module.exports) module.exports = { ESITLEME, Esitleme };
