// ================= AYARLAR =================
// Ayarlar d.ayar içinde kalıcı (kayit.js izinli değerleri denetler). Yedek ve kaynaklar Ödüller'den buraya taşındı.
const UYGULAMA_SURUM = "0.5.0";
const AYAR_SATIRLARI = [
  { baslik: "Günlük hedef", aciklama: "Günde kaç soru cevaplayınca hediye açılsın (yanlış cevaplar da çalışma sayılır).", tur: "secim", alan: "hedef",
    secenek: [[5, "5"], [10, "10"], [15, "15"], [20, "20"]] },
  { baslik: "Ses efektleri", aciklama: "Doğru, yanlış ve ödül sesleri.", tur: "anahtar", oku: () => !d.sesKapali, yaz: v => { d.sesKapali = !v; sesDugmeleriCiz(); } },
  { baslik: "Otomatik seslendirme", aciklama: "Kelimeler kendiliğinden okunsun. 🔊 düğmesi her zaman okur.", tur: "anahtar", alan: "seslendirme" },
  { baslik: "Titreşim", aciklama: "Dokunuşta, doğru ve yanlış cevapta kısa titreşim. Ses ayarından bağımsız.", tur: "anahtar", alan: "titresim" },
  { baslik: "Tema", aciklama: "Uygulamanın renkleri. Kedinin arka planı Kedi sekmesinden ayrı seçilir.", tur: "secim", alan: "tema",
    secenek: [["sistem", "Sistem"], ["pastel", "Pastel"], ["koyu", "Koyu"], ["kontrast", "Yüksek kontrast"]] },
  { baslik: "Hareket", aciklama: "Animasyonları azaltır; bütün işlevler yine çalışır.", tur: "secim", alan: "hareket",
    secenek: [["sistem", "Sistem"], ["azalt", "Azalt"], ["normal", "Normal"]] },
];

function ayarlarCiz() {
  const liste = document.getElementById("ayar-liste");
  const bolum = (baslik, icerik) => { const b = document.createElement("div"); b.className = "kart ayar-bolum"; const h = document.createElement("h3"); h.textContent = baslik; b.append(h, ...icerik); return b; };
  const metin = (cls, t) => { const p = document.createElement("p"); p.className = cls; p.textContent = t; return p; };
  const dugme = (t, fn, cls = "al") => { const b = document.createElement("button"); b.className = cls; b.textContent = t; b.onclick = fn; return b; };
  const satirlar = AYAR_SATIRLARI.map(s => {
    const kap = document.createElement("div"); kap.className = "ayar-satir";
    const yazi = document.createElement("div"); yazi.append(metin("ayar-ad", s.baslik), metin("soluk ayar-acik", s.aciklama));
    kap.append(yazi);
    if (s.tur === "anahtar") {
      const acik = s.oku ? s.oku() : !!d.ayar[s.alan];
      const b = document.createElement("button"); b.className = "anahtar"; b.setAttribute("role", "switch"); b.setAttribute("aria-checked", String(acik));
      b.setAttribute("aria-label", s.baslik); b.textContent = acik ? "Açık" : "Kapalı";
      b.onclick = () => { const yeni = !acik; s.yaz ? s.yaz(yeni) : (d.ayar[s.alan] = yeni); kaydet(); Ses.pop(); ayarlarCiz(); };
      kap.append(b);
    } else {
      const grup = document.createElement("div"); grup.className = "ayar-secim"; grup.setAttribute("role", "radiogroup"); grup.setAttribute("aria-label", s.baslik);
      for (const [deger, ad] of s.secenek) {
        const b = document.createElement("button"); b.textContent = ad; b.setAttribute("role", "radio");
        const secili = d.ayar[s.alan] === deger; b.setAttribute("aria-checked", String(secili)); if (secili) b.className = "secili";
        b.onclick = () => { d.ayar[s.alan] = deger; kaydet(); gorunumUygula(); Ses.pop(); ayarlarCiz(); herSeyiCiz(); };
        grup.append(b);
      }
      kap.append(grup);
    }
    return kap;
  });
  liste.replaceChildren(
    bolum("👤 Hesap ve eşitleme", [metin("soluk", "Hesap henüz yok: ilerlemen yalnız bu cihazda saklanıyor. Başka cihaza geçerken aşağıdaki yedeği kullan. Hesapla bulut yedeği sonraki aşamada gelecek.")]),
    bolum("🎯 Çalışma ve ses", satirlar.slice(0, 4)),
    bolum("🎨 Görünüm", satirlar.slice(4)),
    bolum("🔔 Bildirimler", [metin("soluk", "Hatırlatma bildirimleri henüz yok. Eklendiğinde buradan açılıp kapatılacak.")]),
    bolum("💾 İlerleme yedeği", [metin("soluk", "Yedek kodu ilerlemenin tamamını taşır; başkasıyla paylaşma."), dugme("Yedek al / geri yükle", () => { yedekPanelCiz(); altPanelAc("panel-yedek"); })]),
    bolum("📚 Kaynaklar ve lisanslar", [dugme("Kaynakları göster", () => altPanelAc("panel-kaynak"))]),
    bolum("ℹ️ Uygulama", [metin("soluk", `Pati İngilizce · sürüm ${UYGULAMA_SURUM} · kayıt biçimi ${SEMA_SURUM}`)]),
  );
}
document.getElementById("ayarlar-ac").onclick = () => { ayarlarCiz(); tamAc("ayarlar"); };

// ---------- Yedek: tarayıcı prompt/confirm yerine uygulama içi pencere, yüklemeden önce önizleme ----------
const yedekKodu = () => "PATI1:" + btoa(unescape(encodeURIComponent(JSON.stringify({ ...d, yedekZamani: Date.now() }))));
let yedekAday = null;
function yedekPanelCiz() {
  yedekAday = null;
  document.getElementById("yedek-cikis").value = yedekKodu();
  document.getElementById("yedek-giris").value = "";
  document.getElementById("yedek-onizleme").replaceChildren();
  document.getElementById("yedek-yukle-onay").hidden = true;
}
function yedekCoz(kod) {
  kod = (kod || "").trim();
  if (!kod) return { hata: "Önce yedek kodunu yapıştır." };
  if (kod.length > YEDEK_EN_FAZLA) return { hata: "Kod çok uzun; bir Pati yedeği gibi görünmüyor." };
  let veri;
  try { veri = JSON.parse(decodeURIComponent(escape(atob(kod.replace(/^PATI1:/, ""))))); }
  catch (e) { return { hata: "Kod okunamadı. Kodun tamamını kopyaladığından emin ol (PATI1: ile başlamalı)." }; }
  const s = Kayit.dogrula(veri);
  return s.tamam ? { veri } : { hata: s.hata };
}
document.getElementById("yedek-kopyala").onclick = async () => {
  const kod = document.getElementById("yedek-cikis").value;
  try { await navigator.clipboard.writeText(kod); bildir("💾 Yedek kodu kopyalandı"); }
  catch (e) { const t = document.getElementById("yedek-cikis"); t.focus(); t.select(); bildir("Kod seçildi; uzun basıp kopyala."); }
};
document.getElementById("yedek-indir").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([document.getElementById("yedek-cikis").value], { type: "text/plain" }));
  a.download = `pati-yedek-${new Date().toISOString().slice(0, 10)}.txt`; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
document.getElementById("yedek-dosya").onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  if (f.size > YEDEK_EN_FAZLA) return bildir("Dosya çok büyük.");
  document.getElementById("yedek-giris").value = await f.text(); e.target.value = "";
  document.getElementById("yedek-kontrol").click();
};
document.getElementById("yedek-kontrol").onclick = () => {
  const on = document.getElementById("yedek-onizleme"), onay = document.getElementById("yedek-yukle-onay");
  const r = yedekCoz(document.getElementById("yedek-giris").value);
  yedekAday = r.veri || null; onay.hidden = !yedekAday;
  const satir = t => { const p = document.createElement("p"); p.textContent = t; return p; };
  if (!yedekAday) { on.replaceChildren(satir("😿 " + r.hata + " Mevcut ilerlemen değişmedi.")); on.className = "yedek-onizleme hata"; return; }
  const v = yedekAday, tarih = v.yedekZamani ? new Date(v.yedekZamani).toLocaleString("tr-TR") : "bilinmiyor (eski biçim)";
  on.className = "yedek-onizleme";
  on.replaceChildren(satir(`Yedek tarihi: ${tarih}`), satir(`Kelime: ${Object.keys(v.kartlar).length} · Altın: ${Math.floor(v.yildiz)} · Eşya: ${(v.esyalar || []).length}`),
    satir(`Kayıt biçimi: ${v.surum || 2}`), satir("Yüklersen bu cihazdaki ilerlemenin yerine geçer; şimdiki hali ayrıca saklanır."));
};
document.getElementById("yedek-yukle-onay").onclick = () => {
  if (!yedekAday) return;
  // Mevcut ilerleme silinmeden önce bir kopya saklanır; yeni kayıt açılmazsa ona dönülür.
  try { localStorage.setItem(ONCEKI, JSON.stringify(d)); } catch (e) {}
  const veri = yedekAday; delete veri.yedekZamani;
  d = tamamla(veri); d.rev = Math.max(veri.rev || 0, kayitliRev());
  if (!kaydet()) return;
  location.reload();
};
document.querySelectorAll("[data-panel-kapat]").forEach(b => b.onclick = () => altPanelKapat(b.closest(".alt-panel")));
