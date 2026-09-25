/* =========================================================
   FandomVerse — chatbot.js
   When the site runs through server.py with an AI key, questions go to a
   real AI model (kept to FandomVerse topics on the server). Otherwise the
   rule-based guide answers from chatbot.json.
   - Voice: the mic button listens (English, Hinglish, Urdu or Hindi) and,
     when you spoke, the answer is read back to you.
   - Actions: "3d models page kholo", "Goku ka page", "batman trailer chalao",
     "dark mode", "cart dikhao", "search pubg" ... the AI (or a small built-in
     matcher when there is no AI) returns an action and the site does it.
   - The conversation survives page changes (sessionStorage).
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const data = await FV.data;
  const bot = data.chatbot || { intents: [], quickPrompts: [] };
  // how-to answers about the site itself (login, cart, 3D, voice, contact...)
  const HELP = await fetch((window.FV_BASE || "") + "data/site-help.json", { cache: "no-store" }).then(r => r.ok ? r.json() : []).catch(() => []);

  const chatFab = document.getElementById("chatFab");
  const chatWindow = document.getElementById("chatWindow");
  const chatClose = document.getElementById("chatClose");
  const chatBody = document.getElementById("chatBody");
  const chatQuick = document.getElementById("chatQuick");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  if(!chatFab) return;

  const BASE = window.FV_BASE || "";
  const API = /\.github\.io$/.test(location.hostname) ? "https://fandomverse-nu.vercel.app/" : BASE;
  // each account (or a guest) has its own conversation
  const who = (FV.getUser && FV.getUser()) ? String(FV.getUser().email || "user").toLowerCase() : "guest";
  const STORE = "fv_chat:" + who;
  try{ sessionStorage.removeItem("fv_chat"); }catch(e){}   // old shared key
  let started = false;
  let history = [];   // {role, content} sent to the AI for context

  // is the AI endpoint there? (plain static hosting has no /api/chat)
  const aiReady = fetch(API + "api/chat", { cache: "no-store" })
    .then(r => r.ok ? r.json() : null).then(j => !!(j && j.ready)).catch(() => false);
  // with a live AI behind it, say so in the window
  aiReady.then(on => {
    if(!on) return;
    const status = document.querySelector(".chat-head-info small");
    if(status) status.textContent = "AI assistant · online";
    const note = document.querySelector(".chat-disclaimer");
    if(note) note.textContent = "AI answers about FandomVerse only — it can make mistakes.";
    if(chatInput) chatInput.placeholder = "Type or tap the mic…";
  });

  const botAvatar = `<span class="chat-msg-avatar" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/></svg></span>`;
  const timeNow = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // names the guide may mention: "Goku", "Satoru Gojo", "Gojo", "Batman", a fandom name…
  const MENTIONS = [];
  (data.characters || []).forEach(c => {
    const names = new Set([c.name]);
    c.name.split(" / ").forEach(n => names.add(n.trim()));
    const last = c.name.split(" / ")[0].split(" ").pop();
    if(last.length > 3 && !/^(the|man)$/i.test(last)) names.add(last);
    names.forEach(n => n.length > 2 && MENTIONS.push({ n, kind: "char", item: c }));
  });
  (data.categories || []).forEach(k => MENTIONS.push({ n: k.name, kind: "cat", item: k }));
  MENTIONS.sort((a, b) => b.n.length - a.n.length);
  function mentionCards(text){
    const seen = new Set(), out = [];
    for(const m of MENTIONS){
      if(out.length >= 3 || seen.has(m.item.id)) continue;
      const re = new RegExp("(^|[^\\w])" + m.n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\w])", "i");
      if(!re.test(text)) continue;
      seen.add(m.item.id);
      const e = s => FV.escapeHtml(String(s || ""));
      out.push(m.kind === "char"
        ? `<a class="chat-card" href="character.html?id=${m.item.id}"><img src="${window.FV_BASE || ""}assets/images/characters/${m.item.id}.jpg" alt=""><span><strong>${e(m.item.name)}</strong><small>${e(m.item.series)}</small></span></a>`
        : `<a class="chat-card cat" href="category.html?cat=${m.item.id}" style="--c:${m.item.color}"><i></i><span><strong>${e(m.item.name)}</strong><small>Open the ${e(m.item.name)} hub</small></span></a>`);
    }
    return out.join("");
  }

  function addMessage(text, from = "bot", time = timeNow(), note = ""){
    const row = document.createElement("div");
    row.className = `chat-row ${from}`;
    const bubble = document.createElement("div");
    bubble.className = `chat-msg ${from}`;
    bubble.textContent = text;
    if(note){
      const n = document.createElement("span");
      n.className = "chat-action-note";
      n.textContent = note;
      bubble.appendChild(n);
    }
    const t = document.createElement("span");
    t.className = "chat-time";
    t.textContent = time;
    const stack = document.createElement("div");
    stack.className = "chat-stack";
    stack.append(bubble, t);
    // characters or fandoms the reply talks about show up as tappable cards under it
    if(from === "bot"){
      const cards = mentionCards(text);
      if(cards) stack.insertAdjacentHTML("beforeend", `<div class="chat-cards">${cards}</div>`);
    }
    if(from === "bot") row.insertAdjacentHTML("afterbegin", botAvatar);
    row.appendChild(stack);
    chatBody.appendChild(row);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function showTyping(){
    const row = document.createElement("div");
    row.className = "chat-row bot chat-typing-row";
    row.innerHTML = `${botAvatar}<div class="chat-typing" aria-label="Guide is typing"><i></i><i></i><i></i></div>`;
    chatBody.appendChild(row);
    chatBody.scrollTop = chatBody.scrollHeight;
    return row;
  }
  // suggestion tiles: a small icon picked from the question's topic
  const quickIcon = q => {
    const t = q.toLowerCase();
    const path = /categor/.test(t) ? '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'
      : /character|profile/.test(t) ? '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'
      : /merch|shop|real|price/.test(t) ? '<path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/>'
      : /search|find/.test(t) ? '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'
      : /event|date|when/.test(t) ? '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'
      : '<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>';
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  };
  function renderQuick(){
    chatQuick.innerHTML = (bot.quickPrompts || []).map(q =>
      `<button type="button" data-q="${FV.escapeHtml(q)}"><span class="cq-icon">${quickIcon(q)}</span><span class="cq-text">${FV.escapeHtml(q)}</span><span class="cq-go" aria-hidden="true">→</span></button>`).join("");
  }
  /* Built-in answers from the site's own data, used when the AI can't answer
     (no key, daily limit reached, offline). Knows every character, event,
     release, product, article and video on the site. */
  const catName = id => ((data.categories || []).find(c => c.id === id) || {}).name || id;
  const fmtDate = d => { try{ return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }catch(e){ return d; } };
  const pkr = n => "PKR " + Number(n).toLocaleString("en-PK");
  const STOPW = new Set(["the", "and", "of", "one", "man", "mr", "dr", "new", "official", "trailer", "season", "part", "a", "in", "to", "for", "with", "on",
    "release", "event", "video", "chapter", "episode", "next", "hai", "kab", "kaun", "kon", "ka", "ki", "ke", "about", "batao", "what", "who", "is", "the", "watch", "party", "fan", "night"]);
  const tokens = t => t.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  // best item whose name words appear in the question
  function bestMatch(list, nameOf, q){
    const qw = new Set(tokens(q));
    let best = null, score = 0;
    for(const item of list){
      const words = tokens(nameOf(item)).filter(w => w.length > 2 && !STOPW.has(w));
      const hit = words.filter(w => qw.has(w)).length;
      if(hit > score){ score = hit; best = item; }
    }
    return best;
  }
  function findCategory(q){
    const t = q.toLowerCase();
    return (data.categories || []).find(c => t.includes(c.name.toLowerCase()) || t.includes(c.id) || (c.id === "kpop" && /k-?pop|bts/.test(t)) || (c.id === "tv-shows" && /\btv\b|drama|series/.test(t)));
  }
  function localAnswer(text){
    const t = text.toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    const cat = findCategory(t);

    // products: cheapest / most expensive / price of X
    if(/merch|product|item|shop|price|kitn|keemat|qeemat|cost|sasta|cheap|mehnga|expensive|hoodie|jacket|shirt|tee|figure|mat/.test(t)){
      let items = (data.merchandise || []).filter(m => !cat || m.category === cat.id);
      if(/sast|cheap|lowest|kam\b/.test(t) && items.length){ const m = items.reduce((a, b) => a.price <= b.price ? a : b); return `The cheapest ${cat ? cat.name + " " : ""}item is ${m.name} at ${pkr(m.price)}. See it on the Merch page.`; }
      if(/mehng|expensive|highest|costly/.test(t) && items.length){ const m = items.reduce((a, b) => a.price >= b.price ? a : b); return `The most expensive ${cat ? cat.name + " " : ""}item is ${m.name} at ${pkr(m.price)}.`; }
      const m = bestMatch(data.merchandise || [], x => x.name, t);
      if(m) return `${m.name} costs ${pkr(m.price)} (${catName(m.category)}). ${m.description} Add it to your cart on the Merch page.`;
      if(cat && items.length) return `${cat.name} merch: ` + items.map(x => `${x.name} (${pkr(x.price)})`).join(", ") + ".";
    }
    // events and releases
    if(/event|meetup|watch party|screening|tournament|convention|\bkab\b|when|next|agla|upcoming|release|chapter|episode/.test(t)){
      const isRelease = /release|chapter|episode|season|launch|update/.test(t) && !/event/.test(t);
      const list = (isRelease ? data.releases : data.events) || [];
      const named = bestMatch(list, x => x.title, t);
      if(named) return isRelease
        ? `${named.title}: ${named.type} on ${fmtDate(named.date)} (${named.platform}).`
        : `${named.title} is on ${fmtDate(named.date)} at ${named.location}. ${named.description}`;
      const up = list.filter(x => (!cat || x.category === cat.id) && x.date >= today).sort((a, b) => a.date.localeCompare(b.date));
      const nx = up[0] || list.filter(x => !cat || x.category === cat.id).sort((a, b) => a.date.localeCompare(b.date))[0];
      if(nx) return isRelease
        ? `Next ${cat ? cat.name + " " : ""}release: ${nx.title} (${nx.type}) on ${fmtDate(nx.date)}, ${nx.platform}.`
        : `The next ${cat ? cat.name + " " : ""}event is ${nx.title} on ${fmtDate(nx.date)} at ${nx.location}. More on the Events page.`;
    }
    // videos
    if(/video|trailer|interview|watch|dekh/.test(t)){
      const v = bestMatch(data.trailers || [], x => x.title, t);
      if(v) return `${v.title} (${v.type}${v.duration ? ", " + v.duration : ""}): ${v.description} Say "play" and I'll open it.`;
      const vs = (data.trailers || []).filter(x => !cat || x.category === cat.id);
      if(vs.length) return `${cat ? cat.name + " videos" : "Videos on the Media page"}: ` + vs.map(x => x.title).join("; ") + ".";
    }
    // characters (any name word: "iron man kon hai", "goku", "bruce wayne")
    const ch = bestMatch(data.characters || [], c => c.name + " " + c.series.replace(/[:\-]/g, " "), t.replace(/\bman\b/g, " man "))
      || (data.characters || []).find(c => c.name.toLowerCase().split(/\s*\/\s*/).some(n => n.length > 2 && new RegExp(`(^|[^a-z])${n.replace(/[^a-z0-9 ]/g, ".")}([^a-z]|$)`).test(t)));
    const nameHit = ch && tokens(ch.name).some(w => w.length > 2 && !STOPW.has(w) && tokens(t).includes(w)) || (ch && ch.name.length > 2 && t.includes(ch.name.toLowerCase()));
    if(ch && nameHit){
      const has3d = ch.model || ch.models;
      return `${ch.name} is from ${ch.series} (${catName(ch.category)}). ${ch.bio} Traits: ${(ch.traits || []).join(", ")}.` +
        (has3d ? " They have a full 3D model and a real voice on their character page." : " Their profile is on the Characters page.");
    }
    // articles
    const qa = new Set(tokens(t));
    const a = bestMatch(data.articles || [], x => x.title, t);
    const aHits = a ? tokens(a.title).filter(w => w.length > 2 && !STOPW.has(w) && qa.has(w)).length : 0;
    if(a && (aHits >= 2 || /article|news|read|padh|blog|story/.test(t))){
      const body = Array.isArray(a.body) ? a.body.join(" ") : String(a.body || "");
      return `"${a.title}" (${catName(a.category)}, ${a.readTime || ""}, ${fmtDate(a.date)}): ${a.excerpt} ${body.slice(0, 260)}${body.length > 260 ? "…" : ""} Read it on the Articles page.`;
    }
    // a whole category
    if(cat && /about|baare|batao|tell|kya hai|what/.test(t)){
      const chars = (data.characters || []).filter(c => c.category === cat.id).map(c => c.name);
      return `${cat.name} — ${cat.tagline}. Characters: ${chars.join(", ")}. Open the ${cat.name} page to see its articles, events and merch.`;
    }
    if(/3\s*d/.test(t)){
      const list = (data.characters || []).filter(c => c.model || c.models).map(c => c.name);
      return `These ${list.length} characters have 3D models and real voices: ${list.join(", ")}. Open the 3D models tab on the Characters page.`;
    }
    return null;
  }
  function helpAnswer(text){
    const t = " " + text.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff ]+/g, " ") + " ";
    let best = null, score = 0;
    for(const h of HELP){
      const sc = (h.keys || []).reduce((n, k) => n + (t.includes(" " + k + " ") || t.includes(" " + k) ? k.split(" ").length : 0), 0);
      if(sc > score){ score = sc; best = h; }
    }
    return best ? best.answer : null;
  }
  function findResponse(text){
    const t = text.toLowerCase();
    // "how do I..." questions go to the site guide first
    if(/\b(how|kaise|kese|kaisay|kahan|where|can i|kya main|kya mai)\b/.test(t)){ const h = helpAnswer(text); if(h) return h; }
    const smart = localAnswer(text);
    if(smart) return smart;
    const help = helpAnswer(text);
    if(help) return help;
    const lower = text.toLowerCase();
    const intent = (bot.intents || []).find(i => i.keywords.some(kw => lower.includes(kw)));
    return intent ? intent.response : "I couldn't find that on FandomVerse. Ask me about a character, event, video or product — for example \"Goku kaun hai?\" or \"next anime event kab hai?\"";
  }

  /* ---------- remember the conversation across pages ---------- */
  const log = [];   // {text, from, time, note}
  function save(open){
    try{ sessionStorage.setItem(STORE, JSON.stringify({ log: log.slice(-40), history: history.slice(-12), open: !!open })); }catch(e){}
  }
  function say(text, from, note = ""){
    const time = timeNow();
    addMessage(text, from, time, note);
    log.push({ text, from, time, note });
    save(chatWindow.classList.contains("open"));
  }

  function openChat(){
    chatWindow.classList.add("open"); chatWindow.setAttribute("aria-hidden","false"); chatFab.setAttribute("aria-expanded","true");
    if(!started){ started = true; say(bot.greeting || "Hi, ask me a question.", "bot"); renderQuick(); }
    save(true);
    setTimeout(() => chatInput.focus(), 200);
  }
  function closeChat(){ chatWindow.classList.remove("open"); chatWindow.setAttribute("aria-hidden","true"); chatFab.setAttribute("aria-expanded","false"); save(false); }

  try{
    const saved = JSON.parse(sessionStorage.getItem(STORE) || "null");
    if(saved && saved.log && saved.log.length){
      started = true;
      history = saved.history || [];
      saved.log.forEach(m => { addMessage(m.text, m.from, m.time, m.note); log.push(m); });
      if(saved.log.some(m => m.from === "user")) chatQuick.classList.add("is-hidden"); else renderQuick();
      if(saved.open){ chatWindow.classList.add("open"); chatWindow.setAttribute("aria-hidden","false"); chatFab.setAttribute("aria-expanded","true"); }
    }
  }catch(e){}

  chatFab.addEventListener("click", () => chatWindow.classList.contains("open") ? closeChat() : openChat());
  chatClose && chatClose.addEventListener("click", closeChat);
  document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeChat(); });

  chatQuick.addEventListener("click", (e) => { const btn = e.target.closest("button"); if(btn) handleUserMessage(btn.dataset.q || btn.textContent); });

  /* ---------- actions the chat can carry out ---------- */
  const PAGE_NAMES = {
    "index.html": "Home", "articles.html": "Articles", "characters.html": "Characters", "characters.html#3d": "3D models",
    "events.html": "Events", "events.html#releases": "Release calendar", "trailers.html": "Media", "merchandise.html": "Merch",
    "bookmarks.html": "Bookmarks", "profile.html": "Profile", "login.html": "Log in", "signup.html": "Sign up",
    "checkout.html": "Checkout", "about.html": "About", "contact.html": "Contact", "privacy.html": "Privacy", "accessibility.html": "Accessibility",
  };
  function describe(a){
    if(a.go){
      const ch = a.go.match(/character\.html\?id=([\w-]+)/);
      if(ch){ const c = (data.characters || []).find(x => x.id === ch[1]); return `Opening ${c ? c.name : "character"}…`; }
      const ar = a.go.match(/article\.html\?id=([\w-]+)/);
      if(ar){ const x = (data.articles || []).find(y => y.id === ar[1]); return `Opening article${x ? ": " + x.title : ""}…`; }
      const cat = a.go.match(/category\.html\?cat=([\w-]+)/);
      if(cat){ const c = (data.categories || []).find(y => y.id === cat[1]); return `Opening ${c ? c.name : "category"}…`; }
      return `Opening ${PAGE_NAMES[a.go] || a.go.replace(".html", "")}…`;
    }
    if(a.play){ const t = (data.trailers || []).find(x => x.id === a.play); return `Playing ${t ? t.title : "video"}…`; }
    if(a.search) return `Searching "${a.search}"…`;
    if(a.theme) return `Switched to ${a.theme} mode`;
    if(a.cart) return "Opening your cart…";
    return "";
  }
  function here(url){
    const [path, hash] = url.split("#");
    const cur = location.pathname.split("/").pop() || "index.html";
    return (path === cur + location.search || (path === cur && !location.search)) ? (hash || "") : null;
  }
  function runAction(a){
    if(!a) return;
    if(a.go){
      const sameHash = here(a.go);
      if(sameHash !== null){
        // already on this page: just switch tab/section
        if(sameHash){ location.hash = sameHash; window.dispatchEvent(new HashChangeEvent("hashchange")); document.querySelector(`[data-view="${sameHash}"]`)?.click(); document.getElementById(sameHash)?.scrollIntoView({ behavior: "smooth" }); }
        return;
      }
      setTimeout(() => { location.href = BASE + a.go; }, 700);
    }else if(a.play){
      if(typeof FV.openMedia === "function" && document.getElementById("trailerGridFull")) FV.openMedia(a.play);
      else setTimeout(() => { location.href = BASE + "trailers.html?play=" + encodeURIComponent(a.play); }, 700);
    }else if(a.search){
      const btn = document.getElementById("searchToggle"), input = document.getElementById("globalSearch");
      if(btn && input){
        closeChat();
        btn.click();
        setTimeout(() => { input.value = a.search; input.dispatchEvent(new Event("input", { bubbles: true })); }, 300);
      }
    }else if(a.theme){
      const light = document.documentElement.getAttribute("data-theme") === "light";
      if((a.theme === "light") !== light) document.getElementById("themeToggle")?.click();
    }else if(a.cart){
      closeChat();
      document.getElementById("cartToggle")?.click();
    }
  }

  // small built-in matcher, used when there is no AI (or it didn't answer)
  function localAction(text){
    const t = text.toLowerCase();
    const wantsDo = /(open|khol|show|dikha|go to|le chalo|chalao|play|laga|search|dhoond|dhund|mode|cart|page)/.test(t);
    if(!wantsDo) return null;
    if(/dark/.test(t)) return { theme: "dark" };
    if(/light|roshan/.test(t)) return { theme: "light" };
    if(/cart|basket|tokri/.test(t)) return { cart: true };
    const s = t.match(/(?:search|dhoond(?:o)?|dhund(?:o)?)\s+(?:for\s+)?(.+)/);
    if(s) return { search: s[1].replace(/\b(karo|kro|please|plz)\b/g, "").trim() };
    const vid = /(trailer|video|chalao|play)/.test(t) && (data.trailers || []).find(x => x.title.toLowerCase().split(/[^a-z0-9]+/).some(w => w.length > 3 && t.includes(w)));
    if(vid) return { play: vid.id };
    // a character named in the sentence ("goku ka page", "open batman"); ignore filler words
    const STOP = new Set(["the", "and", "of", "one", "man", "mr", "dr"]);
    const words = t.split(/[^a-z0-9-]+/);
    const ch = (data.characters || []).find(c => c.name.toLowerCase().split(/\s*\/\s*|\s+/)
      .some(w => w.length > 2 && !STOP.has(w) && words.includes(w)));
    if(ch) return { go: `character.html?id=${ch.id}` };
    if(/3\s*d/.test(t)) return { go: "characters.html#3d" };
    const pages = [[/character/, "characters.html"], [/article|news/, "articles.html"], [/release|calendar/, "events.html#releases"], [/event/, "events.html"],
      [/media|trailer|video/, "trailers.html"], [/merch|shop|store|dukaan/, "merchandise.html"], [/bookmark/, "bookmarks.html"], [/profile/, "profile.html"],
      [/sign\s*up|register/, "signup.html"], [/log\s*in|login/, "login.html"], [/checkout/, "checkout.html"], [/about/, "about.html"], [/contact/, "contact.html"], [/privacy|data policy/, "privacy.html"], [/accessib/, "accessibility.html"], [/home|ghar/, "index.html"]];
    const hit = pages.find(([re]) => re.test(t));
    if(hit) return { go: hit[1] };
    const cat = (data.categories || []).find(c => t.includes(c.name.toLowerCase()) || t.includes(c.id));
    if(cat) return { go: `category.html?cat=${cat.id}` };
    return null;
  }

  /* ---------- sending ---------- */
  let busy = false;
  async function handleUserMessage(text, spoken = false){
    text = text.trim(); if(!text || busy) return;
    say(text, "user");
    history.push({ role: "user", content: text });
    // once a conversation has started, give the space back to the messages
    chatQuick.classList.add("is-hidden");
    // clear commands ("goku ka page kholo", "cart dikhao", "dark mode") run instantly, no AI round-trip
    const isQuestion = /\?|\b(kya|kaun|kon|kaise|kesay|kitn\w*|kab|kyun|how|what|which|who|why|when|does|is|are|can)\b/i.test(text);
    const quick = isQuestion ? null : localAction(text);
    if(quick){
      const reply = describe(quick).replace(/…$/, "") + "!";
      say(reply, "bot", describe(quick));
      history.push({ role: "assistant", content: reply });
      save(chatWindow.classList.contains("open"));
      if(spoken) speak(reply);
      runAction(quick);
      return;
    }
    const typing = showTyping();
    busy = true;
    let reply = null, action = null;
    if(await aiReady){
      try{
        const r = await fetch(API + "api/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.slice(-12) }),
        });
        const j = await r.json().catch(() => ({}));
        if(r.ok && j.reply){ reply = j.reply; action = j.action || null; }
        // the AI said it would do something but forgot the action: work it out here
        if(reply && !action && !isQuestion) action = localAction(text);
      }catch(err){ /* fall through to the built-in answers */ }
    }
    if(!reply){
      action = isQuestion ? null : localAction(text);
      reply = action ? "Sure!" : findResponse(text);
      await new Promise(res => setTimeout(res, Math.min(1400, 500 + (reply || "").length * 6)));
    }
    typing.remove();
    say(reply, "bot", action ? describe(action) : "");
    history.push({ role: "assistant", content: reply });
    save(chatWindow.classList.contains("open"));
    busy = false;
    if(spoken) speak(reply);
    runAction(action);
  }

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value; if(!text.trim()) return;
    handleUserMessage(text); chatInput.value = "";
  });

  /* ---------- voice: speak to the chat, hear the answer ---------- */
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const LANGS = [
    ["en-IN", "EN", "English / Hinglish"],
    ["ur-PK", "اردو", "Urdu"],
    ["hi-IN", "हिं", "Hindi"],
    ["en-US", "US", "English (US)"],
  ];
  let langIdx = 0;
  try{ langIdx = Math.max(0, LANGS.findIndex(l => l[0] === localStorage.getItem("fv_voice_lang"))); }catch(e){}

  function speak(text){
    if(!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ""));
    const hasUrdu = /[؀-ۿ]/.test(text), hasHindi = /[ऀ-ॿ]/.test(text);
    const want = hasUrdu ? "ur" : hasHindi ? "hi" : "en";
    const v = speechSynthesis.getVoices().find(x => x.lang.toLowerCase().startsWith(want));
    if(v){ u.voice = v; u.lang = v.lang; } else u.lang = hasUrdu ? "ur-PK" : hasHindi ? "hi-IN" : "en-IN";
    speechSynthesis.speak(u);
  }

  if(Rec && chatForm && !chatForm.querySelector(".chat-mic")){
    const langBtn = document.createElement("button");
    langBtn.type = "button";
    langBtn.className = "chat-lang";
    const mic = document.createElement("button");
    mic.type = "button";
    mic.className = "chat-mic";
    mic.setAttribute("aria-label", "Speak your question");
    mic.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`;
    const showLang = () => { langBtn.textContent = LANGS[langIdx][1]; langBtn.title = `Voice language: ${LANGS[langIdx][2]} (click to change)`; langBtn.setAttribute("aria-label", langBtn.title); };
    showLang();
    langBtn.addEventListener("click", () => { langIdx = (langIdx + 1) % LANGS.length; showLang(); try{ localStorage.setItem("fv_voice_lang", LANGS[langIdx][0]); }catch(e){} FV.showToast && FV.showToast(`Voice language: ${LANGS[langIdx][2]}`); });
    chatInput.before(langBtn);
    chatInput.after(mic);

    let rec = null, listening = false, finalText = "";
    function stop(){ if(rec) try{ rec.stop(); }catch(e){} }
    mic.addEventListener("click", () => {
      if(listening){ stop(); return; }
      if(window.speechSynthesis) speechSynthesis.cancel();
      rec = new Rec();
      rec.lang = LANGS[langIdx][0];
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      finalText = "";
      const before = chatInput.placeholder;
      rec.onstart = () => { listening = true; mic.classList.add("is-on"); chatWindow.classList.add("is-listening"); chatInput.value = ""; chatInput.placeholder = "Listening… speak now"; };
      rec.onresult = e => {
        let interim = "";
        for(let i = e.resultIndex; i < e.results.length; i++){
          if(e.results[i].isFinal) finalText += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        chatInput.value = (finalText + interim).trim();
      };
      rec.onerror = e => {
        const msg = e.error === "not-allowed" ? "Allow microphone access to use voice." : e.error === "network" ? "Voice needs an internet connection." : e.error === "no-speech" ? "Didn't hear anything, try again." : "";
        if(msg) FV.showToast && FV.showToast(msg);
      };
      rec.onend = () => {
        listening = false; mic.classList.remove("is-on"); chatWindow.classList.remove("is-listening"); chatInput.placeholder = before;
        const text = (finalText || chatInput.value).trim();
        if(text){ chatInput.value = ""; handleUserMessage(text, true); }
      };
      try{ rec.start(); }catch(e){}
    });
  }
});
