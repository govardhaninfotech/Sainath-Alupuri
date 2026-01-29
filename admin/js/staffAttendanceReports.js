// ============================================
// ITEMS PAGE - CRUD OPERATIONS WITH PAGINATION
// ============================================

import { staffAttendanceReportURLphp } from "../apis/api.js";
import { getItemsData } from "../apis/master_api.js";
import { showNotification } from "./notification.js";
import { printReport, exportToPDF, exportToExcel, toggleExportDropdown } from "./print/print.js";

// Items Data Storage
let itemsData = [];

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

function reset() {
    itemsData = [];
    month = 0;
    year = 0;
    currentItemsPage = 1;   // matches API "page"
    itemsPerPage = 10;      // matches API "per_page"
    itemsTotal = 0;         // API "total"
    itemsTotalPages = 1;    // API "total_pages"
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

    console.log(month, year);
    if (month === 0 || year === 0) {
        console.log(month, year);
        let today = new Date();
        month = today.getMonth() + 1;
        year = today.getFullYear();
    }
    console.log(month, year);

    month = currentDate ? parseInt(currentDate.split("-")[1], 10) : month;
    year = currentDate ? parseInt(currentDate.split("-")[0], 10) : year;
    console.log(month, year);

    const url = `${staffAttendanceReportURLphp}?user_id=${currentUser.id}&month=${month}&year=${year}&page=${currentItemsPage}&per_page=${itemsPerPage}`;
    console.log(url);

    return getItemsData(url).then(data => {
        itemsData = data.records || [];
        itemsTotal = data.total ?? itemsData.length;
        itemsPerPage = data.per_page ?? itemsPerPage;
        itemsTotalPages = data.total_pages ?? Math.max(1, Math.ceil(itemsTotal / itemsPerPage));
        currentItemsPage = data.page ?? currentItemsPage;
    });
}


export function initStaffMonthDropdown() {
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
    return loadStaffAttendanceData().then(() => generateItemsTableHTML());
}
export function handleStaffMonthChange(event) {
    currentDate = event.target.value;
    currentItemsPage = 1;
    return loadStaffAttendanceData().then(() => generateItemsTableHTML());
}

function viewStaffsMonthlyReport(client_id) {
    showNotification("No Staff Attendance Report Viewed", "info");
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
                <td><a href="javascript:void(0)" class="order-link" onclick="viewStaffsMonthlyReport(${item.id})">${item.staff_name}</a></td>
                <td>${item.present_days}</td>
                <td>${item.absent_days}</td>
                <td>${item.half_days}</td>
                <td>${item.leaves}</td>
            </tr>
        `;
    }
    document.getElementById("itemsTableBody").innerHTML = tableRows || `<tr><td colspan="6" style="text-align:center;">No records found</td></tr>`;
}

export function initStaffAttendanceReportsCard() {
    reset();

    let tableRows = "";

    return `
        <div class="content-card">
            <div class="items-header">
                <h2>Staff Attendance Reports</h2>
                
                <div class="inv-filter-group">
                        <label for="invMonthSelect">ðŸ“… Month Selection</label>
                        <select id="invMonthSelect" onchange="handleStaffMonthChange(event)"></select>
                    </div>

                <!-- <button class="btn-add" onclick="openStaffAttendanceForm()">Add Staff Attendance</button> -->
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button class="btn-add" onclick="toggleExportDropdown()" style="background: #4CAF50; color: white;">ðŸ“¥ Export</button>
                    <div id="exportDropdown" style="display:none; position:absolute; background:white; border:1px solid #ddd; border-radius:4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index:100; min-width: 150px;">
                        <button onclick="handleExportPDF()" style="display:block; width:100%; padding:10px; border:none; text-align:left; cursor:pointer; background:none; font-size:14px;">ðŸ“„ Export as PDF</button>
                        <button onclick="handleExportExcel()" style="display:block; width:100%; padding:10px; border:none; text-align:left; cursor:pointer; background:none; font-size:14px;">ðŸ“Š Export as Excel</button>
                    </div>
                </div>
             </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Staff Name</th>
                            <th>Presence</th>
                            <th>Absent</th>
                            <th>Halfday</th>
                            <th>Leave</th>
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

// ============================================
// EXPORT FUNCTIONS
// ============================================
async function handleExportPDF() {
    const monthSelect = document.getElementById('invMonthSelect');
    const selectedMonth = monthSelect ? monthSelect.value : 'N/A';
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    
    const headers = ['Sr No', 'Staff Name', 'Present Days', 'Absent Days', 'Half Days', 'Leaves'];
    const rows = itemsData.map((item, index) => [
        (currentItemsPage - 1) * itemsPerPage + index + 1,
        item.staff_name,
        item.present_days,
        item.absent_days,
        item.half_days,
        item.leaves
    ]);

    await exportToPDF({
        reportTitle: `Staff Attendance Report - ${monthName} ${year}`,
        headers: headers,
        rows: rows,
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Management System',
        additionalInfo: `Report for Month: ${monthName} ${year}`
    });
}

async function handleExportExcel() {
    const monthSelect = document.getElementById('invMonthSelect');
    const selectedMonth = monthSelect ? monthSelect.value : 'N/A';
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    
    const headers = ['Sr No', 'Staff Name', 'Present Days', 'Absent Days', 'Half Days', 'Leaves'];
    const rows = itemsData.map((item, index) => [
        (currentItemsPage - 1) * itemsPerPage + index + 1,
        item.staff_name,
        item.present_days,
        item.absent_days,
        item.half_days,
        item.leaves
    ]);

    await exportToExcel({
        reportTitle: `Staff Attendance Report - ${monthName} ${year}`,
        headers: headers,
        rows: rows,
        companyName: 'Sainath Alupuri',
        companySubtitle: 'Management System',
        additionalInfo: `Report for Month: ${monthName} ${year}`
    });
}


// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE (ITEMS-ONLY NAMES)
// ============================================
window.changeItemPage = changeItemPage;
window.changeItemPerPage = changeItemPerPage;
window.showNotification = showNotification;
window.generateItemsTableHTML = generateItemsTableHTML;
window.handleStaffMonthChange = handleStaffMonthChange;
window.initStaffAttendanceReportsCard = initStaffAttendanceReportsCard;
window.initStaffMonthDropdown = initStaffMonthDropdown;
window.viewStaffsMonthlyReport = viewStaffsMonthlyReport;
window.toggleExportDropdown = toggleExportDropdown;
window.handleExportPDF = handleExportPDF;
window.handleExportExcel = handleExportExcel;