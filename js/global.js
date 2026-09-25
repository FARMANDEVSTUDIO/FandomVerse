/* =========================================================
   FandomVerse — global.js
   Preloader, clock, footer year, toast, glow-card shadow tracking,
   number counters, back-to-top. Runs on every page.
   ========================================================= */

window.FV = window.FV || {};

FV.showToast = function showToast(msg, duration = 2800){
  const toast = document.getElementById("toast");
  if(!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(FV._toastTimer);
  FV._toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
};

/* Counts a number up from 0 once its element scrolls into view. Flat,
   no fade/blur — just the digits ticking, matching the poster/print style. */
FV.animateCount = function animateCount(el){
  if(!el) return;
  const target = parseInt(el.dataset.count ?? el.textContent, 10);
  if(!Number.isFinite(target)){ return; }
  const duration = 900;
  const start = performance.now();
  function tick(now){
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased);
    if(p < 1) requestAnimationFrame(tick);
    else{ el.textContent = target; el.classList.add("count-done"); }
  }
  requestAnimationFrame(tick);
  // if animation frames are paused (background tab, slow PC), still show the real number
  setTimeout(() => { if(el.textContent !== String(target)){ el.textContent = target; el.classList.add("count-done"); } }, duration + 1200);
};

/* Types a phrase, holds, deletes it, moves to the next — cycles forever. */
FV.typewriterRotate = function typewriterRotate(el, phrases, opts = {}){
  if(!el || !phrases || !phrases.length) return;
  const typeSpeed = opts.typeSpeed ?? 55;
  const deleteSpeed = opts.deleteSpeed ?? 32;
  const holdMs = opts.holdMs ?? 1500;
  let phraseIndex = 0, text = "", deleting = false;
  function step(){
    const current = phrases[phraseIndex % phrases.length];
    el.textContent = text;
    if(!deleting && text === current){
      setTimeout(() => { deleting = true; step(); }, holdMs);
      return;
    }
    if(deleting && text === ""){
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      setTimeout(step, typeSpeed);
      return;
    }
    text = current.slice(0, deleting ? text.length - 1 : text.length + 1);
    setTimeout(step, deleting ? deleteSpeed : typeSpeed);
  }
  step();
};


/* ---------- accessibility settings (text size, contrast, motion, links, spacing) ---------- */
FV.getA11y = function(){ try{ return JSON.parse(localStorage.getItem("fv_a11y") || "{}"); }catch(e){ return {}; } };
FV.setA11y = function(change){
  const p = change === null ? {} : Object.assign(FV.getA11y(), change);
  try{ change === null ? localStorage.removeItem("fv_a11y") : localStorage.setItem("fv_a11y", JSON.stringify(p)); }catch(e){}
  const r = document.documentElement;
  r.style.fontSize = p.size && p.size !== 100 ? p.size + "%" : "";
  ["contrast", "motion", "links", "spacing"].forEach(k => r.classList.toggle("a11y-" + k, !!p[k]));
  return p;
};

/* ---------- performance mode: "auto" (detect), "lite" or "full" ---------- */
FV.getPerf = function(){ try{ return localStorage.getItem("fv_perf") || "auto"; }catch(e){ return "auto"; } };
FV.setPerf = function(mode){
  try{ mode === "auto" ? localStorage.removeItem("fv_perf") : localStorage.setItem("fv_perf", mode); sessionStorage.removeItem("fv_gpu"); }catch(e){}
  location.reload();   // the choice is applied by the script at the top of every page
};

/* ---------- form validation helpers ---------- */
FV.validName = v => /^[A-Za-z][A-Za-z .'-]{1,49}$/.test(v.trim());
FV.validEmail = v => /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v.trim());
FV.validPhone = v => /^(\+92|0)3\d{2}[\s-]?\d{7}$/.test(v.trim());

// Name/city fields: letters, spaces, . ' - only. Phone fields: digits, + and spaces only.
document.addEventListener("input", e => {
  const el = e.target;
  if(!el.matches) return;
  if(el.matches("#fbName, #suName, #coName, #coCity")){
    const clean = el.value.replace(/[^A-Za-z .'-]/g, "");
    if(clean !== el.value){
      el.value = clean;
      FV.showToast && FV.showToast("Names can only contain letters and spaces.");
    }
  }else if(el.matches("#coPhone")){
    el.value = el.value.replace(/[^0-9+\s-]/g, "").slice(0, 15);
  }
});

FV.initCounters = function initCounters(root = document){
  // hero stats are started by the hero intro instead, so they don't finish behind the preloader
  const els = Array.from(root.querySelectorAll("[data-count]")).filter(el => !el.closest(".hero-planet"));
  if(!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){ FV.animateCount(entry.target); io.unobserve(entry.target); }
    });
  }, { threshold: .6 });
  els.forEach(el => io.observe(el));
};

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- preloader ---------- */
  const preloader = document.getElementById("preloader");
  const planetHero = document.querySelector(".hero-planet");
  let preloaderDone = false;
  function hidePreloader(){
    if(preloaderDone) return;
    preloaderDone = true;
    preloader && preloader.classList.add("loaded");
    // hero intro starts once the preloader is fading, otherwise it plays hidden behind it
    if(planetHero){
      setTimeout(() => planetHero.classList.add("planet-go"), 150);
      // stats row fades in at ~.65s; start counting as it lands
      setTimeout(() => {
        const stats = planetHero.querySelector(".planet-stats");
        stats && stats.classList.add("stats-go");
        planetHero.querySelectorAll("[data-count]").forEach(el => FV.animateCount(el));
      }, 950);
    }
  }
  // the logo fills with the real loading progress (inline script in the page); fade out a moment after it is full
  function tryHide(){
    if(preloaderDone) return;
    const full = preloader && parseFloat(preloader.dataset.full || "0");
    if(!preloader || (full && performance.now() - full >= 250)) return hidePreloader();
    setTimeout(tryHide, 80);
  }
  tryHide();
  setTimeout(hidePreloader, 9500);   // never block the page for long

  /* ---------- page entrance ---------- */
  const main = document.getElementById("main");
  if(main && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    main.style.opacity = "0";
    main.style.transform = "translateY(14px)";
    main.style.transition = "opacity .45s var(--ease), transform .45s var(--ease)";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      main.style.opacity = "1";
      main.style.transform = "translateY(0)";
    }));
    // a leftover transform keeps the whole page on a composited layer, which renders text soft
    const clearEntrance = () => { main.style.removeProperty("transform"); main.style.removeProperty("transition"); main.style.removeProperty("opacity"); };
    main.addEventListener("transitionend", (e) => { if(e.target === main) clearEntrance(); }, { once: true });
    setTimeout(clearEntrance, 900);
  }

  /* ---------- button ripple on click ---------- */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn");
    if(!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    const ripple = document.createElement("span");
    ripple.className = "btn-ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
    ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  /* ---------- scroll progress bar ---------- */
  const progressBar = document.createElement("div");
  progressBar.className = "scroll-progress";
  progressBar.setAttribute("aria-hidden", "true");
  document.body.prepend(progressBar);
  window.addEventListener("scroll", () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    progressBar.style.setProperty("--p", max > 0 ? (h.scrollTop / max).toFixed(4) : 0);
  }, { passive: true });

  /* ---------- theme toggle (light/dark, persisted, synced across tabs) ---------- */
  const themeBtn = document.getElementById("themeToggle");
  if(themeBtn){
    themeBtn.addEventListener("click", () => {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      if(isLight){
        document.documentElement.removeAttribute("data-theme");
        try{ localStorage.setItem("fv_theme", "dark"); }catch(e){}
      }else{
        document.documentElement.setAttribute("data-theme", "light");
        try{ localStorage.setItem("fv_theme", "light"); }catch(e){}
      }
    });
  }

  /* ---------- footer year ---------- */
  const yearEl = document.getElementById("year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- live clock ---------- */
  const clockEl = document.getElementById("liveClock");
  const dateEl = document.getElementById("liveDate");
  function tick(){
    const now = new Date();
    if(clockEl) clockEl.textContent = now.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", second:"2-digit"});
    if(dateEl) dateEl.textContent = now.toLocaleDateString([], {weekday:"short", day:"numeric", month:"short"});
  }
  tick(); setInterval(tick, 1000);

  /* ---------- honest local view counter ---------- */
  const viewsEl = document.getElementById("localViews");
  if(viewsEl){
    try{
      const n = (parseInt(localStorage.getItem("fv_views"), 10) || 0) + 1;
      localStorage.setItem("fv_views", n);
      viewsEl.textContent = n;
    }catch(e){ viewsEl.textContent = "1"; }
  }

  /* ---------- glow-card hard-shadow cursor tracking (flat, no blur) ---------- */
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest?.(".glow-card");
    if(!card) return;
    const rect = card.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--shadow-x", `${(-relX * 10).toFixed(1)}px`);
    card.style.setProperty("--shadow-y", `${(-relY * 10).toFixed(1)}px`);
  }, { passive: true });

  /* ---------- number counters (hero stats, etc.) ---------- */
  FV.initCounters();

  /* ---------- pause looping animations while they are off screen ---------- */
  if("IntersectionObserver" in window){
    const pauseIO = new IntersectionObserver((entries) => {
      entries.forEach(en => en.target.classList.toggle("fx-offscreen", !en.isIntersecting));
    });
    document.querySelectorAll(".poster-section, .ticker, .banner-image").forEach(el => pauseIO.observe(el));
  }

  /* ---------- back to top ---------- */
  const backToTop = document.getElementById("backToTop");
  window.addEventListener("scroll", () => { if(backToTop) backToTop.classList.toggle("show", window.scrollY > 500); }, { passive: true });
  backToTop && backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- demo auth buttons ---------- */
  document.getElementById("loginBtn")?.addEventListener("click", () => { window.location.href = (window.FV_BASE || "") + "login.html"; });
  document.getElementById("signupBtn")?.addEventListener("click", () => { window.location.href = (window.FV_BASE || "") + "signup.html"; });

  /* ---------- footer misc links ---------- */
  document.getElementById("privacyLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    FV.showToast("Privacy note: bookmarks and cart items live only in your browser's localStorage. Nothing is sent to a server.");
  });
  document.getElementById("a11yLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    FV.showToast("Built with semantic HTML, visible focus states, alt text, and reduced-motion support.");
  });
});
