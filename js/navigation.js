/* =========================================================
   FandomVerse — navigation.js
   Mobile drawer, active nav-link, in-page smooth-scroll.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = document.body.dataset.page;
  if(currentPage){
    document.querySelectorAll(".nav-link[data-page]").forEach(l => l.classList.toggle("active", l.dataset.page === currentPage));
    document.querySelectorAll(".mobile-drawer a[data-page]").forEach(l => l.classList.toggle("active", l.dataset.page === currentPage));
  }

  const hamburger = document.getElementById("hamburger");
  const drawer = document.getElementById("mobileDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  function closeDrawer(){ hamburger.setAttribute("aria-expanded","false"); drawer.classList.remove("open"); backdrop.classList.remove("open"); drawer.setAttribute("aria-hidden","true"); }
  function openDrawer(){ hamburger.setAttribute("aria-expanded","true"); drawer.classList.add("open"); backdrop.classList.add("open"); drawer.setAttribute("aria-hidden","false"); }
  // on small phones the header theme button is hidden: the drawer carries its own copy
  const themeBtn = document.getElementById("themeToggle");
  if(drawer && themeBtn && !drawer.querySelector(".drawer-theme")){
    const t = document.createElement("button");
    t.type = "button";
    t.className = "drawer-theme";
    const label = () => document.documentElement.getAttribute("data-theme") === "light" ? "Dark mode" : "Light mode";
    t.innerHTML = `<span class="drawer-theme-icon">${themeBtn.innerHTML}</span><span class="drawer-theme-label">${label()}</span>`;
    t.addEventListener("click", () => { themeBtn.click(); t.querySelector(".drawer-theme-label").textContent = label(); });
    (drawer.querySelector(".mobile-drawer-actions") || drawer).before(t);
  }

  hamburger && hamburger.addEventListener("click", () => drawer.classList.contains("open") ? closeDrawer() : openDrawer());
  backdrop && backdrop.addEventListener("click", closeDrawer);
  drawer && drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", closeDrawer));
  document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeDrawer(); });

  const headerEl = document.getElementById("siteHeader");
  function headerOffset(){ return headerEl ? headerEl.offsetHeight + 16 : 90; }
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(link => {
    link.addEventListener("click", (e) => {
      const target = document.querySelector(link.getAttribute("href"));
      if(!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset();
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
});
