/**
 * reports.js - Sales Reports & Analytics Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    await window.dbManager.init();
    await generateReports();

    const filterBtn = document.getElementById('apply-filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', generateReports);
    }

    const exportBtn = document.getElementById('export-csv-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReportsCSV);
    }

    const printBtn = document.getElementById('print-report-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }
});

async function generateReports() {
    try {
        const salesRecords = await window.dbManager.getAll('sales_records');
        const orders = await window.dbManager.getAll('orders');
        const payments = await window.dbManager.getAll('payments');
        const orderItems = await window.dbManager.getAll('order_items');
        const products = await window.dbManager.getAll('products');
        const inventory = await window.dbManager.getAll('inventory');

        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;

        // Filter by date range if provided
        const filteredSales = salesRecords.filter(sr => {
            if (!sr.transaction_date) return false;
            const d = sr.transaction_date.split('T')[0];
            if (startDate && d < startDate) return false;
            if (endDate && d > endDate) return false;
            return true;
        });

        // 1. Summary Metrics
        let totalRevenue = 0;
        filteredSales.forEach(sr => totalRevenue += Number(sr.total_sales || 0));

        const totalTransactions = filteredSales.length;

        document.getElementById('rep-total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('rep-total-txns').textContent = totalTransactions;
        document.getElementById('rep-total-orders').textContent = orders.length;

        // 2. Payment Method Summaries
        const methodCounts = { Cash: 0, Card: 0, 'Digital Wallet': 0 };
        filteredSales.forEach(sr => {
            const pay = payments.find(p => p.payment_id === sr.payment_id);
            if (pay && methodCounts[pay.payment_method] !== undefined) {
                methodCounts[pay.payment_method] += Number(sr.total_sales || 0);
            }
        });

        const methodTbody = document.getElementById('report-payment-tbody');
        if (methodTbody) {
            methodTbody.innerHTML = `
                <tr><td>Cash Payments</td><td>$${methodCounts['Cash'].toFixed(2)}</td></tr>
                <tr><td>Card Payments</td><td>$${methodCounts['Card'].toFixed(2)}</td></tr>
                <tr><td>Digital Wallet</td><td>$${methodCounts['Digital Wallet'].toFixed(2)}</td></tr>
            `;
        }

        // 3. Sales By Product
        const productSalesMap = {};
        filteredSales.forEach(sr => {
            const items = orderItems.filter(i => i.order_id === sr.order_id);
            items.forEach(item => {
                if (!productSalesMap[item.product_id]) {
                    productSalesMap[item.product_id] = { qty: 0, revenue: 0 };
                }
                productSalesMap[item.product_id].qty += Number(item.quantity);
                productSalesMap[item.product_id].revenue += Number(item.line_total);
            });
        });

        const prodTbody = document.getElementById('report-products-tbody');
        if (prodTbody) {
            prodTbody.innerHTML = '';
            const sortedProducts = Object.entries(productSalesMap).sort((a,b) => b[1].revenue - a[1].revenue);

            if (sortedProducts.length === 0) {
                prodTbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No sales records found for this period.</td></tr>`;
            } else {
                for (let [prodId, data] of sortedProducts) {
                    const prod = products.find(p => p.product_id == prodId) || { product_name: 'Unknown' };
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${prod.product_name}</strong></td>
                        <td>${data.qty}</td>
                        <td>$${data.revenue.toFixed(2)}</td>
                    `;
                    prodTbody.appendChild(tr);
                }
            }
        }

        // 4. Low-stock Inventory Report
        const lowStockTbody = document.getElementById('report-lowstock-tbody');
        if (lowStockTbody) {
            lowStockTbody.innerHTML = '';
            const lowItems = inventory.filter(i => Number(i.quantity_in_stock) <= Number(i.minimum_stock));

            if (lowItems.length === 0) {
                lowStockTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">All inventory levels are sufficient.</td></tr>`;
            } else {
                for (let item of lowItems) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${item.ingredient_name}</strong></td>
                        <td>${item.quantity_in_stock} ${item.unit}</td>
                        <td>${item.minimum_stock} ${item.unit}</td>
                        <td><span class="badge badge-low">Needs Restock</span></td>
                    `;
                    lowStockTbody.appendChild(tr);
                }
            }
        }

    } catch (err) {
        console.error("Error generating reports:", err);
    }
}

function exportReportsCSV() {
    let csv = 'DashCoffee Sales Report\n\n';
    csv += 'Transaction ID,Order ID,Total Sales,Date\n';
    
    window.dbManager.getAll('sales_records').then(sales => {
        sales.forEach(s => {
            csv += `${s.sales_id},${s.order_id},${s.total_sales},${s.transaction_date}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `DashCoffee_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}
