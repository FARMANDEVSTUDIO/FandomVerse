/* =========================================================
   FandomVerse — animations.js
   Scroll-reveal for .reveal elements, respects prefers-reduced-motion.
   ========================================================= */

window.FV = window.FV || {};

FV.initReveal = function initReveal(root = document){
  const targets = root.querySelectorAll(".reveal:not(.in-view)");
  if(!targets.length) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduceMotion){ targets.forEach(el => el.classList.add("in-view")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add("in-view"); io.unobserve(entry.target); } });
  }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
  targets.forEach((el, i) => { el.style.transitionDelay = Math.min(i * 40, 320) + "ms"; io.observe(el); });
};

FV.markReveal = function markReveal(){
  document.querySelectorAll(
    ".cat-chip, .article-card, .char-card, .event-row, .trailer-card, .merch-card, .about-badges li, .hstack-card"
  ).forEach(el => el.classList.add("reveal"));
};

document.addEventListener("DOMContentLoaded", () => { FV.markReveal(); FV.initReveal(); });
