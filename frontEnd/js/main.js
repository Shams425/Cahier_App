// js/main.js
import { productsData } from './data.js';
import { renderProducts } from './ui.js';
import { setupFilters } from './ui.js';
import { addToCart } from './cart.js';
import { changeQty } from './cart.js';
import { cancelOrder } from './cart.js';
import { isConfirmOpen } from './cart.js';
import { currentTotal } from './cart.js';
import { holdOrder } from './cart.js';
import { payFromHold } from './cart.js';
import { cancelHeldOrder } from './cart.js';
import { closeHoldPreview } from './cart.js';

// Initialize the App
document.addEventListener("DOMContentLoaded", () => {
    console.log("POS System Initialized...");

    // Initial render of the menu
    renderProducts(productsData);

    //filter controllers
    setupFilters(productsData);

    addToCart()

    changeQty()

    cancelOrder()

    holdOrder()
    payFromHold()
    cancelHeldOrder()
    closeHoldPreview()
    // Listen for the 'add-to-cart' event we created in ui.js
    window.addEventListener('add-to-cart', (e) => {
        const product = e.detail;
        console.log("Boss says: Add this to cart ->", product.name);
        // We will build the Cart Logic module next!
    });
});