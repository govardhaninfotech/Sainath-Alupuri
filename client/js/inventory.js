// inventory.js - Live PHP API Integration
// Purpose: Manage staff expenses with live PHP backend

import { staffURLphp, bankURLphp, expenseCategoriesURLphp } from "../apis/api.js";
import { showNotification, showConfirm } from "./notification.js";

console.log("inventory.js: loaded with live API");

// Base URL for expenses
const baseURL = "https://gisurat.com/govardhan/sainath_aloopuri/api";
const EXPENSES_URL = `${baseURL}/expenses.php`;

let currentUser = JSON.parse(localStorage.getItem("rememberedUser") || sessionStorage.getItem("rememberedUser"));
let user_id = currentUser?.id;

let invAllStaff = [];
let invFilteredStaff = [];
let invSelectedStaff = null;
let invExpenses = [];
let invBankAccounts = [];
let invExpenseCategories = [];

/**
 * Public functions
 */
export function renderInventoryStaffPage() {
    return fetch("inventory_staff.html")
        .then(res => res.text())
        .then(html => {
            return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        })
        .catch(err => {
            console.error("inventory.js: Error loading inventory_staff.html:", err);
            return `<div class="content-card"><p>Error loading Inventory Staff page.</p></div>`;
        });
}

export function initInventoryStaffPage() {
    console.log("inventory.js: initInventoryStaffPage()");

    setTimeout(() => {
        setDefaultDateToday();
        initMonthDropdown();
        attachEventListeners();
        handlePaymentModeChange("cash");


        // Load all required data
        Promise.all([
            fetchStaffList(),
            fetchBankAccounts(),
            fetchExpenseCategories()
        ]).then(() => {
            const staffIdFromUrl = getQueryParam("staff_id");
            const staffIdFromStorage = localStorage.getItem("selectedStaffId");
            const staffIdToSelect = staffIdFromUrl || staffIdFromStorage;

            if (staffIdToSelect) {
                if (staffIdFromStorage) {
                    localStorage.removeItem("selectedStaffId");
                }
                setTimeout(() => {
                    selectStaffById(staffIdToSelect);
                }, 100);
            }
        }).catch(err => {
            console.error("Error loading initial data:", err);
            showNotification("Error loading data. Please refresh the page.", "error");
        });
    }, 50);
}

/* ============================
   Utilities & DOM helpers
   ============================ */

function getQueryParam(name) {
    try {
        return new URLSearchParams(window.location.search).get(name);
    } catch (e) {
        return null;
    }
}

function selectStaffById(staffId) {
    const staffSelect = document.getElementById("invStaffSelect");
    if (!staffSelect) return;

    const exists = Array.from(staffSelect.options).some(o => String(o.value) === String(staffId));
    if (exists) {
        staffSelect.value = String(staffId);
        handleStaffSelection(String(staffId));
    } else {
        console.warn("Staff ID not found in dropdown:", staffId);
    }
}

/* ============================
   Initialization helpers
   ============================ */

function setDefaultDateToday() {
    const dateInput = document.getElementById("invExpenseDate");
    if (!dateInput) return;
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
}

function initMonthDropdown() {
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
}

function attachEventListeners() {
    const statusSelect = document.getElementById("invStatusSelect");
    const staffSelect = document.getElementById("invStaffSelect");
    const monthSelect = document.getElementById("invMonthSelect");
    const submitBtn = document.getElementById("invSubmitExpense");
    const paymentSelect = document.getElementById("invPaymentMode");

    if (statusSelect) statusSelect.addEventListener("change", () => { applyStatusFilter(); });
    if (staffSelect) staffSelect.addEventListener("change", (e) => { handleStaffSelection(e.target.value); });
    if (monthSelect) monthSelect.addEventListener("change", () => { renderExpenses(); calculateTotals(); });
    if (submitBtn) submitBtn.addEventListener("click", handleSubmitExpense);

    // Add payment mode change listener
    if (paymentSelect) {
        paymentSelect.addEventListener("change", (e) => {
            handlePaymentModeChange(e.target.value);
        });
    }
}

/* ============================
   API Data Fetching
   ============================ */

async function fetchStaffList() {
    const staffSelect = document.getElementById("invStaffSelect");
    if (staffSelect) staffSelect.innerHTML = "<option value=''>Loading staff...</option>";

    try {
        const res = await fetch(`${staffURLphp}?user_id=${user_id}`);
        if (!res.ok) throw new Error(`Staff API returned ${res.status}`);

        const json = await res.json();

        if (Array.isArray(json)) {
            invAllStaff = json;
        } else if (json?.staff && Array.isArray(json.staff)) {
            invAllStaff = json.staff;
        } else if (json?.data && Array.isArray(json.data)) {
            invAllStaff = json.data;
        } else {
            invAllStaff = [];
        }

        console.log("Staff loaded:", invAllStaff.length);
        applyStatusFilter();
    } catch (e) {
        console.error("Error fetching staff list:", e);
        if (staffSelect) staffSelect.innerHTML = "<option value=''>Error loading staff</option>";
        showNotification("Failed to load staff list", "error");
        throw e;
    }
}

async function fetchBankAccounts() {
    try {
        const res = await fetch(`${bankURLphp}?user_id=${user_id}`);
        if (!res.ok) throw new Error(`Bank API returned ${res.status}`);

        const json = await res.json();

        if (Array.isArray(json)) {
            invBankAccounts = json;
        } else if (json?.bank_accounts && Array.isArray(json.bank_accounts)) {
            invBankAccounts = json.bank_accounts;
        } else if (json?.data && Array.isArray(json.data)) {
            invBankAccounts = json.data;
        } else {
            invBankAccounts = [];
        }

        console.log("Bank accounts loaded:", invBankAccounts.length);
        populateBankAccountDropdown();
    } catch (e) {
        console.error("Error fetching bank accounts:", e);
        invBankAccounts = [];
        populateBankAccountDropdown();
    }
}

async function fetchExpenseCategories() {
    try {
        const res = await fetch(`${expenseCategoriesURLphp}?user_id=${user_id}`);
        if (!res.ok) throw new Error(`Categories API returned ${res.status}`);

        const json = await res.json();

        if (Array.isArray(json)) {
            invExpenseCategories = json;
        } else if (json?.categories && Array.isArray(json.categories)) {
            invExpenseCategories = json.categories;
        } else if (json?.data && Array.isArray(json.data)) {
            invExpenseCategories = json.data;
        } else {
            invExpenseCategories = [];
        }

        console.log("Expense categories loaded:", invExpenseCategories.length);
        populateCategoryDropdown();
    } catch (e) {
        console.error("Error fetching expense categories:", e);
        invExpenseCategories = [];
        populateCategoryDropdown();
    }
}

function populateBankAccountDropdown() {
    const bankSelect = document.getElementById("invBankAccount");
    if (!bankSelect) return;

    bankSelect.innerHTML = '<option value="">Select Bank Account</option>';
    invBankAccounts.forEach(bank => {
        const opt = document.createElement("option");
        opt.value = bank.id;
        opt.textContent = `${bank.bank_name || bank.account_name || 'Bank'} - ${bank.account_number || ''}`;
        bankSelect.appendChild(opt);
    });
}

function populateCategoryDropdown() {
    const categorySelect = document.getElementById("invExpenseCategory");
    if (!categorySelect) return;

    categorySelect.innerHTML = '<option value="">Select Category</option>';
    invExpenseCategories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name || cat.category_name || `Category ${cat.id}`;
        categorySelect.appendChild(opt);
    });
}

/* ============================
   Staff Selection & Filtering
   ============================ */

function applyStatusFilter() {
    const statusSelect = document.getElementById("invStatusSelect");
    const staffSelect = document.getElementById("invStaffSelect");
    if (!staffSelect) return;

    const status = statusSelect ? statusSelect.value : "all";
    invFilteredStaff = (invAllStaff || []).filter(s => {
        if (status === "all") return true;
        return (s.status || "").toLowerCase() === status.toLowerCase();
    });

    staffSelect.innerHTML = '<option value="">Select Staff</option>';
    invFilteredStaff.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name || `Staff ${s.id}`;
        staffSelect.appendChild(opt);
    });

    invSelectedStaff = null;
    updateStaffHeader();
    clearExpenses();
}

function handleStaffSelection(staffId) {
    if (!staffId) {
        invSelectedStaff = null;
        updateStaffHeader();
        clearExpenses();
        return;
    }

    invSelectedStaff = invFilteredStaff.find(s => String(s.id) === String(staffId)) || null;

    if (!invSelectedStaff) {
        invSelectedStaff = (invAllStaff || []).find(s => String(s.id) === String(staffId)) || null;
    }

    updateStaffHeader();
    if (invSelectedStaff) {
        loadExpensesForStaff();
    } else {
        clearExpenses();
    }
}

function updateStaffHeader() {
    const salaryEl = document.getElementById("invStaffSalary");
    const nameEl = document.getElementById("invStaffName");

    if (salaryEl) {
        salaryEl.textContent = invSelectedStaff ? (invSelectedStaff.salary || "0") : "0";
    }
    if (nameEl) {
        nameEl.textContent = invSelectedStaff ? (invSelectedStaff.name || "") : "";
    }
}

/* ============================
   Expenses Loading & Display
   ============================ */

async function loadExpensesForStaff() {
    if (!invSelectedStaff) {
        renderExpenses();
        calculateTotals();
        return;
    }

    try {
        console.log("Loading expenses for staff:", invSelectedStaff.id);

        const res = await fetch(`${EXPENSES_URL}?user_id=${user_id}&staff_id=${invSelectedStaff.id}`);
        if (!res.ok) {
            console.warn("Expenses API returned", res.status);
            invExpenses = [];
            renderExpenses();
            calculateTotals();
            return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
            invExpenses = data;
        } else if (data?.expenses && Array.isArray(data.expenses)) {
            invExpenses = data.expenses;
        } else if (data?.data && Array.isArray(data.data)) {
            invExpenses = data.data;
        } else {
            invExpenses = [];
        }

        console.log("Expenses loaded:", invExpenses.length);
        renderExpenses();
        calculateTotals();
    } catch (e) {
        console.error("Error loading expenses:", e);
        invExpenses = [];
        renderExpenses();
        calculateTotals();
    }
}

function clearExpenses() {
    invExpenses = [];
    renderExpenses();
    calculateTotals();
}

function renderExpenses() {
    const tbody = document.getElementById("invExpenseList");
    const emptyState = document.getElementById("invEmptyState");
    if (!tbody) return;

    tbody.innerHTML = "";

    const monthSelect = document.getElementById("invMonthSelect");
    const selectedMonth = monthSelect ? monthSelect.value : null;

    let filtered = invExpenses;
    if (selectedMonth) {
        filtered = invExpenses.filter(e => {
            const expDate = e.expense_date || e.date || "";
            // Handle both YYYY-MM-DD and DD-MM-YYYY formats
            let dateStr = "";
            if (expDate.includes("-")) {
                const parts = expDate.split("-");
                if (parts[0].length === 4) {
                    dateStr = expDate.slice(0, 7); // YYYY-MM
                } else {
                    dateStr = `${parts[2]}-${parts[1]}`; // Convert DD-MM-YYYY to YYYY-MM
                }
            }
            return dateStr === selectedMonth;
        });
    }

    if (!filtered.length) {
        if (emptyState) emptyState.classList.add("show");
        return;
    }

    if (emptyState) emptyState.classList.remove("show");

    filtered.forEach((exp, i) => {
        const bankAccount = invBankAccounts.find(b => String(b.id) === String(exp.bank_account_id));
        const category = invExpenseCategories.find(c => String(c.id) === String(exp.category_id));

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td data-label="#">${i + 1}</td>
            <td data-label="Date">${exp.expense_date || exp.date || "-"}</td>
            <td data-label="Category">${category?.name || category?.category_name || "-"}</td>
            <td data-label="Amount">₹${Number(exp.amount || 0).toFixed(2)}</td>
            <td data-label="Payment">${exp.payment_mode || "-"}</td>
            <td data-label="Bank">${bankAccount?.bank_name || bankAccount?.account_name || "-"}</td>
            <td data-label="Notes">${exp.note || exp.notes || "-"}</td>
            <td data-label="Actions">
                <button class="action-btn delete-btn" onclick="window.handleDeleteExpense(${exp.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.handleDeleteExpense = async function (expenseId) {
    try {
        const confirmed = await showConfirm("Are you sure you want to delete this expense?", "warning");
        if (!confirmed) return;

        const res = await fetch(`${EXPENSES_URL}?id=${expenseId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        if (!res.ok) throw new Error("Delete failed with status " + res.status);

        invExpenses = invExpenses.filter(e => e.id !== expenseId);
        renderExpenses();
        calculateTotals();
        showNotification("Expense deleted successfully.", "success");
    } catch (e) {
        console.error("Failed to delete expense:", e);
        showNotification("Error deleting expense.", "error");
    }
};

function calculateTotals() {
    const totalExpenseEl = document.getElementById("invTotalExpense");
    const balanceEl = document.getElementById("invFinalBalance");
    if (!totalExpenseEl || !balanceEl) return;

    const salary = invSelectedStaff ? Number(invSelectedStaff.salary || 0) : 0;
    const monthSelect = document.getElementById("invMonthSelect");
    const selectedMonth = monthSelect ? monthSelect.value : null;

    let filtered = invExpenses;
    if (selectedMonth) {
        filtered = invExpenses.filter(e => {
            const expDate = e.expense_date || e.date || "";
            let dateStr = "";
            if (expDate.includes("-")) {
                const parts = expDate.split("-");
                if (parts[0].length === 4) {
                    dateStr = expDate.slice(0, 7);
                } else {
                    dateStr = `${parts[2]}-${parts[1]}`;
                }
            }
            return dateStr === selectedMonth;
        });
    }

    const totalExpense = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
    const balance = salary - totalExpense;

    totalExpenseEl.textContent = totalExpense.toFixed(2);
    balanceEl.textContent = `₹${balance.toFixed(2)}`;
    balanceEl.style.color = balance >= 0 ? "inherit" : "#991b1b";
}

/* ============================
   Submit Expense
   ============================ */
async function handleSubmitExpense() {
    if (!invSelectedStaff) {
        showNotification("Please select a staff first.", "error");
        return;
    }

    const amountInput = document.getElementById("invExpenseAmount");
    const dateInput = document.getElementById("invExpenseDate");
    const noteInput = document.getElementById("invExpenseNote");
    const bankSelect = document.getElementById("invBankAccount");
    const paymentSelect = document.getElementById("invPaymentMode");
    const categorySelect = document.getElementById("invExpenseCategory");

    if (!amountInput || !dateInput) return;

    const amount = Number(amountInput.value);
    const date = dateInput.value;
    const note = noteInput ? noteInput.value.trim() : "";
    const bankAccountId = bankSelect ? bankSelect.value : "";
    const paymentMode = paymentSelect ? paymentSelect.value : "cash";
    const categoryId = categorySelect ? categorySelect.value : "";

    // Validation
    if (!amount || !date) {
        showNotification("Please enter amount and date.", "error");
        return;
    }
    if (amount <= 0) {
        showNotification("Amount must be greater than zero.", "error");
        return;
    }
    if (!categoryId) {
        showNotification("Please select an expense category.", "error");
        return;
    }
    if (!bankAccountId) {
        showNotification("Please select a bank account.", "error");
        return;
    }

    // Convert date from YYYY-MM-DD to DD-MM-YYYY format
    const [year, month, day] = date.split("-");
    const formattedDate = `${day}-${month}-${year}`;

    const payload = {
        user_id: user_id,
        staff_id: invSelectedStaff.id,
        category_id: parseInt(categoryId),
        amount: amount,
        expense_date: formattedDate,
        bank_account_id: parseInt(bankAccountId),
        payment_mode: paymentMode,
        note: note
    };

    const confirmed = await showConfirm("Are you sure you want to add this expense?", "warning");
    if (!confirmed) return;

    try {
        const res = await fetch(EXPENSES_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("API Error:", errorText);
            throw new Error("POST failed " + res.status);
        }

        const created = await res.json();

        // Reload expenses to get fresh data
        await loadExpensesForStaff();

        // Clear form
        amountInput.value = "";
        if (noteInput) noteInput.value = "";
        if (categorySelect) categorySelect.value = "";
        if (bankSelect) bankSelect.value = "";
        if (paymentSelect) paymentSelect.value = "cash";
        setDefaultDateToday();

        showNotification("Expense added successfully.", "success");
    } catch (e) {
        console.error("Error posting expense:", e);
        showNotification("Error while adding expense. Please try again.", "error");
    }
}

/* Expose for outside use */
window.initInventoryStaffPage = initInventoryStaffPage;
window.renderInventoryStaffPage = renderInventoryStaffPage;