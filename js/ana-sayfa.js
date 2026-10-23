// ================= ARKA PLAN SAHNESİ =================
const TEMALAR = {
  cayir: { ad: "Çayır", ikon: "🌼", fiyat: 0, tepe: ["#9ED9A0", "#7CC98A"] },
  sahil: { ad: "Sahil", ikon: "🏖️", fiyat: 4, tepe: ["#F6DFA5", "#8CCFE8"] },
  kar:   { ad: "Karlı dağ", ikon: "🏔️", fiyat: 5, tepe: ["#FFFFFF", "#DCE8F5"] },
  sakura:{ ad: "Sakura", ikon: "🌸", fiyat: 6, tepe: ["#F7C6D3", "#E9A5BC"] },
  ev:    { ad: "Ev içi", ikon: "🛋️", fiyat: 18, tepe: ["#F3DCC2", "#E2C3A0"] },  // 3. aşama (orta basamak)
  gece:  { ad: "Yıldızlı gece", ikon: "🌙", fiyat: 25, koyu: true, tepe: ["#4C6B5A", "#2F4A3E"] },
};
function sahneCiz() {
  const s = document.getElementById("sahne"), saat = new Date().getHours();
  const vakit = saat >= 6 && saat < 17 ? "gunduz" : saat >= 17 && saat < 20 ? "aksam" : "gece";
  s.style.backgroundImage = `url(resim/bg_${d.tema}.jpg)`;
  s.dataset.vakit = vakit; // akşam ve gece için yumuşak renk perdesi (CSS)
  // Koyu resimli arka planda selam yazısı açık renge döner (css: data-koyu-sahne)
  if (TEMALAR[d.tema] && TEMALAR[d.tema].koyu) document.documentElement.dataset.koyuSahne = "1"; else delete document.documentElement.dataset.koyuSahne;
  const baslik = { gunduz: "Günaydın! ☀️", aksam: "İyi akşamlar! 🌇", gece: "İyi geceler! 🌙" }[vakit];
  document.getElementById("selam-baslik").textContent = saat < 12 && saat >= 6 ? baslik : vakit === "gunduz" ? "Merhaba! ☀️" : baslik;
}

// ================= ANA SAYFA =================
const SEVIYELER = [["A1", "Başlangıç"], ["A2", "Temel"], ["B1", "Orta"], ["B2", "İleri-orta"]];
// Konular (arkadaşın önerisi, 2026-10-21): seviyenin içinde istediğin konudan öğren.
// CEFR-J'de konu bilgisi yok; ayırma Violet'in (veri/konular.txt). Listede olmayan kelime "Temel kelimeler".
const KONULAR = [
  ["yemek", "🍎 Mutfak ve Yemek", ["apple", "bread", "cake", "coffee", "egg", "juice", "milk", "tea", "eat", "cook", "hungry", "kitchen", "dinner", "food", "lunch", "breakfast", "meat", "cup", "restaurant", "cooking", "bake", "fresh", "salt", "oil", "pour", "thirsty", "taste", "pie", "vegetarian", "chop", "peel", "nut", "cherry", "chew", "salty", "stew", "wheat", "peach", "recipe", "starve", "melt"]],
  ["ev", "🏠 Ev ve Eşyalar", ["bed", "chair", "door", "house", "key", "room", "table", "window", "clean", "dirty", "home", "wash", "box", "wall", "desk", "seat", "empty", "tidy", "apartment", "upstairs", "roof", "blanket", "mirror", "fence", "garage", "wood", "carpet", "curtain", "switch", "ceiling", "laundry", "lid", "backyard", "porch", "cabinet", "sweep", "mess", "neat"]],
  ["giyim", "👕 Giysiler", ["hat", "shoe", "umbrella", "wear", "clothes", "coat", "shirt", "sweater", "sock", "glove", "fashion", "pocket", "purse", "costume", "pajamas", "outfit", "clothing", "mask", "zip", "dye", "wallet"]],
  ["insan", "👨‍👩‍👧 Aile ve İnsanlar", ["brother", "child", "family", "father", "friend", "girl", "mother", "sister", "neighbor", "guest", "boy", "person", "kid", "son", "wife", "parent", "woman", "baby", "daughter", "married", "couple", "stranger", "member", "crowd", "friendship", "relative", "twin", "marriage", "relationship", "engaged", "roommate", "colleague", "adopted", "engagement", "community", "young", "old"]],
  ["beden", "🩺 Vücut ve Sağlık", ["eye", "healthy", "medicine", "tired", "hand", "hair", "face", "head", "heart", "health", "leg", "arm", "sick", "hurt", "dentist", "sleepy", "asleep", "weight", "injury", "pain", "breath", "blind", "skin", "illness", "surgery", "allergic", "cough", "disease", "shave", "finger", "beard", "tongue", "height", "nap", "ambulance", "medication", "throat", "scar", "massage", "bruise", "vitamin", "therapist", "unconscious", "snore", "yawn", "blink", "wink", "rub", "mustache", "sleep", "tall"]],
  ["duygu", "😊 Duygular ve Kişilik", ["happy", "angry", "lonely", "shy", "lucky", "afraid", "glad", "sorry", "sad", "excited", "funny", "interested", "worry", "hope", "love", "smile", "laugh", "cry", "brave", "confident", "disappointed", "nervous", "polite", "silly", "anxious", "worried", "surprised", "upset", "crazy", "bored", "unhappy", "fear", "happiness", "curious", "generous", "honest", "jealous", "proud", "ambitious", "cautious", "eager", "embarrassed", "frustrated", "stubborn", "temper", "calm", "concerned", "guilty", "satisfied", "ashamed", "shocked", "patience", "anger", "confidence", "scary", "annoyed", "selfish", "miserable", "careless", "unlucky", "fortunate", "courage", "desire", "cruel", "humor", "arrogant", "mature", "modest", "reluctant", "adore", "bossy", "charming", "clumsy", "decent", "determined", "devoted", "gloomy", "humble", "impulsive", "moody", "naughty", "obedient", "impressed", "willing", "friendly", "suspicious", "optimistic", "coward", "sensitive", "relieved", "motivated", "puzzled", "irritated", "pessimistic", "sincere", "astonished", "creepy", "picky", "nerves", "thrilled", "passionate", "conscience", "irresponsible", "doubtful", "attentive", "childish", "unsure", "truthful", "unwilling", "furious", "fierce", "hilarious", "lazy", "rich", "poor", "strange", "kind", "lonely"]],
  ["okul", "🎓 Okul ve Öğrenme", ["book", "school", "library", "dream", "teacher", "student", "learn", "word", "study", "homework", "class", "language", "test", "question", "answer", "letter", "exam", "university", "novel", "explain", "knowledge", "wisdom", "meaning", "translate", "examination", "theory", "mathematics", "professor", "experiment", "puzzle", "register", "document", "translation", "genius", "interpreter", "translator", "educated", "astronomy", "data", "remember", "forget", "idea"]],
  ["is", "💼 İş ve Para", ["money", "sell", "buy", "job", "pay", "work", "business", "price", "dollar", "bank", "office", "card", "company", "boss", "manager", "customer", "cash", "earn", "expert", "professional", "retired", "cost", "rent", "career", "afford", "deliver", "hire", "owe", "debt", "tax", "service", "insurance", "economy", "amount", "contract", "salary", "employee", "loan", "stock", "profit", "purchase", "client", "millionaire", "savings", "wage", "retirement", "overtime", "programmer", "investment", "payment", "resign", "employ", "candidate", "conference", "project", "meeting", "expensive", "cheap", "borrow"]],
  ["yol", "✈️ Seyahat ve Ulaşım", ["bicycle", "bus", "car", "airport", "map", "travel", "trip", "ticket", "train", "station", "drive", "driver", "hotel", "journey", "suitcase", "abroad", "flight", "gate", "traffic", "road", "cross", "passport", "motorcycle", "engine", "parking", "reservation", "distance", "mile", "helicopter", "sail", "crew", "trunk", "evacuate", "arrive", "leave"]],
  ["doga", "🌳 Doğa ve Hayvanlar", ["bird", "cat", "dog", "fish", "flower", "horse", "moon", "rain", "river", "sea", "snow", "sun", "tree", "weather", "cloud", "mountain", "island", "garden", "forest", "storm", "earth", "lake", "plant", "land", "space", "natural", "ocean", "spider", "season", "cave", "deer", "fox", "goat", "wolf", "barn", "dawn", "blossom", "solar", "tail", "environment", "animal", "star", "cold", "hot", "warm", "fire", "light", "dark", "heat", "wet", "bark"]],
  ["sehir", "🏙️ Şehir ve Yerler", ["city", "park", "town", "street", "hospital", "castle", "village", "museum", "market", "neighborhood", "department", "lobby", "gym", "world", "country", "place"]],
  ["zaman", "⏰ Zaman", ["morning", "night", "day", "tomorrow", "week", "year", "hour", "minute", "monday", "early", "late", "soon", "yesterday", "tonight", "later", "afternoon", "evening", "month", "weekend", "sunday", "summer", "future", "moment", "age", "noon", "midnight", "forever", "finally", "schedule", "appointment", "beginning", "lately", "whenever", "timing", "always", "often", "usually", "once", "sometimes", "rarely", "seldom"]],
  ["eglence", "🎾 Spor ve Eğlence", ["music", "ball", "dance", "sing", "swim", "play", "game", "movie", "party", "song", "tennis", "guitar", "piano", "fun", "birthday", "team", "golf", "chess", "skiing", "joke", "hero", "race", "jazz", "artist", "swimmer", "compete", "prize", "jogging", "knit", "score", "celebrate", "gift", "surprise", "picture", "story", "news", "win", "run", "climb", "walk"]],
  ["konusma", "💬 Konuşma ve İlişkiler", ["talk", "tell", "say", "ask", "speak", "call", "meet", "invite", "message", "visit", "thank", "kiss", "agree", "advice", "suggest", "promise", "lie", "complain", "apologize", "reply", "mention", "argue", "argument", "shout", "scream", "contact", "voice", "opinion", "secret", "disagree", "persuade", "recommend", "insist", "interrupt", "convince", "comment", "yell", "apology", "invitation", "misunderstanding", "praise", "quarrel", "insult", "confess", "consult", "contradict", "assure", "quote", "criticism", "hint", "rumor", "listen", "hear", "sound"]],
  ["hukuk", "⚖️ Hukuk ve Güvenlik", ["police", "thief", "steal", "law", "danger", "attack", "safe", "soldier", "guard", "government", "permission", "criminal", "witness", "guilty", "innocent", "punish", "proof", "victim", "security", "election", "army", "president", "detective", "rescue", "sue", "jury", "trial", "ban", "prohibit", "elect", "minister", "diplomat", "violate", "cheat", "deceive", "betray", "revenge", "dangerous", "accident", "warning", "safety", "lawyer", "politician", "navy", "obey"]],
];
const KONU_GENEL = ["genel", "⭐ Temel kelimeler"];
const KELIME_KONU = {};
KONULAR.forEach(([kod, , ws]) => ws.forEach(w => { if (!KELIME_KONU[w]) KELIME_KONU[w] = kod; }));
const konuOf = w => KELIME_KONU[w] || "genel";
let konuArama = "";
function konuCiz() {
  const seviyede = KELIMELER.filter(k => k[5] === d.seviye);
  const liste = KONULAR.map(([kod, ad]) => [kod, ad]).concat([KONU_GENEL])
    .map(([kod, ad]) => { const ks = seviyede.filter(k => konuOf(k[0]) === kod); return { kod, ad, top: ks.length, bilinen: ks.filter(k => d.kartlar[k[0]]).length }; })
    .filter(x => x.top >= 4);
  if (d.konu && !liste.some(x => x.kod === d.konu)) d.konu = "";
  // Arama: Türkçe büyük/küçük harf ve aksansız yazım eşleşir (aramaNormal); seçili konu hep görünür kalır.
  const ara = aramaNormal(konuArama), gorunen = ara ? liste.filter(x => x.kod === d.konu || aramaNormal(x.ad).includes(ara)) : liste;
  document.getElementById("konu-yok").hidden = !ara || gorunen.some(x => x.kod !== d.konu);
  document.getElementById("konu-ara-temizle").hidden = !konuArama;
  document.getElementById("konu-sec").innerHTML = `<button class="${!d.konu ? "aktif" : ""}" data-konu="">📚 Hepsi</button>` +
    gorunen.map(x => `<button class="${d.konu === x.kod ? "aktif" : ""}" data-konu="${x.kod}">${x.ad}<small>${x.bilinen}/${x.top}</small></button>`).join("");
  document.querySelectorAll("[data-konu]").forEach(b => b.onclick = () => {
    d.konu = b.dataset.konu; kaydet(); Ses.pop();
    const ad = (liste.find(x => x.kod === d.konu) || {}).ad;
    bildir(d.konu ? `${ad}: yeni kelimeler bu konudan gelecek` : `Konu: hepsi (${d.seviye})`); herSeyiCiz();
  });
  const secili = document.querySelector("#konu-sec .aktif"); if (secili && !ara) secili.scrollIntoView({ block: "nearest", inline: "center" });
}
document.getElementById("konu-ara").oninput = e => { konuArama = e.target.value; konuCiz(); };
document.getElementById("konu-ara-temizle").onclick = () => { konuArama = ""; const g = document.getElementById("konu-ara"); g.value = ""; konuCiz(); g.focus(); };

