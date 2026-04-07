// // ui.js - UI & filter logic
let order = {}

const productsContainer = document.getElementById("products");
const products = document.getElementById("products");

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

function getCategoryTitle(category) {
    const titles = {
        top: "⭐ Top Items",
        food: "🍔 Food",
        drinks: "🥤 Drinks",
        desserts: "🍰 Desserts"
    };

    return titles[category] || category;
}

export function renderProducts(data) {
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
            <div class="product-grid">
            ${grouped[category].map(item => `
            <div class="product"
            data-name="${item.name}"
            data-price="${item.price}">
            <img src="${item.image}" alt="${item.name}" loading="lazy"/>
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
            <img src="${item.image}" alt="${item.name}" loading="lazy"/>
            <h4>${item.name}</h4>
            <p>${item.price}.00</p>
            </div>
            `).join("")}
        </div>
        `;
        }

        productsContainer.appendChild(section);
    }

}


// ===== payment modal ======
const payBtn = document.getElementById("pay");
const modal = document.getElementById("paymentModal");
const payTotal = document.getElementById("payTotal");
const cashInput = document.getElementById("cashInput");
const changeEl = document.getElementById("change");
const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");

let currentTotal = 0;
let paymentMethod = "cash"; // to detect active tap

function getTotal() {
    const totalElement = document.querySelector(".total span");
    return parseFloat(totalElement.textContent) || 0;
}

// OPEN MODAL
function openPayModal() {
    currentTotal = updateTotal();
    payTotal.textContent = currentTotal;

    modal.classList.remove("hidden");
    cashInput.value = "";
    changeEl.textContent = "0";

}

// CLOSE MODAL
document.getElementById("closeModalX").addEventListener("click", () => {
    document.getElementById("paymentModal").classList.add("hidden");
});

cashInput.addEventListener("input", () => {
    const cash = parseFloat(cashInput.value) || 0;
    const change = cash - currentTotal;

    changeEl.textContent = change >= 0 ? change.toFixed(2) : "0";
});


//MODAL TAP LOGIC
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        const target = tab.dataset.tab;

        paymentMethod = target; // ⭐ IMPORTANT

        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        contents.forEach(c => c.classList.remove("active"));

        if (target === "cash") {
            document.getElementById("cashTab").classList.add("active");
        } else {
            document.getElementById("digitalTab").classList.add("active");
        }
    });
});

const transID = document.getElementById("transactionInput");

transID.addEventListener("input", () => {

    // remove non-digits
    transID.value = transID.value.replace(/\D/g, "");

    // limit to 4 digits
    if (transID.value.length > 4) {
        transID.value = transID.value.slice(0, 4);
    }
});

/**
 * Filters the menu based on search input and category
 * @param {Array} products - The full products list
 */
export function setupFilters(products) {
    const searchInput = document.getElementById("menuSearch");
    const categoryButtons = document.querySelectorAll(".filter-chip");

    // Handle Search Typing
    searchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(term)
        );
        document.getElementById("products").classList.remove("animate__animated", "animate__fadeIn");
        void document.getElementById("products").offsetWidth;
        document.getElementById("products").classList.add("animate__animated", "animate__fadeIn");
        renderProducts(filtered);
    });

    // Handle Category Clicks
    categoryButtons.forEach(btn => {

        btn.addEventListener("click", () => {
            // Remove active class from others, add to this one
            categoryButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const category = btn.dataset.category; // Assumes you have data-category="food" in HTML
            if (category === "all") {
                renderProducts(products);
            } else {
                const filtered = products.filter(p => p.category === category);
                renderProducts(filtered);
            }

            document.getElementById("products").classList.remove("animate__animated", "animate__fadeIn");
            void document.getElementById("products").offsetWidth;
            document.getElementById("products").classList.add("animate__animated", "animate__fadeIn");
        });
    });
}
