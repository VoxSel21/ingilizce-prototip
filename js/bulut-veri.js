// Firestore adaptörü; birleştirme kuralları kurulumda verilir.
const BulutVeri = { olustur(_Es) {
const BulutCekirdek = {
  ana: (db, uid) => db.collection("kullanicilar").doc(uid),
  hesapOku(veri) { let v = null; try { v = veri && JSON.parse(veri.durum); } catch (e) {} const h=_Es.hesapDuzelt(v);
    const renk=h.alan.kurkRenk?.deger;
    if(veri&&veri.surum<6&&typeof renk==='string'&&/^#[0-9a-f]{6}$/i.test(renk)&&!h.listeler.kurklar.includes(renk.toUpperCase()))h.listeler.kurklar.push(renk.toUpperCase());
    return h;
  },
  async oku(db, uid) { const s = await BulutCekirdek.ana(db, uid).get(); return BulutCekirdek.hesapOku(s.exists ? s.data() : null); },
  // olaylar: bu hesaba ait gönderilecek olaylar. tasima: { anlik, tabanAltin } (yalnız ilk girişte).
  async esitle(db, zamanDamgasi, uid, olaylar, tasima = null) {
    return db.runTransaction(async tx => {
      const ana = BulutCekirdek.ana(db, uid);
      const isaret = id => ana.collection("olaylar").doc(String(id).replace(/\//g, "_"));
      const snap = await tx.get(ana);
      const var_ = await Promise.all(olaylar.map(o => tx.get(isaret(o.id))));
      const h = BulutCekirdek.hesapOku(snap.exists ? snap.data() : null);
      olaylar.forEach((o, i) => { if (var_[i].exists) h.uygulanan[o.id] = 1; });
      const tasimaSonuc = tasima ? _Es.misafirTasi(h, tasima.anlik, tasima.tabanAltin, tasima.tabanIlerleme) : null;
      const onay = _Es.uygula(h, olaylar, uid);
      const yeni = olaylar.filter((o, i) => !var_[i].exists && onay.includes(o.id));
      const yazilan = new Set();
      for (const o of yeni) if (!yazilan.has(o.id)) { yazilan.add(o.id); tx.set(isaret(o.id), { tur: String(o.tur), zaman: Number(o.zaman) || 0 }); }
      if (yeni.length || (tasimaSonuc && tasimaSonuc.tasindi))
        tx.set(ana, { durum: JSON.stringify(_Es.sunucuHali(h)), surum: 7, guncelleme: zamanDamgasi() });
      return { onay, h, tasima: tasimaSonuc };
    });
  },
};


return BulutCekirdek;
} };
if (typeof module === "object" && module.exports) module.exports = { BulutVeri };
