/* =========================================================
   FandomVerse — releases.js
   Upcoming releases calendar: month grid where each release day shows
   an icon for its kind (film, chapter, game…), fandom filters, a Today
   button, and a side list with the next releases or the chosen day.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("relGrid");
  const monthEl = document.getElementById("relMonth");
  const list = document.getElementById("relList");
  const listTitle = document.getElementById("relListTitle");
  const showAll = document.getElementById("relShowAll");
  const legend = document.getElementById("relLegend");
  const monthCount = document.getElementById("relMonthCount");
  if(!grid || !monthEl || !list) return;

  const data = await FV.data;
  const catMap = Object.fromEntries((data.categories || []).map(c => [c.id, c]));
  const esc = s => FV.escapeHtml(String(s ?? ""));

  // line icons for each kind of release (same stroke style as the rest of the site)
  const P = {
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    tv: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="m17 2-5 5-5-5"/>',
    game: '<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01"/><path d="M17.3 5H6.7a4 4 0 0 0-3.96 3.46l-.7 5.64A2.8 2.8 0 0 0 4.82 17.3L7 15h10l2.18 2.3a2.8 2.8 0 0 0 2.78-3.2l-.7-5.64A4 4 0 0 0 17.3 5z"/>',
    stage: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'
  };
  const kindOf = t => {
    t = (t || "").toLowerCase();
    if(/film|movie/.test(t)) return "film";
    if(/chapter|issue|volume|edition/.test(t)) return "book";
    if(/episode|season|marathon|premiere/.test(t)) return "tv";
    if(/game/.test(t)) return "game";
    if(/live|performance|concert/.test(t)) return "stage";
    if(/box/.test(t)) return "box";
    return "cal";
  };
  const icon = (t, size = 16) => `<svg class="rel-ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[kindOf(t)]}</svg>`;

  // parse "YYYY-MM-DD" as a local date so it never shifts a day across timezones
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const all = (data.releases || []).map(r => ({ ...r, when: parse(r.date) })).sort((a, b) => a.when - b.when);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const firstUp = (all.find(r => r.when >= today) || all[0] || { when: today }).when;
  let view = new Date(firstUp.getFullYear(), firstUp.getMonth(), 1);
  let selected = null, filter = "all";

  const shown = () => all.filter(r => filter === "all" || r.category === filter);
  const byDay = () => { const m = {}; shown().forEach(r => (m[key(r.when)] ||= []).push(r)); return m; };

  // fandom filter chips (replace the old colour legend)
  if(legend){
    const used = [...new Set(all.map(r => r.category))].filter(id => catMap[id]);
    legend.innerHTML = `<button type="button" class="rel-chip on" data-cat="all">All fandoms</button>` +
      used.map(id => `<button type="button" class="rel-chip" data-cat="${id}" style="--c:${catMap[id].color}"><i></i>${esc(catMap[id].name)}</button>`).join("");
    legend.addEventListener("click", e => {
      const b = e.target.closest(".rel-chip"); if(!b) return;
      filter = b.dataset.cat; selected = null;
      legend.querySelectorAll(".rel-chip").forEach(x => x.classList.toggle("on", x === b));
      renderMonth(); renderList();
    });
  }

  function countdown(d){
    const days = Math.round((d - today) / 86400000);
    if(days === 0) return "Today";
    if(days === 1) return "Tomorrow";
    if(days > 1) return `In ${days} days`;
    return "Released";
  }

  // "Remind me": saved in this browser; a note pops up on any page the day before and on the day
  const getRem = () => { try{ return JSON.parse(localStorage.getItem("fv_remind")) || []; }catch(e){ return []; } };
  const reminded = id => getRem().some(x => x.id === id);
  document.addEventListener("click", e => {
    const b = e.target.closest(".rel-bell"); if(!b) return;
    const r = (data.releases || []).find(x => x.id === b.dataset.rid); if(!r) return;
    let rem = getRem();
    const on = !rem.some(x => x.id === r.id);
    rem = on ? rem.concat({ id: r.id, title: r.title, date: r.date }) : rem.filter(x => x.id !== r.id);
    try{ localStorage.setItem("fv_remind", JSON.stringify(rem)); }catch(err){}
    document.querySelectorAll(`.rel-bell[data-rid="${r.id}"]`).forEach(x => { x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); x.querySelector("span").textContent = on ? "Reminder set" : "Remind me"; });
    FV.showToast && FV.showToast(on ? `We'll remind you about "${r.title}".` : "Reminder removed.");
  });

  function item(r){
    const c = catMap[r.category], soon = Math.round((r.when - today) / 86400000);
    return `
      <div class="release-item" style="--rel-color:${c ? c.color : "var(--brand)"}">
        <div class="release-date"><span class="release-day-name">${r.when.toLocaleDateString([], { weekday: "short" })}</span><strong>${r.when.getDate()}</strong><span>${r.when.toLocaleDateString([], { month: "short" })}</span></div>
        <div class="release-info">
          <span class="release-meta">${icon(r.type, 13)}${esc(r.type)}${c ? ` · ${esc(c.name)}` : ""}</span>
          <strong>${esc(r.title)}</strong>
          ${r.platform ? `<small>${esc(r.platform)}</small>` : ""}
        </div>
        <div class="release-actions">
          <span class="release-count ${soon >= 0 && soon <= 7 ? "soon" : ""}">${countdown(r.when)}</span>
          ${r.when >= today ? `<button type="button" class="rel-bell ${reminded(r.id) ? "on" : ""}" data-rid="${r.id}" aria-pressed="${reminded(r.id)}" title="${reminded(r.id) ? "Reminder set" : "Remind me"}">${FV.gi ? FV.gi("bell", 14) : ""}<span>${reminded(r.id) ? "Reminder set" : "Remind me"}</span></button>` : ""}
        </div>
      </div>`;
  }

  function renderList(){
    const days = byDay();
    if(selected){
      const items = days[selected] || [];
      listTitle.textContent = parse(selected).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
      list.innerHTML = items.map(item).join("") || `<p class="search-empty">Nothing releases on this day.</p>`;
      showAll.classList.remove("hidden");
    }else{
      const up = shown().filter(r => r.when >= today);
      listTitle.textContent = filter === "all" ? "Next up" : `Next up in ${catMap[filter].name}`;
      list.innerHTML = (up.length ? up : shown()).slice(0, 6).map(item).join("") || `<p class="search-empty">No releases scheduled.</p>`;
      showAll.classList.toggle("hidden", filter === "all");
      showAll.textContent = filter === "all" ? "Show all upcoming" : "Show every fandom";
    }
  }

  function renderMonth(){
    const days = byDay();
    monthEl.textContent = view.toLocaleDateString([], { month: "long", year: "numeric" });
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;   // Monday-first grid
    const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    let inMonth = 0;
    const cells = [];
    for(let i = 0; i < offset; i++) cells.push(`<span class="release-day is-empty" aria-hidden="true"></span>`);
    for(let d = 1; d <= daysInMonth; d++){
      const date = new Date(view.getFullYear(), view.getMonth(), d);
      const k = key(date), items = days[k] || [];
      inMonth += items.length;
      const cls = ["release-day"];
      if(k === key(today)) cls.push("is-today");
      if(date < today) cls.push("is-past");
      if(items.length) cls.push("has-release");
      if(k === selected) cls.push("is-selected");
      const c = items[0] && catMap[items[0].category];
      const icons = items.slice(0, 2).map(r => `<b style="--c:${catMap[r.category] ? catMap[r.category].color : "var(--brand)"}">${icon(r.type, 14)}</b>`).join("") + (items.length > 2 ? `<small>+${items.length - 2}</small>` : "");
      const label = items.length ? `${date.toDateString()}: ${items.map(r => r.title).join(", ")}` : date.toDateString();
      cells.push(items.length
        ? `<button type="button" class="${cls.join(" ")}" data-day="${k}" aria-label="${esc(label)}" title="${esc(items.map(r => r.title).join(" · "))}" style="--c:${c ? c.color : "var(--brand)"}"><span class="release-num">${d}</span><em>${icons}</em></button>`
        : `<span class="${cls.join(" ")}" aria-label="${label}"><span class="release-num">${d}</span></span>`);
    }
    grid.innerHTML = cells.join("");
    if(monthCount) monthCount.textContent = inMonth ? `${inMonth} release${inMonth > 1 ? "s" : ""} this month` : "No releases this month";
  }

  grid.addEventListener("click", (e) => {
    const day = e.target.closest("[data-day]");
    if(!day) return;
    selected = selected === day.dataset.day ? null : day.dataset.day;
    renderMonth(); renderList();
  });
  const go = n => { view = new Date(view.getFullYear(), view.getMonth() + n, 1); renderMonth(); };
  document.getElementById("relPrev")?.addEventListener("click", () => go(-1));
  document.getElementById("relNext")?.addEventListener("click", () => go(1));
  document.getElementById("relToday")?.addEventListener("click", () => { view = new Date(today.getFullYear(), today.getMonth(), 1); selected = null; renderMonth(); renderList(); });
  showAll?.addEventListener("click", () => {
    selected = null;
    if(filter !== "all" && !showAll.textContent.startsWith("Show all")){ filter = "all"; legend && legend.querySelectorAll(".rel-chip").forEach(x => x.classList.toggle("on", x.dataset.cat === "all")); }
    renderMonth(); renderList();
  });

  renderMonth();
  renderList();
});
