const EKRAN_CIZ = { ana: anaCiz, takvim: takvimCiz, oduller: odulCiz, arkadaslar: arkadasCiz, kedi: kediCiz };
function herSeyiCiz() {
  sahneCiz(); sesDugmeleriCiz();
  for (const id of ['yildiz-hap', 'yildiz-hap2', 'yildiz-hap3']) document.getElementById(id).textContent = '🪙 ' + d.yildiz;
  const aktif = document.querySelector('.ekran.aktif'), ciz = aktif && EKRAN_CIZ[aktif.id.replace('ekran-', '')];
  if (ciz) ciz();
  if (aktif && aktif.id === 'ekran-ana') kediGuncelle(document.getElementById('ana-kedi'));
  MenuPaneller.guncelle(); PatiGorunum.ciz();
}
Bulut.hesapYenilendi = () => { kartOturumunuBirak(); tamKapat(); };

yukle(); kaydet(); gorunumUygula(); herSeyiCiz();
Geri.kur(); // Android geri tuşu ve tarayıcı geri düğmesi (js/cihaz.js), bir kez
// Gece açık kalan uygulamaya dönülünce yeni günü başlat ve ekranı tazele.
document.addEventListener("visibilitychange", () => { if (!document.hidden && gunuYenile()) herSeyiCiz(); });
window.addEventListener("storage", e => {
  if (e.key !== ANAHTAR + '-butun' || !e.newValue) return;
  const v = okunanDurum(ANAHTAR);
  // Olay tabanı da güncellenir: öbür sekmenin değişikliği bu sekmeden ikinci kez olay olarak yazılmasın.
  if (v && (v.rev || 0) > (d.rev || 0)) {
    const dersAcik = document.getElementById('tam-kartlar').classList.contains('aktif');
    d = v; olayTabani = JSON.parse(JSON.stringify(d)); bekleyenDefter = [];
    if (dersAcik) {
      const o = d.oturum && acikTur(d.oturum.deste);
      document.getElementById('k-gb').className='geri-bildirim';
      if (o) { kO=o; d.oturum=o; adimGoster(); }
      else { kartOturumunuBirak(); tamKapat(); }
      bildir('Diğer sekmedeki çalışma kaydı yüklendi.');
    }
    herSeyiCiz();
  }
});
Bulut.baslat(); // hesap ayarı yoksa hiçbir şey yüklemez (js/bulut.js)
// İlk açılış: seviye elle seçilmediği için yeni gelene seviye değerlendirmesi önerilir (Serhat, 2026-11-16).
// Biraz beklenir: hesaptan ilerleme gelirse ya da başka pencere açıksa öneri çıkmaz. Geçen A1'den başlar.
setTimeout(() => {
  if (!SeviyeSinavi.oneriGoster(d) || document.getElementById("perde").classList.contains("aktif") || document.querySelector(".tam.aktif")) return;
  onayPenceresi("Seviyeni bulalım mı?", "16 kısa soruyla sana uygun seviyeyi bulalım (yaklaşık 3 dakika). İstersen geç: A1'den başlarsın, seviyeni sonra Ayarlar'dan da ölçebilirsin.", "Seviyemi bul", "A1'den başla", seviyeSinavAc);
}, 1500);
setInterval(sahneCiz, 10 * 60000);
// Ana ekrana ekleme ve çevrimdışı açılış (sw.js: internet varken hep en yeni sürüm)
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
