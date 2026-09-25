/* =========================================================
   watchlist.js — "Watchlist" on every trailer card
   Saved in this browser, per user. The profile page lists it.
   ========================================================= */
window.FV = window.FV || {};
(function(){
  const who = () => { try{ return (FV.getUser && FV.getUser() || {}).email || "guest"; }catch(e){ return "guest"; } };
  const KEY = () => "fv_watch:" + who();
  FV.getWatch = () => { try{ return JSON.parse(localStorage.getItem(KEY())) || []; }catch(e){ return []; } };
  const setWatch = v => { try{ localStorage.setItem(KEY(), JSON.stringify(v)); }catch(e){} };
  FV.inWatch = id => FV.getWatch().includes(id);
  const label = on => `${FV.gi ? FV.gi("heart", 15) : ""}<span>${on ? "In watchlist" : "Watchlist"}</span>`;
  FV.watchBtn = id => `<button type="button" class="wl-btn ${FV.inWatch(id) ? "on" : ""}" data-watch="${id}" aria-pressed="${FV.inWatch(id)}">${label(FV.inWatch(id))}</button>`;

  // runs before the card's own "play" click, so tapping the heart doesn't open the video
  function toggle(e){
    const b = e.target.closest && e.target.closest(".wl-btn"); if(!b) return;
    e.stopPropagation(); e.preventDefault();
    if(e.type !== "click") return;
    const id = b.dataset.watch;
    let list = FV.getWatch();
    const on = !list.includes(id);
    list = on ? [id].concat(list) : list.filter(x => x !== id);
    setWatch(list);
    document.querySelectorAll(`.wl-btn[data-watch="${id}"]`).forEach(x => { x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); x.innerHTML = label(on); });
    FV.showToast && FV.showToast(on ? "Added to your watchlist." : "Removed from your watchlist.");
    drawProfile();
  }
  document.addEventListener("click", toggle, true);
  document.addEventListener("keydown", e => { if((e.key === "Enter" || e.key === " ") && e.target.closest && e.target.closest(".wl-btn")){ e.stopPropagation(); } }, true);

  // profile: the saved list
  async function drawProfile(){
    const el = document.getElementById("watchList"); if(!el) return;
    const data = await FV.data, ids = FV.getWatch();
    const items = ids.map(id => (data.trailers || []).find(t => t.id === id)).filter(Boolean);
    document.getElementById("watchCount").textContent = items.length ? `${items.length} saved` : "";
    el.innerHTML = items.length ? items.map(t => `<a class="wl-item" href="trailers.html?play=${t.id}">
        ${t.youtube ? `<img src="https://i.ytimg.com/vi/${encodeURIComponent(t.youtube)}/mqdefault.jpg" alt="" loading="lazy">` : ""}
        <span><strong>${FV.escapeHtml(t.title)}</strong><small>${FV.escapeHtml(t.type || "")}${t.duration ? " · " + FV.escapeHtml(t.duration) : ""}</small></span></a>`).join("")
      : `<p class="wl-empty">Nothing yet. Tap <b>Watchlist</b> on any trailer in <a href="trailers.html">Media</a>.</p>`;
  }
  document.addEventListener("DOMContentLoaded", drawProfile);
})();
