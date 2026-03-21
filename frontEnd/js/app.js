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

// ===== products ======
const productsContainer = document.getElementById("products");

// Group products by category
function groupByCategory(data) {
    const grouped = {};

    data.forEach(item => {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });

    return grouped;
}

function renderProducts(data) {
    const grouped = groupByCategory(data);
    productsContainer.innerHTML = "";

    for (const category in grouped) {

        const section = document.createElement("div");
        section.className = "category-section";
        section.dataset.category = category;

        // ⭐ SPECIAL LAYOUT FOR TOP ITEMS
        if (category === "top") {
            section.innerHTML = `
            <h3>⭐ Recents :</h3>
            <div class="recents-row">
            ${grouped[category].map(item => `
            <div class="product"
            data-name="${item.name}"
            data-price="${item.price}">
            <img src="${item.image}" />
            <h4>${item.name}</h4>
            <p>${item.price}.00</p>
            </div>
            `).join("")}
            </div>
            `;
        }
        // 🍔 NORMAL GRID
        else {
            section.innerHTML = `
            <h3>${getCategoryTitle(category)}</h3>
            <div class="product-grid">
          ${grouped[category].map(item => `
            <div class="product"
            data-name="${item.name}"
            data-price="${item.price}">
            <img src="${item.image}" />
            <h4>${item.name}</h4>
            <p>${item.price}.00</p>
            </div>
            `).join("")}
        </div>
        `;
        }

        productsContainer.appendChild(section);
    }

    attachProductEvents();
}

function getCategoryTitle(category) {
    const titles = {
        top: "⭐ Top Items",
        food: "🍔 Food",
        drinks: "🥤 Drinks",
        desserts: "🍰 Desserts"
    };

    return titles[category] || category;
}

function attachProductEvents() {
    const productCards = document.querySelectorAll(".product");

    productCards.forEach(card => {
        card.addEventListener("click", () => {
            const name = card.dataset.name;
            const price = parseFloat(card.dataset.price);

            addItem(name, price);
        });
    });
}


// ===== filter logic ======
const catButtons = document.querySelectorAll(".cat-btn");
const sections = document.querySelectorAll(".category-section");
const products = document.getElementById("products");

catButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const category = btn.dataset.category;

        // ⭐ Highlight active button
        catButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // ⭐ Animate
        products.classList.remove("animate__animated", "animate__fadeIn");
        void products.offsetWidth;
        products.classList.add("animate__animated", "animate__fadeIn");

        // ⭐ Show / Hide sections
        sections.forEach(section => {
            if (category === "all") {
                section.style.display = "block";
            } else {
                if (section.dataset.category === category) {
                    section.style.display = "block";
                } else {
                    section.style.display = "none";
                }
            }
        });
    });
});

function attachCategoryEvents() {
    const catButtons = document.querySelectorAll(".cat-btn");
    const sections = document.querySelectorAll(".category-section");

    catButtons.forEach(btn => {
        btn.onclick = () => {
            const category = btn.dataset.category;

            // highlight
            catButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // animation
            products.classList.remove("animate__animated", "animate__fadeIn");
            void products.offsetWidth;
            products.classList.add("animate__animated", "animate__fadeIn");

            // filtering
            sections.forEach(section => {
                if (category === "all") {
                    section.style.display = "block";
                } else {
                    section.style.display =
                        section.dataset.category === category ? "block" : "none";
                }
            });
        };
    });
}




renderProducts(productsData);
setTimeout(() => {
    attachCategoryEvents();
}, 0);