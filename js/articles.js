/* =========================================================
   FandomVerse — articles.js
   Full article listing (filterable) or single reading view (?id=).
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const listRoot = document.getElementById("articleGridFull");
  const readRoot = document.getElementById("articleReader");
  if(!listRoot && !readRoot) return;

  const data = await FV.data;
  const cats = data.categories || [];
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const listSection = document.getElementById("articleListSection");
  const readerSection = document.getElementById("articleReaderSection");

  if(id && readRoot){
    if(listSection) listSection.classList.add("hidden");
    if(readerSection) readerSection.classList.remove("hidden");
    const article = (data.articles||[]).find(a => a.id === id);
    if(!article){ readRoot.innerHTML = `<p class="search-empty">Article not found.</p>`; return; }
    const c = catMap[article.category];
    document.title = `${article.title} — FandomVerse`;
    document.documentElement.style.setProperty("--cat", c.color);
    document.documentElement.style.setProperty("--cat-2", c.color2);
    document.getElementById("crumbCurrent").textContent = article.title;

    const related = (data.articles||[]).filter(a => a.category === article.category && a.id !== article.id).slice(0,3);
    const bookmarked = FV.isBookmarked("article", article.id);

    readRoot.innerHTML = `
      <div class="poster" style="border-radius:var(--radius-lg);margin-bottom:2rem">${FV.poster(article.id, c.color, c.color2, article.title)}${FV.slotImg("articles", article.id, article.title)}<span class="poster-badge">${c.name}</span></div>
      <div class="article-cat">${c.name} · ${article.readTime} · ${new Date(article.date).toLocaleDateString([], {month:"long", day:"numeric", year:"numeric"})}</div>
      <h1 style="font-size:clamp(1.7rem,3.4vw,2.6rem);margin:.6rem 0 1.2rem">${FV.escapeHtml(article.title)}</h1>
      <button class="btn btn-outline btn-sm bookmark-btn ${bookmarked?"bookmarked":""}" data-bookmark-type="article" data-bookmark-id="${article.id}" data-bookmark-title="${FV.escapeHtml(article.title)}" style="margin-bottom:1.6rem">${FV.icon(bookmarked?"bookmarkFilled":"bookmark",15)} ${bookmarked?"Bookmarked":"Bookmark"}</button>
      <p style="font-size:1.08rem;color:var(--ink-soft);line-height:1.8">${FV.escapeHtml(article.excerpt)}</p>
      ${(article.body || []).map(p => `<p style="font-size:1rem;color:var(--ink-soft);line-height:1.85">${FV.escapeHtml(p)}</p>`).join("")}
      ${related.length ? `
        <h3 style="margin-top:2.5rem;font-size:1.1rem">More from ${c.name}</h3>
        <div class="article-grid" style="margin-top:1rem">${related.map(a => FV.renderArticleCard(a, catMap)).join("")}</div>
      ` : ""}
    `;
    FV.wireArticleCardClicks(readRoot);
    return;
  }

  if(listRoot){
    const filters = document.getElementById("articleFilters");
    function render(filter = "all"){
      const items = (data.articles||[]).filter(a => filter === "all" || a.category === filter);
      listRoot.innerHTML = items.map(a => FV.renderArticleCard(a, catMap)).join("") || `<p class="search-empty">No articles in this category.</p>`;
      FV.wireArticleCardClicks(listRoot);
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
  }
});
