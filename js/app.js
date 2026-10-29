/**
 * app.js - Common Application Logic & Navigation Component
 */

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
