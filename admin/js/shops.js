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
async function loadShopData() {
    // Build URL with query params for server-side pagination
    const url = `${shopURLphp}?page=${currentShopPage}&per_page=${shopPerPage}`;

    const data = await getItemsData(url);

    // Expected API shape:
    // { page, per_page, total, total_pages, shops: [...] }
    // or maybe { shop: [...] } – support both
    shopData = data.shops || data.shop || [];
    shopTotal = data.total ?? shopData.length;
    shopPerPage = data.per_page ?? shopPerPage;
    shopTotalPages = data.total_pages ?? Math.max(1, Math.ceil(shopTotal / shopPerPage));
    currentShopPage = data.page ?? currentShopPage;

    console.log("Shops loaded:", data);
}

// ============================================
// RENDER SHOP TABLE WITH PAGINATION
// ============================================
export async function rendershopTable() {
    await loadShopData();
    return generateTableHTML();
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

        tableRows += `
            <tr>
                <td>${shop.shop_name}</td>
                <td>${shop.shop_code}</td>
                <td>${shop.address || ""}</td>
                <td>${startDate}</td>
               
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
                <td>
                    <button class="btn-icon btn-delete-icon" onclick="deleteShop('${shop.id}')" title="Delete">
                        <i class="icon-delete">🗑</i>
                    </button>
                </td> 
            </tr>
        `;
    });

    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>Master Shop Management</h2>
                <button class="btn-add" onclick="openShopForm()">Add Shop</button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Shop Name</th>
                            <th>Shop Code</th>
                            <th>Address</th>
                            <th>Start Date</th>
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
                                <label for="shopAddress">Address <span class="required">*</span></label>
                                <input type="text" id="shopAddress" required placeholder="Enter address">
                            </div>

                            <div class="form-group">
                                <label for="shopStartDate">Start Date <span>(Optional)</span></label>
                                <input type="date" id="shopStartDate">
                            </div>
                        </div>

                        <div class="form-row">
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
async function changeShopPage(direction) {
    if (direction === "next" && currentShopPage < shopTotalPages) {
        currentShopPage++;
    } else if (direction === "prev" && currentShopPage > 1) {
        currentShopPage--;
    } else {
        return; // nothing to do
    }

    await loadShopData();
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
        mainContent.innerHTML = generateTableHTML();
    }
}

async function changeShopPerPage(value) {
    shopPerPage = parseInt(value, 10) || 10;
    currentShopPage = 1; // reset to first page when per-page changes

    await loadShopData();
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
        mainContent.innerHTML = generateTableHTML();
    }
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
async function deleteShop(id) {
    const confirmed = await showConfirm(
        "Are you sure you want to delete this shop?",
        "warning"
    );
    if (!confirmed) return;

    const result = await deleteItemFromAPI(shopURLphp, id);

    if (result) {
        showNotification("Shop deleted successfully!", "success");
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            await loadShopData();
            mainContent.innerHTML = generateTableHTML();
        }
    } else {
        showNotification("Error deleting shop!", "error");
    }
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

    const startDateValue = document.getElementById("shopStartDate").value.trim();

    const formData = {
        shop_name: document.getElementById("shopName").value,
        shop_code: document.getElementById("shopCode").value,
        address: document.getElementById("shopAddress").value,
        start_date: startDateValue || null,
        status: statusCheckbox.checked ? "active" : "inactive"
    };

    const mainContent = document.getElementById("mainContent");

    if (editingShopId) {
        const confirmed = await showConfirm(
            "Are you sure you want to update this shop?",
            "warning"
        );
        if (!confirmed) return;

        const result = await updateItem(shopURLphp, editingShopId, formData);
        if (result) {
            showNotification("Shop updated successfully!", "success");
        } else {
            showNotification("Error updating shop!", "error");
        }

        closeShopForm();
        if (mainContent) {
            await loadShopData();
            mainContent.innerHTML = generateTableHTML();
        }
    } else {
        const confirmed = await showConfirm(
            "Are you sure you want to add this shop?",
            "warning"
        );
        if (!confirmed) return;

        const result = await addItemToAPI(shopURLphp, formData);
        if (result) {
            showNotification("Shop added successfully!", "success");
            closeShopForm();

            if (mainContent) {
                await loadShopData();
                mainContent.innerHTML = generateTableHTML();
            }
        } else {
            showNotification("Error adding shop!", "error");
        }
    }
}

// ============================================
// TOGGLE SHOP STATUS
// ============================================
async function toggleShopStatus(id, currentStatus) {
    const confirmed = await showConfirm(
        `Are you sure you want to change this shop's status to ${currentStatus === "active" ? "inactive" : "active"}?`,
        "warning"
    );
    if (!confirmed) return;

    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const result = await updateItem(shopURLphp, id, { status: newStatus });

    if (result) {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            await loadShopData();
            mainContent.innerHTML = generateTableHTML();
            showNotification(`Shop status changed to ${newStatus}!`, "success");
        }
    } else {
        showNotification("Error updating shop status!", "error");
    }
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
