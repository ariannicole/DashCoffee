# DashCoffee - Coffee Shop Management System

A modern, professional, responsive, and fully functional Coffee Shop Management System built with HTML, CSS, Vanilla JavaScript, and browser-native IndexedDB for persistent storage.

## Features & Modules

1. **Authentication & Role-Based Access Control**:
   - Secure login supporting Administrator, Cashier, and Inventory Staff roles.
   - Demo credentials provided on the login screen.

2. **Dashboard**:
   - Real-time statistics: Today's sales, total orders, available products, low-stock alerts.
   - Recent transactions table and best-selling coffee items summary.

3. **Products & Menu Management**:
   - Create, edit, archive, and delete products (Coffee, Cold Drinks, Bakery).
   - Category filtering and real-time search.

4. **Order Processing (POS)**:
   - Interactive Point-of-Sale catalog.
   - Shopping cart management (quantities, subtotals, taxes).
   - Recipe-based inventory validation and automatic stock deduction upon order completion.

5. **Billing & Payments**:
   - Flexible payment methods (Cash, Card, Digital Wallet).
   - Cash tender validation and change calculation.
   - Printable thermal receipt generator containing shop details, order items, taxes, and transaction references.

6. **Inventory Management**:
   - Real-time tracking of ingredients and packaging (Coffee beans, milk, syrups, cups, lids).
   - Low-stock warnings and manual stock adjustment audit trail.

7. **Sales Reports & Analytics**:
   - Comprehensive revenue metrics, payment method summaries, product sales breakdown, and low-stock reports.
   - CSV export and print-friendly layout.

8. **Order History**:
   - Complete audit trail of all orders with status filtering, receipt viewing, and cancellation/stock-restoration workflows.

9. **Settings & Backup**:
   - Shop profile configuration and IndexedDB JSON export / database reset tools.

---

## Technical Stack

- **Frontend**: HTML5, CSS3 (Coffee-inspired color palette: Dark brown, cream, beige, caramel accents), Vanilla JavaScript (ES6+).
- **Storage**: Browser-native IndexedDB (Option A persistent storage with automated schema initialization and initial seeding).

---

## Project Folder Structure

```text
DashCoffee/
├── index.html
├── login.html
├── dashboard.html
├── products.html
├── orders.html
├── billing.html
├── inventory.html
├── reports.html
├── history.html
├── settings.html
├── css/
│   ├── style.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── database.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── products.js
│   ├── orders.js
│   ├── billing.js
│   ├── inventory.js
│   ├── reports.js
│   └── history.js
└── README.md
```

---

## How to Run the Application

1. Open the project folder (`DashCoffee`) in any modern web browser or local web server (such as Live Server in VS Code).
2. Open `login.html` (or `index.html`).
3. Log in using one of the demo accounts:
   - **Administrator**: `admin` / `admin123`
   - **Cashier**: `cashier` / `cashier123`
   - **Inventory Staff**: `inventory` / `inv123`
4. Explore the dashboard, manage products, create POS orders, process bills and print receipts, track inventory, and view sales reports!
