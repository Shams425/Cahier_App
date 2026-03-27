// ===== global =====
let order = [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let currentFilter = "all"
let revenueChart = null;
let itemsChart = null;
let paymentChart = null;
let transactionCounter = 1;


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
// ===== Remove all items FUNCTION =====
function clearOrder() {
    order = [];

    document.querySelector(".order-items").innerHTML = "";
    document.querySelector(".total span").textContent = "0.00";
    updatePayButton();
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


// ===== filter product logic ======
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
payBtn.addEventListener("click", () => {
    currentTotal = getTotal();
    payTotal.textContent = currentTotal;

    modal.classList.remove("hidden");
    cashInput.value = "";
    changeEl.textContent = "0";
});

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

document.getElementById("confirmPay").addEventListener("click", () => {

    if (paymentMethod === "cash") {
        const cash = parseFloat(cashInput.value);

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
});

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

loadHistory();
updateDashboard();
renderProducts(productsData);
setTimeout(() => {
    attachCategoryEvents();
}, 0);

