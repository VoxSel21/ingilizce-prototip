// Etkinleştirme: aynı servis için korumalı sunucu adresi gerekir. Anahtar istemciye konmaz.
const Telaffuz = {
  adres: document.querySelector('meta[name="pati-telaffuz"]')?.content || null, aktif: null, kotaBitti: null, mikrofonYok: false,
  hazir() { return !!(this.adres && navigator.onLine && Bulut.kullanici && navigator.mediaDevices?.getUserMedia && window.AudioContext && !this.mikrofonYok && this.kotaBitti !== Bulut.kullanici.uid+':'+new Date().toISOString().slice(0,10)); },
  kapat() { const s=this.aktif;this.aktif=null;if(!s)return;s.iptal=true;s.abort.abort();s.bitir?.();s.stream?.getTracks().forEach(t=>t.stop());s.ctx?.close().catch(()=>{}); },
  async degerlendir(kelime) {
    if(!this.hazir())throw Error('Çevrimiçi değerlendirme hazır değil. Puansız pratik yapabilirsin.');
    const kullanici=Bulut.kullanici,uid=kullanici.uid;
    this.kapat();const s={abort:new AbortController(),iptal:false};this.aktif=s;
    try{
      s.stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true},video:false});
      if(s.iptal)throw Error('Kayıt iptal edildi.');
      if(Bulut.kullanici?.uid!==uid)throw Error('Oturum değişti; değerlendirme iptal edildi.');
      s.ctx=new AudioContext();await s.ctx.resume();
      const kaynak=s.ctx.createMediaStreamSource(s.stream),islem=s.ctx.createScriptProcessor(4096,1,1),parcalar=[];
      let enerji=0,adet=0;
      islem.onaudioprocess=e=>{if(s.iptal)return;const p=new Float32Array(e.inputBuffer.getChannelData(0));parcalar.push(p);for(const n of p)enerji+=n*n;adet+=p.length;};
      const sessiz=s.ctx.createGain();sessiz.gain.value=0;kaynak.connect(islem);islem.connect(sessiz);sessiz.connect(s.ctx.destination);
      await new Promise(resolve=>{const t=setTimeout(resolve,4500);s.bitir=()=>{clearTimeout(t);resolve();};});
      kaynak.disconnect();islem.disconnect();islem.onaudioprocess=null;sessiz.disconnect();s.stream.getTracks().forEach(t=>t.stop());
      if(s.iptal)throw Error('Kayıt iptal edildi.');
      if(!adet||Math.sqrt(enerji/adet)<0.008)throw Error('Ses duyulamadı. Bu deneme yanlış sayılmadı.');
      const ham=new Float32Array(adet);let pos=0;for(const p of parcalar){ham.set(p,pos);pos+=p.length;}
      const oran=s.ctx.sampleRate/16000,n=Math.min(80000,Math.floor(adet/oran)),wav=new ArrayBuffer(44+n*2),v=new DataView(wav);
      const yazi=(i,t)=>{for(let j=0;j<t.length;j++)v.setUint8(i+j,t.charCodeAt(j));};
      yazi(0,'RIFF');v.setUint32(4,36+n*2,true);yazi(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,16000,true);v.setUint32(28,32000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);yazi(36,'data');v.setUint32(40,n*2,true);
      for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.max(-1,Math.min(1,ham[Math.floor(i*oran)]))*32767,true);
      let ikili='';for(const b of new Uint8Array(wav))ikili+=String.fromCharCode(b);
      if(s.iptal||Bulut.kullanici?.uid!==uid)throw Error('Oturum değişti; değerlendirme iptal edildi.');
      const token=await kullanici.getIdToken();
      if(s.iptal||Bulut.kullanici?.uid!==uid)throw Error('Oturum değişti; değerlendirme iptal edildi.');
      const sure=setTimeout(()=>s.abort.abort(),15000);let r;
      try{r=await fetch(this.adres,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({kelime,ses:btoa(ikili)}),signal:s.abort.signal});}finally{clearTimeout(sure);}
      const sonuc=await r.json();
      if(r.status===429&&sonuc.kota)this.kotaBitti=uid+':'+new Date().toISOString().slice(0,10);
      if(!r.ok)throw Error(sonuc.hata||'Değerlendirme alınamadı; bu deneme yanlış sayılmadı.');
      if(s.iptal||Bulut.kullanici?.uid!==uid)throw Error('Oturum değişti; sonuç kullanılmadı.');
      if(!Number.isFinite(sonuc.puan)||sonuc.puan<0||sonuc.puan>100)throw Error('Geçerli telaffuz puanı alınamadı.');
      return sonuc;
    }catch(e){
      if(['NotAllowedError','NotFoundError','NotReadableError'].includes(e.name))this.mikrofonYok=true;
      throw Error(e.name==='AbortError'?'Bağlantı zaman aşımı veya iptal. Yanlış sayılmadı.':this.mikrofonYok?'Mikrofon kullanılamıyor. Puansız pratik yapabilir veya izinleri kontrol edebilirsin.':e.message||'Mikrofon açılamadı.');
    }
    finally{if(this.aktif===s)this.kapat();else{s.stream?.getTracks().forEach(t=>t.stop());s.ctx?.close().catch(()=>{});}}
  },
};
Oturumlar.ekle('telaffuz',()=>Telaffuz.kapat(),undefined,undefined,'*');
