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
import {
    validateRequiredField,
    validateIndianMobile,
    validatePassword,
    validateUniqueMobile,
    validateForm,
    setupEscKeyHandler
} from "./validation.js";

// User Data Storage
let userData = [];

// Server-side pagination meta
let currentUserPage = 1;   // current page (matches API "page")
let userPerPage = 10;      // matches API "per_page"
let userTotal = 0;         // API "total"
let userTotalPages = 1;    // API "total_pages"

let editingUserId = null;

// Shop data (for dropdown + mapping shop_id → shop_name)
let shopData = [];
let shopDataLoaded = false;

// ============================================
// LOAD USER DATA FROM API (SERVER PAGINATION)
// ============================================
function loadExpanceData() {
    // Build URL with query params for server-side pagination
    const url = `${userURLphp}?page=${currentUserPage}&per_page=${userPerPage}`;

    return getItemsData(url).then(data => {

        // Expected API shape:
        // { page, per_page, total, total_pages, users: [...] }
        userData = data.users || [];
        userTotal = data.total ?? userData.length;
        userPerPage = data.per_page ?? userPerPage;
        userTotalPages = data.total_pages ?? Math.max(1, Math.ceil(userTotal / userPerPage));
        currentUserPage = data.page ?? currentUserPage;
    });
}

// ============================================
// LOAD SHOP DATA (FOR DROPDOWN + TABLE DISPLAY)
// ============================================
// LOAD SHOP DATA (FOR DROPDOWN + TABLE DISPLAY)
function loadShopData() {
    if (shopDataLoaded && shopData.length > 0) return Promise.resolve(shopData);

    const url = `${shopURLphp}?page=1&per_page=1000`;
    return getItemsData(url).then(data => {
        const allShops = data.shops || [];

        // ✅ KEEP ALL SHOPS (do NOT filter here)
        shopData = allShops;
        shopDataLoaded = true;

        return shopData;
    }).catch(error => {
        console.error("Error loading shop data:", error);
        showNotification("Error loading shops!", "error");
        return [];
    });
}


// Helper: get shop_name from shop_id
function getShopCodeById(shopId) {
    if (!shopId) return "";
    const shop = shopData.find(s => String(s.id) === String(shopId));
    console.log("shop male 6", shopData);

    if (shop) return shop.shop_name || "";
    return "";
}


// Populate the Shop Code dropdown in the form
function populateShopDropdown(selectedShopIdOrCode = "") {
    const select = document.getElementById("userShopId");
    if (!select) return Promise.resolve();

    return loadShopData().then(shops => {

        // ✅ Filter ONLY for dropdown
        const availableShops = shops.filter(
            shop => shop.status === "active" && shop.user_id === "null"
        );

        select.innerHTML = `<option value="">Select shop code</option>`;

        availableShops.forEach(shop => {
            const option = document.createElement("option");
            option.value = shop.id;
            option.textContent = shop.shop_name;
            select.appendChild(option);
        });

        if (selectedShopIdOrCode) {
            select.value = String(selectedShopIdOrCode);
        }
    });
}

// ============================================
// RENDER USER TABLE WITH PAGINATION
// ============================================
export function renderInventoryExpancesPage() {
    return loadExpanceData().then(() => loadShopData()).then(() => generateTableHTML());
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
                <td>${getShopCodeById(user.shop_id)}</td>
               
                <td style="width: 150px;">
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <label class="toggle-switch">
                            <input type="checkbox"
                                   onchange="toggleExpanceStatus('${user.id}', '${user.status}')"
                                   ${user.status === 'active' ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <span class="status-text" style="margin-left: 10px; font-weight: 500; min-width: 60px;">
                        </span>
                    </div>
                </td>
                <td>
                    <button class="btn-icon btn-edit" onclick="editExpance('${user.id}')" title="Edit">
                        <i class="icon-edit">✎</i>
                    </button>
                </td>
            </tr>
        `;
    });

    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>User Management</h2>
                <button class="btn-add" onclick="openExpanceForm()">Add User</button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Mobile</th>
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
                    <button onclick="changeExpancePage('prev')" ${page === 1 ? "disabled" : ""}>Previous</button>
                    <span class="page-number">Page ${page} of ${totalPages}</span>
                    <button onclick="changeExpancePage('next')" ${page === totalPages ? "disabled" : ""}>Next</button>
                </div>
            </div>
        </div>

        <!-- User Form Modal -->
        <div id="userFormModal" class="modal">
            <div class="modal-content modal-responsive">
                <div class="modal-header">
                    <h3 id="userFormTitle">Add New User</h3>
                    <button class="close-btn" onclick="closeExpanceForm()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="userForm" onsubmit="submitExpanceForm(event)" class="form-responsive">
                        <input type="hidden" id="userId">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="userName">User Name <span class="required">*</span></label>
                                <input type="text" id="userName" required placeholder="Enter user name">
                            </div>

                            <div class="form-group">
                                <label for="userMobile">Mobile <span class="required">*</span></label>
                                <input type="text" id="userMobile" required placeholder="Enter mobile number" pattern="[0-9]{10}" title="Mobile number must be 10 digits">
                            </div>
                        </div>

                        <div class="form-row">
                          <div class="form-group" id="passwordGroup">
                            <label for="userPassword">Password <span class="required">*</span></label>
                            <input type="password" id="userPassword" required placeholder="Enter password (min 6 characters)">
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

                            <div class="form-group">
                                <label for="userIsFamilyMember">Is Family Member</label>
                                <div style="display: flex; align-items: center; padding: 10px 0;">
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="userIsFamilyMember">
                                        <span class="slider"></span>
                                    </label>
                                    <span id="userIsFamilyMemberText" style="margin-left: 10px; font-weight: 500;">No</span>
                                </div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeExpanceForm()">Cancel</button>
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
function changeExpancePage(direction) {
    if (direction === "next" && currentUserPage < userTotalPages) {
        currentUserPage++;
    } else if (direction === "prev" && currentUserPage > 1) {
        currentUserPage--;
    } else {
        return Promise.resolve(); // nothing to do
    }

    return loadExpanceData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateTableHTML();
        }
    });
}

function changeExpancePerPage(value) {
    userPerPage = parseInt(value, 10) || 10;
    currentUserPage = 1; // reset to first page when per-page changes

    return loadExpanceData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateTableHTML();
        }
    });
}

// ============================================
// FORM FUNCTIONS
// ============================================
function openExpanceForm() {
    if (shopData.length === 0) {
        showNotification("No shops found!", "error");
        return;
    }
    editingUserId = null;
    document.getElementById("userFormTitle").textContent = "Add New User";
    document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";

    const statusCheckbox = document.getElementById("userStatus");
    statusCheckbox.checked = true;
    document.getElementById("userStatusText").textContent = "Active";

    // Set is_family_member checkbox to false (unchecked) by default
    const isFamilyMemberCheckbox = document.getElementById("userIsFamilyMember");
    isFamilyMemberCheckbox.checked = false;
    document.getElementById("userIsFamilyMemberText").textContent = "No";

    // Add change handler for is_family_member checkbox
    isFamilyMemberCheckbox.onchange = function () {
        document.getElementById("userIsFamilyMemberText").textContent = this.checked ? "Yes" : "No";
    };

    // Load shop codes into dropdown
    return populateShopDropdown().then(() => {
        const modal = document.getElementById("userFormModal");
        modal.style.display = "flex";
        setTimeout(() => {
            modal.classList.add("show");
        }, 10);
    });
}

function closeExpanceForm() {
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
function deleteExpance(id) {
    return showConfirm(
        "Are you sure you want to delete this user?",
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        return deleteItemFromAPI(userURLphp, id).then(result => {
            if (result) {
                showNotification("User deleted successfully!", "success");
                const mainContent = document.getElementById("mainContent");
                if (mainContent) {
                    return loadExpanceData().then(() => {
                        mainContent.innerHTML = generateTableHTML();
                    });
                }
            } else {
                showNotification("Error deleting user!", "error");
            }
        });
    });
}

// ============================================
// EDIT USER FUNCTION
// ============================================
function editExpance(id) {
    // Hide password field on edit
    const passwordGroup = document.getElementById("passwordGroup");
    const passwordInput = document.getElementById("userPassword");

    passwordGroup.style.display = "none";
    passwordInput.required = false;
    passwordInput.value = "";

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
    document.getElementById("userPassword").value = item.password || "";

    // Make sure shop dropdown is populated and select current user's shop
    return populateShopDropdown(item.shop_id || "").then(() => {
        const statusCheckbox = document.getElementById("userStatus");
        const statusText = document.getElementById("userStatusText");
        statusCheckbox.checked = item.status === "active";
        statusText.textContent = item.status === "active" ? "Active" : "Inactive";

        statusCheckbox.onchange = function () {
            statusText.textContent = this.checked ? "Active" : "Inactive";
        };

        // Set is_family_member checkbox based on API value
        const isFamilyMemberCheckbox = document.getElementById("userIsFamilyMember");
        const isFamilyMemberText = document.getElementById("userIsFamilyMemberText");
        // Handle both string "True"/"False" and boolean true/false from API
        const isFamilyMemberValue = item.is_family_member;
        const isFamilyMember = isFamilyMemberValue === "True" || isFamilyMemberValue === true || isFamilyMemberValue === "true";
        isFamilyMemberCheckbox.checked = isFamilyMember;
        isFamilyMemberText.textContent = isFamilyMember ? "Yes" : "No";

        isFamilyMemberCheckbox.onchange = function () {
            isFamilyMemberText.textContent = this.checked ? "Yes" : "No";
        };

        const modal = document.getElementById("userFormModal");
        modal.style.display = "flex";
        setTimeout(() => {
            modal.classList.add("show");
        }, 10);
    });
}

function submitExpanceForm(event) {
    event.preventDefault();
    const statusCheckbox = document.getElementById("userStatus");
    const isFamilyMemberCheckbox = document.getElementById("userIsFamilyMember");

    // Ensure is_family_member checkbox exists and get its value
    // Default to false if checkbox is not found
    const isFamilyMember = isFamilyMemberCheckbox ? isFamilyMemberCheckbox.checked : false;

    // Validate all fields
    const nameValidation = validateRequiredField(
        document.getElementById("userName").value,
        "User name",
        3
    );
    const mobileValidation = validateIndianMobile(
        document.getElementById("userMobile").value
    );

    // Check unique mobile only if mobile validation passed
    let uniqueMobileValidation = { status: true };
    if (mobileValidation.status) {
        uniqueMobileValidation = validateUniqueMobile(
            document.getElementById("userMobile").value,
            userData,
            editingUserId
        );
    }

    const passwordValidation = validatePassword(
        document.getElementById("userPassword").value
    );
    const shopIdValidation = validateRequiredField(
        document.getElementById("userShopId").value,
        "Shop code"
    );

    // Check all validations
    const formValidation = validateForm([
        nameValidation,
        mobileValidation,
        uniqueMobileValidation,
        passwordValidation,
        shopIdValidation
    ]);

    if (!formValidation.status) {
        showNotification(formValidation.message, "error");
        return;
    }

    const formData = {
        name: document.getElementById("userName").value,
        mobile: document.getElementById("userMobile").value,
        password: document.getElementById("userPassword").value,
        // Still send shop_id to backend, but selected via shop code dropdown
        shop_id: document.getElementById("userShopId").value,
        status: statusCheckbox.checked ? "active" : "inactive",
        // Always send as string "True" or "False" to match API format, never null/undefined
        is_family_member: isFamilyMember ? "True" : "False"
    };

    const mainContent = document.getElementById("mainContent");

    if (editingUserId) {
        return showConfirm(
            "Are you sure you want to update this user?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) return;

            return updateItem(userURLphp, editingUserId, formData).then(result => {
                // Handle error response
                if (result?.error) {
                    let errorMessage = result.message || "Error updating user!";

                    // Check for specific database constraint violations
                    if (result.detail) {
                        if (result.detail.includes("Duplicate entry") && result.detail.includes("fk_users_shop_owner_link")) {
                            errorMessage = "This shop already has a user assigned! Each shop can only have one user.";
                        } else if (result.detail.includes("Duplicate entry")) {
                            errorMessage = result.detail;
                        }
                    }

                    showNotification(errorMessage, "error");
                } else if (result) {
                    showNotification("User updated successfully!", "success");
                    closeExpanceForm();
                    if (mainContent) {
                        return loadExpanceData().then(() => {
                            mainContent.innerHTML = generateTableHTML();
                        });
                    }
                } else {
                    showNotification("Error updating user!", "error");
                }
            }).catch(error => {
                console.error("Update error:", error);
                const errorMessage = error?.message || "Error updating user! Please try again.";
                showNotification(errorMessage, "error");
            });
        });
    } else {
        return showConfirm(
            "Are you sure you want to add this user?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) return;

            return addItemToAPI(userURLphp, formData).then(result => {
                // Handle error response
                if (result?.error) {
                    let errorMessage = result.message || "Error adding user!";

                    // Check for specific database constraint violations
                    if (result.detail) {
                        if (result.detail.includes("Duplicate entry") && result.detail.includes("fk_users_shop_owner_link")) {
                            errorMessage = "This shop already has a user assigned! Each shop can only have one user.";
                        } else if (result.detail.includes("Duplicate entry")) {
                            errorMessage = result.detail;
                        }
                    }

                    showNotification(errorMessage, "error");
                } else if (result) {
                    showNotification("User added successfully!", "success");
                    closeExpanceForm();

                    if (mainContent) {
                        return loadExpanceData().then(() => {
                            mainContent.innerHTML = generateTableHTML();
                        });
                    }
                } else {
                    showNotification("Error adding user!", "error");
                }
            }).catch(error => {
                console.error("Add error:", error);
                const errorMessage = error?.message || "Error adding user! Please try again.";
                showNotification(errorMessage, "error");
            });
        });
    }
}

// ============================================
// TOGGLE USER STATUS
// ============================================
function toggleExpanceStatus(id, currentStatus) {
    return showConfirm(
        `Are you sure you want to change this user's status to ${currentStatus === "active" ? "inactive" : "active"}?`,
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        const newStatus = currentStatus === "active" ? "inactive" : "active";
        return updateItem(userURLphp, id, { status: newStatus }).then(result => {
            if (result) {
                const mainContent = document.getElementById("mainContent");
                if (mainContent) {
                    return loadExpanceData().then(() => {
                        mainContent.innerHTML = generateTableHTML();
                        showNotification(`User status changed to ${newStatus}!`, "success");
                    });
                }
            } else {
                showNotification("Error updating user status!", "error");
            }
        });
    });
}

// Close modal when clicking outside
window.addEventListener("click", function (event) {
    const modal = document.getElementById("userFormModal");
    if (event.target === modal) {
        closeExpanceForm();
    }
});

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.deleteExpance = deleteExpance;
window.editExpance = editExpance;
window.toggleExpanceStatus = toggleExpanceStatus;
window.openExpanceForm = openExpanceForm;
window.closeExpanceForm = closeExpanceForm;
window.submitExpanceForm = submitExpanceForm;
window.changeExpancePage = changeExpancePage;
window.changeExpancePerPage = changeExpancePerPage;
window.showNotification = showNotification;
window.generateTableHTML = generateTableHTML;
window.showConfirm = showConfirm;

// Setup ESC key handler for modal
setupEscKeyHandler();
