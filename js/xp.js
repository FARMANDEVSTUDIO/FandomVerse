/* =========================================================
   xp.js — fan XP, levels and badges
   Everything is kept in this browser (localStorage), per
   logged-in user. Pages add XP with FV.addXP(points, kind).
   Visits (characters, categories, articles) count by URL.
   ========================================================= */
window.FV = window.FV || {};

(function(){

  // line icons (same stroke style as the rest of the site)
  const GI = {
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    swords: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>',
    bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.1" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.1" fill="currentColor"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    crown: '<path d="m2 5 4 11h12l4-11-6 5-4-7-4 7-6-5zM6 20h12"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.8 5.41a2 2 0 0 1-1.27 1.27L7.76 16.24l1.8-5.41a2 2 0 0 1 1.27-1.27z"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7l10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    play: '<path d="M7 4.5v15l12-7.5-12-7.5z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>'
  };
  FV.gi = (name, size = 18, cls = "") => `<svg class="gi ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GI[name] || ""}</svg>`;
  const who = () => { try{ return (FV.getUser && FV.getUser() || {}).email || "guest"; }catch(e){ return "guest"; } };
  const KEY = () => "fv_xp:" + who();
  const blank = () => ({ xp: 0, counts: {}, chars: [], cats: [], articles: [], badges: [], best: 0, days: [] });

  FV.xpState = function(){
    try{
      // XP earned before logging in moves over to the account
      if(who() !== "guest" && !localStorage.getItem(KEY()) && localStorage.getItem("fv_xp:guest")){
        localStorage.setItem(KEY(), localStorage.getItem("fv_xp:guest"));
        localStorage.removeItem("fv_xp:guest");
      }
      return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY())) || {});
    }catch(e){ return blank(); }
  };
  const save = s => { try{ localStorage.setItem(KEY(), JSON.stringify(s)); }catch(e){} };

  // levels: every level needs a bit more XP than the last
  const TITLES = ["Newcomer", "Fan", "Explorer", "Enthusiast", "Lore Keeper", "Superfan", "Legend", "Multiverse Master"];
  FV.xpLevel = function(xp){
    let lvl = 1, need = 100, floor = 0;
    while(xp >= floor + need){ floor += need; lvl++; need = Math.round(need * 1.35); }
    return { lvl, title: TITLES[Math.min(lvl - 1, TITLES.length - 1)], into: xp - floor, need };
  };

  FV.BADGES = [
    { id: "first",    icon: "sparkle", name: "First Steps",        desc: "Earn your first XP",                   ok: s => s.xp > 0 },
    { id: "explorer", icon: "compass", name: "Fandom Explorer",    desc: "Visit all 7 categories",               ok: s => s.cats.length >= 7 },
    { id: "collect",  icon: "layers", name: "Character Collector", desc: "Open 10 character profiles",          ok: s => s.chars.length >= 10 },
    { id: "lore",     icon: "book", name: "Lore Master",        desc: "Read 10 articles",                     ok: s => s.articles.length >= 10 },
    { id: "soul",     icon: "heart", name: "Soul Match",         desc: "Score 80% or more in Personality Match", ok: s => s.best >= 80 },
    { id: "battle",   icon: "swords", name: "Battle Champion",    desc: "Call 10 battles right",                ok: s => (s.counts.battleWin || 0) >= 10 },
    { id: "cup",      icon: "trophy", name: "Tournament Winner",  desc: "Predict a tournament champion",                  ok: s => (s.counts.cup || 0) >= 1 },
    { id: "daily",    icon: "bolt", name: "Daily Hero",         desc: "Solve 3 daily challenges",             ok: s => (s.counts.daily || 0) >= 3 },
    { id: "lucky",    icon: "dice", name: "Feeling Lucky",      desc: "Use Surprise Me 5 times",              ok: s => (s.counts.surprise || 0) >= 5 },
    { id: "super",    icon: "crown", name: "Superfan",           desc: "Reach 1,000 XP",                       ok: s => s.xp >= 1000 }
  ];

  // small "+10 XP" pop in the corner
  function pop(text, big, icon){
    const el = document.createElement("div");
    el.className = "xp-pop" + (big ? " big" : "");
    el.innerHTML = (icon ? FV.gi(icon, 16) : "") + `<span>${FV.escapeHtml ? FV.escapeHtml(text) : text}</span>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), big ? 3200 : 1800);
  }

  function check(s, quiet){
    const got = [];
    FV.BADGES.forEach(b => { if(!s.badges.includes(b.id) && b.ok(s)){ s.badges.push(b.id); got.push(b); } });
    if(!quiet) got.forEach((b, i) => setTimeout(() => pop(`Badge unlocked: ${b.name}`, true, b.icon), 700 + i * 900));
  }

  // points: XP to add; kind: what it was for (counted); extra: { char, cat, article, pct }
  FV.addXP = function(points, kind, extra){
    const s = FV.xpState(), before = FV.xpLevel(s.xp).lvl;
    s.xp += points || 0;
    if(kind) s.counts[kind] = (s.counts[kind] || 0) + 1;
    if(extra && extra.pct) s.best = Math.max(s.best, extra.pct);
    check(s);
    save(s);
    if(points) pop(`+${points} XP`);
    const after = FV.xpLevel(s.xp);
    if(after.lvl > before) setTimeout(() => pop(`Level ${after.lvl}: ${after.title}`, true, "star"), 400);
    document.dispatchEvent(new CustomEvent("fv:xp", { detail: s }));
    return s;
  };

  // first visit to a character, category or article gives XP by itself
  function trackVisit(){
    const q = new URLSearchParams(location.search), page = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
    const s = FV.xpState();
    const first = (list, id) => { if(!id || s[list].includes(id)) return false; s[list].push(id); return true; };
    let pts = 0, kind = null;
    if(page === "character" && first("chars", q.get("id"))){ pts = 5; kind = "char"; }
    else if(page === "category" && first("cats", q.get("cat"))){ pts = 5; kind = "cat"; }
    else if(page === "articles" && first("articles", q.get("id"))){ pts = 10; kind = "article"; }
    if(!pts) return;
    save(s);
    setTimeout(() => FV.addXP(pts, kind), 1200);
  }
  // profile page: level, XP bar, stats and badges
  function drawCard(){
    if(!document.getElementById("xpCard")) return;
    const s = FV.xpState(), L = FV.xpLevel(s.xp);
    const set = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
    set("xpLvl", L.lvl); set("xpTitle", L.title); set("xpNow", L.into.toLocaleString()); set("xpGoal", L.need.toLocaleString());
    set("xpNext", `${(L.need - L.into).toLocaleString()} XP to level ${L.lvl + 1} · ${s.xp.toLocaleString()} XP in total`);
    document.getElementById("xpFill").style.width = Math.round(L.into / L.need * 100) + "%";
    const stats = [["Characters seen", s.chars.length], ["Articles read", s.articles.length], ["Battles won", s.counts.battleWin || 0], ["Best match", (s.best || 0) + "%"]];
    document.getElementById("xpStats").innerHTML = stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    set("xpBadgeCount", `${s.badges.length} of ${FV.BADGES.length} unlocked`);
    document.getElementById("xpBadges").innerHTML = FV.BADGES.map(b => {
      const on = s.badges.includes(b.id);
      return `<li class="xp-badge ${on ? "on" : ""}">${FV.gi(on ? b.icon : "lock", 16)}<span><strong>${b.name}</strong><small>${b.desc}</small></span></li>`;
    }).join("");
  }
  // release reminders set on the Events page: tell the fan the day before and on the day (once per day)
  function reminders(){
    try{
      const list = JSON.parse(localStorage.getItem("fv_remind")) || [];
      const d = new Date(); const key = x => x.toISOString().slice(0, 10);
      const today = key(d), tomorrow = key(new Date(d.getTime() + 864e5));
      const seen = sessionStorage.getItem("fv_remind_seen") === today;
      const due = list.filter(r => r.date === today || r.date === tomorrow);
      if(!due.length || seen) return;
      sessionStorage.setItem("fv_remind_seen", today);
      due.forEach((r, i) => setTimeout(() => pop(`${r.date === today ? "Out today" : "Tomorrow"}: ${r.title}`, true, "bell"), 1500 + i * 3400));
    }catch(e){}
  }
  document.addEventListener("DOMContentLoaded", () => { trackVisit(); drawCard(); reminders(); });
  document.addEventListener("fv:xp", drawCard);

})();
