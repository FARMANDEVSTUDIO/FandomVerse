/* =========================================================
   FandomVerse — home.js
   Renders: category grid, hero card stack, featured articles,
   popular characters, event highlights, featured merchandise.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const data = await FV.data;
  const cats = data.categories || [];
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));

  const heroRotate = document.getElementById("heroRotate");
  if(heroRotate && cats.length){
    FV.typewriterRotate(heroRotate, cats.map(c => c.name.toLowerCase()));
  }

  /* ---------- rotating banner — reads filenames from data/banners.json ----------
     Two stacked <img> layers: the base layer always stays visible, and the
     top layer fades in over it, so there's never a blank frame mid-swap.
     To add a banner: drop the image into assets/images/banners/ and add its
     filename to data/banners.json — any filename works, no naming pattern needed. */
  const bannerImg = document.getElementById("bannerImage");
  const bannerImgB = document.getElementById("bannerImageB");
  if(bannerImg && bannerImgB){
    const bannerBase = (window.FV_BASE || "") + "assets/images/banners/";
    fetch((window.FV_BASE || "") + "data/banners.json", { cache: "no-store" })
      .then(r => r.ok ? r.json() : [])
      .catch(() => [])
      .then((files) => {
        // cache-bust so a replaced file with the same name shows up without a hard refresh
        const stamp = Date.now();
        const slides = (files || []).map(f => `${bannerBase}${encodeURIComponent(f)}?t=${stamp}`);
        if(!slides.length) return;
        bannerImg.src = slides[0];
        let idx = 0;
        if(slides.length < 2) return;
        setInterval(() => {
          // skip swaps nobody can see (tab hidden or banner scrolled away)
          if(document.hidden || bannerImg.classList.contains("fx-offscreen")) return;
          idx = (idx + 1) % slides.length;
          bannerImgB.src = slides[idx];
          requestAnimationFrame(() => { bannerImgB.style.opacity = "1"; });
          setTimeout(() => {
            bannerImg.src = slides[idx];
            bannerImgB.style.opacity = "0";
          }, 800);
        }, 3800);
      });
  }

  const catGrid = document.getElementById("catGrid");
  if(catGrid){
    catGrid.innerHTML = cats.map(c => `
      <a class="cat-chip" href="category.html?cat=${c.id}" style="--chip-color:${c.color}">
        <span class="cat-chip-photo" id="chipPhoto-${c.id}"></span>
        <span class="cat-chip-icon">${FV.icon(c.id, 24)}</span>
        <span class="cat-chip-name">${c.name}</span>
        <span class="cat-chip-count">${(data.articles||[]).filter(a=>a.category===c.id).length} stories</span>
      </a>
    `).join("");

    // chip photo = the category's first article image (assets/images/articles/<id>.jpg|png|webp),
    // falling back to the category hero photo when that article has no image
    const loads = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(src); im.onerror = () => ok(null); im.src = src; });
    FV.assets.then(assets => {
      cats.forEach(async c => {
        const slot = document.getElementById(`chipPhoto-${c.id}`);
        if(!slot) return;
        const article = (data.articles || []).find(a => a.category === c.id);
        let src = null;
        if(article){
          for(const ext of ["jpg", "png", "webp"]){
            src = await loads(`${window.FV_BASE || ""}assets/images/articles/${article.id}.${ext}`);
            if(src) break;
          }
        }
        if(!src){
          const hero = assets.find(a => a.category === c.id && a.type === "hero");
          src = hero && hero.src;
        }
        if(src) slot.style.backgroundImage = `url('${src}')`;
      });
    });
  }

  const heroStack = document.getElementById("heroStack");
  if(heroStack){
    const picks = (data.articles || []).slice(0, 4);
    heroStack.innerHTML = picks.map((a, i) => {
      const c = catMap[a.category] || cats[0];
      return `<div class="hstack-card hstack-${i+1}"><div class="poster">${FV.poster(a.id, c.color, c.color2, a.title)}<span class="poster-badge">${c.name}</span></div></div>`;
    }).join("");
  }

  const articleGrid = document.getElementById("featuredArticles");
  if(articleGrid){
    articleGrid.innerHTML = (data.articles || []).slice(0, 6).map(a => FV.renderArticleCard(a, catMap)).join("");
    FV.wireArticleCardClicks(articleGrid);
  }

  const charGrid = document.getElementById("popularCharacters");
  if(charGrid){
    charGrid.innerHTML = (data.characters || []).slice(0, 4).map(c => FV.renderCharacterCard(c, catMap)).join("");
  }

  const eventList = document.getElementById("eventHighlights");
  if(eventList){
    const picks = [...(data.events || [])].sort((a,b) => new Date(a.date)-new Date(b.date)).slice(0, 3);
    eventList.innerHTML = picks.map(e => FV.renderEventRow(e, catMap)).join("");
  }

  const merchGrid = document.getElementById("featuredMerch");
  if(merchGrid){
    const picks = (data.merchandise || []).slice(0, 4);
    merchGrid.innerHTML = picks.map(m => FV.renderMerchCard(m, catMap)).join("");
    FV.wireMerchAdd(merchGrid, data.merchandise || []);
    FV.applyMerchPhotos(merchGrid);
  }

  FV.markReveal && FV.markReveal();
  FV.initReveal && FV.initReveal();
});
