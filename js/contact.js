/**
 * contact.js - Contact Us Form & Admin Message Management Logic (Philippine format)
 */

document.addEventListener('DOMContentLoaded', async () => {
    await window.dbManager.init();
    await loadAdminMessages();

    const contactForm = document.getElementById('contact-us-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    const clearBtn = document.getElementById('clear-contact-form');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            contactForm.reset();
            hideNotification();
        });
    }

    const searchMessages = document.getElementById('search-messages');
    if (searchMessages) {
        searchMessages.addEventListener('input', filterMessages);
    }
});

let allContactMessages = [];

async function handleContactSubmit(e) {
    e.preventDefault();
    const fullName = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const subject = document.getElementById('contact-subject').value.trim();
    const message = document.getElementById('contact-msg').value.trim();

    // Validation
    if (!fullName || !email || !subject || !message) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address format.', 'error');
        return;
    }

    // Philippine phone number validation (+63 9XX XXX XXXX or 09XXXXXXXXX)
    if (phone) {
        const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
        const phoneRegex = /^(\+63|0)?9\d{9}$/;
        if (!phoneRegex.test(cleanedPhone)) {
            showNotification('Please enter a valid Philippine mobile number (e.g. +63 912 345 6789).', 'error');
            return;
        }
    }

    const now = new Date().toISOString();
    const messageData = {
        full_name: fullName,
        email_address: email,
        contact_number: phone || '+63 912 345 6789',
        subject: subject,
        message: message,
        message_status: 'Pending',
        created_at: now,
        updated_at: now
    };

    try {
        await window.dbManager.add('contact_messages', messageData);
        showNotification('Your message has been successfully sent and saved! Maraming salamat, we will get back to you soon.', 'success');
        document.getElementById('contact-us-form').reset();
        await loadAdminMessages();
    } catch (err) {
        console.error("Error saving contact message:", err);
        showNotification('Failed to submit message. Please try again.', 'error');
    }
}

function showNotification(text, type) {
    let alertBox = document.getElementById('contact-alert-box');
    if (!alertBox) return;

    alertBox.style.display = 'block';
    alertBox.className = `form-control ${type === 'success' ? 'badge-completed' : 'badge-out'}`;
    alertBox.style.padding = '12px';
    alertBox.style.marginBottom = '15px';
    alertBox.style.textAlign = 'center';
    alertBox.style.fontWeight = '600';
    alertBox.textContent = text;
}

function hideNotification() {
    const alertBox = document.getElementById('contact-alert-box');
    if (alertBox) alertBox.style.display = 'none';
}

async function loadAdminMessages() {
    const tbody = document.getElementById('admin-messages-tbody');
    if (!tbody) return;

    try {
        allContactMessages = await window.dbManager.getAll('contact_messages');
        renderAdminMessagesTable(allContactMessages);
    } catch (err) {
        console.error("Error loading contact messages:", err);
    }
}

function renderAdminMessagesTable(messages) {
    const tbody = document.getElementById('admin-messages-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const sorted = [...messages].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No messages found.</td></tr>`;
        return;
    }

    for (let m of sorted) {
        let badgeClass = 'badge-pending';
        if (m.message_status === 'Responded') badgeClass = 'badge-completed';
        else if (m.message_status === 'Closed') badgeClass = 'badge-out';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${m.message_id}</strong></td>
            <td>${m.full_name}<br><small style="color: var(--text-muted);">${m.email_address} (${m.contact_number})</small></td>
            <td>${m.subject}</td>
            <td>${m.message.substring(0, 45)}...</td>
            <td><span class="badge ${badgeClass}">${m.message_status}</span></td>
            <td>${new Date(m.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="viewMessageDetails(${m.message_id})"><i class="fa-solid fa-eye"></i></button>
                <button class="btn btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="updateMessageStatus(${m.message_id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="deleteMessage(${m.message_id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

function filterMessages() {
    const query = document.getElementById('search-messages').value.toLowerCase();
    const filtered = allContactMessages.filter(m => 
        m.full_name.toLowerCase().includes(query) || 
        m.email_address.toLowerCase().includes(query) ||
        m.subject.toLowerCase().includes(query)
    );
    renderAdminMessagesTable(filtered);
}

window.viewMessageDetails = async function(id) {
    const m = await window.dbManager.getById('contact_messages', id);
    if (!m) return;
    alert(`Message #${m.message_id}\nFrom: ${m.full_name} (${m.email_address}, ${m.contact_number})\nSubject: ${m.subject}\nStatus: ${m.message_status}\nDate: ${new Date(m.created_at).toLocaleString()}\n\nMessage:\n${m.message}`);
};

window.updateMessageStatus = async function(id) {
    if (!window.authManager.requireRole(['Administrator'])) return;
    const m = await window.dbManager.getById('contact_messages', id);
    if (!m) return;

    const newStatus = prompt(`Update status for message #${id} (Pending, Responded, Closed):`, m.message_status);
    if (!newStatus || !['Pending', 'Responded', 'Closed'].includes(newStatus)) return;

    m.message_status = newStatus;
    m.updated_at = new Date().toISOString();
    await window.dbManager.update('contact_messages', m);
    await loadAdminMessages();
};

window.deleteMessage = async function(id) {
    if (!window.authManager.requireRole(['Administrator'])) return;
    if (confirm(`Are you sure you want to delete message #${id}?`)) {
        await window.dbManager.delete('contact_messages', id);
        await loadAdminMessages();
    }
};
