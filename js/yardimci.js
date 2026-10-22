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

// Arama için sadeleştirme: Türkçe büyük/küçük harf (İ/ı), Türkçe ve aksanlı harfler, emoji ve noktalama
// fark etmesin. "Doğa", "DOGA", "doga" ve "🌳 Doğa" aynı sonuca iner.
const TR_SADE = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
const aramaNormal = s => String(s).toLocaleLowerCase("tr").replace(/[çğıöşü]/g, c => TR_SADE[c])
  .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

// Hızlı yinelenen olayları seyreltir (titreşim yağmuru olmasın): en az "ms" aralıkla true döner.
function sinirleyici(ms) {
  let son = -Infinity;
  return (simdi = Date.now()) => { if (simdi - son < ms) return false; son = simdi; return true; };
}

// WCAG kontrast oranı (#RRGGBB). Tema renklerinin testinde kullanılır.
function kontrast(a, b) {
  const L = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + .05) / (y + .05);
}

if (typeof module === "object" && module.exports) module.exports = { karistir, anlamlar, anlamCakisir, aramaNormal, sinirleyici, kontrast };
