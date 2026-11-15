// ================= ÇETE SAVAŞI =================
// Haftalık, eş zamansız: her üye 4 moddan puan toplar; modda en iyi puanın çeteye yazılır.
// Rakip ve üyelerin puanı örnek veri. "Savaş" bir oyun modu adı: hepsi dil pratiği.
const SAVAS_MODLAR = [
  { id: "hiz", ikon: "⚡", ad: "Kelime Yarışı", acik: "45 sn, en çok doğru", ac: () => savasHizliAc("hiz") },
  { id: "dinle", ikon: "🎧", ad: "Kulak Kabart", acik: "60 sn, dinle ve yaz", ac: () => savasHizliAc("dinle") },
  { id: "cumle", ikon: "🧩", ad: "Cümle Düellosu", acik: "60 sn, her doğru 30", ac: () => { cSavas = true; cumleAc(); } },
  { id: "esles", ikon: "🐾", ad: "Pati Çabukluğu", acik: "60 sn, her doğru çift 20", ac: () => eslesAc(true) },
];
const SAVAS_UYE_PUAN = [["Ahmet", 420], ["Elif", 510], ["Mert", 180], ["Zeynep", 350]];
function savasDurum() {
  if (!d.savas || d.savas.hafta !== haftaBasi()) d.savas = { hafta: haftaBasi(), en: {} };
  if(d.savas.kuralSurum!==2){d.savas.eskiEn={...d.savas.en};d.savas.en={};d.savas.kuralSurum=2;}
  const gun = bugunNo() - haftaBasi(); // 0 = pazartesi
  const benim = Object.values(d.savas.en).reduce((a, b) => a + b, 0);
  const biz = SAVAS_UYE_PUAN.reduce((a, u) => a + Math.round(u[1] * (0.4 + gun * 0.1)), 0) + benim;
  const rakip = 1200 + gun * 130;
  return { gun, benim, biz, rakip, kalan: 6 - gun };
}
function savasCiz() {
  if(Bulut.kullanici && typeof SavasEkran!=="undefined"){SavasEkran.ciz();return;}
  const s = savasDurum(), oran = s.biz / (s.biz + s.rakip) * 100;
  document.getElementById("savas-kart").innerHTML = `<div class="kart">
    <div class="savas-skor"><div class="taraf">🐾 Patiler<b>${s.biz}</b></div><span>VS</span><div class="taraf">🦊 Tilkiler <small class="ornek-etiket">örnek</small><b>${s.rakip}</b></div></div>
    <div class="savas-cubuk"><i style="width:${oran}%"></i></div>
    <p class="soluk" style="font-size:13px;text-align:center;">${s.biz >= s.rakip ? "Öndeyiz! 🎉" : `${s.rakip - s.biz} puan gerideyiz`} · ${s.kalan > 0 ? `${s.kalan} gün kaldı` : "son gün!"} · Senin katkın: ${s.benim}</p>
    <div class="savas-modlar">${SAVAS_MODLAR.map((m, i) => `<button data-mod="${i}"><span class="m-ikon">${m.ikon}</span><b>${m.ad}</b><small>${d.savas.en[m.id] ? "En iyin: " + d.savas.en[m.id] : m.acik}</small></button>`).join("")}</div>
    <p class="soluk" style="font-size:12px;margin-top:8px;">Her modda en iyi puanın çetene yazılır. Hafta sonunda kazanan çeteye ödül.</p></div>`;
  document.querySelectorAll("[data-mod]").forEach(b => b.onclick = () => SAVAS_MODLAR[+b.dataset.mod].ac());
}
function savasSonuc(mod, puan, ozet = "") {
  savasDurum();
  const m = SAVAS_MODLAR.find(x => x.id === mod), eski = d.savas.en[mod] || 0, fark = SavasPuan.fark(eski,puan), rekor = fark > 0;
  if (rekor) d.savas.en[mod] = puan;
  const gercek=typeof SavasEkran!=="undefined" ? SavasEkran.kaydet(mod,puan) : null;
  kaydet(); rozetKontrol();
  rekor ? Ses.zafer() : Ses.dogru();
  turSonucu(m.ikon, rekor ? "Yeni en iyi puan!" : `${m.ad} bitti`, `${ozet} ${puan} puan. ${gercek ? `Savaş rekorun kaydedildi; bağlantı varken eşitlenir.` : Bulut.kullanici ? "Pratik turu · gerçek savaşa katkı yok." : rekor ? `Demo katkın ${puan - eski} arttı.` : `En iyin ${eski}; yalnız rekor sayılır.`}`);
}
// Hızlı modlar: Kelime Yarışı (İngilizce → Türkçe) ve Kulak Kabart (duy → doğru yazılış)
let sv = null;
Oturumlar.ekle('savas', () => { if (sv) sv.bitti = true; sv = null; }, () => sv && !sv.bitti);

function savasKuralSurumu(){return typeof SavasEkran!=='undefined'&&SavasEkran.baglam?SavasEkran.baglam.surum:2;}
function savasKelimeleri(surum=savasKuralSurumu(),adet=30) {
  if(surum>=2)return SavasPuan.havuz(KELIMELER.concat(PHRASAL),adet,karistir);
  const tanis = karistir(KELIMELER.filter(k => d.kartlar[k[0]]));
  return tanis.concat(karistir(KELIMELER.filter(k => !d.kartlar[k[0]] && k[5] === d.seviye))).slice(0, 30);
}
function savasHizliAc(mod) {
  const surum=savasKuralSurumu();
  sv = { mod, surum, kelimeler: savasKelimeleri(surum,mod==='dinle'?8:30), i: 0, puan: 0, dogru: 0, yanlis: 0, sure: mod === "hiz" ? 45 : 60, bas: performance.now(), kilit: false, bitti: false };
  if (mod === "dinle") sv.kelimeler = sv.kelimeler.slice(0, 8);
  document.getElementById("sv-yon").textContent = mod === "hiz" ? "Türkçesi ne? (her doğru 10)" : "Dinle ve yaz (her doğru 15)";
  if(surum>=2)document.getElementById('sv-yon').textContent+=mod==='hiz'?' · yanlış −3':' · yanlış −4,5';
  tamAc("savas"); savasSoru();
  const oyun = sv;
  const t = setInterval(() => {
    if (sv !== oyun || sv.bitti) return clearInterval(t);
    if (sv.sesBekliyor) return;
    const kalan = Math.max(0, sv.sure - (performance.now() - sv.bas) / 1000);
    document.getElementById("sv-sure").textContent = Math.ceil(kalan);
    document.getElementById("sv-cubuk").style.width = (kalan / sv.sure * 100) + "%";
    if (kalan <= 0) savasHizliBitir();
  }, 100);
}
function savasSoru() {
  if (sv.i >= sv.kelimeler.length) { sv.kelimeler = savasKelimeleri(sv.surum,sv.mod==='dinle'?8:30); sv.i = 0; }
  const k = sv.kelimeler[sv.i];
  let siklar, dogru;
  if (sv.mod === "hiz") {
    document.getElementById("sv-soru").textContent = k[0];
    dogru = k[1]; siklar = [k[1], ...karistir(KELIMELER.filter(x => x[1] !== k[1])).slice(0, 3).map(x => x[1])];
  } else {
    document.getElementById("sv-soru").innerHTML = `<button class="dinle-dugme" id="sv-ses" style="margin:4px auto 0;">🔊</button>`;
    const oyun=sv;
    sv.sesBekliyor=true;sv.kilit=true;
    const alan=document.getElementById('sv-siklar'); alan.replaceChildren();
    const g=document.createElement('input');g.className='hesap-girdi';g.autocomplete='off';g.autocapitalize='none';g.spellcheck=false;g.setAttribute('aria-label','Duyduğun kelimeyi yaz');
    const kontrol=document.createElement('button');kontrol.className='buyuk-dugme';kontrol.textContent='Kontrol et';
    const form=document.createElement('form');form.append(g,kontrol);alan.append(form);g.disabled=kontrol.disabled=true;
    const sesHata=()=>{
      if(sv!==oyun||oyun.bitti)return;
      // Sessiz soru rekor veya yanlış üretmez; tekrar giriş yeni bir turdur.
      oyun.bitti=true;sv=null;sesDurdur();
      pencere('🔇','Sesli tur durduruldu','Ses oynatılamadı; bu tur puana veya yanlış sayısına eklenmedi. İngilizce cihaz sesini ve bağlantını kontrol ederek yeni tur başlatabilirsin.','Tamam',()=>{tamKapat();});
    };
    const oku=async()=>{
      const beklemeBasi=performance.now();
      const ilk=oyun.sesBekliyor;
      const ok=await seslendir(k[0],false,{hata:sesHata});
      if(sv!==oyun||oyun.bitti||!ok)return;
      if(ilk&&oyun.sesBekliyor){oyun.bas+=performance.now()-beklemeBasi;oyun.sesBekliyor=false;oyun.kilit=false;g.disabled=kontrol.disabled=false;g.focus();}
    };
    document.getElementById('sv-ses').onclick=()=>{if(!oyun.sesBekliyor)oku();};
    oku();
    form.onsubmit=e=>{e.preventDefault();if(!sv||sv.kilit||sv.bitti||!g.value.trim())return;sv.kilit=true;
      const ok=SavasPuan.yazim(g.value)===SavasPuan.yazim(k[0]);
      if(ok){sv.dogru++;Ses.dogru()}else{sv.yanlis++;Ses.yanlis()}
      sv.puan=SavasPuan.net('dinle',sv.dogru,sv.yanlis,sv.surum);
      g.disabled=true;kontrol.disabled=true;const bilgi=document.createElement('p');bilgi.textContent=ok?'Doğru!':'Doğrusu: '+k[0];form.append(bilgi);
      document.getElementById('sv-puan').textContent='⚔️ '+sv.puan+' puan';kaydet();
      const oyun=sv;setTimeout(()=>{if(sv!==oyun||oyun.bitti)return;sv.i++;savasSoru()},ok?250:1000);
    };g.focus();return;
  }
  document.getElementById("sv-siklar").innerHTML = karistir(siklar).map(x => `<button class="av-sik">${x}</button>`).join("");
  sv.kilit = false;
  document.querySelectorAll("#sv-siklar .av-sik").forEach(b => b.onclick = () => {
    if (sv.kilit || sv.bitti) return; sv.kilit = true;
    const ok = b.textContent === dogru;
    b.classList.add(ok ? "dogru" : "yanlis");
    if (!ok) document.querySelectorAll("#sv-siklar .av-sik").forEach(x => { if (x.textContent === dogru) x.classList.add("dogru"); });
    if (ok) { sv.dogru++; Ses.dogru(); } else { sv.yanlis++; Ses.yanlis(); }
    sv.puan=SavasPuan.net(sv.mod,sv.dogru,sv.yanlis,sv.surum);
    document.getElementById("sv-puan").textContent = `⚔️ ${sv.puan} puan`;
    kaydet();
    const oyun = sv; setTimeout(() => { if (sv !== oyun || oyun.bitti) return; sv.i++; savasSoru(); }, ok ? 250 : 1000);
  });
}
function savasHizliBitir() {
  if (!sv || sv.bitti) return; sv.bitti = true;
  const mod = sv.mod, puan = sv.puan, ozet = `${sv.dogru} doğru, ${sv.yanlis} yanlış.`; sv = null;
  savasSonuc(mod, puan, ozet);
}

