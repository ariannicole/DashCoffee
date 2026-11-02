# DashCoffee - Coffee Shop Management System (Davao City, Philippines)

A modern, professional, responsive, and fully functional Coffee Shop Management System built with HTML5, CSS3, Vanilla JavaScript, and browser-native IndexedDB for persistent storage. Configured for **Davao City, Philippines** using **Philippine Peso (PHP, ₱)**.

## Features & Modules

1. **Authentication & Role-Based Access Control**:
   - Secure login supporting Administrator, Cashier, and Inventory Staff roles.
   - Demo credentials provided on the login screen.

2. **Dashboard**:
   - Real-time statistics in Philippine Peso (₱): Today's sales, total orders, available products, low-stock alerts.
   - Recent transactions table and best-selling coffee items summary.

3. **Products & Menu Management**:
   - Create, edit, archive, and delete products with pricing in PHP (₱).
   - Category filtering and real-time search.

4. **Order Processing / POS**:
   - Point-of-sale catalog, shopping cart, recipe-based inventory validation, and automatic stock deduction.

5. **Billing & Payments**:
   - Cash/card/wallet payment processing in PHP (₱), cash tender validation, change calculation, and printable thermal receipt generator with Davao City business details.

6. **Inventory Management**:
   - Stock tracking, low-stock warnings, manual adjustments, and ingredient costs in PHP (₱).

7. **Sales Reports & Analytics**:
   - Comprehensive revenue metrics in PHP (₱), payment method summaries, product sales breakdown, low-stock report, CSV export, and print layout.

8. **Order History**:
   - Complete audit trail of all orders with status filtering, receipt viewing, and cancellation/stock-restoration workflows.

9. **About Us Page**:
   - Davao City background story, mission, vision, core values, why choose us advantages, and coffee experience highlights.

10. **Contact Us Page & Admin Message Management**:
    - Davao City business information, contact cards, interactive contact form with Philippine mobile number validation (+63), Google Maps location pointing to Davao City, social media links, and admin message management.

11. **Settings & Business Profile**:
    - Editable Philippine business profile (Davao City, Philippines, +63 phone, PHP currency) and IndexedDB JSON export / database reset tools.

---

## Technical Stack & Currency

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Currency**: Philippine Peso (`PHP`, symbol `₱`, locale `en-PH`) formatted via `Intl.NumberFormat`.
- **Storage**: Browser-native IndexedDB (Option A persistent storage with automated schema initialization and initial seeding).

---

## How to Run the Application

1. Open the project folder (`DashCoffee`) in your browser or local web server (`http://localhost:8080` if running `server.ps1`).
2. Log in using one of the demo accounts:
   - **Administrator**: `admin` / `admin123`
   - **Cashier**: `cashier` / `cashier123`
   - **Inventory Staff**: `inventory` / `inv123`
3. Explore all sections configured for Davao City, Philippines with PHP currency!
