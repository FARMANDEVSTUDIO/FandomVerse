/* =========================================================
   FandomVerse — cards.js
   Shared card-rendering helpers used across home, category,
   articles, characters, events, trailers, and merchandise pages.
   ========================================================= */

window.FV = window.FV || {};

FV.renderArticleCard = function renderArticleCard(a, catMap, base){
  base = base || "";
  const c = catMap[a.category];
  const bookmarked = FV.isBookmarked("article", a.id);
  return `
    <article class="glow-card article-card" style="--cat:${c.color};--cat-2:${c.color2}" data-href="${base}articles.html?id=${a.id}">
      <div class="poster">${FV.poster(a.id, c.color, c.color2, a.title)}${FV.slotImg("articles", a.id, a.title)}<span class="poster-badge">${c.name}</span>
        <button class="icon-btn card-bookmark bookmark-btn ${bookmarked?"bookmarked":""}" data-bookmark-type="article" data-bookmark-id="${a.id}" data-bookmark-title="${FV.escapeHtml(a.title)}" data-bookmark-href="${base}articles.html?id=${a.id}" aria-label="Bookmark">${FV.icon(bookmarked?"bookmarkFilled":"bookmark",15)}</button>
      </div>
      <div class="article-body">
        <div class="article-cat">${c.name}</div>
        <h3>${FV.escapeHtml(a.title)}</h3>
        <p>${FV.escapeHtml(a.excerpt)}</p>
        <div class="article-meta">
          <span>${a.readTime}</span><span class="meta-dot"></span><span>${new Date(a.date).toLocaleDateString([], {month:"short", day:"numeric"})}</span>
          <span class="article-more">Read <span aria-hidden="true">→</span></span>
        </div>
      </div>
    </article>`;
};

FV.renderCharacterCard = function renderCharacterCard(c, catMap){
  const cat = catMap[c.category];
  const bookmarked = FV.isBookmarked("character", c.id);
  return `
    <div class="glow-card char-card" style="--cat:${cat.color};--cat-2:${cat.color2};position:relative">
      <a class="char-link" href="${window.FV_BASE || ""}character.html?id=${encodeURIComponent(c.id)}" aria-label="Meet ${FV.escapeHtml(c.name)} in 3D"></a>
      <div class="char-cover" aria-hidden="true"></div>
      ${(c.model || c.models) ? `<span class="char-3d-badge" title="Has a 3D model">3D</span>` : ""}
      <button class="icon-btn card-bookmark char-bookmark bookmark-btn ${bookmarked?"bookmarked":""}" data-bookmark-type="character" data-bookmark-id="${c.id}" data-bookmark-title="${FV.escapeHtml(c.name)}" aria-label="Bookmark">${FV.icon(bookmarked?"bookmarkFilled":"bookmark",15)}</button>
      <div class="char-avatar" style="background:linear-gradient(135deg,${cat.color},${cat.color2})">${c.name.charAt(0)}${FV.slotImg("characters", c.id, c.name)}</div>
      <div class="char-info">
        <h3>${FV.escapeHtml(c.name)}</h3>
        <div class="char-series"><span>${FV.escapeHtml(c.series)}</span><span class="char-cat-pill">${cat.name}</span></div>
        <p>${FV.escapeHtml(c.bio)}</p>
        <div class="trait-row">${c.traits.map(t => `<span class="trait-pill">${FV.escapeHtml(t)}</span>`).join("")}</div>
      </div>
    </div>`;
};

FV.renderEventRow = function renderEventRow(e, catMap){
  const c = catMap[e.category];
  const d = new Date(e.date);
  return `
    <div class="event-row">
      <div class="glow-card event-card" style="--cat:${c.color};--cat-2:${c.color2}">
        ${e.art ? `<div class="event-thumb">${FV.slotImg("articles", e.art, e.title)}</div>` : ""}
        <div class="event-datebox" aria-hidden="true">
          <strong>${d.getDate()}</strong><span>${d.toLocaleDateString([], {month:"short"})}</span>
        </div>
        <div class="event-main">
          <div class="event-date">${d.toLocaleDateString([], {month:"long", day:"numeric", year:"numeric"})} · ${c.name}</div>
          <h3>${FV.escapeHtml(e.title)}</h3>
          <div class="event-loc"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>${FV.escapeHtml(e.location)}</div>
          <p>${FV.escapeHtml(e.description)}</p>
        </div>
      </div>
    </div>`;
};

FV.renderTrailerCard = function renderTrailerCard(t, catMap){
  const c = catMap[t.category];
  return `
    <div class="glow-card trailer-card" style="--cat:${c.color};--cat-2:${c.color2}" data-media-id="${t.id}" role="button" tabindex="0" aria-label="Play ${FV.escapeHtml(t.title)}">
      <div class="poster">
        ${t.youtube
          ? `<img class="yt-thumb" src="https://i.ytimg.com/vi/${encodeURIComponent(t.youtube)}/hqdefault.jpg" alt="" loading="lazy" onerror="this.remove()">`
          : FV.poster(t.id, c.color, c.color2, t.title) + FV.slotImg("trailers", t.id, t.title)}
        <span class="poster-badge">${c.name}</span>
        <span class="poster-type">${t.type}</span>
        ${t.duration ? `<span class="poster-duration">${t.duration}</span>` : ""}
        <div class="trailer-play">${FV.icon("play", 52)}</div>
      </div>
      <div class="trailer-body"><h3>${FV.escapeHtml(t.title)}</h3><p>${FV.escapeHtml(t.description)}</p>${FV.watchBtn ? FV.watchBtn(t.id) : ""}</div>
    </div>`;
};

FV._merchPhotoCache = null;
// shop extras worked out from the product id, so every visit shows the same numbers
FV.merchExtras = function merchExtras(m){
  const h = Math.abs(m.id.split("").reduce((a, ch) => a * 33 + ch.charCodeAt(0) | 0, 7));
  const rating = 4 + (h % 10) / 10;                         // 4.0 .. 4.9
  const reviews = 12 + (h % 180);
  const off = h % 3 === 0 ? [10, 15, 20, 25][h % 4] : 0;    // about a third are on sale
  const was = off ? Math.round(Number(m.price) / (1 - off / 100) / 50) * 50 : 0;
  return { rating: Math.round(rating * 10) / 10, reviews, off, was, fav: rating >= 4.7 };
};
const FV_WISH = () => "fv_wish:" + (((FV.getUser && FV.getUser()) || {}).email || "guest");
FV.getWish = () => { try{ return JSON.parse(localStorage.getItem(FV_WISH())) || []; }catch(e){ return []; } };
FV.toggleWish = id => { const w = FV.getWish(), on = !w.includes(id); try{ localStorage.setItem(FV_WISH(), JSON.stringify(on ? w.concat(id) : w.filter(x => x !== id))); }catch(e){} return on; };
FV.renderMerchCard = function renderMerchCard(m, catMap){
  const c = catMap[m.category];
  const x = FV.merchExtras(m), wished = FV.getWish().includes(m.id);
  const stars = `<span class="stars" style="--r:${x.rating / 5 * 100}%"></span>`;
  const idx = Math.abs(m.id.split("").reduce((h,ch)=>h*31+ch.charCodeAt(0)|0,0)) % 6 + 1;
  const photoId = `m${idx}`;
  return `
    <div class="glow-card merch-card" style="--cat:${c.color};--cat-2:${c.color2}" data-merch-photo="${photoId}">
      <div class="poster" data-poster-fallback>${FV.poster(m.id, c.color, c.color2, m.name)}${FV.slotImg("merch", m.id, m.name)}<span class="poster-badge">${c.name}</span>
        ${x.off ? `<span class="merch-sale">-${x.off}%</span>` : ""}${x.fav ? `<span class="merch-fav">${FV.gi ? FV.gi("flame", 13) : ""}Fan favourite</span>` : ""}
        <button type="button" class="merch-wish ${wished ? "on" : ""}" data-wish="${m.id}" aria-pressed="${wished}" aria-label="${wished ? "Remove from wishlist" : "Add to wishlist"}">${FV.gi ? FV.gi("heart", 18) : ""}</button></div>
      <div class="merch-body">
        <h3>${FV.escapeHtml(m.name)}</h3>
        <p class="merch-rating" aria-label="Rated ${x.rating} out of 5">${stars} ${x.rating} <small>(${x.reviews} reviews)</small></p>
        <p>${FV.escapeHtml(m.description)}</p>
        <div class="merch-price-row">
          <span class="merch-price"><small>PKR</small> ${Number(m.price).toLocaleString("en-PK")}${x.was ? ` <s>${x.was.toLocaleString("en-PK")}</s>` : ""}</span>
          <button class="merch-add" data-id="${m.id}" type="button"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span>Add to cart</span></button>
        </div>
      </div>
    </div>`;
};

FV.applyMerchPhotos = async function applyMerchPhotos(container){
  if(!container) return;
  const photos = await FV.merchPhotos();
  if(!photos.length) return;
  container.querySelectorAll("[data-merch-photo]").forEach(card => {
    const idx = (Number(card.dataset.merchPhoto.replace("m","")) - 1) % photos.length;
    const photo = photos[idx];
    const posterEl = card.querySelector("[data-poster-fallback]");
    if(!photo || !posterEl) return;
    const badgeEl = posterEl.querySelector(".poster-badge");
    const badgeText = badgeEl ? badgeEl.textContent : "";
    // keep the per-product slot image (assets/images/merch/<id>) on top of the generic photo
    const slot = posterEl.querySelector(".slot-img");
    posterEl.innerHTML = `<img src="${photo.src}" alt="${FV.escapeHtml(photo.alt)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"><span class="poster-badge">${FV.escapeHtml(badgeText)}</span>`;
    if(slot) posterEl.insertBefore(slot, posterEl.querySelector(".poster-badge"));
  });
};

FV.wireMerchAdd = function wireMerchAdd(container, items){
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".merch-add");
    if(!btn) return;
    const item = items.find(i => i.id === btn.dataset.id);
    if(!item) return;
    if(FV.addToCart(item) === false) return;
    const label = btn.querySelector("span");
    btn.classList.add("added");
    if(label) label.textContent = "Added";
    clearTimeout(btn._addedTimer);
    btn._addedTimer = setTimeout(() => {
      btn.classList.remove("added");
      if(label) label.textContent = "Add to cart";
    }, 1400);
  });
};

FV.wireArticleCardClicks = function wireArticleCardClicks(container){
  container.addEventListener("click", (e) => {
    if(e.target.closest(".bookmark-btn")) return;
    const card = e.target.closest(".article-card");
    if(card && card.dataset.href) window.location.href = card.dataset.href;
  });
};
