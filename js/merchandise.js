/* =========================================================
   FandomVerse — merchandise.js
   Full merchandise grid, filterable by category, add to cart.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("merchGridFull");
  if(!root) return;

  const data = await FV.data;
  const cats = data.categories || [];
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  const filters = document.getElementById("merchFilters");

  let current = "all";
  const q = document.getElementById("merchSearch"), sort = document.getElementById("merchSort"), wishOnly = document.getElementById("merchWishOnly");
  function render(filter = current){
    current = filter;
    const words = (q && q.value.trim().toLowerCase()) || "";
    const wish = FV.getWish();
    let items = (data.merchandise||[]).filter(m => (filter === "all" || m.category === filter)
      && (!words || (m.name + " " + m.description).toLowerCase().includes(words))
      && (!wishOnly || !wishOnly.classList.contains("on") || wish.includes(m.id)));
    const by = sort ? sort.value : "featured";
    if(by === "low") items = items.slice().sort((a, b) => a.price - b.price);
    if(by === "high") items = items.slice().sort((a, b) => b.price - a.price);
    if(by === "rated") items = items.slice().sort((a, b) => FV.merchExtras(b).rating - FV.merchExtras(a).rating);
    if(by === "sale") items = items.slice().sort((a, b) => FV.merchExtras(b).off - FV.merchExtras(a).off);
    root.innerHTML = items.map(m => FV.renderMerchCard(m, catMap)).join("") || `<p class="search-empty">No merchandise in this category.</p>`;
    FV.wireMerchAdd(root, data.merchandise || []);
    FV.applyMerchPhotos(root);
    FV.markReveal && FV.markReveal(); FV.initReveal && FV.initReveal();
  }
  render();
  q && q.addEventListener("input", () => render());
  sort && sort.addEventListener("change", () => render());
  wishOnly && wishOnly.addEventListener("click", () => { wishOnly.classList.toggle("on"); wishOnly.setAttribute("aria-pressed", wishOnly.classList.contains("on")); render(); });
  root.addEventListener("click", e => {
    const b = e.target.closest(".merch-wish"); if(!b) return;
    const on = FV.toggleWish(b.dataset.wish);
    b.classList.toggle("on", on); b.setAttribute("aria-pressed", on);
    FV.showToast && FV.showToast(on ? "Saved to your wishlist." : "Removed from your wishlist.");
    if(!on && wishOnly && wishOnly.classList.contains("on")) render();
  });

  filters && filters.addEventListener("click", (e) => {
    const pill = e.target.closest(".filter-pill");
    if(!pill) return;
    filters.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    render(pill.dataset.filter);
  });
});
