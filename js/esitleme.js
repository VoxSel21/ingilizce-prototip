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
  alanlar: ["kediAd", "kediStil", "kurk", "kurkRenk", "tema", "seviye", "giyili", "konu"],
};
const _EsModel = typeof DurumModeli !== 'undefined' ? DurumModeli : require('./durum-modeli.js').DurumModeli;
const _IlSoz = typeof IlSozlesme !== 'undefined' ? IlSozlesme : require('./ilerleme-sozlesmesi.js').IlSozlesme;

const _kopya = x => x == null ? x : JSON.parse(JSON.stringify(x));
const _ayni = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// "Daha yeni" karşılaştırması: önce zaman, eşitse olay kimliği (iki cihaz aynı anda yazsa da herkes aynı sonucu bulur).
const _dahaYeni = (o, eski) => !eski || o.zaman > eski.zaman || (o.zaman === eski.zaman && o.id > eski.olay);

const Esitleme = {
  ilerlemeAnlik: d => _IlSoz.cikar(d),
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
    // Cihaz tercihleri hesaba gönderilmez (İsse kararı, 2026-10-24).
    for (const ad of ESITLEME.alanlar) if (ad in s && !_ayni(o[ad], s[ad])) out.push({ tur: "alan", veri: { ad, deger: _kopya(s[ad]) } });
    for (const liste of ESITLEME.listeler) {
      const eski = new Set(o[liste] || []);
      const satinAlinan = new Set(defter.filter(x => x.tur === 'satinAl' && x.liste === liste).map(x => x.id));
      const yeni = (s[liste] || []).filter(x => !eski.has(x) && !satinAlinan.has(x));
      if (yeni.length) out.push({ tur: "liste", veri: { liste, idler: yeni } });
    }
    const gunler = Object.keys(s.gunler || {}).filter(g => !(o.gunler || {})[g]);
    if (gunler.length) out.push({ tur: "gun", veri: { gunler: gunler.map(Number) } });
    let aciklanan = 0;
    const anahtarli = new Set();
    for (const satir of defter) {
      if (satir.tur === "kazan") { aciklanan += satir.miktar; anahtarli.add(satir.anahtar); out.push({ tur: "kazan", veri: { anahtar: satir.anahtar, miktar: satir.miktar } }); }
      else if (satir.tur === "harca") { aciklanan -= satir.miktar; out.push({ tur: "harca", veri: { miktar: satir.miktar, neden: satir.neden || null } }); }
      else if (satir.tur === 'satinAl') { aciklanan -= satir.miktar; out.push({ tur: 'satinAl', veri: { liste: satir.liste, id: satir.id, miktar: satir.miktar } }); }
      else if (satir.tur === 'koruyucuAl') { aciklanan -= satir.miktar; out.push({ tur: 'koruyucuAl', veri: { miktar: satir.miktar } }); }
    }
    // Defterde karşılığı olmayan ödül işaretleri (ör. yedekten gelen): altınsız, yalnız "ödendi" bilgisi.
    const isaret = Object.keys(s.odulDefteri || {}).filter(a => (o.odulDefteri || {})[a] == null && !anahtarli.has(a));
    if (isaret.length) out.push({ tur: "odulIsaret", veri: { anahtarlar: isaret } });
    const fark = (Number(s.yildiz) || 0) - (Number(o.yildiz) || 0) - aciklanan;
    if (once && fark !== 0) out.push({ tur: "altinFark", veri: { fark } });
    if (!o.esitlemeSurum && s.esitlemeSurum === 1) {
      const alanlar = {}; for (const ad of ESITLEME.alanlar) if (o[ad] !== undefined) alanlar[ad] = _kopya(o[ad]);
      out.unshift({ tur: 'ilerlemeTaban', veri: { ilerleme: _IlSoz.cikar(o), alanlar } });
    }
    const koruyucuAlim = defter.filter(x => x.tur === 'koruyucuAl').length;
    for (const olay of _IlSoz.farklar(o, s)) {
      if (olay.veri.ad === 'koruyucu') { olay.veri.deger -= koruyucuAlim; if (!olay.veri.deger) continue; }
      out.push(olay);
    }
    return out;
  },

  // ---- Sunucu tarafı kurallar (2. parçada sunucu da aynı kuralları uygulayacak; burada test edilir) ----
  hesapYeni: () => ({ uygulanan: {}, altin: 0, odul: {}, alinan: {}, kartlar: {}, ayar: {}, alan: {},
    listeler: { esyalar: [], temalar: [], kurklar: [] }, gunler: {}, tasinan: {}, guvenilmezFark: 0, reddedilen: [],
    ilerleme: {}, ilerlemeSaat: {}, ilerlemeHazir: false, alimRet: {} }),
  // Olayları hesaba uygular. Aynı olay (aynı kimlik) ikinci kez gelirse yok sayılır. Onaylanan kimlikleri döndürür.
  uygula(h, olaylar, sahip) {
    const onay = [];
    for (const o of olaylar) {
      if (!o || !o.id || o.sahip !== sahip) continue; // başka kişinin olayı bu hesaba yazılmaz
      onay.push(o.id);
      if (h.uygulanan[o.id]) continue;
      h.uygulanan[o.id] = 1;
      const v = o.veri || {};
      if (o.tur === 'ilerlemeTaban') {
        if (!h.ilerlemeHazir) { h.ilerleme = _IlSoz.cikar(v.ilerleme || v); h.ilerlemeHazir = true; }
        for (const ad of ESITLEME.alanlar) if (v.alanlar && v.alanlar[ad] !== undefined && !h.alan[ad]) h.alan[ad] = { deger:_kopya(v.alanlar[ad]), zaman:o.zaman, olay:o.id };
      } else if (o.tur === 'ilerleme') {
        _IlSoz.uygula(h, v.ad, v.deger, o.zaman, o.id); h.ilerlemeHazir = true;
      } else if (o.tur === 'satinAl') {
        if (!h.listeler[v.liste] || typeof v.id !== 'string' || !Number.isInteger(v.miktar) || v.miktar < 0) continue;
        const anahtar = v.liste + ':' + v.id;
        if (h.listeler[v.liste].includes(v.id)) { delete h.alimRet[anahtar]; continue; }
        if (h.altin < v.miktar) { h.reddedilen.push(o.id); h.alimRet[anahtar] = { liste: v.liste, id: v.id, olay: o.id }; continue; }
        h.altin -= v.miktar; h.listeler[v.liste].push(v.id); h.alinan[anahtar] = 1; delete h.alimRet[anahtar];
      } else if (o.tur === 'koruyucuAl') {
        if (!Number.isInteger(v.miktar) || v.miktar < 0) continue;
        if (h.ilerleme.koruyucu === undefined) h.ilerleme.koruyucu = 1;
        if (h.altin < v.miktar) { h.reddedilen.push(o.id); h.alimRet[o.id] = { liste: 'koruyucu', id: o.id, olay: o.id }; continue; }
        h.altin -= v.miktar; h.ilerleme.koruyucu++;
      } else if (o.tur === "kart" || o.tur === "ayar" || o.tur === "alan") {
        const yer = o.tur === "kart" ? h.kartlar : o.tur === "ayar" ? h.ayar : h.alan;
        const ad = o.tur === "kart" ? v.id : v.ad;
        const yeni = _dahaYeni(o, yer[ad]);
        if (o.tur === 'kart') {
          const kural = typeof BeceriKural !== 'undefined' ? BeceriKural : require('./beceri-kural.js').BeceriKural;
          const deger = kural.birlestir(yer[ad]?.deger, v.kart, yeni);
          yer[ad] = { ...(yeni ? { zaman:o.zaman, olay:o.id } : yer[ad]), deger };
        } else if (yeni) yer[ad] = { deger: v.deger, zaman: o.zaman, olay: o.id };
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
  misafirTasi(h, anlik, tabanAltin = 0, tabanIlerleme = null) {
    const misafir = anlik && anlik.kimlik && anlik.kimlik.misafir;
    if (!misafir) return { tasindi: false, neden: "kimlik yok" };
    if (h.tasinan[misafir]) return { tasindi: false, neden: "zaten taşındı" };
    const ozet = { kart: 0, altin: 0, esya: 0 };
    for (const [id, kart] of Object.entries(anlik.kartlar || {})) {
      const var_ = h.kartlar[id] && h.kartlar[id].deger;
      // Taşımada daha ilerideki kart kalır (öğrenilmiş bir kelime geri gitmez).
      if (!var_ || kart.kutu > var_.kutu || (kart.kutu === var_.kutu && kart.sira > var_.sira)) {
        const kural = typeof BeceriKural !== 'undefined' ? BeceriKural : require('./beceri-kural.js').BeceriKural;
        h.kartlar[id] = { deger: kural.birlestir(var_, kart), zaman: 0, olay: `tasima:${misafir}` }; ozet.kart++;
      } else if (kart.beceriler) {
        const kural = typeof BeceriKural !== 'undefined' ? BeceriKural : require('./beceri-kural.js').BeceriKural;
        h.kartlar[id].deger = kural.birlestir(var_, kart, false);
      }
    }
    for (const liste of ESITLEME.listeler)
      for (const id of anlik[liste] || []) if (!h.listeler[liste].includes(id)) { h.listeler[liste].push(id); if (liste === "esyalar") ozet.esya++; }
    for (const g of Object.keys(anlik.gunler || {})) h.gunler[g] = 1;
    for (const a of Object.keys(anlik.odulDefteri || {})) h.odul[a] = h.odul[a] || 1;
    const ilk = !h.ilerlemeHazir;
    if (ilk) { h.ilerleme = _IlSoz.cikar(anlik); h.ilerlemeHazir = true; }
    else for (const o of _IlSoz.farklar(tabanIlerleme || _EsModel.yeni(anlik.bugun && anlik.bugun.no), anlik)) _IlSoz.uygula(h, o.veri.ad, o.veri.deger);
    for (const ad of ESITLEME.alanlar) if (anlik[ad] !== undefined && !h.alan[ad]) h.alan[ad] = { deger: _kopya(anlik[ad]), zaman: 0, olay: `tasima:${misafir}` };
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
    for (const a of ['ilerlemeSaat', 'alimRet']) if (v[a] && typeof v[a] === 'object' && !Array.isArray(v[a])) h[a] = v[a];
    if (v.ilerleme && typeof v.ilerleme === 'object') h.ilerleme = _IlSoz.cikar(v.ilerleme);
    h.ilerlemeHazir = v.ilerlemeHazir === true;
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
    if (hk.uid && hk.uid !== uid && hk.tasinanMisafir === misafir) return { tur: 'degistir', onceki: hk.uid };
    if (hk.tasinanMisafir === misafir) return { tur: "tamam" };
    const cikistan = hk.tabanMisafir && hk.tabanMisafir === misafir;
    if (cikistan && hk.oncekiUid && hk.oncekiUid !== uid) return { tur: "degistir", onceki: hk.oncekiUid };
    const plan = { tur: "tasi", tabanAltin: cikistan ? Number(hk.tabanAltin) || 0 : 0 };
    if (cikistan && hk.tabanIlerleme) plan.tabanIlerleme = hk.tabanIlerleme;
    return plan;
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
    const y = tam ? _EsModel.yeni(d.bugun && d.bugun.no) : _kopya(d);
    if (!tam) y.oturum = d.oturum; // aktif dersin kO başvurusu eşitleme sırasında kopmaz.
    if (tam) { for (const ad of _EsModel.cihazAlanlari) if (d[ad] !== undefined) y[ad] = _kopya(d[ad]); y.kimlik = _kopya(d.kimlik); y.rev = d.rev; }
    const kartlar = tam ? {} : y.kartlar || {};
    for (const [id, k] of Object.entries(h.kartlar)) if (k && k.deger) kartlar[id] = _kopya(k.deger);
    y.kartlar = kartlar;
    for (const [ad, a] of Object.entries(h.alan)) if (ESITLEME.alanlar.includes(ad) && a && a.deger !== undefined) y[ad] = _kopya(a.deger);
    y.kediStil = 'klasik'; // Eski bulut tercihi kaldırılan çizimi yeniden etkinleştirmesin.
    for (const l of ESITLEME.listeler) y[l] = [...new Set([...(tam ? [] : y[l] || []), ...h.listeler[l]])];
    for (const r of Object.values(h.alimRet || {})) {
      if (h.listeler[r.liste] && !h.listeler[r.liste].includes(r.id)) {
        y[r.liste] = y[r.liste].filter(id => id !== r.id);
        if (r.liste === 'temalar' && y.tema === r.id) y.tema = 'cayir';
        if (r.liste === 'kurklar' && y.kurk === r.id) { y.kurk = 'turuncu'; y.kurkRenk = '#FDBE86'; }
        if (r.liste === 'kurklar' && y.kurkRenk === r.id) y.kurkRenk = '#FDBE86';
        for (const yer of Object.keys(y.giyili || {})) if (y.giyili[yer] === r.id) y.giyili[yer] = null;
      }
    }
    for (const [ad, deger] of Object.entries(_IlSoz.cikar(h.ilerleme || {}))) {
      if (ad === 'bugun' && y.bugun && y.bugun.no > deger.no) continue;
      if (ad === 'antrenman' && !deger) continue;
      y[ad] = _kopya(deger);
    }
    y.esitlemeSurum = 1;
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
