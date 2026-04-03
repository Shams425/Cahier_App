// ===== global =====
let order = {};
let heldOrders = [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let currentFilter = "all"
let revenueChart = null;
let itemsChart = null;
let paymentChart = null;
let activePreviewIndex = null;
let confirmAction = null;
let transactionCounter = localStorage.getItem("lastOrderNum") || 0;

function showCustomConfirm(message, action) {
    const confirmModal = document.getElementById("confirmToast");
    const messageEl = document.getElementById("confirmMessage");

    messageEl.textContent = message;
    confirmAction = action; // Save the function we want to run

    confirmModal.classList.remove("hidden");
    confirmModal.classList.add("visible");
}

function getNextOrderNumber() {
    localStorage.setItem("lastOrderNum", 1)
    transactionCounter++;
    // Save it immediately so the next tab/session knows where we are
    localStorage.setItem("lastOrderNum", transactionCounter);
    return transactionCounter;
}

// Hook up the buttons in your init code or bottom of app.js
document.getElementById("confirmYes").onclick = () => {
    if (confirmAction) confirmAction();
    closeCustomConfirm();
};

document.getElementById("confirmNo").onclick = closeCustomConfirm;

function closeCustomConfirm() {
    document.getElementById("confirmToast").classList.add("hidden");
    document.getElementById("confirmToast").classList.remove("visible");
}


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
    updatePayButton()
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


// ===== Remove all items =====
function clearOrder() {
    order = {};

    document.querySelector(".order-items").innerHTML = "";
    document.querySelector(".total").textContent = "0.00";
    updatePayButton();
    updateTotal();

}
// ===== HOLD ORDER LOGIC=====
function holdOrder() {

    if (!order || Object.keys(order).length === 0) {
        showToast("No items to hold");
        return;
    }

    if (heldOrders.length >= 5) {
        showToast("Limit Reached: Max 5 held orders allowed!");
        return;
    }

    const holdId = Date.now();

    heldOrders.push({
        id: holdId,
        data: JSON.parse(JSON.stringify(order)) // Deep copy to prevent "undefined" errors later
    });

    renderHeldButtons();
    renderOrder()
    clearOrder() // reset UI
    showToast("Order #" + heldOrders.length + " put on hold");
}

function renderHeldButtons() {
    const tray = document.getElementById("heldOrdersTray");
    if (!tray) return;
    tray.innerHTML = "";

    heldOrders.forEach((heldObj, index) => {
        const btn = document.createElement("button");
        btn.className = "hold-badge animate__animated animate__bounceIn";
        btn.innerHTML = `Hold ${index + 1}`;

        // Pass the INDEX to the resume function
        btn.onclick = () => resumeOrder(index);
        tray.appendChild(btn);
    });
}

function resumeOrder(index) {
    activePreviewIndex = index;
    const heldItem = heldOrders[index];

    // 1. Safety Check
    if (!heldItem || !heldItem.data) {
        showToast("Error: Data corrupted or missing.");
        return;
    }

    // 2. Update Header
    document.getElementById("holdPreviewID").textContent = `Hold #${index + 1}`;

    const list = document.getElementById("holdPreviewList");
    list.innerHTML = "";
    let previewTotal = 0;
    let htmlContent = "";

    // 3. The Loop (Handles the Object structure { "Burger": {price, qty} })
    const items = heldItem.data;
    const itemNames = Object.keys(items);

    if (itemNames.length > 0) {
        itemNames.forEach(name => {
            const item = items[name];
            const subtotal = item.price * item.qty;
            previewTotal += subtotal;

            htmlContent += `
                <div class="order-item">
                    <div class="info">
                        <span class="name">${name}</span>
                        <span class="qty">x${item.qty}</span>
                    </div>
                    <span class="price">${subtotal.toFixed(2)} SDG</span>
                </div>`;
        });
    } else {
        htmlContent = `<div style="text-align:center; padding:20px; color:#888;">No items in this order</div>`;
    }

    // 4. Update UI
    list.innerHTML = htmlContent;
    document.getElementById("holdPreviewTotal").textContent = previewTotal.toFixed(2);

    // 5. Show Panel
    document.getElementById("holdPreviewPanel").classList.add("open");
}

// Discard Held Order
function cancelHeldOrder() {
    showCustomConfirm("Discard this held order?", () => {
        heldOrders.splice(activePreviewIndex, 1);
        renderHeldButtons();
        closeHoldPreview();
        showToast("Held order removed");
    });
}

// Pay from Hold (checking if main order is empty)
function payFromHold() {
    const heldData = heldOrders[activePreviewIndex].data;

    // If the main POS is NOT empty, we don't just overwrite.
    // We move the current POS order to HOLD first, then take the new one!
    if (Object.keys(order).length > 0) {
        showCustomConfirm("Move current order to Hold and pay this one?", () => {
            // 1. Put current active order into the hold list
            heldOrders.push({
                id: Date.now(),
                data: JSON.parse(JSON.stringify(order))
            });

            // 2. Now execute the payment for the one we wanted
            executePayFromHold(heldData);
        });
    } else {
        // If POS is empty, just proceed normally
        executePayFromHold(heldData);
    }
}

function executePayFromHold(heldData) {
    // 1. Set the global order to the held data
    order = JSON.parse(JSON.stringify(heldData));

    // 2. Remove the order we just paid from the held array
    heldOrders.splice(activePreviewIndex, 1);

    // 3. UI Updates
    renderHeldButtons(); // Refresh the 1, 2, 3 buttons
    renderOrder();       // Show the items in the main list
    updateTotal();       // Update the price
    closeHoldPreview();  // Slide the panel away

    // 4. Trigger your payment modal
    openPayModal();
}

function closeHoldPreview() {
    document.getElementById("holdPreviewPanel").classList.remove("open");
}

// ===== CANCEL ORDER  =====
function cancelOrder() {

    showConfirm("Cancel this order?", () => {

        clearOrder();

        showToast("Order cancelled ❌");

    });
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
    updatePayButton()
}


// ===== Change Quantity =====
function changeQty(name, delta) {
    order[name].qty += delta;

    if (order[name].qty <= 0) {
        delete order[name];
        updatePayButton()
    }
    renderOrder();
}
// ===== update total =====
function updateTotal() {

    let total = 0;

    // 🧠 if order is OBJECT (your current structure)
    for (const name in order) {
        total += order[name].price * order[name].qty;
    }

    const totalElement = document.querySelector(".total span");

    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    } else {
        // If we are in the Hold Panel, we might need to update a different span
        console.log("Main total display not found, skipping visual update.");
    }

    currentTotal = total;

    // 💰 update UI
    document.getElementById("totalPrice").textContent = total + " SDG";

    // 🔘 enable/disable pay button
    const payBtn = document.getElementById("pay");

    if (total > 0) {
        payBtn.disabled = false;
    } else {
        payBtn.disabled = true;
    }

    return total
}

// ===== update pay button =====
function updatePayButton() {
    const payBtn = document.getElementById("pay");

    if (Object.keys(order).length <= 0) {
        payBtn.disabled = true;
    } else {
        payBtn.disabled = false;
    }
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
            <div class="product-grid">
            ${grouped[category].map(item => `
            <div class="product" onclick="addItem('${item.name}', ${item.price})"
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
            <div class="product" onclick="addItem('${item.name}', ${item.price})"
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


// ===== filter product logic ======
const catButtons = document.querySelectorAll(".filter-chip");
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
    const catButtons = document.querySelectorAll(".filter-chip");
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

function filterMenu() {
    // 1. Get the search term
    const searchTerm = document.getElementById("menuSearch").value.toLowerCase();

    // 2. Select all your product divs (using the class from your screenshot)
    const products = document.querySelectorAll(".product");

    products.forEach(product => {
        const nameElement = product.querySelector("h4").textContent;
        console.log(nameElement)
        if (nameElement) {
            const itemName = nameElement.toLowerCase();

            // 4. Match and Toggle
            if (itemName.includes(searchTerm)) {
                product.style.display = "flex";
            } else {
                product.style.display = "none";
            }
        }
    });

    // 5. Bonus: Hide empty category sections
    // If a whole category (Food, Drinks) has no visible products, hide the header too
    const categories = document.querySelectorAll(".category-section");
    categories.forEach(section => {
        const visibleProducts = section.querySelectorAll(".product[style*='display: flex']");
        // Also account for products with no style attribute (default visible)
        const allVisible = Array.from(section.querySelectorAll(".product")).filter(p => p.style.display !== 'none');

        section.style.display = allVisible.length > 0 ? "block" : "none";
    });
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

function confirmOrder() {
    const transactionInput = document.getElementById("transactionInput");

    const newOrder = {
        id: history.length + 1, // 🔥 always new
        items: order,
        total: currentTotal,
        time: new Date(),
        payment: paymentMethod,
        transactionId: paymentMethod === "digital"
            ? String(transactionInput.value).padStart(4, "0") // ensures 4 digits
            : null

    };

    saveToHistory(newOrder);

    lastTransactionId = newOrder.transactionId || newOrder.id;

    updateDashboard(); // refresh cards

    // reset
    order = [];
    currentTotal = 0;
    clearOrder()
    document.getElementById("transactionInput").value = ""

    document.getElementById("paymentModal").classList.add("hidden");
    document.querySelector(".modal-overlay").classList.remove("active");
}

function confirmPay() {
    let changeVal = 0;

    if (paymentMethod === "cash") {
        const cash = parseFloat(cashInput.value);
        changeVal = cash;

        if (!cash || cash < currentTotal) {
            showToast("Not enough cash ❌");
            return;
        }
    }

    if (paymentMethod === "digital") {
        const ref = document.getElementById("transactionInput").value.trim();

        if (!ref) {
            showToast("Enter transaction ID ❌");
            return;
        }
    }

    showToast("Payment Successful ✅");

    showToast("Payment Successful ✅", "success");

    // wait before closing
    setTimeout(() => {
        confirmOrder()
    }, 2000);

    printReceipt(paymentMethod, changeVal);
};

//toast alert
function showToast(message, type = "default") {
    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.style.background =
        type === "error" ? "#d32f2f" :
            type === "success" ? "#2fae35" :
                "#333";

    toast.classList.remove("hidden");
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hidden");
    }, 2000);
}

document.getElementById("closePay").addEventListener("click", () => {
    modal.classList.add("hidden");
    document.querySelector(".modal-overlay").classList.remove("active");

});

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        const target = tab.dataset.tab;

        // switch active tab
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        // switch content
        contents.forEach(c => c.classList.remove("active"));

        if (target === "cash") {
            document.getElementById("cashTab").classList.add("active");
        } else {
            document.getElementById("digitalTab").classList.add("active");
        }
    });
});

function openPayment() {
    const modal = document.getElementById("paymentModal");
    const overlay = document.querySelector(".modal-overlay");

    currentTotal = getTotal();
    overlay.classList.add(".active")

    // update totals in both tabs
    document.getElementById("payTotal").textContent = currentTotal;
    document.getElementById("payTotal2").textContent = currentTotal;

    // reset inputs
    document.getElementById("cashInput").value = "";
    document.getElementById("change").textContent = "0";

    modal.classList.remove("hidden");
}

//clicking outside the modal to close
window.addEventListener("click", (e) => {
    const modal = document.getElementById("paymentModal");

    if (e.target === modal) {
        modal.classList.add("hidden");
    }
});

// ========= HISTORY LOGIC =========
let isConfirmOpen = false;

function getProductPrice(name) {
    const product = productsData.find(p => p.title === name);
    return product ? product.price : 0;
}

function saveToHistory() {
    const itemsArray = Object.keys(order).map(name => ({
        title: name,
        count: order[name].qty,
        price: order[name].price, // 👈 you must have this or map it
    }));

    const newOrder = {
        items: itemsArray,
        total: currentTotal,
        payment: paymentMethod,
        time: new Date().toLocaleString(),
        transactionId: paymentMethod === "digital"
            ? String(transactionInput.value).padStart(4, "*")
            : null
    };

    history.push(newOrder);
    localStorage.setItem("posHistory", JSON.stringify(history));
}

function loadHistory() {
    const data = localStorage.getItem("posHistory");

    if (data) {
        history = JSON.parse(data);
    }
}

function renderHistory() {
    const historyContainer = document.getElementById("historyContent");
    historyContainer.innerHTML = "";

    history.forEach((order, index) => {

        const itemsHTML = order.items.map(item => `
      <div class="history-product">
        <span>${item.title}</span>
        <span>x${item.count}</span>
        <span>${item.price * item.count} SDG</span>
      </div>
    `).join("");

        const historyItem = document.createElement("div");
        historyItem.className = "history-item";

        historyItem.innerHTML = `
      <div class="history-header" style="margin-bottom:10px">
        <button onclick="toggleDetails(${index}, this)">▼</button>
        <strong>#${index + 1} - ${order.total} SDG</strong>
        <button onclick="deleteHistory(${index})">🗑</button>
      </div>

      <div class="history-details" id="details-${index}">
        ${itemsHTML}
      </div>

      <div class="history-meta" style="margin-top:10px">
        ${order.payment === "digital" ?
                `<div class="transaction-id">
            Txn: **********${order.transactionId}
        </div>` : `
        <div class="cash">${order.payment}</div>
        `
            }  
        <div>${order.time}</div>
      </div>
    `;

        historyContainer.appendChild(historyItem);
    });
}

//add (*) with every digital payment items
function maskTransactionId(id) {
    if (!id) return "";
    return "**********" + String(id);
}

function deleteHistory(index) {
    if (isConfirmOpen) return;

    showConfirm("Delete this order?", () => {
        history.splice(index, 1);

        localStorage.setItem("posHistory", JSON.stringify(history));

        renderHistory();

        showToast("Order deleted 🗑", "error");
    });
}

function showConfirm(message, onYes) {
    const toast = document.getElementById("confirmToast");
    const msg = document.getElementById("confirmMessage");
    const yesBtn = document.getElementById("confirmYes");
    const noBtn = document.getElementById("confirmNo");

    // 🛑 prevent duplicate open
    if (!toast.classList.contains("hidden")) return;

    msg.textContent = message;
    toast.classList.remove("hidden");

    // reset state safely
    isConfirmOpen = true;

    // clean old events
    yesBtn.onclick = null;
    noBtn.onclick = null;

    yesBtn.onclick = () => {
        onYes();
        closeConfirm();
    };

    noBtn.onclick = () => {
        closeConfirm();
    };
}

function toggleHistory() {
    const panel = document.getElementById("historyPanel");

    panel.classList.toggle("hidden");

    renderHistory();
}

function toggleDetails(index, btn) {
    const el = document.getElementById(`details-${index}`);
    if (!el) return;

    if (el.style.maxHeight) {
        el.style.maxHeight = null;
        btn.classList.add("unRotate")
        btn.classList.remove("rotate")
    } else {
        el.style.maxHeight = el.scrollHeight + "px";
        btn.classList.remove("unRotate")
        btn.classList.add("rotate")
    }

}

function closeHistory() {
    document.getElementById("historyPanel").classList.add("hidden");
}

function closeConfirm() {
    const toast = document.getElementById("confirmToast");

    toast.classList.add("hidden");

    isConfirmOpen = false; // 🔥 ALWAYS reset here
}

// DASHBOARD
function updateDashboard() {
    let filteredHistory = getFilteredHistory();

    // 💰 total revenue
    let totalRevenue = 0;
    filteredHistory.forEach(o => {
        totalRevenue += Number(o.total) || 0;
    });

    //total orders
    const totalOrders = filteredHistory.length || 0;

    let todayRevenue = 0;

    const itemCount = {};

    const today = new Date().toLocaleDateString();

    history.forEach(order => {
        totalRevenue += order.total;

        // today's sales
        if (order.time.startsWith(today)) {
            todayRevenue += order.total;
        }

        // best seller calculation
        order.items.forEach(item => {
            if (!itemCount[item.title]) {
                itemCount[item.title] = 0;
            }
            itemCount[item.title] += item.count;
        });
    });

    // find best seller
    let bestSeller = "-";
    let max = 0;

    for (let item in itemCount) {
        if (itemCount[item] > max) {
            max = itemCount[item];
            bestSeller = item;
        }
    }

    // update UI
    document.getElementById("totalRevenue").textContent = totalRevenue + " SDG";
    document.getElementById("totalOrders").textContent = totalOrders;
    document.getElementById("todaySales").textContent = todayRevenue + " SDG";
    document.getElementById("bestSeller").textContent = bestSeller;

    animateValue(document.getElementById("totalRevenue"), 0, totalRevenue || 0);
    animateValue(document.getElementById("totalOrders"), 0, totalOrders || 0);
    animateValue(document.getElementById("todaySales"), 0, todayRevenue || 0);
}

function openDashboard() {
    document.getElementById("historyPanel")?.classList.remove("open");

    const panel = document.getElementById("dashboardPanel");
    panel.classList.add("open");

    document.body.classList.add("dashboard-open");

    updateDashboard();
    renderCharts()
}

function closeDashboard() {
    document.getElementById("dashboardPanel").classList.remove("open");
    document.body.classList.remove("dashboard-open");
}

//CHART LOGIC
function renderCharts() {
    let cash = 0;
    let digital = 0;
    let filteredHistory = getFilteredHistory();

    if (!Array.isArray(history) || history.length === 0) {
        console.log("No history data");
        return;
    }


    const now = new Date();

    if (currentFilter === "today") {
        filteredHistory = history.filter(o =>
            new Date(o.time).toDateString() === now.toDateString()
        );
    }

    if (currentFilter === "week") {
        filteredHistory = history.filter(o => {
            const d = new Date(o.time);
            const diff = (now - d) / (1000 * 60 * 60 * 24);
            return diff <= 7;
        });
    }

    if (currentFilter === "month") {
        filteredHistory = history.filter(o => {
            const d = new Date(o.time);
            return d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear();
        });
    }

    const ctx1 = document.getElementById("revenueChart");
    const ctx2 = document.getElementById("itemsChart");
    const ctx3 = document.getElementById("paymentChart");

    // ✅ DESTROY OLD CHARTS
    if (revenueChart) {
        revenueChart.destroy();
        revenueChart = null;
    }

    if (itemsChart) {
        itemsChart.destroy();
        itemsChart = null;
    }

    if (!ctx1 || !ctx2) {
        console.log("Canvas not found");
        return;
    }

    const dates = {};
    const itemsCount = {};

    filteredHistory.forEach(order => {

        if (!order || !order.items) return;

        const date = new Date(order.time || Date.now()).toLocaleDateString();

        if (!dates[date]) dates[date] = 0;
        dates[date] += order.total || 0;

        order.items.forEach(item => {
            if (!item || !item.title) return;

            if (!itemsCount[item.title]) itemsCount[item.title] = 0;
            itemsCount[item.title] += item.count || 0;
        });

        if (order.payment === "cash") cash++;
        else if (order.payment === "digital") digital++;
    });

    const dateLabels = Object.keys(dates);
    const revenueData = Object.values(dates);

    const itemLabels = Object.keys(itemsCount);
    const itemData = Object.values(itemsCount);

    if (revenueChart) revenueChart.destroy();
    if (itemsChart) itemsChart.destroy();
    if (paymentChart) paymentChart.destroy();

    try {

        revenueChart = new Chart(ctx1, {
            type: "line",
            data: {
                labels: dateLabels,
                datasets: [{
                    label: "Revenue",
                    data: revenueData,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,

                    // 🔥 Gradient
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return;

                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, "rgba(0, 200, 255, 0.4)");
                        gradient.addColorStop(1, "rgba(0, 200, 255, 0)");

                        return gradient;
                    },

                    borderColor: "#00c8ff",
                    pointRadius: 4,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                animation: {
                    duration: 1000,
                    easing: "easeOutQuart"
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: { size: 14 }
                        }
                    },
                    tooltip: {
                        backgroundColor: "#111",
                        titleColor: "#fff",
                        bodyColor: "#ddd",
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        grid: { color: "rgba(0,0,0,0.05)" }
                    }
                },
                animation: {
                    duration: 1200,
                    easing: "easeOutQuart"
                },
                transitions: {
                    active: {
                        animation: {
                            duration: 300
                        }
                    }
                }
            }
        });

        itemsChart = new Chart(ctx2, {
            type: "pie", // 🔥 better than pie
            data: {
                labels: itemLabels,
                datasets: [{
                    data: itemData,
                    borderWidth: 2,
                    borderRadius: 6,

                    backgroundColor: [
                        "#00c8ff",
                        "#ff7a18",
                        "#32d74b",
                        "#ff3b30",
                        "#a259ff",
                        "#ffd60a"
                    ]
                }]
            },
            options: {
                cutout: "65%", // 🔥 donut style
                animation: {
                    animateRotate: true,
                    duration: 1000
                },
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            padding: 15,
                            font: { size: 13 }
                        }
                    },
                    tooltip: {
                        backgroundColor: "#111",
                        titleColor: "#fff",
                        bodyColor: "#ddd"
                    }
                },
                animation: {
                    duration: 1200,
                    easing: "easeOutQuart"
                },
                transitions: {
                    active: {
                        animation: {
                            duration: 300
                        }
                    }
                }
            }
        });

        paymentChart = new Chart(ctx3, {
            type: "doughnut",
            data: {
                labels: ["Cash", "Digital"],
                datasets: [{
                    data: [cash, digital],
                    backgroundColor: ["#34c759", "#007aff"]
                }]
            },
            options: {
                cutout: "65%",
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1200
                }
            }
        });


    } catch (err) {
        console.error("Chart error:", err);
    }
}

//filter charts
function getFilteredHistory() {

    const now = new Date();

    if (currentFilter === "today") {
        return history.filter(o =>
            new Date(o.time).toDateString() === now.toDateString()
        );
    }

    if (currentFilter === "week") {
        return history.filter(o => {
            const diff = (now - new Date(o.time)) / (1000 * 60 * 60 * 24);
            return diff <= 7;
        });
    }

    if (currentFilter === "month") {
        return history.filter(o => {
            const d = new Date(o.time);
            return d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear();
        });
    }

    return history;
}


function setFilter(filter) {
    currentFilter = filter;
    renderCharts();
}

function setFilter(filter, el) {
    currentFilter = filter;

    // 🔥 remove active from all
    document.querySelectorAll(".filter-btn").forEach(btn =>
        btn.classList.remove("active")
    );

    // 🔥 set active to clicked
    el.classList.add("active");

    renderCharts();
}

// ANIMATE CHART NUMBERS
function animateValue(el, start, end, duration = 800) {

    let startTime = null;

    function animate(currentTime) {
        if (!startTime) startTime = currentTime;

        const progress = Math.min((currentTime - startTime) / duration, 1);

        const value = Math.floor(progress * (end - start) + start);

        el.textContent = value;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
} function animateValue(el, start, end, duration = 800) {

    let startTime = null;

    function animate(currentTime) {
        if (!startTime) startTime = currentTime;

        const progress = Math.min((currentTime - startTime) / duration, 1);

        const value = Math.floor(progress * (end - start) + start);

        el.textContent = value;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

// recept logic
function printReceipt(paymentMethod, change = 0) {
    const receiptItems = document.getElementById("receipt-items");
    const orderNumDisplay = document.getElementById("receipt-order-num");

    // NOW this will work perfectly!
    const orderID = getNextOrderNumber();

    if (orderNumDisplay) {
        orderNumDisplay.textContent = `#${orderID}`;
    }

    // 2. Handle Digital Masking
    let displayMethod = paymentMethod;
    if (paymentMethod === "Digital") {
        const input = document.getElementById("transactionInput").value;
        const lastFour = input.slice(-4) || "0000";
        displayMethod = `Digital (****${lastFour})`;
    }

    // 3. Inject Date & Items
    document.getElementById("receipt-date").textContent = new Date().toLocaleString();
    receiptItems.innerHTML = "";

    Object.keys(order).forEach(name => {
        const item = order[name];
        receiptItems.innerHTML += `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span>${name} x${item.qty}</span>
                <span>${(item.price * item.qty).toFixed(2)} SDG</span>
            </div>`;
    });

    // 4. Totals
    document.getElementById("receipt-total").textContent = updateTotal().toFixed(2);
    document.getElementById("receipt-method").textContent = displayMethod;
    document.getElementById("receipt-change").textContent = parseFloat(change).toFixed(2);

    // 5. Automatic Background Print
    // We use a small timeout to ensure the DOM is updated before the print dialog grabs the screen
    setTimeout(() => {
        window.print();
    }, 300);
}

loadHistory();
updateDashboard();
renderProducts(productsData);
setTimeout(() => {
    attachCategoryEvents();
}, 0);

