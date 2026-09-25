/* =========================================================
   FandomVerse — events.js
   Full event timeline, filterable by category.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("eventTimelineFull");
  if(!root) return;

  const data = await FV.data;
  const cats = data.categories || [];
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  const filters = document.getElementById("eventFilters");

  function render(filter = "all"){
    const items = [...(data.events||[])]
      .filter(e => filter === "all" || e.category === filter)
      .sort((a,b) => new Date(a.date) - new Date(b.date));
    root.innerHTML = items.map(e => FV.renderEventRow(e, catMap)).join("") || `<p class="search-empty">No events in this category.</p>`;
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
});
