// ============================================
// STAFF PAGE - CRUD OPERATIONS WITH PAGINATION
// ============================================

import { staffURLphp } from "../apis/api.js";
import {
    getItemsData,
    updateItem,
    deleteItemFromAPI,
    addItemToAPI
} from "../apis/master_api.js";
import { showNotification, showConfirm } from "./notification.js";

// Staff Data Storage
let staffData = [];

// Server-side pagination meta
let currentstaffPage = 1;   // current page (matches API "page")
let staffPerPage = 10;      // matches API "per_page"
let staffTotal = 0;         // API "total"
let staffTotalPages = 1;    // API "total_pages"

let editingItemId = null;

// ============================================
// LOAD STAFF DATA FROM API (SERVER PAGINATION)
// ============================================
async function loadstaffData() {
    // Build URL with query params for server-side pagination
    const url = `${staffURLphp}?page=${currentstaffPage}&per_page=${staffPerPage}`;

    const data = await getItemsData(url);

    // API shape:
    // { page, per_page, total, total_pages, staff: [...] }
    staffData = data.staff || [];
    staffTotal = data.total ?? staffData.length;
    staffPerPage = data.per_page ?? staffPerPage;
    staffTotalPages = data.total_pages ?? Math.max(1, Math.ceil(staffTotal / staffPerPage));
    currentstaffPage = data.page ?? currentstaffPage;
}

// ============================================
// RENDER STAFF TABLE WITH PAGINATION
// ============================================
export async function renderstaffTable() {
    await loadstaffData();
    return generateTableHTML();
}

// Generate table HTML (no client-side slicing now)
// We already get just one page from API in staffData
function generateTableHTML() {
    const page = currentstaffPage;
    const perPage = staffPerPage;
    const total = staffTotal;
    const totalPages = staffTotalPages || 1;

    // Compute "Showing X to Y"
    let showingFrom = 0;
    let showingTo = 0;

    if (total > 0) {
        showingFrom = (page - 1) * perPage + 1;
        showingTo = Math.min(page * perPage, total);
    }

    let tableRows = "";
    staffData.forEach(staff => {
        tableRows += `
            <tr>
                <td>${staff.name}</td>
                <td>${staff.mobile}</td>
                <td>${staff.role}</td>
                <td>${staff.salary}</td>
                <td>${staff.address}</td>
               
                <td style="width: 150px;">
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <label class="toggle-switch">
                            <input type="checkbox"
                                   onchange="togglestafftatus('${staff.id}', '${staff.status}')"
                                   ${staff.status === 'active' ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <span class="status-text" style="margin-left: 10px; font-weight: 500; min-width: 60px;">
                        </span>
                    </div>
                </td>
                <td>
                    <button class="btn-icon btn-edit" onclick="editstaff('${staff.id}')" title="Edit">
                        <i class="icon-edit">✎</i>
                    </button>
                </td>
                <td>
                    <button class="btn-icon btn-delete-icon" onclick="deletestaff('${staff.id}')" title="Delete">
                        <i class="icon-delete">🗑</i>
                    </button>
                </td> 
            </tr>
        `;
    });

    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>Master Staff Management</h2>
                <button class="btn-add" onclick="openstaffForm()">Add Staff</button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Role</th>
                            <th>Salary</th>
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
                    Showing ${total === 0 ? 0 : showingFrom} to ${showingTo} of ${total} entries
                </div>
                <div class="pagination-controls">
                    <button onclick="changestaffPage('prev')" ${page === 1 ? "disabled" : ""}>Previous</button>
                    <span class="page-number">Page ${page} of ${totalPages}</span>
                    <button onclick="changestaffPage('next')" ${page === totalPages ? "disabled" : ""}>Next</button>
                </div>
            </div>
        </div>

        <!-- Staff Form Modal -->
        <div id="staffFormModal" class="modal">
            <div class="modal-content modal-responsive">
                <div class="modal-header">
                    <h3 id="formTitle">Add New Staff</h3>
                    <button class="close-btn" onclick="closestaffForm()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="staffForm" onsubmit="submitstaffForm(event)" class="form-responsive">
                        <input type="hidden" id="itemId">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="itemName">Staff Name <span class="required">*</span></label>
                                <input type="text" id="itemName" required placeholder="Enter staff name">
                            </div>

                            <div class="form-group">
                                <label for="itemPrice">Mobile <span class="required">*</span></label>
                                <input type="text" id="itemPrice" required placeholder="Enter mobile number">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="itemUnit">Role <span class="required">*</span></label>
                                <input type="text" id="itemUnit" required placeholder="e.g., Kitchen, Manager">
                            </div>

                            <div class="form-group">
                                <label for="itemImagePath">Salary <span class="required">*</span></label>
                                <input type="number" id="itemImagePath" step="0.01" min="0" value="0" required placeholder="Enter monthly salary">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="stafftatus">Status</label>
                                <div style="display: flex; align-items: center; padding: 10px 0;">
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="stafftatus" checked>
                                        <span class="slider"></span>
                                    </label>
                                    <span id="statusText" style="margin-left: 10px; font-weight: 500;">Active</span>
                                </div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closestaffForm()">Cancel</button>
                            <button type="submit" class="btn-submit">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// PAGINATION FUNCTIONS (SERVER-SIDE)
// ============================================
async function changestaffPage(direction) {
    if (direction === "next" && currentstaffPage < staffTotalPages) {
        currentstaffPage++;
    } else if (direction === "prev" && currentstaffPage > 1) {
        currentstaffPage--;
    } else {
        return; // nothing to do
    }

    await loadstaffData();
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
        mainContent.innerHTML = generateTableHTML();
    }
}

async function changestaffPerPage(value) {
    staffPerPage = parseInt(value, 10) || 10;
    currentstaffPage = 1; // reset to first page when per-page changes

    await loadstaffData();
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
        mainContent.innerHTML = generateTableHTML();
    }
}

// ============================================
// FORM FUNCTIONS
// ============================================
function openstaffForm() {
    editingItemId = null;
    document.getElementById("formTitle").textContent = "Add New Staff";
    document.getElementById("staffForm").reset();
    document.getElementById("itemId").value = "";

    const statusCheckbox = document.getElementById("stafftatus");
    statusCheckbox.checked = true;
    document.getElementById("statusText").textContent = "Active";

    document.getElementById("itemPrice").value = "";
    document.getElementById("itemImagePath").value = 0;

    const modal = document.getElementById("staffFormModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

function closestaffForm() {
    const modal = document.getElementById("staffFormModal");
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
    editingItemId = null;
}

// ============================================
// DELETE STAFF FUNCTION WITH CONFIRMATION
// ============================================
async function deletestaff(id) {
    const confirmed = await showConfirm(
        "Are you sure you want to delete this staff member?",
        "warning"
    );
    if (!confirmed) return;

    const result = await deleteItemFromAPI(staffURLphp, id);

    if (result) {
        showNotification("Staff deleted successfully!", "success");
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            // After delete, reload current page from server
            await loadstaffData();
            mainContent.innerHTML = generateTableHTML();
        }
    } else {
        showNotification("Error deleting staff!", "error");
    }
}

// ============================================
// EDIT STAFF FUNCTION
// ============================================
function editstaff(id) {
    editingItemId = id;

    const item = staffData.find(i => String(i.id) === String(id));
    if (!item) {
        console.error("Staff not found for edit:", id);
        showNotification("Staff not found!", "error");
        return;
    }

    document.getElementById("formTitle").textContent = "Update Staff";
    document.getElementById("itemId").value = item.id;
    document.getElementById("itemName").value = item.name;
    document.getElementById("itemDescription").value = item.address || "";
    document.getElementById("itemPrice").value = item.mobile || "";
    document.getElementById("itemUnit").value = item.role || "";
    document.getElementById("itemImagePath").value = item.salary || 0;

    const statusCheckbox = document.getElementById("stafftatus");
    const statusText = document.getElementById("statusText");
    statusCheckbox.checked = item.status === "active";
    statusText.textContent = item.status === "active" ? "Active" : "Inactive";

    statusCheckbox.onchange = function () {
        statusText.textContent = this.checked ? "Active" : "Inactive";
    };

    const modal = document.getElementById("staffFormModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

async function submitstaffForm(event) {
    event.preventDefault();
    const statusCheckbox = document.getElementById("stafftatus");
    const address = document.getElementById("itemDescription").value.trim();

    const formData = {
        name: document.getElementById("itemName").value,
        mobile: document.getElementById("itemPrice").value,
        role: document.getElementById("itemUnit").value,
        salary: parseFloat(document.getElementById("itemImagePath").value) || 0,
        address: address || "",
        status: statusCheckbox.checked ? "active" : "inactive"
    };

    const mainContent = document.getElementById("mainContent");

    if (editingItemId) {
        const confirmed = await showConfirm(
            "Are you sure you want to update this staff member?",
            "warning"
        );
        if (!confirmed) return;

        const result = await updateItem(staffURLphp, editingItemId, formData);
        if (result) {
            showNotification("Staff updated successfully!", "success");
        } else {
            showNotification("Error updating staff!", "error");
        }

        closestaffForm();
        if (mainContent) {
            await loadstaffData();
            mainContent.innerHTML = generateTableHTML();
        }
    } else {
        const confirmed = await showConfirm(
            "Are you sure you want to add this staff member?",
            "warning"
        );
        if (!confirmed) return;

        const result = await addItemToAPI(staffURLphp, formData);
        if (result) {
            showNotification("Staff added successfully!", "success");
            closestaffForm();

            if (mainContent) {
                await loadstaffData();
                mainContent.innerHTML = generateTableHTML();
            }
        } else {
            showNotification("Error adding staff!", "error");
        }
    }
}

// ============================================
// TOGGLE STAFF STATUS
// ============================================
async function togglestafftatus(id, currentStatus) {
    const confirmed = await showConfirm(
        `Are you sure you want to change this staff member's status to ${currentStatus === "active" ? "inactive" : "active"}?`,
        "warning"
    );
    if (!confirmed) return;

    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const result = await updateItem(staffURLphp, id, { status: newStatus });

    if (result) {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            await loadstaffData();
            mainContent.innerHTML = generateTableHTML();
            showNotification(`Staff status changed to ${newStatus}!`, "success");
        }
    } else {
        showNotification("Error updating staff status!", "error");
    }
}

// Close modal when clicking outside
window.addEventListener("click", function (event) {
    const modal = document.getElementById("staffFormModal");
    if (event.target === modal) {
        closestaffForm();
    }
});

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.deletestaff = deletestaff;
window.editstaff = editstaff;
window.togglestafftatus = togglestafftatus;
window.openstaffForm = openstaffForm;
window.closestaffForm = closestaffForm;
window.submitstaffForm = submitstaffForm;
window.changestaffPage = changestaffPage;
window.changestaffPerPage = changestaffPerPage;
window.showNotification = showNotification;
window.generateTableHTML = generateTableHTML;
window.showConfirm = showConfirm;
