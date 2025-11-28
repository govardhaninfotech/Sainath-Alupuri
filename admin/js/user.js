// ============================================
// USER PAGE - CRUD OPERATIONS WITH PAGINATION
// ============================================

import { userURLphp, shopURLphp } from "../apis/api.js";
import {
    getItemsData,
    updateItem,
    deleteItemFromAPI,
    addItemToAPI
} from "../apis/master_api.js";
import { showNotification, showConfirm } from "./notification.js";

// User Data Storage
let userData = [];

// Server-side pagination meta
let currentUserPage = 1;   // current page (matches API "page")
let userPerPage = 10;      // matches API "per_page"
let userTotal = 0;         // API "total"
let userTotalPages = 1;    // API "total_pages"

let editingUserId = null;

// Shop data (for dropdown + mapping shop_id → shop_code)
let shopData = [];
let shopDataLoaded = false;

// ============================================
// LOAD USER DATA FROM API (SERVER PAGINATION)
// ============================================
async function loadUserData() {
    // Build URL with query params for server-side pagination
    const url = `${userURLphp}?page=${currentUserPage}&per_page=${userPerPage}`;

    const data = await getItemsData(url);

    // Expected API shape:
    // { page, per_page, total, total_pages, users: [...] }
    userData = data.users || [];
    userTotal = data.total ?? userData.length;
    userPerPage = data.per_page ?? userPerPage;
    userTotalPages = data.total_pages ?? Math.max(1, Math.ceil(userTotal / userPerPage));
    currentUserPage = data.page ?? currentUserPage;
}

// ============================================
// LOAD SHOP DATA (FOR DROPDOWN + TABLE DISPLAY)
// ============================================
async function loadShopData() {
    if (shopDataLoaded && shopData.length > 0) return shopData;

    try {
        // Load many shops in one go (supports pagination style API)
        const url = `${shopURLphp}?page=1&per_page=1000`;
        const data = await getItemsData(url);

        // Expected shape:
        // { page, per_page, total, total_pages, shops: [...] }
        const allShops = data.shops || [];

        // Optionally show only active shops
        shopData = allShops.filter(shop => shop.status === "active");
        shopDataLoaded = true;
    } catch (error) {
        console.error("Error loading shop data:", error);
        showNotification("Error loading shops!", "error");
    }

    return shopData;
}

// Helper: get shop_code from shop_id
function getShopCodeById(shopId) {
    if (!shopId) return "";
    const shop = shopData.find(s => String(s.id) === String(shopId));
    return shop ? shop.shop_code : shopId; // fallback to original value
}

// Populate the Shop Code dropdown in the form
async function populateShopDropdown(selectedShopIdOrCode = "") {
    const select = document.getElementById("userShopId");
    if (!select) return;

    const shops = await loadShopData();

    // Clear and rebuild options
    select.innerHTML = `<option value="">Select shop code</option>`;

    shops.forEach(shop => {
        // value = shop.id (so backend still gets shop_id)
        // text = shop.shop_code (what user sees)
        const option = document.createElement("option");
        option.value = shop.id;
        option.textContent = shop.shop_code;
        select.appendChild(option);
    });

    if (selectedShopIdOrCode) {
        // Try to select by id first
        select.value = String(selectedShopIdOrCode);

        // If that fails, try matching by code
        if (!select.value) {
            const matchByCode = shops.find(
                s => String(s.shop_code) === String(selectedShopIdOrCode)
            );
            if (matchByCode) {
                select.value = String(matchByCode.id);
            }
        }
    }
}

// ============================================
// RENDER USER TABLE WITH PAGINATION
// ============================================
export async function renderuserTable() {
    await loadUserData();
    await loadShopData(); // ensure shopData is ready for displaying shop_code
    return generateTableHTML();
}

// Generate table HTML (no client-side slicing now)
// We already get just one page from API in userData
function generateTableHTML() {
    const page = currentUserPage;
    const perPage = userPerPage;
    const total = userTotal;
    const totalPages = userTotalPages || 1;

    // Compute "Showing X to Y"
    let showingFrom = 0;
    let showingTo = 0;

    if (total > 0) {
        showingFrom = (page - 1) * perPage + 1;
        showingTo = Math.min(page * perPage, total);
    }

    let tableRows = "";
    userData.forEach(user => {
        tableRows += `
            <tr>
                <td>${user.name}</td>
                <td>${user.mobile}</td>
                <td>${user.role}</td>
                <td>${getShopCodeById(user.shop_id)}</td>
               
                <td style="width: 150px;">
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <label class="toggle-switch">
                            <input type="checkbox"
                                   onchange="toggleUserStatus('${user.id}', '${user.status}')"
                                   ${user.status === 'active' ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <span class="status-text" style="margin-left: 10px; font-weight: 500; min-width: 60px;">
                        </span>
                    </div>
                </td>
                <td>
                    <button class="btn-icon btn-edit" onclick="editUser('${user.id}')" title="Edit">
                        <i class="icon-edit">✎</i>
                    </button>
                </td>
            </tr>
        `;
    });

    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>Master User Management</h2>
                <button class="btn-add" onclick="openUserForm()">Add User</button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Role</th>
                            <th>Shop Code</th>
                            <th>Status</th>
                            <th>Edit</th>
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
                    <button onclick="changeUserPage('prev')" ${page === 1 ? "disabled" : ""}>Previous</button>
                    <span class="page-number">Page ${page} of ${totalPages}</span>
                    <button onclick="changeUserPage('next')" ${page === totalPages ? "disabled" : ""}>Next</button>
                </div>
            </div>
        </div>

        <!-- User Form Modal -->
        <div id="userFormModal" class="modal">
            <div class="modal-content modal-responsive">
                <div class="modal-header">
                    <h3 id="userFormTitle">Add New User</h3>
                    <button class="close-btn" onclick="closeUserForm()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="userForm" onsubmit="submitUserForm(event)" class="form-responsive">
                        <input type="hidden" id="userId">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="userName">User Name <span class="required">*</span></label>
                                <input type="text" id="userName" required placeholder="Enter user name">
                            </div>

                            <div class="form-group">
                                <label for="userMobile">Mobile <span class="required">*</span></label>
                                <input type="text" id="userMobile" required placeholder="Enter mobile number">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="userRole">Role<span class="required">*</span></label>
                                <select id="userRole" required>
                                    <option value="">Select type</option>
                                    <option value="client">client</option>
                                    <option value="admin">admin</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="userShopId">Shop Code <span class="required">*</span></label>
                                <select id="userShopId" required>
                                    <option value="">Select shop code</option>
                                    <!-- Options will be loaded from shops API -->
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="userStatus">Status</label>
                                <div style="display: flex; align-items: center; padding: 10px 0;">
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="userStatus" checked>
                                        <span class="slider"></span>
                                    </label>
                                    <span id="userStatusText" style="margin-left: 10px; font-weight: 500;">Active</span>
                                </div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeUserForm()">Cancel</button>
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
async function changeUserPage(direction) {
    if (direction === "next" && currentUserPage < userTotalPages) {
        currentUserPage++;
    } else if (direction === "prev" && currentUserPage > 1) {
        currentUserPage--;
    } else {
        return; // nothing to do
    }

    await loadUserData();
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
        mainContent.innerHTML = generateTableHTML();
    }
}

async function changeUserPerPage(value) {
    userPerPage = parseInt(value, 10) || 10;
    currentUserPage = 1; // reset to first page when per-page changes

    await loadUserData();
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
        mainContent.innerHTML = generateTableHTML();
    }
}

// ============================================
// FORM FUNCTIONS
// ============================================
async function openUserForm() {
    editingUserId = null;
    document.getElementById("userFormTitle").textContent = "Add New User";
    document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";

    const statusCheckbox = document.getElementById("userStatus");
    statusCheckbox.checked = true;
    document.getElementById("userStatusText").textContent = "Active";

    // Load shop codes into dropdown
    await populateShopDropdown();

    const modal = document.getElementById("userFormModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

function closeUserForm() {
    const modal = document.getElementById("userFormModal");
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
    editingUserId = null;
}

// ============================================
// DELETE USER FUNCTION WITH CONFIRMATION
// ============================================
async function deleteUser(id) {
    const confirmed = await showConfirm(
        "Are you sure you want to delete this user?",
        "warning"
    );
    if (!confirmed) return;

    const result = await deleteItemFromAPI(userURLphp, id);

    if (result) {
        showNotification("User deleted successfully!", "success");
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            await loadUserData();
            mainContent.innerHTML = generateTableHTML();
        }
    } else {
        showNotification("Error deleting user!", "error");
    }
}

// ============================================
// EDIT USER FUNCTION
// ============================================
async function editUser(id) {
    editingUserId = id;

    const item = userData.find(i => String(i.id) === String(id));
    if (!item) {
        console.error("User not found for edit:", id);
        showNotification("User not found!", "error");
        return;
    }

    document.getElementById("userFormTitle").textContent = "Update User";
    document.getElementById("userId").value = item.id;
    document.getElementById("userName").value = item.name;
    document.getElementById("userMobile").value = item.mobile || "";
    document.getElementById("userRole").value = item.role || "";

    // Make sure shop dropdown is populated and select current user's shop
    await populateShopDropdown(item.shop_id || "");

    const statusCheckbox = document.getElementById("userStatus");
    const statusText = document.getElementById("userStatusText");
    statusCheckbox.checked = item.status === "active";
    statusText.textContent = item.status === "active" ? "Active" : "Inactive";

    statusCheckbox.onchange = function () {
        statusText.textContent = this.checked ? "Active" : "Inactive";
    };

    const modal = document.getElementById("userFormModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

async function submitUserForm(event) {
    event.preventDefault();
    const statusCheckbox = document.getElementById("userStatus");

    const formData = {
        name: document.getElementById("userName").value,
        mobile: document.getElementById("userMobile").value,
        role: document.getElementById("userRole").value,
        // Still send shop_id to backend, but selected via shop code dropdown
        shop_id: document.getElementById("userShopId").value,
        status: statusCheckbox.checked ? "active" : "inactive"
    };

    const mainContent = document.getElementById("mainContent");

    if (editingUserId) {
        const confirmed = await showConfirm(
            "Are you sure you want to update this user?",
            "warning"
        );
        if (!confirmed) return;

        const result = await updateItem(userURLphp, editingUserId, formData);
        if (result) {
            showNotification("User updated successfully!", "success");
        } else {
            showNotification("Error updating user!", "error");
        }

        closeUserForm();
        if (mainContent) {
            await loadUserData();
            mainContent.innerHTML = generateTableHTML();
        }

    } else {
        const confirmed = await showConfirm(
            "Are you sure you want to add this user?",
            "warning"
        );
        if (!confirmed) return;

        const result = await addItemToAPI(userURLphp, formData);
        if (result) {
            showNotification("User added successfully!", "success");
            closeUserForm();

            if (mainContent) {
                await loadUserData();
                mainContent.innerHTML = generateTableHTML();
            }
        } else {
            showNotification("Error adding user!", "error");
        }
    }
}

// ============================================
// TOGGLE USER STATUS
// ============================================
async function toggleUserStatus(id, currentStatus) {
    const confirmed = await showConfirm(
        `Are you sure you want to change this user's status to ${currentStatus === "active" ? "inactive" : "active"}?`,
        "warning"
    );
    if (!confirmed) return;

    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const result = await updateItem(userURLphp, id, { status: newStatus });

    if (result) {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            await loadUserData();
            mainContent.innerHTML = generateTableHTML();
            showNotification(`User status changed to ${newStatus}!`, "success");
        }
    } else {
        showNotification("Error updating user status!", "error");
    }
}

// Close modal when clicking outside
window.addEventListener("click", function (event) {
    const modal = document.getElementById("userFormModal");
    if (event.target === modal) {
        closeUserForm();
    }
});

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.deleteUser = deleteUser;
window.editUser = editUser;
window.toggleUserStatus = toggleUserStatus;
window.openUserForm = openUserForm;
window.closeUserForm = closeUserForm;
window.submitUserForm = submitUserForm;
window.changeUserPage = changeUserPage;
window.changeUserPerPage = changeUserPerPage;
window.showNotification = showNotification;
window.generateTableHTML = generateTableHTML;
window.showConfirm = showConfirm;
