// ============================================
// ORDERS PAGE - WITH VIEW ORDER DETAILS
// ============================================

import { ordersURLphp, itemURLphp, orderItemsURLphp, currentStockURLphp } from "../apis/api.js";
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
// LOAD current stock DATA FROM API (SERVER PAGINATION)
// ============================================
function loadorderData() {

    const url = `${currentStockURLphp}?user_id=${user_id}&allow_stock_adjustment=true`;
    console.log(url);
    
    return getItemsData(url).then(data => {
        console.log(data);
        
        orderData = data.items || [];
        staffTotal = orderData.total ?? orderData.length;
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
// VIEW ORDER DETAILS -- need to delete
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
                        </div>

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
// function formatDate(dateString) {
//     if (!dateString) return 'N/A';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
// }

// function formatDateTime(dateString) {
//     if (!dateString) return 'N/A';
//     const date = new Date(dateString);
//     return date.toLocaleString('en-GB', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//     });
// }

// ============================================
// Add new stock Form
// ============================================ 
export function opencurrstockform() {
    console.log("enter in orderfrom");

    renderItemsData(orderData);
    editingItemId = null;
    orderItems = []; // Reset order items

    document.getElementById("formTitle").textContent = "Add New Stock";
    document.getElementById("staffForm").reset();
    document.getElementById("itemId").value = "";


    const modal = document.getElementById("openCurrStockModel");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

// ============================================
// RENDER STAFF TABLE WITH PAGINATION
// ============================================
export function renderCurrentStockPage() {
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

            let item = orderData[index];

            tableRows += `
                <tr>
                    <td>${serialNo}</td>
                    <td>${item.name}</td>
                    <td>${item.current_stock}</td>
                    <td>${item.unit}</td>
                </tr>
            `;
        }
    }


    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>Items Stock</h2>
                <button class="btn-add" onclick="opencurrstockform()">Add Stock</button>
            </div>
            
            <div class="table-container" style="margin: 0px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Item Name</th>
                            <th>Current Stock</th>
                            <th>Unit</th>
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
        <div id="openCurrStockModel" class="modal">
            <div class="modal-content modal-responsive">
                <div class="modal-header">
                    <h3 id="formTitle">Add New Stock</h3>
                    <button class="close-btn" onclick="closeCurrentStockForm()">&times;</button>
                </div>
                <div class="modal-body">
                    <label for="modalToggle"  style="color: red;">* Quantity must be in Positive or Greater than 0</label>

                    <form id="staffForm" onsubmit="submitStockForm(event)" class="form-responsive">
                        <input type="hidden" id="itemId">

                        <div class="form-row" id="for-row-other">
                            <ul id="itemList" class="item-list">
                            </ul>
                        </div>
                        
                        <div class="form-actions" id="formActions">
                            <button type="button" class="btn-cancel" id="cancelBtn" onclick="closeCurrentStockForm()">Cancel</button>
                            <button type="submit" class="btn-submit" id="submitBtn">Add Stocks</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}


// ============================================
// Fetch the new quantity and calculate total stock 
// ============================================
export function calculateItemTotal(itemId) {

    const existing_qty_Input = document.getElementById(`existing_qty_${itemId}`).textContent;
    const new_qty_Input = document.getElementById(`new_qty_${itemId}`).value;
    const totalInput = document.getElementById(`total_${itemId}`);
    let total = parseFloat(existing_qty_Input) + parseFloat(new_qty_Input);
    totalInput.value = total.toFixed(2);
    // calculateOrderTotal();
    if (new_qty_Input < 0) {
        showNotification("Quantity cannot be negative!", "error");
        return;
    }
    let item = orderData.find(i => String(i.item_id) === String(itemId));
    if (item && new_qty_Input > 0) {
        let data = {
            item_id: itemId,
            name: item.name,
            qty: new_qty_Input,
            'reason': 'Stock Update',
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

    if (new_qty_Input == 0) {
        orderItems = orderItems.filter(i => String(i.item_id) !== String(itemId));
    }

}


// ============================================
// RENDER ITEMS DATA with existing quantities and ask for new stocks 
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
                <td id="existing_qty_${item.item_id}">${item.current_stock}</td>
                <td><input type="number" id="new_qty_${item.item_id}" onchange="calculateItemTotal('${item.item_id}')" value="0" min="0" step="1" placeholder="Quantity"></td>
                <td>
                <input
                    type="number"
                    id="total_${item.item_id}"
                    disabled
                    value="0"
                    step="1"
                    min="0"
                    placeholder="Total Stock"
                >
                </td>
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
                        <th>Current Quantity</th>
                        <th>New Quantity</th>
                        <th>Total Quantity</th>
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
// CLOSE FORM
// ============================================
function closeCurrentStockForm() {
    const modal = document.getElementById("openCurrStockModel");
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
    editingItemId = null;
    orderItems = [];
}


// ============================================
// SUBMIT FORM : with new stock data
// ============================================
async function submitStockForm(event) {
    event.preventDefault();

    // Validate at least one item is selected
    if (orderItems.length === 0) {
        showNotification("Please select at least one item with quantity greater than 0.", "error");
        return;
    }

    const formData = {
        user_id: user_id,
        items: orderItems,
    };

    // console.log("form data", formData);


    return showConfirm(
        "Do you want to add this Stocks?",
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        return addItemToAPI(currentStockURLphp, formData).then(result => {
            console.log(result);

            if (result.status === "ok") {
                showNotification("Order placed successfully!", "success");
                closeCurrentStockForm();

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



// Close modal when clicking outside
window.addEventListener("click", function (event) {
    const addOrderModal = document.getElementById("openCurrStockModel");
    const viewOrderModal = document.getElementById("viewOrderModal");

    if (event.target === addOrderModal) {
        closeCurrentStockForm();
    }
    if (event.target === viewOrderModal) {
        closeViewOrderModal();
    }
});


// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.opencurrstockform = opencurrstockform;
window.calculateItemTotal = calculateItemTotal;
// window.calculateOrderTotal = calculateOrderTotal;
window.closeCurrentStockForm = closeCurrentStockForm;
window.submitStockForm = submitStockForm;
window.changestaffPage = changestaffPage;
window.changestaffPerPage = changestaffPerPage;
window.showNotification = showNotification;
window.generateTableHTML = generateTableHTML;
window.showConfirm = showConfirm;
// window.navigateToInventoryStaff = navigateToInventoryStaff;
window.refreshOrdersTable = refreshOrdersTable;
window.viewOrderDetails = viewOrderDetails;
window.closeViewOrderModal = closeViewOrderModal;