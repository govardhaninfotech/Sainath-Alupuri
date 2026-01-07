// ============================================
// ORDERS PAGE - WITH VIEW ORDER DETAILS, USER FILTER & STATUS MANAGEMENT
// ============================================

import { ordersURLphp, itemURLphp, orderItemsURLphp } from "../apis/api.js";
import {
    getItemsData,
    updateItem,
    deleteItemFromAPI,
    addItemToAPI
} from "../apis/master_api.js";
import { showNotification, showConfirm } from "./notification.js";
import {
  
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
let currentDate = null
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
        date = dateEle.value || new Date().toISOString().split("T")[0];
    }
    console.log("Loading orders for date:", date);

    // Build URL with date filter only
    let url = `${ordersURLphp}?user_id=${user_id}&date=${date}`;

    console.log("Loading orders from URL:", url);

    return getItemsData(url).then(data => {
        console.log("Orders data received:", data);
        orderData = data.orders || [];

        // Filter only accepted orders
        orderData = orderData.filter(order => order.status === 'accepted');

        console.log("Filtered accepted orders:", orderData.length);
        staffTotal = orderData.length;
        staffTotalPages = Math.ceil(staffTotal / staffPerPage);
        return data;
    }).catch(error => {
        console.error("Error loading orders:", error);
        showNotification("Error loading orders data!", "error");
        orderData = [];
        staffTotal = 0;
        staffTotalPages = 1;
        return { orders: [], total: 0 };
    });
}

// ============================================
// UPDATE ORDER STATUS - REMOVED (all orders set to accepted)
// ============================================
// Status management removed - all orders are accepted only

// ============================================
// VIEW ORDER DETAILS
// ============================================
async function viewClientOrderDetails(orderId) {
    const order = orderData.find(o => String(o.id) === String(orderId));
    if (!order) {
        showNotification("Order not found!", "error");
        return;
    }

    // Fetch order items
    const date = order.expected_delivery.split(" ")[0];
    const orderItemsURL = `${orderItemsURLphp}?order_id=${orderId}&date=${date}`;

    try {
        const itemsData = await getItemsData(orderItemsURL);
        const orderItemsList = itemsData.items || [];

        displayOrderDetailsModal(order, orderItemsList);
    } catch (error) {
        console.error("Error fetching order items:", error);
        showNotification("Error loading order items!", "error");
    }
}

function displayOrderDetailsModal(order, orderItemsList) {
    // Generate items table
    let itemsTableHTML = "";
    if (orderItemsList.length > 0) {
        orderItemsList.forEach((item, index) => {
            itemsTableHTML += `
                <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td>${item.name}</td>
                    <td style="text-align: center;">${item.qty}</td>
                    <td style="text-align: right;">₹${parseFloat(item.price).toFixed(2)}</td>
                    <td style="text-align: right; font-weight: 600;">₹${parseFloat(item.line_total).toFixed(2)}</td>
                </tr>
            `;
        });
    } else {
        itemsTableHTML = `<tr><td colspan="5" style="text-align:center; color: #9ca3af; padding: 40px;">No items found</td></tr>`;
    }

    const modalHTML = `
        <div id="viewOrderModal" class="modal show" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>Order Details - ${order.order_no}</h3>
                    <button class="close-btn" onclick="closeViewOrderModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="order-details-container">
                        <!-- Order Information Section -->
                       <!-- <div class="order-info-section">
                            <h4 class="section-title">Order Information</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">Order Number</span>
                                    <span class="info-value order-number">${order.order_no}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Order Date</span>
                                    <span class="info-value">${formatDateTime(order.placed_at)}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Expected Delivery</span>
                                    <span class="info-value">${formatDate(order.expected_delivery)}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Status</span>
                                    <span class="info-value">
                                        <span class="inv-status-badge inv-status-${order.status.toLowerCase()}">${order.status.toUpperCase()}</span>
                                    </span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Delivery Type</span>
                                    <span class="info-value">${order.delivery_type === 'urgent' ? 'Same Day Delivery' : 'Next Day Delivery'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Total Amount</span>
                                    <span class="info-value" style="font-weight: 700; color: #667eea; font-size: 16px;">₹${parseFloat(order.total_amount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div> -->

                        <!-- Customer Information Section -->
                        <div class="order-info-section">
                            <h4 class="section-title">Customer Information</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">Name</span>
                                    <span class="info-value">${order.name}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Mobile</span>
                                    <span class="info-value">${order.mobile}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Email</span>
                                    <span class="info-value">${order.email}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Address</span>
                                    <span class="info-value">${order.address}</span>
                                </div>
                               <!-- <div class="info-item">
                                    <span class="info-label">Shop Code</span>
                                    <span class="info-value">${order.shop_code}</span>
                                </div>
                                <div class="info-item">
                                <span class="info-label">Family Member</span>
                                <span class="info-value">${order.is_family_member === 'True' ? 'Yes' : 'No'}</span>
                                </div> -->
                            </div>
                        </div>

                        <!-- Order Items Section -->
                        <div class="order-info-section">
                            <h4 class="section-title">Order Items</h4>
                            <div class="order-items-table-wrapper">
                                <table class="order-items-table">
                                    <thead>
                                        <tr>
                                            <th style="text-align: center; width: 80px;">Sr No</th>
                                            <th style="text-align: left;">Item Name</th>
                                            <th style="text-align: center; width: 100px;">Quantity</th>
                                            <th style="text-align: right; width: 120px;">Price</th>
                                            <th style="text-align: right; width: 120px;">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsTableHTML}
                                    </tbody>
                                    <tfoot>
                                        <tr class="total-row">
                                            <td colspan="4" style="text-align: right; font-weight: 700; font-size: 15px; padding: 16px;">Grand Total:</td>
                                            <td style="text-align: right; font-weight: 700; color: #667eea; font-size: 18px; padding: 16px;">₹${parseFloat(order.total_amount).toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById("viewOrderModal");
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeViewOrderModal() {
    const modal = document.getElementById("viewOrderModal");
    if (modal) {
        modal.classList.remove("show");
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}



// ============================================
// RENDER STAFF TABLE WITH PAGINATION
// ============================================
export async function renderInventoryOrdersPage() {
    return loadorderData().then(() => generateOrderTableHTML());
}

// Generate table HTML (no client-side slicing now)
function generateOrderTableHTML() {
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
    if (orderData.length === 0) {
        tableRows = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #9ca3af;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
                    <div style="font-size: 16px; font-weight: 600; color: #6b7280;">No accepted orders for this date</div>
                    <div style="font-size: 14px; color: #9ca3af; margin-top: 8px;">Try selecting a different date</div>
                </td>
            </tr>
        `;
    } else {
        for (let index = 0; index < orderData.length; index++) {
            const serialNo = (page - 1) * perPage + index + 1;
            let order = orderData[index];

            tableRows += `
                <tr>
                    <td><a href="javascript:void(0)" class="order-link" onclick="viewClientOrderDetails(${order.id})">${serialNo}</a></td>
                    <td>${order.name}</td>
                    <td>₹${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td>${order.delivery_type === 'urgent' ? 'Same Day' : 'Next Day'}</td>
                    <td>${order.notes || 'N/A'}</td>
                </tr>
            `;
        }
    }

    if (currentDate == null) {
        currentDate = new Date().toISOString().split("T")[0];
    }

    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>Order Management</h2>
            <div style="display: flex; gap: 12px; align-items: center;">
                    <input type="date" id="btnDate" value="${currentDate}" onchange="refreshOrdersTable()"/>
                </div>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Customer Name</th>
                            <th>Amount</th>
                            <th>Delivery Type</th>
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
    `;
}


// ============================================
// LOAD ITEMS DATA
// ============================================
async function loadOrderData() {
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
            mainContent.innerHTML = generateOrderTableHTML();
        }
    });
}

function changestaffPerPage(value) {
    staffPerPage = parseInt(value, 10) || 10;
    currentstaffPage = 1;

    return loadorderData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateOrderTableHTML();
        }
    });
}

//

// ============================================
// REFRESH ORDERS TABLE ON DATE CHANGE
// ============================================
function refreshOrdersTable() {
    console.log("Refreshing orders table...");
    const dateInput = document.getElementById("btnDate");
    if (dateInput) {
        console.log("Selected date:", dateInput.value);
        currentDate = dateInput.value;
    }
    // Reset to first page when filtering
    currentstaffPage = 1;

    return loadorderData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateOrderTableHTML();
            console.log("Table refreshed with orders:", orderData.length);
        }
    }).catch(error => {
        console.error("Error refreshing table:", error);
        showNotification("Error refreshing orders!", "error");
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
                        mainContent.innerHTML = generateOrderTableHTML();
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
                        mainContent.innerHTML = generateOrderTableHTML();
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
                            mainContent.innerHTML = generateOrderTableHTML();
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
        return updateItem(orderItemsURLphp, id, { status: newStatus }, user_id).then(result => {
            if (result) {
                const mainContent = document.getElementById("mainContent");
                if (mainContent) {
                    return loadorderData().then(() => {
                        mainContent.innerHTML = generateOrderTableHTML();
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
    const addOrderModal = document.getElementById("orderFormModal");
    const viewOrderModal = document.getElementById("viewOrderModal");

    if (event.target === addOrderModal) {
        closestaffForm();
    }
    if (event.target === viewOrderModal) {
        closeViewOrderModal();
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

window.changestaffPage = changestaffPage;
window.changestaffPerPage = changestaffPerPage;
window.showNotification = showNotification;
window.generateOrderTableHTML = generateOrderTableHTML;
window.showConfirm = showConfirm;
window.refreshOrdersTable = refreshOrdersTable;
window.updateDeliveryStatusText = updateDeliveryStatusText;
window.viewClientOrderDetails = viewClientOrderDetails;
window.closeViewOrderModal = closeViewOrderModal;