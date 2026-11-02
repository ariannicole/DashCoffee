/**
 * orders.js - Order Processing & POS Interface (PHP Currency with Pricing Table)
 */

let cart = [];
let menuProducts = [];
let inventoryItems = [];
let productRecipes = [];

document.addEventListener('DOMContentLoaded', async () => {
    await window.dbManager.init();
    await loadPOSData();

    const checkoutBtn = document.getElementById('checkout-order-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', processOrderCheckout);
    }

    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            cart = [];
            renderCart();
        });
    }
});

async function loadPOSData() {
    try {
        menuProducts = await window.dbManager.getAll('products');
        inventoryItems = await window.dbManager.getAll('inventory');
        productRecipes = await window.dbManager.getAll('product_recipes');

        renderPricingTable(menuProducts.filter(p => p.availability));
        renderCart();
    } catch (err) {
        console.error("Error loading POS data:", err);
    }
}

function renderPricingTable(products) {
    const tbody = document.getElementById('pricing-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: #ffffff;">No products available.</td></tr>`;
        return;
    }

    // Sort products alphabetically by name for a clean display
    const sortedProducts = [...products].sort((a, b) => a.product_name.localeCompare(b.product_name));

    for (let prod of sortedProducts) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${prod.product_name}</td>
            <td>${formatPeso(prod.price)}</td>
        `;
        tr.addEventListener('click', () => addToCart(prod));
        tr.title = 'Click to add to order';
        tbody.appendChild(tr);
    }
}

function addToCart(product) {
    const existingIndex = cart.findIndex(item => item.product_id === product.product_id);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            product_id: product.product_id,
            product_name: product.product_name,
            unit_price: Number(product.price) || 0,
            quantity: 1,
            customization: 'Standard'
        });
    }
    renderCart();
}

function renderCart() {
    const tbody = document.getElementById('cart-items-tbody');
    const subtotalEl = document.getElementById('cart-subtotal');
    const taxEl = document.getElementById('cart-tax');
    const totalEl = document.getElementById('cart-total');

    if (!tbody) return;

    tbody.innerHTML = '';
    let subtotal = 0;

    if (cart.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Cart is empty</td></tr>`;
    } else {
        cart.forEach((item, index) => {
            const lineTotal = Number(item.unit_price) * Number(item.quantity);
            subtotal += lineTotal;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.product_name}</td>
                <td>${formatPeso(item.unit_price)}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 11px;" onclick="updateQty(${index}, -1)">-</button>
                    <span style="margin: 0 8px; font-weight: 600;">${item.quantity}</span>
                    <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 11px;" onclick="updateQty(${index}, 1)">+</button>
                </td>
                <td>${formatPeso(lineTotal)}</td>
                <td><button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="removeFromCart(${index})"><i class="fa-solid fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    const tax = subtotal * 0.10;
    const total = subtotal + tax;

    if (subtotalEl) subtotalEl.textContent = formatPeso(subtotal);
    if (taxEl) taxEl.textContent = formatPeso(tax);
    if (totalEl) totalEl.textContent = formatPeso(total);
}

window.updateQty = function(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    renderCart();
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    renderCart();
};

async function processOrderCheckout() {
    if (cart.length === 0) {
        alert('Cart is empty. Please add items before checkout.');
        return;
    }

    const customerName = document.getElementById('order-customer-name').value.trim() || 'Walk-in Customer';
    const orderType = document.getElementById('order-type').value;

    for (let item of cart) {
        const recipes = productRecipes.filter(r => r.product_id === item.product_id);
        for (let recipe of recipes) {
            const requiredQty = recipe.quantity_required * item.quantity;
            const inv = inventoryItems.find(i => i.inventory_id === recipe.inventory_id);
            if (!inv || inv.quantity_in_stock < requiredQty) {
                alert(`Insufficient stock for ingredient "${inv ? inv.ingredient_name : 'Unknown'}". Order cannot be processed.`);
                return;
            }
        }
    }

    let subtotal = cart.reduce((acc, item) => acc + (Number(item.unit_price) * Number(item.quantity)), 0);
    let tax = subtotal * 0.10;
    let total = subtotal + tax;

    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderData = {
        order_number: orderNumber,
        customer_name: customerName,
        order_type: orderType,
        order_status: 'Pending',
        subtotal: subtotal,
        discount: 0.00,
        tax: tax,
        total_amount: total,
        created_at: new Date().toISOString()
    };

    try {
        const orderId = await window.dbManager.add('orders', orderData);

        for (let item of cart) {
            await window.dbManager.add('order_items', {
                order_id: orderId,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                customization: item.customization,
                line_total: Number(item.unit_price) * Number(item.quantity)
            });

            const recipes = productRecipes.filter(r => r.product_id === item.product_id);
            for (let recipe of recipes) {
                const consumed = recipe.quantity_required * item.quantity;
                const inv = inventoryItems.find(i => i.inventory_id === recipe.inventory_id);
                if (inv) {
                    inv.quantity_in_stock -= consumed;
                    inv.updated_at = new Date().toISOString();
                    await window.dbManager.update('inventory', inv);

                    await window.dbManager.add('inventory_transactions', {
                        inventory_id: inv.inventory_id,
                        transaction_type: 'Usage',
                        quantity_changed: -consumed,
                        reason: `Order #${orderNumber}`,
                        created_at: new Date().toISOString()
                    });
                }
            }
        }

        alert(`Order #${orderNumber} submitted successfully!`);
        cart = [];
        renderCart();
        document.getElementById('order-customer-name').value = '';
        await loadPOSData();

        if (confirm('Proceed to billing payment for this order?')) {
            window.location.href = `billing.html?order_id=${orderId}`;
        }

    } catch (err) {
        console.error("Error creating order:", err);
        alert('Failed to process order. Please try again.');
    }
}
