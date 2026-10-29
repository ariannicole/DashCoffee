/**
 * billing.js - Billing, Payments & Receipt Generation Logic
 */

let selectedOrder = null;
let pendingOrders = [];

document.addEventListener('DOMContentLoaded', async () => {
    await window.dbManager.init();
    await loadBillingOrders();

    const payForm = document.getElementById('payment-form');
    if (payForm) {
        payForm.addEventListener('submit', handlePaymentSubmit);
    }

    const amountPaidInput = document.getElementById('amount-paid');
    if (amountPaidInput) {
        amountPaidInput.addEventListener('input', calculateChange);
    }

    const payMethodSelect = document.getElementById('payment-method');
    if (payMethodSelect) {
        payMethodSelect.addEventListener('change', (e) => {
            const cashSection = document.getElementById('cash-tendered-section');
            if (e.target.value === 'Cash') {
                cashSection.style.display = 'block';
            } else {
                cashSection.style.display = 'none';
                document.getElementById('change-due').value = '0.00';
            }
        });
    }

    // Check if URL has order_id parameter
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get('order_id');
    if (orderIdParam) {
        setTimeout(() => selectOrderForBilling(Number(orderIdParam)), 300);
    }
});

async function loadBillingOrders() {
    try {
        const orders = await window.dbManager.getAll('orders');
        const payments = await window.dbManager.getAll('payments');
        const paidOrderIds = payments.map(p => p.order_id);

        pendingOrders = orders.filter(o => !paidOrderIds.includes(o.order_id) && o.order_status !== 'Cancelled');
        renderBillingOrdersTable(pendingOrders);

        // Also render payment history
        renderPaymentHistoryTable(payments, orders);
    } catch (err) {
        console.error("Error loading billing orders:", err);
    }
}

function renderBillingOrdersTable(orders) {
    const tbody = document.getElementById('billing-orders-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No pending orders for payment.</td></tr>`;
        return;
    }

    for (let ord of orders) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${ord.order_number}</strong></td>
            <td>${ord.customer_name || 'Walk-in'}</td>
            <td>${ord.order_type}</td>
            <td>$${Number(ord.total_amount).toFixed(2)}</td>
            <td><span class="badge badge-pending">${ord.order_status}</span></td>
            <td>
                <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="selectOrderForBilling(${ord.order_id})"><i class="fa-solid fa-cash-register"></i> Pay</button>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

async function selectOrderForBilling(orderId) {
    try {
        const order = await window.dbManager.getById('orders', orderId);
        if (!order) return;

        selectedOrder = order;
        document.getElementById('bill-order-number').textContent = order.order_number;
        document.getElementById('bill-customer').textContent = order.customer_name || 'Walk-in';
        document.getElementById('bill-subtotal').textContent = `$${Number(order.subtotal).toFixed(2)}`;
        document.getElementById('bill-tax').textContent = `$${Number(order.tax).toFixed(2)}`;
        document.getElementById('bill-total').textContent = `$${Number(order.total_amount).toFixed(2)}`;
        document.getElementById('amount-paid').value = Number(order.total_amount).toFixed(2);
        calculateChange();

        // Show payment panel / modal
        document.getElementById('payment-section').style.display = 'block';
    } catch (err) {
        console.error("Error selecting order:", err);
    }
}

window.selectOrderForBilling = selectOrderForBilling;

function calculateChange() {
    if (!selectedOrder) return;
    const total = Number(selectedOrder.total_amount);
    const paid = Number(document.getElementById('amount-paid').value) || 0;
    const change = paid - total;
    document.getElementById('change-due').value = change >= 0 ? change.toFixed(2) : '0.00';
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    if (!selectedOrder) {
        alert('No order selected for payment.');
        return;
    }

    const method = document.getElementById('payment-method').value;
    const amountPaid = Number(document.getElementById('amount-paid').value);
    const changeDue = Number(document.getElementById('change-due').value);

    if (method === 'Cash' && amountPaid < selectedOrder.total_amount) {
        alert('Amount tendered is less than the total amount due.');
        return;
    }

    // Check if payment already exists for this order
    const payments = await window.dbManager.getAll('payments');
    const existing = payments.find(p => p.order_id === selectedOrder.order_id);
    if (existing) {
        alert('Payment already recorded for this order.');
        return;
    }

    const txnRef = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const paymentData = {
        order_id: selectedOrder.order_id,
        payment_method: method,
        amount_paid: amountPaid,
        change_due: changeDue,
        payment_status: 'Paid',
        payment_date: now,
        transaction_reference: txnRef
    };

    try {
        const paymentId = await window.dbManager.add('payments', paymentData);

        // Update order status to Completed
        selectedOrder.order_status = 'Completed';
        await window.dbManager.update('orders', selectedOrder);

        // Record sales record
        await window.dbManager.add('sales_records', {
            order_id: selectedOrder.order_id,
            payment_id: paymentId,
            total_sales: selectedOrder.total_amount,
            transaction_date: now
        });

        alert(`Payment successful! Transaction Ref: ${txnRef}`);
        generatePrintableReceipt(selectedOrder, paymentData);

        selectedOrder = null;
        document.getElementById('payment-section').style.display = 'none';
        await loadBillingOrders();

    } catch (err) {
        console.error("Error processing payment:", err);
        alert('Failed to process payment.');
    }
}

async function generatePrintableReceipt(order, payment) {
    const orderItems = await window.dbManager.getAll('order_items');
    const items = orderItems.filter(i => i.order_id === order.order_id);
    const products = await window.dbManager.getAll('products');

    let itemsHtml = '';
    for (let item of items) {
        const prod = products.find(p => p.product_id === item.product_id) || { product_name: 'Item' };
        itemsHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>${prod.product_name} x${item.quantity}</span>
                <span>$${Number(item.line_total).toFixed(2)}</span>
            </div>
        `;
    }

    const receiptWin = window.open('', '_blank', 'width=400,height=600');
    receiptWin.document.write(`
        <html>
        <head>
            <title>Receipt - DashCoffee</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; font-size: 13px; padding: 20px; color: #2b2b2b; }
                .center { text-align: center; }
                .line { border-bottom: 1px dashed #333; margin: 10px 0; }
                .flex { display: flex; justify-content: space-between; }
            </style>
        </head>
        <body>
            <div class="center">
                <h2>DashCoffee Shop</h2>
                <p>123 Coffee Bean Way, Suite 100<br>Tel: +1-555-COFFEE</p>
            </div>
            <div class="line"></div>
            <div>
                <p>Receipt #: ${payment.transaction_reference}</p>
                <p>Order #: ${order.order_number}</p>
                <p>Date: ${new Date(payment.payment_date).toLocaleString()}</p>
                <p>Cashier: ${window.authManager.currentUser ? window.authManager.currentUser.full_name : 'Staff'}</p>
                <p>Customer: ${order.customer_name || 'Walk-in'}</p>
            </div>
            <div class="line"></div>
            <div>
                <strong>Items Ordered:</strong>
                ${itemsHtml}
            </div>
            <div class="line"></div>
            <div class="flex"><span>Subtotal:</span> <span>$${Number(order.subtotal).toFixed(2)}</span></div>
            <div class="flex"><span>Tax (10%):</span> <span>$${Number(order.tax).toFixed(2)}</span></div>
            <div class="flex" style="font-weight: bold; font-size: 15px; margin-top: 6px;"><span>Total:</span> <span>$${Number(order.total_amount).toFixed(2)}</span></div>
            <div class="line"></div>
            <div class="flex"><span>Payment Method:</span> <span>${payment.payment_method}</span></div>
            <div class="flex"><span>Amount Received:</span> <span>$${Number(payment.amount_paid).toFixed(2)}</span></div>
            <div class="flex"><span>Change Due:</span> <span>$${Number(payment.change_due || 0).toFixed(2)}</span></div>
            <div class="line"></div>
            <div class="center" style="margin-top: 20px;">
                <p>Thank you for visiting DashCoffee!</p>
                <p>Please come again!</p>
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
    receiptWin.document.close();
}

function renderPaymentHistoryTable(payments, orders) {
    const tbody = document.getElementById('payment-history-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const sorted = [...payments].sort((a,b) => new Date(b.payment_date) - new Date(a.payment_date));

    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No payment history records.</td></tr>`;
        return;
    }

    for (let pay of sorted) {
        const order = orders.find(o => o.order_id === pay.order_id) || { order_number: 'N/A', customer_name: 'Walk-in' };
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${pay.transaction_reference}</strong></td>
            <td>${order.order_number}</td>
            <td>${order.customer_name || 'Walk-in'}</td>
            <td>$${Number(pay.amount_paid - (pay.change_due || 0)).toFixed(2)}</td>
            <td>${pay.payment_method}</td>
            <td>${new Date(pay.payment_date).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    }
}
