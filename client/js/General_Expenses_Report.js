// ============================================
// ITEMS PAGE - CRUD OPERATIONS WITH PAGINATION
// ============================================

import { generalExpenseReportURLphp } from "../apis/api.js";
import { getItemsData } from "../apis/master_api.js";
import { showNotification } from "./notification.js";
import { printReport, exportToPDF, exportToExcel, toggleExportDropdown } from "./print/print.js";
// import { initAutoRefresh, createRefreshButton, updateRefreshButtonUI } from "./autoRefresh.js";

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

// Category Detail View Storage
let categoryDetailData = [];
let categoryDetailPage = 1;
let categoryDetailPerPage = 10;
let categoryDetailTotal = 0;
let categoryDetailTotalPages = 1;
let selectedCategoryName = '';
let selectedCategoryId = null;

// ============================================
// LOAD ITEMS DATA FROM API (SERVER PAGINATION)
// ============================================
function loadGeneralMonthlyReport() {
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

    const url = `${generalExpenseReportURLphp}?user_id=${currentUser.id}&month=${month}&year=${year}&page=${currentItemsPage}&per_page=${itemsPerPage}`;
    console.log(url);

    return getItemsData(url).then(data => {
        console.log(data);

        itemsData = data.records || [];
        itemsTotal = data.total ?? itemsData.length;
        itemsPerPage = data.per_page ?? itemsPerPage;
        itemsTotalPages = data.total_pages ?? Math.max(1, Math.ceil(itemsTotal / itemsPerPage));
        currentItemsPage = data.page ?? currentItemsPage;
    });
}

export function initGeneralMonthDropdown() {
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
    const refreshFunction = () => loadGeneralMonthlyReport().then(() => generateItemsTableHTML());
    // initAutoRefresh('general-expenses', refreshFunction, 30);

    return loadGeneralMonthlyReport().then(() => generateItemsTableHTML());
}



export function handleGeneralMonthChange(event) {

    currentDate = event.target.value;
    currentItemsPage = 1;
    return loadGeneralMonthlyReport().then(() => generateItemsTableHTML());
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
                <td><a href="javascript:void(0)" class="order-link" onclick="viewCategoryDetails('${item.category_id}')" style="cursor: pointer; color: #007bff; text-decoration: underline;">${item.category_name}</a></td>
                <td>${item.total_amount || item.amount || 0}</td>
            </tr>
        `;
    }
    document.getElementById("itemsTableBody").innerHTML = tableRows || `<tr><td colspan="6" style="text-align:center;">No records found</td></tr>`;
}
export function initGeneralMothlyReportCard() {

    let tableRows = "";
    return `
        <div class="content-card" id="table-container">
            <div class="items-header">
                <h2>General Expense Monthly Report</h2>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div class="inv-filter-group">
                        <select id="invMonthSelect" onchange="handleGeneralMonthChange(event)"></select>
                    </div>
                   
                    <button onclick="handlePrintGeneralExpense()" class="btn-print" title="Print Report">
                        <span style="font-size: 18px;">🖨️</span> Print
                    </button>
                    <div class="export-dropdown-wrapper" style="position: relative;">
                        <button onclick="toggleExportDropdown()" class="btn-export" title="Export Report">
                            <span style="font-size: 18px;">📥</span> Export
                        </button>
                        <div id="exportDropdown" class="export-dropdown-menu" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000; min-width: 150px; margin-top: 5px;">
                            <button onclick="handleExportPDFURLFromBackendGeneralExpense()" class="export-option" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">
                                <span>📄</span> PDF
                            </button>
                            <button onclick="handleExportExcelURLFromBackendGeneralExpense()" class="export-option" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">
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
                            <th>Category Name</th>
                            <th>Amount</th>
                            <!-- <th>Transaction Type</th>
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
// PAGINATION FUNCTIONS (SERVER-SIDE)
// ============================================
// CATEGORY DETAIL FUNCTIONS
// ============================================
function loadCategoryDetails(categoryId, page = 1) {
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

    const monthValue = currentDate ? parseInt(currentDate.split("-")[1], 10) : month;
    const yearValue = currentDate ? parseInt(currentDate.split("-")[0], 10) : year;

    // Get category name from main itemsData
    const categoryItem = itemsData.find(item => item.category_id == categoryId);
    selectedCategoryName = categoryItem ? categoryItem.category_name : 'Category #' + categoryId;
    selectedCategoryId = categoryId;
    categoryDetailPage = page;

    const url = `${generalExpenseReportURLphp}?user_id=${currentUser.id}&month=${monthValue}&year=${yearValue}&page=${page}&per_page=${categoryDetailPerPage}&category_id=${categoryId}`;
    console.log('Category Detail URL:', url);

    return getItemsData(url).then(data => {
        console.log('Category Detail Data:', data);
        categoryDetailData = data.records || [];
        categoryDetailTotal = data.total ?? categoryDetailData.length;
        categoryDetailPerPage = data.per_page ?? categoryDetailPerPage;
        categoryDetailTotalPages = data.total_pages ?? Math.max(1, Math.ceil(categoryDetailTotal / categoryDetailPerPage));
        categoryDetailPage = data.page ?? page;
    });
}
function capitalizeEachWord(text) {
    return text
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}


function generateCategoryDetailTableHTML() {
    let tableRows = "";

    for (let index = 0; index < categoryDetailData.length; index++) {
        const item = categoryDetailData[index];
        const serialNo = (categoryDetailPage - 1) * categoryDetailPerPage + index + 1;

        tableRows += `
            <tr>
                <td>${serialNo}</td>
                <td>${item.expense_date || 'N/A'}</td>
                <td>${item.category_name || ''}</td>
                <td>Rs. ${parseFloat(item.amount || 0).toFixed(2)}</td>
                <td>${item.account_name == "Cash" ? "N/A" : item.account_name}</td>
                <td>${item.payment_mode || ''}</td>
                <td>${item.notes || 'N/A'}</td>
            </tr>
        `;
    }

    const showingFrom = categoryDetailTotal > 0 ? (categoryDetailPage - 1) * categoryDetailPerPage + 1 : 0;
    const showingTo = Math.min(categoryDetailPage * categoryDetailPerPage, categoryDetailTotal);

    return `
        <div class="content-card" id="categoryDetailPage">
            <div class="items-header" >
                <div style="display: flex; align-items: center; gap: 10px;" >
                    <button onclick="backToMainReport()" class="btn-back" title="Back to Main Report" style="display: flex; align-items: center; gap: 5px; padding: 8px 12px; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <span>←</span>Back
                    </button>
                    <h2 style="margin: 0; text-transform: capitalize;">${capitalizeEachWord(selectedCategoryName)} - Expense Details</h2>
                </div>
                <!-- <div style="display: flex; gap: 10px; align-items: center;">
                    <button onclick="handlePrintCategoryDetail()" class="btn-print" title="Print Report">
                        <span style="font-size: 18px;">🖨️</span> Print
                    </button>
                    <div class="export-dropdown-wrapper" style="position: relative;">
                        <button onclick="toggleCategoryExportDropdown()" class="btn-export" title="Export Report">
                            <span style="font-size: 18px;">📥</span> Export
                        </button>
                        <div id="categoryExportDropdown" class="export-dropdown-menu" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000; min-width: 150px; margin-top: 5px;">
                            <button onclick="handleExportPDFURLFromBackendGeneralExpenseWithCategoryId()" class="export-option" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">
                                <span>📄</span> PDF
                            </button>
                            <button onclick="handleExportExcelURLFromBackendGeneralExpenseWithCategoryId()" class="export-option" style="display: block; width: 100%; padding: 10px 15px; border: none; background: none; text-align: left; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">
                                <span>📊</span> Excel
                            </button>
                        </div>
                    </div>
                </div> -->
             </div>

            <div class="table-container" style="overflow-x: auto; padding: 20px;">
                <table class="data-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Sr No</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Date</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Category</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Amount</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Account</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Payment Mode</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows || `<tr><td colspan="8" style="text-align:center; padding: 20px;">No records found</td></tr>`}
                    </tbody>
                </table>
            </div>

            <div class="pagination" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-top: 1px solid #ddd; background: #f8f9fa;">
                <div class="pagination-info" style="font-size: 14px; color: #666;">
                    Showing ${categoryDetailTotal === 0 ? 0 : showingFrom} to ${showingTo} of ${categoryDetailTotal} entries
                </div>
                <div class="pagination-controls" style="display: flex; gap: 10px;">
                    <button onclick="changeCategoryDetailPage('prev')" style="padding: 8px 14px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;" ${categoryDetailPage === 1 ? "disabled" : ""}>← Previous</button>
                    <span class="page-number" style="padding: 8px 14px;">Page ${categoryDetailPage} of ${categoryDetailTotalPages}</span>
                    <button onclick="changeCategoryDetailPage('next')" style="padding: 8px 14px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;" ${categoryDetailPage === categoryDetailTotalPages ? "disabled" : ""}>Next →</button>
                </div>
            </div>
        </div>
    `;
}

function viewCategoryDetails(categoryId) {
    return loadCategoryDetails(categoryId, 1).then(() => {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = generateCategoryDetailTableHTML();
        }
    }).catch(err => {
        console.error('Error loading category details:', err);
        showNotification("Error loading category details", "error");
    });
}

function backToMainReport() {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = initGeneralMothlyReportCard();
        currentItemsPage = 1;
        return initGeneralMonthDropdown();
    }
}

function changeCategoryDetailPage(direction) {
    let newPage = categoryDetailPage;

    if (direction === "next" && categoryDetailPage < categoryDetailTotalPages) {
        newPage = categoryDetailPage + 1;
    } else if (direction === "prev" && categoryDetailPage > 1) {
        newPage = categoryDetailPage - 1;
    } else {
        return;
    }

    return loadCategoryDetails(selectedCategoryId, newPage).then(() => {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = generateCategoryDetailTableHTML();
        }
    });
}

function toggleCategoryExportDropdown() {
    const dropdown = document.getElementById('categoryExportDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// ============================================
function changeItemPage(direction) {
    if (direction === "next" && currentItemsPage < itemsTotalPages) {
        currentItemsPage++;
    } else if (direction === "prev" && currentItemsPage > 1) {
        currentItemsPage--;
    } else {
        return Promise.resolve();
    }

    return loadGeneralMonthlyReport().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateItemsTableHTML();
        }
    });
}

function changeItemPerPage(value) {
    itemsPerPage = parseInt(value, 10) || 10;
    currentItemsPage = 1;

    return loadGeneralMonthlyReport().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateItemsTableHTML();
        }
    });
}

// ============================================
// CATEGORY DETAIL EXPORT FUNCTIONS
// ============================================
function prepareCategoryDetailPrintData() {
    const headers = ['Sr No', 'Date', 'Category', 'Amount'];
    const rows = categoryDetailData.map((item, index) => [
        (categoryDetailPage - 1) * categoryDetailPerPage + index + 1,
        item.expense_date || 'N/A',
        item.category_name || '',
        'Rs. ' + (parseFloat(item.amount || 0).toFixed(2))

    ]);

    const totalAmount = categoryDetailData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    return {
        headers: headers,
        rows: rows,
        totalAmount: totalAmount.toFixed(2)
    };
}

async function handlePrintCategoryDetail() {
    const printData = prepareCategoryDetailPrintData();

    if (!printData || !printData.rows || printData.rows.length === 0) {
        showNotification("No data available to print", "warning");
        return;
    }

    await printReport({
        headers: printData.headers,
        rows: printData.rows,
        reportTitle: `${selectedCategoryName} - Expense Details`,
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Expense Management System',
        logo: 'SA',
        additionalInfo: `
            <p><strong>Category:</strong> ${selectedCategoryName}</p>
            <p><strong>Total Amount:</strong> Rs. ${printData.totalAmount}</p>
            <p><strong>Total Records:</strong> ${categoryDetailTotal}</p>
            <p><strong>Report Period:</strong> ${currentDate || new Date().toLocaleDateString('en-IN')}</p>
        `
    });
}

async function handleCategoryExportPDF() {
    const printData = prepareCategoryDetailPrintData();

    console.log('Category Export PDF - printData:', printData);
    console.log('Category Export PDF - categoryDetailData:', categoryDetailData);
    console.log('Category Export PDF - rows length:', printData.rows ? printData.rows.length : 0);

    if (!printData || !printData.rows || printData.rows.length === 0) {
        showNotification("No data available to export", "warning");
        return;
    }

    await exportToPDF({
        reportTitle: `${selectedCategoryName} - Expense Details Report`,
        headers: printData.headers,
        rows: printData.rows,
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Expense Management System',
        additionalInfo: `Category: ${selectedCategoryName}\nTotal Amount: Rs. ${printData.totalAmount}\nTotal Records: ${categoryDetailTotal}`
    });
}

async function handleCategoryExportExcel() {
    const printData = prepareCategoryDetailPrintData();

    console.log('Category Export Excel - printData:', printData);
    console.log('Category Export Excel - categoryDetailData:', categoryDetailData);
    console.log('Category Export Excel - rows length:', printData.rows ? printData.rows.length : 0);

    if (!printData || !printData.rows || printData.rows.length === 0) {
        showNotification("No data available to export", "warning");
        return;
    }

    await exportToExcel({
        reportTitle: `${selectedCategoryName} - Expense Details Report`,
        headers: printData.headers,
        rows: printData.rows,
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Expense Management System',
        additionalInfo: `Category: ${selectedCategoryName}\nTotal Amount: Rs. ${printData.totalAmount}`
    });
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
async function handlePrintGeneralExpense() {
    const printData = await prepareGeneralExpensePrintData();

    if (!printData || printData.rows.length === 0) {
        showNotification("No data available to print", "warning");
        return;
    }

    await printReport({
        headers: printData.headers,
        rows: printData.rows,
        reportTitle: 'General Expense Report',
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Expense Management System',
        logo: 'SA',
        additionalInfo: `
            <p><strong>Report Period:</strong> ${currentDate || new Date().toLocaleDateString('en-IN')}</p>
            <p><strong>Total Records:</strong> ${itemsData.length}</p>
        `
    });
}

async function handleExportPDF() {
    const printData = await prepareGeneralExpensePrintData();
    console.log(printData.rows);

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
        reportTitle: `General Expenses Report - ${monthName} ${year}`,
        headers: printData.headers,
        rows: printData.rows,
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Management System',
        additionalInfo: `Report for Month: ${monthName} ${year}\nTotal Amount: Rs. ${printData.rows.reduce((sum, row) => sum + (parseFloat(row[2]) || 0), 0).toFixed(2)}`
    });
}

async function handleExportExcel() {
    const printData = await prepareGeneralExpensePrintData();
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
        reportTitle: `General Expenses Report - ${monthName} ${year}`,
        headers: printData.headers,
        rows: printData.rows,
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Management System',
        additionalInfo: `Report for Month: ${monthName} ${year}`
    });
}

async function prepareGeneralExpensePrintData() {
    const monthSelect = document.getElementById('invMonthSelect');
    const selectedMonth = monthSelect ? monthSelect.value : 'N/A';
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    await loadGeneralMonthlyReport();

    console.log('prepareGeneralExpensePrintData - itemsData loaded:', itemsData);

    const headers = ['Sr No', 'Category Name', 'Amount'];
    const rows = itemsData.map((item, index) => [
        (currentItemsPage - 1) * itemsPerPage + index + 1,
        item.category_name || '',
        item.total_amount || 0
    ]);

    return {
        headers: headers,
        rows: rows
    };
}


// =========================================================================================================
// general_expense_report : without category id
// PDF : https://gisurat.com/govardhan/sainath_aloopuri/api/reports/general_expense_report.php?user_id=1&month=1&year=2026&page=1&per_page=10&export=pdf

// Excel : https://gisurat.com/govardhan/sainath_aloopuri/api/reports/general_expense_report.php?user_id=1&month=1&year=2026&page=1&per_page=10&export=excel

// =========================================================================================================
// general_expense_report : with category id
// PDF = https://gisurat.com/govardhan/sainath_aloopuri/api/reports/general_expense_report.php?user_id=1&month=1&year=2026&page=1&per_page=10&category_id=1&export=pdf

// Excel = https://gisurat.com/govardhan/sainath_aloopuri/api/reports/general_expense_report.php?user_id=1&month=1&year=2026&page=1&per_page=10&category_id=1&export=excel

// =========================================================================================================

function handleExportPDFURLFromBackendGeneralExpense() {
    let url = 'https://gisurat.com/govardhan/sainath_aloopuri/api/reports/general_expense_report.php?user_id=1&month=1&year=2026&page=1&per_page=10&export=pdf';
    window.open(url, '_blank');
    toggleExportDropdown();
}
function handleExportExcelURLFromBackendGeneralExpense() {
    let url = 'https://gisurat.com/govardhan/sainath_aloopuri/api/reports/general_expense_report.php?user_id=1&month=1&year=2026&page=1&per_page=10&export=excel';
    window.open(url, '_blank');
    toggleExportDropdown();
}
// with category id
function handleExportPDFURLFromBackendGeneralExpenseWithCategoryId() {
    let url = `https://gisurat.com/govardhan/sainath_aloopuri/api/reports/general_expense_report.php?user_id=1&month=1&year=2026&page=1&per_page=10&category_id=${selectedCategoryId}&export=pdf`;
    window.open(url, '_blank');
    toggleExportDropdown();
}
function handleExportExcelURLFromBackendGeneralExpenseWithCategoryId() {
    let url = `https://gisurat.com/govardhan/sainath_aloopuri/api/reports/general_expense_report.php?user_id=1&month=1&year=2026&page=1&per_page=10&category_id=${selectedCategoryId}&export=excel`;
    window.open(url, '_blank');
    toggleExportDropdown();
}

window.handleExportPDFURLFromBackendGeneralExpense = handleExportPDFURLFromBackendGeneralExpense;
window.handleExportExcelURLFromBackendGeneralExpense = handleExportExcelURLFromBackendGeneralExpense;
window.handleExportPDFURLFromBackendGeneralExpenseWithCategoryId = handleExportPDFURLFromBackendGeneralExpenseWithCategoryId;
window.handleExportExcelURLFromBackendGeneralExpenseWithCategoryId = handleExportExcelURLFromBackendGeneralExpenseWithCategoryId;


// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE (ITEMS-ONLY NAMES)
// ============================================
window.changeItemPage = changeItemPage;

window.changeItemPerPage = changeItemPerPage;
window.showNotification = showNotification;
window.generateItemsTableHTML = generateItemsTableHTML;
window.initGeneralMonthDropdown = initGeneralMonthDropdown;
window.handleGeneralMonthChange = handleGeneralMonthChange;
window.toggleExportDropdown = toggleExportDropdown;
window.handlePrintGeneralExpense = handlePrintGeneralExpense;
window.handleExportPDF = handleExportPDF;
window.handleExportExcel = handleExportExcel;

// Category Detail Functions
window.viewCategoryDetails = viewCategoryDetails;
window.backToMainReport = backToMainReport;
window.changeCategoryDetailPage = changeCategoryDetailPage;
window.toggleCategoryExportDropdown = toggleCategoryExportDropdown;
window.handlePrintCategoryDetail = handlePrintCategoryDetail;
window.handleCategoryExportPDF = handleCategoryExportPDF;
window.handleCategoryExportExcel = handleCategoryExportExcel;

// ============================================
// RESPONSIVE DESIGN - MEDIA QUERIES FOR CONTENT CARD
// ============================================
const style = document.createElement('style');
style.textContent = `
/* Base styles for content card */
.content-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

/* Large Desktop (1440px and up) */
@media (min-width: 1440px) {
    .content-card {
        max-width: 1400px;
        margin: 0 auto;
    }
}

/* Desktop and Laptop (1024px to 1439px) */
@media (max-width: 1439px) {
    .content-card {
        margin: 20px;
    }
}

/* Tablet (768px to 1023px) */
@media (max-width: 600px) {
   
    .content-card .items-header > div {
        width: 100% !important;
    }
    
    .content-card .items-header h2 {
        font-size: 20px !important;
    }
    
    .content-card .items-header > div:last-child {
        justify-content: space-between !important;
    }
    
    .content-card .table-container {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
    
    .content-card .data-table {
        min-width: 700px;
    }
}

/* Mobile Landscape & Small Tablet (640px to 767px) */
@media (max-width: 767px) {
  
    .content-card .items-header {
        padding: 15px !important;
        gap: 12px !important;
    }
    
    .content-card .items-header h2 {
        font-size: 18px !important;
        margin-bottom: 0 !important;
    }
    
    .content-card .items-header > div {
        flex-direction: column !important;
        gap: 10px !important;
    }
    
    .content-card .items-header > div:first-child {
        flex-direction: row !important;
        align-items: center !important;
    }
    
    .content-card .items-header select,
    .content-card .items-header .btn-refresh {
        font-size: 13px !important;
        padding: 8px 12px !important;
    }
    
    .content-card .items-header > div:last-child {
        flex-direction: row !important;
        gap: 8px !important;
    }
    
    .content-card .btn-print,
    .content-card .btn-export,
    .content-card .btn-back {
        padding: 8px 12px !important;
        font-size: 13px !important;
    }
    
    .content-card .btn-print span,
    .content-card .btn-export span,
    .content-card .btn-back span {
        font-size: 16px !important;
    }
    
    .content-card .table-container {
        padding: 10px !important;
        margin: 0 !important;
    }
    
    .content-card .data-table {
        font-size: 13px !important;
        min-width: 600px;
    }
    
    .content-card .data-table th,
    .content-card .data-table td {
        padding: 10px 8px !important;
    }
    
    .content-card .data-table th {
        font-size: 12px !important;
        font-weight: 600 !important;
    }
    
    .content-card .pagination {
        flex-direction: column !important;
        gap: 12px !important;
        padding: 15px !important;
    }
    
    .content-card .pagination-info {
        text-align: center;
        order: 1;
    }
    
    .content-card .pagination-controls {
        
        order: 2;
        justify-content: center !important;
    }
    
    .content-card .pagination-controls button {
        padding: 8px 16px !important;
        font-size: 13px !important;
    }
}

/* Mobile Portrait (480px to 639px) */
@media (max-width: 639px) {
    .content-card {
        margin: 8px;
        border-radius: 6px;
    }
    
    .content-card .items-header {
        padding: 12px !important;
    }
    
    .content-card .items-header h2 {
        font-size: 16px !important;
    }
    
    .content-card .items-header select {
        font-size: 12px !important;
        padding: 6px 10px !important;
    }
    
    .content-card .table-container {
        padding: 8px !important;
    }
    
    .content-card .data-table {
        font-size: 12px !important;
        min-width: 500px;
    }
    
    .content-card .data-table th,
    .content-card .data-table td {
        padding: 8px 6px !important;
    }
    
    .content-card .pagination {
        padding: 12px !important;
        gap: 10px !important;
    }
    
    .content-card .pagination-controls {
        flex-direction: column !important;
        gap: 8px !important;
    }
    
    .content-card .pagination-controls button {
        width: 50% !important;
        padding: 10px !important;
    }
    
    .content-card .pagination-info {
        font-size: 12px !important;
    }
}

/* Extra Small Mobile (up to 479px) */
@media (max-width: 479px) {
    .content-card {
        margin: 5px;
        border-radius: 4px;
    }
    
    .content-card .items-header {
        padding: 10px !important;
        gap: 8px !important;
    }
    
    .content-card .items-header h2 {
        font-size: 14px !important;
    }

    .content-card .items-header > div:last-child {
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        justify-content: flex-start !important;
        align-items: flex-start !important;
    }
    
    .content-card .items-header select,
    .content-card .btn-print,
    .content-card .btn-export,
    .content-card .btn-back,
    .content-card .btn-refresh {
        
        max-width: 90px !important;
        max-height: 32px !important;
    }
    
    .content-card .btn-print span,
    .content-card .btn-export span,
    .content-card .btn-back span {
        font-size: 14px !important;
    }
    
    .content-card .table-container {
        padding: 5px !important;
    }
    
    .content-card .data-table {
        font-size: 11px !important;
        min-width: 450px;
    }
    
    .content-card .data-table th,
    .content-card .data-table td {
        padding: 6px 4px !important;
        white-space: nowrap;
    }
    
    .content-card .data-table th {
        font-size: 10px !important;
    }
    
    .content-card .clickable-row {
        cursor: pointer;
    }
    
    .content-card .pagination {
        padding: 10px !important;
        gap: 8px !important;
    }
    
    .content-card .pagination-controls button {
        padding: 8px !important;
        font-size: 11px !important;
    }
    
    .content-card .pagination-info {
        font-size: 11px !important;
    }
    
    /* Make dropdown menu more mobile-friendly */
    .content-card .export-dropdown {
        min-width: 120px !important;
        font-size: 11px !important;
    }
    
    .content-card .export-dropdown button {
        padding: 8px 10px !important;
    }
}

/* Ultra Small Devices (up to 360px) */
@media (max-width: 360px) {
    .content-card {
        margin: 3px;
    }
    
    .content-card .items-header h2 {
        font-size: 13px !important;
    }
    
    .content-card .data-table {
        font-size: 10px !important;
        min-width: 400px;
    }
    
    .content-card .data-table th,
    .content-card .data-table td {
        padding: 5px 3px !important;
    }
}
`;
document.head.appendChild(style);