// ================= ORTAK YARDIMCILAR =================
// Saf mantık (Node testleri de yükler).

// Eşit olasılıklı karıştırma (Fisher–Yates). Eski `sort(() => Math.random() - .5)` bazı sıraları
// diğerlerinden sık üretiyordu. rastgele: test için sabit sayı üreteci verilebilir.
function karistir(a, rastgele = Math.random) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rastgele() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
// İki kelimenin Türkçe anlamlarından biri ortaksa (child/kid = çocuk) biri diğerine yanlış şık olamaz.
const anlamlar = k => k[1].toLocaleLowerCase("tr").split(/[;,]/).map(s => s.replace(/\(.*?\)/g, "").trim()).filter(Boolean);
const anlamCakisir = (a, b) => { const x = anlamlar(b); return anlamlar(a).some(s => x.includes(s)); };

if (typeof module === "object" && module.exports) module.exports = { karistir, anlamlar, anlamCakisir };
