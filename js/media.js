/* =========================================================
   FandomVerse — media.js
   Click a media card to play it in a popup player.
   1. A downloaded clip in assets/media/ named after the item id
      (t1.mp4, t6.webm, t12.mp3 ...) plays first: no internet needed.
   2. Otherwise the item's official YouTube video plays (needs internet);
      "end" in trailers.json stops long videos after ~3 minutes.
   ========================================================= */

window.FV = window.FV || {};

const FV_VIDEO_EXTS = ["mp4", "webm", "m4v", "mov", "ogv"];
const FV_AUDIO_EXTS = ["mp3", "m4a", "wav", "ogg", "aac"];
let fvMediaListing = null;

function fvMediaFiles(){
  if(!fvMediaListing){
    fvMediaListing = (FV.assetManifest ? FV.assetManifest() : Promise.resolve(null)).then(m => m ? (m["media"] || []) : fetch((window.FV_BASE || "") + "assets/media/", { cache: "no-store" })
      .then(r => r.ok ? r.text() : "")
      .then(html => {
        if(!/Directory listing|Index of/i.test(html)) return null;
        const names = [];
        html.replace(/href="([^"?#]+)"/gi, (m, h) => { try{ names.push(decodeURIComponent(h)); }catch(e){} return m; });
        return names.filter(n => !n.endsWith("/"));
      })
      .catch(() => null));
  }
  return fvMediaListing;
}

// Finds "t1.mp4", "T1.MP4", "t1.mp4.mp4" … for id "t1". Returns {src, kind} or null.
async function fvFindMedia(id){
  const base = (window.FV_BASE || "") + "assets/media/";
  const names = await fvMediaFiles();
  if(names){
    const lid = id.toLowerCase();
    const hit = names
      .filter(n => n.toLowerCase().startsWith(lid + "."))
      .map(n => ({ n, ext: n.split(".").pop().toLowerCase() }))
      .filter(x => FV_VIDEO_EXTS.includes(x.ext) || FV_AUDIO_EXTS.includes(x.ext))
      .sort((a, b) => a.n.length - b.n.length)[0];
    if(!hit) return null;
    return { src: base + encodeURIComponent(hit.n), kind: FV_AUDIO_EXTS.includes(hit.ext) ? "audio" : "video" };
  }
  // no folder listing (not on the dev server): probe the common formats
  for(const ext of ["mp4", "webm", "mp3", "m4a"]){
    try{
      const r = await fetch(base + id + "." + ext, { method: "HEAD" });
      if(r.ok) return { src: base + id + "." + ext, kind: FV_AUDIO_EXTS.includes(ext) ? "audio" : "video" };
    }catch(e){}
  }
  return null;
}

FV.openMedia = async function openMedia(id){
  const data = await FV.data;
  const t = (data.trailers || []).find(x => x.id === id);
  if(!t) return;
  const cat = (data.categories || []).find(c => c.id === t.category);
  const esc = s => FV.escapeHtml(String(s ?? ""));

  let overlay = document.getElementById("mediaOverlay");
  if(!overlay){
    overlay = document.createElement("div");
    overlay.id = "mediaOverlay";
    overlay.className = "media-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `<div class="media-panel" role="dialog" aria-modal="true" aria-labelledby="mediaTitle">
      <button class="icon-btn media-close" type="button" aria-label="Close player">✕</button>
      <div class="media-stage" id="mediaStage"></div>
      <div class="media-info" id="mediaInfo"></div>
    </div>`;
    document.body.appendChild(overlay);
    const close = () => {
      overlay.querySelectorAll("video, audio").forEach(m => m.pause());
      overlay.querySelectorAll("iframe").forEach(f => f.remove());   // stops a YouTube video
      overlay.classList.remove("open");
      document.body.style.overflow = "";
      setTimeout(() => { overlay.hidden = true; overlay.querySelector("#mediaStage").innerHTML = ""; }, 250);
    };
    overlay.querySelector(".media-close").addEventListener("click", close);
    overlay.addEventListener("click", e => { if(e.target === overlay) close(); });
    document.addEventListener("keydown", e => { if(e.key === "Escape" && !overlay.hidden) close(); });
  }

  const stage = overlay.querySelector("#mediaStage");
  const art = FV.poster ? FV.poster(t.id, cat ? cat.color : "#e8382f", cat ? cat.color2 : "#f4c430", t.title).replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ') : "";
  overlay.querySelector("#mediaInfo").innerHTML = `
    <div class="media-tags">${cat ? `<span class="media-cat" style="--cat:${cat.color}">${esc(cat.name)}</span>` : ""}<span class="media-type">${esc(t.type)}</span></div>
    <h2 id="mediaTitle">${esc(t.title)}</h2>
    <p>${esc(t.description)}</p>`;
  stage.innerHTML = `<div class="media-loading">${art}<span class="media-spinner" aria-label="Loading"></span></div>`;
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add("open"));
  document.body.style.overflow = "hidden";

  // a downloaded clip in assets/media/ wins over YouTube
  const local = await fvFindMedia(t.id);
  if(local){
    stage.innerHTML = local.kind === "audio"
      ? `<div class="media-audio">${art}<audio controls autoplay src="${local.src}"></audio></div>`
      : `<video controls autoplay playsinline src="${local.src}"></video>`;
    return;
  }
  // official videos: played from YouTube inside the popup (needs internet)
  if(t.youtube){
    const yt = encodeURIComponent(t.youtube);
    const cut = t.end ? `&end=${Number(t.end)}` : "";
    stage.innerHTML = `<iframe class="media-yt" src="https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1${cut}"
      title="${esc(t.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    overlay.querySelector("#mediaInfo").insertAdjacentHTML("beforeend",
      `<a class="media-yt-link" href="https://www.youtube.com/watch?v=${yt}" target="_blank" rel="noopener">Watch on YouTube ↗</a>`);
    return;
  }

  const media = await fvFindMedia(t.id);
  if(!media){
    stage.innerHTML = `<div class="media-missing">${art}<div class="media-missing-note"><strong>Clip coming soon</strong><span>This ${esc((t.type || "clip").toLowerCase())} hasn't been uploaded yet.</span></div></div>`;
    return;
  }
  if(media.kind === "audio"){
    stage.innerHTML = `<div class="media-audio">${art}<audio controls autoplay src="${media.src}"></audio></div>`;
  }else{
    stage.innerHTML = `<video controls autoplay playsinline src="${media.src}"></video>`;
  }
};

// Every trailer card on any page opens the player (cards are rendered dynamically).
document.addEventListener("click", e => {
  const card = e.target.closest(".trailer-card[data-media-id]");
  if(!card || e.target.closest(".bookmark-btn")) return;
  FV.openMedia(card.dataset.mediaId);
});
document.addEventListener("keydown", e => {
  if(e.key !== "Enter" && e.key !== " ") return;
  const card = e.target.closest && e.target.closest(".trailer-card[data-media-id]");
  if(!card) return;
  e.preventDefault();
  FV.openMedia(card.dataset.mediaId);
});

// trailers.html?play=t6 opens that video straight away (used by the chat assistant)
document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(location.search).get("play");
  if(id && /^t\d+$/.test(id)) setTimeout(() => FV.openMedia(id), 600);
});
