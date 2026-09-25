/* =========================================================
   myfandom.js — "My Fandom": favourite fandoms + personal feed
   Profile page: pick favourites. Home page (logged in): a
   welcome row with a feed built from those fandoms.
   Saved in this browser only, per user.
   ========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  const user = FV.getUser && FV.getUser();
  const picker = document.getElementById("favPicker");
  const home = document.getElementById("myFandom");
  if(!user || (!picker && !home)) return;

  const esc = s => FV.escapeHtml(String(s ?? ""));
  const KEY = "fv_fav:" + user.email;
  const getFav = () => { try{ return JSON.parse(localStorage.getItem(KEY)) || []; }catch(e){ return []; } };
  const setFav = v => { try{ localStorage.setItem(KEY, JSON.stringify(v)); }catch(e){} };
  const data = await FV.data;
  const cats = data.categories || [];

  // ---- profile: toggle chips
  function drawPicker(el){
    const fav = getFav();
    el.innerHTML = cats.map(c => `<button type="button" class="fav-chip ${fav.includes(c.id) ? "on" : ""}" data-cat="${c.id}" aria-pressed="${fav.includes(c.id)}" style="--c:${c.color}">${esc(c.name)}</button>`).join("");
  }
  function wire(el, after){
    drawPicker(el);
    el.addEventListener("click", e => {
      const b = e.target.closest(".fav-chip"); if(!b) return;
      let fav = getFav();
      fav = fav.includes(b.dataset.cat) ? fav.filter(x => x !== b.dataset.cat) : fav.concat(b.dataset.cat);
      setFav(fav); drawPicker(el); after && after();
    });
  }
  if(picker) wire(picker);

  // ---- home: welcome + feed
  if(!home) return;
  const pick = (list, fav, n) => {
    const mine = list.filter(x => fav.includes(x.category));
    return (mine.length ? mine : list).slice(0, n);
  };
  function drawHome(){
    const fav = getFav();
    const first = (user.name || "Fan").split(" ")[0];
    const L = FV.xpState ? FV.xpLevel(FV.xpState().xp) : null;
    const catOf = id => cats.find(c => c.id === id) || {};
    const today = new Date().toISOString().slice(0, 10);
    const art = pick(data.articles || [], fav, 2);
    const ev = pick((data.events || []).filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)), fav, 1);
    const ch = pick((data.characters || []).slice().sort(() => Math.random() - .5), fav, 1);
    const tr = pick(data.trailers || [], fav, 1);
    const mr = pick(data.merchandise || [], fav, 1);
    const tag = cat => `<small style="color:${catOf(cat).color || "var(--brand)"}">${esc(catOf(cat).name || "")}</small>`;
    const cards = [
      ...ch.map(c => `<a class="feed-card feed-char" href="character.html?id=${c.id}"><img src="assets/images/characters/${c.id}.jpg" alt="">${tag(c.category)}<span class="feed-kind">Character for you</span><strong>${esc(c.name)}</strong></a>`),
      ...art.map(a => `<a class="feed-card" href="articles.html?id=${a.id}">${tag(a.category)}<span class="feed-kind">New article</span><strong>${esc(a.title)}</strong></a>`),
      ...ev.map(e => `<a class="feed-card" href="events.html">${tag(e.category)}<span class="feed-kind">Upcoming event · ${new Date(e.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span><strong>${esc(e.title)}</strong></a>`),
      ...tr.map(t => `<a class="feed-card" href="trailers.html?play=${t.id}">${tag(t.category)}<span class="feed-kind">Watch</span><strong>${esc(t.title)}</strong></a>`),
      ...mr.map(m => `<a class="feed-card" href="merchandise.html">${tag(m.category)}<span class="feed-kind">Merch · PKR ${Number(m.price).toLocaleString()}</span><strong>${esc(m.name)}</strong></a>`),
      `<a class="feed-card" href="play.html#daily"><small style="color:#f4c430">Play</small><span class="feed-kind">Daily challenge</span><strong>Guess today's character from 3 clues</strong></a>`
    ].join("");
    home.hidden = false;
    home.innerHTML = `<div class="section-inner">
      <div class="myf-head">
        <div><p class="kicker">My Fandom</p><h2>Welcome back, ${esc(first)}</h2>
          ${L ? `<p class="myf-lvl">Level ${L.lvl} · ${esc(L.title)} · <a href="profile.html">${FV.xpState().xp} XP</a></p>` : ""}</div>
        <div class="myf-fav"><p>${fav.length ? "Your fandoms" : "Pick your fandoms to personalise this feed:"}</p><div class="fav-row" id="homeFav"></div></div>
      </div>
      <div class="feed">${cards}</div>
    </div>`;
    wire(document.getElementById("homeFav"), drawHome);
  }
  drawHome();
});
