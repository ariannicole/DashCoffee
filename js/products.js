/**
 * products.js - Product & Menu Management Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    await window.dbManager.init();
    await loadProductsTable();

    // Search and Filter listeners
    const searchInput = document.getElementById('search-product');
    const categoryFilter = document.getElementById('filter-category');
    if (searchInput) searchInput.addEventListener('input', filterProducts);
    if (categoryFilter) categoryFilter.addEventListener('change', filterProducts);

    // Modal triggers
    const addBtn = document.getElementById('add-product-btn');
    const modalOverlay = document.getElementById('product-modal');
    const closeModal = document.getElementById('close-product-modal');
    const cancelModal = document.getElementById('cancel-product-modal');
    const productForm = document.getElementById('product-form');

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (!window.authManager.requireRole(['Administrator', 'Inventory Staff'])) return;
            openProductModal();
        });
    }

    if (closeModal) closeModal.addEventListener('click', closeProductModal);
    if (cancelModal) cancelModal.addEventListener('click', closeProductModal);

    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
});

let allProducts = [];

async function loadProductsTable() {
    try {
        allProducts = await window.dbManager.getAll('products');
        renderProductsTable(allProducts);
    } catch (err) {
        console.error("Error loading products:", err);
    }
}

function renderProductsTable(products) {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No products found.</td></tr>`;
        return;
    }

    for (let prod of products) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${prod.product_id}</strong></td>
            <td>${prod.product_name}</td>
            <td>${prod.category}</td>
            <td>$${Number(prod.price).toFixed(2)}</td>
            <td>${prod.description || '-'}</td>
            <td><span class="badge ${prod.availability ? 'badge-active' : 'badge-out'}">${prod.availability ? 'Available' : 'Unavailable'}</span></td>
            <td>
                <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 12px;" onclick="editProduct(${prod.product_id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-danger" style="padding: 6px 10px; font-size: 12px;" onclick="deleteProduct(${prod.product_id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

function filterProducts() {
    const query = document.getElementById('search-product').value.toLowerCase();
    const category = document.getElementById('filter-category').value;

    const filtered = allProducts.filter(p => {
        const matchesQuery = p.product_name.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query));
        const matchesCategory = category === '' || p.category === category;
        return matchesQuery && matchesCategory;
    });

    renderProductsTable(filtered);
}

function openProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');

    form.reset();
    document.getElementById('product-id').value = '';

    if (product) {
        title.textContent = 'Edit Product';
        document.getElementById('product-id').value = product.product_id;
        document.getElementById('product-name').value = product.product_name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-desc').value = product.description || '';
        document.getElementById('product-avail').checked = product.availability;
    } else {
        title.textContent = 'Add New Product';
        document.getElementById('product-avail').checked = true;
    }

    modal.classList.add('active');
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.remove('active');
}

async function editProduct(id) {
    if (!window.authManager.requireRole(['Administrator', 'Inventory Staff'])) return;
    const prod = await window.dbManager.getById('products', id);
    if (prod) {
        openProductModal(prod);
    }
}

async function deleteProduct(id) {
    if (!window.authManager.requireRole(['Administrator'])) return;
    if (confirm('Are you sure you want to delete this product?')) {
        await window.dbManager.delete('products', id);
        await loadProductsTable();
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    const data = {
        product_name: document.getElementById('product-name').value.trim(),
        category: document.getElementById('product-category').value,
        price: parseFloat(document.getElementById('product-price').value),
        description: document.getElementById('product-desc').value.trim(),
        availability: document.getElementById('product-avail').checked,
        created_at: new Date().toISOString()
    };

    if (id) {
        data.product_id = Number(id);
        const existing = await window.dbManager.getById('products', id);
        data.created_at = existing.created_at || data.created_at;
        await window.dbManager.update('products', data);
    } else {
        await window.dbManager.add('products', data);
    }

    closeProductModal();
    await loadProductsTable();
}
