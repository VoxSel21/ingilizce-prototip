// ================= SES =================
// Bütün sesler tarayıcıda o an üretilir (ses dosyası yok, telif derdi yok). Ses kapalıyken efektler ve
// otomatik okumalar susar; kullanıcının kendisi bastığı 🔊 düğmeleri yine okur.
const Ses = (() => {
  let ctx = null;
  function hazir() {
    if (d && d.sesKapali) return null;
    try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); return ctx; } catch (e) { return null; }
  }
  function nota(c, frekans, bas, sure, { tur = "sine", guc = .15, son = null, suzgec = null } = {}) {
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + bas;
    o.type = tur; o.frequency.setValueAtTime(frekans, t);
    if (son) o.frequency.exponentialRampToValueAtTime(son, t + sure);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(guc, t + .012); g.gain.exponentialRampToValueAtTime(.001, t + sure);
    o.connect(g);
    if (suzgec) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = suzgec; g.connect(f).connect(c.destination); }
    else g.connect(c.destination);
    o.start(t); o.stop(t + sure + .05);
  }
  const cal = fn => { const c = hazir(); if (c) try { fn(c); } catch (e) {} };
  return {
    dogru: () => cal(c => { [1047, 1319, 1568].forEach((f, i) => nota(c, f, i * .07, .2, { tur: "square", guc: .045 })); nota(c, 1568, .14, .4, { guc: .08 }); }),
    yanlis: () => cal(c => nota(c, 190, 0, .32, { tur: "sawtooth", guc: .12, son: 105, suzgec: 650 })),
    altin: () => cal(c => { nota(c, 988, 0, .09, { tur: "square", guc: .05 }); nota(c, 1319, .08, .4, { tur: "square", guc: .05 }); }),
    zafer: () => cal(c => {
      [523, 659, 784].forEach((f, i) => nota(c, f, i * .1, .16, { tur: "square", guc: .05 }));
      [523, 659, 784, 1047].forEach(f => nota(c, f, .32, .7, { tur: "triangle", guc: .07 }));
    }),
    geri: () => cal(c => nota(c, 700, 0, .35, { tur: "square", guc: .05, son: 200 })),
    pop: () => cal(c => nota(c, 520, 0, .08, { guc: .1, son: 900 })),
    // Miyav: perde önce yükselir sonra düşer (pitch bend); süzgeç açılıp kapanınca "mi-yav" gibi duyulur
    miyav: () => cal(c => {
      const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(), t = c.currentTime, k = .85 + Math.random() * .35;
      o.type = "sawtooth"; f.type = "lowpass"; f.Q.value = 6;
      o.frequency.setValueAtTime(480 * k, t); o.frequency.linearRampToValueAtTime(820 * k, t + .14); o.frequency.exponentialRampToValueAtTime(400 * k, t + .55);
      f.frequency.setValueAtTime(700, t); f.frequency.linearRampToValueAtTime(2600, t + .16); f.frequency.exponentialRampToValueAtTime(600, t + .55);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.13, t + .05); g.gain.setValueAtTime(.13, t + .35); g.gain.exponentialRampToValueAtTime(.001, t + .6);
      o.connect(f).connect(g).connect(c.destination); o.start(t); o.stop(t + .65);
    }),
  };
})();
function sonucSesi(dogru) { dogru ? Ses.dogru() : Ses.yanlis(); }
function seslendir(metin, otomatik = false) {
  if (otomatik && d.sesKapali) return;
  try { const u = new SpeechSynthesisUtterance(metin); u.lang = "en-US"; u.rate = .9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
}
function sesDugmeleriCiz() { document.querySelectorAll(".ses-dugme").forEach(b => b.textContent = d.sesKapali ? "🔇" : "🔊"); }
document.querySelectorAll(".ses-dugme").forEach(b => b.onclick = () => {
  d.sesKapali = !d.sesKapali; kaydet(); sesDugmeleriCiz();
  if (d.sesKapali) speechSynthesis && speechSynthesis.cancel(); else Ses.pop();
  bildir(d.sesKapali ? "🔇 Sesler kapandı" : "🔊 Sesler açıldı");
});

