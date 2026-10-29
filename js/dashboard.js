/**
 * dashboard.js - Real-Time Dashboard Statistics & Analytics
 */

document.addEventListener('DOMContentLoaded', async () => {
    await window.dbManager.init();
    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        const orders = await window.dbManager.getAll('orders');
        const payments = await window.dbManager.getAll('payments');
        const products = await window.dbManager.getAll('products');
        const inventory = await window.dbManager.getAll('inventory');
        const orderItems = await window.dbManager.getAll('order_items');

        // Today's date string start (YYYY-MM-DD)
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Total Sales for Today
        let todaySales = 0;
        payments.forEach(pay => {
            if (pay.payment_status === 'Paid' && pay.payment_date && pay.payment_date.startsWith(todayStr)) {
                // Find corresponding order amount or payment amount
                todaySales += Number(pay.amount_paid) - Number(pay.change_due || 0);
            }
        });
        
        // Alternatively sum from sales_records for today
        const salesRecords = await window.dbManager.getAll('sales_records');
        let todaySalesCalc = 0;
        salesRecords.forEach(sr => {
            if (sr.transaction_date && sr.transaction_date.startsWith(todayStr)) {
                todaySalesCalc += Number(sr.total_sales || 0);
            }
        });
        if (todaySalesCalc > 0) todaySales = todaySalesCalc;

        // 2. Total Orders (Today or overall)
        const todayOrders = orders.filter(o => o.created_at && o.created_at.startsWith(todayStr));
        const totalOrdersEl = document.getElementById('stat-total-orders');
        if (totalOrdersEl) totalOrdersEl.textContent = orders.length;

        const todaySalesEl = document.getElementById('stat-today-sales');
        if (todaySalesEl) todaySalesEl.textContent = `$${todaySales.toFixed(2)}`;

        // 3. Available Products
        const availProducts = products.filter(p => p.availability);
        const availProductsEl = document.getElementById('stat-avail-products');
        if (availProductsEl) availProductsEl.textContent = `${availProducts.length} / ${products.length}`;

        // 4. Low-stock ingredients
        const lowStockItems = inventory.filter(i => Number(i.quantity_in_stock) <= Number(i.minimum_stock));
        const lowStockEl = document.getElementById('stat-low-stock');
        if (lowStockEl) lowStockEl.textContent = lowStockItems.length;

        // Render Recent Transactions Table
        const recentTxBody = document.getElementById('recent-transactions-tbody');
        if (recentTxBody) {
            recentTxBody.innerHTML = '';
            const sortedPayments = [...payments].sort((a,b) => new Date(b.payment_date) - new Date(a.payment_date)).slice(0, 5);
            
            if (sortedPayments.length === 0) {
                recentTxBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No recent transactions found.</td></tr>`;
            } else {
                for (let pay of sortedPayments) {
                    const order = orders.find(o => o.order_id === pay.order_id) || { order_number: 'N/A', customer_name: 'Walk-in' };
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${order.order_number}</strong></td>
                        <td>${order.customer_name || 'Walk-in'}</td>
                        <td>$${Number(pay.amount_paid - (pay.change_due || 0)).toFixed(2)}</td>
                        <td>${pay.payment_method}</td>
                        <td><span class="badge badge-completed">${pay.payment_status}</span></td>
                        <td>${new Date(pay.payment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    `;
                    recentTxBody.appendChild(tr);
                }
            }
        }

        // Render Best-Selling Coffee Products
        const bestSellersBody = document.getElementById('best-sellers-tbody');
        if (bestSellersBody) {
            bestSellersBody.innerHTML = '';
            // Aggregate quantities by product_id
            const productCounts = {};
            orderItems.forEach(item => {
                productCounts[item.product_id] = (productCounts[item.product_id] || 0) + Number(item.quantity);
            });

            const sortedProducts = Object.entries(productCounts)
                .sort((a,b) => b[1] - a[1])
                .slice(0, 5);

            if (sortedProducts.length === 0) {
                bestSellersBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No sales data available.</td></tr>`;
            } else {
                for (let [prodId, qty] of sortedProducts) {
                    const prod = products.find(p => p.product_id == prodId) || { product_name: 'Unknown', category: 'Coffee', price: 0 };
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${prod.product_name}</strong></td>
                        <td>${prod.category}</td>
                        <td><span class="badge badge-preparing">${qty} sold</span></td>
                    `;
                    bestSellersBody.appendChild(tr);
                }
            }
        }

    } catch (err) {
        console.error("Error loading dashboard data:", err);
    }
}
