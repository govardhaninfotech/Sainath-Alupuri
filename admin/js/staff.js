// ============================================
// STAFF PAGE - CRUD OPERATIONS WITH PAGINATION + EXPENSE MANAGEMENT
// ============================================

import { staffURLphp } from "../apis/api.js";
import {
    getItemsData,
    updateItem,
    deleteItemFromAPI,
    addItemToAPI
} from "../apis/master_api.js";
import { showNotification, showConfirm } from "./notification.js";
import {
    validateIndianMobile,
    validateDate,
    validateSalary,
    validateRequiredField,
    setupEscKeyHandler
} from "./validation.js";

// Initialize ESC key handler on page load
setupEscKeyHandler();

// Staff Data Storage
let staffData = [];

// Server-side pagination meta
let currentstaffPage = 1;   // current page (matches API "page")
let staffPerPage = 10;      // matches API "per_page"
let staffTotal = 0;         // API "total"
let staffTotalPages = 1;    // API "total_pages"

let editingItemId = null;

// ============================================
// EXPENSE MANAGEMENT STATE
// ============================================
let selectedStaffForExpense = null;
let staffExpenses = [];
let expenseEditingId = null;

const currentUser = JSON.parse(localStorage.getItem("rememberedUser") || sessionStorage.getItem("rememberedUser") || "null");
const user_id = currentUser?.id || "";
if (!user_id) {
    sessionStorage.removeItem("rememberedUser");
    localStorage.removeItem("rememberedUser");
    window.location.replace("../index.html");
}
// ============================================
// LOAD STAFF DATA FROM API (SERVER PAGINATION)
// ============================================
function loadstaffData() {
    // Build URL with query params for server-side pagination
    const url = `${staffURLphp}?user_id=${user_id}&page=${currentstaffPage}&per_page=${staffPerPage}`;

    return getItemsData(url).then(data => {
        // API shape:
        // { page, per_page, total, total_pages, staff: [...] }
        staffData = data.staff || [];
        staffTotal = data.total ?? staffData.length;
        staffPerPage = data.per_page ?? staffPerPage;
        staffTotalPages = data.total_pages ?? Math.max(1, Math.ceil(staffTotal / staffPerPage));
        currentstaffPage = data.page ?? currentstaffPage;
    });
}

// ============================================
// RENDER STAFF TABLE WITH PAGINATION
// ============================================
export function renderstaffTable() {
    return loadstaffData().then(() => generateTableHTML());
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
    for (let index = 0; index < staffData.length; index++) {
        const serialNo = (page - 1) * perPage + index + 1;

        let staff = staffData[index];
        tableRows += `
    <tr>
        <td>${serialNo}</td>
                <td>
                    <!-- Link to inventory staff page for this staff -->
                    <a href="#" onclick="navigateToInventoryStaff('${staff.id}'); return false;" class="staff-name-link" style="cursor: pointer; color: #007bff; text-decoration: underline;">
                        ${staff.name}
                    </a>
                </td>

                <td>${staff.mobile}</td>
                <td>${staff.role}</td>
                <td>${staff.salary}</td>
                <td>${staff.address}</td>
               
               <!-- <td style="width: 150px;">
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <label class="toggle-switch">
                            <input type="checkbox" id='${staff.id}'
                                   onchange="togglestafftatus('${staff.id}', '${staff.status}')"
                                   ${staff.status === 'active' ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <span class="status-text" style="margin-left: 10px; font-weight: 500; min-width: 60px;">
                        </span>
                    </div>
                </td> -->
                <td>
                    <button class="btn-icon btn-edit" onclick="editstaff('${staff.id}')" title="Edit">
                        <i class="icon-edit">✎</i>
                    </button>
                </td>
                <!-- <td>
                    <button class="btn-icon btn-delete-icon" onclick="deletestaff('${staff.id}')" title="Delete">
                        <i class="icon-delete">🗑</i>
                    </button>
                </td> --> 
            </tr>
        `;
    }

    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>Staff Management</h2>
                <button class="btn-add" onclick="openstaffForm()">Add Staff</button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Role</th>
                            <th>Salary</th>
                            <th>Address</th>
                         <!--   <th>Status</th> -->
                            <th>Edit</th>
                           <!--  <th>Delete</th> -->
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
                                <input type="text" id="itemPrice" required placeholder="Enter mobile number" pattern="[0-9]{10}" title="Mobile number must be 10 digits">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="itemUnit">Role <span class="required">*</span></label>
                                <input type="text" id="itemUnit" required placeholder="e.g., Kitchen, Manager">
                            </div>

                            <div class="form-group">
                                <label for="itemImagePath">Salary <span class="required">*</span></label>
                                <input type="number" id="itemImagePath" step="0.01" min="0.01" value="0" required placeholder="Enter monthly salary">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="itemDescription">Address <span class="required">*</span></label>
                                <input type="text" id="itemDescription" required placeholder="Enter staff address">
                            </div>

                            <div class="form-group">
                                <label for="staffDate">Date <span class="required">*</span></label>
                                <input type="date" id="staffDate" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="staffReference">Reference <span class="optional">(Optional)</span></label>
                                <input type="text" id="staffReference" placeholder="Enter reference file or ID">
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
function changestaffPage(direction) {
    if (direction === "next" && currentstaffPage < staffTotalPages) {
        currentstaffPage++;
    } else if (direction === "prev" && currentstaffPage > 1) {
        currentstaffPage--;
    } else {
        return Promise.resolve(); // nothing to do
    }

    return loadstaffData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateTableHTML();
        }
    });
}

function changestaffPerPage(value) {
    staffPerPage = parseInt(value, 10) || 10;
    currentstaffPage = 1; // reset to first page when per-page changes

    return loadstaffData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateTableHTML();
        }
    });
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

    // Set current date as default and minimum (prevent past dates)
    const today = new Date().toISOString().split("T")[0];
    const staffDateInput = document.getElementById("staffDate");
    staffDateInput.value = today;
    staffDateInput.min = today;  // Prevent selecting past dates

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
function deletestaff(id) {
    return showConfirm(
        "Are you sure you want to delete this staff member?",
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        return deleteItemFromAPI(staffURLphp, id).then(result => {
            if (result) {
                showNotification("Staff deleted successfully!", "success");
                const mainContent = document.getElementById("mainContent");
                if (mainContent) {
                    // After delete, reload current page from server
                    return loadstaffData().then(() => {
                        mainContent.innerHTML = generateTableHTML();
                    });
                }
            } else {
                showNotification("Error deleting staff!", "error");
            }
        });
    });
}

// ============================================
// EDIT STAFF FUNCTION
// ============================================
let currentlyEditingStaffStatus = 'Active';
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
    document.getElementById("staffDate").value = item.start_date || "";
    document.getElementById("staffReference").value = item.reference || "";

    const statusCheckbox = document.getElementById("stafftatus");
    const statusText = document.getElementById("statusText");
    statusCheckbox.checked = item.status === "active";
    statusText.textContent = item.status === "active" ? "Active" : "Inactive";
    currentlyEditingStaffStatus = item.status;
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
    const name = document.getElementById("itemName").value.trim();
    const mobile = document.getElementById("itemPrice").value.trim();
    const role = document.getElementById("itemUnit").value.trim();
    const salary = document.getElementById("itemImagePath").value;
    const address = document.getElementById("itemDescription").value.trim();
    const date = document.getElementById("staffDate").value.trim();
    const reference = document.getElementById("staffReference").value.trim();

    // Validate Name
    let validation = validateRequiredField(name, "Staff name", 3);
    if (!validation.status) {
        showNotification(validation.message, "error");
        return;
    }

    // Validate Mobile
    validation = validateIndianMobile(mobile);
    if (!validation.status) {
        showNotification(validation.message, "error");
        return;
    }

    // Validate Role
    validation = validateRequiredField(role, "Role", 2);
    if (!validation.status) {
        showNotification(validation.message, "error");
        return;
    }

    // Validate Salary
    validation = validateSalary(salary);
    if (!validation.status) {
        showNotification(validation.message, "error");
        return;
    }

    // Validate Address
    validation = validateRequiredField(address, "Address");
    if (!validation.status) {
        showNotification(validation.message, "error");
        return;
    }

    // Validate Date
    validation = validateDate(date);
    if (!validation.status) {
        showNotification(validation.message, "error");
        return;
    }

    const formData = {
        user_id: user_id,
        name: name,
        mobile: mobile,
        role: role,
        salary: parseFloat(salary),
        address: address,
        start_date: date,
        ref: reference || "",
        status: statusCheckbox.checked ? "active" : "inactive"
    };

    const mainContent = document.getElementById("mainContent");
    console.log(formData);

    if (editingItemId) {
        return showConfirm(
            "Are you sure you want to update this staff member?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) {
                statusCheckbox.checked = currentlyEditingStaffStatus;
                return;
            }
            console.log(user_id);

            return updateItem(staffURLphp, editingItemId, formData, user_id).then(result => {
                console.log(result);

                if (result) {
                    showNotification("Staff updated successfully!", "success");
                } else {
                    showNotification(result.detail, "error");
                }

                closestaffForm();
                if (mainContent) {
                    return loadstaffData().then(() => {
                        mainContent.innerHTML = generateTableHTML();
                    });
                }
            });
        });
    } else {
        return showConfirm(
            "Are you sure you want to add this staff member?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) return;

            return addItemToAPI(staffURLphp, formData).then(result => {
                console.log(result);

                if (result.status === "ok") {
                    showNotification("Staff added successfully!", "success");
                    closestaffForm();

                    if (mainContent) {
                        return loadstaffData().then(() => {
                            mainContent.innerHTML = generateTableHTML();
                        });
                    }
                } else {
                    showNotification(result.detail, "error");
                }
            });
        });
    }
}

// ============================================
// TOGGLE STAFF STATUS
// ============================================
function togglestafftatus(id, currentStatus) {
    let staff_status_element = document.getElementById(id);
    return showConfirm(
        `Are you sure you want to change this staff member's status to ${currentStatus === "active" ? "inactive" : "active"}?`,
        "warning"
    ).then(confirmed => {

        if (!confirmed) {
            if (currentStatus === "active")
                staff_status_element.checked = true;
            else
                staff_status_element.checked = false;
            return;
        }

        const newStatus = currentStatus === "active" ? "inactive" : "active";
        return updateItem(staffURLphp, id, { status: newStatus }, user_id).then(result => {
            if (result) {
                const mainContent = document.getElementById("mainContent");
                if (mainContent) {
                    return loadstaffData().then(() => {
                        mainContent.innerHTML = generateTableHTML();
                        showNotification(`Staff status changed to ${newStatus}!`, "success");
                    });
                }
            } else {
                if (currentStatus === "active")
                    staff_status_element.checked = true;
                else
                    staff_status_element.checked = false;
                showNotification("Error updating staff status!", "error");
            }
        });
    });
}

// Close modal when clicking outside
window.addEventListener("click", function (event) {
    const modal = document.getElementById("staffFormModal");
    if (event.target === modal) {
        closestaffForm();
    }
});

// ============================================
// NAVIGATE TO INVENTORY STAFF PAGE WITH STAFF ID
// ============================================
function navigateToInventoryStaff(staffId) {

    // Store staff_id in localStorage for inventory page to read
    localStorage.setItem('selectedStaffId', staffId);

    // Navigate to inventory_staff page using SPA navigation
    if (window.navigateTo) {
        window.navigateTo('inventory_staff');
    } else {
        console.error('navigateTo function not available');
        showNotification('Navigation error. Please refresh the page.', 'error');
    }
}

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
window.navigateToInventoryStaff = navigateToInventoryStaff;
