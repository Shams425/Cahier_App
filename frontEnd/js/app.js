// ===== POS ORDER STATE =====
const order = {};

// Select elements
const productCards = document.querySelectorAll(".product");
const orderList = document.querySelector(".order-items");
const totalDisplay = document.querySelector(".total span");

// ===== CLICK PRODUCT =====
productCards.forEach(card => {
    card.addEventListener("click", () => {
        const name = card.dataset.name;
        const price = parseFloat(card.dataset.price);

        addItem(name, price);
    });
});

// ===== ADD ITEM FUNCTION =====
function addItem(name, price) {
    if (order[name]) {
        order[name].qty++;
    } else {
        order[name] = {
            price: price,
            qty: 1
        };
    }

    renderOrder();
}

// ===== RENDER ORDER LIST =====
function renderOrder() {
    orderList.innerHTML = "";

    let total = 0;

    for (const name in order) {
        const item = order[name];
        const lineTotal = item.price * item.qty;
        total += lineTotal;

        const li = document.createElement("li");
        li.className = "order-row";

        li.innerHTML = `
      <div class="item-info">
        <span class="item-name">${name}</span>
        <span class="item-qty">( ${item.qty} )</span>
        <span class="item-price">${lineTotal.toFixed(2)} SDG</span>
      </div>
      <div class="qty-controls">
          <button onclick="changeQty('${name}', -1)">−</button>
          <button onclick="changeQty('${name}', 1)">+</button>
      </div>

    `;

        orderList.appendChild(li);
    }

    totalDisplay.textContent = total.toFixed(2);
}


// ===== Change Quantity =====
function changeQty(name, delta) {
    order[name].qty += delta;

    if (order[name].qty <= 0) {
        delete order[name];
    }

    renderOrder();
}

