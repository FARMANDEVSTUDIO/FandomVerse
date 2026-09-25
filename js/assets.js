/* =========================================================
   FandomVerse — assets.js
   Loads data/assets.json (real openly-licensed photos fetched
   from Openverse) and exposes helpers to look them up by
   category/type. Every entry carries source/license/credit.
   ========================================================= */

window.FV = window.FV || {};

FV.assets = (async function loadAssets(){
  const base = window.FV_BASE || "";
  try{
    const res = await fetch(base + "data/assets.json");
    if(!res.ok) throw new Error(String(res.status));
    return await res.json();
  }catch(err){
    console.warn("FandomVerse: could not load assets.json", err);
    return [];
  }
})();

FV.heroFor = async function heroFor(category){
  const assets = await FV.assets;
  return assets.find(a => a.category === category && a.type === "hero");
};

FV.galleryFor = async function galleryFor(category){
  const assets = await FV.assets;
  return assets.filter(a => a.category === category && a.type === "gallery");
};

FV.merchPhotos = async function merchPhotos(){
  const assets = await FV.assets;
  return assets.filter(a => a.type === "merch");
};

// Same pick the merch cards use, so the cart thumbnail shows the card's photo.
FV.merchPhotoIndex = function merchPhotoIndex(id){
  return Math.abs(String(id).split("").reduce((h, ch) => h * 31 + ch.charCodeAt(0) | 0, 0)) % 6;
};

FV.creditLine = function creditLine(asset){
  if(!asset) return "";
  return asset.title || "";
};

/**
 * Wires a lightbox (with prev/next + license credit) onto a grid of
 * .photo-tile buttons, using the matching photos array (same order).
 */
FV.initLightbox = function initLightbox(gridEl, photos){
  if(!gridEl || !photos || !photos.length) return;

  let backdrop = document.getElementById("fvLightbox");
  if(!backdrop){
    backdrop = document.createElement("div");
    backdrop.className = "lightbox-backdrop";
    backdrop.id = "fvLightbox";
    backdrop.innerHTML = `
      <button class="icon-btn lightbox-close" id="lbClose" aria-label="Close">✕</button>
      <button class="lightbox-nav lightbox-prev" id="lbPrev" aria-label="Previous photo">‹</button>
      <img id="lbImg" src="" alt="">
      <p class="lightbox-caption" id="lbCaption"></p>
      <button class="lightbox-nav lightbox-next" id="lbNext" aria-label="Next photo">›</button>
    `;
    document.body.appendChild(backdrop);
    document.getElementById("lbClose").addEventListener("click", () => backdrop.classList.remove("open"));
    backdrop.addEventListener("click", (e) => { if(e.target === backdrop) backdrop.classList.remove("open"); });
    document.addEventListener("keydown", (e) => {
      if(!backdrop.classList.contains("open")) return;
      if(e.key === "Escape") backdrop.classList.remove("open");
      if(e.key === "ArrowLeft") document.getElementById("lbPrev").click();
      if(e.key === "ArrowRight") document.getElementById("lbNext").click();
    });
  }

  let current = 0;
  function show(idx){
    current = (idx + photos.length) % photos.length;
    const p = photos[current];
    document.getElementById("lbImg").src = p.src;
    document.getElementById("lbImg").alt = p.alt || "";
    document.getElementById("lbCaption").textContent = FV.creditLine(p);
    backdrop.classList.add("open");
  }
  document.getElementById("lbPrev").onclick = () => show(current - 1);
  document.getElementById("lbNext").onclick = () => show(current + 1);

  gridEl.addEventListener("click", (e) => {
    const tile = e.target.closest(".photo-tile");
    if(!tile) return;
    show(Number(tile.dataset.idx));
  });
};
