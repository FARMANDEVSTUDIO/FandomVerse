/* =========================================================
   FandomVerse — category.js
   Dynamic category hub: category.html?cat=anime
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("categoryRoot");
  if(!root) return;

  const params = new URLSearchParams(window.location.search);
  const catId = params.get("cat") || "anime";
  const data = await FV.data;
  const cats = data.categories || [];
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  const cat = catMap[catId] || cats[0];

  document.documentElement.style.setProperty("--cat", cat.color);
  document.documentElement.style.setProperty("--cat-2", cat.color2);
  document.title = `${cat.name} — FandomVerse`;

  document.getElementById("catIcon").innerHTML = FV.icon(cat.id, 30);
  document.getElementById("catName").textContent = cat.name;
  document.getElementById("catTagline").textContent = cat.tagline;
  document.getElementById("crumbCurrent").textContent = cat.name;

  FV.heroFor(catId).then(hero => {
    const photoEl = document.getElementById("catHeroPhoto");
    if(hero && photoEl){
      const img = new Image();
      img.onload = () => {
        photoEl.style.backgroundImage = `url('${hero.src}')`;
        photoEl.classList.add("loaded");
      };
      img.src = hero.src;
    }
  });

  const articles = (data.articles||[]).filter(a => a.category === catId);
  const characters = (data.characters||[]).filter(c => c.category === catId);
  const events = (data.events||[]).filter(e => e.category === catId);
  const trailers = (data.trailers||[]).filter(t => t.category === catId);
  const merch = (data.merchandise||[]).filter(m => m.category === catId);

  document.getElementById("catStatArticles").textContent = articles.length;
  document.getElementById("catStatCharacters").textContent = characters.length;
  document.getElementById("catStatEvents").textContent = events.length;

  const articleGrid = document.getElementById("catArticles");
  const articleSort = document.getElementById("articleSort");
  function renderArticles(mode){
    let list = [...articles];
    if(mode === "newest") list.sort((a,b) => new Date(b.date) - new Date(a.date));
    else if(mode === "az") list.sort((a,b) => a.title.localeCompare(b.title));
    articleGrid.innerHTML = list.map(a => FV.renderArticleCard(a, catMap)).join("") || `<p class="search-empty">No articles yet in this category.</p>`;
    FV.wireArticleCardClicks(articleGrid);
  }
  renderArticles("featured");
  articleSort && articleSort.addEventListener("change", () => renderArticles(articleSort.value));

  const charGrid = document.getElementById("catCharacters");
  charGrid.innerHTML = characters.map(c => FV.renderCharacterCard(c, catMap)).join("") || `<p class="search-empty">No character profiles yet.</p>`;

  const eventList = document.getElementById("catEvents");
  eventList.innerHTML = events.map(e => FV.renderEventRow(e, catMap)).join("") || `<p class="search-empty">No events scheduled yet.</p>`;

  const trailerGrid = document.getElementById("catTrailers");
  trailerGrid.innerHTML = trailers.map(t => FV.renderTrailerCard(t, catMap)).join("") || `<p class="search-empty">No trailers yet.</p>`;

  const merchGrid = document.getElementById("catMerch");
  merchGrid.innerHTML = merch.map(m => FV.renderMerchCard(m, catMap)).join("") || `<p class="search-empty">No merchandise yet.</p>`;
  FV.wireMerchAdd(merchGrid, data.merchandise || []);
  FV.applyMerchPhotos(merchGrid);

  const galleryGrid = document.getElementById("catGallery");
  const galleryPhotos = await FV.galleryFor(catId);
  if(galleryGrid){
    galleryGrid.innerHTML = galleryPhotos.map((p, i) => `
      <button class="photo-tile" data-idx="${i}" type="button">
        <img src="${p.src}" alt="${FV.escapeHtml(p.alt)}" loading="lazy">
        <span class="photo-caption">${FV.escapeHtml(p.title || "")}</span>
      </button>
    `).join("") || `<p class="search-empty">No gallery photos yet.</p>`;
    FV.initLightbox(galleryGrid, galleryPhotos);
  }

  /* other categories row */
  const otherCats = document.getElementById("otherCategories");
  if(otherCats){
    otherCats.innerHTML = cats.filter(c => c.id !== catId).map(c => `
      <a class="cat-chip" href="category.html?cat=${c.id}" style="--chip-color:${c.color}">
        <span class="cat-chip-icon">${FV.icon(c.id, 22)}</span>
        <span class="cat-chip-name">${c.name}</span>
      </a>
    `).join("");
  }

  /* tabs */
  const tabs = document.querySelectorAll(".cat-tab");
  const panels = document.querySelectorAll(".cat-panel");
  tabs.forEach(tab => tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    panels.forEach(p => p.classList.add("hidden"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.panel).classList.remove("hidden");
  }));

  /* posters from assets/images/posters/<category>/ (same files as the homepage poster wall) */
  const posterTab = document.getElementById("tabPosters");
  const posterGrid = document.getElementById("catPosters");
  const posterFeature = document.getElementById("posterFeature");
  const posterNames = FV.slotListing ? await FV.slotListing("posters/" + catId) : null;
  const posterFiles = (posterNames || [])
    .filter(n => !n.endsWith("/") && FV_SLOT_EXTS.includes(n.split(".").pop().toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  if(posterTab && posterGrid && posterFiles.length){
    const posterBase = (window.FV_BASE || "") + "assets/images/posters/" + encodeURIComponent(catId) + "/";
    const posters = posterFiles.map(f => ({ file: f, src: posterBase + encodeURIComponent(f), title: FV.titleFromFile(f, catId) }));
    posterTab.classList.remove("hidden");
    posterTab.textContent = `Posters (${posters.length})`;
    posterGrid.innerHTML = posters.map((p, i) => `
      <button class="poster-tile" type="button" data-poster="${i}">
        <img src="${p.src}" alt="${FV.escapeHtml(p.title)}" loading="lazy">
        <span>${FV.escapeHtml(p.title)}</span>
      </button>`).join("");

    function feature(i, scroll){
      const p = posters[i];
      if(!p) return;
      posterFeature.classList.remove("hidden");
      posterFeature.innerHTML = `
        <div class="poster-feature-art"><img src="${p.src}" alt="${FV.escapeHtml(p.title)}"></div>
        <div class="poster-feature-info">
          <span class="char-cat-pill">${FV.escapeHtml(cat.name)}</span>
          <h2>${FV.escapeHtml(p.title)}</h2>
          <p>From the FandomVerse poster wall · ${FV.escapeHtml(cat.name)} collection</p>
          <div class="poster-feature-actions">
            <a class="btn btn-primary" href="${p.src}" target="_blank" rel="noopener">View full size</a>
            <a class="btn btn-outline" href="index.html">Back to poster wall</a>
          </div>
        </div>`;
      posterGrid.querySelectorAll(".poster-tile").forEach(t => t.classList.toggle("is-active", Number(t.dataset.poster) === i));
      if(scroll) posterFeature.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    posterGrid.addEventListener("click", e => {
      const t = e.target.closest(".poster-tile");
      if(t) feature(Number(t.dataset.poster), true);
    });

    const wanted = params.get("poster");
    if(wanted){
      const i = posters.findIndex(p => p.file.toLowerCase() === wanted.toLowerCase());
      posterTab.click();
      feature(i >= 0 ? i : 0, false);
      setTimeout(() => document.querySelector(".cat-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    }
  }

  FV.markReveal && FV.markReveal();
  FV.initReveal && FV.initReveal();
});
