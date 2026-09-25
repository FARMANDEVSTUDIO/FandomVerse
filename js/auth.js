/* =========================================================
   FandomVerse — auth.js
   Demo login kept in sessionStorage: it lasts while the browser
   tab/session is open and is gone after closing it. Nothing is
   sent anywhere and no password is stored.
   ========================================================= */

window.FV = window.FV || {};

const FV_USER_KEY = "fv_user";

const FV_PROFILES_KEY = "fv_profiles"; // localStorage: { email: { name } } — survives logging out

const FV_REMEMBER_KEY = "fv_user_remember";   // stays logged in after the browser is closed
FV.getUser = function getUser(){
  try{
    let user = JSON.parse(sessionStorage.getItem(FV_USER_KEY));
    if(!user){
      user = JSON.parse(localStorage.getItem(FV_REMEMBER_KEY));
      if(user) sessionStorage.setItem(FV_USER_KEY, JSON.stringify(user));   // restore into this tab
    }
    if(!user) return null;
    const saved = (JSON.parse(localStorage.getItem(FV_PROFILES_KEY)) || {})[user.email];
    if(saved && saved.name) user.name = saved.name;
    return user;
  }catch(e){ return null; }
};
// Changes the display name for this session and remembers it for this email.
FV.updateUserName = function updateUserName(name){
  const user = FV.getUser();
  if(!user) return;
  try{
    user.name = name;
    sessionStorage.setItem(FV_USER_KEY, JSON.stringify(user));
    if(localStorage.getItem(FV_REMEMBER_KEY)) localStorage.setItem(FV_REMEMBER_KEY, JSON.stringify(user));
    const all = JSON.parse(localStorage.getItem(FV_PROFILES_KEY)) || {};
    all[user.email] = Object.assign({}, all[user.email], { name });
    localStorage.setItem(FV_PROFILES_KEY, JSON.stringify(all));
  }catch(e){}
};

/* ---------- accent colour (theme) — applied early by each page's <head> script ---------- */
FV.ACCENT_DEFAULT = "#e8382f";
FV.getAccent = function getAccent(){
  try{ return localStorage.getItem("fv_accent") || FV.ACCENT_DEFAULT; }catch(e){ return FV.ACCENT_DEFAULT; }
};
FV.setAccent = function setAccent(hex){
  const root = document.documentElement.style;
  if(!hex || hex.toLowerCase() === FV.ACCENT_DEFAULT){
    try{ localStorage.removeItem("fv_accent"); }catch(e){}
    root.removeProperty("--brand"); root.removeProperty("--cat");
    return;
  }
  try{ localStorage.setItem("fv_accent", hex); }catch(e){}
  root.setProperty("--brand", hex); root.setProperty("--cat", hex);
};
// another tab changed the colour: follow it
window.addEventListener("storage", e => { if(e.key === "fv_accent") FV.setAccent(e.newValue); });

/* ---------- past orders (localStorage, per email) ---------- */
FV.loadOrders = function loadOrders(){
  try{
    // orders placed before this change lived in sessionStorage — move them over once
    const old = JSON.parse(sessionStorage.getItem("fv_orders"));
    let all = JSON.parse(localStorage.getItem("fv_orders")) || [];
    if(old && old.length){
      const email = (FV.getUser() || {}).email || null;
      all = all.concat(old.map(o => Object.assign({ email }, o)));
      localStorage.setItem("fv_orders", JSON.stringify(all));
      sessionStorage.removeItem("fv_orders");
    }
    return all;
  }catch(e){ return []; }
};
FV.saveOrder = function saveOrder(order){
  try{
    const all = FV.loadOrders();
    all.push(Object.assign({ email: (FV.getUser() || {}).email || null }, order));
    localStorage.setItem("fv_orders", JSON.stringify(all));
  }catch(e){}
};
/* ---------- demo accounts (localStorage) ----------
   Signup stores { email: { name, hash } } where hash is a salted SHA-256 of the
   password — the password itself is never saved. Login only works for accounts
   created on this browser. */
const FV_ACCOUNTS_KEY = "fv_accounts";
FV.loadAccounts = function loadAccounts(){
  try{ return JSON.parse(localStorage.getItem(FV_ACCOUNTS_KEY)) || {}; }catch(e){ return {}; }
};
async function fvHash(email, password){
  const text = "fandomverse:" + email.toLowerCase() + ":" + password;
  if(window.crypto && crypto.subtle){
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 0; for(let i = 0; i < text.length; i++){ h = (h * 31 + text.charCodeAt(i)) | 0; } // fallback (non-secure contexts)
  return "x" + (h >>> 0).toString(16);
}
FV.accountExists = function accountExists(email){
  return !!FV.loadAccounts()[String(email).trim().toLowerCase()];
};
FV.registerAccount = async function registerAccount(name, email, password){
  const key = email.trim().toLowerCase();
  const all = FV.loadAccounts();
  if(all[key]) return { ok: false, reason: "exists" };
  all[key] = { name: name.trim(), hash: await fvHash(key, password), created: Date.now() };
  try{ localStorage.setItem(FV_ACCOUNTS_KEY, JSON.stringify(all)); }catch(e){ return { ok: false, reason: "storage" }; }
  return { ok: true, user: { name: all[key].name, email: key } };
};
FV.checkLogin = async function checkLogin(email, password){
  const key = email.trim().toLowerCase();
  const acc = FV.loadAccounts()[key];
  if(!acc) return { ok: false, reason: "no-account" };
  if(acc.hash !== await fvHash(key, password)) return { ok: false, reason: "wrong-password" };
  return { ok: true, user: { name: acc.name, email: key } };
};

/* Password reset. A real site would email a reset link; this static site has no mail
   server, so the account's own details prove ownership instead: the email plus the
   name it was signed up with. Only the new password's hash is stored. */
FV.resetPassword = async function resetPassword(email, name, newPassword){
  const key = email.trim().toLowerCase();
  const all = FV.loadAccounts();
  const acc = all[key];
  if(!acc) return { ok: false, reason: "no-account" };
  const norm = v => String(v || "").trim().replace(/\s+/g, " ").toLowerCase();
  if(norm(acc.name) !== norm(name)) return { ok: false, reason: "name-mismatch" };
  acc.hash = await fvHash(key, newPassword);
  acc.pwChanged = Date.now();
  try{ localStorage.setItem(FV_ACCOUNTS_KEY, JSON.stringify(all)); }catch(e){ return { ok: false, reason: "storage" }; }
  return { ok: true };
};

/* ---------- profile picture (localStorage, per email) ---------- */
FV.getAvatar = function getAvatar(){
  const u = FV.getUser();
  if(!u) return null;
  try{ return ((JSON.parse(localStorage.getItem(FV_PROFILES_KEY)) || {})[u.email] || {}).avatar || null; }catch(e){ return null; }
};
FV.setAvatar = function setAvatar(src){
  const u = FV.getUser();
  if(!u) return false;
  try{
    const all = JSON.parse(localStorage.getItem(FV_PROFILES_KEY)) || {};
    all[u.email] = Object.assign({}, all[u.email]);
    if(src) all[u.email].avatar = src; else delete all[u.email].avatar;
    localStorage.setItem(FV_PROFILES_KEY, JSON.stringify(all));
    FV.paintAvatars();
    return true;
  }catch(e){ return false; }   // quota full (very large image)
};
FV.getCover = function getCover(){
  const u = FV.getUser();
  if(!u) return null;
  try{ return ((JSON.parse(localStorage.getItem(FV_PROFILES_KEY)) || {})[u.email] || {}).cover || null; }catch(e){ return null; }
};
FV.setCover = function setCover(src){
  const u = FV.getUser();
  if(!u) return false;
  try{
    const all = JSON.parse(localStorage.getItem(FV_PROFILES_KEY)) || {};
    all[u.email] = Object.assign({}, all[u.email]);
    if(src) all[u.email].cover = src; else delete all[u.email].cover;
    localStorage.setItem(FV_PROFILES_KEY, JSON.stringify(all));
    return true;
  }catch(e){ return false; }
};

// Puts the picture into every avatar circle on the page (falls back to the initial letter).
FV.paintAvatars = function paintAvatars(){
  const src = FV.getAvatar();
  document.querySelectorAll(".nav-user-dot, .profile-avatar").forEach(el => {
    if(src){
      el.style.backgroundImage = `url("${src.replace(/"/g, "%22")}")`;
      el.classList.add("has-photo");
    }else{
      el.style.removeProperty("background-image");
      el.classList.remove("has-photo");
    }
  });
};

FV.setUser = function setUser(user, remember){
  try{
    const u = JSON.stringify({ name: user.name, email: user.email, since: Date.now() });
    sessionStorage.setItem(FV_USER_KEY, u);
    if(remember){
      localStorage.setItem(FV_REMEMBER_KEY, u);
      localStorage.setItem("fv_last_email", user.email);   // pre-fills the log-in form next time
    }else{
      localStorage.removeItem(FV_REMEMBER_KEY);
    }
  }catch(e){}
};
FV.logout = function logout(){
  try{
    const u = JSON.parse(sessionStorage.getItem(FV_USER_KEY) || "null");
    // the chat belongs to this account: clear it together with the session
    if(u && u.email) sessionStorage.removeItem("fv_chat:" + String(u.email).toLowerCase());
    sessionStorage.removeItem("fv_chat:guest");
    sessionStorage.removeItem(FV_USER_KEY);
    localStorage.removeItem(FV_REMEMBER_KEY);
  }catch(e){}
};

// Sends the visitor to the login page and brings them back here afterwards.
FV.requireLogin = function requireLogin(reason){
  if(FV.getUser()) return true;
  const here = location.pathname.split("/").pop() + location.search + location.hash;
  FV.showToast && FV.showToast(`Please log in to ${reason || "continue"}.`);
  setTimeout(() => {
    location.href = (window.FV_BASE || "") + "login.html?next=" + encodeURIComponent(here || "index.html");
  }, 700);
  return false;
};

// Only allow returning to a page on this site.
FV.safeNext = function safeNext(fallback){
  const next = new URLSearchParams(location.search).get("next");
  if(next && /^[a-z0-9-]+\.html([?#].*)?$/i.test(next)) return next;
  return fallback || "index.html";
};

document.addEventListener("DOMContentLoaded", () => {
  // keep ?next= when hopping between the login and signup pages
  const next = new URLSearchParams(location.search).get("next");
  if(next){
    document.querySelectorAll('a.auth-link[href="login.html"], a.auth-link[href="signup.html"]').forEach(a => {
      a.href = a.getAttribute("href") + "?next=" + encodeURIComponent(next);
    });
  }

  const user = FV.getUser();
  if(!user) return;
  const first = (user.name || user.email || "Fan").split(/[\s@]/)[0];

  // Swap the header's Log in / Sign up for a greeting and Log out.
  // Replacing the nodes drops the navigate-to-login listeners from global.js.
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const base = window.FV_BASE || "";
  const esc = v => FV.escapeHtml ? FV.escapeHtml(String(v)) : String(v);
  const orderCount = (FV.loadOrders ? FV.loadOrders() : []).filter(o => !o.email || o.email === user.email).length;
  const bookmarkCount = FV.loadBookmarks ? FV.loadBookmarks().length : 0;
  const icon = d => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${d}</svg>`;

  // Log in + Sign up become one avatar button with a dropdown menu.
  // Replacing the nodes drops the navigate-to-login listeners from global.js.
  if(loginBtn){
    const wrap = document.createElement("div");
    wrap.className = "user-menu";
    wrap.innerHTML = `
      <button type="button" class="nav-user" id="userMenuBtn" aria-haspopup="menu" aria-expanded="false">
        <span class="nav-user-dot" aria-hidden="true">${esc(first.charAt(0).toUpperCase())}</span>
        <span class="nav-user-name">Hi, ${esc(first)}</span>
        <svg class="nav-user-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="user-dropdown" id="userDropdown" role="menu" hidden>
        <div class="user-dropdown-head">
          <span class="nav-user-dot big" aria-hidden="true">${esc(first.charAt(0).toUpperCase())}</span>
          <div><strong>${esc(user.name || first)}</strong><span>${esc(user.email || "")}</span></div>
        </div>
        <a role="menuitem" href="${base}profile.html">${icon('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>')}<span>My profile</span></a>
        <a role="menuitem" href="${base}profile.html#orders">${icon('<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>')}<span>My orders</span>${orderCount ? `<em>${orderCount}</em>` : ""}</a>
        <a role="menuitem" href="${base}bookmarks.html">${icon('<path d="M6 3h12v18l-6-4-6 4z"/>')}<span>Bookmarks</span>${bookmarkCount ? `<em>${bookmarkCount}</em>` : ""}</a>
        <div class="user-dropdown-sep"></div>
        <button role="menuitem" type="button" class="user-logout" id="logoutBtn">${icon('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h12"/>')}<span>Log out</span></button>
      </div>`;
    loginBtn.replaceWith(wrap);
    const btn = wrap.querySelector("#userMenuBtn"), menu = wrap.querySelector("#userDropdown");
    const setOpen = open => {
      menu.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false");
      wrap.classList.toggle("open", open);
    };
    btn.addEventListener("click", e => { e.stopPropagation(); setOpen(menu.hidden); });
    document.addEventListener("click", e => { if(!wrap.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", e => { if(e.key === "Escape") setOpen(false); });
    wrap.querySelector("#logoutBtn").addEventListener("click", () => {
      FV.logout();
      FV.showToast && FV.showToast("Logged out.");
      setTimeout(() => { location.href = base + "index.html"; }, 500);
    });
  }
  if(signupBtn) signupBtn.remove();
  FV.paintAvatars();
  // mobile drawer: same swap
  const drawerActions = document.querySelector(".mobile-drawer-actions");
  if(drawerActions){
    drawerActions.innerHTML = `<a class="btn btn-ghost" href="${window.FV_BASE || ""}profile.html">My profile · ${FV.escapeHtml ? FV.escapeHtml(first) : first}</a><button class="btn btn-outline" type="button" id="logoutBtnMobile">Log out</button>`;
    document.getElementById("logoutBtnMobile").addEventListener("click", () => { FV.logout(); location.reload(); });
  }
});
