// ================= ÇETE EKRANI: gerçek çete (kur, katıl, ayrıl, çıkar, canlı sohbet) =================
// Ek iş, 2. parça (2026-10-23). Çekirdek: js/cete.js; kurallar: firestore.rules; plan: degerlendirmeler/cete-sohbeti-plani.md.
// - Hesabı ya da çetesi olmayan kişi demo sohbeti olduğu gibi görür (üstte "Çete kur / Kodla katıl" kartıyla).
// - Çetedeyken Sohbet gerçek çeteyi açar, demo gizlenir; Çete sekmesinde üyeler, kod/bağlantı, ayrıl ve (kurucuya) çıkar.
// - Canlı dinleme yalnız sohbet ekranı açıkken (ücretsiz plan kotası); çete bilgisi sosyal ekrana girince tazelenir.
// - Ekrana giden her ad ve mesaj textContent ya da Sohbet.kacis'ten geçer (başkasının yazdığı metin kod olarak çalışamaz).
const CETE_RENK = ["#FF8A7A", "#5CC9A7", "#6DB8EE", "#F5A3C7", "#E0A030", "#9F8BEA", "#6FBF73", "#E58FD0", "#4FB0B0", "#D08A5C"];
const TAKMA_ANAHTAR = "ing-cete-takma"; // son kullanılan takma ad (yalnız kolaylık)
const CeteEkran = { cete: null, uid: null, yukleniyor: false, hata: null, sohbet: null, mesajlar: [], sonId: null, sonGonderim: 0,
  kod: CeteKural.kodAdrestenAl(location.search), kodUyarildi: false, istek: 0 };
// Davet bağlantısıyla gelindiyse kod adres satırından silinir (yenileyince pencere tekrar açılmasın).
if (CeteEkran.kod) { try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {} }

const ceteC = () => Bulut.ceteBaglantisi();
const ceteAd = (cete, uid) => (cete && cete.adlar && cete.adlar[uid]) || "Eski üye";
function ceteRenk(uid) {
  const i = CeteEkran.cete ? CeteEkran.cete.uyeler.indexOf(uid) : -1;
  if (i >= 0) return CETE_RENK[i % CETE_RENK.length];
  let h = 0; for (const ch of String(uid)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CETE_RENK[h % CETE_RENK.length];
}
const takmaOku = () => { try { return localStorage.getItem(TAKMA_ANAHTAR) || ""; } catch (e) { return ""; } };
const takmaYaz = t => { try { localStorage.setItem(TAKMA_ANAHTAR, t); } catch (e) {} };

// ---------- Çete bilgisini tazele ----------
async function ceteYenile() {
  const u = Bulut.kullanici, istek = ++CeteEkran.istek;
  ceteBildirimKapat();
  if (!u) { CeteEkran.cete = null; CeteEkran.uid = null; CeteEkran.hata = null; ceteEkranCiz(); ceteKodBekleyen(); return; }
  if (CeteEkran.uid !== u.uid) CeteEkran.cete = null;
  CeteEkran.uid = u.uid; CeteEkran.yukleniyor = true; ceteEkranCiz();
  try {
    const cete = await CeteCekirdek.benimCetem(ceteC(), u.uid);
    if (istek !== CeteEkran.istek) return;
    CeteEkran.cete = cete; CeteEkran.hata = null;
  } catch (e) { if (istek !== CeteEkran.istek) return; CeteEkran.hata = CeteKural.hataTuru(e); }
  CeteEkran.yukleniyor = false;
  ceteEkranCiz(); ceteKodBekleyen(); ceteBildirimBaslat();
  if(typeof OzelSohbet!=='undefined')OzelSohbet.profilGuncelle();
}

// ---------- Sosyal ekrandaki kartlar ----------
const ceteEl = (etiket, sinif, metin) => { const e = document.createElement(etiket); if (sinif) e.className = sinif; if (metin != null) e.textContent = metin; return e; };
function dugmeEl(yazi, fn, sinif = "cete-dugme") { const b = ceteEl("button", sinif, yazi); b.onclick = fn; return b; }

// Hesap/çete yokken: kur ya da katıl kartı (Sohbet ve Çete sekmesinde aynı).
function ceteGirisKarti() {
  const k = ceteEl("div", "kart cete-gercek");
  if (!Bulut.kullanici) {
    k.append(ceteEl("b", null, "👥 Gerçek çete"), ceteEl("p", "soluk", "Arkadaşlarınla gerçekten yazışmak için hesap aç ya da giriş yap. Hesapsız da aşağıdaki demo sohbeti deneyebilirsin."),
      dugmeEl("Hesap aç / giriş yap", () => { ayarlarCiz(); tamAc("ayarlar"); }));
    return k;
  }
  if (CeteEkran.yukleniyor && !CeteEkran.cete) { k.append(ceteEl("p", "soluk", "Çete bilgisi yükleniyor…")); return k; }
  if (CeteEkran.hata) {
    k.append(ceteEl("b", null, "👥 Gerçek çete"), ceteEl("p", "soluk", CeteEkran.hata === "baglanti" ? "📴 Çete bilgisi alınamadı: bağlantı yok gibi." : "Çete bilgisi alınamadı."),
      dugmeEl("Tekrar dene", ceteYenile));
    return k;
  }
  const sira = ceteEl("div", "cete-dugmeler");
  sira.append(dugmeEl("🐾 Çete kur", kurPenceresi), dugmeEl("🔑 Kodla katıl", () => katilPenceresi("")));
  k.append(ceteEl("b", null, "👥 Gerçek çete"), ceteEl("p", "soluk", `Bir çete kur, kodunu arkadaşlarına gönder; en çok ${CETE.enCokUye} kişi. Ya da arkadaşının verdiği kodla katıl.`), sira);
  return k;
}

// Çetedeyken Çete sekmesi: ad, üyeler, davet, ayrıl.
function ceteYonetKarti(c) {
  const k = ceteEl("div", "kart cete-gercek"), kurucu = c.kurucu === CeteEkran.uid;
  const bas = ceteEl("div", "cete-bas-gercek");
  bas.append(ceteEl("span", "c-ikon", "🐾"));
  const ad = ceteEl("div"); ad.append(ceteEl("b", null, c.ad), ceteEl("small", null, `${c.uyeler.length}/${CETE.enCokUye} üye · gerçek çete`));
  bas.append(ad); k.append(bas);
  if(typeof ceteSeviyeCiz==='function')ceteSeviyeCiz(k,c);
  const liste = ceteEl("div", "cete-uye-liste");
  c.uyeler.forEach(uid => {
    const s = ceteEl("div", "cete-uye");
    const av = ceteEl("span", "avatar", ceteAd(c, uid)[0] || "?"); av.style.background = ceteRenk(uid);
    const yazi = ceteEl("span", "cete-uye-ad", ceteAd(c, uid));
    if (uid === CeteEkran.uid) yazi.append(ceteEl("small", null, " (sen)"));
    if (uid === c.kurucu) yazi.append(ceteEl("small", null, " 👑 kurucu"));
    s.append(av, yazi);
    yazi.setAttribute('role','button');yazi.tabIndex=0;yazi.onclick=()=>profilAc(uid);yazi.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();profilAc(uid);}};
    if (kurucu && uid !== CeteEkran.uid) s.append(dugmeEl("At", () => cikarPenceresi(uid, false), "cete-dugme kucuk"), dugmeEl("Banla", () => cikarPenceresi(uid, true), "cete-dugme kucuk"));
    liste.append(s);
  });
  k.append(liste);
  if (kurucu) {
    for (const uid of c.cikarilanlar) k.append(dugmeEl(ceteAd(c, uid) + " · Banı kaldır", async () => { try { await CeteCekirdek.banKaldir(ceteC(), c.id, uid); await ceteYenile(); } catch(e) { bildir(ceteHataMetni(e)); } }));
    k.append(dugmeEl("🚩 Bildirilen mesajlar", ceteSikayetleriAc));
  }
  const kod = ceteEl("div", "cete-kod");
  kod.append(ceteEl("span", null, "Davet kodu"), ceteEl("b", null, c.kod));
  k.append(kod);
  const sira = ceteEl("div", "cete-dugmeler");
  sira.append(dugmeEl("🔗 Davet et", () => davetPenceresi(c)), dugmeEl("🚪 Çeteden ayrıl", ayrilPenceresi, "cete-dugme ikincil"));
  k.append(sira, ceteEl("p", "soluk cete-not", "Mesajları yalnız çete üyeleri görür; 30 günden eski mesajlar silinir. Kurucu üyeyi atabilir veya banlayabilir. Atılan tekrar katılabilir; banlanan yasağı kaldırılana kadar katılamaz."));
  return k;
}

// Çetedeyken Sohbet sekmesi: gerçek sohbete giriş.
function ceteSohbetKarti(c) {
  const b = ceteEl("button", "kart sohbet-onizleme cete-gercek");
  const yazi = ceteEl("div"); yazi.append(ceteEl("b", null, `${c.ad} sohbeti`), ceteEl("small", null, `Gerçek · ${c.uyeler.length} üye · sadece İngilizce`));
  b.append(ceteEl("span", "h-ikon", "💬"), yazi, ceteEl("span", "ok", "›"));
  b.onclick = gercekSohbetAc;
  const f = document.createDocumentFragment();
  f.append(b, ceteEl("p", "soluk cete-not", "Mesajın çete üyelerine gider. Türkçe harf görürsem uyarırım ama mesaj yine gider. Öğrendiğin kelimeyi kullanınca günde bir kez +1 🪙. Mesaj seçeneklerinden yanıtlayabilir veya bildirebilirsin."));
  return f;
}

function ceteEkranCiz() {
  const c = CeteEkran.cete, hesapVar = Bulut.hazirMi();
  const sohbetYer = document.getElementById("cete-gercek-sohbet"), ceteYer = document.getElementById("cete-gercek-yonet"), arkYer = document.getElementById("cete-gercek-arkadas");
  if (!sohbetYer) return;
  // Hesap sistemi yoksa (ör. emülatörsüz yerel deneme) eski demo ekranı aynen kalır.
  sohbetYer.replaceChildren(); ceteYer.replaceChildren(); arkYer.replaceChildren();
  if (hesapVar) {
    if (c) { sohbetYer.append(ceteSohbetKarti(c)); ceteYer.append(ceteYonetKarti(c)); }
    else { sohbetYer.append(ceteGirisKarti()); ceteYer.append(ceteGirisKarti()); }
    if (c) {
      arkYer.append(ceteEl("h2", null, "Çete üyelerin"));
      const k = ceteEl("div", "kart cete-uye-liste");
      c.uyeler.filter(uid => uid !== CeteEkran.uid).forEach(uid => {
        const s = ceteEl("div", "cete-uye"), av = ceteEl("span", "avatar", ceteAd(c, uid)[0] || "?"); av.style.background = ceteRenk(uid);
        s.append(av, ceteEl("span", "cete-uye-ad", ceteAd(c, uid))); k.append(s);
      });
      if (c.uyeler.length < 2) k.append(ceteEl("p", "soluk", "Henüz yalnızsın. Çete sekmesinden davet kodunu arkadaşlarına gönder."));
      arkYer.append(k);
    }
  }
  // Demo parçaları: çetedeyken demo sohbet ve demo çete başlığı gizlenir, kalan demo kısımlar etiketli kalır.
  document.getElementById("sohbet-ac").hidden = !!c;
  document.getElementById("sohbet-demo-not").hidden = !!c;
  document.getElementById("cete-demo-bas").hidden = !!c;
  document.getElementById("sosyal-demo-bant").innerHTML = c
    ? "<b>🧪 Demo</b> Arkadaşlık, kişi başına görevler, üyeler, sohbet ve karşılıklı çete savaşı gerçek. Haftalık çete görevleri örnek."
    : "<b>🧪 Demo</b> Arkadaşlar, çete üyeleri, mesajları ve puanları örnek; gerçek kişiler değil. Senin ilerlemen ve altının gerçek.";
  if(Bulut.kullanici)document.getElementById("sosyal-demo-bant").innerHTML=c?"<b>🌐 Sosyal</b> Arkadaşlık, görevler, üyeler, sohbet ve karşılıklı savaş gerçek. Haftalık çete görevleri örnek.":"<b>🌐 Sosyal</b> Arkadaşlık ve kişi başına görevler gerçek. Sohbet ve savaş için çete kur veya katıl.";
  document.getElementById("sosyal-prototip-not").hidden = hesapVar;
  if (Bulut.kullanici && typeof arkadasGercekCiz === "function") arkadasGercekCiz();
  if(typeof SavasEkran!=="undefined")SavasEkran.bagla();
}

// ---------- Pencereler ----------
// Pencere içeriği öğe öğe kurulur. Vazgeç düğmesi #p-dugme: telefonun geri tuşu da onu kullanır.
function cetePencere(ikon, baslik, govde, dugmeler) {
  const p = document.getElementById("pencere"), perde = document.getElementById("perde");
  const kapat = () => perde.classList.remove("aktif");
  const mesaj = ceteEl("p", "soluk hesap-mesaj"); mesaj.hidden = true;
  const sira = ceteEl("div", "onay-dugmeler");
  dugmeler.forEach(([yazi, fn, vazgec]) => {
    const b = ceteEl("button", "buyuk-dugme" + (vazgec ? " vazgec" : ""), yazi);
    if (vazgec) b.id = "p-dugme";
    b.onclick = vazgec ? () => { kapat(); if (fn) fn(); } : async () => {
      sira.querySelectorAll("button").forEach(x => x.disabled = true);
      mesaj.hidden = false; mesaj.textContent = "Bekle…";
      let sonuc;
      try { sonuc = await fn(); } catch (e) { sonuc = ceteHataMetni(e); }
      sira.querySelectorAll("button").forEach(x => x.disabled = false);
      if (typeof sonuc === "string") { mesaj.textContent = sonuc; return; } // hata: pencere açık kalır
      kapat();
    };
    sira.append(b);
  });
  p.replaceChildren(ceteEl("div", "p-ikon", ikon), ceteEl("h3", null, baslik), ...govde, mesaj, sira);
  perde.classList.add("aktif");
  const ilk = p.querySelector("input"); if (ilk) setTimeout(() => ilk.focus(), 60);
}
function girdiEl(yer, sinir, deger = "") {
  const i = ceteEl("input", "hesap-girdi"); i.placeholder = yer; i.maxLength = sinir; i.value = deger; i.autocomplete = "off";
  i.setAttribute("aria-label", yer); return i;
}
function ceteHataMetni(e) {
  const m = String((e && e.message) || "");
  if (m === "ad-bos") return "Adı boş bırakma.";
  if (m === "zaten-cetede") return "Zaten bir çetedesin. Yeni çete kurmak için önce şimdiki çeteden ayrıl.";
  const t = CeteKural.hataTuru(e);
  if (t === "baglanti") return "📴 Bağlantı yok gibi. İnternetini kontrol edip tekrar dene.";
  if (t === "izin") return "Bu işlem yapılamadı (izin yok). Sayfayı yenileyip tekrar dene.";
  return "Bir şeyler ters gitti; biraz sonra tekrar dene.";
}

function kurPenceresi() {
  if (CeteEkran.cete) { pencere("🐾", "Zaten bir çetedesin", "Yeni çete kurmak için önce şimdiki çeteden ayrılmalısın (Sosyal > Çete > Çeteden ayrıl).", "Tamam"); return; }
  const ad = girdiEl("Çetenin adı (ör. Patiler)", CETE.ceteAdSinir), takma = girdiEl("Sohbette görünecek adın", CETE.adSinir, takmaOku());
  cetePencere("🐾", "Çete kur", [ceteEl("p", null, "Kurunca bir davet kodu alırsın; arkadaşların o kodla katılır."), ad, takma], [
    ["Kur", async () => {
      if (!CeteKural.adTemizle(ad.value) || !CeteKural.adTemizle(takma.value)) return "Çete adını ve kendi adını yaz.";
      const r = await CeteCekirdek.kur(ceteC(), CeteEkran.uid, { ad: ad.value, takmaAd: takma.value });
      takmaYaz(CeteKural.adTemizle(takma.value));
      Ses.altin(); await ceteYenile();
      setTimeout(() => CeteEkran.cete && davetPenceresi(CeteEkran.cete, true), 50);
      return r;
    }], ["Vazgeç", null, true]]);
}

function katilPenceresi(onKod) {
  if (CeteEkran.cete) { pencere("🐾", "Zaten bir çetedesin", "Başka çeteye katılmak için önce şimdiki çeteden ayrılmalısın (Sosyal > Çete > Çeteden ayrıl).", "Tamam"); return; }
  const kod = girdiEl("6 harfli kod (ör. KEDI42)", 12, onKod), takma = girdiEl("Sohbette görünecek adın", CETE.adSinir, takmaOku());
  kod.autocapitalize = "characters";
  cetePencere("🔑", "Kodla katıl", [ceteEl("p", null, onKod ? "Bir çeteye davet edildin. Sohbette görünecek adını yaz ve katıl." : "Arkadaşının verdiği 6 harfli kodu yaz."), kod, takma], [
    ["Katıl", async () => {
      const k = CeteKural.kodDuzelt(kod.value);
      if (!CeteKural.kodGecerli(k)) return "Kod 6 harf olmalı (0, O, 1 ve I harfleri kodlarda yok).";
      if (!CeteKural.adTemizle(takma.value)) return "Sohbette görünecek adını yaz.";
      const r = await CeteCekirdek.katil(ceteC(), CeteEkran.uid, k, takma.value);
      if (r.hata === "kod") return "Bu kodla bir çete bulunamadı. Harfleri kontrol et.";
      if (r.hata === "izin") return "Bu çeteye katılamadın: çete dolu olabilir (en çok 10 kişi), daha önce çıkarılmış olabilirsin ya da zaten başka bir çetedesin.";
      takmaYaz(CeteKural.adTemizle(takma.value));
      if (onKod) CeteEkran.kod = null;
      Ses.altin(); bildir(`🐾 ${r.ad} çetesine katıldın!`); await ceteYenile();
      return r;
    }], ["Vazgeç", onKod ? () => { CeteEkran.kod = null; } : null, true]]);
}

function davetPenceresi(c, yeni) {
  const link = CeteKural.baglanti(c.kod);
  const kod = ceteEl("div", "cete-kod buyuk"); kod.append(ceteEl("b", null, c.kod));
  const kopyala = async (metin, tamam) => {
    try { await navigator.clipboard.writeText(metin); bildir(tamam); } catch (e) { bildir("Kopyalanamadı; kodu elle yaz: " + c.kod); }
  };
  const paylas = async () => {
    const metin = `"${c.ad}" çeteme katıl! İngilizce Kedi'de kod: ${c.kod}`;
    if (navigator.share) { try { await navigator.share({ title: "Çete daveti", text: metin, url: link }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    kopyala(`${metin}\n${link}`, "🔗 Davet bağlantısı kopyalandı");
  };
  const sira = ceteEl("div", "cete-dugmeler");
  sira.append(dugmeEl("🔗 Bağlantıyı paylaş", paylas), dugmeEl("📋 Kodu kopyala", () => kopyala(c.kod, "📋 Kod kopyalandı")));
  cetePencere(yeni ? "🎉" : "🔗", yeni ? `"${c.ad}" kuruldu!` : "Arkadaşını davet et",
    [ceteEl("p", null, "Arkadaşın bağlantıya dokunarak ya da uygulamada Sosyal > Sohbet > Kodla katıl'a bu kodu yazarak katılır. Telefon uygulamasında kodu elle yazmak gerekir."), kod, sira],
    [["Tamam", null, true]]);
}

function ayrilPenceresi() {
  const c = CeteEkran.cete; if (!c) return;
  const kalan = c.uyeler.filter(u => u !== CeteEkran.uid);
  const acik = !kalan.length ? "Son üyesin: ayrılınca çete, kodu ve tüm mesajlar silinir."
    : c.kurucu === CeteEkran.uid ? `Kuruculuk ${ceteAd(c, kalan[0])} kişisine geçer.` : "İstersen sonra kodla tekrar katılabilirsin.";
  const govde = [ceteEl("p", null, acik)];
  let kutu = null;

  cetePencere("🚪", `"${c.ad}" çetesinden ayrıl?`, govde, [
    ["Ayrıl", async () => {
      await CeteCekirdek.ayril(ceteC(), CeteEkran.uid, c.id, { mesajlarimiSil: !!(kutu && kutu.checked) });
      bildir("🚪 Çeteden ayrıldın"); await ceteYenile();
    }], ["Vazgeç", null, true]]);
}

function cikarPenceresi(uid, ban = true) {
  const c = CeteEkran.cete; if (!c) return;
  cetePencere("✋", ceteAd(c, uid) + (ban ? " banlansın mı?" : " atılsın mı?"), [ceteEl("p", null, ban ? "Bu çeteye ban kaldırılana kadar tekrar katılamaz." : "Davet koduyla yeniden katılabilir.")], [
    [ban ? "Banla" : "At", async () => { await CeteCekirdek[ban ? "cikar" : "at"](ceteC(), c.id, uid); await ceteYenile(); }], ["Vazgeç", null, true]]);
}

// Davet bağlantısıyla (?katil=KOD) gelindiyse: hesap varsa katılma penceresi, yoksa önce hesap açması söylenir.
// Kod, katılınca ya da katılma penceresinde "Vazgeç" denince silinir. Giriş sonrası başka bir pencere ("ilerlemen
// taşındı" gibi) katılma penceresinin üstüne yazabilir; o yüzden kod bekliyorsa perde kapanınca pencere yeniden açılır.
function ceteKodBekleyen() {
  const kod = CeteEkran.kod;
  if (!kod || CeteEkran.yukleniyor || document.getElementById("perde").classList.contains("aktif")) return;
  if (!Bulut.hazirMi()) { CeteEkran.kod = null; pencere("🐾", "Çete daveti", "Bu sürümde hesap açılamıyor, bu yüzden çeteye katılamazsın.", "Tamam"); return; }
  if (!Bulut.kullanici) {
    if (CeteEkran.kodUyarildi) return;
    CeteEkran.kodUyarildi = true;
    pencere("🐾", "Bir çeteye davet edildin!", `Katılmak için önce hesap aç ya da giriş yap (Ayarlar > Hesap). Girişten sonra ${kod} kodlu çeteye katılma penceresi açılır.`, "Hesap ekranına git", () => { ayarlarCiz(); tamAc("ayarlar"); });
    return;
  }
  if (CeteEkran.cete) { CeteEkran.kod = null; pencere("🐾", "Zaten bir çetedesin", `Bağlantıdaki ${kod} kodlu çeteye katılmak için önce şimdiki çeteden ayrılmalısın (Sosyal > Çete).`, "Tamam"); return; }
  katilPenceresi(kod);
}
// Kod bekledikçe ara ara bakılır (yalnız yerel kontrol, ağ yok); hesap sistemi hiç başlamazsa da davet cevapsız kalmaz.
if (CeteEkran.kod) { const t = setInterval(() => { if (!CeteEkran.kod) clearInterval(t); else ceteKodBekleyen(); }, 1500); }

// ---------- Gerçek sohbet ----------
function sohbetBaslik(gercek) {
  sohbetDilUyari();
  const t = document.getElementById("tam-sohbet");
  t.querySelector(".ust .hap").textContent = gercek ? `💬 ${CeteEkran.cete.ad}` : "💬 Patiler Çetesi";
  t.querySelector(".sohbet-kural").innerHTML = gercek
    ? `<b class="demo-rozet">👥 Gerçek</b> Mesajın çete üyelerine gider. Kural: İngilizce yaz, nazik ol. Mesajlar 30 gün saklanır; mesajları yanıtlayabilir veya bildirebilirsin.`
    : `<b class="demo-rozet">🧪 Demo</b> Üyeler ve cevaplar örnek; mesajın kimseye gitmez. Kural: İngilizce yaz, nazik ol. İstemediğin mesajı 🚩 ile gizle.`;
}

function gercekSohbetAc() {
  const c = CeteEkran.cete; if (!c) return;
  ceteSohbetKapat(); ceteYanitSec(null);
  const s = { ceteId: c.id, kapat: [], yuklendi: false };
  CeteEkran.sohbet = s; CeteEkran.mesajlar = []; CeteEkran.sonId = null;
  s.dugumler = new Map();
  sohbetEkran.sayi = 0; sohbetEkran.hata = null; sohbetEkran.yaziyor = null;
  sohbetBaslik(true);
  document.getElementById("sohbet-girdi").disabled = document.getElementById("sohbet-gonder").disabled = false;
  document.getElementById("sohbet-liste").replaceChildren();
  document.getElementById("sohbet-yeni").hidden = true;
  const durum = document.getElementById("sohbet-durum");
  durum.hidden = false; durum.className = "sohbet-durum"; durum.textContent = "Mesajlar yükleniyor…";
  oneriCiz();
  tamAc("sohbet");
  const cc = ceteC();
  s.kapat.push(CeteCekirdek.dinle(cc, c.id, liste => {
    if (CeteEkran.sohbet !== s) return;
    s.yuklendi = true; CeteEkran.mesajlar = liste; gercekSohbetCiz();
  }, e => gercekSohbetHata(s, e)));
  // Çete belgesi de dinlenir: yeni üye adı, kuruculuk değişimi, çıkarılma.
  s.kapat.push(CeteCekirdek.ceteDinle(cc, c.id, v => {
    if (CeteEkran.sohbet !== s) return;
    if (!v || !v.uyeler.includes(CeteEkran.uid)) { gercekSohbetHata(s, { code: "permission-denied" }); return; }
    CeteEkran.cete = { id: c.id, ...v };
  }, e => gercekSohbetHata(s, e)));
  CeteCekirdek.temizle(cc, c.id).catch(() => {}); // 30 günden eskiler; başarısızsa bir dahaki açılışta
}

function ceteSohbetKapat() {
  const s = CeteEkran.sohbet; if (!s) return;
  CeteEkran.sohbet = null;
  s.kapat.forEach(f => { try { f(); } catch (e) {} });
}
Oturumlar.ekle('cete-sohbet', ceteSohbetKapat, undefined, undefined, 'sohbet');

function gercekSohbetHata(s, e) {
  if (CeteEkran.sohbet !== s) return;
  if (CeteKural.hataTuru(e) === "izin") {
    ceteSohbetKapat();
    sohbetEkran.hata = "✋ Artık bu çetede değilsin (çıkarıldın ya da çete kapandı).";
    document.getElementById("sohbet-girdi").disabled = document.getElementById("sohbet-gonder").disabled = true;
    document.querySelectorAll("#sohbet-liste .mesaj-sil").forEach(b => b.remove());
    ceteYenile();
  } else sohbetEkran.hata = "📴 Mesajlar alınamadı. Bağlantı gelince sohbeti kapatıp yeniden aç.";
  gercekDurumCiz();
}

function gercekDurumCiz() {
  const el = document.getElementById("sohbet-durum");
  const s = Sohbet.durumSatiri({ mesajSayisi: CeteEkran.mesajlar.length, cevrimici: navigator.onLine, hata: sohbetEkran.hata, gercek: true });
  el.hidden = !s; el.textContent = s ? s.metin : ""; el.className = "sohbet-durum" + (s ? " " + s.tur : "");
}

function gercekMesajEl(m) {
  const ben = m.uid === CeteEkran.uid, e = ceteEl("div", "mesaj" + (ben ? " ben" : ""));
  const ad = ceteEl("span", "kim", ben ? "Sen" : m.ad); if (!ben) ad.style.color = ceteRenk(m.uid); e.append(ad);
  ad.setAttribute('role','button');ad.tabIndex=0;ad.onclick=()=>profilAc(m.uid);ad.onkeydown=e=>{if(e.key==='Enter')profilAc(m.uid);};
  if (m.yanitId) { const eski = CeteEkran.mesajlar.find(x => x.id === m.yanitId); e.append(ceteEl("blockquote", "mesaj-alinti", eski ? eski.ad + ": " + eski.metin : "Önceki mesaj artık görüntülenemiyor")); }
  const yazi = ceteEl("span");
  const adlar = Object.values(CeteEkran.cete.adlar || {});
  const parcalar = m.metin.split(/(@[^@\n]+)/g);
  for (const p of parcalar) {
    const ad = p[0] === '@' && adlar.find(n => p.slice(1).startsWith(n) && (!p[n.length+1] || /[\s.,!?]/.test(p[n.length+1])));
    if (ad) { yazi.append(ceteEl("mark", null, '@'+ad), document.createTextNode(p.slice(ad.length+1))); } else yazi.append(document.createTextNode(p));
  }
  e.append(yazi,ceteEl('time','mesaj-saati',m.bekliyor?'Gönderiliyor…':Sohbet.saat(m.zaman))); if (m.bekliyor) e.classList.add("bekliyor");
  const sec = dugmeEl("⋯", () => ceteMesajSecenek(m), "bildir mesaj-secenek"); sec.setAttribute("aria-label", "Mesaj seçenekleri"); e.append(sec);
  ceteMesajHareketi(e, m);
  return e;
}

function gercekSohbetCiz() {
  const liste = document.getElementById("sohbet-liste"), m = CeteEkran.mesajlar;
  const altta = Sohbet.alttaMi(liste.scrollTop, liste.scrollHeight, liste.clientHeight), ust = liste.scrollTop;
  const son = m[m.length - 1], sonId = son ? son.id : null, yeniVar = sonId !== CeteEkran.sonId && !!son;
  const benim = yeniVar && son.uid === CeteEkran.uid;
  const dugumler = CeteEkran.sohbet.dugumler, kalan = new Set(m.map(x => x.id));
  for (const [id, kayit] of dugumler) if (!kalan.has(id)) { kayit.el.remove(); dugumler.delete(id); }
  m.forEach((mesaj, i) => {
    const imza = JSON.stringify(mesaj), eski = dugumler.get(mesaj.id);
    const el = eski && eski.imza === imza ? eski.el : gercekMesajEl(mesaj);
    if (eski && eski.el !== el) eski.el.replaceWith(el);
    if (liste.children[i] !== el) liste.insertBefore(el, liste.children[i] || null);
    dugumler.set(mesaj.id, { el, imza });
  });
  const karar = Sohbet.kaydirmaKarari({ altta, benim: benim || !sohbetEkran.sayi, yeniVar });
  if (karar === "in") sohbetAltaIn();
  else { liste.scrollTop = ust; sohbetAltDugmeCiz(karar === "goster"); }
  if (yeniVar && !benim && sohbetEkran.sayi) Ses.pop();
  CeteEkran.sonId = sonId; sohbetEkran.sayi = m.length;
  gercekDurumCiz(); ceteOkunduIsaretle();
}

function oneriCiz() {
  const son = KELIMELER.filter(k => d.kartlar[k[0]]).slice(-6).map(k => k[0]);
  document.getElementById("sohbet-oneri").innerHTML = (son.length ? son : ["hello", "today", "study"]).map(w => `<button data-oner="${Sohbet.kacis(w)}">${Sohbet.kacis(w)}</button>`).join("");
  document.querySelectorAll("[data-oner]").forEach(b => b.onclick = () => { const g = document.getElementById("sohbet-girdi"); g.value = (g.value + " " + b.dataset.oner).trim() + " "; g.focus(); });
}

async function gercekGonder() {
  const g = document.getElementById("sohbet-girdi"), metin = Sohbet.temizle(g.value), c = CeteEkran.cete, s = CeteEkran.sohbet;
  if (!metin || !c || !s) return;
  if (YASAKLI.some(y => y.test(metin.toLocaleLowerCase("tr")))) { Ses.yanlis(); pencere("🙀", "Bu mesaj gönderilemedi", "Çete'de nazik dil kuralı var. Başka türlü söylemeyi dene.", "Tamam"); return; }
  // Kural iki mesaj arasında 2 sn ister; burada önceden söylenir (yoksa sunucu reddeder, mesaj kaybolmuş gibi görünür).
  if (Date.now() - CeteEkran.sonGonderim < CETE.araSaniye * 1000) { bildir("⏳ Biraz yavaş: iki mesaj arasında 2 saniye bekle."); return; }
  CeteEkran.sonGonderim = Date.now();
  const uyari = CeteKural.ingilizceUyari(metin), o = ogrenilenleriIsaretle(metin), yanitId = CeteEkran.yanitId;
  g.value = ""; sohbetEkran.hata = null; Ses.pop();
  if (uyari) sohbetDilUyari("🇬🇧 Türkçe harfler gördüm. İngilizce pratik yapmayı unutma.");
  try {
    await CeteCekirdek.gonder(ceteC(), CeteEkran.uid, s.ceteId, ceteAd(c, CeteEkran.uid), metin, yanitId);
    if(CeteEkran.sohbet===s && CeteEkran.yanitId===yanitId) ceteYanitSec(null);
    if(CeteEkran.sohbet===s && uyari)sohbetDilUyari("🇬🇧 Mesajın gönderildi. Sonraki mesajını İngilizce yazmayı dene.");
  } catch (e) {
    if (CeteEkran.sohbet !== s) return; // Eski oturumun hatası yeni çetenin taslağına yazılmasın.
    if (!g.value) g.value = metin; // yazılan kaybolmasın
    sohbetEkran.hata = CeteKural.hataTuru(e) === "izin"
      ? "⚠️ Mesaj gönderilemedi: çok hızlı yazmış olabilirsin ya da artık bu çetede değilsin."
      : "⚠️ Mesaj gönderilemedi; bağlantını kontrol edip tekrar dene.";
    gercekDurumCiz(); return;
  }
  // Öğrenilen kelime ödülü demodakiyle aynı: günde bir kez +1 🪙 (çalışma günü saymaz).
  if (o.kullanilan.length) {
    const odul = Ekonomi.kazan(d, "sohbet:" + bugunNo(), EKONOMI.odul.sohbet.miktar, bugunNo());
    if (odul) { d.sohbetOdulGunu = bugunNo(); kaydet(); Ses.altin(); if (!uyari) bildir("✨ Öğrendiğin kelimeyi sohbette kullandın! +1 🪙 (günde bir kez)"); }
  }
}

// Sosyal ekrana her girişte çete bilgisi tazelenir (yeni üye, çıkarılma); canlı dinleme yalnız sohbette.
document.querySelectorAll('nav button[data-sekme="arkadaslar"]').forEach(b => b.addEventListener("click", () => { if (Bulut.kullanici) ceteYenile(); }));
document.addEventListener("visibilitychange", () => { if (!document.hidden && Bulut.kullanici && !CeteEkran.sohbet) ceteYenile(); });
