/* =========================================================
   FandomVerse — releases.js
   Upcoming releases calendar: month grid with a coloured dot per
   release, month navigation, and a side list that shows either the
   next upcoming releases or everything on the selected day.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("relGrid");
  const monthEl = document.getElementById("relMonth");
  const list = document.getElementById("relList");
  const listTitle = document.getElementById("relListTitle");
  const showAll = document.getElementById("relShowAll");
  const legend = document.getElementById("relLegend");
  if(!grid || !monthEl || !list) return;

  const data = await FV.data;
  const catMap = Object.fromEntries((data.categories || []).map(c => [c.id, c]));

  // parse "YYYY-MM-DD" as a local date so it never shifts a day across timezones
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const releases = (data.releases || []).map(r => ({ ...r, when: parse(r.date) })).sort((a, b) => a.when - b.when);
  const byDay = {};
  releases.forEach(r => (byDay[key(r.when)] ||= []).push(r));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = releases.filter(r => r.when >= today);
  const start = (upcoming[0] || releases[0] || { when: today }).when;
  let view = new Date(start.getFullYear(), start.getMonth(), 1);
  let selected = null;

  if(legend){
    const used = [...new Set(releases.map(r => r.category))];
    legend.innerHTML = used.map(id => catMap[id]
      ? `<span><i style="background:${catMap[id].color}"></i>${FV.escapeHtml(catMap[id].name)}</span>` : "").join("");
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
    let list = getRem();
    const on = !list.some(x => x.id === r.id);
    list = on ? list.concat({ id: r.id, title: r.title, date: r.date }) : list.filter(x => x.id !== r.id);
    try{ localStorage.setItem("fv_remind", JSON.stringify(list)); }catch(err){}
    document.querySelectorAll(`.rel-bell[data-rid="${r.id}"]`).forEach(x => { x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); x.querySelector("span").textContent = on ? "Reminder set" : "Remind me"; });
    FV.showToast && FV.showToast(on ? `We'll remind you about "${r.title}".` : "Reminder removed.");
  });
  function item(r){
    const c = catMap[r.category];
    return `
      <div class="release-item" style="--rel-color:${c ? c.color : "var(--brand)"}">
        <div class="release-date"><strong>${r.when.getDate()}</strong><span>${r.when.toLocaleDateString([], { month: "short" })}</span></div>
        <div class="release-info">
          <span class="release-meta">${FV.escapeHtml(r.type)}${c ? ` · ${FV.escapeHtml(c.name)}` : ""}</span>
          <strong>${FV.escapeHtml(r.title)}</strong>
          <small>${FV.escapeHtml(r.platform || "")}</small>
        </div>
        <span class="release-count">${countdown(r.when)}</span>
        ${r.when >= today ? `<button type="button" class="rel-bell ${reminded(r.id) ? "on" : ""}" data-rid="${r.id}" aria-pressed="${reminded(r.id)}" title="${reminded(r.id) ? "Reminder set" : "Remind me"}">${FV.gi ? FV.gi("bell", 14) : ""}<span>${reminded(r.id) ? "Reminder set" : "Remind me"}</span></button>` : ""}
      </div>`;
  }

  function renderList(){
    if(selected){
      const items = byDay[selected] || [];
      listTitle.textContent = parse(selected).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
      list.innerHTML = items.map(item).join("") || `<p class="search-empty">Nothing releases on this day.</p>`;
      showAll.classList.remove("hidden");
    }else{
      listTitle.textContent = "Next up";
      list.innerHTML = (upcoming.length ? upcoming : releases).slice(0, 6).map(item).join("") || `<p class="search-empty">No releases scheduled.</p>`;
      showAll.classList.add("hidden");
    }
  }

  function renderMonth(){
    monthEl.textContent = view.toLocaleDateString([], { month: "long", year: "numeric" });
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // Monday-first grid
    const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const cells = [];
    for(let i = 0; i < offset; i++) cells.push(`<span class="release-day is-empty" aria-hidden="true"></span>`);
    for(let d = 1; d <= daysInMonth; d++){
      const date = new Date(view.getFullYear(), view.getMonth(), d);
      const k = key(date);
      const items = byDay[k] || [];
      const cls = ["release-day"];
      if(k === key(today)) cls.push("is-today");
      if(items.length) cls.push("has-release");
      if(k === selected) cls.push("is-selected");
      const dots = items.map(r => `<i style="background:${catMap[r.category] ? catMap[r.category].color : "var(--brand)"}"></i>`).join("");
      const label = items.length ? `${date.toDateString()}: ${items.map(r => r.title).join(", ")}` : date.toDateString();
      cells.push(items.length
        ? `<button type="button" class="${cls.join(" ")}" data-day="${k}" aria-label="${FV.escapeHtml(label)}"><span>${d}</span><em>${dots}</em></button>`
        : `<span class="${cls.join(" ")}" aria-label="${label}"><span>${d}</span></span>`);
    }
    grid.innerHTML = cells.join("");
  }

  grid.addEventListener("click", (e) => {
    const day = e.target.closest("[data-day]");
    if(!day) return;
    selected = selected === day.dataset.day ? null : day.dataset.day;
    renderMonth(); renderList();
  });
  document.getElementById("relPrev")?.addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderMonth(); });
  document.getElementById("relNext")?.addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderMonth(); });
  showAll?.addEventListener("click", () => { selected = null; renderMonth(); renderList(); });

  renderMonth();
  renderList();
});
