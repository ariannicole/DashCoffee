# DashCoffee - Coffee Shop Management System

A modern, professional, responsive, and fully functional Coffee Shop Management System built with HTML5, CSS3, Vanilla JavaScript, and browser-native IndexedDB for persistent storage.

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
   - Point-of-sale catalog, shopping cart, recipe-based inventory validation, and automatic stock deduction.

5. **Billing & Payments**:
   - Cash/card/wallet payment processing, cash tender validation, change calculation, and printable thermal receipt generator.

6. **Inventory Management**:
   - Stock tracking, low-stock warnings, manual adjustments, and stock movement audit history.

7. **Sales Reports & Analytics**:
   - Comprehensive revenue metrics, payment method summaries, product sales breakdown, low-stock report, CSV export, and print layout.

8. **Order History**:
   - Complete audit trail of all orders with status filtering, receipt viewing, and cancellation/stock-restoration workflows.

9. **About Us Page**:
   - Coffee shop background story, mission, vision, core values, why choose us advantages, and coffee experience highlights.

10. **Contact Us Page & Admin Message Management**:
    - Complete contact information cards, interactive contact form with validation and database persistence (`contact_messages` store), Google Maps location, social media links, and administrative message management.

11. **Settings & Backup**:
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
├── about.html
├── contact.html
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
│   ├── history.js
│   └── contact.js
└── README.md
```

---

## How to Run the Application

1. Open the project folder (`DashCoffee`) in your browser or local web server (`http://localhost:8080` if running `server.ps1`).
2. Log in using one of the demo accounts:
   - **Administrator**: `admin` / `admin123`
   - **Cashier**: `cashier` / `cashier123`
   - **Inventory Staff**: `inventory` / `inv123`
3. Explore all 10 navigation sections including the new **About Us** and **Contact Us** pages.
