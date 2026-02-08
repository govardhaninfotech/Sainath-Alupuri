// ============================================
// ITEMS PAGE - CRUD OPERATIONS WITH PAGINATION
// ============================================

import { staffExpenseReportURLphp } from "../apis/api.js";
import { getItemsData } from "../apis/master_api.js";
import { showNotification } from "./notification.js";
import { printReport, exportToPDF, exportToExcel, toggleExportDropdown } from "./print/print.js";

// Auto-refresh configuration
let autoRefreshInterval = null;
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds
import { initAutoRefresh } from "./autoRefresh.js";

let itemsData = [];

// Server-side pagination meta
let month = 0;
let year = 0;
let currentItemsPage = 1;
let itemsPerPage = 10;
let itemsTotal = 0;
let itemsTotalPages = 1;
let currentDate = null;
let totalPages = itemsTotalPages || 1;
let showingFrom = 0;
let showingTo = 0;

function reset() {
    itemsData = [];

    month = 0;
    year = 0;
    currentItemsPage = 1;
    itemsPerPage = 10;
    itemsTotal = 0;
    itemsTotalPages = 1;
    currentDate = null;
    totalPages = itemsTotalPages || 1;
    showingFrom = 0;
    showingTo = 0;

}
// ============================================
// LOAD ITEMS DATA FROM API (SERVER PAGINATION)
// ============================================
function loadStaffAttendanceData() {
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


    const url = `${staffExpenseReportURLphp}?user_id=${currentUser.id}&month=${month}&year=${year}&page=${currentItemsPage}&per_page=${itemsPerPage}`;
    console.log(url);

    return getItemsData(url).then(data => {

        itemsData = data.records || [];
        console.log(itemsData);
        itemsTotal = data.total ?? itemsData.length;
        itemsPerPage = data.per_page ?? itemsPerPage;
        itemsTotalPages = data.total_pages ?? Math.max(1, Math.ceil(itemsTotal / itemsPerPage));
        currentItemsPage = data.page ?? currentItemsPage;
    });
}

export function initStaffExpMonthDropdown() {
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
    
    // Initialize auto-refresh
    const refreshFunction = () => loadStaffAttendanceData().then(() => generateItemsTableHTML());
    initAutoRefresh('staff-expense', refreshFunction, 30);
    
    return loadStaffAttendanceData().then(() => generateItemsTableHTML());
}

export function handleStaffExpMonthChange(event) {
    currentDate = event.target.value;
    currentItemsPage = 1;
    return loadStaffAttendanceData().then(() => generateItemsTableHTML());
}

function viewStaffMonthlyReport(staffId) {
    // Get the month from dropdown
    const monthSelect = document.getElementById('invMonthSelect');
    const selectedMonth = monthSelect ? monthSelect.value : null;

    // Find staff data from itemsData
    const staffData = itemsData.find(item => String(item.id) === String(staffId));
    const staffName = staffData ? staffData.staff_name : `Staff ${staffId}`;

    console.log(`📊 Admin: Navigating to inventory from expense report - Staff ID: ${staffId}, Staff Name: ${staffName}, Month: ${selectedMonth}`);

    // Store both staff ID and current month in localStorage
    localStorage.setItem('selectedStaffId', staffId);
    localStorage.setItem('selectedMonth', selectedMonth);
    localStorage.setItem('selectedStaffName', staffName);

    // Navigate to inventory page
    if (window.navigateTo) {
        window.navigateTo('inventory_staff');
    } else {
        console.error('navigateTo function not available');
        showNotification('Navigation error. Please refresh the page.', 'error');
    }
}
// ============================================
// NAVIGATE TO INVENTORY STAFF PAGE WITH STAFF ID
// ============================================
function navigateToInventoryStaff(staffId) {

    // Store staff_id in localStorage for inventory page to read
    localStorage.setItem('selectedStaffId', staffId);

    // Navigate to inventory_staff page using SPA navigation
    if (window.navigateTo) {
        window.navigateTo('inventory_staff');
    } else {
        console.error('navigateTo function not available');
        showNotification('Navigation error. Please refresh the page.', 'error');
    }
}

function generateItemsTableHTML() {

    if (itemsTotal > 0) {
        showingFrom = (currentItemsPage - 1) * itemsPerPage + 1;
        showingTo = Math.min(currentItemsPage * itemsPerPage, itemsTotal);
    }

    let tableRows = "";

    for (let index = 0; index < itemsData.length; index++) {
        const item = itemsData[index];
        console.log(item);

        const serialNo = (currentItemsPage - 1) * itemsPerPage + index + 1;
        tableRows += `
            <tr>
                <td>${serialNo}</td>
                <td><a href="javascript:void(0)" class="order-link" onclick="viewStaffMonthlyReport('${item.staff_id}')">${item.staff_name}</a></td>
                <td>${item.amount}</td>
               <!--  <td>${item.payment_mode}</td>
                <td>${item.expense_date}</td>
                <td>${item.notes}</td> -->
            </tr>
        `;
    }
    document.getElementById("itemsTableBody").innerHTML = tableRows || `<tr><td colspan="6" style="text-align:center;">No records found</td></tr>`;
}
export function initStaffExpMothlyReportCard() {
    reset();

    let tableRows = "";
    return `
        <div class="content-card" id="table-container">
            <div class="items-header">
                <h2>Staff Expense Monthly Report</h2>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div class="inv-filter-group">
                        <select id="invMonthSelect" onchange="handleStaffExpMonthChange(event)"></select>
                    </div>
                   
                    <button onclick="handlePrintStaffExpense()" class="btn-print" title="Print Report">
                        <span style="font-size: 18px;">🖨️</span> Print
                    </button>
                    <div class="export-dropdown-wrapper" style="position: relative;">
                        <button onclick="toggleExportDropdown()" class="btn-export" title="Export Report">
                            <span style="font-size: 18px;">📥</span> Export
                        </button>
                        <div id="exportDropdown" class="export-dropdown-menu" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000; min-width: 150px; margin-top: 5px;">
                            <button onclick="handleExportPDFURLFromBackendStaffAttendance()" class="export-option" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">
                                <span>📄</span> PDF
                            </button>
                            <button onclick="handleExportExcelURLFromBackendStaffAttendance()" class="export-option" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">
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
                            <th>Staff Name</th>
                            <th>Amount</th>
                            <!-- <th>Payment Mode</th>
                            <th>Date</th>
                            <th>Notes</th> -->
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
// EXPORT FUNCTIONS
// ============================================
async function handlePrintStaffExpense() {
    const printStaffData = await prepareStaffExpensePrintData();

    if (!printStaffData || printStaffData.rows.length === 0) {
        showNotification("No data available to print", "warning");
        return;
    }

    await printReport({
        headers: printStaffData.headers,
        rows: printStaffData.rows,
        reportTitle: 'Staff Expense Report',
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Staff Management System',
        logo: 'SA',
        additionalInfo: `
            <p><strong>Report Period:</strong> ${currentDate || new Date().toLocaleDateString('en-IN')}</p>
            <p><strong>Total Records:</strong> ${itemsData.length}</p>
        `
    });
}

async function handleStaffExportPDF() {
    const printData = prepareStaffExpensePrintData();
    console.log("staff expense export pdf");

    console.log('Staff Export PDF - printData:', printData);
    console.log('Staff Export PDF - itemsData:', itemsData);
    console.log('Staff Export PDF - rows length:', printData.rows ? printData.rows.length : 0);

    if (!printData || !printData.rows || printData.rows.length === 0) {
        showNotification("No data available to export", "warning");
        return;
    }

    const monthSelect = document.getElementById('invMonthSelect');
    const selectedMonth = monthSelect ? monthSelect.value : 'N/A';
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    await exportToPDF({
        reportTitle: `Staff Expense Monthly Report - ${monthName} ${year}`,
        headers: printData.headers,
        rows: printData.rows,
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Management System',
        additionalInfo: `Report for Month: ${monthName} ${year}\nTotal Amount: Rs. ${printData.rows.reduce((sum, row) => sum + (parseFloat(row[2]) || 0), 0).toFixed(2)}`
    });
}

async function handleStaffExportExcel() {
    const printData = prepareStaffExpensePrintData();

    console.log('Staff Export Excel - printData:', printData);
    console.log('Staff Export Excel - itemsData:', itemsData);
    console.log('Staff Export Excel - rows length:', printData.rows ? printData.rows.length : 0);

    if (!printData || !printData.rows || printData.rows.length === 0) {
        showNotification("No data available to export", "warning");
        return;
    }

    const monthSelect2 = document.getElementById('invMonthSelect');
    const selectedMonth2 = monthSelect2 ? monthSelect2.value : 'N/A';
    const [year2, month2] = selectedMonth2.split('-');
    const monthName2 = new Date(year2, month2 - 1).toLocaleString('default', { month: 'long' });

    await exportToExcel({
        reportTitle: `Staff Expense Monthly Report - ${monthName2} ${year2}`,
        headers: printData.headers,
        rows: printData.rows,
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Management System',
        additionalInfo: `Report for Month: ${monthName2} ${year2}`
    });
}

function prepareStaffExpensePrintData() {
    const monthSelect = document.getElementById('invMonthSelect');
    const selectedMonth = monthSelect ? monthSelect.value : 'N/A';
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    const headers = ['Sr No', 'Staff Name', 'Expense Amount'];
    const rows = itemsData.map((item, index) => [
        (currentItemsPage - 1) * itemsPerPage + index + 1,
        item.staff_name || item.name || '',
        item.expense_amount || item.amount || 0
       
    ]);

    return {
        headers: headers,
        rows: rows
    };
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

    return loadStaffAttendanceData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateItemsTableHTML();
        }
    });
}

function changeItemPerPage(value) {
    itemsPerPage = parseInt(value, 10) || 10;
    currentItemsPage = 1;

    return loadStaffAttendanceData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateItemsTableHTML();
        }
    });
}
// PDF = https://gisurat.com/govardhan/sainath_aloopuri/api/reports/staff_attendance_report.php?user_id=1&month=1&year=2026&page=1&per_page=10&category_id=1&export=pdf

// Excel = https://gisurat.com/govardhan/sainath_aloopuri/api/reports/staff_attendance_report.php?user_id=1&month=1&year=2026&page=1&per_page=10&category_id=1&export=excel

function handleExportPDFURLFromBackendStaffAttendance() {
    let url = 'https://gisurat.com/govardhan/sainath_aloopuri/api/reports/staff_attendance_report.php?user_id=1&month=1&year=2026&page=1&per_page=10&export=pdf';
    window.open(url, '_blank');
    toggleExportDropdown();
}
function handleExportExcelURLFromBackendStaffAttendance() {
    let url = 'https://gisurat.com/govardhan/sainath_aloopuri/api/reports/staff_attendance_report.php?user_id=1&month=1&year=2026&page=1&per_page=10&export=excel';
    window.open(url, '_blank');
    toggleExportDropdown();
}       

window.handleExportPDFURLFromBackendStaffAttendance = handleExportPDFURLFromBackendStaffAttendance;
window.handleExportExcelURLFromBackendStaffAttendance = handleExportExcelURLFromBackendStaffAttendance;
// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE (ITEMS-ONLY NAMES)
// ============================================
window.changeItemPage = changeItemPage;
window.changeItemPerPage = changeItemPerPage;
window.showNotification = showNotification;
window.generateItemsTableHTML = generateItemsTableHTML;
window.initStaffExpMonthDropdown = initStaffExpMonthDropdown;
window.initStaffExpMothlyReportCard = initStaffExpMothlyReportCard;
window.handleStaffExpMonthChange = handleStaffExpMonthChange;
window.viewStaffMonthlyReport = viewStaffMonthlyReport;
window.toggleExportDropdown = toggleExportDropdown;
window.handlePrintStaffExpense = handlePrintStaffExpense;
window.handleStaffExportPDF = handleStaffExportPDF;
window.handleStaffExportExcel = handleStaffExportExcel;

// ============================================
// AUTO-REFRESH FUNCTIONALITY
// ============================================
function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    
    autoRefreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing Staff Expense Report data...');
        loadStaffAttendanceData().catch(err => {
            console.error('❌ Auto-refresh error:', err);
        });
    }, AUTO_REFRESH_INTERVAL);
    
    console.log('✅ Auto-refresh started (30s interval)');
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        console.log('⏸️  Auto-refresh stopped');
    }
}

window.startAutoRefresh = startAutoRefresh;
window.stopAutoRefresh = stopAutoRefresh;