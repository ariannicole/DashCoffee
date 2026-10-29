/**
 * history.js - Order History & Audit Trail Management
 */

let allHistoryOrders = [];

document.addEventListener('DOMContentLoaded', async () => {
    await window.dbManager.init();
    await loadOrderHistory();

    const searchInput = document.getElementById('search-history');
    if (searchInput) {
        searchInput.addEventListener('input', filterHistoryOrders);
    }
});

async function loadOrderHistory() {
    try {
        allHistoryOrders = await window.dbManager.getAll('orders');
        renderHistoryTable(allHistoryOrders);
    } catch (err) {
        console.error("Error loading order history:", err);
    }
}

function renderHistoryTable(orders) {
    const tbody = document.getElementById('history-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const sorted = [...orders].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No order history found.</td></tr>`;
        return;
    }

    for (let ord of sorted) {
        let badgeClass = 'badge-pending';
        if (ord.order_status === 'Completed') badgeClass = 'badge-completed';
        else if (ord.order_status === 'Preparing') badgeClass = 'badge-preparing';
        else if (ord.order_status === 'Cancelled') badgeClass = 'badge-cancelled';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${ord.order_number}</strong></td>
            <td>${ord.customer_name || 'Walk-in'}</td>
            <td>${ord.order_type}</td>
            <td>$${Number(ord.total_amount).toFixed(2)}</td>
            <td><span class="badge ${badgeClass}">${ord.order_status}</span></td>
            <td>${new Date(ord.created_at).toLocaleString()}</td>
            <td>
                <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="viewOrderDetails(${ord.order_id})"><i class="fa-solid fa-eye"></i></button>
                ${ord.order_status !== 'Cancelled' ? `<button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="cancelOrder(${ord.order_id})"><i class="fa-solid fa-ban"></i></button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    }
}

function filterHistoryOrders() {
    const query = document.getElementById('search-history').value.toLowerCase();
    const filtered = allHistoryOrders.filter(o => 
        o.order_number.toLowerCase().includes(query) || 
        (o.customer_name && o.customer_name.toLowerCase().includes(query))
    );
    renderHistoryTable(filtered);
}

window.viewOrderDetails = async function(orderId) {
    const order = await window.dbManager.getById('orders', orderId);
    const orderItems = await window.dbManager.getAll('order_items');
    const items = orderItems.filter(i => i.order_id === orderId);
    const products = await window.dbManager.getAll('products');
    const payments = await window.dbManager.getAll('payments');
    const payment = payments.find(p => p.order_id === orderId);

    let itemsStr = '';
    items.forEach(item => {
        const prod = products.find(p => p.product_id === item.product_id) || { product_name: 'Item' };
        itemsStr += `- ${prod.product_name} x${item.quantity} ($${Number(item.line_total).toFixed(2)})\n`;
    });

    alert(`Order Details: ${order.order_number}\nCustomer: ${order.customer_name}\nType: ${order.order_type}\nStatus: ${order.order_status}\nPayment: ${payment ? payment.payment_method + ' (' + payment.payment_status + ')' : 'Unpaid'}\n\nItems:\n${itemsStr}\nTotal: $${Number(order.total_amount).toFixed(2)}`);
};

window.cancelOrder = async function(orderId) {
    if (!window.authManager.requireRole(['Administrator'])) return;
    if (confirm('Are you sure you want to cancel this order and restore inventory?')) {
        const order = await window.dbManager.getById('orders', orderId);
        order.order_status = 'Cancelled';
        await window.dbManager.update('orders', order);

        // Restore inventory quantities according to product recipes
        const orderItems = await window.dbManager.getAll('order_items');
        const items = orderItems.filter(i => i.order_id === orderId);
        const productRecipes = await window.dbManager.getAll('product_recipes');
        const inventoryItems = await window.dbManager.getAll('inventory');

        for (let item of items) {
            const recipes = productRecipes.filter(r => r.product_id === item.product_id);
            for (let recipe of recipes) {
                const restoredQty = recipe.quantity_required * item.quantity;
                const inv = inventoryItems.find(i => i.inventory_id === recipe.inventory_id);
                if (inv) {
                    inv.quantity_in_stock += restoredQty;
                    inv.updated_at = new Date().toISOString();
                    await window.dbManager.update('inventory', inv);

                    await window.dbManager.add('inventory_transactions', {
                        inventory_id: inv.inventory_id,
                        transaction_type: 'Restoration',
                        quantity_changed: restoredQty,
                        reason: `Cancellation of ${order.order_number}`,
                        created_at: new Date().toISOString()
                    });
                }
            }
        }

        alert(`Order ${order.order_number} cancelled and stock restored.`);
        await loadOrderHistory();
    }
};
