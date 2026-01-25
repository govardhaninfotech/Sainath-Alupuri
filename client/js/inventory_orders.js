// ============================================
// ORDERS PAGE - WITH DATE RANGE FILTER
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
let staffPerPage = 15;
let staffTotal = 0;
let staffTotalPages = 1;
let currentStartDate = null;
let currentEndDate = null;
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
// LOAD ORDER DATA FROM API (WITH DATE RANGE)
// ============================================
function loadorderData() {
    let startDate = "";
    let endDate = "";

    const startDateEle = document.querySelector("#startDate");
    const endDateEle = document.querySelector("#endDate");

    if (startDateEle == null || endDateEle == null) {
        // Default to today if elements don't exist
        const today = new Date().toISOString().split("T")[0];
        startDate = today;
        endDate = today;
    } else {
        startDate = startDateEle.value || new Date().toISOString().split("T")[0];
        endDate = endDateEle.value || new Date().toISOString().split("T")[0];
    }

    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
        showNotification("Start date cannot be after end date!", "error");
        return Promise.resolve({ orders: [], total: 0 });
    }

    console.log("Loading orders from:", startDate, "to:", endDate);

    const url = `${ordersURLphp}?user_id=${user_id}&start_date=${startDate}&end_date=${endDate}`;
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
// VIEW ORDER DETAILS
// ============================================
async function viewOrderDetails(orderId) {
    const order = orderData.find(o => String(o.id) === String(orderId));
    if (!order) {
        showNotification("Order not found!", "error");
        return;
    }

    // Fetch order items using orderItemsURLphp
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
    // Generate items table - ONLY showing ordered items (from orderItemsList, not all items)
    console.log(order)
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
        itemsTableHTML = `<tr><td colspan="5" style="text-align:center; color: #9ca3af; padding: 40px;">No items found in this order</td></tr>`;
    }

    const modalHTML = `
        <div id="viewOrderModal" class="modal show" style="display: flex;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>Order Details - ${order.order_no}</h3>
                    <span class="info-value">${formatDateTime(order.placed_at)}</span>
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
                        <!-- <div class="order-info-section">
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
                                    <span class="info-value">${order.email || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Shop Code</span>
                                    <span class="info-value">${order.shop_code || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Address</span>
                                    <span class="info-value">${order.address || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Family Member</span>
                                    <span class="info-value">${order.is_family_member === 'True' ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                        </div> -->

                        <!-- Order Items Section - Shows ONLY ordered items -->
                        <div class="order-info-section">
                            <h4 class="section-title">Order Items (${orderItemsList.length} ${orderItemsList.length === 1 ? 'item' : 'items'})</h4>
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
                                    ${orderItemsList.length > 0 ? `
                                    <tfoot>
                                        <tr class="total-row">
                                            <td colspan="4" style="text-align: right; font-weight: 700; font-size: 15px; padding: 16px;">Grand Total:</td>
                                            <td style="text-align: right; font-weight: 700; color: #667eea; font-size: 18px; padding: 16px;">₹${parseFloat(order.total_amount).toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                    ` : ''}
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
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
// VALIDATE DATE RANGE
// ============================================
function validateDateRange() {
    const startDateEle = document.getElementById("startDate");
    const endDateEle = document.getElementById("endDate");

    if (!startDateEle || !endDateEle) {
        return false;
    }

    const startDate = startDateEle.value;
    const endDate = endDateEle.value;

    // Validation 1: Check if both dates are selected
    if (!startDate || !endDate) {
        showNotification("Please select both start and end dates!", "error");
        return false;
    }

    // Validation 2: Check if start date is before end date
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (startDateObj > endDateObj) {
        showNotification("Start date cannot be after end date. Please correct the date range.", "error");
        // Reset end date to start date
        endDateEle.value = startDate;
        return false;
    }

    // Validation 3: Check if date range is too large (max 90 days)
    const daysDiff = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
        showNotification("Date range cannot exceed 90 days! Please select a smaller range.", "warning");
        return false;
    }

    // Validation 4: Prevent selecting dates in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (endDateObj > today) {
        showNotification("End date cannot be in the future!", "error");
        endDateEle.value = today.toISOString().split('T')[0];
        return false;
    }

    return true;
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
    if (orderData.length === 0) {
        tableRows = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #9ca3af;">
                    <div style="font-size: 48px; margin-bottom: 16px;">ðŸ“¦</div>
                    <div style="font-size: 16px; font-weight: 600; color: #6b7280;">No orders found for this date range</div>
                    <div style="font-size: 14px; color: #9ca3af; margin-top: 8px;">Try selecting a different date range or add a new order</div>
                </td>
            </tr>
        `;
    } else {
        for (let index = 0; index < orderData.length; index++) {
            const serialNo = (page - 1) * perPage + index + 1;

            let order = orderData[index];
            tableRows += `
                <tr>
                    <td><a href="javascript:void(0)" class="order-link" onclick="viewOrderDetails(${order.id})">${serialNo}</a></td>
                    <td><a href="javascript:void(0)" class="order-link" onclick="viewOrderDetails(${order.id})">${order.order_no}</a></td>
                    <td>${formatDate(order.expected_delivery)}</td>
                    <td>₹${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td>${order.delivery_type === 'urgent' ? 'Same Day' : 'Next Day'}</td>
                    <td><span class="inv-status-badge inv-status-${order.status.toLowerCase()}">${order.status.toUpperCase()}</span></td>
                    <td>${order.notes || 'N/A'}</td>
                </tr>
            `;
        }
    }

    // Set default dates if not set
    if (currentStartDate == null || currentEndDate == null) {
        const today = new Date().toISOString().split("T")[0];
        currentStartDate = today;
        currentEndDate = today;
    }

    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>Order Management</h2>
                
                <!-- Date Range Filter Section -->
                <div class="filter-section">
                    <div class="filter-container">
                        <div class="date-input-group">
                            <label for="startDate">From Date:</label>
                            <input type="date" id="startDate" value="${currentStartDate}" max="" required/>
                        </div>
                        <div class="date-input-group">
                            <label for="endDate">To Date:</label>
                            <input type="date" id="endDate" value="${currentEndDate}" max="" required/>
                        </div>
                        <button class="btn-filter" onclick="validateAndRefreshOrders()">Apply Filter</button>
                    </div>
                </div>
                
                <button class="btn-add" onclick="openorderform()">+ Add Order</button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Order No</th>
                            <th>Delivery Date</th>
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
                    <form id="staffForm" onsubmit="submitOrderForm (event)" class="form-responsive">
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
                                <label for="notes">Notes</label>
                                <textarea id="notes" rows="3" placeholder="Add any additional notes..."></textarea>
                            </div>
                        </div>
                      

                        <div class="form-actions" id="formActions">
                            <button type="button" class="btn-cancel" id="cancelBtn" onclick="closeOrderForm()">Cancel</button>
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
// CALCULATE ITEM TOTAL
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
        const existingIndex = orderItems.findIndex(i => String(i.item_id) === String(itemId));
        if (existingIndex !== -1) {
            // Update existing item
            orderItems[existingIndex] = data;
        } else {
            // Add new item
            orderItems.push(data);
        }
    }

    if (quantityInput == 0) {
        orderItems = orderItems.filter(i => String(i.item_id) !== String(itemId));
    }

    console.log(orderItems);
}

// ============================================
// CALCULATE ORDER TOTAL
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
// RENDER ITEMS DATA
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
// VALIDATE AND REFRESH ON DATE CHANGE
// ============================================
function validateAndRefreshOrders() {
    if (validateDateRange()) {
        refreshOrdersTable();
    }
}

// ============================================
// REFRESH ORDERS TABLE ON DATE RANGE CHANGE
// ============================================
function refreshOrdersTable() {
    console.log("Refreshing orders table...");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");

    if (startDateInput && endDateInput) {
        currentStartDate = startDateInput.value;
        currentEndDate = endDateInput.value;
        console.log("Selected date range:", currentStartDate, "to", currentEndDate);

        // Validate before loading
        if (!validateDateRange()) {
            return Promise.resolve();
        }
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
// CLOSE FORM
// ============================================
function closeOrderForm() {
    const modal = document.getElementById("orderFormModal");
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
    editingItemId = null;
    orderItems = [];
}

// ============================================
// CLOSE ORDER FORM (ALIAS)
// ============================================
function closeorderForm() {
    closeOrderForm();
}

// ============================================
// DELETE STAFF FUNCTION WITH CONFIRMATION
// ============================================
function deletestaff(id) {
    return showConfirm(
        "Are you sure you want to delete this order?",
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        return deleteItemFromAPI(ordersURLphp, id).then(result => {
            if (result) {
                showNotification("Order deleted successfully!", "success");
                const mainContent = document.getElementById("mainContent");
                if (mainContent) {
                    return loadorderData().then(() => {
                        mainContent.innerHTML = generateTableHTML();
                    });
                }
            } else {
                showNotification("Error deleting order!", "error");
            }
        });
    });
}

// ============================================
// VALIDATE TIME RANGE (11 AM - 8 PM)
// ============================================
function validateOrderTimeRange() {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();

    // Check if current time is between 11 AM (11:00) and 8 PM (20:00)
    const isWithinTimeRange = (currentHour >= 11 && currentHour < 20);

    if (!isWithinTimeRange) {
        return {
            error: true,
            status: 'error',
            message: 'Orders are only accepted between 11 AM and 8 PM.'
        };
    }

    return {
        error: false,
        status: 'success',
        message: 'Order time is valid.'
    };
}

// ============================================
// SUBMIT FORM
// ============================================
async function submitOrderForm(event) {
    event.preventDefault();
    const date = document.getElementById("orderDate").value.trim();
    const total_amount = document.getElementById("totalAmount").value.trim();
    const deliveryCheckbox = document.getElementById("stafftatus");

    // Validate time range (11 AM - 8 PM)
    const timeValidation = validateOrderTimeRange();
    if (timeValidation.error) {
        showNotification(timeValidation.message, "error");
        return;
    }

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

    const formData = {
        user_id: user_id,
        expected_delivery: date,
        total_amount: total_amount,
        items: orderItems,
        delivery_type: "Next Day Delivery",
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

            return updateItem(ordersURLphp, editingItemId, formData, user_id).then(result => {
                console.log(result);

                if (result) {
                    showNotification("Order updated successfully!", "success");
                } else {
                    showNotification(result.detail, "error");
                }

                closeOrderForm();
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
                    closeOrderForm();

                    if (mainContent) {
                        return loadorderData().then(() => {
                            mainContent.innerHTML = generateTableHTML();
                        });
                    }
                } else {
                    showNotification(result.message, "error");
                }
            });
        });
    }
}

// Close modal when clicking outside
window.addEventListener("click", function (event) {
    const addOrderModal = document.getElementById("orderFormModal");
    const viewOrderModal = document.getElementById("viewOrderModal");

    if (event.target === addOrderModal) {
        closeOrderForm();
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
window.deletestaff = deletestaff;
window.calculateItemTotal = calculateItemTotal;
window.calculateOrderTotal = calculateOrderTotal;
window.openorderform = openorderform;
window.closeOrderForm = closeOrderForm;
window.closeorderForm = closeorderForm;
window.submitOrderForm = submitOrderForm;
window.changestaffPage = changestaffPage;
window.changestaffPerPage = changestaffPerPage;
window.showNotification = showNotification;
window.generateTableHTML = generateTableHTML;
window.showConfirm = showConfirm;
window.navigateToInventoryStaff = navigateToInventoryStaff;
window.refreshOrdersTable = refreshOrdersTable;
window.viewOrderDetails = viewOrderDetails;
window.closeViewOrderModal = closeViewOrderModal;
window.validateDateRange = validateDateRange;
window.validateAndRefreshOrders = validateAndRefreshOrders;
window.validateOrderTimeRange = validateOrderTimeRange;