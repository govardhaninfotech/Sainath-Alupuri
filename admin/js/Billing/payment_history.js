// ============================================
// ITEMS PAGE - CRUD OPERATIONS WITH PAGINATION
// ============================================

import { paymentHistoryURLphp } from "../../apis/api.js";
import { getItemsData } from "../../apis/master_api.js";
import { showNotification } from "../notification.js";

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
let currentUser = null;
let client_id = 0;

function loadCurrentUser() {

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
}

// ============================================
// LOAD ITEMS DATA FROM API (SERVER PAGINATION)
// ============================================
function loadPaymentHistoryData() {
    loadCurrentUser();

    if (month === 0 || year === 0) {
        let today = new Date();
        month = today.getMonth() + 1;
        year = today.getFullYear();
    }
    month = currentDate ? parseInt(currentDate.split("-")[1], 10) : month;
    year = currentDate ? parseInt(currentDate.split("-")[0], 10) : year;

    const url = `${paymentHistoryURLphp}?user_id=${currentUser.id}&month=${month}&year=${year}&client_id=${client_id}&page=${currentItemsPage}&per_page=${itemsPerPage}`;
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


export function initClientDropdown() {
    console.log(itemsData);

    const clientSelect = document.getElementById("invClientSelect");
    if (!clientSelect) return;
    clientSelect.innerHTML = "";
    const today = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(today.getMonth() - i);
        const value = d.toISOString().slice(0, 7);
        const label = d.toLocaleString("default", { month: "long", year: "numeric" });
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        clientSelect.appendChild(opt);
    }
    return loadPaymentHistoryData().then(() => generateItemsTableHTML());
}

export function handlePaymentHistoryChange(event) {
    console.log(currentDate);

    currentDate = event.target.value;
    console.log(currentDate);
    currentItemsPage = 1;
    return loadPaymentHistoryData().then(() => generateItemsTableHTML());
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
        console.log(item);
        const serialNo = (currentItemsPage - 1) * itemsPerPage + index + 1;
        tableRows += `
            <tr>
                <td>${serialNo}</td>
                <td>${item.client_name}</td>
                <td>${item.shop_code}</td>
                <td>${item.amount}</td>
                <!-- <td>${item.payment_mode == "Cash" ? "Cash" : item.account_name}</td> -->
                <td>${item.account_name} ${item.payment_mode}</td>
                <td>${item.reference_no}</td>
                <td>${item.payment_date}</td>
                <!-- <td>${item.payment_mode}</td> -->
                <td>${item.notes}</td>
            </tr>
        `;
    }
    document.getElementById("itemsTableBody").innerHTML = tableRows || `<tr><td colspan="6" style="text-align:center;">No records found</td></tr>`;
}
export function initPaymentHistoryCard() {

    let tableRows = "";
    return `
        <div class="content-card" id="table-container">
            <div class="items-header">
                <h2>Payment History Report</h2>
                <div class="inv-filter-group">
                        <label for="invClientSelect">Client Selection</label>
                        <select id="invClientSelect" onchange="handlePaymentHistoryChange(event)"></select>
                    </div>
                <button class="btn-add">Print</button>
               
            </div>

            <div class="table-container" id="table-container">
                <table class="data-table" >
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Client Name</th>
                            <th>Shop</th>
                            <th>Amount</th>
                            <th>Payment Mode</th>
                            <th>Reference No</th>
                            <th>Date</th>
                            <th>Notes</th>
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

    return loadPaymentHistoryData().then(() => {
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.innerHTML = generateItemsTableHTML();
        }
    });
}

function changeItemPerPage(value) {
    itemsPerPage = parseInt(value, 10) || 10;
    currentItemsPage = 1;

    return loadPaymentHistoryData().then(() => {
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
window.initClientDropdown = initClientDropdown;
window.handlePaymentHistoryChange = handlePaymentHistoryChange;