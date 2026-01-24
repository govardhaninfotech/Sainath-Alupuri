// ============================================
// ITEMS PAGE - CRUD OPERATIONS WITH PAGINATION
// ============================================

import { clientMonthlySummaryURLphp } from "../apis/api.js";
import { getItemsData } from "../apis/master_api.js";
import { showNotification } from "./notification.js";

// Items Data Storage
let itemsData = [];

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

// ============================================
// LOAD ITEMS DATA FROM API (SERVER PAGINATION)
// ============================================
function loadClientMonthlyReport() {
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

function viewClientMonthlyReport(client_id) {
    showNotification("No Client Monthly Report Viewed", "info");
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
                <td><a href="javascript:void(0)" class="order-link" onclick="viewClientMonthlyReport(${item.id})">${item.client_name}</a></td>
                <td>${item.total_orders}</td>
                <td>${item.total_order_amount}</td>
                <td>${item.total_paid_amount}</td>
                <td>${item.outstanding_amount}</td>
            </tr>
        `;
    }
    document.getElementById("itemsTableBody").innerHTML = tableRows || `<tr><td colspan="6" style="text-align:center;">No records found</td></tr>`;
}
export function initClientMothlyReportCard() {

    let tableRows = "";
    return `
        <div class="content-card" id="table-container">
            <div class="items-header">
                <h2>Client Monthly Report</h2>
                <div class="inv-filter-group">
                        <label for="invMonthSelect1">📅 Month Selection</label>
                        <select id="invMonthSelect" onchange="handleClientMonthChange(event)"></select>
                    </div>
                <button class="btn-add">Print</button>
                <div style="display: flex; gap: 12px; align-items: center;">
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
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE (ITEMS-ONLY NAMES)
// ============================================
window.changeItemPage = changeItemPage;
window.changeItemPerPage = changeItemPerPage;
window.showNotification = showNotification;
window.generateItemsTableHTML = generateItemsTableHTML;
window.initClientMonthDropdown = initClientMonthDropdown;
window.handleClientMonthChange = handleClientMonthChange;
window.viewClientMonthlyReport = viewClientMonthlyReport;