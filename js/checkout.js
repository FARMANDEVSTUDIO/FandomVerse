/* =========================================================
   FandomVerse — checkout.js
   Demo checkout from the cart drawer: login required, delivery
   details, payment choice, then an order confirmation. No payment
   is taken and card digits are never stored; the order summary is
   kept in localStorage (FV.saveOrder) and listed on profile.html.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const drawer = document.getElementById("cartDrawer");
  const checkoutBtn = drawer && drawer.querySelector(".cart-foot .btn-primary");
  if(!drawer || !checkoutBtn) return;

  const DELIVERY = 250;
  const fmt = n => "PKR " + Math.round(Number(n) || 0).toLocaleString("en-PK");
  const esc = s => FV.escapeHtml ? FV.escapeHtml(String(s ?? "")) : String(s ?? "");

  checkoutBtn.disabled = false;
  checkoutBtn.textContent = "Checkout";
  const note = drawer.querySelector(".cart-note");
  if(note) note.textContent = "Demo store — orders are simulated and nothing is charged.";

  // keep the button in step with the cart contents
  function syncButton(){ checkoutBtn.disabled = !FV.loadCart().length; }
  syncButton();
  const origSave = FV.saveCart;
  FV.saveCart = function(items){ origSave(items); syncButton(); };

  const overlay = document.createElement("div");
  overlay.className = "checkout-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="checkout-panel" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle">
      <button class="icon-btn checkout-close" type="button" aria-label="Close checkout">✕</button>
      <ol class="checkout-steps" aria-label="Checkout progress">
        <li data-step="1">Details</li><li data-step="2">Payment</li><li data-step="3">Done</li>
      </ol>
      <div class="checkout-body" id="checkoutBody"></div>
    </div>`;
  document.body.appendChild(overlay);
  const body = overlay.querySelector("#checkoutBody");
  const closeBtn = overlay.querySelector(".checkout-close");

  function setStep(n){
    overlay.querySelectorAll(".checkout-steps li").forEach(li => {
      const s = Number(li.dataset.step);
      li.classList.toggle("is-active", s === n);
      li.classList.toggle("is-done", s < n);
    });
  }
  function open(){
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("open"));
    document.body.style.overflow = "hidden";
  }
  function close(){
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => { overlay.hidden = true; }, 250);
  }
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", e => { if(e.target === overlay) close(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape" && !overlay.hidden) close(); });

  function summary(items){
    const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
    return `
      <aside class="checkout-summary">
        <h3>Order summary</h3>
        <ul>${items.map(i => `<li><span>${esc(i.name || "Item")} <em>× ${i.qty}</em></span><span>${fmt(i.price * i.qty)}</span></li>`).join("")}</ul>
        <div class="checkout-row"><span>Subtotal</span><span>${fmt(sub)}</span></div>
        <div class="checkout-row"><span>Delivery</span><span>${fmt(DELIVERY)}</span></div>
        <div class="checkout-row checkout-total"><span>Total</span><span>${fmt(sub + DELIVERY)}</span></div>
      </aside>`;
  }

  function detailsStep(){
    const items = FV.loadCart();
    const user = FV.getUser() || {};
    setStep(1);
    body.innerHTML = `
      <div class="checkout-grid">
        <form class="checkout-form" id="coDetails" novalidate>
          <h2 id="checkoutTitle">Delivery details</h2>
          <div class="co-two">
            <div><label for="coName">Full name</label><input type="text" id="coName" value="${esc(user.name || "")}" autocomplete="name"></div>
            <div><label for="coPhone">Phone</label><input type="text" id="coPhone" placeholder="03XX XXXXXXX" inputmode="tel" autocomplete="tel"></div>
          </div>
          <label for="coEmail">Email</label><input type="email" id="coEmail" value="${esc(user.email || "")}" autocomplete="email">
          <label for="coAddress">Address</label><input type="text" id="coAddress" placeholder="House, street, area" autocomplete="street-address">
          <label for="coCity">City</label><input type="text" id="coCity" placeholder="Karachi" autocomplete="address-level2">
          <p class="error-msg" id="coError"></p>
          <button class="btn btn-primary co-next" type="submit">Continue to payment</button>
        </form>
        ${summary(items)}
      </div>`;
    body.querySelector("#coDetails").addEventListener("submit", e => {
      e.preventDefault();
      const v = id => body.querySelector("#" + id).value.trim();
      const err = body.querySelector("#coError");
      if(!FV.validName(v("coName"))){ err.textContent = "Enter your name using letters only."; return; }
      if(!FV.validPhone(v("coPhone"))){ err.textContent = "Enter a Pakistani mobile number, like 0300 1234567."; return; }
      if(!FV.validEmail(v("coEmail"))){ err.textContent = "Enter a valid email address, like name@example.com."; return; }
      if(v("coAddress").length < 8){ err.textContent = "Please enter your full address."; return; }
      if(!FV.validName(v("coCity"))){ err.textContent = "Enter a city name using letters only."; return; }
      paymentStep({ name: v("coName"), phone: v("coPhone"), email: v("coEmail"), address: v("coAddress"), city: v("coCity") });
    });
  }

  function paymentStep(details){
    const items = FV.loadCart();
    setStep(2);
    body.innerHTML = `
      <div class="checkout-grid">
        <form class="checkout-form" id="coPay" novalidate>
          <h2 id="checkoutTitle">Payment</h2>
          <div class="co-methods" role="radiogroup" aria-label="Payment method">
            <label class="co-method"><input type="radio" name="coMethod" value="cod" checked><span><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span></label>
            <label class="co-method"><input type="radio" name="coMethod" value="card"><span><strong>Card</strong><small>Demo only — nothing is charged</small></span></label>
          </div>
          <div class="co-card" id="coCard" hidden>
            <label for="coCardNo">Card number</label><input type="text" id="coCardNo" inputmode="numeric" placeholder="4242 4242 4242 4242" autocomplete="off">
            <div class="co-two">
              <div><label for="coExp">Expiry</label><input type="text" id="coExp" placeholder="MM/YY" autocomplete="off"></div>
              <div><label for="coCvc">CVC</label><input type="text" id="coCvc" inputmode="numeric" placeholder="123" autocomplete="off"></div>
            </div>
            <p class="co-hint">Use any test number, e.g. 4242 4242 4242 4242. Card details are only checked for format and never saved.</p>
          </div>
          <p class="error-msg" id="coError"></p>
          <div class="co-actions">
            <button class="btn btn-outline" type="button" id="coBack">Back</button>
            <button class="btn btn-primary" type="submit" id="coPlace">Place order</button>
          </div>
        </form>
        ${summary(items)}
      </div>`;
    const card = body.querySelector("#coCard");
    body.querySelectorAll('input[name="coMethod"]').forEach(r => r.addEventListener("change", () => { card.hidden = r.value !== "card" || !r.checked; }));
    body.querySelector("#coBack").addEventListener("click", detailsStep);
    body.querySelector("#coCardNo").addEventListener("input", e => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    });
    body.querySelector("#coPay").addEventListener("submit", e => {
      e.preventDefault();
      const method = body.querySelector('input[name="coMethod"]:checked').value;
      const err = body.querySelector("#coError");
      if(method === "card"){
        const no = body.querySelector("#coCardNo").value.replace(/\s/g, "");
        const exp = body.querySelector("#coExp").value.trim();
        const cvc = body.querySelector("#coCvc").value.trim();
        if(no.length !== 16){ err.textContent = "Card number should be 16 digits."; return; }
        if(!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)){ err.textContent = "Expiry should look like 08/28."; return; }
        if(!/^\d{3,4}$/.test(cvc)){ err.textContent = "CVC should be 3 or 4 digits."; return; }
      }
      const place = body.querySelector("#coPlace");
      place.disabled = true;
      place.textContent = "Placing order…";
      setTimeout(() => doneStep(details, method, items), 1100);
    });
  }

  function doneStep(details, method, items){
    const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
    const order = {
      id: "FV-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      at: new Date().toISOString(), total: sub + DELIVERY, method,
      items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
      city: details.city,
    };
    FV.saveOrder(order);
    FV.saveCart([]);
    setStep(3);
    body.innerHTML = `
      <div class="co-done">
        <div class="co-done-icon" aria-hidden="true"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <h2 id="checkoutTitle">Order placed!</h2>
        <p>Thanks, ${esc(details.name.split(" ")[0])}. Your order <strong>${order.id}</strong> for <strong>${fmt(order.total)}</strong> will be delivered to ${esc(details.city)}.</p>
        <p class="co-hint">Demo store: no payment was taken and nothing will actually ship.</p>
        <div class="co-actions co-actions-center">
          <a class="btn btn-primary" href="${window.FV_BASE || ""}merchandise.html">Continue shopping</a>
        </div>
      </div>`;
    FV.showToast && FV.showToast(`Order ${order.id} placed (demo).`);
  }

  checkoutBtn.addEventListener("click", () => {
    if(!FV.loadCart().length) return;
    if(FV.requireLogin && !FV.requireLogin("check out")) return;
    document.getElementById("cartClose")?.click();
    detailsStep();
    open();
  });
});
