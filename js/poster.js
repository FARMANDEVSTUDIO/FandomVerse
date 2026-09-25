/* =========================================================
   FandomVerse — poster.js
   Generates unique, deterministic flat poster-style art per item
   using inline SVG — solid color blocks, hard edges, no gradients
   or blur, in the spirit of print/Swiss poster design.
   No stock images: original per-card art, fully copyright-safe.
   ========================================================= */

window.FV = window.FV || {};

function fvHash(str){
  let h = 0;
  for(let i = 0; i < str.length; i++){ h = (Math.imul(31, h) + str.charCodeAt(i)) | 0; }
  return h >>> 0;
}
function fvRng(seed){
  let a = seed;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FV_LAYOUTS = ["diagonal", "circleBlock", "stripes", "cornerWedge"];

/**
 * FV.poster(id, color, color2, glyph) -> SVG markup string (400x250 viewBox)
 * Flat, hard-edged, poster-style composition — no gradients, no blur.
 */
FV.poster = function poster(id, color, color2, glyph){
  const rand = fvRng(fvHash(String(id)));
  const layout = FV_LAYOUTS[Math.floor(rand() * FV_LAYOUTS.length)];
  const letter = (glyph || "?").toString().charAt(0).toUpperCase();
  const ink = "#0a0a0a";
  const paper = "#f4f1e8";

  let shapes = "";

  if(layout === "diagonal"){
    const flip = rand() > 0.5;
    const pts = flip ? "0,250 400,0 400,250" : "0,0 400,0 0,250";
    shapes += `<polygon points="${pts}" fill="${color2}"/>`;
    shapes += `<circle cx="${flip ? 90 : 320}" cy="${flip ? 70 : 180}" r="46" fill="${paper}" opacity=".9"/>`;
  }else if(layout === "circleBlock"){
    const cx = 70 + rand()*80, cy = 60 + rand()*60;
    shapes += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="150" fill="${color2}"/>`;
    shapes += `<rect x="260" y="0" width="140" height="250" fill="${ink}" opacity=".14"/>`;
  }else if(layout === "stripes"){
    const stripeCount = 5;
    for(let i=0;i<stripeCount;i++){
      shapes += `<rect x="${i*80-40}" y="0" width="36" height="250" fill="${paper}" opacity="${i%2===0?'.16':'.28'}" transform="skewX(-12)"/>`;
    }
    shapes += `<circle cx="330" cy="55" r="42" fill="${color2}"/>`;
  }else{
    shapes += `<polygon points="400,0 400,250 190,250" fill="${color2}"/>`;
    shapes += `<polygon points="0,250 0,120 120,250" fill="${paper}" opacity=".85"/>`;
  }

  // thin crosshair / tick accents — flat, fixed low opacity, no blur
  const ticks = `
    <line x1="18" y1="18" x2="18" y2="38" stroke="${paper}" stroke-width="2" opacity=".5"/>
    <line x1="8" y1="28" x2="28" y2="28" stroke="${paper}" stroke-width="2" opacity=".5"/>
    <circle cx="382" cy="228" r="3" fill="${paper}" opacity=".6"/>
  `;

  return `
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="250" fill="${color}"/>
      ${shapes}
      ${ticks}
      <text x="376" y="60" text-anchor="end" font-family="'Space Grotesk',sans-serif" font-size="52" font-weight="700" fill="${ink}" opacity=".18">${letter}</text>
    </svg>
  `;
};

/* Drop-in image slots: a file named after the item id (e.g. assets/images/merch/m1.png,
   m1.jpg.jpg, M1.WEBP) covers the generated art. On the local dev server the folder listing
   is read once, so any image extension is found without guessing; elsewhere a list of common
   extensions is tried in turn. With no file, the slot removes itself and the art shows. */
const FV_SLOT_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "avif", "jfif", "bmp", "svg"];
const FV_SLOT_GUESSES = ["jpg", "png", "webp", "jpeg", "jpg.jpg", "png.png", "webp.webp", "jpeg.jpg", "png.jpg", "jpg.png", "gif", "avif", "jfif"];
FV._slotListings = {};

FV.slotImg = function slotImg(folder, id, alt){
  const esc = FV.escapeHtml || (x => x);
  return `<img class="slot-img" data-slot-folder="${esc(folder)}" data-slot-id="${esc(String(id))}" data-alt="${esc(alt || "")}" alt="" loading="lazy" draggable="false">`;
};

FV.slotListing = function slotListing(folder){
  if(!FV._slotListings[folder]){
    const url = (window.FV_BASE || "") + "assets/images/" + folder + "/";
    FV._slotListings[folder] = FV.assetManifest().then(m => m ? (m["images/" + folder] || []) : fetch(url, { cache: "no-store" })
      .then(r => r.ok ? r.text() : "")
      .then(html => {
        if(!/<a\s/i.test(html) || !/Directory listing|Index of/i.test(html)) return null;
        const names = [];
        html.replace(/href="([^"?#]+)"/gi, (_, h) => { try{ names.push(decodeURIComponent(h)); }catch(e){} return _; });
        return names;
      })
      .catch(() => null));
  }
  return FV._slotListings[folder];
};

// assets/manifest.json (made when the site is published) lists every file in assets/,
// standing in for the folder listings the local server provides.
FV.assetManifest = function assetManifest(){
  if(!FV._assetManifest){
    FV._assetManifest = fetch((window.FV_BASE || "") + "assets/manifest.json", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).catch(() => null);
  }
  return FV._assetManifest;
};

function fvSlotMatch(names, id){
  const lid = String(id).toLowerCase();
  const found = names.filter(n => {
    const ln = n.toLowerCase();
    if(!ln.startsWith(lid + ".")) return false;
    const parts = ln.slice(lid.length + 1).split(".");
    return parts.length && parts.every(p => FV_SLOT_EXTS.includes(p));
  });
  return found.sort((a, b) => a.length - b.length)[0] || null;
}

FV.slotFallback = function slotFallback(img){
  const tries = (img.dataset.tries || "").split(",").filter(Boolean);
  if(!tries.length){ img.remove(); return; }
  const next = tries.shift();
  img.dataset.tries = tries.join(",");
  img.src = img.dataset.base + "." + next;
};

FV.resolveSlot = function resolveSlot(img){
  if(img.dataset.slotState) return;
  img.dataset.slotState = "pending";
  const folder = img.dataset.slotFolder, id = img.dataset.slotId;
  const base = (window.FV_BASE || "") + "assets/images/" + folder + "/";
  img.addEventListener("load", () => {
    img.alt = img.dataset.alt || ""; img.dataset.slotState = "ok";
    // lets a frame show a blurred copy of the image behind it (used for posters in wide cards)
    img.parentElement && img.parentElement.style.setProperty("--slot-bg", `url("${img.src}")`);
  });
  FV.slotListing(folder).then(names => {
    if(names){
      const file = fvSlotMatch(names, id);
      if(!file){ img.remove(); return; }
      img.addEventListener("error", () => img.remove(), { once: true });
      img.src = base + encodeURIComponent(file);
    }else{
      img.dataset.base = base + encodeURIComponent(id);
      img.dataset.tries = FV_SLOT_GUESSES.join(",");
      img.addEventListener("error", () => FV.slotFallback(img));
      FV.slotFallback(img);
    }
  });
};

FV.resolveSlots = function resolveSlots(root){
  (root || document).querySelectorAll("img.slot-img[data-slot-folder]:not([data-slot-state])").forEach(FV.resolveSlot);
};

// cards are rendered with innerHTML all over the site, so watch for new slots instead of wiring every renderer
new MutationObserver(muts => {
  for(const m of muts){
    m.addedNodes.forEach(n => {
      if(n.nodeType !== 1) return;
      if(n.matches && n.matches("img.slot-img[data-slot-folder]")) FV.resolveSlot(n);
      else if(n.querySelectorAll) FV.resolveSlots(n);
    });
  }
}).observe(document.documentElement, { childList: true, subtree: true });
FV.resolveSlots(document);

/* Every image file in a folder (from the dev server's listing), sorted naturally
   (img-2 before img-10). Resolves to null when the listing isn't available. */
FV.folderImages = function folderImages(folder){
  return FV.slotListing(folder).then(names => {
    if(!names) return null;
    return names
      .filter(n => FV_SLOT_EXTS.includes(n.split(".").pop().toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  });
};

// "kpop-lunaris.png" -> "kpop"; accepts a few spellings people naturally use
FV.categoryFromFile = function categoryFromFile(name, catIds){
  const n = name.toLowerCase();
  const aliases = { "tv-shows": ["tv-shows", "tvshows", "tv_shows", "tv"], "kpop": ["kpop", "k-pop", "k_pop"] };
  const ordered = [...catIds].sort((a, b) => b.length - a.length);
  for(const id of ordered){
    for(const p of (aliases[id] || [id])){
      if(n.startsWith(p + "-") || n.startsWith(p + "_") || n.startsWith(p + " ") || n.startsWith(p + ".")) return id;
    }
  }
  return "";
};

// "anime-emberfall_season-3.jpg" -> "Emberfall Season 3"
FV.titleFromFile = function titleFromFile(name, category){
  let t = name.replace(/(\.[a-z0-9]+)+$/i, "");
  if(category) t = t.replace(new RegExp("^(" + category.replace("-", "[-_ ]?") + "|tv|k-pop)[-_ ]+", "i"), "");
  return t.replace(/[-_]+/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase());
};

/* Images in a folder plus its category subfolders (e.g. morph/anime/x.jpg). A file's
   category comes from its subfolder, or from its name for files at the top level.
   Resolves to null when the listing isn't available. */
FV.folderImagesByCategory = async function folderImagesByCategory(folder, catIds){
  const top = await FV.slotListing(folder);
  if(!top) return null;
  const isImg = n => FV_SLOT_EXTS.includes(n.split(".").pop().toLowerCase());
  const byName = (a, b) => a.file.localeCompare(b.file, undefined, { numeric: true, sensitivity: "base" });
  const out = top.filter(n => !n.endsWith("/") && isImg(n))
    .map(n => ({ file: n, category: FV.categoryFromFile(n, catIds) }));
  const dirs = top.filter(n => n.endsWith("/")).map(n => n.slice(0, -1));
  const lists = await Promise.all(dirs.map(async d => {
    const cat = FV.categoryFromFile(d + "-", catIds);
    const names = await FV.slotListing(folder + "/" + d);
    return (names || []).filter(n => !n.endsWith("/") && isImg(n)).map(n => ({ file: d + "/" + n, name: n, category: cat }));
  }));
  // interleave categories so neighbouring cards differ
  const groups = lists.map(l => l.sort(byName));
  const mixed = [];
  for(let i = 0; groups.some(g => g[i]); i++) groups.forEach(g => { if(g[i]) mixed.push(g[i]); });
  return out.sort(byName).concat(mixed);
};
