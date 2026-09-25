/* =========================================================
   FandomVerse — profile.js
   Profile page: display name, theme colour + light/dark mode,
   and the logged-in user's past (demo) orders.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profileForm");
  if(!form) return;

  if(!FV.getUser()){
    FV.requireLogin("see your profile");
    return;
  }

  const esc = s => FV.escapeHtml(String(s ?? ""));
  const fmt = n => "PKR " + Math.round(Number(n) || 0).toLocaleString("en-PK");

  /* ---------- identity ---------- */
  const nameInput = document.getElementById("nameInput");
  const nameMsg = document.getElementById("nameMsg");
  function renderUser(){
    const u = FV.getUser();
    document.getElementById("profileName").textContent = u.name || "Fan";
    document.getElementById("profileEmail").textContent = u.email || "";
    document.getElementById("profileAvatar").textContent = (u.name || u.email || "F").charAt(0).toUpperCase();
    const since = document.getElementById("profileSince");
    if(since && u.since) since.textContent = "Logged in " + new Date(u.since).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    nameInput.value = u.name || "";
    FV.paintAvatars && FV.paintAvatars();
  }
  renderUser();

  form.addEventListener("submit", e => {
    e.preventDefault();
    const v = nameInput.value.trim();
    if(!FV.validName(v)){
      nameMsg.textContent = "Use letters only (at least 2).";
      nameMsg.className = "profile-hint is-error";
      return;
    }
    FV.updateUserName(v);
    // keep the saved account's name in step too
    try{
      const all = FV.loadAccounts ? FV.loadAccounts() : {};
      const key = FV.getUser().email;
      if(all[key]){ all[key].name = v; localStorage.setItem("fv_accounts", JSON.stringify(all)); }
    }catch(err){}
    renderUser();
    nameMsg.textContent = "Saved!";
    nameMsg.className = "profile-hint is-ok";
    const hello = document.querySelector(".nav-user-name");
    if(hello) hello.textContent = "Hi, " + v.split(" ")[0];
    const dot = document.querySelector(".nav-user-dot");
    if(dot) dot.textContent = v.charAt(0).toUpperCase();
    FV.showToast("Name updated.");
  });

  /* ---------- profile picture ---------- */
  const avatarMsg = document.getElementById("avatarMsg");
  const say = (t, ok) => { avatarMsg.textContent = t; avatarMsg.className = "profile-hint " + (ok ? "is-ok" : "is-error"); };
  FV.paintAvatars();

  // Uploads are shrunk to a 256px square so they fit comfortably in browser storage.
  document.getElementById("avatarFile").addEventListener("change", e => {
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    if(!file.type.startsWith("image/")){ say("Please choose an image file.", false); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256, c = document.createElement("canvas");
        c.width = c.height = size;
        const s = Math.min(img.width, img.height);
        c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        if(FV.setAvatar(c.toDataURL("image/jpeg", 0.85))) say("Profile picture updated!", true);
        else say("That image is too large to save. Try a smaller one.", false);
      };
      img.onerror = () => say("Couldn't read that image.", false);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });

  document.getElementById("avatarUrlSave").addEventListener("click", () => {
    const url = document.getElementById("avatarUrl").value.trim();
    if(!/^https?:\/\/\S+$/i.test(url)){ say("Paste a full image address starting with http:// or https://", false); return; }
    say("Checking the image…", true);
    const test = new Image();
    test.onload = () => { FV.setAvatar(url); document.getElementById("avatarUrl").value = ""; say("Profile picture updated!", true); };
    test.onerror = () => say("That link didn't load as an image. Right-click the picture on Google → “Copy image address”.", false);
    test.src = url;
  });

  document.getElementById("avatarRemove").addEventListener("click", () => {
    FV.setAvatar(null); say("Picture removed.", true);
  });

  /* ---------- cover banner ---------- */
  const coverBg = document.getElementById("profileCoverBg");
  const coverMsg = document.getElementById("coverMsg");
  const sayCover = (t, ok) => { coverMsg.textContent = t; coverMsg.className = "profile-hint " + (ok ? "is-ok" : "is-error"); };
  function paintCover(){
    const src = FV.getCover();
    const css = src ? `url("${src.replace(/"/g, "%22")}")` : "";
    coverBg.style.backgroundImage = "";
    coverBg.style.setProperty("--cover-img", css || "none");
    coverBg.classList.toggle("has-photo", !!src);
  }
  paintCover();

  // Any shape works: the whole image is kept (only shrunk to max 1600px), and the banner
  // shows it in full with a blurred copy of itself filling the sides.
  document.getElementById("coverFile").addEventListener("change", e => {
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    if(!file.type.startsWith("image/")){ sayCover("Please choose an image file.", false); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1600 / img.width, 900 / img.height);
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        if(FV.setCover(c.toDataURL("image/jpeg", 0.8))){ paintCover(); sayCover("Cover banner updated!", true); }
        else sayCover("That image is too large to save. Try a smaller one.", false);
      };
      img.onerror = () => sayCover("Couldn't read that image.", false);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });

  document.getElementById("coverUrlSave").addEventListener("click", () => {
    const url = document.getElementById("coverUrl").value.trim();
    if(!/^https?:\/\/\S+$/i.test(url)){ sayCover("Paste a full image address starting with http:// or https://", false); return; }
    sayCover("Checking the image...", true);
    const test = new Image();
    test.onload = () => { FV.setCover(url); paintCover(); document.getElementById("coverUrl").value = ""; sayCover("Cover banner updated!", true); };
    test.onerror = () => sayCover("That link didn't load as an image. Right-click the picture and choose Copy image address.", false);
    test.src = url;
  });

  document.getElementById("coverRemove").addEventListener("click", () => {
    FV.setCover(null); paintCover(); sayCover("Cover removed.", true);
  });

  document.getElementById("profileLogout").addEventListener("click", () => {
    FV.logout();
    FV.showToast("Logged out.");
    setTimeout(() => { location.href = "index.html"; }, 500);
  });

  /* ---------- theme colour ---------- */
  const swatchColors = [
    ["#e8382f", "Red"], ["#f97316", "Orange"], ["#eab308", "Gold"], ["#22c55e", "Green"],
    ["#06b6d4", "Cyan"], ["#3b82f6", "Blue"], ["#a855f7", "Purple"], ["#ec4899", "Pink"],
  ];
  const swatches = document.getElementById("swatches");
  const custom = document.getElementById("customColor");
  const code = document.getElementById("colorCode");
  swatches.innerHTML = swatchColors.map(([hex, label]) =>
    `<button type="button" class="swatch" role="radio" data-color="${hex}" style="--sw:${hex}" aria-label="${label}" title="${label}"></button>`).join("");

  function showAccent(){
    const cur = FV.getAccent().toLowerCase();
    custom.value = cur; code.textContent = cur;
    swatches.querySelectorAll(".swatch").forEach(b => {
      const on = b.dataset.color === cur;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-checked", on ? "true" : "false");
    });
  }
  showAccent();
  swatches.addEventListener("click", e => {
    const b = e.target.closest(".swatch");
    if(!b) return;
    FV.setAccent(b.dataset.color); showAccent();
  });
  custom.addEventListener("input", () => { FV.setAccent(custom.value); showAccent(); });
  document.getElementById("resetColor").addEventListener("click", () => { FV.setAccent(FV.ACCENT_DEFAULT); showAccent(); });

  /* ---------- light / dark ---------- */
  const modeBtns = document.querySelectorAll(".mode-btn");
  function showMode(){
    const light = document.documentElement.getAttribute("data-theme") === "light";
    modeBtns.forEach(b => b.classList.toggle("is-active", (b.dataset.mode === "light") === light));
  }
  showMode();
  modeBtns.forEach(b => b.addEventListener("click", () => {
    if(b.dataset.mode === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    try{ localStorage.setItem("fv_theme", b.dataset.mode); }catch(err){}
    showMode();
  }));
  // the header toggle also changes the mode
  document.getElementById("themeToggle")?.addEventListener("click", () => setTimeout(showMode, 0));

  /* ---------- header stats ---------- */
  const setStat = (id, n) => { const el = document.getElementById(id); if(el) el.textContent = n; };
  setStat("statBookmarks", FV.loadBookmarks ? FV.loadBookmarks().length : 0);
  setStat("statCart", FV.loadCart ? FV.loadCart().reduce((t, i) => t + i.qty, 0) : 0);
  document.getElementById("statCartLink")?.addEventListener("click", e => { e.preventDefault(); document.getElementById("cartToggle")?.click(); });

  /* ---------- orders ---------- */
  const list = document.getElementById("orderList");
  const summary = document.getElementById("orderSummary");
  const me = FV.getUser().email;
  const orders = (FV.loadOrders ? FV.loadOrders() : []).filter(o => !o.email || o.email === me).reverse();
  setStat("statOrders", orders.length);
  if(!orders.length){
    summary.textContent = "";
    list.innerHTML = `
      <div class="profile-empty">
        <strong>No orders yet</strong>
        <p>Items you check out will show up here.</p>
        <a class="btn btn-outline btn-sm" href="merchandise.html">Browse merchandise</a>
      </div>`;
  }else{
    const spent = orders.reduce((s, o) => s + (o.total || 0), 0);
    summary.textContent = `${orders.length} order${orders.length === 1 ? "" : "s"} · ${fmt(spent)} total`;
    list.innerHTML = orders.map(o => `
      <article class="order-card">
        <header>
          <div><strong>${esc(o.id)}</strong><span>${new Date(o.at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span></div>
          <span class="order-status">Confirmed</span>
        </header>
        <ul>${(o.items || []).map(i => `<li><span>${esc(i.name || "Item")} <em>× ${i.qty}</em></span><span>${fmt(i.price * i.qty)}</span></li>`).join("")}</ul>
        <footer>
          <span>${o.method === "card" ? "Card" : "Cash on delivery"}${o.city ? " · " + esc(o.city) : ""}</span>
          <strong>${fmt(o.total)}</strong>
        </footer>
      </article>`).join("");
  }
});
