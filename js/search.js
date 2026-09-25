/* =========================================================
   FandomVerse — search.js
   Global client-side search across articles, characters, events,
   trailers, merchandise, and static pages.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const searchToggle = document.getElementById("searchToggle");
  const searchPanel = document.getElementById("searchPanel");
  const searchClose = document.getElementById("searchClose");
  const searchInput = document.getElementById("globalSearch");
  const searchResults = document.getElementById("searchResults");
  if(!searchToggle || !searchPanel) return;

  const base = window.FV_BASE || "";

  function openSearch(){ searchPanel.classList.add("open"); searchPanel.setAttribute("aria-hidden","false"); searchToggle.setAttribute("aria-expanded","true"); setTimeout(() => searchInput.focus(), 220); }
  function closeSearch(){ searchPanel.classList.remove("open"); searchPanel.setAttribute("aria-hidden","true"); searchToggle.setAttribute("aria-expanded","false"); }
  searchToggle.addEventListener("click", () => searchPanel.classList.contains("open") ? closeSearch() : openSearch());
  searchClose && searchClose.addEventListener("click", closeSearch);
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") closeSearch();
    if((e.ctrlKey || e.metaKey) && e.key === "/"){ e.preventDefault(); openSearch(); }
  });

  const data = await FV.data;
  const cats = data.categories || [];
  const catName = Object.fromEntries(cats.map(c => [c.id, c.name]));
  const index = [];
  (data.articles || []).forEach(a => index.push({ type: "Article", cat: a.category, title: a.title, sub: a.excerpt, href: `${base}articles.html?id=${a.id}` }));
  (data.characters || []).forEach(c => index.push({ type: "Character", cat: c.category, title: c.name, sub: c.series, href: `${base}characters.html?id=${c.id}` }));
  (data.events || []).forEach(e => index.push({ type: "Event", cat: e.category, title: e.title, sub: e.location, href: `${base}events.html?id=${e.id}` }));
  (data.trailers || []).forEach(t => index.push({ type: "Trailer", cat: t.category, title: t.title, sub: t.description, href: `${base}trailers.html?id=${t.id}` }));
  (data.merchandise || []).forEach(m => index.push({ type: "Merch", cat: m.category, title: m.name, sub: m.description, href: `${base}merchandise.html?id=${m.id}` }));
  (data.releases || []).forEach(r => index.push({ type: "Release", cat: r.category, title: r.title, sub: `${r.type} · ${r.date}`, href: `${base}events.html#releases` }));
  cats.forEach(c => index.push({ type: "Category", cat: c.id, title: c.name, sub: c.tagline, href: `${base}category.html?cat=${c.id}` }));
  ["Home","About","Contact","Articles","Characters","Events","Trailers","Merchandise"].forEach(p => {
    index.push({ type: "Page", cat: "", title: p, href: `${base}${p.toLowerCase() === "home" ? "index" : p.toLowerCase()}.html` });
  });

  // filter pills, injected once so every page's search panel gets them
  const types = ["Article", "Character", "Event", "Release", "Trailer", "Merch"];
  let activeCat = "all", activeType = "all";
  const filterWrap = document.createElement("div");
  filterWrap.className = "search-filters";
  filterWrap.innerHTML = `
    <div class="search-filter-row" data-group="cat" role="group" aria-label="Filter by category">
      <span class="search-filter-label">Category</span>
      <button type="button" class="search-chip active" data-value="all">All</button>
      ${cats.map(c => `<button type="button" class="search-chip" data-value="${c.id}">${FV.escapeHtml(c.name)}</button>`).join("")}
    </div>
    <div class="search-filter-row" data-group="type" role="group" aria-label="Filter by content type">
      <span class="search-filter-label">Type</span>
      <button type="button" class="search-chip active" data-value="all">All</button>
      ${types.map(t => `<button type="button" class="search-chip" data-value="${t}">${t === "Merch" ? "Merchandise" : t + "s"}</button>`).join("")}
    </div>
    <p class="search-count" id="searchCount" aria-live="polite"></p>`;
  searchPanel.insertBefore(filterWrap, searchResults);
  const countEl = filterWrap.querySelector("#searchCount");

  filterWrap.addEventListener("click", (e) => {
    const chip = e.target.closest(".search-chip");
    if(!chip) return;
    const row = chip.closest(".search-filter-row");
    row.querySelectorAll(".search-chip").forEach(b => b.classList.toggle("active", b === chip));
    if(row.dataset.group === "cat") activeCat = chip.dataset.value;
    else activeType = chip.dataset.value;
    runSearch();
  });

  function runSearch(){
    const q = searchInput.value.trim().toLowerCase();
    searchResults.innerHTML = "";
    const filtering = activeCat !== "all" || activeType !== "all";
    if(!q && !filtering){ countEl.textContent = ""; return; }
    const matches = index.filter(item =>
      (activeCat === "all" || item.cat === activeCat) &&
      (activeType === "all" || item.type === activeType) &&
      (!q || item.title.toLowerCase().includes(q) || (item.sub && item.sub.toLowerCase().includes(q)))
    );
    countEl.textContent = matches.length ? `${matches.length} result${matches.length === 1 ? "" : "s"}${matches.length > 20 ? " (showing 20)" : ""}` : "";
    if(!matches.length){
      searchResults.innerHTML = `<p class="search-empty">No matches${q ? ` for "${FV.escapeHtml(searchInput.value)}"` : ""} with these filters.</p>`;
      return;
    }
    searchResults.innerHTML = matches.slice(0, 20).map(m => `
      <a class="search-result" href="${m.href}">
        <span>${m.type}${m.cat && catName[m.cat] && m.type !== "Category" ? ` · ${FV.escapeHtml(catName[m.cat])}` : ""}</span>${FV.escapeHtml(m.title)}
      </a>`).join("");
  }
  searchInput.addEventListener("input", runSearch);
});
