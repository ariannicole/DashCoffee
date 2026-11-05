/**
 * products.js - Product & Menu Management Logic (PHP Currency with Images)
 */

document.addEventListener('DOMContentLoaded', async () => {
    await window.dbManager.init();
    await loadProductsTable();

    const searchInput = document.getElementById('search-product');
    const categoryFilter = document.getElementById('filter-category');
    if (searchInput) searchInput.addEventListener('input', filterProducts);
    if (categoryFilter) categoryFilter.addEventListener('change', filterProducts);

    const addBtn = document.getElementById('add-product-btn');
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
        renderProductsGrid(allProducts);
    } catch (err) {
        console.error("Error loading products:", err);
    }
}

function renderProductsGrid(products) {
    const container = document.getElementById('products-grid');
    if (!container) return;

    container.innerHTML = '';
    if (products.length === 0) {
        container.innerHTML = `<p style="grid-column: span 4; text-align: center; color: var(--text-muted);">No products found.</p>`;
        return;
    }

    for (let prod of products) {
        const card = document.createElement('div');
        card.style.cssText = `background: var(--white); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(44, 24, 16, 0.08); border: 1px solid var(--beige); transition: var(--transition);`;
        card.innerHTML = `
            <div style="width: 100%; height: 160px; background: var(--cream); overflow: hidden;">
                <img src="${prod.image || 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800'}" alt="${prod.product_name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800'">
            </div>
            <div style="padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <h3 style="font-size: 16px; color: var(--coffee-dark); font-weight: 600; flex: 1;">${prod.product_name}</h3>
                    <span style="font-size: 16px; font-weight: 700; color: var(--caramel);">${formatPeso(prod.price)}</span>
                </div>
                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">${prod.description || prod.category}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge ${prod.availability ? 'badge-active' : 'badge-out'}">${prod.availability ? 'Available' : 'Unavailable'}</span>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 12px;" onclick="editProduct(${prod.product_id})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger" style="padding: 6px 10px; font-size: 12px;" onclick="deleteProduct(${prod.product_id})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
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

    renderProductsGrid(filtered);
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
        document.getElementById('product-image').value = product.image || '';
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
        image: document.getElementById('product-image').value.trim(),
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
