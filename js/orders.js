/**
 * orders.js - Order Processing & POS Interface
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

    const searchMenu = document.getElementById('search-pos-menu');
    if (searchMenu) {
        searchMenu.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = menuProducts.filter(p => p.product_name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
            renderMenuGrid(filtered);
        });
    }
});

async function loadPOSData() {
    try {
        menuProducts = await window.dbManager.getAll('products');
        inventoryItems = await window.dbManager.getAll('inventory');
        productRecipes = await window.dbManager.getAll('product_recipes');

        renderMenuGrid(menuProducts.filter(p => p.availability));
        renderCart();
    } catch (err) {
        console.error("Error loading POS data:", err);
    }
}

function renderMenuGrid(products) {
    const grid = document.getElementById('pos-menu-grid');
    if (!grid) return;

    grid.innerHTML = '';
    if (products.length === 0) {
        grid.innerHTML = `<p style="grid-column: span 3; text-align: center; color: var(--text-muted);">No products available.</p>`;
        return;
    }

    for (let prod of products) {
        const card = document.createElement('div');
        card.className = 'pos-product-card';
        card.style.cssText = `background: var(--white); border-radius: 10px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor: pointer; transition: var(--transition); border: 1px solid var(--beige);`;
        card.innerHTML = `
            <div style="font-weight: 600; font-size: 15px; color: var(--coffee-dark); margin-bottom: 6px;">${prod.product_name}</div>
            <div style="font-size: 13px; color: var(--caramel); font-weight: 700; margin-bottom: 8px;">$${Number(prod.price).toFixed(2)}</div>
            <div style="font-size: 12px; color: var(--text-muted); line-height: 1.3;">${prod.description || prod.category}</div>
        `;
        card.addEventListener('click', () => addToCart(prod));
        grid.appendChild(card);
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
            unit_price: product.price,
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
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Cart is empty. Select items from menu.</td></tr>`;
    } else {
        cart.forEach((item, index) => {
            const lineTotal = item.unit_price * item.quantity;
            subtotal += lineTotal;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.product_name}</td>
                <td>$${Number(item.unit_price).toFixed(2)}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 11px;" onclick="updateQty(${index}, -1)">-</button>
                    <span style="margin: 0 8px; font-weight: 600;">${item.quantity}</span>
                    <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 11px;" onclick="updateQty(${index}, 1)">+</button>
                </td>
                <td>$${lineTotal.toFixed(2)}</td>
                <td><button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="removeFromCart(${index})"><i class="fa-solid fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    const tax = subtotal * 0.10; // 10% tax config
    const total = subtotal + tax;

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
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

    // Validate inventory requirements against product recipes
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

    let subtotal = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
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
                line_total: item.unit_price * item.quantity
            });

            // Deduct inventory
            const recipes = productRecipes.filter(r => r.product_id === item.product_id);
            for (let recipe of recipes) {
                const consumed = recipe.quantity_required * item.quantity;
                const inv = inventoryItems.find(i => i.inventory_id === recipe.inventory_id);
                if (inv) {
                    inv.quantity_in_stock -= consumed;
                    inv.updated_at = new Date().toISOString();
                    await window.dbManager.update('inventory', inv);

                    // Record inventory transaction
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

        // Optionally redirect to billing
        if (confirm('Proceed to billing payment for this order?')) {
            window.location.href = `billing.html?order_id=${orderId}`;
        }

    } catch (err) {
        console.error("Error creating order:", err);
        alert('Failed to process order. Please try again.');
    }
}
