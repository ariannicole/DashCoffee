/**
 * inventory.js - Inventory Management & Stock Tracking Logic
 */

let allInventory = [];
let allSuppliers = [];

document.addEventListener('DOMContentLoaded', async () => {
    await window.dbManager.init();
    await loadInventoryData();

    const addBtn = document.getElementById('add-inventory-btn');
    const modal = document.getElementById('inventory-modal');
    const closeBtn = document.getElementById('close-inventory-modal');
    const cancelBtn = document.getElementById('cancel-inventory-modal');
    const form = document.getElementById('inventory-form');

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (!window.authManager.requireRole(['Administrator', 'Inventory Staff'])) return;
            openInventoryModal();
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeInventoryModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeInventoryModal);
    if (form) form.addEventListener('submit', handleInventorySubmit);

    const searchInput = document.getElementById('search-inventory');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allInventory.filter(i => i.ingredient_name.toLowerCase().includes(query) || i.category.toLowerCase().includes(query));
            renderInventoryTable(filtered);
        });
    }
});

async function loadInventoryData() {
    try {
        allInventory = await window.dbManager.getAll('inventory');
        allSuppliers = await window.dbManager.getAll('suppliers');

        populateSupplierDropdown();
        renderInventoryTable(allInventory);
        renderInventoryTransactions();
    } catch (err) {
        console.error("Error loading inventory data:", err);
    }
}

function populateSupplierDropdown() {
    const select = document.getElementById('inv-supplier');
    if (!select) return;

    select.innerHTML = '';
    for (let sup of allSuppliers) {
        const opt = document.createElement('option');
        opt.value = sup.supplier_id;
        opt.textContent = sup.supplier_name;
        select.appendChild(opt);
    }
}

function renderInventoryTable(items) {
    const tbody = document.getElementById('inventory-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No inventory items found.</td></tr>`;
        return;
    }

    for (let item of items) {
        const sup = allSuppliers.find(s => s.supplier_id === Number(item.supplier_id)) || { supplier_name: 'N/A' };
        const isLow = Number(item.quantity_in_stock) <= Number(item.minimum_stock);
        const isOut = Number(item.quantity_in_stock) <= 0;

        let badgeClass = 'badge-active';
        let badgeText = 'Normal';
        if (isOut) {
            badgeClass = 'badge-out';
            badgeText = 'Out of Stock';
        } else if (isLow) {
            badgeClass = 'badge-low';
            badgeText = 'Low Stock';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${item.inventory_id}</strong></td>
            <td>${item.ingredient_name}</td>
            <td>${item.category}</td>
            <td>${item.quantity_in_stock} ${item.unit}</td>
            <td>${item.minimum_stock} ${item.unit}</td>
            <td>$${Number(item.cost_per_unit).toFixed(2)}</td>
            <td><span class="badge ${badgeClass}">${badgeText}</span></td>
            <td>
                <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 12px;" onclick="adjustStock(${item.inventory_id})"><i class="fa-solid fa-plus-minus"></i></button>
                <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 12px;" onclick="editInventory(${item.inventory_id})"><i class="fa-solid fa-pen"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

async function renderInventoryTransactions() {
    const tbody = document.getElementById('inventory-txn-tbody');
    if (!tbody) return;

    try {
        const txns = await window.dbManager.getAll('inventory_transactions');
        tbody.innerHTML = '';
        const sorted = [...txns].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

        if (sorted.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No stock movement history.</td></tr>`;
            return;
        }

        for (let t of sorted) {
            const item = allInventory.find(i => i.inventory_id === t.inventory_id) || { ingredient_name: 'Item', unit: 'pcs' };
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${t.transaction_id}</strong></td>
                <td>${item.ingredient_name}</td>
                <td><span class="badge ${t.quantity_changed > 0 ? 'badge-completed' : 'badge-out'}">${t.transaction_type}</span></td>
                <td>${t.quantity_changed > 0 ? '+' : ''}${t.quantity_changed} ${item.unit}</td>
                <td>${t.reason} (${new Date(t.created_at).toLocaleString()})</td>
            `;
            tbody.appendChild(tr);
        }
    } catch (err) {
        console.error("Error loading inventory transactions:", err);
    }
}

function openInventoryModal(item = null) {
    const modal = document.getElementById('inventory-modal');
    const title = document.getElementById('inventory-modal-title');
    const form = document.getElementById('inventory-form');

    form.reset();
    document.getElementById('inv-id').value = '';

    if (item) {
        title.textContent = 'Edit Inventory Item';
        document.getElementById('inv-id').value = item.inventory_id;
        document.getElementById('inv-name').value = item.ingredient_name;
        document.getElementById('inv-category').value = item.category;
        document.getElementById('inv-unit').value = item.unit;
        document.getElementById('inv-qty').value = item.quantity_in_stock;
        document.getElementById('inv-min').value = item.minimum_stock;
        document.getElementById('inv-cost').value = item.cost_per_unit;
        document.getElementById('inv-supplier').value = item.supplier_id;
    } else {
        title.textContent = 'Add New Inventory Item';
    }

    modal.classList.add('active');
}

function closeInventoryModal() {
    document.getElementById('inventory-modal').classList.remove('active');
}

window.editInventory = async function(id) {
    if (!window.authManager.requireRole(['Administrator', 'Inventory Staff'])) return;
    const item = await window.dbManager.getById('inventory', id);
    if (item) openInventoryModal(item);
};

window.adjustStock = async function(id) {
    if (!window.authManager.requireRole(['Administrator', 'Inventory Staff'])) return;
    const item = await window.dbManager.getById('inventory', id);
    if (!item) return;

    const qtyStr = prompt(`Enter quantity to add (positive) or remove (negative) for "${item.ingredient_name}":`, '500');
    if (qtyStr === null) return;
    const qtyChange = Number(qtyStr);
    if (isNaN(qtyChange)) {
        alert('Invalid quantity.');
        return;
    }

    const reason = prompt('Enter reason for stock adjustment (e.g. Restock delivery, Damage adjustment):', 'Manual Restock');
    if (!reason) return;

    item.quantity_in_stock += qtyChange;
    if (item.quantity_in_stock < 0) item.quantity_in_stock = 0;
    item.updated_at = new Date().toISOString();

    await window.dbManager.update('inventory', item);
    await window.dbManager.add('inventory_transactions', {
        inventory_id: item.inventory_id,
        transaction_type: qtyChange >= 0 ? 'Restock' : 'Adjustment',
        quantity_changed: qtyChange,
        reason: reason,
        created_at: new Date().toISOString()
    });

    await loadInventoryData();
};

async function handleInventorySubmit(e) {
    e.preventDefault();
    const id = document.getElementById('inv-id').value;
    const data = {
        ingredient_name: document.getElementById('inv-name').value.trim(),
        category: document.getElementById('inv-category').value,
        unit: document.getElementById('inv-unit').value,
        quantity_in_stock: Number(document.getElementById('inv-qty').value),
        minimum_stock: Number(document.getElementById('inv-min').value),
        cost_per_unit: Number(document.getElementById('inv-cost').value),
        supplier_id: Number(document.getElementById('inv-supplier').value),
        updated_at: new Date().toISOString()
    };

    if (id) {
        data.inventory_id = Number(id);
        const existing = await window.dbManager.getById('inventory', id);
        data.quantity_in_stock = existing.quantity_in_stock; // preserve stock unless adjusted via adjustStock
        await window.dbManager.update('inventory', data);
    } else {
        await window.dbManager.add('inventory', data);
        await window.dbManager.add('inventory_transactions', {
            inventory_id: await window.dbManager.getAll('inventory').then(arr => arr[arr.length-1].inventory_id),
            transaction_type: 'Initial',
            quantity_changed: data.quantity_in_stock,
            reason: 'New inventory item added',
            created_at: new Date().toISOString()
        });
    }

    closeInventoryModal();
    await loadInventoryData();
}
