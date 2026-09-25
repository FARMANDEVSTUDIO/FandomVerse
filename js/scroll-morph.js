/* =========================================================
   FandomVerse — scroll-morph.js
   Scroll-driven card morph: cards scatter in, line up, form a
   circle, then page scroll morphs the circle into a bottom arc
   and sweeps the arc sideways. Uses normal page scroll through a
   tall sticky section, so the page never gets scroll-locked.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const section = document.getElementById("scrollMorph");
  const stage = document.getElementById("morphStage");
  const field = document.getElementById("morphField");
  if(!section || !stage || !field || !window.FV || !FV.assets) return;

  const MAX_SCROLL = 3000;
  const introText = document.getElementById("morphIntro");
  const arcText = document.getElementById("morphArcText");

  const data = await FV.data;
  const catName = Object.fromEntries((data.categories || []).map(c => [c.id, c.name]));

  // Every image in assets/images/morph/ is used. data/morph.json is optional extra info
  // (a category per file); a filename like "anime-xyz.jpg" also sets the category.
  const base = (window.FV_BASE || "") + "assets/images/morph/";
  const list = await fetch((window.FV_BASE || "") + "data/morph.json", { cache: "no-store" })
    .then(r => r.ok ? r.json() : []).catch(() => []);
  const meta = Object.fromEntries((list || []).filter(e => e && e.file).map(e => [e.file.toLowerCase(), e]));
  const catIds = Object.keys(catName);
  // images live in category subfolders: assets/images/morph/anime/..., /kpop/... etc.
  const files = FV.folderImagesByCategory ? await FV.folderImagesByCategory("morph", catIds) : null;
  const picks = (files ? files : (list || []).filter(e => e && e.file))
    .map(e => {
      const m = meta[e.file.toLowerCase()] || {};
      const category = e.category || m.category || "";
      const src = base + e.file.split("/").map(encodeURIComponent).join("/");
      return { src, category, alt: m.alt || catName[category] || "" };
    });
  if(picks.length < 2){ section.style.display = "none"; return; }
  const count = picks.length;

  field.innerHTML = picks.map((p) => {
    const label = catName[p.category] || "FandomVerse";
    const href = catName[p.category] ? `category.html?cat=${encodeURIComponent(p.category)}` : "#categories";
    return `
    <a class="morph-card" href="${href}" aria-label="${FV.escapeHtml(label)}">
      <span class="morph-card-inner">
        <span class="morph-face morph-front"><img src="${FV.escapeHtml(p.src)}" alt="${FV.escapeHtml(p.alt)}" loading="lazy" draggable="false"></span>
        <span class="morph-face morph-back"><small>View</small><strong>${FV.escapeHtml(label)}</strong></span>
      </span>
    </a>`;
  }).join("");
  const cards = Array.from(field.children);

  const lerp = (a, b, t) => a * (1 - t) + b * t;
  const clamp01 = v => Math.min(Math.max(v, 0), 1);

  const scatter = cards.map(() => ({
    x: (Math.random() - 0.5) * 1500, y: (Math.random() - 0.5) * 1000,
    r: (Math.random() - 0.5) * 180, s: 0.6, o: 0,
  }));
  const current = scatter.map(p => ({ ...p }));

  let phase = "scatter";
  let W = stage.clientWidth, H = stage.clientHeight;
  let morph = 0, rotate = 0, parallax = 0, mouseTarget = 0;
  let introOpacity = 0, arcOpacity = 0;
  let running = false, started = false;

  function sizeStage(){
    const header = document.getElementById("siteHeader");
    const top = header ? header.offsetHeight : 0;
    stage.style.top = top + "px";
    stage.style.height = (window.innerHeight - top) + "px";
    W = stage.clientWidth; H = stage.clientHeight;
  }
  sizeStage();
  window.addEventListener("resize", sizeStage);

  function scrollValue(){
    const rect = section.getBoundingClientRect();
    const stageTop = parseFloat(stage.style.top) || 0;
    const travel = section.offsetHeight - stage.offsetHeight;
    if(travel <= 0) return 0;
    return clamp01((stageTop - rect.top) / travel) * MAX_SCROLL;
  }

  stage.addEventListener("mousemove", (e) => {
    const rect = stage.getBoundingClientRect();
    mouseTarget = (((e.clientX - rect.left) / rect.width) * 2 - 1) * 100;
  });
  stage.addEventListener("mouseleave", () => { mouseTarget = 0; });

  function targetFor(i){
    if(phase === "scatter") return scatter[i];
    if(phase === "line"){
      const spacing = Math.min(70, (W - 40) / count);
      return { x: i * spacing - (count * spacing) / 2 + spacing / 2, y: 0, r: 0, s: 1, o: 1 };
    }
    const isMobile = W < 768;
    const minDim = Math.min(W, H);
    const circleRadius = Math.min(minDim * (isMobile ? 0.4 : 0.35), 350);
    const ca = (i / count) * 360;
    const cr = ca * Math.PI / 180;
    const circle = { x: Math.cos(cr) * circleRadius, y: Math.sin(cr) * circleRadius, r: ca + 90 };

    const arcRadius = Math.min(W, H * 1.5) * (isMobile ? 1.4 : 1.1);
    const arcCenterY = H * (isMobile ? 0.35 : 0.25) + arcRadius;
    const spread = isMobile ? 100 : 130;
    const step = spread / (count - 1);
    const sweep = -clamp01(rotate) * spread * 0.8;
    const aa = -90 - spread / 2 + i * step + sweep;
    const ar = aa * Math.PI / 180;
    const arc = {
      x: Math.cos(ar) * arcRadius + parallax,
      y: Math.sin(ar) * arcRadius + arcCenterY,
      r: aa + 90, s: isMobile ? 2.1 : 1.8,   // phones: bigger cards so they read on a small screen
    };
    return {
      x: lerp(circle.x, arc.x, morph), y: lerp(circle.y, arc.y, morph),
      r: lerp(circle.r, arc.r, morph), s: lerp(isMobile ? 1.35 : 1, arc.s, morph), o: 1,
    };
  }

  function frame(){
    if(!running) return;
    const v = scrollValue();
    morph += (clamp01(v / 600) - morph) * 0.08;
    rotate += (clamp01((v - 600) / 2400) - rotate) * 0.08;
    parallax += (mouseTarget - parallax) * 0.06;

    cards.forEach((card, i) => {
      const t = targetFor(i), c = current[i];
      const k = phase === "circle" ? 0.1 : 0.06;
      const dx = t.x - c.x, dy = t.y - c.y, dr = t.r - c.r, ds = t.s - c.s, dO = t.o - c.o;
      // a card that has reached its spot is left alone (no style writes = far less work for the browser)
      if(Math.abs(dx) + Math.abs(dy) < 0.15 && Math.abs(dr) < 0.05 && Math.abs(ds) < 0.001 && Math.abs(dO) < 0.002 && card._placed) return;
      c.x += dx * k; c.y += dy * k; c.r += dr * k; c.s += ds * k; c.o += dO * k;
      card.style.transform = `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px) rotate(${c.r.toFixed(2)}deg) scale(${c.s.toFixed(3)})`;
      card.style.opacity = c.o.toFixed(3);
      card._placed = true;
    });

    const introTarget = phase === "circle" && morph < 0.5 ? 1 - morph * 2 : 0;
    introOpacity += (introTarget - introOpacity) * 0.08;
    if(introText) introText.style.opacity = introOpacity.toFixed(3);

    const arcTarget = clamp01((morph - 0.8) / 0.2);
    arcOpacity += (arcTarget - arcOpacity) * 0.12;
    if(arcText){
      arcText.style.opacity = arcOpacity.toFixed(3);
      arcText.style.transform = `translate(-50%, ${((1 - arcOpacity) * 20).toFixed(1)}px)`;
      arcText.style.pointerEvents = arcOpacity > 0.5 ? "auto" : "none";
    }
    requestAnimationFrame(frame);
  }

  new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        if(!running){ running = true; requestAnimationFrame(frame); }
        if(!started){
          started = true;
          setTimeout(() => { phase = "line"; }, 500);
          setTimeout(() => { phase = "circle"; }, 2500);
        }
      }else{
        running = false;
      }
    });
  }, { threshold: 0 }).observe(section);
});
