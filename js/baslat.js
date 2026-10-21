function herSeyiCiz() { sahneCiz(); anaCiz(); takvimCiz(); odulCiz(); arkadasCiz(); avDugmeCiz(); kediCiz(); sesDugmeleriCiz(); }

yukle(); kaydet(); herSeyiCiz();
// Gece açık kalan uygulamaya dönülünce yeni günü başlat ve ekranı tazele.
document.addEventListener("visibilitychange", () => { if (!document.hidden && gunuYenile()) herSeyiCiz(); });
window.addEventListener("storage", e => {
  if (e.key !== ANAHTAR || !e.newValue) return;
  const v = okunanDurum(ANAHTAR);
  if (v && (v.rev || 0) > (d.rev || 0)) { d = v; herSeyiCiz(); }
});
setInterval(sahneCiz, 10 * 60000);
// Ana ekrana ekleme ve çevrimdışı açılış (sw.js: internet varken hep en yeni sürüm)
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
