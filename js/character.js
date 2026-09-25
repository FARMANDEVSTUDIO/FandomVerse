/* =========================================================
   FandomVerse — character.js
   Character showcase page: the character stands on a neon platform,
   turns when dragged (front / left / back / right views), zooms on
   scroll, and introduces itself out loud with the words written
   in the side panel. The arrows step through the same category.

   Images:  assets/images/characters/full/<id>-front|side|back|34.png  (cut-out views)
            or <id>-sheet.png, <id>.png; falls back to characters/<id>.jpg
   Voices:  assets/voices/<id>.mp3  (e.g. made with ElevenLabs) — used when present,
            otherwise the browser's built-in speech voice reads the intro.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const stage = document.getElementById("charStage");
  if(!stage) return;

  const data = await FV.data;
  const cats = data.categories || [];
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  const list = data.characters || [];
  const id = new URLSearchParams(location.search).get("id");
  const c = list.find(x => x.id === id) || list[0];
  if(!c){ stage.innerHTML = `<p class="search-empty">Character not found. <a href="characters.html">See all characters</a></p>`; return; }

  const cat = catMap[c.category] || cats[0] || { name: "", color: "#e8382f", color2: "#7c3aed" };
  // warm the browser cache with the 3D model straight away, so it's ready by the time the viewer asks
  {
    const first = (c.models && c.models[0]) || c.model;
    if(first) fetch(`${window.FV_BASE || ""}assets/models/${first.file || c.id + ".glb"}`).catch(() => {});
    (c.models || []).slice(1).forEach(v => { const l = document.createElement("link"); l.rel = "prefetch"; l.href = `${window.FV_BASE || ""}assets/models/${v.file}`; document.head.appendChild(l); });
  }
  const esc = s => FV.escapeHtml(String(s ?? ""));
  const intro = c.intro || `Hi, I'm ${c.name} from ${c.series}. ${c.bio}`;
  const voiceCfg = c.voice || {};
  // the arrows and dots move through this character's own category
  const family = list.filter(x => x.category === c.category);
  const fIdx = family.indexOf(c);
  const prev = family[(fIdx - 1 + family.length) % family.length];
  const next = family[(fIdx + 1) % family.length];
  const link = x => `character.html?id=${encodeURIComponent(x.id)}`;

  // "Satoru Gojo" → small "SATORU" over big "GOJO"; "Bruce Wayne / Batman" → "BRUCE WAYNE" / "BATMAN"
  let small = "", big = c.name;
  if(c.name.includes(" / ")) [small, big] = c.name.split(" / ");
  else if(c.name.includes(" ")){ const p = c.name.split(" "); big = p.pop(); small = p.join(" "); }
  const firstName = (c.name.split(" / ")[0].split(" ")[0]);

  document.title = `${c.name} — FandomVerse`;
  const crumb = document.getElementById("crumbCurrent");
  if(crumb) crumb.textContent = c.name;


  const ico = {
    left: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`,
    right: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>`,
    wave: `<svg width="26" height="20" viewBox="0 0 26 20" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="2" height="4" rx="1"/><rect x="4" y="5" width="2" height="10" rx="1"/><rect x="8" y="1" width="2" height="18" rx="1"/><rect x="12" y="4" width="2" height="12" rx="1"/><rect x="16" y="0" width="2" height="20" rx="1"/><rect x="20" y="5" width="2" height="10" rx="1"/><rect x="24" y="8" width="2" height="4" rx="1"/></svg>`,
    play: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>`,
    pause: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
    restart: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>`,
    user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>`,
    speaker: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>`,
    hand: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="4"/><path d="M9 3v5h6V3"/></svg>`,
    mouse: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 7v4"/></svg>`,
    bolt: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M13 7l-4 6h4l-2 4"/></svg>`,
    gallery: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-6-6-9 9"/></svg>`,
    download: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5"/><path d="M4 19h16"/></svg>`,
    upload: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 16V5M7 10l5-5 5 5"/><path d="M4 19h16"/></svg>`,
  };

  function renderMore(){
    const more = document.getElementById("charMore");
    const same = family.filter(x => x !== c).slice(0, 4);
    if(more && same.length){
      more.innerHTML = `<h2 class="cs-more-title">More from ${esc(cat.name)}</h2>
        <div class="char-grid">${same.map(x => FV.renderCharacterCard(x, catMap)).join("")}</div>`;
      FV.markReveal && FV.markReveal(); FV.initReveal && FV.initReveal();
    }
  }

  /* ---------- characters without a 3D model: a plain profile ----------
     The studio stage, turning views and voice are only for the 3D collection. */
  if(!(c.model || (c.models && c.models.length))){
    stage.style.setProperty("--cat", cat.color);
    stage.classList.add("cv-simple");
    const photo = `${window.FV_BASE || ""}assets/images/characters/${c.id}.jpg`;
    stage.innerHTML = `
      <figure class="cvs-photo">
        <img src="${photo}" alt="${esc(c.name)}" onerror="this.parentNode.classList.add('no-img'); this.remove()">
        <span class="cvs-initial" aria-hidden="true">${esc(c.name.charAt(0))}</span>
      </figure>
      <div class="cvs-info">
        <p class="cv2-meta">${esc(cat.name)} <span>·</span> ${esc(c.series)}</p>
        <h1 class="cv2-name">${esc(c.name.includes(" / ") ? big : c.name)}</h1>
        ${c.name.includes(" / ") ? `<p class="cv2-alias">${esc(small)}</p>` : ""}
        <p class="cv2-bio">${esc(c.bio)}</p>
        <div class="cv2-traits">${(c.traits || []).map(t => `<span>${esc(t)}</span>`).join("")}</div>
        <div class="cvs-nav">
          <a class="cv2-step" href="${link(prev)}" aria-label="Previous: ${esc(prev.name)}">${ico.left}<span>${esc(prev.name.split(" / ").pop())}</span></a>
          <a class="cvs-more" href="category.html?cat=${encodeURIComponent(c.category)}">More ${esc(cat.name)}</a>
          <a class="cv2-step is-next" href="${link(next)}" aria-label="Next: ${esc(next.name)}"><span>${esc(next.name.split(" / ").pop())}</span>${ico.right}</a>
        </div>
      </div>`;
    renderMore();
    return;
  }

  // each character gets its own accent (from its outfit) instead of one colour per category
  const accent = (c.model && c.model.color) || c.color3d || cat.color;
  stage.style.setProperty("--cat", accent);
  stage.style.setProperty("--cat-2", cat.color2);
  stage.classList.add("cv2");
  const pos1 = String(fIdx + 1).padStart(2, "0"), posN = String(family.length).padStart(2, "0");
  const alias = small && small !== big ? small : "";
  stage.innerHTML = `
    <div class="cv-backdrop" aria-hidden="true"><span class="cv2-spot"></span><span class="cv2-floor"></span></div>

    <div class="cv-views" id="cvViews" aria-label="Views"></div>

    <div class="cs-scene" id="csScene">
      <p class="cv2-tag">${pos1} / ${posN} · ${esc(cat.name)}</p>
      <div class="cs-figure" id="csFigure" role="img" aria-label="${esc(c.name)}">
        <div class="cs-body" id="csBody"></div>
        <span class="cs-initial" aria-hidden="true">${esc(c.name.charAt(0))}</span>
      </div>
      <div class="cv-platform" aria-hidden="true"><span class="cv-disc"></span><span class="cv2-ripple"></span><span class="cv2-ripple"></span><span class="cv2-ripple"></span></div>
      <div class="cs-wave" id="csWave" aria-hidden="true">${"<i></i>".repeat(9)}</div>

      <div class="cv2-foot">
        <a class="cv2-step" href="${link(prev)}" aria-label="Previous: ${esc(prev.name)}">${ico.left}<span>${esc(prev.name.split(" / ").pop())}</span></a>
        <div class="cv-hint">
          <span id="csTurn"><span id="csTurnLabel">Drag to turn</span></span>
          <div class="cv-dots">${family.map(x => `<a href="${link(x)}" class="${x === c ? "is-on" : ""}" aria-label="${esc(x.name)}" title="${esc(x.name)}"></a>`).join("")}</div>
        </div>
        <a class="cv2-step is-next" href="${link(next)}" aria-label="Next: ${esc(next.name)}"><span>${esc(next.name.split(" / ").pop())}</span>${ico.right}</a>
      </div>
    </div>

    <aside class="cs-panel cv-panel">
      <p class="cv2-meta">${esc(cat.name)} <span>·</span> ${esc(c.series)}</p>
      <h1 class="cv2-name">${esc(c.name.includes(" / ") ? big : c.name)}</h1>
      ${c.name.includes(" / ") ? `<p class="cv2-alias">${esc(small)}</p>` : ""}
      <div id="cvSuitSlot"></div>
      <p class="cv2-bio">${esc(c.bio)}</p>
      <div class="cv2-traits">${(c.traits || []).map(t => `<span>${esc(t)}</span>`).join("")}</div>

      <section class="cv2-voice">
        <h2 class="cv2-h">In ${esc(c.voice && c.voice.narrator ? "a few words" : "their own words")}</h2>
        <p class="cs-transcript is-empty" id="csTranscript" aria-live="polite"><span class="cv2-placeholder">Press play: the words appear here as ${esc(c.name.includes(" / ") ? c.name.split(" / ").pop() : c.name)} speaks.</span></p>
        <div class="cv2-voice-row">
          <button class="cv2-play" type="button" id="csPlay">${ico.play}<span id="csPlayText">Play voice</span></button>
          <button class="cv2-restart" type="button" id="csRestart" hidden>${ico.restart}<span>Start over</span></button>
        </div>
        <p class="cv-live-text" id="csLiveText" hidden></p>
        <p class="cs-note" id="csNote"></p>
      </section>

      <div class="cv2-actions">
        <a href="category.html?cat=${encodeURIComponent(c.category)}">${ico.gallery}More ${esc(cat.name)}</a>
        <a href="match.html?id=${encodeURIComponent(c.id)}">${ico.gallery}Match my personality</a>
        <button type="button" id="cvDownload">${ico.download}Save image</button>
        <label for="csUploadFile">${ico.upload}Upload sheet</label>
        <input type="file" id="csUploadFile" accept="image/*" hidden>
        <button type="button" id="csUploadRemove" hidden>Remove upload</button>
      </div>
      <p class="cs-upload-msg" id="csUploadMsg" role="status"></p>
    </aside>`;

  /* ---------- views: the figure the character stands as ----------
     Looked for in assets/images/characters/full/, first match wins:
       <id>-sheet.png            a turnaround sheet (front, side, back, 3/4 on a white
                                 background); split into views and cut out automatically
       <id>-front.png, <id>-34.png, <id>-side.png, <id>-back.png   separate views
       <id>.png                  a single full-body image
     and finally the normal card photo characters/<id>.jpg. */
  const figure = document.getElementById("csFigure");
  const body = document.getElementById("csBody");
  const scene = document.getElementById("csScene");
  const turnBar = document.getElementById("csTurn");
  const turnLabel = document.getElementById("csTurnLabel");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = (window.FV_BASE || "") + "assets/images/characters/";
  const EXTS = ["png", "webp", "jpg", "jpeg"];

  const loadImg = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  // folder listing tells us which files exist (no 404 noise); without one, just try each name
  const fullNames = (await FV.slotListing("characters/full")) || null;
  async function findFile(folder, name){
    if(fullNames && folder === "full/"){
      const hit = fullNames.find(n => EXTS.some(e => n.toLowerCase() === `${name}.${e}`.toLowerCase()));
      return hit ? loadImg(root + folder + encodeURIComponent(hit)) : null;
    }
    for(const e of EXTS){ const im = await loadImg(`${root}${folder}${name}.${e}`); if(im) return im; }
    return null;
  }

  // Removes the white studio background (flood fill from the edges, so white bits
  // inside the costume stay), then cuts the sheet into its standing figures.
  function splitSheet(im){
    const W = im.naturalWidth, H = im.naturalHeight;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(im, 0, 0);
    const px = ctx.getImageData(0, 0, W, H), d = px.data;
    // dark / coloured studio background: can't be cut out safely, so split the usual
    // sheet layout (four figures across the left ~76%) and keep the background
    const corner = [0, W - 1, (H - 1) * W, H * W - 1].reduce((t, p) => t + d[p*4] + d[p*4+1] + d[p*4+2], 0) / 12;
    if(corner < 190){
      const area = W * 0.765, step = area / 4;
      return { cutout: false, views: [0, 1, 2, 3].map(i => {
        const out = document.createElement("canvas"); out.width = Math.round(step); out.height = H;
        out.getContext("2d").drawImage(im, Math.round(i * step), 0, Math.round(step), H, 0, 0, Math.round(step), H);
        return out.toDataURL("image/jpeg", 0.9);
      }) };
    }
    const isBg = i => { const r = d[i], g = d[i+1], b = d[i+2]; return r > 196 && g > 196 && b > 196 && Math.max(r, g, b) - Math.min(r, g, b) < 28; };
    const seen = new Uint8Array(W * H), stack = [];
    for(let x = 0; x < W; x++){ stack.push(x, (H - 1) * W + x); }
    for(let y = 0; y < H; y++){ stack.push(y * W, y * W + W - 1); }
    while(stack.length){
      const p = stack.pop();
      if(seen[p]) continue;
      seen[p] = 1;
      if(!isBg(p * 4)) continue;
      d[p * 4 + 3] = 0;
      const x = p % W;
      if(x > 0) stack.push(p - 1);
      if(x < W - 1) stack.push(p + 1);
      if(p >= W) stack.push(p - W);
      if(p < W * (H - 1)) stack.push(p + W);
    }
    // soften the cut edge a little
    for(let p = 0; p < W * H; p++){
      const a = p * 4 + 3;
      if(d[a] && ((p % W > 0 && !d[a - 4]) || (p % W < W - 1 && !d[a + 4]))) d[a] = 150;
    }
    ctx.putImageData(px, 0, 0);

    // columns that hold part of a figure (upper 80%, so floor shadows don't join them)
    const occupied = new Array(W).fill(false);
    for(let x = 0; x < W; x++){
      let n = 0;
      for(let y = 0; y < H * 0.8; y += 2){ if(d[(y * W + x) * 4 + 3] > 0 && ++n > 3) break; }
      occupied[x] = n > 3;
    }
    const segs = [];
    let start = -1;
    for(let x = 0; x <= W; x++){
      if(x < W && occupied[x]){ if(start < 0) start = x; }
      else if(start >= 0){ if(x - start > W * 0.06) segs.push([start, x]); start = -1; }
    }
    // a figure is tall; the close-up tiles on the right of a sheet are not
    const figures = segs.filter(([a, b]) => {
      let top = H, bottom = 0;
      for(let x = a; x < b; x += 3) for(let y = 0; y < H; y += 3){
        if(d[(y * W + x) * 4 + 3] > 0){ if(y < top) top = y; if(y > bottom) bottom = y; }
      }
      return bottom - top > H * 0.6;
    }).slice(0, 4);
    return { cutout: true, views: figures.map(([a, b]) => {
      const pad = 6, x0 = Math.max(0, a - pad), w = Math.min(W, b + pad) - x0;
      const out = document.createElement("canvas"); out.width = w; out.height = H;
      out.getContext("2d").drawImage(cv, x0, 0, w, H, 0, 0, w, H);
      return out.toDataURL("image/png");
    }) };
  }

  // turnaround order: front, side, back, 3/4 (the usual sheet layout)
  const SHEET_ORDER = ["front", "side", "back", "34"];
  let frames = []; // { src, label, flip }
  let isCutout = true;

  // one full turn: front → 3/4 → left → back → right → other 3/4, using mirrored copies
  function buildFrames(v){
    const front = v.front || v["34"] || v.side || v.back;
    const seq = [
      [front, "Front", false],
      [v["34"], "3/4", false],
      [v.side, "Left", false],
      [v.back, "Back", false],
      [v.side, "Right", true],
      [v["34"], "3/4", true],
    ];
    frames = seq.filter(f => f[0]).map(([src, label, flip]) => ({ src, label, flip }));
  }
  // a wide picture is a turnaround sheet; a tall one is a single full-body image
  function useImage(im){
    if(im.naturalWidth > im.naturalHeight * 1.25){
      try{
        const cut = splitSheet(im);
        isCutout = cut.cutout;
        const v = {};
        cut.views.forEach((src, i) => { v[SHEET_ORDER[i]] = src; });
        buildFrames(v);
        if(frames.length) return;
      }catch(err){}
    }
    frames = [{ src: im.src, label: "Front" }];
    isCutout = true;
  }

  /* images uploaded on this page are kept in the browser (IndexedDB) per character */
  const idb = (mode, fn) => new Promise((ok, bad) => {
    const req = indexedDB.open("fv_characters", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("images");
    req.onsuccess = () => {
      const tx = req.result.transaction("images", mode);
      const r = fn(tx.objectStore("images"));
      tx.oncomplete = () => ok(r && r.result);
      tx.onerror = () => bad(tx.error);
    };
    req.onerror = () => bad(req.error);
  });
  const getUpload = () => idb("readonly", s => s.get(c.id)).catch(() => null);
  const putUpload = blob => idb("readwrite", s => s.put(blob, c.id));
  const delUpload = () => idb("readwrite", s => s.delete(c.id)).catch(() => {});

  // the card photo doubles as the big faded artwork behind the stage
  const cardPhoto = await findFile("", c.id);


  async function loadFrames(){
    frames = []; isCutout = true;
    // ready-made cut-out views in the folder win; an upload fills in for characters without them
    {
      const v = {};
      for(const k of ["front", "34", "side", "back"]){ const im = await findFile("full/", `${c.id}-${k}`); if(im) v[k] = im.src; }
      if(Object.keys(v).length) buildFrames(v);
    }
    const blob = frames.length ? null : await getUpload();
    if(blob){ const im = await loadImg(URL.createObjectURL(blob)); if(im) useImage(im); }
    if(!frames.length){ const im = await findFile("full/", `${c.id}-sheet`); if(im) useImage(im); }
    if(!frames.length){ const im = await findFile("full/", c.id); if(im) useImage(im); }
    if(!frames.length && cardPhoto){ frames = [{ src: cardPhoto.src, label: "Front", w: cardPhoto.naturalWidth }]; isCutout = false; }
    return !!blob;
  }

  const views = document.getElementById("cvViews");
  let cur = 0, imgs = [], zoom = 1, mv = null, talking = false; // mv: the 3D model viewer, when there is one
  function paintFrames(){
    stopSpin(); cur = 0;
    figure.classList.remove("no-img", "is-cutout", "is-photo", "is-ready");
    if(!frames.length){ body.innerHTML = ""; figure.classList.add("no-img"); }
    else{
      // a small card photo is never blown up past ~1.4x, so it stays sharp
      body.innerHTML = frames.map((f, i) => `<img src="${f.src}" alt="" draggable="false" class="${i === 0 ? "is-on" : ""}" style="${f.flip ? "transform:scaleX(-1);" : ""}${f.w ? `width:min(92%,${Math.round(f.w * 1.4)}px);` : ""}">`).join("");
      figure.classList.add(isCutout ? "is-cutout" : "is-photo", "is-ready");
    }
    imgs = Array.from(body.querySelectorAll("img"));
    const turns = frames.length > 1;
    turnBar.hidden = !turns;
    scene.classList.toggle("can-turn", turns);
    stage.classList.toggle("has-views", turns);
    // side thumbnails: Front, Left, Right, Back
    const pick = ["Front", "Left", "Right", "Back"].map(l => frames.findIndex(f => f.label === l)).filter(i => i >= 0);
    views.innerHTML = turns ? pick.map(i => `
      <button type="button" class="cv-view" data-i="${i}">
        <span class="cv-view-img"><img src="${frames[i].src}" alt=""${frames[i].flip ? ' style="transform:scaleX(-1)"' : ""}></span>
        <span>${frames[i].label}</span>
      </button>`).join("") : "";
    angle = 0; render(); markView();
    if(turns && !reduce) setTimeout(() => spin(1), 600); // one turn to show it off
  }
  function markView(){
    views.querySelectorAll(".cv-view").forEach(b => b.classList.toggle("is-on", +b.dataset.i === cur));
  }
  views.addEventListener("click", e => {
    const b = e.target.closest(".cv-view");
    if(b) show(+b.dataset.i);
  });

  /* Smooth turning: the character has an angle in degrees. Each view covers an
     equal slice of the circle; between two views they cross-fade while the body
     narrows a little, which reads as the figure turning rather than swapping. */
  let angle = 0, anim = null;
  const seg = () => 360 / Math.max(1, frames.length);
  function render(){
    const n = frames.length;
    stage.style.setProperty("--ang", ((angle % 360) + 360) % 360 + "deg");
    if(n < 2) return;
    const p = ((angle / seg()) % n + n) % n;
    const k = Math.round(p) % n;
    const off = p - Math.round(p);                // -0.5 … 0.5 of a slice
    // near the edge of a slice the next view fades in, already turned to meet it
    const nb = (k + (off > 0 ? 1 : -1) + n) % n;
    const blend = Math.min(0.5, Math.max(0, (Math.abs(off) - 0.34) / 0.16 * 0.5));
    imgs.forEach((im, idx) => {
      let o = 0, d = 0;
      if(idx === k){ o = 1 - blend; d = off; }
      else if(idx === nb && blend > 0){ o = blend; d = off - Math.sign(off); }
      const flip = frames[idx].flip ? " scaleX(-1)" : "";
      im.style.opacity = o.toFixed(3);
      // the picture itself turns in 3D (perspective comes from .cs-body); light falls off as it turns
      im.style.transform = `rotateY(${(-d * seg()).toFixed(2)}deg)${flip}`;
      im.style.setProperty("--lit", (1 - Math.abs(d) * 0.5).toFixed(3));
    });
    if(k !== cur){ cur = k; markView(); }
  }
  // eases the angle to a target; used for snapping, spinning and thumbnail clicks
  function animateTo(target, ms = 420, done){
    cancelAnimationFrame(anim);
    const from = angle, t0 = performance.now();
    const ease = x => 1 - Math.pow(1 - x, 3);
    (function step(now){
      const k = Math.min(1, (now - t0) / ms);
      angle = from + (target - from) * ease(k);
      render();
      if(k < 1) anim = requestAnimationFrame(step);
      else{ angle = ((target % 360) + 360) % 360; render(); done && done(); }
    })(t0);
  }
  function show(n){
    if(mv){
      if(!frames.length){ orbitTo("Front"); return; }
      cur = (n + frames.length) % frames.length; markView(); orbitTo(frames[cur].label);
      return;
    }
    if(frames.length < 2) return;
    // shortest way round to that view
    let target = n * seg();
    const d = ((target - angle) % 360 + 540) % 360 - 180;
    animateTo(angle + d);
  }
  function spin(rounds = 1){
    if(frames.length < 2) return;
    const base = Math.round(angle / seg()) * seg();
    animateTo(base + 360 * rounds, 2600 * rounds);
  }
  const stopSpin = () => cancelAnimationFrame(anim);

  // drag sideways to turn the character (follows the pointer, then settles on the nearest view)
  let dragX = null, dragFrom = 0, lastX = 0, lastT = 0, vel = 0;
  scene.addEventListener("pointerdown", e => {
    if(mv || frames.length < 2 || e.target.closest("a, button")) return;
    stopSpin();
    dragX = lastX = e.clientX; lastT = performance.now(); vel = 0; dragFrom = angle;
    scene.classList.add("is-dragging");
    scene.setPointerCapture(e.pointerId);
  });
  scene.addEventListener("pointermove", e => {
    if(dragX === null) return;
    const now = performance.now();
    vel = (e.clientX - lastX) / Math.max(1, now - lastT);
    lastX = e.clientX; lastT = now;
    angle = dragFrom - (e.clientX - dragX) * 0.6;
    render();
  });
  const endDrag = () => {
    if(dragX === null) return;
    dragX = null; scene.classList.remove("is-dragging");
    // a flick keeps it turning a little, then it lands on a view
    const coast = angle - vel * 180;
    animateTo(Math.round(coast / seg()) * seg(), 520);
  };
  scene.addEventListener("pointerup", endDrag);
  scene.addEventListener("pointercancel", endDrag);
  document.addEventListener("keydown", e => {
    if(e.target.closest("input, select, textarea")) return;
    if(e.key === "ArrowLeft") show(cur - 1);
    if(e.key === "ArrowRight") show(cur + 1);
  });

  // scroll over the stage to zoom in and out
  scene.addEventListener("wheel", e => {
    e.preventDefault();
    zoom = Math.min(1, Math.max(0.7, zoom - Math.sign(e.deltaY) * 0.1)); // zoom out only, so it never leaves the frame
    scene.style.setProperty("--zoom", zoom.toFixed(2));
  }, { passive: false });
  scene.addEventListener("dblclick", () => { zoom = 1; scene.style.setProperty("--zoom", 1); });

  /* ---------- upload a full-body picture or a turnaround sheet ---------- */
  const upMsg = document.getElementById("csUploadMsg");
  const upRemove = document.getElementById("csUploadRemove");
  function uploadState(has){
    upRemove.hidden = !has;
    upMsg.textContent = has ? "Using your uploaded image (saved in this browser)."
      : frames.length && !isCutout ? "Only the card photo so far. Upload a full-body picture or a front/side/back sheet." : "";
  }
  uploadState(await loadFrames());
  paintFrames();

  /* ---------- real 3D model(s) (optional) ----------
     One model: c.model = { title, author, url, license, front?, distance?, lift?, file? }
     Several:   c.models = [ { label: "Mark 85", file: "c30.glb", ...same fields }, … ]
     With no entry at all, assets/models/<id>.glb is still picked up if the file exists.
     Several models get a switcher on the stage ("Suit: Mark 85 | Classic"). */
  const modelBase = `${window.FV_BASE || ""}assets/models/`;
  let variants = (c.models && c.models.length) ? c.models : (c.model ? [c.model] : []);
  if(!variants.length){
    const ok = await fetch(`${modelBase}${c.id}.glb`, { method: "HEAD", cache: "no-store" })
      .then(r => r.ok && !/text\/html/.test(r.headers.get("content-type") || "")).catch(() => false);
    if(ok) variants = [{}];
  }
  variants = variants.map((v, i) => Object.assign({ label: `Model ${i + 1}` }, v, { src: modelBase + (v.file || `${c.id}.glb`) }));
  const hasModel = variants.length > 0;
  let variant = variants[0] || {};
  const ORBIT = { "Front": 0, "3/4": 40, "Left": 90, "Back": 180, "Right": -90 };
  const PITCH = "82deg";
  // which way a file faces differs: variant.front (degrees) turns the camera to its face;
  // variant.distance (e.g. "125%") pulls the camera back for files that come out too big
  const FRONT = () => Number.isFinite(variant.front) ? variant.front : 0;
  const DIST = () => variant.distance || "100%";
  function orbitTo(label, keepSpin){
    if(!mv) return;
    mv.autoRotate = !!keepSpin;
    // auto-rotate turns the model itself (turntableRotation), not the camera, so take that
    // off the target; then go the short way round from wherever the camera is now
    const turned = (mv.turntableRotation || 0) * 180 / Math.PI;
    const now = mv.getCameraOrbit().theta * 180 / Math.PI;
    let theta = FRONT() + (ORBIT[label] ?? 0) + turned;
    theta = now + ((((theta - now) % 360) + 540) % 360 - 180);
    mv.cameraOrbit = `${theta.toFixed(2)}deg ${PITCH} ${DIST()}`;
    clearTimeout(orbitTo.t);
    // pick the slow turntable back up after a while
    if(!keepSpin) orbitTo.t = setTimeout(() => { if(!talking && mv) mv.autoRotate = !LITE; }, 6000);
  }
  // Lite mode (weak PC / phone): same model, but no auto-spin or shadow so it only redraws while dragged
  const LITE = document.documentElement.classList.contains("lite");
  function startModel(){
    if(!customElements.get("model-viewer") && !document.querySelector('script[src*="model-viewer"]')){
      self.ModelViewerElement = Object.assign(self.ModelViewerElement || {}, { dracoDecoderLocation: `${window.FV_BASE || ""}js/vendor/draco/` });
      const s = document.createElement("script");
      s.type = "module";
      s.src = `${window.FV_BASE || ""}js/vendor/model-viewer.min.js`;
      document.head.appendChild(s);
    }
    stopSpin();
    // no picture first: the 2D cut-out never lines up exactly with the model, so it looked like a flash.
    // The stage stays empty (with the loader) and the model fades in when it is ready.
    const poster = "";
    stage.classList.toggle("has-poster", !!poster);
    body.innerHTML = `
      <model-viewer class="cv-model" id="cvModel" src="${variant.src}" alt="${esc(c.name)} 3D model"
        ${poster ? `poster="${poster}"` : ""} loading="eager" reveal="auto"
        autoplay camera-controls disable-pan disable-zoom touch-action="pan-y" interaction-prompt="none"
        ${LITE ? "" : 'auto-rotate auto-rotate-delay="2500" rotation-per-second="22deg"'}
        camera-orbit="${FRONT()}deg ${PITCH} ${DIST()}" min-camera-orbit="auto ${PITCH} auto" max-camera-orbit="auto ${PITCH} auto"
        field-of-view="28deg" interpolation-decay="120"
        shadow-intensity="${LITE ? 0 : 1.3}" shadow-softness="0.7" exposure="1.05" tone-mapping="aces"
        environment-image="neutral">
        <span slot="progress-bar"></span>
      </model-viewer>`;
    mv = document.getElementById("cvModel");
    // no loading screen: the picture (if any) stays until the model is ready, then the model fades in
    mv.addEventListener("load", () => { stage.classList.add("model-ready"); stage.classList.remove("model-swapping"); });
    mv.addEventListener("error", () => { upMsg.textContent = "The 3D model couldn't load. Showing the pictures instead."; });
    // dragging the model by hand stops the turntable for a while
    mv.addEventListener("camera-change", e => {
      if(e.detail.source !== "user-interaction") return;
      mv.autoRotate = false;
      clearTimeout(orbitTo.t);
      orbitTo.t = setTimeout(() => { if(!talking && mv) mv.autoRotate = !LITE; }, 6000);
    });
    figure.classList.remove("no-img", "is-photo");
    figure.classList.add("is-cutout", "is-ready", "has-model");
    stage.classList.add("has-model");
    turnBar.hidden = false;
    turnLabel.textContent = "Drag to turn · scroll to zoom out";
    imgs = [];
    views.querySelector(".cv-view")?.classList.add("is-on");

    function applyVariant(v){
      variant = v;
      // per-model nudge up/down (percent of the stage) for files that sit too low or high
      figure.style.setProperty("--model-lift", (v.lift || 0) + "%");
    }
    applyVariant(variant);

    /* several models: a switcher on the stage */
    if(variants.length > 1){
      const bar = document.createElement("div");
      bar.className = "cv-suits";
      bar.setAttribute("role", "tablist");
      bar.setAttribute("aria-label", "Choose a model");
      bar.innerHTML = `<span class="cv-suits-label">${esc(c.suitLabel || "Suit")}</span>` + variants.map((v, i) => `
        <button type="button" role="tab" class="cv-suit${i ? "" : " is-on"}" aria-selected="${i ? "false" : "true"}" data-i="${i}">
          <span class="cv-suit-no">${String(i + 1).padStart(2, "0")}</span>${esc(v.label)}
        </button>`).join("");
      (document.getElementById("cvSuitSlot") || scene).appendChild(bar);
      bar.addEventListener("click", e => {
        const b = e.target.closest(".cv-suit");
        if(!b || b.classList.contains("is-on")) return;
        const v = variants[+b.dataset.i];
        bar.querySelectorAll(".cv-suit").forEach(x => {
          const on = x === b;
          x.classList.toggle("is-on", on);
          x.setAttribute("aria-selected", on ? "true" : "false");
        });
        stage.classList.remove("model-ready");
        stage.classList.add("model-swapping");
        setTimeout(() => {
          applyVariant(v);
          mv.src = v.src;
          mv.cameraOrbit = `${FRONT()}deg ${PITCH} ${DIST()}`;
          mv.autoRotate = !LITE;
        }, 220);
      });
      mv.addEventListener("load", () => stage.classList.remove("model-swapping"));
    }
  }
  if(hasModel) startModel();

  document.getElementById("csUploadFile").addEventListener("change", async e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if(!file) return;
    if(!file.type.startsWith("image/")){ upMsg.textContent = "Please choose an image file."; return; }
    upMsg.textContent = "Adding image…";
    try{ await putUpload(file); }catch(err){ upMsg.textContent = "Couldn't save that image in this browser."; return; }
    uploadState(await loadFrames());
    paintFrames();
    FV.showToast && FV.showToast(frames.length > 1 ? `${c.name} can turn now. Drag to rotate!` : "Image added.");
  });
  upRemove.addEventListener("click", async () => {
    await delUpload();
    uploadState(await loadFrames());
    paintFrames();
  });

  // saves the view that's showing right now
  document.getElementById("cvDownload").addEventListener("click", () => {
    const mv = body.querySelector("model-viewer");
    if(mv && mv.toDataURL){
      const a = document.createElement("a");
      a.href = mv.toDataURL("image/png"); a.download = `${c.name.replace(/[^\w]+/g, "-").toLowerCase()}-3d.png`;
      document.body.appendChild(a); a.click(); a.remove();
      return;
    }
    const f = frames[cur];
    if(!f){ FV.showToast && FV.showToast("No image to download yet."); return; }
    const a = document.createElement("a");
    a.href = f.src;
    a.download = `${c.name.replace(/[^\w]+/g, "-").toLowerCase()}-${f.label.replace("/", "-").toLowerCase()}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  });

  /* ---------- gentle 3D lean toward the mouse ---------- */
  if(!reduce){
    scene.addEventListener("pointermove", e => {
      const r = scene.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      scene.style.setProperty("--lean-y", (x * 10).toFixed(2) + "deg");
      scene.style.setProperty("--lean-x", (-y * 5).toFixed(2) + "deg");
    });
    scene.addEventListener("pointerleave", () => {
      scene.style.setProperty("--lean-y", "0deg");
      scene.style.setProperty("--lean-x", "0deg");
    });
  }

  /* ---------- speaking: words appear as they are said ----------
     With a recording (assets/voices/<id>.mp3) plus its word timings
     (assets/voices/<id>.json, made from the audio), each word is written into
     the box at the moment it is spoken. Stop pauses both the voice and the
     writing, Play carries on, and Start over clears the box and begins again.
     Characters without a recording use the browser's voice the same way. */
  const playBtn = document.getElementById("csPlay");
  const playText = document.getElementById("csPlayText");
  const restartBtn = document.getElementById("csRestart");
  const liveText = document.getElementById("csLiveText");
  const note = document.getElementById("csNote");
  const box = document.getElementById("csTranscript");
  const placeholder = box.innerHTML;
  const synth = window.speechSynthesis;
  const vBase = `${window.FV_BASE || ""}assets/voices/${c.id}`;
  const exists = url => fetch(url, { method: "HEAD", cache: "no-store" })
    .then(r => r.ok && !/text\/html/.test(r.headers.get("content-type") || "")).catch(() => false);

  // state: "idle" (nothing said yet), "playing", "paused", "done"
  let state = "idle", shown = 0, raf = 0, utter = null;

  // the words to write: from the recording's timings when there are any, otherwise the intro text
  let timed = null;
  // the recording can be an .mp3, .wav or .m4a
  let voiceSrc = null;
  for(const ext of ["mp3", "wav", "m4a"]){ if(await exists(`${vBase}.${ext}`)){ voiceSrc = `${vBase}.${ext}`; break; } }
  let audio = voiceSrc ? new Audio(voiceSrc) : null;
  if(audio){
    audio.preload = "auto";
    timed = await fetch(`${vBase}.json`, { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null);
  }
  const wordList = timed && timed.words && timed.words.length
    ? timed.words.map(w => w.w)
    : intro.split(/\s+/).filter(Boolean);

  function clearBox(){ box.innerHTML = ""; box.classList.remove("is-empty"); shown = 0; }
  function writeUpTo(n){
    // append any words not yet on screen, newest one highlighted
    n = Math.min(n, wordList.length);
    while(shown < n){
      const span = document.createElement("span");
      span.className = "tw is-in";
      span.textContent = wordList[shown];
      box.appendChild(span);
      box.appendChild(document.createTextNode(" "));
      shown++;
    }
    box.querySelectorAll(".tw.is-now").forEach(x => x.classList.remove("is-now"));
    const last = box.querySelector(".tw:last-of-type");
    if(last && state === "playing") last.classList.add("is-now");
    box.scrollTop = box.scrollHeight;
  }

  function setState(next){
    state = next;
    const talkingNow = next === "playing";
    talking = talkingNow;
    stage.classList.toggle("is-talking", talkingNow);
    if(talkingNow) show(0);  // face the viewer while talking
    else if(mv) setTimeout(() => { if(!talking && mv) mv.autoRotate = !LITE; }, 1500);
    playBtn.innerHTML = (talkingNow ? ico.pause : ico.play) + `<span id="csPlayText">${talkingNow ? "Stop" : next === "paused" ? "Resume" : next === "done" ? "Play again" : "Play voice"}</span>`;
    restartBtn.hidden = !(next === "paused" || next === "playing");
    liveText.textContent = talkingNow ? `${firstName} is speaking…` : "";
    if(!talkingNow){ box.querySelectorAll(".tw.is-now").forEach(x => x.classList.remove("is-now")); stage.style.setProperty("--lvl", 0); level = 0; }
  }

  /* loudness meter: the platform glows with the voice (recordings only) */
  let analyser = null, levelBuf = null, level = 0;
  const TOUCH = matchMedia("(pointer: coarse)").matches || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  function hookMeter(){
    if(analyser || !audio || TOUCH) return;
    try{
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const srcNode = ctx.createMediaElementSource(audio);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      levelBuf = new Uint8Array(analyser.fftSize);
      srcNode.connect(analyser); analyser.connect(ctx.destination);
      hookMeter.ctx = ctx;
    }catch(e){ analyser = null; }
  }
  function meter(){
    if(!analyser) return;
    analyser.getByteTimeDomainData(levelBuf);
    let sum = 0;
    for(let i = 0; i < levelBuf.length; i++){ const v = (levelBuf[i] - 128) / 128; sum += v * v; }
    const rms = Math.min(1, Math.sqrt(sum / levelBuf.length) * 2.6);
    level += (rms - level) * (rms > level ? .5 : .12);   // fast attack, slow release
    stage.style.setProperty("--lvl", level.toFixed(3));
  }

  /* recording + timings */
  function tick(){
    if(state !== "playing" || !audio) return;
    meter();
    const t = audio.currentTime;
    let n;
    if(timed && timed.words) n = timed.words.filter(w => w.s <= t + 0.05).length;
    else n = Math.ceil(wordList.length * (audio.duration ? t / audio.duration : 0));
    writeUpTo(n);
    raf = requestAnimationFrame(tick);
  }
  if(audio){
    audio.addEventListener("ended", () => { cancelAnimationFrame(raf); writeUpTo(wordList.length); setState("done"); });
  }

  /* browser voice (characters without a recording) */
  const femaleHint = /female|woman|zira|susan|samantha|victoria|karen|moira|tessa|fiona|hazel|heera|aria|jenny|sonia|libby|natasha/i;
  const maleHint = /male|man|david|mark|george|daniel|alex|fred|ryan|guy|thomas|james|ravi|christopher|eric/i;
  const pickVoice = () => {
    const voices = synth ? synth.getVoices().filter(v => /^en/i.test(v.lang)) : [];
    const want = voiceCfg.female ? femaleHint : maleHint;
    return voices.find(v => want.test(v.name) && !(voiceCfg.female ? maleHint : femaleHint).test(v.name.replace(want, "")))
      || voices.find(v => want.test(v.name)) || voices[0];
  };
  function speakFrom(index){
    synth.cancel();
    const rest = wordList.slice(index).join(" ");
    // map character offsets in `rest` back to word numbers
    const starts = []; let p = 0;
    wordList.slice(index).forEach(w => { starts.push(p); p += w.length + 1; });
    utter = new SpeechSynthesisUtterance(rest);
    const v = pickVoice();
    if(v){ utter.voice = v; utter.lang = v.lang; }
    utter.rate = voiceCfg.rate || 1;
    utter.pitch = voiceCfg.pitch || (voiceCfg.female ? 1.15 : 1);
    let gotBoundary = false, t0 = 0;
    utter.onstart = () => {
      t0 = Date.now();
      writeUpTo(index + 1);
      // some voices never send word events: fall back to an estimate
      clearInterval(speakFrom.timer);
      speakFrom.timer = setInterval(() => {
        if(gotBoundary || state !== "playing") return;
        const chars = (Date.now() - t0) / (62 / utter.rate);
        writeUpTo(index + starts.filter(s => s <= chars).length);
      }, 90);
    };
    utter.onboundary = e => {
      if(e.name && e.name !== "word") return;
      gotBoundary = true;
      writeUpTo(index + starts.filter(s => s <= e.charIndex).length);
    };
    utter.onend = () => { if(state === "playing"){ clearInterval(speakFrom.timer); writeUpTo(wordList.length); setState("done"); } };
    utter.onerror = e => { if(e.error !== "interrupted" && e.error !== "canceled"){ note.textContent = "Couldn't play the voice: " + e.error; setState("paused"); } };
    synth.speak(utter);
  }
  if(!audio && !synth){ note.textContent = "This browser can't speak."; playBtn.disabled = true; }

  /* controls */
  function start(){
    clearBox();
    setState("playing");
    if(audio){
      hookMeter();
      if(hookMeter.ctx && hookMeter.ctx.state === "suspended") hookMeter.ctx.resume();
      audio.currentTime = 0;
      audio.play().then(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); })
        .catch(() => { note.textContent = "Click play again to allow sound."; setState("idle"); box.innerHTML = placeholder; box.classList.add("is-empty"); });
    }else speakFrom(0);
  }
  function pause(){
    if(audio){ audio.pause(); cancelAnimationFrame(raf); }
    else{ clearInterval(speakFrom.timer); synth.cancel(); }  // browser voices can't reliably pause: resume picks up from the next word
    setState("paused");
  }
  function resume(){
    setState("playing");
    if(hookMeter.ctx && hookMeter.ctx.state === "suspended") hookMeter.ctx.resume();
    if(audio) audio.play().then(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); });
    else speakFrom(shown);
  }
  function stopAll(){
    if(audio){ audio.pause(); cancelAnimationFrame(raf); }
    if(synth){ clearInterval(speakFrom.timer); synth.cancel(); }
  }

  playBtn.addEventListener("click", () => {
    if(state === "playing") pause();
    else if(state === "paused") resume();
    else start();                      // idle or done: from the top
  });
  restartBtn.addEventListener("click", () => { stopAll(); start(); });
  window.addEventListener("pagehide", stopAll);

  /* ---------- more from the same fandom ---------- */
  renderMore();
});
