// Menülerin kısa özeti ana ekranda; mevcut canlı DOM ve düğmeler ayrıntı panellerinde kalır.
const MenuPaneller = (() => {
  const bul = id => document.getElementById(id);
  function dugme(yazi, panel, sinif = 'menu-link') {
    const b = document.createElement('button'); b.className = sinif; b.textContent = yazi;
    b.onclick = () => { Ses.pop(); tamAc('menu-' + panel); }; return b;
  }
  function panel(ad, baslik, ogeler) {
    const t = document.createElement('section'); t.className = 'tam menu-panel'; t.id = 'tam-menu-' + ad;
    const ust = document.createElement('div'); ust.className = 'ust';
    const kapat = document.createElement('button'); kapat.className = 'kapat'; kapat.textContent = '✕'; kapat.setAttribute('aria-label', 'Paneli kapat'); kapat.onclick = tamKapat;
    const title = document.createElement('h2'); title.textContent = baslik;
    ust.append(kapat, title); const body = document.createElement('div'); body.className = 'menu-panel-ic';
    for (const el of ogeler) if (el) body.append(el);
    t.append(ust, body); bul('uygulama').append(t); return body;
  }
  function karo(ikon, ad, aciklama, panelAdi) {
    const b = dugme('', panelAdi, 'menu-karo'), i = document.createElement('span'), y = document.createElement('div'), bas = document.createElement('b'), alt = document.createElement('small');
    i.textContent = ikon; bas.textContent = ad; alt.textContent = aciklama; y.append(bas, alt); b.append(i, y); return b;
  }

  const ana = bul('ekran-ana'), gorevler = ana.querySelector('.gorevler'), kutu = bul('kutular').parentElement;
  panel('bildirimler', 'Bildirilen mesajlar', []);
  panel('arkadas-gecmis', 'Birlikte görev geçmişi', []);
  const alBaslik = gorevler.previousElementSibling, kutBaslik = kutu.previousElementSibling;
  panel('alistirmalar', 'Alıştırmalar', [gorevler]); alBaslik.remove();
  const kutuPanel = panel('kutular', 'Kelime kutuların', [kutu, bul('zor-dugme'), bul('hazne-dugme')]); kutBaslik.remove();
  // Eski prototip açıklaması ve içerikleri kaybolmaz; ana menüyü doldurmaz.
  const anaNot = ana.querySelector('.prototip-not'); if (anaNot) kutuPanel.append(anaNot);
  const filtre = document.createElement('div'); filtre.className = 'menu-konu';
  const search = ana.querySelector('.konu-ara'); search.before(filtre); filtre.append(search, bul('konu-sec'), bul('konu-yok'));
  // B görünümü (2026-11-18): ana ekranda kenarsız beyaz liste; satıra dokununca panel açılır.
  const satir = (ad, sag, panelAdi) => { const b = dugme('', panelAdi, 'ana-liste-satir'), bas = document.createElement('b'); bas.textContent = ad; b.append(bas, sag); return b; };
  const n = document.createElement('small'); n.id = 'calisilan-sayi'; n.textContent = '0';
  const turSayi = document.createElement('small'); turSayi.textContent = gorevler.children.length + ' tür ›';
  const liste = document.createElement('div'); liste.className = 'ana-liste';
  liste.append(satir('Alıştırmalar', turSayi, 'alistirmalar'), satir('Kelime kutuların', n, 'kutular'), bul('calisma-turu-sec'));
  ana.querySelector('.ana-alt').append(liste);

  const takvim = bul('ekran-takvim'), istat = takvim.querySelector('.istat');
  istat.previousElementSibling.remove(); const koruyucuNot = istat.nextElementSibling;
  panel('istatistik', 'Senin istatistiklerin', [istat, koruyucuNot]);
  takvim.append(dugme('📊 Senin istatistiklerin ›', 'istatistik'));
  const satis = document.createElement('div'); satis.id = 'koruyucu-satis'; takvim.append(satis);
  koruyucuNot.querySelector('p').textContent = 'Bir gün çalışamazsan elindeki koruyucu otomatik kullanılır ve serin bozulmaz. Takvim menüsünden satın alabilirsin.';

  const oduller = bul('ekran-oduller'), rozetler = bul('rozetler');
  const odulUst = oduller.querySelector('.ust'); oduller.replaceChildren(odulUst);
  // Özet (B görünümü, 2026-11-18): sarı şeritte Pati'nin küçük çemberi (arka planı sahneCiz koyar) + açılan başarım sayısı; odulCiz doldurur.
  const odulOzet = document.createElement('div'); odulOzet.className = 'odul-ozet';
  odulOzet.innerHTML = '<div class="odul-pencere" aria-hidden="true"><div class="odul-kedi" id="odul-kedi"></div></div><div class="odul-ozet-metin"><small>Açılan başarım</small><b><span id="odul-acilan">0</span> / <span id="odul-toplam">0</span></b><div class="odul-cubuk"><i id="odul-cubuk"></i></div><small id="odul-kazanc"></small></div>';
  oduller.append(odulOzet);
  const odulBaslik = document.createElement('h2'); odulBaslik.id = 'basarim-baslik'; odulBaslik.textContent = 'Başarımlar';
  rozetler.tabIndex = 0; rozetler.setAttribute('role', 'region'); rozetler.setAttribute('aria-labelledby', odulBaslik.id);
  oduller.append(odulBaslik, rozetler);
  const tasindi = document.createElement('p'); tasindi.className = 'menu-small'; tasindi.textContent = 'Seri koruyucu artık Takvim menüsünde.'; oduller.append(tasindi);

  const ark = bul('sosyal-arkadas'), cete = bul('sosyal-cete'), sohbet = bul('sosyal-sohbet');
  for (const el of [ark, cete, sohbet]) el.classList.add('menu-sosyal');
  panel('arkadas-gorev', 'Birlikte görevler', [bul('ikili-gorevler')]);
  panel('arkadaslar', 'Arkadaşların bugün', [bul('cete-gercek-arkadas'), bul('gelen-miyav'), bul('arkadas-listesi')]);
  panel('lig', 'Bu haftanın ligi', [bul('lig')]);
  const arkLinks = document.createElement('div'); arkLinks.className='menu-links';
  arkLinks.append(dugme('Haftanın ligi', 'lig'),dugme('Birlikte görevler', 'arkadas-gorev'));
  ark.replaceChildren(bul('cete-gercek-arkadas'),bul('gelen-miyav'),bul('arkadas-listesi'),arkLinks);
  const ceteBas = cete.querySelector('.cete-bas'); ceteBas.id = 'cete-demo-bas';
  panel('cete', 'Çeten ve üyeler', [bul('cete-gercek-yonet'), ceteBas]);
  panel('savas', 'Çete savaşı', [bul('savas-kart')]);
  const ceteGorev = bul('cete-gorevler'), aciklama = ceteGorev.previousElementSibling;
  panel('cete-gorev', 'Haftalık ortak görevler', [aciklama, ceteGorev]);
  const sohbetAraclar = document.createElement('div'); sohbetAraclar.className = 'menu-links sohbet-araclar';
  sohbetAraclar.append(dugme('Üyeler', 'cete'),dugme('Savaş', 'savas'), dugme('Görevler', 'cete-gorev'));
  bul('tam-sohbet').querySelector('.ust').after(sohbetAraclar);
  cete.replaceChildren();
  panel('sohbet', 'Çete sohbeti', [bul('cete-gercek-sohbet'), bul('sohbet-ac'), bul('sohbet-demo-not'), bul('sosyal-prototip-not')]);
  const chat = karo('💬', 'Çete sohbeti', 'Sohbeti aç', 'sohbet');
  chat.onclick = ceteSohbetAc; cete.append(chat,dugme('Çete ve üyeler','cete'),dugme('Çete savaşı','savas'),dugme('Haftalık görevler','cete-gorev')); sohbet.replaceChildren(karo('⚔️', 'Çete savaşı', 'Oyun modları ve katkıların', 'savas'));
  return { guncelle() { bul('calisilan-sayi').textContent = Ilerleme.calisilanSayisi(d) + ' kelime ›'; } };
})();
