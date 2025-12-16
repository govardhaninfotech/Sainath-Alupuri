// ============================================
// SHOP PAGE - CRUD OPERATIONS WITH PAGINATION
// ============================================

import { shopURLphp } from "../apis/api.js";
import {
    getItemsData,
    updateItem,
    deleteItemFromAPI,
    addItemToAPI
} from "../apis/master_api.js";
import { showNotification, showConfirm } from "./notification.js";
import {
    validateDate,
    validateCreditLimit,
    validateBalance,
    validateRequiredField,
    validateUniqueShopCode,
    setupEscKeyHandler
} from "./validation.js";

// Initialize ESC key handler on page load
setupEscKeyHandler();

// Shop Data Storage
let shopData = [];

// Server-side pagination meta
let currentShopPage = 1;   // current page (matches API "page")
let shopPerPage = 10;      // matches API "per_page"
let shopTotal = 0;         // API "total"
let shopTotalPages = 1;    // API "total_pages"

let editingShopId = null;

// ============================================
// LOAD SHOP DATA FROM API (SERVER PAGINATION)
// ============================================
function loadShopData() {
    // Build URL with query params for server-side pagination
    const url = `${shopURLphp}?page=${currentShopPage}&per_page=${shopPerPage}`;

    return getItemsData(url).then(data => {
        // Expected API shape:
        // { page, per_page, total, total_pages, shops: [...] }
        // or maybe { shop: [...] } – support both
        shopData = data.shops || data.shop || [];
        shopTotal = data.total ?? shopData.length;
        shopPerPage = data.per_page ?? shopPerPage;
        shopTotalPages = data.total_pages ?? Math.max(1, Math.ceil(shopTotal / shopPerPage));
        currentShopPage = data.page ?? currentShopPage;

        console.log("Shops loaded:", data);
    });
}

// ============================================
// RENDER SHOP TABLE WITH PAGINATION
// ============================================
export function rendershopTable() {
    return loadShopData().then(() => generateTableHTML());
}

// Generate table HTML (no client-side slicing now)
// We already get just one page from API in shopData
function generateTableHTML() {
    const page = currentShopPage;
    const perPage = shopPerPage;
    const total = shopTotal;
    const totalPages = shopTotalPages || 1;

    // Compute "Showing X to Y"
    let showingFrom = 0;
    let showingTo = 0;

    if (total > 0) {
        showingFrom = (page - 1) * perPage + 1;
        showingTo = Math.min(page * perPage, total);
    }

    let tableRows = "";
    shopData.forEach(shop => {
        const startDate = shop.start_date ? shop.start_date : "-";
        const creditLimit = shop.credit_limit ? `₹${parseFloat(shop.credit_limit).toFixed(2)}` : "-";
        const balance = shop.current_balance !== undefined ? `₹${parseFloat(shop.current_balance).toFixed(2)}` : "-";

        tableRows += `
            <tr>
                <td>${shop.shop_name}</td>
                <td>${shop.shop_code}</td>
                <td>${shop.address || ""}</td>
               <!-- <td>${startDate}</td>
                <td>${creditLimit}</td> -->
                <td>${balance}</td>
               
                <td style="width: 150px;">
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <label class="toggle-switch">
                            <input type="checkbox"
                                   onchange="toggleShopStatus('${shop.id}', '${shop.status}')"
                                   ${shop.status === 'active' ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <span class="status-text" style="margin-left: 10px; font-weight: 500; min-width: 60px;">
                        </span>
                    </div>
                </td>
                <td>
                    <button class="btn-icon btn-edit" onclick="editShop('${shop.id}')" title="Edit">
                        <i class="icon-edit">✎</i>
                    </button>
                </td>
                
            </tr>
        `;
    });

    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>Shop Management</h2>
                <button class="btn-add" onclick="openShopForm()">Add Shop</button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Shop Name</th>
                            <th>Shop Code</th>
                            <th>Address</th>
                            <!-- <th>Start Date</th>
                            <th>Credit Limit</th> -->
                            <th>Current Balance</th>
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
                    <button onclick="changeShopPage('prev')" ${page === 1 ? "disabled" : ""}>Previous</button>
                    <span class="page-number">Page ${page} of ${totalPages}</span>
                    <button onclick="changeShopPage('next')" ${page === totalPages ? "disabled" : ""}>Next</button>
                </div>
            </div>
        </div>

        <!-- Shop Form Modal -->
        <div id="shopFormModal" class="modal">
            <div class="modal-content modal-responsive">
                <div class="modal-header">
                    <h3 id="shopFormTitle">Add New Shop</h3>
                    <button class="close-btn" onclick="closeShopForm()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="shopForm" onsubmit="submitShopForm(event)" class="form-responsive">
                        <input type="hidden" id="shopId">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="shopName">Shop Name <span class="required">*</span></label>
                                <input type="text" id="shopName" required placeholder="Enter shop name">
                            </div>

                            <div class="form-group">
                                <label for="shopCode">Shop Code <span class="required">*</span></label>
                                <input type="text" id="shopCode" required placeholder="e.g., AL1">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="shopCreditLimit">Credit Limit <span class="required">*</span></label>
                                <input type="number" id="shopCreditLimit" step="0.01" min="0.01" value="0" required placeholder="Enter credit limit">
                            </div>

                            <div class="form-group">
                                <label for="shopBalance">Current Balance <span class="required">*</span></label>
                                <input type="number" id="shopBalance" step="0.01" value="0" required placeholder="Enter current balance (can be negative)">
                            </div>
                        </div>

                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="shopStartDate">Start Date <span class="required">*</span></label>
                                <input type="date" id="shopStartDate" required>
                            </div>

                            <div class="form-group">
                                <label for="shopStatus">Status</label>
                                <div style="display: flex; align-items: center; padding: 10px 0;">
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="shopStatus" checked>
                                        <span class="slider"></span>
                                    </label>
                                    <span id="shopStatusText" style="margin-left: 10px; font-weight: 500;">Active</span>
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group" style="width: 100%;">
                                <label for="shopAddress">Address <span class="required">*</span></label>
                                <textarea id="shopAddress" required placeholder="Enter address" rows="3" style="resize: vertical;"></textarea>
                            </div>
                        </div>


                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeShopForm()">Cancel</button>
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
function changeShopPage(direction) {
    if (direction === "next" && currentShopPage < shopTotalPages) {
        currentShopPage++;
    } else if (direction === "prev" && currentShopPage > 1) {
        currentShopPage--;
    } else {
        return Promise.resolve(); // nothing to do
    }

    return loadShopData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateTableHTML();
        }
    });
}

function changeShopPerPage(value) {
    shopPerPage = parseInt(value, 10) || 10;
    currentShopPage = 1; // reset to first page when per-page changes

    return loadShopData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateTableHTML();
        }
    });
}

// ============================================
// FORM FUNCTIONS
// ============================================
function openShopForm() {
    editingShopId = null;
    document.getElementById("shopFormTitle").textContent = "Add New Shop";
    document.getElementById("shopForm").reset();
    document.getElementById("shopId").value = "";

    const statusCheckbox = document.getElementById("shopStatus");
    statusCheckbox.checked = true;
    document.getElementById("shopStatusText").textContent = "Active";

    // Set current date as default and minimum (prevent past dates)
    const today = new Date().toISOString().split("T")[0];
    const shopStartDateInput = document.getElementById("shopStartDate");
    shopStartDateInput.value = today;
    shopStartDateInput.min = today;  // Prevent selecting past dates

    const modal = document.getElementById("shopFormModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

function closeShopForm() {
    const modal = document.getElementById("shopFormModal");
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
    editingShopId = null;
}

// ============================================
// DELETE SHOP FUNCTION WITH CONFIRMATION
// ============================================
function deleteShop(id) {
    return showConfirm(
        "Are you sure you want to delete this shop?",
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        return deleteItemFromAPI(shopURLphp, id).then(result => {
            if (result) {
                showNotification("Shop deleted successfully!", "success");
                const mainContent = document.getElementById("mainContent");
                if (mainContent) {
                    return loadShopData().then(() => {
                        mainContent.innerHTML = generateTableHTML();
                    });
                }
            } else {
                showNotification("Error deleting shop!", "error");
            }
        });
    });
}

// ============================================
// EDIT SHOP FUNCTION
// ============================================
function editShop(id) {
    editingShopId = id;

    const item = shopData.find(i => String(i.id) === String(id));
    if (!item) {
        console.error("Shop not found for edit:", id);
        showNotification("Shop not found!", "error");
        return;
    }

    document.getElementById("shopFormTitle").textContent = "Update Shop";
    document.getElementById("shopId").value = item.id;
    document.getElementById("shopName").value = item.shop_name;
    document.getElementById("shopCode").value = item.shop_code || "";
    document.getElementById("shopAddress").value = item.address || "";
    document.getElementById("shopStartDate").value = item.start_date || "";
    document.getElementById("shopCreditLimit").value = item.credit_limit || 0;
    document.getElementById("shopBalance").value = item.current_balance || 0;

    const statusCheckbox = document.getElementById("shopStatus");
    const statusText = document.getElementById("shopStatusText");
    statusCheckbox.checked = item.status === "active";
    statusText.textContent = item.status === "active" ? "Active" : "Inactive";

    statusCheckbox.onchange = function () {
        statusText.textContent = this.checked ? "Active" : "Inactive";
    };

    const modal = document.getElementById("shopFormModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

async function submitShopForm(event) {
    event.preventDefault();
    const statusCheckbox = document.getElementById("shopStatus");

    const shopName = document.getElementById("shopName").value.trim();
    const shopCode = document.getElementById("shopCode").value.trim();
    const address = document.getElementById("shopAddress").value.trim();
    const startDate = document.getElementById("shopStartDate").value.trim();
    const creditLimit = document.getElementById("shopCreditLimit").value;
    const balance = document.getElementById("shopBalance").value;

    // Validate Shop Name
    let validation = validateRequiredField(shopName, "Shop name", 2);
    if (!validation.status) {
        showNotification(validation.message, "error");
        return;
    }

    // Validate Shop Code
    validation = validateRequiredField(shopCode, "Shop code");
    if (!validation.status) {
        showNotification(validation.message, "error");
        return;
    }

    // Validate Shop Code is unique (case-insensitive, excluding current shop if editing)
    validation = validateUniqueShopCode(shopCode, shopData, editingShopId);
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

    // Validate Start Date
    validation = validateDate(startDate);
    if (!validation.status) {
        showNotification(validation.message, "error");
        return;
    }

    // Validate Credit Limit
    validation = validateCreditLimit(creditLimit);
    if (!validation.status) {
        showNotification(validation.message, "error");
        return;
    }

    // Validate Balance
    validation = validateBalance(balance);
    if (!validation.status) {
        showNotification(validation.message, "error");
        return;
    }

    const formData = {
        shop_name: shopName,
        shop_code: shopCode,
        address: address,
        start_date: startDate,
        credit_limit: parseFloat(creditLimit),
        current_balance: parseFloat(balance),
        status: statusCheckbox.checked ? "active" : "inactive"
    };

    const mainContent = document.getElementById("mainContent");

    if (editingShopId) {
        return showConfirm(
            "Are you sure you want to update this shop?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) return;

            return updateItem(shopURLphp, editingShopId, formData).then(result => {
                if (result) {
                    showNotification("Shop updated successfully!", "success");
                } else {
                    showNotification("Error updating shop!", "error");
                }

                closeShopForm();
                if (mainContent) {
                    return loadShopData().then(() => {
                        mainContent.innerHTML = generateTableHTML();
                    });
                }
            });
        });
    } else {
        return showConfirm(
            "Are you sure you want to add this shop?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) return;

            return addItemToAPI(shopURLphp, formData).then(result => {
                if (result) {
                    showNotification("Shop added successfully!", "success");
                    closeShopForm();

                    if (mainContent) {
                        return loadShopData().then(() => {
                            mainContent.innerHTML = generateTableHTML();
                        });
                    }
                } else {
                    showNotification("Error adding shop!", "error");
                }
            });
        });
    }
}

// ============================================
// TOGGLE SHOP STATUS
// ============================================
function toggleShopStatus(id, currentStatus) {
    return showConfirm(
        `Are you sure you want to change this shop's status to ${currentStatus === "active" ? "inactive" : "active"}?`,
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        const newStatus = currentStatus === "active" ? "inactive" : "active";
        return updateItem(shopURLphp, id, { status: newStatus }).then(result => {
            if (result) {
                const mainContent = document.getElementById("mainContent");
                if (mainContent) {
                    return loadShopData().then(() => {
                        mainContent.innerHTML = generateTableHTML();
                        showNotification(`Shop status changed to ${newStatus}!`, "success");
                    });
                }
            } else {
                showNotification("Error updating shop status!", "error");
            }
        });
    });
}

// Close modal when clicking outside
window.addEventListener("click", function (event) {
    const modal = document.getElementById("shopFormModal");
    if (event.target === modal) {
        closeShopForm();
    }
});

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.deleteShop = deleteShop;
window.editShop = editShop;
window.toggleShopStatus = toggleShopStatus;
window.openShopForm = openShopForm;
window.closeShopForm = closeShopForm;
window.submitShopForm = submitShopForm;
window.changeShopPage = changeShopPage;
window.changeShopPerPage = changeShopPerPage;
window.showNotification = showNotification;
window.generateTableHTML = generateTableHTML;
window.showConfirm = showConfirm;
