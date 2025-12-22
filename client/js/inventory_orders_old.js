// ============================================
// ORDERS PAGE - FIXED VERSION (PRESERVED ORIGINAL LOGIC)
// ============================================

import { ordersURLphp, itemURLphp } from "../apis/api.js";
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
let orderData = [];
let itemsData = [];
let orderItems = [];

// Server-side pagination meta
let currentstaffPage = 1;
let staffPerPage = 10;
let staffTotal = 0;
let staffTotalPages = 1;

let editingItemId = null;

// EXPENSE MANAGEMENT STATE
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
// LOAD ORDER DATA FROM API (SERVER PAGINATION)
// ============================================
function loadorderData() {
    var date = "";
    const dateEle = document.querySelector("#btnDate");
    if (dateEle == null) {
        date = new Date().toISOString().split("T")[0];
    } else {
        date = dateEle.value;
    }
    const regex = /^\d{4}-\d{2}-\d{2}$/;

    if (!regex.test(date)) {
        console.log("Invalid date format. Expected YYYY-MM-DD.");
    } else {
        console.log("Format valid:", date);
    }

    const url = `${ordersURLphp}?user_id=${user_id}&date=${date}`;
    console.log(url);

    return getItemsData(url).then(data => {
        orderData = data.orders || [];
        staffTotal = data.total ?? orderData.length;
        return data;
    });
}

// ============================================
// FORM FUNCTIONS
// ============================================
export function openorderform() {
    console.log("enter in orderfrom");
    loadItemData();
    editingItemId = null;
    orderItems = []; // Reset order items

    document.getElementById("formTitle").textContent = "Add New Order";
    document.getElementById("staffForm").reset();
    document.getElementById("itemId").value = "";

    // Set current date as default and make it READ-ONLY
    const today = new Date().toISOString().split("T")[0];
    const staffDateInput = document.getElementById("orderDate");
    staffDateInput.value = today;
    staffDateInput.setAttribute('readonly', 'true');
    staffDateInput.style.pointerEvents = 'none'; // Prevent any interaction

    // Set total amount to 0 and make it disabled
    const totalAmountInput = document.getElementById("totalAmount");
    totalAmountInput.value = "0.00";
    totalAmountInput.setAttribute('disabled', 'true');

    // Set delivery type checkbox to checked (Same Day Delivery)
    const deliveryCheckbox = document.getElementById("stafftatus");
    const statusText = document.getElementById("statusText");
    deliveryCheckbox.checked = true;
    statusText.textContent = "Same Day Delivery";

    const modal = document.getElementById("orderFormModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

// ============================================
// RENDER STAFF TABLE WITH PAGINATION
// ============================================
export function renderInventoryOrdersPage() {
    return loadorderData().then(() => generateTableHTML());
}

// Generate table HTML (no client-side slicing now)
function generateTableHTML() {
    const page = currentstaffPage;
    const perPage = staffPerPage;
    const total = staffTotal;
    const totalPages = staffTotalPages || 1;

    let showingFrom = 0;
    let showingTo = 0;

    if (total > 0) {
        showingFrom = (page - 1) * perPage + 1;
        showingTo = Math.min(page * perPage, total);
    }

    let tableRows = "";
    for (let index = 0; index < orderData.length; index++) {
        const serialNo = (page - 1) * perPage + index + 1;

        let order = orderData[index];
        tableRows += `
            <tr>
                <td>${serialNo}</td>
                <td>${order.total_amount}</td>
                <td>${order.delivery_type}</td>
                <td>${order.status}</td>
                <td>${order.notes || 'NA'}</td>
            </tr>
        `;
    }

    const currentDate = new Date().toISOString().split("T")[0];

    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>Order Management</h2>
                <input type="date" id="btnDate" value="${currentDate}" onchange="refreshOrdersTable()"/>
                <button class="btn-add" onclick="openorderform()">Add Order</button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Amount</th>
                            <th>Delivery Type</th>
                            <th>Status</th>
                            <th>Notes</th>
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

        <!-- order Form Modal -->
        <div id="orderFormModal" class="modal">
            <div class="modal-content modal-responsive">
                <div class="modal-header">
                    <h3 id="formTitle">Add New Order</h3>
                    <button class="close-btn" onclick="closeorderForm()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="staffForm" onsubmit="submitstaffForm(event)" class="form-responsive">
                        <input type="hidden" id="itemId">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="orderDate">Date <span class="required">*</span></label>
                                <input type="date" id="orderDate" readonly style="pointer-events: none;">
                            </div>
 
                            <div class="form-group">
                                <label for="totalAmount">Total Amount <span class="required">*</span></label>
                                <input type="number" id="totalAmount" disabled value="0.00" step="0.01">
                            </div>
                        </div>
                        
                        <div class="form-row" id="for-row-other">
                            <ul id="itemList" class="item-list">
                            </ul>
                        </div>
                          <div class="form-row">
                            <div class="form-group">
                                <label for="notes">Notes <span class="required">*</span></label>
                                <input type="textarea" id="notes" readonly >
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group" style="width: 100%;">
                                <label for="stafftatus">Delivery Type</label>
                                <div class="delivery-type-container">
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="stafftatus" checked onchange="updateDeliveryStatusText()">
                                        <span class="slider"></span>
                                    </label>
                                    <span id="statusText" class="delivery-status-text">Same Day Delivery</span>
                                </div>
                            </div>
                        </div>

                        <div class="form-actions" id="formActions">
                            <button type="button" class="btn-cancel" id="cancelBtn" onclick="closestaffForm()">Cancel</button>
                            <button type="submit" class="btn-submit" id="submitBtn">Place Order</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// LOAD ITEMS DATA
// ============================================
async function loadItemData() {
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

    const url = `${itemURLphp}?user_id=${currentUser.id}&status=enable`;

    return getItemsData(url).then(data => {
        itemsData = data.items || [];
        let itemsTotal = data.total ?? itemsData.length;
        renderItemsData(itemsData);
    });
}

// ============================================
// CALCULATE ITEM TOTAL - YOUR ORIGINAL LOGIC PRESERVED
// ============================================
export function calculateItemTotal(itemId) {
    const priceInput = document.getElementById(`price_${itemId}`).textContent;
    const quantityInput = document.getElementById(`quantity_${itemId}`).value;
    const totalInput = document.getElementById(`total_${itemId}`);
    let total = priceInput * quantityInput;
    totalInput.value = total.toFixed(2);
    calculateOrderTotal();

    let item = itemsData.find(i => String(i.id) === String(itemId));
    if (item && quantityInput > 0) {
        let data = {
            item_id: itemId,
            name: item.name,
            qty: quantityInput,
            price: priceInput,
            line_total: total.toFixed(2)
        }

        // Check if item already exists in orderItems
        const existingIndex = orderItems.findIndex(i => String(i.id) === String(itemId));
        if (existingIndex !== -1) {
            // Update existing item
            orderItems[existingIndex] = data;
        } else {
            // Add new item
            orderItems.push(data);
        }
    }

    if (quantityInput == 0) {
        orderItems = orderItems.filter(i => String(i.id) !== String(itemId));
    }

    console.log(orderItems);
}

// ============================================
// CALCULATE ORDER TOTAL - YOUR ORIGINAL LOGIC PRESERVED
// ============================================
export function calculateOrderTotal() {
    let total = 0;
    for (let index = 0; index < itemsData.length; index++) {
        let item = itemsData[index];
        const totalInput = document.getElementById(`total_${item.id}`);
        const itemTotal = parseFloat(totalInput.value) || 0;
        total += itemTotal;
    }
    const orderTotalInput = document.getElementById("totalAmount");
    orderTotalInput.value = total.toFixed(2);
}

// ============================================
// RENDER ITEMS DATA - YOUR ORIGINAL LOGIC PRESERVED
// ============================================
async function renderItemsData(itemData) {
    let tableRows = "";
    for (let index = 0; index < itemData.length; index++) {
        const serialNo = index + 1;
        let item = itemData[index];

        tableRows += `
            <tr>
                <td>${serialNo}</td>
                <td>${item.name}</td>
                <td id="price_${item.id}">${item.price}</td>
                <td><input type="number" id="quantity_${item.id}" onchange="calculateItemTotal('${item.id}')" value="0" min="0" step="1" placeholder="Quantity"></td>
                <td><input type="number" id="total_${item.id}" disabled value="0.00" step="0.01" placeholder="Total"></td>
            </tr>
        `;
    }
    let items = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Sr No</th>
                        <th>Item Name</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows || `<tr><td colspan="5" style="text-align:center;">No items found</td></tr>`}
                </tbody>
            </table>
        </div>`;

    document.getElementById("itemList").innerHTML = items;
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
        return Promise.resolve();
    }

    return loadorderData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateTableHTML();
        }
    });
}

function changestaffPerPage(value) {
    staffPerPage = parseInt(value, 10) || 10;
    currentstaffPage = 1;

    return loadorderData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateTableHTML();
        }
    });
}

// ============================================
// REFRESH ORDERS TABLE ON DATE CHANGE
// ============================================
function refreshOrdersTable() {
    return loadorderData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateTableHTML();
        }
    });
}

// ============================================
// UPDATE DELIVERY STATUS TEXT
// ============================================
function updateDeliveryStatusText() {
    const deliveryCheckbox = document.getElementById("stafftatus");
    const statusText = document.getElementById("statusText");

    if (deliveryCheckbox && statusText) {
        statusText.textContent = deliveryCheckbox.checked ? "Same Day Delivery" : "Next Day Delivery";
    }
}

// ============================================
// CLOSE FORM
// ============================================
function closestaffForm() {
    const modal = document.getElementById("orderFormModal");
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
    editingItemId = null;
    orderItems = [];
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

        return deleteItemFromAPI(ordersURLphp, id).then(result => {
            if (result) {
                showNotification("Staff deleted successfully!", "success");
                const mainContent = document.getElementById("mainContent");
                if (mainContent) {
                    return loadorderData().then(() => {
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

    const item = orderData.find(i => String(i.id) === String(id));
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

    const modal = document.getElementById("orderFormModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

// ============================================
// SUBMIT FORM
// ============================================
async function submitstaffForm(event) {
    event.preventDefault();
    const date = document.getElementById("orderDate").value.trim();
    const total_amount = document.getElementById("totalAmount").value.trim();
    const deliveryCheckbox = document.getElementById("stafftatus");

    // Validate Name
    if (!date) {
        showNotification("Please select a valid date.", "error");
        return;
    }

    if (!total_amount || isNaN(total_amount) || Number(total_amount) <= 0) {
        showNotification("Please select any item", "error");
        return;
    }

    // Validate at least one item is selected
    if (orderItems.length === 0) {
        showNotification("Please select at least one item with quantity greater than 0.", "error");
        return;
    }

    // Determine delivery type based on checkbox
    const deliveryType = deliveryCheckbox.checked ? "urgent" : "nextday";
    console.log();

    const formData = {
        user_id: user_id,
        expected_delivery: date,
        total_amount: total_amount,
        items: orderItems,
        delivery_type: deliveryType,
        notes: document.getElementById("notes").value || "N/A"
    };

    const mainContent = document.getElementById("mainContent");
    console.log("form data", formData);

    if (editingItemId) {
        return showConfirm(
            "Are you sure you want to update this order?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) {
                return;
            }
            console.log(user_id);

            return updateItem(ordersURLphp, editingItemId, formData, user_id).then(result => {
                console.log(result);

                if (result) {
                    showNotification("Order updated successfully!", "success");
                } else {
                    showNotification(result.detail, "error");
                }

                closestaffForm();
                if (mainContent) {
                    return loadorderData().then(() => {
                        mainContent.innerHTML = generateTableHTML();
                    });
                }
            });
        });
    } else {
        return showConfirm(
            "Are you sure you want to place this order?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) return;

            return addItemToAPI(ordersURLphp, formData).then(result => {
                console.log(result);

                if (result.status === "ok") {
                    showNotification("Order placed successfully!", "success");
                    closestaffForm();

                    if (mainContent) {
                        return loadorderData().then(() => {
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
        return updateItem(ordersURLphp, id, { status: newStatus }, user_id).then(result => {
            if (result) {
                const mainContent = document.getElementById("mainContent");
                if (mainContent) {
                    return loadorderData().then(() => {
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
    const modal = document.getElementById("orderFormModal");
    if (event.target === modal) {
        closestaffForm();
    }
});

// ============================================
// NAVIGATE TO INVENTORY STAFF PAGE WITH STAFF ID
// ============================================
function navigateToInventoryStaff(staffId) {
    localStorage.setItem('selectedStaffId', staffId);

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
window.calculateItemTotal = calculateItemTotal;
window.calculateOrderTotal = calculateOrderTotal;
window.openorderform = openorderform;
window.closestaffForm = closestaffForm;
window.submitstaffForm = submitstaffForm;
window.changestaffPage = changestaffPage;
window.changestaffPerPage = changestaffPerPage;
window.showNotification = showNotification;
window.generateTableHTML = generateTableHTML;
window.showConfirm = showConfirm;
window.navigateToInventoryStaff = navigateToInventoryStaff;
window.refreshOrdersTable = refreshOrdersTable;
window.updateDeliveryStatusText = updateDeliveryStatusText;