/**
 * database.js - IndexedDB Persistent Storage & Seed Data for Coffee Shop Management System
 */

const DB_NAME = 'CoffeeShopDB';
const DB_VERSION = 1;

class DatabaseManager {
    constructor() {
        this.db = null;
    }

    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Database error: ", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 1. Products
                if (!db.objectStoreNames.contains('products')) {
                    const store = db.createObjectStore('products', { keyPath: 'product_id', autoIncrement: true });
                    store.createIndex('category', 'category', { unique: false });
                    store.createIndex('product_name', 'product_name', { unique: false });
                }

                // 2. Orders
                if (!db.objectStoreNames.contains('orders')) {
                    const store = db.createObjectStore('orders', { keyPath: 'order_id', autoIncrement: true });
                    store.createIndex('order_number', 'order_number', { unique: true });
                    store.createIndex('order_status', 'order_status', { unique: false });
                    store.createIndex('created_at', 'created_at', { unique: false });
                }

                // 3. Order Items
                if (!db.objectStoreNames.contains('order_items')) {
                    const store = db.createObjectStore('order_items', { keyPath: 'order_item_id', autoIncrement: true });
                    store.createIndex('order_id', 'order_id', { unique: false });
                    store.createIndex('product_id', 'product_id', { unique: false });
                }

                // 4. Payments
                if (!db.objectStoreNames.contains('payments')) {
                    const store = db.createObjectStore('payments', { keyPath: 'payment_id', autoIncrement: true });
                    store.createIndex('order_id', 'order_id', { unique: false });
                    store.createIndex('payment_date', 'payment_date', { unique: false });
                }

                // 5. Inventory
                if (!db.objectStoreNames.contains('inventory')) {
                    const store = db.createObjectStore('inventory', { keyPath: 'inventory_id', autoIncrement: true });
                    store.createIndex('ingredient_name', 'ingredient_name', { unique: false });
                    store.createIndex('category', 'category', { unique: false });
                }

                // 6. Product Recipes
                if (!db.objectStoreNames.contains('product_recipes')) {
                    const store = db.createObjectStore('product_recipes', { keyPath: 'recipe_id', autoIncrement: true });
                    store.createIndex('product_id', 'product_id', { unique: false });
                    store.createIndex('inventory_id', 'inventory_id', { unique: false });
                }

                // 7. Inventory Transactions
                if (!db.objectStoreNames.contains('inventory_transactions')) {
                    const store = db.createObjectStore('inventory_transactions', { keyPath: 'transaction_id', autoIncrement: true });
                    store.createIndex('inventory_id', 'inventory_id', { unique: false });
                    store.createIndex('created_at', 'created_at', { unique: false });
                }

                // 8. Users
                if (!db.objectStoreNames.contains('users')) {
                    const store = db.createObjectStore('users', { keyPath: 'user_id', autoIncrement: true });
                    store.createIndex('username', 'username', { unique: true });
                    store.createIndex('role', 'role', { unique: false });
                }

                // 9. Suppliers
                if (!db.objectStoreNames.contains('suppliers')) {
                    const store = db.createObjectStore('suppliers', { keyPath: 'supplier_id', autoIncrement: true });
                    store.createIndex('supplier_name', 'supplier_name', { unique: false });
                }

                // 10. Sales Records
                if (!db.objectStoreNames.contains('sales_records')) {
                    const store = db.createObjectStore('sales_records', { keyPath: 'sales_id', autoIncrement: true });
                    store.createIndex('order_id', 'order_id', { unique: false });
                    store.createIndex('transaction_date', 'transaction_date', { unique: false });
                }
            };
        });
    }

    async seedInitialData() {
        await this.init();

        // Check if users exist; if not, seed sample data
        const users = await this.getAll('users');
        if (users.length === 0) {
            console.log("Seeding initial database records...");

            // Seed Users
            await this.add('users', { full_name: 'System Administrator', username: 'admin', password_hash: 'admin123', role: 'Administrator', account_status: 'Active' });
            await this.add('users', { full_name: 'Jane Cashier', username: 'cashier', password_hash: 'cashier123', role: 'Cashier', account_status: 'Active' });
            await this.add('users', { full_name: 'Bob Inventory', username: 'inventory', password_hash: 'inv123', role: 'Inventory Staff', account_status: 'Active' });

            // Seed Suppliers
            const sup1 = await this.add('suppliers', { supplier_name: 'BeanCo Coffee Importers', contact_number: '+1-555-0192', email: 'orders@beanco.com', address: '123 Roast Lane, Seattle, WA' });
            const sup2 = await this.add('suppliers', { supplier_name: 'DairyFresh Farms', contact_number: '+1-555-0144', email: 'sales@dairyfresh.com', address: '456 Meadow Rd, Portland, OR' });
            const sup3 = await this.add('suppliers', { supplier_name: 'SweetTreats Bakery Supplies', contact_number: '+1-555-0188', email: 'supplies@sweettreats.com', address: '789 Sugar Ave, Chicago, IL' });
            const sup4 = await this.add('suppliers', { supplier_name: 'EcoPack Containers', contact_number: '+1-555-0122', email: 'info@ecopack.com', address: '321 Box St, Austin, TX' });

            // Seed Inventory
            const inv1 = await this.add('inventory', { ingredient_name: 'Coffee Beans (Arabica)', category: 'Coffee', unit: 'g', quantity_in_stock: 5000, minimum_stock: 1000, cost_per_unit: 0.02, supplier_id: sup1, updated_at: new Date().toISOString() });
            const inv2 = await this.add('inventory', { ingredient_name: 'Fresh Whole Milk', category: 'Dairy', unit: 'ml', quantity_in_stock: 10000, minimum_stock: 2000, cost_per_unit: 0.005, supplier_id: sup2, updated_at: new Date().toISOString() });
            const inv3 = await this.add('inventory', { ingredient_name: 'Oat Milk', category: 'Dairy', unit: 'ml', quantity_in_stock: 5000, minimum_stock: 1000, cost_per_unit: 0.008, supplier_id: sup2, updated_at: new Date().toISOString() });
            const inv4 = await this.add('inventory', { ingredient_name: 'Granulated Sugar', category: 'Sweetener', unit: 'g', quantity_in_stock: 3000, minimum_stock: 500, cost_per_unit: 0.002, supplier_id: sup3, updated_at: new Date().toISOString() });
            const inv5 = await this.add('inventory', { ingredient_name: 'Chocolate Syrup', category: 'Flavoring', unit: 'ml', quantity_in_stock: 2000, minimum_stock: 400, cost_per_unit: 0.015, supplier_id: sup3, updated_at: new Date().toISOString() });
            const inv6 = await this.add('inventory', { ingredient_name: 'Caramel Syrup', category: 'Flavoring', unit: 'ml', quantity_in_stock: 2000, minimum_stock: 400, cost_per_unit: 0.015, supplier_id: sup3, updated_at: new Date().toISOString() });
            const inv7 = await this.add('inventory', { ingredient_name: 'Paper Cups (12oz)', category: 'Packaging', unit: 'pcs', quantity_in_stock: 800, minimum_stock: 200, cost_per_unit: 0.05, supplier_id: sup4, updated_at: new Date().toISOString() });
            const inv8 = await this.add('inventory', { ingredient_name: 'Cup Lids', category: 'Packaging', unit: 'pcs', quantity_in_stock: 850, minimum_stock: 200, cost_per_unit: 0.02, supplier_id: sup4, updated_at: new Date().toISOString() });

            // Seed Products
            const p1 = await this.add('products', { product_name: 'Espresso', category: 'Coffee', description: 'Rich and bold single shot of pure espresso', price: 3.50, image: 'assets/images/espresso.jpg', availability: true, created_at: new Date().toISOString() });
            const p2 = await this.add('products', { product_name: 'Americano', category: 'Coffee', description: 'Espresso shots topped with hot water', price: 4.00, image: 'assets/images/americano.jpg', availability: true, created_at: new Date().toISOString() });
            const p3 = await this.add('products', { product_name: 'Cappuccino', category: 'Coffee', description: 'Espresso with steamed milk and thick foam', price: 4.75, image: 'assets/images/cappuccino.jpg', availability: true, created_at: new Date().toISOString() });
            const p4 = await this.add('products', { product_name: 'Cafe Latte', category: 'Coffee', description: 'Smooth espresso with plenty of steamed milk', price: 4.95, image: 'assets/images/latte.jpg', availability: true, created_at: new Date().toISOString() });
            const p5 = await this.add('products', { product_name: 'Caramel Macchiato', category: 'Coffee', description: 'Fresh milk, vanilla, espresso and caramel drizzle', price: 5.50, image: 'assets/images/macchiato.jpg', availability: true, created_at: new Date().toISOString() });
            const p6 = await this.add('products', { product_name: 'Mocha', category: 'Coffee', description: 'Espresso with rich chocolate syrup and steamed milk', price: 5.25, image: 'assets/images/mocha.jpg', availability: true, created_at: new Date().toISOString() });
            const p7 = await this.add('products', { product_name: 'Iced Coffee', category: 'Cold Drinks', description: 'Chilled brewed coffee over crystal ice', price: 4.25, image: 'assets/images/iced_coffee.jpg', availability: true, created_at: new Date().toISOString() });
            const p8 = await this.add('products', { product_name: 'Chocolate Cake', category: 'Bakery', description: 'Decadent moist dark chocolate layer cake slice', price: 6.00, image: 'assets/images/cake.jpg', availability: true, created_at: new Date().toISOString() });
            const p9 = await this.add('products', { product_name: 'Croissant', category: 'Bakery', description: 'Buttery flaky French pastry freshly baked', price: 3.75, image: 'assets/images/croissant.jpg', availability: true, created_at: new Date().toISOString() });

            // Seed Product Recipes
            // Espresso: 18g coffee beans, 1 cup, 1 lid
            await this.add('product_recipes', { product_id: p1, inventory_id: inv1, quantity_required: 18 });
            await this.add('product_recipes', { product_id: p1, inventory_id: inv7, quantity_required: 1 });
            await this.add('product_recipes', { product_id: p1, inventory_id: inv8, quantity_required: 1 });

            // Cappuccino: 18g coffee beans, 150ml milk, 1 cup, 1 lid
            await this.add('product_recipes', { product_id: p3, inventory_id: inv1, quantity_required: 18 });
            await this.add('product_recipes', { product_id: p3, inventory_id: inv2, quantity_required: 150 });
            await this.add('product_recipes', { product_id: p3, inventory_id: inv7, quantity_required: 1 });
            await this.add('product_recipes', { product_id: p3, inventory_id: inv8, quantity_required: 1 });

            // Cafe Latte: 18g coffee beans, 200ml milk, 1 cup, 1 lid
            await this.add('product_recipes', { product_id: p4, inventory_id: inv1, quantity_required: 18 });
            await this.add('product_recipes', { product_id: p4, inventory_id: inv2, quantity_required: 200 });
            await this.add('product_recipes', { product_id: p4, inventory_id: inv7, quantity_required: 1 });
            await this.add('product_recipes', { product_id: p4, inventory_id: inv8, quantity_required: 1 });

            // Caramel Macchiato: 18g coffee beans, 180ml milk, 30ml caramel, 1 cup, 1 lid
            await this.add('product_recipes', { product_id: p5, inventory_id: inv1, quantity_required: 18 });
            await this.add('product_recipes', { product_id: p5, inventory_id: inv2, quantity_required: 180 });
            await this.add('product_recipes', { product_id: p5, inventory_id: inv6, quantity_required: 30 });
            await this.add('product_recipes', { product_id: p5, inventory_id: inv7, quantity_required: 1 });
            await this.add('product_recipes', { product_id: p5, inventory_id: inv8, quantity_required: 1 });

            // Seed Sample Order & Payment
            const sampleOrderNum = 'ORD-1001';
            const sampleOrderId = await this.add('orders', {
                order_number: sampleOrderNum,
                customer_name: 'Alice Smith',
                order_type: 'Dine-In',
                order_status: 'Completed',
                subtotal: 9.50,
                discount: 0.00,
                tax: 0.95,
                total_amount: 10.45,
                created_at: new Date(Date.now() - 3600000 * 2).toISOString()
            });

            await this.add('order_items', {
                order_id: sampleOrderId,
                product_id: p3,
                quantity: 2,
                unit_price: 4.75,
                customization: 'Whole Milk, Regular Size',
                line_total: 9.50
            });

            const samplePayId = await this.add('payments', {
                order_id: sampleOrderId,
                payment_method: 'Cash',
                amount_paid: 15.00,
                change_due: 4.55,
                payment_status: 'Paid',
                payment_date: new Date(Date.now() - 3600000 * 2).toISOString(),
                transaction_reference: 'TXN-998821'
            });

            await this.add('sales_records', {
                order_id: sampleOrderId,
                payment_id: samplePayId,
                total_sales: 10.45,
                transaction_date: new Date(Date.now() - 3600000 * 2).toISOString()
            });

            console.log("Initial database seeding completed successfully.");
        }
    }

    // Generic CRUD operations
    async getAll(storeName) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getById(storeName, id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(Number(id) || id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async add(storeName, data) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(Number(id) || id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

window.dbManager = new DatabaseManager();
