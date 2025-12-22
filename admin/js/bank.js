// ============================================
// BANK / PAYMENT METHODS PAGE - SERVER-SIDE PAGINATION
// ============================================

import { bankURLphp } from "../apis/api.js";
import { getItemsData, updateItem, addItemToAPI } from "../apis/master_api.js";
import { showNotification, showConfirm } from "./notification.js";

// Bank / payment data storage
let bankData = [];
let paginationInfo = {
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 1
};

let editingItemId = null;

// Get logged-in user ID
function getLoggedInUserId() {
    let user =
        JSON.parse(localStorage.getItem("rememberedUser")) ||
        JSON.parse(sessionStorage.getItem("rememberedUser"));

    return user?.id || null;
}
let user_id = getLoggedInUserId();

// ============================================
// LOAD BANK DATA WITH SERVER-SIDE PAGINATION
// ============================================
function loadBankData(page = 1, perPage = 10) {

    if (!user_id) {
        showNotification("User not logged in!", "error");
        return Promise.resolve();
    }

    const url = `${bankURLphp}?user_id=${user_id}&page=${page}&per_page=${perPage}`;

    return getItemsData(url).then(data => {
        bankData = data.accounts || [];

        paginationInfo = {
            page: data.page || 1,
            per_page: data.per_page || 10,
            total: data.total || 0,
            total_pages: data.total_pages || 1
        };
    });
}

// ============================================
// RENDER BANK TABLE WITH PAGINATION
// ============================================
export function renderbankTable() {
    return loadBankData(paginationInfo.page, paginationInfo.per_page).then(() => generateBankTableHTML());
}

// Generate table HTML using server-side pagination
function generateBankTableHTML() {
    let tableRows = "";
    for (let index = 0; index < bankData.length; index++) {
        const serialNo = (paginationInfo.page - 1) * paginationInfo.per_page + index + 1;

        let item = bankData[index];
        // Use the data directly from the server (already paginated)
        tableRows += `
            <tr>
                <td>${serialNo}</td>
                <td>${item.type}</td>
                <td>${item.name}</td>
                <td>${item.details}</td>
                <td>${item.starting_balance}</td>
              <!--  <td style="width: 150px;">
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <label class="toggle-switch">
                            <input type="checkbox"
                                   onchange="toggleBankStatus('${item.id}', '${item.status}')"
                                   ${item.status === "active" ? "checked" : ""}>
                            <span class="slider"></span>
                        </label>
                        <span class="status-text" style="margin-left: 10px; font-weight: 500; min-width: 60px;">
                        </span>
                    </div>
                </td> -->
                <td>
                    <button class="btn-icon btn-edit" onclick="editBankAccount('${item.id}')" title="Edit">
                        <i class="icon-edit">✎</i>
                    </button>
                </td>
            </tr>
        `;
    }

    // Calculate display range
    const start = (paginationInfo.page - 1) * paginationInfo.per_page;
    const end = Math.min(start + bankData.length, paginationInfo.total);

    return `
        <div class="content-card">
            <div class="items-header">
                <h2>Bank / Payment Methods</h2>
                <button class="btn-add" onclick="openBankForm()">Add Account</button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Type</th>
                            <th>Name</th>
                            <th>Details</th>
                            <th>Starting Balance</th>
                           <!-- <th>Status</th> -->
                            <th>Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows || '<tr><td colspan="6" style="text-align: center;">No accounts found</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div class="pagination">
                <div class="pagination-info">
                    Showing ${paginationInfo.total === 0 ? 0 : start + 1} to ${end} of ${paginationInfo.total} entries
                </div>
                <div class="pagination-controls">
                    <button onclick="changeBankPage('prev')" ${paginationInfo.page === 1 ? "disabled" : ""}>Previous</button>
                    <span class="page-number">Page ${paginationInfo.page} of ${paginationInfo.total_pages}</span>
                    <button onclick="changeBankPage('next')" ${paginationInfo.page >= paginationInfo.total_pages ? "disabled" : ""}>Next</button>
                </div>
            </div>
        </div>

        <!-- Bank / Payment Form Modal -->
        <div id="itemsFormModal" class="modal">
            <div class="modal-content modal-responsive">
                <div class="modal-header">
                    <h3 id="formTitle">Add New Account</h3>
                    <button class="close-btn" onclick="closeBankForm()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="itemsForm" onsubmit="submitBankForm(event)" class="form-responsive">
                        <input type="hidden" id="itemId">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="accountType">Account Type <span class="required">*</span></label>
                                <select id="accountType" required>
                                    <option value="">Select type</option>
                                    <option value="bank">Bank</option>
                                    <option value="upi">UPI</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="accountName">Account Name <span class="required">*</span></label>
                                <input type="text" id="accountName" required placeholder="e.g., Owner GPay, Cash Counter">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="accountNumber">Account Number <span class="required">*</span></label>
                                <input type="text" id="accountNumber" required placeholder="e.g., 98765xxxx@ybl or A/C number">
                            </div>

                            <div class="form-group">
                                <label for="startingBalance">Starting Balance <span class="required">*</span></label>
                                <input type="number" id="startingBalance" step="0.01" min="0" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="accountDetails">Details</label>
                                <textarea
                                    id="accountDetails"
                                    rows="3"
                                    placeholder="Enter details (optional)"
                                ></textarea>
                            </div>
                        </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="itemStatus">Status</label>
                                    <div style="display: flex; align-items: center; padding: 10px 0;">
                                        <label class="toggle-switch">
                                            <input type="checkbox" id="itemStatus" checked>
                                            <span class="slider"></span>
                                        </label>
                                        <span id="statusText" style="margin-left: 10px; font-weight: 500;">Active</span>
                                    </div>
                                </div>
                            </div>


                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeBankForm()">Cancel</button>
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
function changeBankPage(direction) {
    let newPage = paginationInfo.page;

    if (direction === "next" && paginationInfo.page < paginationInfo.total_pages) {
        newPage++;
    } else if (direction === "prev" && paginationInfo.page > 1) {
        newPage--;
    } else {
        return Promise.resolve();
    }

    // Fetch new page from server
    return loadBankData(newPage, paginationInfo.per_page).then(() => {
        // Re-render the table
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateBankTableHTML();
        }
    });
}

function changeBankPerPage(value) {
    const newPerPage = parseInt(value, 10) || 10;

    // Reset to page 1 when changing items per page
    return loadBankData(1, newPerPage).then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateBankTableHTML();
        }
    });
}

// ============================================
// FORM FUNCTIONS
// ============================================
function openBankForm() {
    editingItemId = null;
    document.getElementById("formTitle").textContent = "Add New Account";
    document.getElementById("itemsForm").reset();
    document.getElementById("itemId").value = "";

    const statusCheckbox = document.getElementById("itemStatus");
    statusCheckbox.checked = true;
    document.getElementById("statusText").textContent = "Active";

    document.getElementById("accountType").value = "";
    document.getElementById("startingBalance").value = 0;

    const modal = document.getElementById("itemsFormModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

function closeBankForm() {
    const modal = document.getElementById("itemsFormModal");
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
    editingItemId = null;
}

async function editBankAccount(id) {
    editingItemId = id;

    // Find in current page data
    let item = bankData.find((i) => String(i.id) === String(id));

    // If not found in current page, fetch all accounts to find it
    if (!item) {
        const allDataUrl = `${bankURLphp}?page=1&per_page=1000`; // Fetch all
        return getItemsData(allDataUrl).then(allData => {
            item = (allData.accounts || []).find((i) => String(i.id) === String(id));

            if (!item) {
                console.error("Account not found for edit:", id);
                showNotification("Account not found!", "error");
                return;
            }

            populateBankForm(item);
        });
    }

    populateBankForm(item);
}
let currentlyEditingStaffStatus = "Active";               // TRUE or FALSE

function populateBankForm(item) {
    document.getElementById("formTitle").textContent = "Update Account";
    document.getElementById("accountType").value = item.type;
    document.getElementById("accountName").value = item.name;
    document.getElementById("accountNumber").value = item.account_number;
    document.getElementById("startingBalance").value = item.starting_balance ?? 0;
    document.getElementById("itemId").value = item.id;
    document.getElementById("accountDetails").value =
        item.details && item.details !== "NA" ? item.details : "";

    const statusCheckbox = document.getElementById("itemStatus");
    const statusText = document.getElementById("statusText");
    statusCheckbox.checked = item.status === "active";
    statusText.textContent = item.status === "active" ? "Active" : "Inactive";
    currentlyEditingStaffStatus = item.status;
    statusCheckbox.onchange = function () {
        statusText.textContent = this.checked ? "Active" : "Inactive";
    };

    const modal = document.getElementById("itemsFormModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

async function submitBankForm(event) {
    event.preventDefault();

    const userId =
        JSON.parse(localStorage.getItem("rememberedUser"))?.id ||
        JSON.parse(sessionStorage.getItem("rememberedUser"))?.id;

    if (!userId) {
        showNotification("User not logged in!", "error");
        return;
    }

    const statusCheckbox = document.getElementById("itemStatus");

    const formData = {
        user_id: userId,
        type: document.getElementById("accountType").value,
        name: document.getElementById("accountName").value,
        account_number: document.getElementById("accountNumber").value,
        details: document.getElementById("accountDetails").value.trim() || "NA",
        starting_balance: parseFloat(document.getElementById("startingBalance").value) || 0,
        status: statusCheckbox.checked ? "active" : "inactive"
    };

    const mainContent = document.getElementById("mainContent");

    if (editingItemId) {
        return showConfirm("Update this account?", "warning").then(confirmed => {
            if (!confirmed) {
                statusCheckbox.checked = currentlyEditingStaffStatus;
                return;
            }

            return updateItem(bankURLphp, editingItemId, formData, userId)
                .then(result => {
                    // If backend sends explicit error
                    console.log(result);

                    if (result.error) {
                        showNotification(result.message || "Error updating account!", "error");
                        return;
                    }

                    // ✅ SUCCESS (default case)
                    showNotification("Account updated successfully!", "success");
                    closeBankForm();

                    return loadBankData(paginationInfo.page, paginationInfo.per_page)
                        .then(() => {
                            mainContent.innerHTML = generateBankTableHTML();
                        });
                })
                .catch(err => {
                    console.error("Update error:", err);
                    showNotification("Error updating account!", "error");
                });

        });
    } else {
        return showConfirm("Add this account?", "warning").then(confirmed => {
            if (!confirmed) return;

            return addItemToAPI(bankURLphp, formData).then(result => {
                if (result.status === "ok") {
                    showNotification("Account added successfully!", "success");
                    closeBankForm();
                    return loadBankData(paginationInfo.page, paginationInfo.per_page)
                        .then(() => mainContent.innerHTML = generateBankTableHTML());
                } else {
                    showNotification(result.detail, "error");
                }
            });
        });
    }
}


function toggleBankStatus(id, currentStatus) {
    return showConfirm(
        `Are you sure you want to change this account's status to ${currentStatus === "active" ? "inactive" : "active"}?`,
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        const newStatus = currentStatus === "active" ? "inactive" : "active";
        return updateItem(bankURLphp, id, { status: newStatus }).then(result => {
            if (result) {
                const mainContent = document.getElementById("mainContent");
                if (mainContent) {
                    return loadBankData(paginationInfo.page, paginationInfo.per_page).then(() => {
                        mainContent.innerHTML = generateBankTableHTML();
                        showNotification(`Account status changed to ${newStatus}!`, "success");
                    });
                }
            } else {
                showNotification("Error updating account status!", "error");
            }
        });
    });
}

// Close modal when clicking outside
window.addEventListener("click", function (event) {
    const modal = document.getElementById("itemsFormModal");
    if (event.target === modal) {
        closeBankForm();
    }
});

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.editBankAccount = editBankAccount;
window.toggleBankStatus = toggleBankStatus;
window.openBankForm = openBankForm;
window.closeBankForm = closeBankForm;
window.submitBankForm = submitBankForm;
window.changeBankPage = changeBankPage;
window.changeBankPerPage = changeBankPerPage;
window.showNotification = showNotification;
window.generateBankTableHTML = generateBankTableHTML;