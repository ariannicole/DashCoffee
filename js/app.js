/**
 * app.js - Common Application Logic, Currency Formatting & Navigation Component
 */

// Philippine Peso Formatter
const pesoFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function formatPeso(amount) {
    const num = Number(amount) || 0;
    return pesoFormatter.format(num);
}

// Default Business Profile (Davao City, Philippines)
const defaultBusinessProfile = {
    business_name: 'DashCoffee Specialty Shop',
    address: 'Poblacion District, Davao City',
    barangay: 'Barangay 4-A',
    city: 'Davao City',
    province: 'Davao del Sur',
    country: 'Philippines',
    postal_code: '8000',
    contact_number: '+63 912 345 6789',
    business_email: 'support@dashcoffee.ph',
    currency_code: 'PHP',
    currency_symbol: '₱',
    locale: 'en-PH'
};

function getBusinessProfile() {
    const saved = localStorage.getItem('coffee_business_profile');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) { return defaultBusinessProfile; }
    }
    localStorage.setItem('coffee_business_profile', JSON.stringify(defaultBusinessProfile));
    return defaultBusinessProfile;
}

document.addEventListener('DOMContentLoaded', () => {
    // Highlight active menu item
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const menuLinks = document.querySelectorAll('.sidebar-menu a');
    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.parentElement.classList.add('active');
        } else {
            link.parentElement.classList.remove('active');
        }
    });
});
