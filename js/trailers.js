/* =========================================================
   FandomVerse — trailers.js
   Full trailer/media grid, filterable by category and type.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("trailerGridFull");
  if(!root) return;

  const data = await FV.data;
  const cats = data.categories || [];
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  const catFilters = document.getElementById("trailerCatFilters");
  const typeFilters = document.getElementById("trailerTypeFilters");
  let activeCat = "all", activeType = "all";

  function render(){
    const items = (data.trailers||[]).filter(t =>
      (activeCat === "all" || t.category === activeCat) && (activeType === "all" || t.type === activeType)
    );
    root.innerHTML = items.map(t => FV.renderTrailerCard(t, catMap)).join("") || `<p class="search-empty">No media matches these filters.</p>`;
    FV.markReveal && FV.markReveal(); FV.initReveal && FV.initReveal();
  }
  render();

  catFilters && catFilters.addEventListener("click", (e) => {
    const pill = e.target.closest(".filter-pill");
    if(!pill) return;
    catFilters.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    activeCat = pill.dataset.filter;
    render();
  });
  typeFilters && typeFilters.addEventListener("click", (e) => {
    const pill = e.target.closest(".filter-pill");
    if(!pill) return;
    typeFilters.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    activeType = pill.dataset.filter;
    render();
  });
});
