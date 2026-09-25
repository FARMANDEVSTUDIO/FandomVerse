/* =========================================================
   FandomVerse — timeline.js
   Pinned horizontal "upcoming" timeline. While the tall section
   scrolls past, the track slides sideways, the axis line draws,
   and each event grows its stem, pops its dot, and slides its
   copy up out of a mask. Driven by page scroll, no libraries.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const section = document.getElementById("journey");
  const stage = document.getElementById("journeyStage");
  const slider = document.getElementById("journeySlider");
  const line = document.getElementById("journeyLine");
  const topRow = document.getElementById("journeyTop");
  const bottomRow = document.getElementById("journeyBottom");
  if(!section || !stage || !slider || !topRow || !bottomRow || !window.FV) return;

  const data = await FV.data;
  const catMap = Object.fromEntries((data.categories || []).map(c => [c.id, c]));

  // earliest events, one per category where possible
  const sorted = [...(data.events || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
  const seen = new Set();
  let picks = sorted.filter(e => !seen.has(e.category) && seen.add(e.category));
  if(picks.length < 7) picks = picks.concat(sorted.filter(e => !picks.includes(e))).slice(0, 7);
  picks = picks.slice(0, 7).sort((a, b) => new Date(a.date) - new Date(b.date));
  if(!picks.length) return;

  const fmt = d => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const first = new Date(picks[0].date), last = new Date(picks[picks.length - 1].date);
  const period = document.getElementById("journeyPeriod");
  if(period){
    const m = d => d.toLocaleDateString("en-GB", { month: "short" });
    period.textContent = `${m(first)} — ${m(last)} ${last.getFullYear()}`;
  }

  const mask = (cls, html) => `<span class="journey-mask"><span class="journey-rise ${cls}">${html}</span></span>`;
  function itemHtml(e, pos){
    const c = catMap[e.category];
    const stem = pos === "top"
      ? `<span class="journey-dot"></span><span class="journey-stem"></span>`
      : `<span class="journey-stem"></span><span class="journey-dot"></span>`;
    return `
      <div class="journey-item journey-item-${pos}" style="--event-color:${c ? c.color : "var(--brand)"}">
        <div class="journey-marker" aria-hidden="true">${stem}</div>
        <div class="journey-copy">
          ${mask("journey-cat", FV.escapeHtml(c ? c.name : e.category))}
          ${mask("journey-date", FV.escapeHtml(fmt(e.date)))}
          ${mask("journey-desc", FV.escapeHtml(e.title))}
        </div>
      </div>`;
  }

  // chronological order alternates top, bottom, top... so the axis reads left to right
  const top = picks.filter((_, i) => i % 2 === 0);
  const bottom = picks.filter((_, i) => i % 2 === 1);
  topRow.innerHTML = top.map(e => itemHtml(e, "top")).join("");
  bottomRow.innerHTML = bottom.map(e => itemHtml(e, "bottom")).join("");

  const ordered = [];
  const topEls = Array.from(topRow.children), bottomEls = Array.from(bottomRow.children);
  picks.forEach((_, i) => ordered.push(i % 2 === 0 ? topEls[i / 2] : bottomEls[(i - 1) / 2]));
  const parts = ordered.map(el => ({
    stem: el.querySelector(".journey-stem"),
    dot: el.querySelector(".journey-dot"),
    rises: Array.from(el.querySelectorAll(".journey-rise")),
  }));

  const clamp01 = v => Math.min(Math.max(v, 0), 1);
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  function sizeStage(){
    const header = document.getElementById("siteHeader");
    const top = header ? header.offsetHeight : 0;
    stage.style.top = top + "px";
    stage.style.height = (window.innerHeight - top) + "px";
  }
  sizeStage();
  window.addEventListener("resize", sizeStage);

  function render(){
    const isMobile = window.innerWidth < 600;
    const stageTop = parseFloat(stage.style.top) || 0;
    const rect = section.getBoundingClientRect();
    const travel = section.offsetHeight - stage.offsetHeight;
    const p = travel > 0 ? clamp01((stageTop - rect.top) / travel) : 0;

    const slideEnd = 0.92;
    const slidePercent = isMobile ? -57 : -65;
    slider.style.transform = `translate3d(${(clamp01(p / slideEnd) * slidePercent).toFixed(3)}%, 0, 0)`;

    const lineWidth = isMobile ? 65 : 98;
    const lp = clamp01((p - (isMobile ? 0.08 : 0.04)) / (slideEnd - 0.06));
    if(line) line.style.width = (lp * lineWidth).toFixed(2) + "%";

    const positions = isMobile
      ? [[22,32],[28,38],[36,46],[45,55],[52,62],[60,70],[69,79]]
      : [[6,26],[16,36],[26,46],[35,55],[45,65],[55,75],[65,85]];

    parts.forEach((part, i) => {
      const [s, e] = positions[i] || positions[positions.length - 1];
      const t = clamp01((p * 100 - s) / (e - s));
      const grow = easeOut(clamp01(t / 0.4));
      if(part.stem) part.stem.style.transform = `scaleY(${grow.toFixed(3)})`;
      if(part.dot) part.dot.style.transform = `translateX(-50%) scale(${grow.toFixed(3)})`;
      part.rises.forEach((r, k) => {
        const rt = easeOut(clamp01((t - 0.2 - k * 0.08) / 0.55));
        r.style.transform = `translateY(${((1 - rt) * 110).toFixed(1)}%)`;
      });
    });
  }

  let ticking = false, active = false;
  function onScroll(){
    if(!active || ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; render(); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { sizeStage(); render(); });
  new IntersectionObserver(entries => {
    entries.forEach(entry => { active = entry.isIntersecting; if(active) render(); });
  }).observe(section);
  render();
});
