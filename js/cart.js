/* =========================================================
   FandomVerse — cart.js
   Temporary shopping cart (localStorage). Runs on every page
   (cart icon + drawer are in the shared header), items are added
   from merchandise.html. Checkout/payment are intentionally absent.
   ========================================================= */

window.FV = window.FV || {};

// Each account keeps its own cart; logged-out visitors see an empty one.
function fvCartKey(){
  const u = FV.getUser ? FV.getUser() : null;
  return u && u.email ? "fv_cart:" + u.email.toLowerCase() : "fv_cart:guest";
}

FV.loadCart = function loadCart(){
  try{ return JSON.parse(localStorage.getItem(fvCartKey())) || []; }catch(e){ return []; }
};
FV.saveCart = function saveCart(items){
  try{ localStorage.setItem(fvCartKey(), JSON.stringify(items)); }catch(e){}
  FV.renderCartBadge();
};
FV.addToCart = function addToCart(item){
  if(FV.requireLogin && !FV.requireLogin("add items to your cart")) return false;
  const items = FV.loadCart();
  const existing = items.find(i => i.id === item.id);
  if(existing) existing.qty += 1;
  else items.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
  FV.saveCart(items);
  FV.renderCartBadge(true);
  FV.showToast(`${item.name || "Item"} added to cart.`);
  return true;
};
FV.renderCartBadge = function renderCartBadge(bump){
  const badge = document.getElementById("cartCount");
  if(!badge) return;
  const count = FV.loadCart().reduce((s,i) => s + i.qty, 0);
  badge.textContent = count;
  badge.classList.toggle("hidden", count === 0);
  if(bump){
    badge.classList.remove("bump");
    void badge.offsetWidth;
    badge.classList.add("bump");
  }
};

function fmtPKR(n){ return "PKR " + Math.round(Number(n)||0).toLocaleString("en-PK"); }

document.addEventListener("DOMContentLoaded", () => {
  FV.renderCartBadge();

  const cartBtn = document.getElementById("cartToggle");
  const cartDrawer = document.getElementById("cartDrawer");
  const cartBackdrop = document.getElementById("cartBackdrop");
  const cartClose = document.getElementById("cartClose");
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  if(!cartBtn || !cartDrawer) return;

  function openCart(){ renderCartItems(); cartDrawer.classList.add("open"); cartBackdrop.classList.add("open"); }
  function closeCart(){ cartDrawer.classList.remove("open"); cartBackdrop.classList.remove("open"); }
  cartBtn.addEventListener("click", openCart);
  cartClose && cartClose.addEventListener("click", closeCart);
  cartBackdrop && cartBackdrop.addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeCart(); });

  let merchInfo = {};
  if(FV.data && typeof FV.data.then === "function"){
    const photosReady = FV.merchPhotos ? FV.merchPhotos().catch(() => []) : Promise.resolve([]);
    Promise.all([FV.data, photosReady]).then(([d, photos]) => {
      const cats = Object.fromEntries((d.categories || []).map(c => [c.id, c]));
      (d.merchandise || []).forEach(m => {
        const photo = photos.length && FV.merchPhotoIndex ? photos[FV.merchPhotoIndex(m.id) % photos.length] : null;
        merchInfo[m.id] = { cat: cats[m.category], photo: photo ? photo.src : null };
      });
      if(cartDrawer.classList.contains("open")) renderCartItems();
    }).catch(() => {});
  }
  const cartHeading = cartDrawer.querySelector(".cart-head h3");

  function thumb(i){
    const info = merchInfo[i.id];
    const c = info && info.cat;
    if(c && FV.poster){
      const slot = FV.slotImg ? FV.slotImg("merch", i.id, i.name) : "";
      const generic = info.photo ? `<img class="slot-img" src="${(window.FV_BASE || "") + info.photo}" alt="" loading="lazy">` : "";
      return `<span class="cart-thumb">${FV.poster(i.id, c.color, c.color2, i.name).replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ')}${generic}${slot}</span>`;
    }
    return `<span class="cart-thumb cart-thumb-plain">${FV.escapeHtml(i.name.charAt(0))}</span>`;
  }

  function renderCartItems(){
    const items = FV.loadCart();
    const count = items.reduce((s,i) => s + i.qty, 0);
    if(cartHeading) cartHeading.innerHTML = `Your cart${count ? ` <span class="cart-head-count">${count}</span>` : ""}`;
    if(!items.length){
      cartItemsEl.innerHTML = `
        <div class="cart-empty">
          <span class="cart-empty-icon" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg></span>
          <strong>Your cart is empty</strong>
          <p>Original fan items from all seven fandoms are waiting.</p>
          <a class="btn btn-outline btn-sm" href="${window.FV_BASE || ""}merchandise.html">Browse merchandise</a>
        </div>`;
      cartTotalEl.textContent = fmtPKR(0);
      return;
    }
    cartItemsEl.innerHTML = items.map(i => {
      const info = merchInfo[i.id];
      const catName = info && info.cat ? info.cat.name : "";
      return `
      <div class="cart-item" data-id="${i.id}">
        ${thumb(i)}
        <div class="cart-item-main">
          ${catName ? `<span class="cart-item-cat">${FV.escapeHtml(catName)}</span>` : ""}
          <div class="cart-item-name">${FV.escapeHtml(i.name)}</div>
          <div class="cart-item-qty">
            <button data-action="dec" aria-label="Decrease quantity">−</button>
            <span>${i.qty}</span>
            <button data-action="inc" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="cart-item-side">
          <div class="cart-item-price">${fmtPKR(i.price * i.qty)}</div>
          <button class="cart-item-remove" data-action="remove" aria-label="Remove ${FV.escapeHtml(i.name)}">Remove</button>
        </div>
      </div>`;
    }).join("");
    const total = items.reduce((s,i) => s + i.price * i.qty, 0);
    cartTotalEl.textContent = fmtPKR(total);
  }

  cartItemsEl && cartItemsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if(!btn) return;
    const row = btn.closest(".cart-item");
    const id = row.dataset.id;
    let items = FV.loadCart();
    const item = items.find(i => i.id === id);
    if(!item) return;
    if(btn.dataset.action === "inc") item.qty += 1;
    else if(btn.dataset.action === "remove") items = items.filter(i => i.id !== id);
    else{ item.qty -= 1; if(item.qty <= 0) items = items.filter(i => i.id !== id); }
    FV.saveCart(items);
    renderCartItems();
  });
});
