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
    
    const url = `${currentStockURLphp}?user_id=${user_id}&type=movement&page=${currentstaffPage}&per_page=${staffPerPage}` + (currentDate ? `&date=${currentDate}` : '');
    console.log("from 54",url);
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
// RENDER STAFF TABLE WITH PAGINATION
// ============================================
export function renderCurrentStockMovementPage() {
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
                    <td>${item.item_name}</td>
                    <td>${item.qty_change}</td>
                    <td>${item.unit}</td>
                    <td>${item.movement_type}</td>
                    <td>${item.movement_reason}</td>
                    <td>${item.created_at}</td>
                </tr>
            `;
        }
    }


    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>Items Stocks Movement</h2>
            </div>
            
            <div class="table-container" style="margin: 0px;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Item Name</th>
                            <th>Quantity Change</th>
                            <th>Unit</th>
                            <th>Movement Type</th>
                            <th>Movement Reason</th>
                            <th>Date</th>
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
                    <button class="close-btn" onclick="closeorderForm()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="staffForm" onsubmit="submitStockForm(event)" class="form-responsive">
                        <input type="hidden" id="itemId">

                        <div class="form-row" id="for-row-other">
                            <ul id="itemList" class="item-list">
                            </ul>
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
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.changestaffPage = changestaffPage;
window.changestaffPerPage = changestaffPerPage;
window.showNotification = showNotification;
window.generateTableHTML = generateTableHTML;
window.showConfirm = showConfirm;
window.renderCurrentStockMovementPage = renderCurrentStockMovementPage;
