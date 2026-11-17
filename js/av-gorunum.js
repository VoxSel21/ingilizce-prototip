// Kare döngüsünde DOM araması/ölçümü yapılmaz; hareket zaman çizgisi sayıyla sürülür.
const AvGorunum = {
  olustur({ pist, kedi, hedef, cubuk, sure, adim }, sureSiniri, resize = typeof ResizeObserver === 'function' ? ResizeObserver : null) {
    let yol = 0, saniye = -1, az = false, gozlem = null;
    const metinler = Array.from({ length: Math.ceil(sureSiniri) + 1 }, (_, i) => String(i));
    const hareket = typeof kedi.animate === 'function' ? kedi.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(1px)' }], { duration: 1000, fill: 'both' }) : null;
    cubuk.style.width = '100%'; cubuk.style.transformOrigin = 'left';
    const zaman = typeof cubuk.animate === 'function' ? cubuk.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1000, fill: 'both' }) : null;
    if (hareket) hareket.pause(); if (zaman) zaman.pause();
    const olc = () => {
      // %100, kedinin ön kenarının balığa ilk temas ettiği noktadır; sabit pist genişliği değildi.
      yol = Math.max(0, hedef.offsetLeft - kedi.offsetLeft - kedi.offsetWidth);
      if (hareket) hareket.effect.setKeyframes([{ transform: 'translateX(0px)' }, { transform: 'translateX(' + yol + 'px)' }]);
    };
    olc(); if (resize) { gozlem = new resize(olc); gozlem.observe(pist); }
    return {
      ciz(konum, kalan, toplamYol) {
        const oran = Math.min(1, Math.max(0, konum / toplamYol));
        if (hareket) hareket.currentTime = oran * 1000;
        else kedi.style.transform = 'translateX(' + oran * yol + 'px)'; // shortcut: eski tarayıcı yedeği; Zero-GC hedefi WAAPI yolundadır.
        if (zaman) zaman.currentTime = Math.max(0, kalan / sureSiniri) * 1000;
        else cubuk.style.transform = 'scaleX(' + Math.max(0, kalan / sureSiniri) + ')';
        const simdi = Math.max(0, Math.ceil(kalan));
        if (simdi !== saniye) { saniye = simdi; sure.textContent = metinler[simdi]; }
        if (az !== (kalan < 8)) { az = kalan < 8; cubuk.classList.toggle('az', az); }
      },
      sayac(dogru, hedef) { adim.textContent = `${dogru}/${hedef} doğru`; },
      kapat() { if (gozlem) gozlem.disconnect(); if (hareket) hareket.cancel(); if (zaman) zaman.cancel(); },
    };
  },
};
if (typeof module === 'object' && module.exports) module.exports = { AvGorunum };
