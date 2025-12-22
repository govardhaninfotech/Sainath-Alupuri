// ============================================
// ORDERS PAGE - WITH VIEW ORDER DETAILS, USER FILTER & STATUS MANAGEMENT
// ============================================

import { ordersURLphp, itemURLphp, userURLphp } from "../apis/api.js";
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
let usersData = [];
let selectedUserId = null; // For filtering by user

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
const isAdmin = user_id === "22"; // Check if user is admin

if (!user_id) {
    sessionStorage.removeItem("rememberedUser");
    localStorage.removeItem("rememberedUser");
    window.location.replace("../index.html");
}

// ============================================
// LOAD USERS DATA FROM API
// ============================================
async function loadUsersData() {
    try {
        const url = `${userURLphp}?user_id=${user_id}`;
        const data = await getItemsData(url);
        usersData = data.users || [];
        console.log("Users loaded:", usersData);
        return usersData;
    } catch (error) {
        console.error("Error loading users:", error);
        showNotification("Error loading users data!", "error");
        usersData = [];
        return [];
    }
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
    console.log(date);

    const regex = /^\d{4}-\d{2}-\d{2}$/;

    // Build URL with user filter if selected
    let url = `${ordersURLphp}?user_id=${user_id}&date=${date}`;
    if (selectedUserId && selectedUserId !== 'all') {
        url += `&filter_user_id=${selectedUserId}`;
    }

    console.log("Loading orders from URL:", url);

    return getItemsData(url).then(data => {
        console.log("Orders data received:", data);
        orderData = data.orders || [];
        staffTotal = data.total ?? orderData.length;
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
// UPDATE ORDER STATUS
// ============================================
async function updateOrderStatus(orderId, newStatus) {
    try {
        const order = orderData.find(o => String(o.id) === String(orderId));
        if (!order) {
            showNotification("Order not found!", "error");
            return false;
        }

        // Check if reminder_count is 1 (already changed once)
        if (order.reminder_count >= 1) {
            showNotification("Status can only be changed once!", "warning");
            return false;
        }

        const confirmed = await showConfirm(
            `Are you sure you want to change status to ${newStatus.toUpperCase()}?`,
            "warning"
        );

        if (!confirmed) return false;

        const updateUrl = `${ordersURLphp}?order_id=${orderId}`;
        const result = await updateItem(updateUrl, orderId, { status: newStatus }, user_id);

        if (result) {
            showNotification("Order status updated successfully!", "success");
            // Refresh the table
            await refreshOrdersTable();
            return true;
        } else {
            showNotification("Error updating order status!", "error");
            return false;
        }
    } catch (error) {
        console.error("Error updating order status:", error);
        showNotification("Error updating order status!", "error");
        return false;
    }
}

// ============================================
// VIEW ORDER DETAILS
// ============================================
async function viewOrderDetails(orderId) {
    const order = orderData.find(o => String(o.id) === String(orderId));
    if (!order) {
        showNotification("Order not found!", "error");
        return;
    }

    // Fetch order items
    const date = order.expected_delivery.split(" ")[0];
    const orderItemsURL = `https://gisurat.com/govardhan/sainath_aloopuri/api/order_items.php?order_id=${orderId}&date=${date}`;

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
                        <div class="order-info-section">
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
                        </div>

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
                                    <span class="info-label">Shop Code</span>
                                    <span class="info-value">${order.shop_code}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Address</span>
                                    <span class="info-value">${order.address}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Family Member</span>
                                    <span class="info-value">${order.is_family_member === 'True' ? 'Yes' : 'No'}</span>
                                </div>
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
// FORM FUNCTIONS
// ============================================
export async function openorderform(orderId = null) {
    console.log("enter in orderForm");

    editingItemId = orderId;
    orderItems = [];

    document.getElementById("staffForm").reset();
    document.getElementById("itemId").value = "";

    // Set default date
    const today = new Date().toISOString().split("T")[0];
    const staffDateInput = document.getElementById("orderDate");
    staffDateInput.value = today;
    staffDateInput.setAttribute('readonly', 'true');

    const totalAmountInput = document.getElementById("totalAmount");
    totalAmountInput.value = "0.00";
    totalAmountInput.disabled = true;

    const deliveryCheckbox = document.getElementById("stafftatus");
    const statusText = document.getElementById("statusText");

    // ============================================
    // CASE 1 — ADD NEW ORDER
    // ============================================
    if (!orderId) {
        document.getElementById("formTitle").textContent = "Add New Order";

        // Load all items for selecting new
        await loadItemData();

        showFormModal();
        return;
    }

    // ============================================
    // CASE 2 — EDIT ORDER (Load Ordered Items Only)
    // ============================================
    document.getElementById("formTitle").textContent = "Edit Order";

    const order = orderData.find(o => String(o.id) === String(orderId));
    if (!order) {
        showNotification("Order not found!", "error");
        return;
    }

    // 1. Set Date
    staffDateInput.value = order.expected_delivery.split(" ")[0];

    // 2. Set Delivery Type
    deliveryCheckbox.checked = order.delivery_type === "urgent";
    statusText.textContent = deliveryCheckbox.checked
        ? "Same Day Delivery"
        : "Next Day Delivery";

    // 3. Notes
    document.getElementById("notes").value = order.notes || "";

    // 4. Load only ordered items
    let date = staffDateInput.value;
    let url = `${orderItemsURLphp}?order_id=${orderId}&date=${date}`;

    console.log("Loading ordered items from:", url);

    let orderedData = await getItemsData(url);
    let orderedItems = orderedData.items || [];

    // Save into global orderItems (used in submit)
    orderItems = orderedItems.map(i => ({
        item_id: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
        line_total: i.line_total
    }));

    // Render order items in form
    renderOnlyOrderedItems(orderedItems);

    // Calculate total
    let total = orderedItems.reduce((sum, i) => sum + parseFloat(i.line_total), 0);
    totalAmountInput.value = total.toFixed(2);

    showFormModal();
}

// ============================================
// HANDLE USER FILTER CHANGE
// ============================================
async function handleUserFilterChange() {
    const userSelect = document.getElementById("userFilter");
    if (!userSelect) return;

    selectedUserId = userSelect.value;
    console.log("User filter changed to:", selectedUserId);

    // Reset to first page when filtering
    currentstaffPage = 1;

    // Reload orders with filter
    await refreshOrdersTable();
}

// ============================================
// HANDLE STATUS CHANGE
// ============================================
export async function handleStatusChange(orderId, selectElement) {
    const newStatus = selectElement.value;
    const order = orderData.find(o => String(o.id) === String(orderId));

    if (!order) return;

    if (newStatus !== order.status) {

        const confirmed = await showConfirm(
            `Are you sure you want to change status to ${newStatus.toUpperCase()}?`,
            "warning"
        );

        // If user pressed Cancel — revert dropdown back to old status
        if (!confirmed) {
            selectElement.value = order.status;
            return;
        }

        const success = await updateOrderStatus(orderId, newStatus);

        if (success) {
            showNotification("Order status updated successfully!", "success");
        } else {
            showNotification("Error updating order!", "error");
            selectElement.value = order.status;
        }
    }
}


// ============================================
// RENDER STAFF TABLE WITH PAGINATION
// ============================================
export async function renderInventoryOrdersPage() {
    // Load users first if admin
    if (isAdmin) {
        await loadUsersData();
    }
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

    // Generate user filter dropdown (only for admin)
    let userFilterHTML = '';
    if (isAdmin && usersData.length > 0) {
        let userOptions = '<option value="all">All Users</option>';
        usersData.forEach(user => {
            const selected = selectedUserId === String(user.id) ? 'selected' : '';
            userOptions += `<option value="${user.id}" ${selected}>${user.name}</option>`;
        });

        userFilterHTML = `
            <div class="filter-group">
                <label for="userFilter" style="margin-right: 8px; font-weight: 500;">Filter by User:</label>
                <select id="userFilter" onchange="handleUserFilterChange()" style="padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    ${userOptions}
                </select>
            </div>
        `;
    }

    let tableRows = "";
    if (orderData.length === 0) {
        tableRows = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #9ca3af;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
                    <div style="font-size: 16px; font-weight: 600; color: #6b7280;">No orders found for this date</div>
                    <div style="font-size: 14px; color: #9ca3af; margin-top: 8px;">Try selecting a different date or add a new order</div>
                </td>
            </tr>
        `;
    } else {
        for (let index = 0; index < orderData.length; index++) {
            const serialNo = (page - 1) * perPage + index + 1;
            let order = orderData[index];

            // Check if status can be changed (reminder_count < 1)
            const canChangeStatus = (order.reminder_count || 0) < 1;
            const statusDisabled = !canChangeStatus ? 'disabled' : '';
            const statusStyle = !canChangeStatus ? 'style="opacity: 0.6; cursor: not-allowed;"' : '';

            // Status dropdown
            const statusOptions = ['placed', 'accepted', 'rejected'];
            let statusDropdown = `<select class="status-select" ${statusDisabled} ${statusStyle} onchange="handleStatusChange(${order.id}, this)">`;
            statusOptions.forEach(status => {
                const selected = order.status.toLowerCase() === status ? 'selected' : '';
                statusDropdown += `<option value="${status}" ${selected}>${status.toUpperCase()}</option>`;
            });
            statusDropdown += `</select>`;

            tableRows += `
                <tr>
                    <td><a href="javascript:void(0)" class="order-link" onclick="viewOrderDetails(${order.id})">${serialNo}</a></td>
                    <td>₹${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td>${order.delivery_type === 'urgent' ? 'Same Day' : 'Next Day'}</td>
                    <td>${statusDropdown}</td>
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
                <select id="clientFilter" 
                    onchange="handleClientFilterChange()" 
                    style="padding: 10px 12px; border: 2px solid #667eea; border-radius: 6px; font-size: 14px;">
                    <option value="all">All Clients</option>
                    ${usersData.map(u => `
                    <option value="${u.id}" ${selectedClientId === String(u.id) ? 'selected' : ''}>${u.name}</option>
                    `).join('')}
                </select>

                    ${userFilterHTML}
                    <input type="date" id="btnDate" value="${currentDate}" onchange="refreshOrdersTable()"/>
                </div>
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

        <style>
            .filter-group {
                display: flex;
                align-items: center;
            }

            .status-select {
                padding: 6px 10px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                background-color: white;
                cursor: pointer;
                transition: all 0.2s;
            }

            .status-select:not(:disabled):hover {
                border-color: #667eea;
                background-color: #f9fafb;
            }

            .status-select:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .status-select option {
                padding: 8px;
            }

            .staff-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
            }

            .staff-header > div {
                display: flex;
                gap: 12px;
            }
        </style>
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

function renderOnlyOrderedItems(items) {
    let rows = "";

    items.forEach((item, index) => {
        rows += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td id="price_${item.id}">${item.price}</td>
                <td><input type="number" id="quantity_${item.id}" 
                    value="${item.qty}" min="0" 
                    onchange="calculateItemTotal('${item.id}')"></td>
                <td><input type="number" id="total_${item.id}" 
                    value="${item.line_total}" disabled></td>
            </tr>`;
    });

    document.getElementById("itemList").innerHTML = `
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
                ${rows}
            </tbody>
        </table>`;
}

function showFormModal() {
    const modal = document.getElementById("orderFormModal");
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("show"), 10);
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
            mainContent.innerHTML = generateTableHTML();
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
        return updateItem(orderItemsURLphp, id, { status: newStatus }, user_id).then(result => {
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
window.viewOrderDetails = viewOrderDetails;
window.closeViewOrderModal = closeViewOrderModal;
window.handleStatusChange = handleStatusChange;