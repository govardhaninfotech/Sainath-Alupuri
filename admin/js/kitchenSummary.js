// ============================================
// ORDERS PAGE - WITH VIEW ORDER DETAILS, USER FILTER & STATUS MANAGEMENT
// ============================================

import { ordersURLphp, itemURLphp, userURLphp, kitchenSummaryURLphp } from "../apis/api.js";
import { printReport, exportToPDF, exportToExcel, toggleExportDropdown } from "./print/print.js";
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
let kitchenSummaryData = [];
let overallSummary = [];
let clientWiseSummary = [];
let selectedUserId = null; // For filtering by user

// Server-side pagination meta
let currentstaffPage = 1;
let staffPerPage = 10;
let staffTotal = 0;
let staffTotalPages = 1;
let currentDate = null
let editingItemId = null;

if (!currentDate) {
    currentDate = new Date().toISOString().split("T")[0];
}


const currentUser = JSON.parse(localStorage.getItem("rememberedUser") || sessionStorage.getItem("rememberedUser") || "null");
const user_id = currentUser?.id || "";
const isAdmin = user_id === "22"; // Check if user is admin

if (!user_id) {
    sessionStorage.removeItem("rememberedUser");
    localStorage.removeItem("rememberedUser");
    window.location.replace("../../print/index.html");
}

// ============================================
// LOAD USERS DATA FROM API
// ============================================
async function loadkitchenSummaryData() {
    try {
        const date =
            currentDate ||
            document.getElementById("btnDate")?.value ||
            new Date().toISOString().split("T")[0];

        const response = await addItemToAPI(kitchenSummaryURLphp, {
            date: date,
            user_id: user_id
        });
        console.log(response);

        overallSummary = response.overall_summary || [];
        clientWiseSummary = response.client_wise_summary || [];

        return true;
    } catch (error) {
        console.error(error);
        showNotification("Failed to load kitchen summary", "error");
        overallSummary = [];
        clientWiseSummary = [];
        return false;
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


function handleDateChange() {
    const dateInput = document.getElementById("btnDate");
    if (!dateInput || !dateInput.value) {
        showNotification("Please select a valid date", "error");
        return;
    }

    currentDate = dateInput.value;

    return renderKitchenSummary().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateTableHTML();
        }
    });
}



// ============================================
// RENDER STAFF TABLE WITH PAGINATION
// ============================================
export async function renderKitchenSummary() {
    const success = await loadkitchenSummaryData();

    if (!success) return "";

    return generateTableHTML();
}



// Generate table HTML (no client-side slicing now)
function generateTableHTML() {
    // Check if data exists
    const hasOverallData = overallSummary && overallSummary.length > 0;
    const hasClientData = clientWiseSummary && clientWiseSummary.length > 0;
    console.log(hasOverallData, hasClientData);

    if (!hasOverallData && !hasClientData) {
        return `
            <div class="content-card" style="margin-bottom: 20px;">
                <div class="staff-header">
                    <h2>Kitchen Overall Summary</h2>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="date" id="btnDate"
                                value="${currentDate}"
                                onchange="handleDateChange()" />
                        <div class="export-container" style="position: relative;">
                            <button class="btn-add btn-export" onclick="toggleExportDropdown()">
                                Export ▼
                            </button>
                            <div id="exportDropdown" class="export-dropdown" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000; min-width: 150px; margin-top: 5px;">
                                <button onclick="printKitchenReport()" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">🖨️ Print</button>
                                <button onclick="exportKitchenPDF()" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">📄 Export PDF</button>
                                <button onclick="exportKitchenExcel()" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">📊 Export Excel</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="table-container" style="text-align: center; padding: 40px;">
                    <h3 style="color: #888;">No data available for ${currentDate}</h3>
                </div>
            </div>
        `;
    }

    return `
        <div class="content-card" style="margin-bottom: 20px;">
            <div class="staff-header">
                <h2>Kitchen Overall Summary</h2>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="date" id="btnDate"
                            value="${currentDate}"
                            onchange="handleDateChange()" />
                    
                    <div class="export-container" style="position: relative;">
                        <button class="btn-add btn-export" onclick="toggleExportDropdown()">
                            Export ▼
                        </button>
                        <div id="exportDropdown" class="export-dropdown" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000; min-width: 150px; margin-top: 5px;">
                            <button onclick="printKitchenReport()" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">🖨️ Print</button>
                            <button onclick="exportKitchenPDF()" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">📄 Export PDF</button>
                            <button onclick="exportKitchenExcel()" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">📊 Export Excel</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Item Name</th>
                            <th>Total Quantity</th>
                            <th>Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderOverallSummaryTable()}
                    </tbody>
                </table>
            </div>
        </div>

        ${renderClientWiseTables()}
    `;
}

function renderOverallSummaryTable() {
    if (!overallSummary.length) {
        return `<tr><td colspan="4" style="text-align:center;">No data</td></tr>`;
    }
    console.log(overallSummary);

    return overallSummary.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.item_name}</td>
            <td>${item.total_qty}</td>
            <td>${item.unit}</td>
        </tr>
    `).join("");
}


function renderClientWiseTables() {
    if (!clientWiseSummary || !clientWiseSummary.length) {
        return `
            <div class="content-card">
                <div class="table-container">
                    <table class="data-table">
                        <tbody>
                            <tr>
                                <td colspan="4" style="text-align:center;">
                                    No client data found
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    console.log(clientWiseSummary);

    return clientWiseSummary.map((client) => `
        <div class="content-card" style="margin-bottom: 20px;">
            <div class="staff-header">
                <h2>
                    ${client.client_name}
                    <small style="font-weight:400;">
                        (${client.shop_code} • ${client.mobile})
                    </small>
                </h2>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Item Name</th>
                            <th>Quantity</th>
                            <th>Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${client.items && client.items.length
            ? client.items.map((item, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${item.item_name}</td>
                                        <td>${item.total_qty}</td>
                                        <td>${item.unit}</td>
                                    </tr>
                                `).join("")
            : `
                                    <tr>
                                        <td colspan="4" style="text-align:center;">
                                            No items found for this client
                                        </td>
                                    </tr>
                                `
        }
                    </tbody>
                </table>
            </div>
        </div>
    `).join("");
}

// ============================================
// TOGGLE EXPORT DROPDOWN
// ============================================
window.toggleExportDropdown = function () {
    const dropdown = document.getElementById("exportDropdown");
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
    }
};

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
    const dropdown = document.getElementById("exportDropdown");
    const exportBtn = event.target.closest(".btn-export");

    if (dropdown && !exportBtn && !dropdown.contains(event.target)) {
        dropdown.style.display = "none";
    }
});



// ============================================
// KITCHEN SUMMARY - PRINT DATA (SAME FORMAT AS INVENTORY)
// ============================================

// ============================================
// STEP 1: PREPARE DATA FUNCTION
// ============================================
function prepareKitchenPrintData() {
    const headers = ['Type', 'Client', 'Item Name', 'Quantity', 'Unit'];
    const rows = [];

    // Add overall summary
    if (overallSummary && overallSummary.length) {
        overallSummary.forEach(item => {
            rows.push([
                'Overall',
                '-',
                item.item_name || '',
                item.total_qty || 0,
                item.unit || ''
            ]);
        });
    }

    // Add client-wise summary
    if (clientWiseSummary && clientWiseSummary.length) {
        clientWiseSummary.forEach(client => {
            if (client.items && client.items.length) {
                client.items.forEach(item => {
                    rows.push([
                        'Client',
                        client.client_name || '',
                        item.item_name || '',
                        item.total_qty || 0,
                        item.unit || ''
                    ]);
                });
            }
        });
    }

    return { headers, rows };
}

// ============================================
// STEP 2: CREATE WRAPPER FUNCTIONS
// ============================================

/**
 * PRINT KITCHEN REPORT
 */
window.printKitchenReport = async function () {
    const printData = prepareKitchenPrintData();

    await printReport({
        headers: printData.headers,
        rows: printData.rows,
        reportTitle: 'Kitchen Summary Report',
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Kitchen Management System',
        logo: 'SA',
        additionalInfo: `
            <p><strong>Report Date:</strong> ${currentDate || new Date().toLocaleDateString('en-IN')}</p>
            <p><strong>Total Items:</strong> ${overallSummary.length}</p>
            <p><strong>Total Clients:</strong> ${clientWiseSummary.length}</p>
        `
    });
};

/**
 * EXPORT KITCHEN REPORT TO PDF
 */
window.exportKitchenPDF = async function () {
    const printData = prepareKitchenPrintData();

    await exportToPDF({
        headers: printData.headers,
        rows: printData.rows,
        reportTitle: 'Kitchen Summary Report',
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Kitchen Management System',
        logo: 'SA',
        additionalInfo: `
            <p><strong>Report Date:</strong> ${currentDate || new Date().toLocaleDateString('en-IN')}</p>
            <p><strong>Total Items:</strong> ${overallSummary.length}</p>
            <p><strong>Total Clients:</strong> ${clientWiseSummary.length}</p>
        `
    });
};

/**
 * EXPORT KITCHEN REPORT TO EXCEL
 */
window.exportKitchenExcel = async function () {
    const printData = prepareKitchenPrintData();

    await exportToExcel({
        headers: printData.headers,
        rows: printData.rows,
        reportTitle: 'Kitchen Summary Report',
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Kitchen Management System'
    });
};

// Toggle dropdown


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
function refreshkitchenSummaryTable() {
    console.log("Refreshing orders table...");
    const dateInput = document.getElementById("btnDate");
    if (dateInput) {
        console.log("Selected date:", dateInput.value);
        currentDate = dateInput.value;
    }
    // Reset to first page when filtering
    currentstaffPage = 1;

    return loadkitchenSummaryData().then(() => {
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
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.changestaffPage = changestaffPage;
window.changestaffPerPage = changestaffPerPage;
window.showNotification = showNotification;
window.generateTableHTML = generateTableHTML;
window.showConfirm = showConfirm;
window.renderKitchenSummary = renderKitchenSummary;
window.refreshkitchenSummaryTable = refreshkitchenSummaryTable;
window.handleDateChange = handleDateChange;
window.toggleExportDropdown = toggleExportDropdown;
// window.toggleExportDropdown = toggleExportDropdown;
// window.printKitchenReport = printKitchenReport;
// window.exportKitchenPDF = exportKitchenPDF;
// window.exportKitchenExcel = exportKitchenExcel;