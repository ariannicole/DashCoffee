/**
 * auth.js - User Authentication & Role-Based Access Control
 */

class AuthManager {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('coffee_current_user')) || null;
    }

    async login(username, password) {
        await window.dbManager.init();
        const users = await window.dbManager.getAll('users');
        const user = users.find(u => u.username === username && u.password_hash === password && u.account_status === 'Active');
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('coffee_current_user', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Invalid username, password, or account inactive.' };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('coffee_current_user');
        window.location.href = 'login.html';
    }

    checkAuth() {
        const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('/');
        if (!this.currentUser && !isLoginPage) {
            // Check if we are at root index.html or login
            if (!window.location.pathname.endsWith('login.html')) {
                window.location.href = 'login.html';
            }
        } else if (this.currentUser && window.location.pathname.endsWith('login.html')) {
            window.location.href = 'dashboard.html';
        }
    }

    requireRole(allowedRoles) {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return false;
        }
        if (!allowedRoles.includes(this.currentUser.role)) {
            alert('Access Denied: You do not have permission to access this page or perform this action.');
            return false;
        }
        return true;
    }
}

window.authManager = new AuthManager();

// Run auth check on page load
document.addEventListener('DOMContentLoaded', () => {
    window.authManager.checkAuth();
    
    // Update user info display if elements exist
    const userNameEl = document.getElementById('current-user-name');
    const userRoleEl = document.getElementById('current-user-role');
    if (userNameEl && window.authManager.currentUser) {
        userNameEl.textContent = window.authManager.currentUser.full_name;
    }
    if (userRoleEl && window.authManager.currentUser) {
        userRoleEl.textContent = window.authManager.currentUser.role;
    }

    // Logout button handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to log out?')) {
                window.authManager.logout();
            }
        });
    }
});
