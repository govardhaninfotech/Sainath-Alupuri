// ============================================
// ITEMS PAGE - CRUD OPERATIONS WITH PAGINATION
// ============================================

import { itemURLphp } from "../apis/api.js";
import { getItemsData, updateItem, addItemToAPI } from "../apis/master_api.js";
import { showNotification } from "./notification.js";

// Items Data Storage
let itemsData = [];

// Server-side pagination meta
let currentItemsPage = 1;   // matches API "page"
let itemsPerPage = 15;      // matches API "per_page"
let itemsTotal = 0;         // API "total"
let itemsTotalPages = 1;    // API "total_pages"

let editingItemId = null;

// ============================================
// LOAD ITEMS DATA FROM API (SERVER PAGINATION)
// ============================================
function loadItemsData() {
    let currentUser = null;

    try {
        currentUser =
            JSON.parse(sessionStorage.getItem("rememberedUser")) ||
            JSON.parse(localStorage.getItem("rememberedUser"));
    } catch (e) {
        currentUser = null;
    }

    if (!currentUser || !currentUser.id) {
        showNotification("User not logged in!", "error");
        return Promise.reject("Missing user_id");
    }

    const url = `${itemURLphp}?user_id=${currentUser.id}&page=${currentItemsPage}&per_page=${itemsPerPage}`;

    return getItemsData(url).then(data => {
        itemsData = data.items || [];
        itemsTotal = data.total ?? itemsData.length;
        itemsPerPage = data.per_page ?? itemsPerPage;
        itemsTotalPages = data.total_pages ?? Math.max(1, Math.ceil(itemsTotal / itemsPerPage));
        currentItemsPage = data.page ?? currentItemsPage;
    });
}


// ============================================
// RENDER ITEMS TABLE WITH PAGINATION
// ============================================
export function renderItemsTable() {
    return loadItemsData().then(() => generateItemsTableHTML());
}

// Generate table HTML (NO client-side slicing now)
function generateItemsTableHTML() {
    const page = currentItemsPage;
    const perPage = itemsPerPage;
    const total = itemsTotal;
    const totalPages = itemsTotalPages || 1;

    let showingFrom = 0;
    let showingTo = 0;

    if (total > 0) {
        showingFrom = (page - 1) * perPage + 1;
        showingTo = Math.min(page * perPage, total);
    }

    let tableRows = "";

    itemsData.forEach((item, index) => {
        const serialNo = (page - 1) * perPage + index + 1;

        const imageCell = `
            <div style="display:flex; align-items:center; gap:8px;">
                <img src="${item.image_path || ""}"
                     alt="${item.name}"
                     style="width:50px;height:50px;object-fit:cover;border-radius:4px;"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block';">
                <span style="display:none;font-size:12px;color:#9ca3af;">No image</span>
            </div>
        `;

        tableRows += `
            <tr>
                <td>${serialNo}</td>
                <!-- <td>${imageCell}</td> -->
                <td>${item.name}</td>
                <td>${item.unit}</td>
                <td>${item.price}</td>
                <td>${item.visible_to_all === "True" ? "Yes" : "No"}</td>
                <td>
                    <button class="btn-icon btn-edit"
                            onclick="editItems('${item.id}')"
                            title="Edit">
                        <i class="icon-edit">✎</i>
                    </button>
                </td>
            </tr>
        `;
    });

    return `
        <div class="content-card">
            <div class="items-header">
                <h2>Items Management</h2>
                <button class="btn-add" onclick="openItemForm()">
                    <svg class="btn-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path>
                    </svg>
                    <span class="btn-text">Add Item</span>
                </button>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <!-- <th>Image</th> -->
                            <th>Item Name</th>
                            <th>Unit</th>
                            <th>Price</th>
                            <th>Visible</th>
                            <th>Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows || `<tr><td colspan="7" style="text-align:center;">No items found</td></tr>`}
                    </tbody>
                </table>
            </div>

            <div class="pagination">
                <div class="pagination-info">
                    Showing ${total === 0 ? 0 : showingFrom} to ${showingTo} of ${total} entries
                </div>
                <div class="pagination-controls">
                    <button onclick="changeItemsPage('prev')" ${page === 1 ? "disabled" : ""}>Previous</button>
                    <span class="page-number">Page ${page} of ${totalPages}</span>
                    <button onclick="changeItemsPage('next')" ${page === totalPages ? "disabled" : ""}>Next</button>
                </div>
            </div>
        </div>

        <!-- Items Form Modal -->
        <div id="itemsFormModal" class="modal">
            <div class="modal-content modal-responsive">
                <div class="modal-header">
                    <h3 id="formTitle">Add New Item</h3>
                    <button class="close-btn" onclick="closeItemForm()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="itemsForm" onsubmit="submitItemForm(event)" class="form-responsive">
                        <input type="hidden" id="itemId">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="itemName">Item Name <span class="required">*</span></label>
                                <input type="text" id="itemName" required placeholder="Enter item name">
                            </div>

                            <div class="form-group">
                                <label for="itemPrice">Price <span class="required">*</span></label>
                                <input type="number" id="itemPrice" step="0.01" min="0" value="0" required placeholder="Enter price">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="itemUnit">Unit <span class="required">*</span></label>
                                <input type="text" id="itemUnit" required placeholder="e.g., kg, liter, piece">
                            </div>

                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="itemDescription">Description <span>(Optional)</span></label>
                                <textarea id="itemDescription" placeholder="Enter description (optional)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: Arial, sans-serif; resize: vertical; min-height: 80px; box-sizing: border-box;"></textarea>
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
                                    <span id="statusText" style="margin-left: 10px; font-weight: 500;">Enable</span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="itemVisibleToAll">Visible to All</label>
                                <div style="display: flex; align-items: center; padding: 10px 0;">
                                    <label class="toggle-switch">
                                    <input type="checkbox" id="itemVisibleToAll">
                                    <span class="slider"></span>
                                    </label>
                                    <span id="visibleText" style="margin-left: 10px; font-weight: 500;">
                                    No
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="form-row">
                           <div class="form-group">
                                <label for="itemStatusCity">Show all City</label>
                                <div style="display: flex; align-items: center; padding: 10px 0;">
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="itemStatusCity" checked>
                                        <span class="slider"></span>
                                    </label>
                                    <span id="cityText" style="margin-left: 10px; font-weight: 500;">Yes</span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="itemStockStatus">Add to Stock</label>
                                <div style="display: flex; align-items: center; padding: 10px 0;">
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="itemStockStatus" checked>
                                        <span class="slider"></span>
                                    </label>
                                    <span id="stockText" style="margin-left: 10px; font-weight: 500;">Yes</span>
                                </div>
                            </div>

                        </div>



                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeItemForm()">
                                <span class="btn-text">Cancel</span>
                            </button>
                            <button type="submit" class="btn-submit">
                                <span class="btn-text">Add Item</span>
                            </button>
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
function changeItemsPage(direction) {
    if (direction === "next" && currentItemsPage < itemsTotalPages) {
        currentItemsPage++;
    } else if (direction === "prev" && currentItemsPage > 1) {
        currentItemsPage--;
    } else {
        return Promise.resolve();
    }

    return loadItemsData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateItemsTableHTML();
        }
    });
}

function changeItemPerPage(value) {
    itemsPerPage = parseInt(value, 10) || 10;
    currentItemsPage = 1;

    return loadItemsData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateItemsTableHTML();
        }
    });
}
function checkBoxEvent(chkBox, lable, statusTrue, statusFalse, value) {
    if (value == true) {
        chkBox.checked = true;
        lable.textContent = statusTrue;
    }
    else {
        chkBox.checked = false;
        lable.textContent = statusFalse;
    }
    chkBox.onchange = function () {
        if (this.checked) {
            lable.textContent = statusTrue;
        }
        else {
            lable.textContent = statusFalse;
        }
    }
}
// ============================================
// FORM FUNCTIONS
// ============================================
function openItemForm() {
    editingItemId = null;
    document.getElementById("formTitle").textContent = "Add New Item";
    document.getElementById("itemsForm").reset();
    document.getElementById("itemId").value = "";

    // Status default ON
    const statusCheckbox = document.getElementById("itemStatus");
    let statusLable = document.getElementById("statusText");
    checkBoxEvent(statusCheckbox, statusLable, "Enable", "Disable", true)
    //Visiable to all clients
    const visiableCheckbox = document.getElementById("itemVisibleToAll");
    let visibleLable = document.getElementById("visibleText");
    checkBoxEvent(visiableCheckbox, visibleLable, "Yes", "No", true)

    //show items in stock
    const itemStockchkBox = document.getElementById("itemStockStatus");
    let stockLable = document.getElementById("stockText");
    checkBoxEvent(itemStockchkBox, stockLable, "Yes", "No", true)
    //Visiable to all clients
    const itemCitychkBox = document.getElementById("itemStatusCity");
    let cityLable = document.getElementById("cityText");
    checkBoxEvent(itemCitychkBox, cityLable, "Surat - Local", "Non - Local", true)

    document.getElementById("itemPrice").value = 0;

    const modal = document.getElementById("itemsFormModal");
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("show"), 10);
}


function closeItemForm() {
    const modal = document.getElementById("itemsFormModal");
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
    editingItemId = null;
}
let currentlyEditingStaffStatus = 'Active';
let currentlyEditingStaffVisibleStatus = 'Active';

function editItems(id) {
    console.log("item editI found");

    editingItemId = id;

    const item = itemsData.find(i => String(i.id) === String(id));
    console.log(id, item);

    if (!item) {
        showNotification("Item not found!", "error");
        return;
    }
    currentlyEditingStaffStatus = item.status;
    document.getElementById("formTitle").textContent = "Update Item";
    document.getElementById("itemId").value = item.id;
    document.getElementById("itemName").value = item.name;
    document.getElementById("itemDescription").value = item.description;
    document.getElementById("itemPrice").value = item.price;
    document.getElementById("itemUnit").value = item.unit;
    document.getElementById("itemStockStatus").value = item.allow_stock_adjustment;
    document.getElementById("itemStatusCity").value = item.visiable_to_surat;
    // document.getElementById("itemImagePath").value = item.image_path;

    const statusCheckbox = document.getElementById("itemStatus");
    const statusText = document.getElementById("statusText");

    if (item.status === "enable")
        checkBoxEvent(statusCheckbox, statusText, "Enable", "Disable", true)
    else
        checkBoxEvent(statusCheckbox, statusText, "Enable", "Disable", false)

    // ✅ Visible to All FROM API ONLY
    const visibleCheckbox = document.getElementById("itemVisibleToAll");
    const visibleText = document.getElementById("visibleText");
    if (item.visible_to_all === "True")
        checkBoxEvent(visibleCheckbox, visibleText, "Yes", "No", true)
    else
        checkBoxEvent(visibleCheckbox, visibleText, "Yes", "No", false)

    const itemStockchkBox = document.getElementById("itemStockStatus");
    let stockLable = document.getElementById("stockText");
    if (item.allow_stock_adjustment === "true")
        checkBoxEvent(itemStockchkBox, stockLable, "Yes", "No", true)
    else
        checkBoxEvent(itemStockchkBox, stockLable, "Yes", "No", false)
    const itemCitychkBox = document.getElementById("itemStatusCity");
    let cityLable = document.getElementById("cityText");
    console.log(item.visible_to_surat,itemCitychkBox,cityLable);
    
    if (item.visible_to_surat === "true")
        checkBoxEvent(itemCitychkBox, cityLable, "Surat - Local", "Non - Local", true)
    else
        checkBoxEvent(itemCitychkBox, cityLable, "Surat - Local", "Non - Local", false)


    // visibleCheckbox.checked = item.visible_to_all === "True";
    // visibleText.textContent = visibleCheckbox.checked ? "Yes" : "No";
    // currentlyEditingStaffVisibleStatus = item.visible_to_all;

    // visibleCheckbox.onchange = function () {
    //     visibleText.textContent = this.checked ? "Yes" : "No";
    // };

    const modal = document.getElementById("itemsFormModal");
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("show"), 10);
}


async function submitItemForm(event) {
    event.preventDefault();
    const statusCheckbox = document.getElementById("itemStatus");
    const description = document.getElementById("itemDescription").value.trim();
    const visibleCheckbox = document.getElementById("itemVisibleToAll");
    const itemStockStatus = document.getElementById("itemStockStatus");
    const itemStatusCity = document.getElementById("itemStatusCity");

    const formData = {
        name: document.getElementById("itemName").value,
        description: description || "",
        price: parseFloat(document.getElementById("itemPrice").value) || 0,
        unit: document.getElementById("itemUnit").value,
        status: statusCheckbox.checked ? "enable" : "disable",
        visible_to_all: visibleCheckbox.checked ? "True" : "False",
        allow_stock_adjustment: itemStockStatus.checked ? "True" : "False",
        visible_to_surat: itemStatusCity.checked ? "True" : "False"
    };
    console.log("item data", formData);

    const currentUser = JSON.parse(sessionStorage.getItem("rememberedUser")) || JSON.parse(localStorage.getItem("rememberedUser"));
    let user_id = currentUser ? currentUser.id : null;
    const mainContent = document.getElementById("mainContent");

    if (editingItemId) {
        return showConfirm(
            "Are you sure you want to update this item?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) {
                statusCheckbox.checked = currentlyEditingStaffStatus;
                visibleCheckbox.checked = currentlyEditingStaffVisibleStatus;
                return;
            }
            return updateItem(itemURLphp, editingItemId, formData, user_id)
                .then(result => {
                    // ❗ Only fail if API explicitly says error
                    if (result?.error) {
                        showNotification(result.message || "Error updating item!", "error");
                        return;
                    }

                    // ✅ SUCCESS DEFAULT
                    showNotification("Item updated successfully!", "success");
                    closeItemForm();

                    if (mainContent) {
                        return loadItemsData().then(() => {
                            mainContent.innerHTML = generateItemsTableHTML();
                        });
                    }
                })
                .catch(err => {
                    console.error("Update item error:", err);
                    showNotification("Error updating item!", "error");
                });

        });
    } else {
        return showConfirm(
            "Are you sure you want to add this item?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) return;

            return addItemToAPI(itemURLphp, formData).then(result => {
                if (result) {
                    showNotification("Item added successfully!", "success");
                    closeItemForm();

                    if (mainContent) {
                        return loadItemsData().then(() => {
                            mainContent.innerHTML = generateItemsTableHTML();
                        });
                    }
                } else {
                    showNotification("Error adding item!", "error");
                }
            });
        });
    }
}

function toggleItemStatusItems(id, currentStatus) {
    return showConfirm(
        `Are you sure you want to change this item's status to ${currentStatus === "enable" ? "disable" : "enable"}?`,
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        const newStatus = currentStatus === "enable" ? "disable" : "enable";
        return updateItem(itemURLphp, id, { status: newStatus }).then(result => {
            if (result) {
                const mainContent = document.getElementById("mainContent");
                if (mainContent) {
                    return loadItemsData().then(() => {
                        mainContent.innerHTML = generateItemsTableHTML();
                        showNotification(`Item status changed to ${newStatus}!`, "success");
                    });
                }
            } else {
                showNotification("Error updating item status!", "error");
            }
        });

    });
}

// Close modal when clicking outside
window.addEventListener("click", function (event) {
    const modal = document.getElementById("itemsFormModal");
    if (event.target === modal) {
        closeItemForm();
    }
});

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE (ITEMS-ONLY NAMES)
// ============================================
window.editItems = editItems;
window.toggleItemStatusItems = toggleItemStatusItems;
window.openItemForm = openItemForm;
window.closeItemForm = closeItemForm;
window.submitItemForm = submitItemForm;
window.changeItemsPage = changeItemsPage;
window.changeItemPerPage = changeItemPerPage;
window.showNotification = showNotification;
window.generateItemsTableHTML = generateItemsTableHTML;
