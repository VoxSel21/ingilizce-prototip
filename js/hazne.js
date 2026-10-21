// ================= KELİME HAZNESİ =================
// Tanışılan her kelime burada: önce seviye (A1, A2, B1, B2), seviyenin içinde İngilizce alfabetik.
// Noktalar kelimenin kutusunu gösterir; 4 nokta = öğrenildi.
function hazneCiz() {
  const tanisilan = KELIMELER.filter(k => d.kartlar[k[0]]);
  document.getElementById("hazne-ozet").textContent = tanisilan.length
    ? `${tanisilan.length} kelimeyle tanıştın · ${durumdaSay(tanisilan, "calisiliyor")} çalışılıyor · ${durumdaSay(tanisilan, "ogrenildi")} öğrenildi`
    : "";
  if (!tanisilan.length && !PHRASAL.some(k => d.kartlar[k[0]])) {
    document.getElementById("hazne-liste").innerHTML = `<p class="hazne-bos">🐾 Haznen boş.<br>Kelime kartlarında tanıştığın kelimeler burada birikecek.</p>`;
    return;
  }
  let h = "";
  const pvTanis = PHRASAL.filter(k => d.kartlar[k[0]]);
  for (const [sev, sevAd] of SEVIYELER.concat([["PV", "Phrasal verbs"]])) {
    const liste = (sev === "PV" ? pvTanis : tanisilan.filter(k => k[5] === sev)).sort((a, b) => a[0].localeCompare(b[0], "en"));
    if (!liste.length) continue;
    const toplam = sev === "PV" ? PHRASAL.length : KELIMELER.filter(k => k[5] === sev).length;
    h += `<div class="hazne-seviye"><span>${sev === "PV" ? "🔗" : sev}</span>${sevAd}<small>${liste.length}/${toplam}</small></div>`;
    h += liste.map(k => {
      const kutu = Math.min(d.kartlar[k[0]].kutu, 4);
      return `<div class="hazne-satir"><span class="h-emoji">${k[2]}</span><div class="h-yazi"><b>${k[0]}</b><i>${k[7]}</i><small>${k[1]}</small></div>
        <span class="h-kutu" title="${DURUM[durumu(d.kartlar[k[0]])]} · ${kutu}. kutu">${"●".repeat(kutu)}${"○".repeat(4 - kutu)}</span>
        <button class="h-ses" data-oku="${k[0]}" aria-label="${k[0]} sesli oku">🔊</button></div>`;
    }).join("");
  }
  document.getElementById("hazne-liste").innerHTML = h;
  document.querySelectorAll("[data-oku]").forEach(b => b.onclick = () => seslendir(b.dataset.oku));
}
function hazneAc() { hazneCiz(); tamAc("hazne"); document.getElementById("tam-hazne").scrollTop = 0; }
document.getElementById("hazne-dugme").onclick = hazneAc;
document.getElementById("i-ogrenilen").closest(".kart").onclick = hazneAc;
document.getElementById("i-ogrenilen").closest(".kart").style.cursor = "pointer";

