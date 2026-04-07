let order = {}
export let isConfirmOpen = false;
export let currentTotal = 0;
let heldOrders = [];
let activePreviewIndex = null;
let confirmAction = null;

const totalDisplay = document.querySelector(".total span");
const orderList = document.querySelector(".order-items");

export function addToCart() {
    const productCards = document.querySelectorAll(".product");
    productCards.forEach(card => {
        card.addEventListener("click", () => {
            const name = card.dataset.name;
            const price = parseFloat(card.dataset.price);

            addItem(name, price);

            console.log(order)
        });
    });
}

function addItem(name, price) {
    if (order[name]) {
        order[name].qty++;
    } else {
        order[name] = {
            price: price,
            qty: 1
        };
    }
    updatePayButton()
    renderOrder();
}

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
          <button data-name=${name} data-qty = "-1">−</button>
          <button data-name=${name} data-qty = "1">+</button>
      </div>

    `;

        orderList.appendChild(li);
    }

    totalDisplay.textContent = total.toFixed(2);
    updatePayButton()
    changeQty()
}

function clearOrder() {
    order = {};

    document.querySelector(".order-items").innerHTML = "";
    document.querySelector(".total").textContent = "0.00";
    updatePayButton();
    updateTotal();

}

export function cancelOrder() {
    document.getElementById("cancel").addEventListener("click", () => {
        showConfirm("Cancel this order?", () => {

            clearOrder();

            showToast("Order cancelled ❌");

        });
    })

}

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

function showCustomConfirm(message, action, onYes) {
    const confirmModal = document.getElementById("confirmToast");
    const messageEl = document.getElementById("confirmMessage");

    const yesBtn = document.getElementById("confirmYes");
    const noBtn = document.getElementById("confirmNo");

    // 🛑 prevent duplicate open
    if (!toast.classList.contains("hidden")) return;

    messageEl.textContent = message;
    toast.classList.remove("hidden");

    // reset state safely
    isConfirmOpen = true;

    // clean old events
    yesBtn.onclick = null;
    noBtn.onclick = null;

    yesBtn.onclick = () => {
        showToast("Order cancelled ❌");
        closeConfirm();
    };

    noBtn.onclick = () => {
        closeConfirm();
    };


    messageEl.textContent = message;
    confirmAction = action; // Save the function we want to run

    confirmModal.classList.remove("hidden");
    confirmModal.classList.add("visible");
}

function closeConfirm() {
    const toast = document.getElementById("confirmToast");

    toast.classList.add("hidden");

    isConfirmOpen = false; // 🔥 ALWAYS reset here
}

function updatePayButton() {
    const payBtn = document.getElementById("pay");

    if (Object.keys(order).length <= 0) {
        payBtn.disabled = true;
    } else {
        payBtn.disabled = false;
    }
}

export function changeQty() {
    let name;
    let delta;
    const changeBtn = document.querySelectorAll(".qty-controls button")
    changeBtn.forEach(btn => {
        btn.addEventListener("click", () => {
            name = btn.dataset.name
            delta = Number(btn.dataset.qty)
            console.log("change clicked", name, delta)
            order[name].qty += delta;
            if (order[name].qty <= 0) {
                delete order[name];
                updatePayButton()
            }
            renderOrder();
        })
    })


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

// ===== HOLD ORDER LOGIC=====
export function holdOrder() {
    document.getElementById("hold").addEventListener("click", () => {

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
    })

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
export function cancelHeldOrder() {
    document.getElementById("cancelHeldOrder").addEventListener("click", () => {
        showCustomConfirm("Discard this held order?", () => {
            heldOrders.splice(activePreviewIndex, 1);
            renderHeldButtons();
            document.getElementById("holdPreviewPanel").classList.remove("open");

            showToast("Held order removed");
        });
    })
}

// Pay from Hold (checking if main order is empty)
export function payFromHold() {
    document.getElementById("payFromHold").addEventListener("click", () => {

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
    })
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
    document.getElementById("holdPreviewPanel").classList.remove("open");
    // Slide the panel away

    // 4. Trigger your payment modal
    openPayModal();
}

export function closeHoldPreview() {
    document.getElementById("closeHoldPreview").addEventListener("click", () => {
        document.getElementById("holdPreviewPanel").classList.remove("open");
    })
}