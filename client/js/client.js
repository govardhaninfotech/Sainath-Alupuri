
import { userURLphp } from "../apis/api.js";
import { getItemsData } from "../apis/master_api.js";
import { showNotification } from "./notification.js";

// client Data Storage (simulating JSON data)
let clientData = [];

// Function to load client data
function loadclientData() {
    return getItemsData(userURLphp).then(data => {
        clientData = data;
        console.log('client loaded:', clientData);
    });
}

// Pagination settings
let currentclientPage = 1;
let clientPerPage = 10;
let editingItemId = null;

// ============================================
// RENDER client TABLE WITH PAGINATION
// ============================================
export function renderclientTable() {
    // Load data if not already loaded
    if (clientData.length === 0) {
        return loadclientData().then(() => generateTableHTML());
    }
    return Promise.resolve(generateTableHTML());
}

// Generate table HTML without reloading data
function generateTableHTML() {
    const start = (currentclientPage - 1) * clientPerPage;
    const end = start + clientPerPage;
    const paginatedData = clientData.slice(start, end);

    let tableRows = '';
    paginatedData.forEach(item => {
        const isDisabled = item.status === 'disable';
        const isChecked = item.status === 'enable' ? 'checked' : '';

        tableRows += `
            <tr class="${isDisabled ? 'row-disabled' : ''}">
                <td>${item.name}</td>
                <td>${item.email}</td>
                <td>${item.phone}</td>
                <td>${item.ref}</td>
                <td>
                    <label class="toggle-switch">
                        <input type="checkbox" ${isChecked} onchange="toggleclienttatus('${item.id}')">
                        <span class="slider"></span>
                    </label>
                </td>
                <td>
                    <button class="btn-icon btn-edit" onclick="editclient('${item.id}')" title="Edit">
                        <i class="icon-edit">✎</i>
                    </button>
                </td>
                <td>
                    <button class="btn-icon btn-delete-icon" onclick="deleteclient('${item.id}')" title="Delete">
                        <i class="icon-delete">🗑</i>
                    </button>
                </td>
            </tr>
        `;
    });

    const totalPages = Math.ceil(clientData.length / clientPerPage);

    return `
        <div class="content-card">
            <div class="client-header">
                <h2>Master Client Management</h2>
                <button class="btn-add" onclick="openclientForm()">Add Client</button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Ref</th>
                            <th>Status</th>
                            <th>Edit</th>
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>

            <div class="pagination">
                <div class="pagination-info">
                    Showing ${start + 1} to ${Math.min(end, clientData.length)} of ${clientData.length} entries
                </div>
                <div class="pagination-controls">
                    <button onclick="changeclientPage('prev')" ${currentclientPage === 1 ? 'disabled' : ''}>← Previous</button>
                    <span class="page-number">Page ${currentclientPage} of ${totalPages}</span>
                    <button onclick="changeclientPage('next')" ${currentclientPage === totalPages ? 'disabled' : ''}>Next →</button>
                </div>
            </div>
        </div>

        <!-- client Form Modal -->
        <div id="clientFormModal" class="modal">
            <div class="modal-content modal-responsive">
                <div class="modal-header">
                    <h3 id="formTitle">Add New Client</h3>
                    <button class="close-btn" onclick="closeclientForm()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="clientForm" onsubmit="submitclientForm(event)" class="form-responsive">
                        <input type="hidden" id="itemId">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="itemName">Name <span class="required">*</span></label>
                                <input type="text" id="itemName" required placeholder="Enter full name">
                            </div>

                            <div class="form-group">
                                <label for="itemEmail">Email <span class="required">*</span></label>
                                <input type="email" id="itemEmail" required placeholder="Enter email address">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="phone">Phone <span class="required">*</span></label>
                                <input type="tel" id="phone" required placeholder="Enter phone number">
                            </div>

                            <div class="form-group">
                                <label for="ref">Reference <span class="required">*</span></label>
                                <input type="number" id="ref" step="0.01" required placeholder="Enter reference number">
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeclientForm()">Cancel</button>
                            <button type="submit" class="btn-submit">Save Client</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// PAGINATION FUNCTIONS
// ============================================
function changeclientPage(direction) {
    const totalPages = Math.ceil(clientData.length / clientPerPage);

    if (direction === 'next' && currentclientPage < totalPages) {
        currentclientPage++;
    } else if (direction === 'prev' && currentclientPage > 1) {
        currentclientPage--;
    }

    navigateTo('client');
}

function changeclientPerPage(value) {
    clientPerPage = parseInt(value);
    currentclientPage = 1;
    navigateTo('client');
}

// ============================================
// STATUS TOGGLE FUNCTION
// ============================================
function toggleclienttatus(id) {
    return showConfirm(
        "Are you sure you want to change this client's status?",
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        // Convert id to string for comparison since API returns string IDs
        const idStr = String(id);
        const item = clientData.find(i => String(i.id) === idStr);
        if (!item) {
            console.error('Item not found:', idStr);
            return;
        }

        // Toggle status
        const newStatus = item.status === 'enable' ? 'disable' : 'enable';

        // Update in API
        return updateItem(editingItemId, newStatus).then(result => {
            if (result) {
                item.status = newStatus;
                const statusText = newStatus === 'enable' ? 'enabled' : 'disabled';
                showNotification(`Item ${statusText} successfully!`, 'success');
                // Re-render just the table body to show the updated status
                const mainContent = document.getElementById('mainContent');
                mainContent.innerHTML = generateTableHTML();
            } else {
                showNotification('Error updating item status!', 'error');
            }
        });
    });
}

// ============================================
// FORM FUNCTIONS
// ============================================
function openclientForm() {
    editingItemId = null;
    document.getElementById('formTitle').textContent = 'Add New Item';
    document.getElementById('clientForm').reset();
    document.getElementById('itemId').value = '';
    const modal = document.getElementById('clientFormModal');
    modal.style.display = 'flex';
    // Add show class for animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeclientForm() {
    const modal = document.getElementById('clientFormModal');
    modal.classList.remove('show');
    // Wait for animation to complete before hiding
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    editingItemId = null;
}

function editclient(id) {
    // Convert id to string for comparison since API returns string IDs
    const idStr = String(id);
    const item = clientData.find(i => String(i.id) === idStr);
    console.log(item);

    if (!item) {
        console.error('Item not found:', idStr);
        return;
    }
    if (item.status === 'disable') {
        showNotification('Cannot update a disabled item. Please enable it first.', 'error');
        return;
    }

    editingItemId = item.id;
    document.getElementById('formTitle').textContent = 'Update Item';
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemEmail').value = item.email;
    document.getElementById('phone').value = item.phone;
    document.getElementById('ref').value = item.ref;
    const modal = document.getElementById('clientFormModal');
    modal.style.display = 'flex';
    // Add show class for animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

async function submitclientForm(event) {
    event.preventDefault();

    const formData = {
        name: document.getElementById('itemName').value,
        email: document.getElementById('itemEmail').value,
        phone: document.getElementById('phone').value,
        ref: parseFloat(document.getElementById('ref').value)
    };

    if (editingItemId) {
        return showConfirm(
            "Are you sure you want to update this client?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) return;

            // Update existing item
            return updateItem(editingItemId, formData).then(result => {
                if (result) {
                    const index = clientData.findIndex(i => String(i.id) === String(editingItemId));
                    if (index !== -1) {
                        clientData[index] = { ...clientData[index], ...formData };
                        showNotification('Item updated successfully!', 'success');
                    }
                } else {
                    showNotification('Error updating item!', 'error');
                }

                closeclientForm();
                // Re-render the table to show the updated data
                const mainContent = document.getElementById('mainContent');
                mainContent.innerHTML = generateTableHTML();
            });
        });
    } else {
        return showConfirm(
            "Are you sure you want to add this client?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) return;

            // Add new item with default status 'enable'
            const newItemData = { ...formData, status: 'enable' };
            return addItemToAPI(newItemData).then(result => {
                if (result) {
                    clientData.push(result);
                    showNotification('Item added successfully!', 'success');
                } else {
                    showNotification('Error adding item!', 'error');
                }

                closeclientForm();
                // Re-render the table to show the updated data
                const mainContent = document.getElementById('mainContent');
                mainContent.innerHTML = generateTableHTML();
            });
        });
    }
}

async function deleteclient(id) {
    return showConfirm(
        "Are you sure you want to delete this client?",
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        // Convert id to string for comparison
        const idStr = String(id);
        const item = clientData.find(i => String(i.id) === idStr);
        if (!item) {
            console.error('Item not found:', idStr);
            return;
        }
        if (item.status === 'disable') {
            showNotification('Cannot delete a disabled item. Please enable it first.', 'error');
            return;
        }
        return deleteItemFromAPI(item.id).then(result => {
            if (result) {
                clientData = clientData.filter(i => String(i.id) !== idStr);

                // Adjust page if needed
                const totalPages = Math.ceil(clientData.length / clientPerPage);
                if (currentclientPage > totalPages && totalPages > 0) {
                    currentclientPage = totalPages;
                }

                showNotification('Item deleted successfully!', 'success');
                // Re-render the table to show the updated data
                const mainContent = document.getElementById('mainContent');
                mainContent.innerHTML = generateTableHTML();
            } else {
                showNotification('Error deleting item!', 'error');
            }
        });
    });
}




// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.toggleclienttatus = toggleclienttatus;
window.deleteclient = deleteclient;
window.editclient = editclient;
window.openclientForm = openclientForm;
window.closeclientForm = closeclientForm;
window.submitclientForm = submitclientForm;
window.changeclientPage = changeclientPage;
window.changeclientPerPage = changeclientPerPage;
window.showNotification = showNotification;
window.generateTableHTML = generateTableHTML;

// Create local reference to navigateTo if it exists on window
function navigateTo(page) {
    if (window.navigateTo) {
        window.navigateTo(page);
    }
}