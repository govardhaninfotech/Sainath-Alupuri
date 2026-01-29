// ============================================
// ITEMS PAGE - CRUD OPERATIONS WITH PAGINATION
// ============================================

import { clientMonthlySummaryURLphp } from "../apis/api.js";
import { getItemsData } from "../apis/master_api.js";
import { showNotification } from "./notification.js";
import { printReport, exportToPDF, exportToExcel, toggleExportDropdown } from "./print/print.js";

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
                            <button onclick="handleExportExcel()" class="export-option" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">
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
    let url = 'https://gisurat.com/govardhan/sainath_aloopuri/api/reports/client_monthly_summary.php?user_id=1&month=12&year=2026&export=pdf';

    // let res = await fetch(url, {
    //     method: 'GET',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     }
    // });
    // console.log(res);

    window.open(url, '_blank');

    toggleExportDropdown();

}

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE (ITEMS-ONLY NAMES)
// ============================================
window.handleExportPDFURLFromBackend = handleExportPDFURLFromBackend;
window.changeItemPage = changeItemPage;
window.changeItemPerPage = changeItemPerPage;
window.showNotification = showNotification;
window.generateItemsTableHTML = generateItemsTableHTML;
window.initClientMonthDropdown = initClientMonthDropdown;
window.handleClientMonthChange = handleClientMonthChange;
window.viewClientMonthlyReport = viewClientMonthlyReport;
window.toggleExportDropdown = toggleExportDropdown;
window.handlePrintClientMonthly = handlePrintClientMonthly;
window.handleExportPDF = handleExportPDF;
window.handleExportExcel = handleExportExcel;