// ============================================
// USER PAGE - CRUD OPERATIONS WITH PAGINATION
// ============================================

import { userURLphp } from "../apis/api.js";
import {
    getItemsData,
    updateItem,
    deleteItemFromAPI,
    addItemToAPI
} from "../apis/master_api.js";
import { showNotification, showConfirm } from "./notification.js";
import { printReport, exportToPDF, exportToExcel, toggleExportDropdown } from "./print/print.js";
import {
    validateRequiredField,
    validateIndianMobile,
    validateUniqueMobile,
    validateForm,
    setupEscKeyHandler
} from "./validation.js";
// User Data Storage
let userData = [];

// Server-side pagination meta
let currentUserPage = 1;   // current page (matches API "page")
let userPerPage = 15;      // matches API "per_page"
let userTotal = 0;         // API "total"
let userTotalPages = 1;    // API "total_pages"

let editingUserId = null;

// ============================================
// LOAD USER DATA FROM API (SERVER PAGINATION)
// ============================================
function loadUserData() {
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
// RENDER USER TABLE WITH PAGINATION
// ============================================
export function renderuserTable() {
    return loadUserData().then(() => generateTableHTML());
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
    for (let index = 0; index < userData.length; index++) {
        const serialNo = (page - 1) * perPage + index + 1;

        let user = userData[index];
        tableRows += `
    <tr>
                <td>${serialNo}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.mobile}</td>
                <td>${user.shop_code}</td>
               <!-- <td>${user.current_balance}</td> -->
                <td>${user.is_family_member}</td>
                <td>
                    <button class="btn-icon btn-edit" onclick="editUser('${user.id}')" title="Edit">
                        <i class="icon-edit">✎</i>
                    </button>
                </td>
            </tr>
        `;
    }

    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>Client Management</h2>
                 <div class="header-actions" style="display: flex; gap: 10px; align-items: center;">
                <button onclick="printReportclient()" class="btn-print" title="Print Report">
                    <span style="font-size: 18px;">🖨️</span> Print
                </button>
                <div class="export-dropdown-wrapper">
                    <button onclick="toggleExportDropdown()" class="btn-export" title="Export Report">
                        <span style="font-size: 18px;">📥</span> Export
                    </button>
                    <div id="exportDropdown" class="export-dropdown-menu">
                        <button onclick="exportToPDFmain()" class="export-option">
                            <span>📄</span> PDF
                        </button>
                        <button onclick="exportToExcelmain()" class="export-option">
                            <span>📊</span> Excel
                        </button>
                    </div>
                </div>
            </div>
                <button class="btn-add" style="max-width: 107px !important;" onclick="openUserForm()">Add User</button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Mobile</th>
                            <th>Franchise Code</th>
                           <!-- <th>Balance</th> -->
                            <th>Family Member?</th>
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
                                <input type="text" id="userMobile" required placeholder="Enter mobile number" pattern="[0-9]{10}" title="Mobile number must be 10 digits">
                            </div>
                        </div>

                        <div class="form-row">
                         

                          <div class="form-group">
                              <label for="userEmail">Email <span class="required">*</span></label>
                              <input type="email" id="userEmail" required placeholder="Enter Email id">
                          </div>
                          <div class="form-group">
                              <label for="userShopCode">Franchise Code <span class="required">*</span></label>
                              <input type="text" id="userShopCode" required placeholder="Enter Franchise code">
                          </div>
                          </div>
                          
                          <!-- <div class="form-row">
                          
                          
                            <div class="form-group">
                                <label for="userCreditLimit">Credit Limit</label>
                                <input type="number" id="userCreditLimit" min="0" placeholder="Enter credit limit">
                            </div>
                          <div class="form-group">
                            <label for="userCurrentBalance">Current Balance</label>
                            <input type="number" id="userCurrentBalance" min="0" placeholder="Enter current balance">
                          </div> 
                    </div> -->

                    <div class="form-row">

                        <div class="form-group">
                            <label for="userAddress">Address</label>
                            <textarea
                                id="userAddress"
                                rows="2"
                                placeholder="Enter address"
                                style="resize: vertical; height: 100px;"
                            ></textarea>
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
// STEP 1: PREPARE DATA FUNCTION
// ============================================
export function preparePrintDatainclient() {
    // Your existing data preparation logic
    let filtered = userData;

    const headers = ['Sr No', 'Name', 'Email', 'Mobile', 'Shop Code'];
    const rows = filtered.map((user, index) => {
        return [
            index + 1,
            user.name || '',
            user.email || '',
            user.mobile || '',
            user.shop_code || ''
        ];
    });

    return { headers, rows };
}

// ============================================
// STEP 2: CREATE WRAPPER FUNCTIONS
// These call the global print functions with your data
// ============================================

/**
 * PRINT CLIENT REPORT
 */
window.printReportclient = async function () {
    const printData = preparePrintDatainclient();

    await printReport({
        headers: printData.headers,
        rows: printData.rows,
        reportTitle: 'Client Management Report',
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Client Management System',
        logo: 'SA',
        additionalInfo: `
            <p><strong>Total Clients:</strong> ${printData.rows.length}</p>
            <p><strong>Report Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
        `
    });
};

/**
 * EXPORT CLIENT REPORT TO PDF
 */
window.exportToPDFmain = async function () {
    const printData = preparePrintDatainclient();

    await exportToPDF({
        headers: printData.headers,
        rows: printData.rows,
        reportTitle: 'Client Management Report',
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Client Management System',
        logo: 'SA',
        additionalInfo: `
            <p><strong>Total Clients:</strong> ${printData.rows.length}</p>
            <p><strong>Report Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
        `
    });
};

/**
 * EXPORT CLIENT REPORT TO EXCEL
 */
window.exportToExcelmain = async function () {
    const printData = preparePrintDatainclient();

    await exportToExcel({
        headers: printData.headers,
        rows: printData.rows,
        reportTitle: 'Client Management Report',
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Client Management System'
    });
};

// Toggle dropdown (already global, just expose it)



// ============================================
// PAGINATION FUNCTIONS (SERVER-SIDE)
// ============================================
function changeUserPage(direction) {
    if (direction === "next" && currentUserPage < userTotalPages) {
        currentUserPage++;
    } else if (direction === "prev" && currentUserPage > 1) {
        currentUserPage--;
    } else {
        return Promise.resolve(); // nothing to do
    }

    return loadUserData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateTableHTML();
        }
    });
}

function changeUserPerPage(value) {
    userPerPage = parseInt(value, 10) || 10;
    currentUserPage = 1; // reset to first page when per-page changes

    return loadUserData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateTableHTML();
        }
    });
}

// ============================================
// FORM FUNCTIONS
// ============================================
function openUserForm() {

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
function deleteUser(id) {
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
                    return loadUserData().then(() => {
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
function editUser(id) {

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
    document.getElementById("userEmail").value = item.email;
    document.getElementById("userMobile").value = item.mobile || "";
    document.getElementById("userShopCode").value = item.shop_code || "";
    // document.getElementById("userCreditLimit").value = item.credit_limit || 0;
    // document.getElementById("userCurrentBalance").value = item.current_balance || 0;
    document.getElementById("userAddress").value = item.address || "";


    // Make sure shop dropdown is populated and select current user's shop
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

}

function submitUserForm(event) {
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

    let uniqueMobileValidation = { status: true };

    if (editingUserId === null && mobileValidation.status) {
        // Only check uniqueness when ADDING new user
        uniqueMobileValidation = validateUniqueMobile(
            document.getElementById("userMobile").value,
            userData,
            null
        );
    }


    // Check all validations
    const formValidation = validateForm([
        nameValidation,
        mobileValidation,
        uniqueMobileValidation,
    ]);



    if (!formValidation.status) {
        showNotification(formValidation.message, "error");
        return;
    }

    const formData = {
        name: document.getElementById("userName").value,
        email: document.getElementById("userEmail").value,
        mobile: document.getElementById("userMobile").value,
        shop_code: document.getElementById("userShopCode").value,
        credit_limit: 0,
        current_balance: 0,
        address: document.getElementById("userAddress").value || "",
        status: statusCheckbox.checked ? "active" : "inactive",
        is_family_member: isFamilyMember ? "True" : "False"
    };

    // ✅ Only send password if user entered it


    const mainContent = document.getElementById("mainContent");

    if (editingUserId) {
        return showConfirm(
            "Are you sure you want to update this user?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) return;

            return updateItem(userURLphp, editingUserId, formData).then(result => {
                console.log(result);

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
                    closeUserForm();
                    if (mainContent) {
                        return loadUserData().then(() => {
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
                    closeUserForm();

                    if (mainContent) {
                        return loadUserData().then(() => {
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
function toggleUserStatus(id, currentStatus) {
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
                    return loadUserData().then(() => {
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
window.preparePrintDatainclient = preparePrintDatainclient;
window.toggleExportDropdown = toggleExportDropdown;

// Setup ESC key handler for modal
setupEscKeyHandler();
