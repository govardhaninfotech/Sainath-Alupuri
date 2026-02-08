// ============================================
// ITEMS PAGE - CRUD OPERATIONS WITH PAGINATION
// ============================================

import { clientMonthlySummaryURLphp, ordersURLphp, orderItemsURLphp } from "../apis/api.js";
import { getItemsData } from "../apis/master_api.js";
import { showNotification } from "./notification.js";
import { printReport, exportToPDF, exportToExcel, toggleExportDropdown } from "./print/print.js";

// Items Data Storage
let itemsData = [];
let clientOrdersData = [];
let selectedClientInfo = null;

// Server-side pagination meta
let month = 0;
let year = 0;
let currentItemsPage = 1;   // matches API "page"
let itemsPerPage = 10;      // matches API "per_page"
let itemsTotal = 0;         // API "total"
let itemsTotalPages = 1;    // API "total_pages"
let currentDate = null;
let totalPages = itemsTotalPages || 1;
let showingFrom = 0;
let showingTo = 0;
let currentUser = null;

// Client Orders Pagination
let currentClientOrderPage = 1;
let clientOrdersPerPage = 10;
let clientOrdersTotal = 0;
let clientOrdersTotalPages = 1;
let isViewingClientOrders = false;
currentUser =
    JSON.parse(sessionStorage.getItem("rememberedUser")) ||
    JSON.parse(localStorage.getItem("rememberedUser"));

let user_id = currentUser ? currentUser.id : '';

// ============================================
// LOAD ITEMS DATA FROM API (SERVER PAGINATION)
// ============================================
function loadClientMonthlyReport() {

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

    if (month === 0 || year === 0) {
        let today = new Date();
        month = today.getMonth() + 1;
        year = today.getFullYear();
    }
    month = currentDate ? parseInt(currentDate.split("-")[1], 10) : month;
    year = currentDate ? parseInt(currentDate.split("-")[0], 10) : year;

    const url = `${clientMonthlySummaryURLphp}?user_id=${currentUser.id}&month=${month}&year=${year}&page=${currentItemsPage}&per_page=${itemsPerPage}`;
    console.log(url);

    return getItemsData(url).then(data => {
        itemsData = data.orders || [];
        itemsTotal = data.total ?? itemsData.length;
        itemsPerPage = data.per_page ?? itemsPerPage;
        itemsTotalPages = data.total_pages ?? Math.max(1, Math.ceil(itemsTotal / itemsPerPage));
        currentItemsPage = data.page ?? currentItemsPage;
    });
}

export function initClientMonthDropdown() {
    const monthSelect = document.getElementById("invMonthSelect");
    if (!monthSelect) return;
    monthSelect.innerHTML = "";
    const today = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(today.getMonth() - i);
        const value = d.toISOString().slice(0, 7);
        const label = d.toLocaleString("default", { month: "long", year: "numeric" });
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        monthSelect.appendChild(opt);
    }
    return loadClientMonthlyReport().then(() => generateItemsTableHTML());
}

export function handleClientMonthChange(event) {

    currentDate = event.target.value;
    currentItemsPage = 1;
    return loadClientMonthlyReport().then(() => generateItemsTableHTML());
}

function viewClientMonthlyReport(clientIndex) {
    // Get client info from itemsData using the index
    if (clientIndex < 0 || clientIndex >= itemsData.length) {
        showNotification("Client not found!", "error");
        return;
    }

    const clientInfo = itemsData[clientIndex];
    selectedClientInfo = {
        id: clientInfo.id,
        client_name: clientInfo.client_name,
        total_orders: clientInfo.total_orders,
        total_order_amount: clientInfo.total_order_amount,
        total_paid_amount: clientInfo.total_paid_amount,
        outstanding_amount: clientInfo.outstanding_amount
    };

    isViewingClientOrders = true;
    currentClientOrderPage = 1;

    // Derive clientId defensively in case API uses a different property name
    const clientId = clientInfo.id ?? clientInfo.client_id ?? clientInfo.user_id ?? clientInfo.clientId;
    if (!clientId) {
        showNotification("Client ID not found for selected client", "error");
        return Promise.resolve();
    }

    return loadClientOrders(clientId).then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateClientOrdersPageHTML();
        }
    });
}

// Generate table HTML (NO client-side slicing now)
function generateItemsTableHTML() {

    if (itemsTotal > 0) {
        showingFrom = (currentItemsPage - 1) * itemsPerPage + 1;
        showingTo = Math.min(currentItemsPage * itemsPerPage, itemsTotal);
    }

    let tableRows = "";

    for (let index = 0; index < itemsData.length; index++) {
        const item = itemsData[index];

        const serialNo = (currentItemsPage - 1) * itemsPerPage + index + 1;
        tableRows += `
            <tr>
                <td>${serialNo}</td>
                <td><a href="javascript:void(0)" class="order-link" onclick="viewClientMonthlyReport(${index})">${item.client_name}</a></td>
                <td>${item.total_orders}</td>
                <td>${item.total_order_amount}</td>
                <td>${item.total_paid_amount}</td>
                <td>${item.outstanding_amount}</td>
            </tr>
        `;
    }
    document.getElementById("itemsTableBody").innerHTML = tableRows || `<tr><td colspan="6" style="text-align:center;">No records found</td></tr>`;
}
// ============================================
// LOAD CLIENT ORDERS FROM API
// ============================================
function loadClientOrders(clientId) {
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

    // Build URL with authenticated user id and client id
    const url = `${ordersURLphp}?user_id=${encodeURIComponent(clientId)}`;
    console.log("Loading client orders from URL:", url);

    return getItemsData(url).then(data => {
        clientOrdersData = data.orders || [];
        clientOrdersTotal = data.total ?? clientOrdersData.length;
        clientOrdersPerPage = data.per_page ?? clientOrdersPerPage;
        clientOrdersTotalPages = data.total_pages ?? Math.max(1, Math.ceil(clientOrdersTotal / clientOrdersPerPage));
        return data;
    }).catch(error => {
        console.error("Error loading client orders:", error);
        showNotification("Error loading client orders!", "error");
        clientOrdersData = [];
        clientOrdersTotal = 0;
        clientOrdersTotalPages = 1;
        return { orders: [], total: 0 };
    });
}

// ============================================
// VIEW CLIENT ORDER DETAILS
// ============================================
async function viewClientOrderDetails(orderId) {
    console.log("order id in viewClientOrderDetails", orderId);

    const order = clientOrdersData.find(o => String(o.id) === String(orderId));
    if (!order) {
        showNotification("Order not found!", "error");
        return;
    }

    // Fetch order items
    const date = order.expected_delivery.split(" ")[0];
    const orderItemsURL = `${orderItemsURLphp}?user_id=${encodeURIComponent(order.user_id)}&order_id=${orderId}`;
    console.log("Fetching order items from URL:", orderItemsURL);

    try {
        const itemsData = await getItemsData(orderItemsURL);
        const orderItemsList = itemsData.items || [];

        displayClientOrderDetailsModal(order, orderItemsList);
    } catch (error) {
        console.error("Error fetching order items:", error);
        showNotification("Error loading order items!", "error");
    }
}

function displayClientOrderDetailsModal(order, orderItemsList) {
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
                    <h3>Order Details - ${order.order_no}</h3> ${order.placed_at}
                    <button class="close-btn" onclick="closeViewOrderModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="order-details-container">
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
                                    <span class="info-value">${order.email}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Address</span>
                                    <span class="info-value">${order.address}</span>
                                </div>
                            </div>
                        </div> -->

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

// ============================================
// GENERATE CLIENT ORDERS PAGE HTML
// ============================================
function generateClientOrdersPageHTML() {
    let clientOrderShowingFrom = 0;
    let clientOrderShowingTo = 0;

    if (clientOrdersTotal > 0) {
        clientOrderShowingFrom = (currentClientOrderPage - 1) * clientOrdersPerPage + 1;
        clientOrderShowingTo = Math.min(currentClientOrderPage * clientOrdersPerPage, clientOrdersTotal);
    }

    let tableRows = "";
    if (clientOrdersData.length === 0) {
        tableRows = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #9ca3af;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
                    <div style="font-size: 16px; font-weight: 600; color: #6b7280;">No orders found for this client</div>
                    <div style="font-size: 14px; color: #9ca3af; margin-top: 8px;">This client has not placed any orders yet</div>
                </td>
            </tr>
        `;
    } else {
        for (let index = 0; index < clientOrdersData.length; index++) {
            const serialNo = (currentClientOrderPage - 1) * clientOrdersPerPage + index + 1;
            let order = clientOrdersData[index];

            tableRows += `
                <tr>
                    <td>${serialNo}</td>
                    <td><a href="javascript:void(0)" class="order-link" onclick="viewClientOrderDetails(${order.id})">${order.order_no}</a></td>
                    <td>₹${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td>${order.delivery_type === 'urgent' ? 'Same Day' : 'Next Day'}</td>
                    <td>${order.status ? '<span style="padding: 4px 8px; border-radius: 4px; background: #dbeafe; color: #0369a1; font-size: 12px; font-weight: 500;">' + order.status.toUpperCase() + '</span>' : 'N/A'}</td>
                </tr>
            `;
        }
    }

    return `
        <div class="content-card">
            <style>
                /* Scoped styles for orders header layout */
                .content-card .staff-header { width:100%; display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; gap:12px; flex-wrap:wrap; }
                .content-card .staff-header .header-left { display:flex; gap:12px; align-items:center; }
                .content-card .staff-header .header-right { display:flex; gap:10px; align-items:center; margin-left:auto; }
                .content-card .btn-print, .content-card .btn-export, .content-card .btn-back { padding:8px 12px; border-radius:4px; font-size:14px; cursor:pointer; }
                .content-card .btn-back { background:#667eea; color:#fff; border:none; }
                .content-card .export-dropdown-menu { position:absolute; right:0; top:100%; background:white; border:1px solid #ddd; border-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,0.15); z-index:1000; min-width:150px; margin-top:5px; }
                @media (max-width:700px) {
                    .content-card .staff-header {margin-top: 20px; flex-direction:column; align-items:flex-start; }
                    .content-card .staff-header .header-right { width:100%; justify-content:flex-start  ; margin-top:8px; }
                    .content-card .header-right .btn-print, .content-card .header-right .btn-export { padding:8px 10px; }
                }
            </style>

            <div class="staff-header">
                <div class="header-left">
                    <button onclick="backToClientMonthlyReport()" class="btn-back">
                        ← Back
                    </button>
                    <h2 style="margin:0;">${selectedClientInfo?.client_name || 'Client'} - Orders</h2>
                </div>
                <div class="header-right">
                    <button onclick="handlePrintClientMonthly()" class="btn-print" title="Print Report">
                        <span style="font-size:18px;">🖨️</span> Print
                    </button>
                    <div class="export-dropdown-wrapper" style="position:relative;">
                        <button onclick="toggleExportDropdown()" class="btn-export" title="Export Report">
                            <span style="font-size:18px;">📥</span> Export
                        </button>
                        <div id="exportDropdown" class="export-dropdown-menu" style="display:none;">
                            <button onclick="handleExportPDFURLFromBackend()" class="export-option" style="display:block; width:100%; padding:10px 15px; border:none; background:none; text-align:left; cursor:pointer;">
                                <span>📄</span> PDF
                            </button>
                            <button onclick="handleExportExcel()" class="export-option" style="display:block; width:100%; padding:10px 15px; border:none; background:none; text-align:left; cursor:pointer;">
                                <span>📊</span> Excel
                            </button>
                        </div>
                    </div>
                </div>
            </div>

           <!--  <div class="client-info-summary" style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                <div style="border-left: 4px solid #667eea; padding-left: 12px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Total Orders</div>
                    <div style="font-size: 18px; font-weight: 700; color: #333;">${selectedClientInfo?.total_orders || 0}</div>
                </div>
                <div style="border-left: 4px solid #10b981; padding-left: 12px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Total Amount</div>
                    <div style="font-size: 18px; font-weight: 700; color: #333;">₹${parseFloat(selectedClientInfo?.total_order_amount || 0).toFixed(2)}</div>
                </div>
                <div style="border-left: 4px solid #f59e0b; padding-left: 12px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Paid Amount</div>
                    <div style="font-size: 18px; font-weight: 700; color: #333;">₹${parseFloat(selectedClientInfo?.total_paid_amount || 0).toFixed(2)}</div>
                </div>
                <div style="border-left: 4px solid #ef4444; padding-left: 12px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Outstanding</div>
                    <div style="font-size: 18px; font-weight: 700; color: #333;">₹${parseFloat(selectedClientInfo?.outstanding_amount || 0).toFixed(2)}</div>
                </div>
            </div> -->

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Order Number</th>
                            <th>Amount</th>
                            <th>Delivery Type</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>

            <div class="pagination">
                <div class="pagination-info">
                    Showing ${clientOrdersTotal === 0 ? 0 : clientOrderShowingFrom} to ${clientOrderShowingTo} of ${clientOrdersTotal} entries
                </div>
                <div class="pagination-controls">
                    <button onclick="changeClientOrderPage('prev')" ${currentClientOrderPage === 1 ? "disabled" : ""}>Previous</button>
                    <span class="page-number">Page ${currentClientOrderPage} of ${clientOrdersTotalPages}</span>
                    <button onclick="changeClientOrderPage('next')" ${currentClientOrderPage === clientOrdersTotalPages ? "disabled" : ""}>Next</button>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// BACK TO CLIENT MONTHLY REPORT
// ============================================
function backToClientMonthlyReport() {
    isViewingClientOrders = false;
    selectedClientInfo = null;
    currentClientOrderPage = 1;
    clientOrdersData = [];

    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
        mainContent.innerHTML = initClientMothlyReportCard();
    }

    // Reinitialize the dropdown and load data
    return initClientMonthDropdown();
}

// ============================================
// PAGINATION FOR CLIENT ORDERS
// ============================================
function changeClientOrderPage(direction) {
    if (direction === "next" && currentClientOrderPage < clientOrdersTotalPages) {
        currentClientOrderPage++;
    } else if (direction === "prev" && currentClientOrderPage > 1) {
        currentClientOrderPage--;
    } else {
        return Promise.resolve();
    }

    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
        mainContent.innerHTML = generateClientOrdersPageHTML();
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
// INITIALIZE CLIENT MONTHLY REPORT CARD
// ============================================
export function initClientMothlyReportCard() {
    let tableRows = "";
    return `
        <div class="content-card" id="table-container">
            <div class="items-header">
                <h2>Client Monthly Report</h2>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div class="inv-filter-group">
                        <select id="invMonthSelect" onchange="handleClientMonthChange(event)"></select>
                    </div>
                    <button onclick="handlePrintClientMonthly()" class="btn-print" title="Print Report">
                        <span style="font-size: 18px;">🖨️</span> Print
                    </button>
                    <div class="export-dropdown-wrapper" style="position: relative;">
                        <button onclick="toggleExportDropdown()" class="btn-export" title="Export Report">
                            <span style="font-size: 18px;">📥</span> Export
                        </button>
                        <div id="exportDropdown" class="export-dropdown-menu" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000; min-width: 150px; margin-top: 5px;">
                            <!-- <button onclick="handleExportPDF()" class="export-option" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">
                                <span>📄</span> PDF
                            </button> -->
                            <button onclick="handleExportPDFURLFromBackend()" class="export-option" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">
                                <span>📄</span> PDF
                            </button>
                            <button onclick="handleExportExcelURLFromBackend()" class="export-option" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">
                                <span>📊</span> Excel
                            </button>
                        </div>
                    </div>
                </div>
             </div>

            <div class="table-container" id="table-container">
                <table class="data-table" >
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Client Name</th>
                            <th>Total Orders</th>
                            <th>Order Amount</th>
                            <th>Paid Amount</th>
                            <th>Outstanding</th>
                        </tr>
                    </thead>
                    <tbody id="itemsTableBody">
                        ${tableRows || `<tr><td colspan="7" style="text-align:center;">No items found</td></tr>`}
                    </tbody>
                </table>
            </div>


            <div class="pagination">
                <div class="pagination-info">
                    Showing ${itemsTotal === 0 ? 0 : showingFrom} to ${showingTo} of ${itemsTotal} entries
                </div>
                <div class="pagination-controls">
                    <button onclick="changeItemPage('prev')" ${currentItemsPage === 1 ? "disabled" : ""}>Previous</button>
                    <span class="page-number">Page ${currentItemsPage} of ${totalPages}</span>
                    <button onclick="changeItemPage('next')" ${currentItemsPage === totalPages ? "disabled" : ""}>Next</button>
                </div>
            </div>
        </div>      
    `;
}



// ============================================
// PAGINATION FUNCTIONS (SERVER-SIDE)
// ============================================
function changeItemPage(direction) {
    if (direction === "next" && currentItemsPage < itemsTotalPages) {
        currentItemsPage++;
    } else if (direction === "prev" && currentItemsPage > 1) {
        currentItemsPage--;
    } else {
        return Promise.resolve();
    }

    return loadClientMonthlyReport().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateItemsTableHTML();
        }
    });
}

function changeItemPerPage(value) {
    itemsPerPage = parseInt(value, 10) || 10;
    currentItemsPage = 1;

    return loadClientMonthlyReport().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateItemsTableHTML();
        }
    });
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
async function handlePrintClientMonthly() {
    const printData = await prepareClientMonthlyPrintData();

    console.log(printData);

    if (!printData.headers || !printData.rows || printData.rows.length === 0) {
        showNotification("No data available to print", "warning");
        return;
    }

    await printReport({
        headers: printData.headers,
        rows: printData.rows,
        reportTitle: 'Client Monthly Report',
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Client Management System',
        logo: 'SA',
        additionalInfo: `
            <p><strong>Report Period:</strong> ${currentDate || new Date().toLocaleDateString('en-IN')}</p>
            <p><strong>Total Clients:</strong> ${itemsData.length}</p>
        `
    });
}

async function handleExportPDF() {
    const printData = prepareClientMonthlyPrintData();

    console.log('Export PDF - printData:', printData);
    console.log('Export PDF - itemsData:', itemsData);
    console.log('Export PDF - rows length:', printData.rows ? printData.rows.length : 0);

    if (!printData || !printData.rows || printData.rows.length === 0) {
        showNotification("No data available to export", "warning");
        return;
    }

    const monthSelect = document.getElementById('invMonthSelect');
    const selectedMonth = monthSelect ? monthSelect.value : 'N/A';
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    await exportToPDF({
        reportTitle: `Client Monthly Report - ${monthName} ${year}`,
        headers: printData.headers,
        rows: printData.rows,
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Management System',
        additionalInfo: `Report for Month: ${monthName} ${year}`
    });
}

async function handleExportExcel() {
    const printData = prepareClientMonthlyPrintData();

    console.log('Export Excel - printData:', printData);
    console.log('Export Excel - itemsData:', itemsData);
    console.log('Export Excel - rows length:', printData.rows ? printData.rows.length : 0);

    if (!printData || !printData.rows || printData.rows.length === 0) {
        showNotification("No data available to export", "warning");
        return;
    }

    const monthSelect = document.getElementById('invMonthSelect');
    const selectedMonth = monthSelect ? monthSelect.value : 'N/A';
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    await exportToExcel({
        reportTitle: `Client Monthly Report - ${monthName} ${year}`,
        headers: printData.headers,
        rows: printData.rows,
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Management System',
        additionalInfo: `Report for Month: ${monthName} ${year}`
    });
}

function prepareClientMonthlyPrintData() {
    const monthSelect = document.getElementById('invMonthSelect');
    const selectedMonth = monthSelect ? monthSelect.value : 'N/A';
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    const headers = ['Sr No', 'Client Name', 'Total Orders', 'Order Amount', 'Paid Amount', 'Outstanding'];
    const rows = itemsData.map((item, index) => [
        (currentItemsPage - 1) * itemsPerPage + index + 1,
        item.client_name,
        item.total_orders,
        item.total_order_amount,
        item.total_paid_amount,
        item.outstanding_amount
    ]);

    return {
        headers: headers,
        rows: rows
    };
}


async function handleExportPDFURLFromBackend() {

    if (user_id) {
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
            return;
        }
        user_id = currentUser.id;
    }


    let url = `https://gisurat.com/govardhan/sainath_aloopuri/api/reports/client_monthly_summary.php?user_id=${user_id}&month=${month}&year=${year}&export=pdf`;
    window.open(url, '_blank');
    toggleExportDropdown();
}
async function handleExportExcelURLFromBackend() {
    if (user_id) {
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
            return;
        }
        user_id = currentUser.id;
    }
    let url = `https://gisurat.com/govardhan/sainath_aloopuri/api/reports/client_monthly_summary.php?user_id=${user_id}&month=${month}&year=${year}&export=excel`;
    window.open(url, '_blank');
    toggleExportDropdown();
}



// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE (ITEMS-ONLY NAMES)
// ============================================
window.handleExportPDFURLFromBackend = handleExportPDFURLFromBackend;
window.handleExportExcelURLFromBackend = handleExportExcelURLFromBackend;
window.changeItemPage = changeItemPage;
window.changeItemPerPage = changeItemPerPage;
window.showNotification = showNotification;
window.generateItemsTableHTML = generateItemsTableHTML;
window.initClientMonthDropdown = initClientMonthDropdown;
window.handleClientMonthChange = handleClientMonthChange;
window.viewClientMonthlyReport = viewClientMonthlyReport;
window.viewClientOrderDetails = viewClientOrderDetails;
window.toggleExportDropdown = toggleExportDropdown;
window.handlePrintClientMonthly = handlePrintClientMonthly;
window.handleExportPDF = handleExportPDF;
window.handleExportExcel = handleExportExcel;
window.closeViewOrderModal = closeViewOrderModal;
window.changeClientOrderPage = changeClientOrderPage;
window.backToClientMonthlyReport = backToClientMonthlyReport;
window.initClientMothlyReportCard = initClientMothlyReportCard;