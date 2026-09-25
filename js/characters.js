/* =========================================================
   FandomVerse — characters.js
   Full character listing, filterable by category, plus the
   "3D models" tab for characters that have a
   real 3D model (any character with a `model` in characters.json).
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("characterGridFull");
  if(!root) return;

  const data = await FV.data;
  const cats = data.categories || [];
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  const filters = document.getElementById("characterFilters");
  const esc = s => FV.escapeHtml(String(s ?? ""));

  function render(filter = "all"){
    const items = (data.characters||[]).filter(c => filter === "all" || c.category === filter);
    root.innerHTML = items.map(c => FV.renderCharacterCard(c, catMap)).join("") || `<p class="search-empty">No characters in this category.</p>`;
    FV.markReveal && FV.markReveal(); FV.initReveal && FV.initReveal();
  }
  render();

  filters && filters.addEventListener("click", (e) => {
    const pill = e.target.closest(".filter-pill");
    if(!pill) return;
    filters.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    render(pill.dataset.filter);
  });

  /* ---------- 3D Collection ---------- */
  const lux = (data.characters || []).filter(c => c.model || (c.models && c.models.length));
  const tabs = document.getElementById("viewTabs");
  const viewAll = document.getElementById("viewAll");
  const view3d = document.getElementById("view3d");
  const grid = document.getElementById("lux3dGrid");
  const count = document.getElementById("lux3dCount");
  if(!tabs || !grid) return;
  count.textContent = lux.length;
  if(!lux.length){ tabs.hidden = true; return; }

  const base = (window.FV_BASE || "") + "assets/images/characters/";
  // each card turns through its cut-out views on hover: front, 3/4, side, back, and mirrored back round
  const TURN = [["front", false], ["34", false], ["side", false], ["back", false], ["side", true], ["34", true]];
  grid.innerHTML = lux.map((c, i) => {
    const cat = catMap[c.category] || {};
    const color = (c.model && c.model.color) || c.color3d || cat.color || "#e8382f";
    return `
      <a class="v3d-card" href="character.html?id=${encodeURIComponent(c.id)}" style="--c:${esc(color)};--i:${i}" data-id="${esc(c.id)}">
        <span class="v3d-inner">
          <span class="v3d-glow" aria-hidden="true"></span>
          <span class="lux-figure">
            ${TURN.map(([v, flip], k) => `<img src="${base}full/${c.id}-${v}.png" alt="${k ? "" : esc(c.name)}" loading="lazy" draggable="false" class="${k ? "" : "is-on"}${flip ? " is-flip" : ""}" onerror="this.remove()">`).join("")}
            <img class="lux-fallback" src="${base}${c.id}.jpg" alt="${esc(c.name)}" loading="lazy" onerror="this.remove()">
          </span>
          <span class="v3d-label">
            <span class="v3d-series">${esc(c.series)}</span>
            <span class="v3d-name">${esc(c.name)}</span>
          </span>
        </span>
      </a>`;
  }).join("");

  // the photo is only a fallback: it shows when the front cut-out is missing, never while it loads
  grid.querySelectorAll(".lux-figure").forEach(fig => {
    const front = fig.querySelector("img.is-on:not(.lux-fallback)");
    const none = () => fig.classList.add("no-views");
    if(!front) return none();
    if(front.complete && !front.naturalWidth) return none();
    front.addEventListener("error", none);
    // fade the figure in once the whole picture is there (no half-drawn image while loading)
    const ready = () => fig.classList.add("ready");
    if(front.complete && front.naturalWidth) ready(); else front.addEventListener("load", ready);
  });

  // hover = slow turntable through the views
  grid.querySelectorAll(".v3d-card").forEach(card => {
    let t = null, k = 0;
    const step = () => {
      const imgs = card.querySelectorAll(".lux-figure img:not(.lux-fallback)");
      if(imgs.length < 2) return;
      k = (k + 1) % imgs.length;
      imgs.forEach((im, n) => im.classList.toggle("is-on", n === k));
    };
    let warmed = false;
    card.addEventListener("pointerenter", () => {
      clearInterval(t); t = setInterval(step, 260);
      // start fetching the 3D model on hover, so the stage opens with it ready
      if(!warmed){
        warmed = true;
        const ch = lux.find(x => x.id === card.dataset.id);
        const v = ch && ((ch.models && ch.models[0]) || ch.model);
        if(v){ const l = document.createElement("link"); l.rel = "prefetch"; l.href = `${window.FV_BASE || ""}assets/models/${v.file || ch.id + ".glb"}`; document.head.appendChild(l); }
      }
    });
    card.addEventListener("pointerleave", () => {
      clearInterval(t);
      k = 0;
      card.querySelectorAll(".lux-figure img:not(.lux-fallback)").forEach((im, n) => im.classList.toggle("is-on", n === 0));
    });
  });

  function showView(v){
    const is3d = v === "3d";
    tabs.querySelectorAll(".view-tab").forEach(b => {
      const on = b.dataset.view === v;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    viewAll.hidden = is3d;
    view3d.hidden = !is3d;
    document.body.classList.toggle("lux-mode", is3d);
    history.replaceState(null, "", is3d ? "#3d" : location.pathname + location.search);
  }
  tabs.addEventListener("click", e => {
    const b = e.target.closest(".view-tab");
    if(b) showView(b.dataset.view);
  });
  if(location.hash === "#3d") showView("3d");
});
