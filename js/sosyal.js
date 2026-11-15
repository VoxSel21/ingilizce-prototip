// ================= ÇETE (örnek veri) =================
const ARKADASLAR = [
  ["Ahmet", "#FF8A7A", 9, 145, "bugün 12 kart çalıştı"],
  ["Elif", "#5CC9A7", 21, 210, "yeni bir başarım kazandı 🎓"],
  ["Mert", "#6DB8EE", 2, 60, "bugün henüz girmedi"],
];
const tepkiler = {};
// Ortak görevler: üyelerin katkısı örnek veri, seninki gerçek. Hafta pazartesi başlar.
const haftaBasi = () => { const b = bugunNo(); return b - ((new Date().getDay() + 6) % 7); };
const haftaSay = obj => Object.keys(obj || {}).filter(g => +g >= haftaBasi() && +g <= bugunNo()).length;
const CETE_GOREVLER = [
  { id: "tanis", ikon: "🃏", ad: "Çetece 60 yeni kelimeyle tanışın", hedef: 60, odul: EKONOMI.odul.cete.tanis,
    uyeler: [["Ahmet", 18], ["Elif", 19], ["Mert", 4], ["Zeynep", 11]], sen: () => Object.entries(d.tanisGun || {}).filter(([g]) => +g >= haftaBasi() && +g <= bugunNo()).reduce((t, [, n]) => t + n, 0) },
  { id: "av", ikon: "🎣", ad: "Çetece 6 balık avına çıkın", hedef: 6, odul: EKONOMI.odul.cete.av,
    uyeler: [["Ahmet", 2], ["Elif", 2], ["Mert", 0], ["Zeynep", 1]], sen: () => haftaSay(d.avlar) },
];
function ceteDurum(g) {
  const sen = g.sen(), hepsi = g.uyeler.concat([["Sen", sen]]);
  if (g.herkes) { const tamam = hepsi.filter(u => u[1] >= g.hedef).length; return { hepsi, deger: tamam, hedef: hepsi.length, bitti: tamam === hepsi.length }; }
  const toplam = hepsi.reduce((s, u) => s + u[1], 0); return { hepsi, deger: Math.min(toplam, g.hedef), hedef: g.hedef, bitti: toplam >= g.hedef };
}
const ceteAnahtar = g => haftaBasi() + g.id;
function ceteHaftaTamam() { return CETE_GOREVLER.every(g => (d.ceteOdul || {})[ceteAnahtar(g)]); }
function ceteCiz() {
  d.ceteOdul = d.ceteOdul || {};
  document.getElementById("cete-gorevler").innerHTML = CETE_GOREVLER.map((g, i) => {
    const s = ceteDurum(g), alindi = d.ceteOdul[ceteAnahtar(g)];
    const uyeler = s.hepsi.map(u => `<span class="${g.herkes && u[1] >= g.hedef ? "tamam" : ""}">${Sohbet.kacis(u[0])} ${g.herkes ? u[1] + " gün" : "+" + u[1]}</span>`).join("");
    return `<div class="kart cete-gorev"><div class="g-ust"><span class="g-ikon">${g.ikon}</span><div><b>${g.ad}</b><small>${g.herkes ? s.deger + "/" + s.hedef + " kişi tamam" : s.deger + "/" + s.hedef}</small></div>
      <button class="al" data-cete="${i}" ${!s.bitti || alindi ? "disabled" : ""}>${alindi ? "Alındı ✓" : "🪙 " + g.odul}</button></div>
      <div class="cete-cubuk"><i style="width:${s.deger / s.hedef * 100}%"></i></div><div class="cete-uyeler">${uyeler}</div></div>`;
  }).join("") + `<div class="kart" style="background:var(--gunes-a);margin-bottom:10px;"><b style="font-weight:900;">🎁 Haftanın hepsi biterse</b>
      <p class="soluk" style="font-size:14px;margin-top:4px;">"Çete ruhu" başarımı (+5 🪙) ve yalnız çeteyle kazanılan 🧣 Çete bandanası (Kedi > Gardırop > Boyun).</p></div>`;
  document.querySelectorAll("[data-cete]").forEach(b => b.onclick = () => {
    const g = CETE_GOREVLER[+b.dataset.cete]; if (d.ceteOdul[ceteAnahtar(g)]) return;
    d.ceteOdul[ceteAnahtar(g)] = 1; Ekonomi.kazan(d, "cete:" + ceteAnahtar(g), g.odul, bugunNo()); kaydet(); Ses.altin(); konfeti(b, 8); bildir(`${g.ikon} Çete görevi bitti! +${g.odul} 🪙`); rozetKontrol(); herSeyiCiz();
  });
}
function arkadasCiz() {
  const baslik=document.querySelector('#ekran-arkadaslar>.ust .hap');
  baslik.textContent=sosyalBolum==='arkadas'?'👫 Arkadaşlar':'🐾 Çete';
  document.querySelector('nav [data-sekme="arkadaslar"]').setAttribute('aria-label','Sosyal · '+(sosyalBolum==='arkadas'?'Çeteye geç':'Arkadaşlara geç'));

  document.querySelectorAll("[data-sosyal]").forEach(b => b.classList.toggle("aktif", b.dataset.sosyal === sosyalBolum));
  document.getElementById("sosyal-arkadas").style.display = sosyalBolum === "arkadas" ? "" : "none";
  document.getElementById("sosyal-cete").style.display = sosyalBolum === "cete" ? "" : "none";
  document.getElementById("sosyal-sohbet").style.display = sosyalBolum === "sohbet" ? "" : "none";
  // Ekle düğmesi yalnız arkadaş ve çete bölümünde anlamlı.
  document.getElementById("ekle-dugme").hidden = sosyalBolum === "sohbet";
  ceteCiz(); ikiliCiz(); savasCiz();
  if (Bulut.kullanici) { ceteEkranCiz(); arkadasGercekCiz(); return; }
  const sonMesaj = (d.sohbet && d.sohbet.length) ? d.sohbet[d.sohbet.length - 1] : { kim: SOHBET_ORNEK[SOHBET_ORNEK.length - 1][0], metin: SOHBET_ORNEK[SOHBET_ORNEK.length - 1][1] };
  document.getElementById("sohbet-son").textContent = `${sonMesaj.kim}: ${sonMesaj.metin}`;
  const sen = ["Sen", "#9F8BEA", seri(), d.bugun.sayi * 10 + d.cumleDogru * 15 + 80];
  const lig = ARKADASLAR.map(a => a.slice(0, 4)).concat([sen]).sort((a, b) => b[3] - a[3]);
  document.getElementById("lig").innerHTML = lig.map((a, i) => `<div class="arkadas ${a[0] === "Sen" ? "sen" : ""}"><span class="sira">${["🥇","🥈","🥉"][i] || i + 1}</span><div class="avatar" style="background:${a[1]};width:40px;height:40px;font-size:16px;">${a[0][0]}</div><div><b>${Sohbet.kacis(a[0])}${a[0] === "Sen" ? "" : '<span class="ornek-etiket">örnek</span>'}</b><small>🔥 ${a[2]} gün</small></div><b>${a[3]} XP</b></div>`).join("");
  const bugun = bugunNo(); d.miyav = d.miyav || {};
  document.getElementById("arkadas-listesi").innerHTML = ARKADASLAR.map((a, i) => `<div class="kart arkadas-kart">
    <div class="arkadas"><div class="avatar" style="background:${a[1]}">${a[0][0]}</div><div><b>${Sohbet.kacis(a[0])}<span class="ornek-etiket">örnek</span></b><small>${Sohbet.kacis(a[4])}</small></div></div>
    <div class="alt-satir">${["👏","🔥","💜"].map(t => `<button class="tepki ${tepkiler[i + t] ? "gonderildi" : ""}" data-t="${i}|${t}">${t}</button>`).join("")}
      <button class="miyav-dugme ${d.miyav[a[0]] === bugun ? "gonderildi" : ""}" data-miyav="${i}">${d.miyav[a[0]] === bugun ? "😺 Miyavlandı" : "🐱 Miyavla"}</button></div>
    ${(d.ikili || []).some(g => g.arkadas === a[0]) ? "" : `<button class="ikili-dugme" data-ikili="${i}">🤝 Birlikte görev</button>`}</div>`).join("");
  document.querySelectorAll("[data-ikili]").forEach(b => b.onclick = () => ikiliBaslat(+b.dataset.ikili));
  // Demo: Elif (örnek arkadaş) sana miyavlamış gibi gösterilir; etiketli.
  const elifeDondun = d.miyav["Elif"] === bugun;
  document.getElementById("gelen-miyav").innerHTML = `<div class="kart gelen-miyav"><span class="g-ikon">😺</span>
    <div><b>Elif<span class="ornek-etiket">örnek</span> sana miyavladı!</b><small>"Hadi kelime zamanı 🐾" · demo bildirimi</small></div>
    <button class="miyav-dugme ${elifeDondun ? "gonderildi" : ""}" style="flex:none;padding:0 14px;" data-miyav="1">${elifeDondun ? "😺 Döndün" : "Geri miyavla"}</button></div>`;
  document.querySelectorAll("[data-miyav]").forEach(b => b.onclick = () => miyavla(+b.dataset.miyav, b));
  document.querySelectorAll("[data-t]").forEach(b => b.onclick = () => {
    const [i, t] = b.dataset.t.split("|");
    if (tepkiler[i + t]) return;
    tepkiler[i + t] = 1; d.tepki++; kaydet(); konfeti(b, 5); bildir(`${ARKADASLAR[i][0]}'e ${t} gönderildi`); rozetKontrol(); arkadasCiz();
  });
  demoArkadasListeCiz();
  if (typeof ceteEkranCiz === "function") ceteEkranCiz(); // gerçek çete kartları (js/cete-ekran.js)
}
function demoArkadasListeCiz() {
  document.querySelectorAll('#arkadas-listesi .arkadas-kart').forEach((kart,i)=>{
    const a=ARKADASLAR[i],eylemler=[...kart.querySelectorAll('.alt-satir,.ikili-dugme')];
    const satir=dugmeEl('',null,'arkadas-satir'),kedi=ceteEl('span','arkadas-kedi'),bilgi=ceteEl('span','arkadas-bilgi');
    kedi.setAttribute('aria-hidden','true');bilgi.append(ceteEl('b',null,a[0]+' · örnek'),ceteEl('small',null,a[4]));
    satir.append(kedi,bilgi,ceteEl('span',null,'›'));kart.className='demo-arkadas';kart.replaceChildren(satir);
    arkadasKediCiz(kedi,{hal:'fit',renk:a[1]});
    satir.onclick=()=>{
      const menu=ceteEl('div','arkadas-menu');menu.append(...eylemler);
      menu.addEventListener('click',e=>{if(e.target.closest('button'))document.getElementById('perde').classList.remove('aktif');},true);
      cetePencere('🐾',a[0]+' · örnek arkadaş',[menu],[['Kapat',null,true]]);
    };
  });
}
// Miyavlama: arkadaşa "hadi çalış" dürtmesi. Spam olmasın diye her arkadaşa günde bir kez.
let tbZaman;
function miyavla(i, b) {
  const a = ARKADASLAR[i], bugun = bugunNo(); d.miyav = d.miyav || {};
  if (d.miyav[a[0]] === bugun) { bildir(`Bugün ${a[0]}'e zaten miyavladın, yarın yine 🐾`); return; }
  d.miyav[a[0]] = bugun; d.tepki++; kaydet(); rozetKontrol(); konfeti(b, 6);
  Ses.miyav();
  const tb = document.getElementById("telefon-bildirim");
  tb.innerHTML = `<span class="b-ikon">🐱</span><div><b>${Sohbet.kacis(d.kediAd)} sana miyavladı!</b><small>İngilizce Kedi · şimdi</small><p>Hadi, bugünkü kelimelerin seni bekliyor 🐾</p></div><span class="kimde">Demo: gerçek sürümde ${Sohbet.kacis(a[0])}'in telefonunda böyle görünür</span>`;
  tb.classList.add("acik"); clearTimeout(tbZaman); tbZaman = setTimeout(() => tb.classList.remove("acik"), 3200);
  arkadasCiz();
}
document.getElementById("ekle-dugme").onclick = () => {
  // Hesap varken gerçek çete: çetedeysen davet, değilsen kur/katıl. Arkadaşlar = çete üyeleri (ayrı arkadaş sistemi yok).
  if (Bulut.hazirMi() && Bulut.kullanici) {
    if (sosyalBolum === 'arkadas') { arkadasEkleAc(); return; }
    if (CeteEkran.cete) davetPenceresi(CeteEkran.cete);
    else if (sosyalBolum === "cete") kurPenceresi(); else katilPenceresi("");
    return;
  }
  ekleDemo();
};
const ekleDemo = () => pencere("🐾", sosyalBolum === "cete" ? "Çeteye kat" : "Arkadaş ekle", sosyalBolum === "cete" ? "Bu sürümde gerçek çete daveti yok: çete ve üyeleri örnek. Gerçek çete; hesaplar, engelleme, bildirme ve denetim kurulunca gelecek." : "Bu sürümde gerçek arkadaş ekleme yok: listedeki arkadaşlar örnek. Gerçek arkadaşlık; hesaplar, engelleme, bildirme ve denetim kurulunca gelecek.", "Tamam");

// ================= SOSYAL: bölümler =================
let sosyalBolum = "arkadas";
function ceteSohbetAc() {
  if (CeteEkran.cete) gercekSohbetAc();
  else if (Bulut.kullanici) tamAc('menu-cete');
  else document.getElementById('sohbet-ac').click();
}
function sosyalSohbetGoster() {
  if (Bulut.kullanici && !CeteEkran.cete) return;
  const t=document.getElementById('tam-sohbet');
  t.classList.remove('tam');t.classList.add('sosyal-sohbet-gomulu');t.removeAttribute('role');t.removeAttribute('aria-modal');
  document.getElementById('sosyal-cete').append(t);
  document.getElementById('ekran-arkadaslar').classList.add('cete-sohbet-acik');
  ceteSohbetAc();
}
function sosyalSohbetKapat() {
  const t=document.getElementById('tam-sohbet');if(!t?.classList.contains('sosyal-sohbet-gomulu'))return;
  Oturumlar.kapat('sohbet');t.classList.remove('aktif','sosyal-sohbet-gomulu');t.classList.add('tam');
  document.getElementById('uygulama').append(t);document.getElementById('ekran-arkadaslar').classList.remove('cete-sohbet-acik');
}
document.querySelectorAll("[data-sosyal]").forEach(b => b.onclick = async () => {
  sosyalBolum = b.dataset.sosyal; Ses.pop(); arkadasCiz();
  if (Bulut.kullanici) await ceteYenile();
  if (b.dataset.sosyal === 'cete' && sosyalBolum === 'cete' && document.getElementById('ekran-arkadaslar').classList.contains('aktif')) ceteSohbetAc();
});

// ================= BİRLİKTE GÖREVLER (arkadaşla ikili) =================
// Seçilen arkadaşla ortak hedef. Senin ilerlemen gerçek, arkadaşınki örnek (gün geçtikçe ilerler).
const IKILI_SABLON = [
  { id: "gun3", ikon: "📅", ad: "3 gün boyunca ikiniz de çalışın", hedef: 3, odul: EKONOMI.odul.arkadas.gun, birim: "gün",
    sen: g => Object.keys(d.gunler).filter(x => +x >= g.bas).length },
  { id: "kelime20", ikon: "🌱", ad: "20 yeni kelimeyle tanışın", hedef: 20, odul: EKONOMI.odul.arkadas.kelime, birim: "kelime",
    sen: g => Math.max(0, Object.keys(d.kartlar).length - g.basKelime) },
  { id: "cumle5", ikon: "🧩", ad: "5 cümleyi doğru kurun", hedef: 5, odul: EKONOMI.odul.arkadas.cumle, birim: "cümle",
    sen: g => Math.max(0, d.cumleDogru - g.basCumle) },
];
function ikiliArkadasIlerleme(g, sablon) {
  // Örnek veri: arkadaş her gün hedefin yaklaşık üçte birini yapar (Mert daha yavaş)
  const gecen = bugunNo() - g.bas + 1, hiz = g.arkadas === "Mert" ? .25 : .4;
  return Math.min(sablon.hedef, Math.floor(sablon.hedef * hiz * gecen));
}
function ikiliCiz() {
  d.ikili = d.ikili || [];
  const el = document.getElementById("ikili-gorevler");
  if (!d.ikili.length) { el.innerHTML = `<div class="kart ikili-kart"><p class="soluk" style="font-size:14px;">Henüz birlikte görevin yok. Aşağıdan bir arkadaşının kartında "🤝 Birlikte görev"e dokun.</p></div>`; return; }
  el.innerHTML = d.ikili.map((g, i) => {
    const sb = IKILI_SABLON.find(x => x.id === g.sablon), sen = Math.min(sb.hedef, sb.sen(g)), o = ikiliArkadasIlerleme(g, sb);
    const bitti = sen >= sb.hedef && o >= sb.hedef;
    return `<div class="kart ikili-kart"><div class="g-ust"><span style="font-size:28px">${sb.ikon}</span><div><b>${Sohbet.kacis(g.arkadas)} ile: ${sb.ad}</b><small>Ödül: ikinize de ${sb.odul} 🪙</small></div></div>
      <div class="ikili-satir"><span>Sen</span><div class="cete-cubuk"><i style="width:${sen / sb.hedef * 100}%"></i></div>${sen}/${sb.hedef}</div>
      <div class="ikili-satir"><span>${Sohbet.kacis(g.arkadas)}</span><div class="cete-cubuk"><i style="width:${o / sb.hedef * 100}%"></i></div>${o}/${sb.hedef}</div>
      ${bitti ? `<button class="ikili-dugme" data-ikili-al="${i}">🎉 Ödülü al (+${sb.odul} 🪙)</button>` : ""}</div>`;
  }).join("");
  document.querySelectorAll("[data-ikili-al]").forEach(b => b.onclick = () => {
    b.onclick = null; // çift dokunma başka görevin ödülünü almasın
    const g = d.ikili[+b.dataset.ikiliAl], sb = g && IKILI_SABLON.find(x => x.id === g.sablon); if (!sb) return;
    Ekonomi.kazan(d, `ikili:${g.sablon}:${g.arkadas}:${g.bas}`, sb.odul, bugunNo()); d.ikiliBiten = (d.ikiliBiten || 0) + 1; d.ikili.splice(+b.dataset.ikiliAl, 1);
    kaydet(); Ses.zafer(); konfeti(b, 12); bildir(`🤝 ${g.arkadas} ile görev bitti! +${sb.odul} 🪙`); rozetKontrol(); herSeyiCiz();
  });
}
function ikiliBaslat(i) {
  const a = ARKADASLAR[i];
  if ((d.ikili || []).some(g => g.arkadas === a[0])) { bildir(`${a[0]} ile zaten bir görevin var`); return; }
  const p = document.getElementById("pencere");
  p.innerHTML = `<div class="p-ikon">🤝</div><h3>${Sohbet.kacis(a[0])} ile ne yapalım?</h3><p>Görevi seç. ${Sohbet.kacis(a[0])} örnek bir arkadaş: davet gerçekten gitmez, görev hemen başlar. Senin ilerlemen gerçek, onunki örnek.</p>
    <div class="sablon-sec">${IKILI_SABLON.map(sb => `<button data-sablon="${sb.id}"><span style="font-size:24px">${sb.ikon}</span><span>${sb.ad}<br><small class="soluk">İkinize de ${sb.odul} 🪙</small></span></button>`).join("")}</div>
    <button class="buyuk-dugme" id="p-dugme" style="margin-top:12px;background:var(--krem);color:var(--murekkep);box-shadow:none;">Vazgeç</button>`;
  document.getElementById("perde").classList.add("aktif");
  document.getElementById("p-dugme").onclick = () => document.getElementById("perde").classList.remove("aktif");
  p.querySelectorAll("[data-sablon]").forEach(b => b.onclick = () => {
    d.ikili = d.ikili || [];
    d.ikili.push({ arkadas: a[0], sablon: b.dataset.sablon, bas: bugunNo(), basKelime: Object.keys(d.kartlar).length, basCumle: d.cumleDogru });
    kaydet(); Ses.pop(); document.getElementById("perde").classList.remove("aktif");
    bildir(`🤝 ${a[0]} (örnek) ile görev başladı`); herSeyiCiz();
  });
}

