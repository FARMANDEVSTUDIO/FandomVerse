/* =========================================================
   FandomVerse — poster-marquee.js
   Diagonal wall of poster cards: five tilted rows scrolling in
   alternating directions. Uses images listed in data/posters.json
   (files in assets/images/posters/); when that list is empty it
   falls back to generated posters for our own fictional titles.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const wall = document.getElementById("posterWall");
  if(!wall || !window.FV) return;

  const data = await FV.data;
  const cats = data.categories || [];
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  const base = (window.FV_BASE || "") + "assets/images/posters/";

  const custom = await fetch((window.FV_BASE || "") + "data/posters.json", { cache: "no-store" })
    .then(r => r.ok ? r.json() : []).catch(() => []);

  // Every image in assets/images/posters/ becomes a poster. Title and category come from
  // data/posters.json when listed there, otherwise from the filename ("kpop-lunaris-tour.png").
  const meta = Object.fromEntries((custom || []).filter(p => p && p.file).map(p => [p.file.toLowerCase(), p]));
  // posters live in category subfolders: assets/images/posters/anime/..., /movies/... etc.
  const files = FV.folderImagesByCategory ? await FV.folderImagesByCategory("posters", cats.map(c => c.id)) : null;
  const source = files ? files : (custom || []).filter(p => p && p.file);
  let posters = source.map((p, i) => {
    const m = meta[p.file.toLowerCase()] || {};
    const category = p.category || m.category || "";
    const fileName = p.name || p.file.split("/").pop();
    const title = m.title || (FV.titleFromFile ? FV.titleFromFile(fileName, category) : "");
    const img = base + p.file.split("/").map(encodeURIComponent).join("/");
    return { id: "custom-" + i, img, title, category, label: m.label || "Poster", file: fileName };
  });

  if(!posters.length){
    const fromTrailers = (data.trailers || []).map(t => ({ id: t.id, title: t.title, category: t.category, label: t.type || "Trailer" }));
    const fromArticles = (data.articles || []).map(a => ({ id: a.id, title: a.title, category: a.category, label: "Feature" }));
    // interleave so the same category rarely sits twice in a row
    posters = [];
    const n = Math.max(fromTrailers.length, fromArticles.length);
    for(let i = 0; i < n; i++){
      if(fromTrailers[i]) posters.push(fromTrailers[i]);
      if(fromArticles[i]) posters.push(fromArticles[i]);
    }
  }
  if(!posters.length) return;

  function card(p){
    const c = catMap[p.category];
    const color = c ? c.color : "#e8382f";
    const color2 = c ? c.color2 : "#f4c430";
    const art = p.img
      ? `<img src="${FV.escapeHtml(p.img)}" alt="${FV.escapeHtml(p.title)}" loading="lazy" draggable="false">`
      : FV.poster(p.id, color, color2, p.title).replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ');
    // image posters open their category's Posters tab with this poster featured
    const href = c
      ? `category.html?cat=${encodeURIComponent(p.category)}${p.img && p.file ? `&poster=${encodeURIComponent(p.file)}` : ""}`
      : "#categories";
    return `
      <a class="wall-poster" href="${href}" style="--poster-accent:${color}">
        <span class="wall-poster-art">${art}</span>
        <span class="wall-poster-label">${FV.escapeHtml(p.label)}</span>
        <span class="wall-poster-info">
          ${c ? `<span class="wall-poster-cat">${FV.escapeHtml(c.name)}</span>` : ""}
          ${p.title ? `<strong>${FV.escapeHtml(p.title)}</strong>` : ""}
        </span>
      </a>`;
  }

  const ROWS = 5;
  const baseSpeed = 120;
  const speeds = [baseSpeed, baseSpeed - 15, baseSpeed + 15, baseSpeed - 6, baseSpeed + 24];

  wall.innerHTML = Array.from({ length: ROWS }, (_, r) => {
    // each row starts at a different poster so rows don't line up
    const shift = (r * 5) % posters.length;
    let row = posters.slice(shift).concat(posters.slice(0, shift));
    if(r % 2 === 1) row = row.reverse();
    while(row.length < 12) row = row.concat(row);
    const set = row.map(card).join("");
    const dir = r % 2 === 0 ? "left" : "right";
    return `
      <div class="wall-row">
        <div class="wall-track wall-${dir}" style="--speed:${speeds[r]}s">
          <div class="wall-set">${set}</div>
          <div class="wall-set" aria-hidden="true">${set}</div>
        </div>
      </div>`;
  }).join("");

  // duplicated set is for the seamless loop only; keep it out of tab order
  wall.querySelectorAll('.wall-set[aria-hidden="true"] a').forEach(a => a.setAttribute("tabindex", "-1"));
});
