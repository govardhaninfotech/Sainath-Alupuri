// inventory.js - Live PHP API Integration
// Purpose: Manage staff expenses with live PHP backend

import { staffURLphp, bankURLphp, expenseURLphp, expenseCategoriesURLphp } from "../apis/api.js";
import { showNotification, showConfirm } from "./notification.js";

console.log("inventory.js: loaded with live API");

let currentUser = JSON.parse(localStorage.getItem("rememberedUser") || sessionStorage.getItem("rememberedUser"));
let user_id = currentUser?.id;

let invAllStaff = [];
let invFilteredStaff = [];
let invSelectedStaff = null;
let invExpenses = [];
let bankAccountData = [];

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

        // Load all required data
        Promise.all([
            fetchStaffList(),
            fetchBankAccounts()
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
                }, 10);
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
   Modal Functions
   ============================ */

window.openExpenseForm = function() {
    if (!invSelectedStaff) {
        showNotification("Please select a staff member first.", "error");
        return;
    }
    
    const modal = document.getElementById("expenseFormModal");
    if (modal) {
        modal.style.display = "flex";
        setTimeout(() => {
            modal.classList.add("show");
        }, 10);
        
        // Reset form
        const form = document.getElementById("expenseForm");
        if (form) form.reset();
        
        setDefaultDateToday();
        
        // Reset payment mode to cash and disable bank account
        const paymentModeSelect = document.getElementById("expensePaymentMode");
        if (paymentModeSelect) {
            paymentModeSelect.value = "cash";
            handleInventoryPaymentMode("cash");
        }
    }
};

window.closeExpenseForm = function() {
    const modal = document.getElementById("expenseFormModal");
    if (modal) {
        modal.classList.remove("show");
        setTimeout(() => {
            modal.style.display = "none";
        }, 300);
        
        // Reset form
        const form = document.getElementById("expenseForm");
        if (form) form.reset();
    }
};

// Handle payment mode change for inventory form
window.handleInventoryPaymentMode = function(paymentMode) {
    const bankAccountSelect = document.getElementById("expenseBankAccount");
    
    if (paymentMode === 'cash') {
        bankAccountSelect.disabled = true;
        bankAccountSelect.value = "";
        bankAccountSelect.innerHTML = '<option value="">N/A</option>';
    } else if (paymentMode === 'upi') {
        bankAccountSelect.disabled = false;
        bankAccountSelect.innerHTML = '<option value="">Settle UPI</option>';
        bankAccountSelect.value = "";
    } else if (paymentMode === 'bank') {
        bankAccountSelect.disabled = false;
        bankAccountSelect.innerHTML = '<option value="">Select Bank</option>';
        // Populate with bank accounts
        populateBankAccountDropdown("", "");
        bankAccountSelect.value = "";
    }
};

// Close modal when clicking outside
window.addEventListener("click", function(event) {
    const modal = document.getElementById("expenseFormModal");
    if (event.target === modal || (event.target.classList && event.target.classList.contains("expense-modal-overlay"))) {
        closeExpenseForm();
    }
});

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
    for (let i = 0; i < 3; i++) {
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
    const staffSelect = document.getElementById("invStaffSelect");
    const monthSelect = document.getElementById("invMonthSelect");
    const expenseForm = document.getElementById("expenseForm");

    if (staffSelect) staffSelect.addEventListener("change", (e) => { handleStaffSelection(e.target.value); });
    if (monthSelect) monthSelect.addEventListener("change", () => { renderExpenses(); calculateTotals(); });
    if (expenseForm) expenseForm.addEventListener("submit", handleSubmitExpense);
    
    // Setup payment mode change handler
    setupPaymentModeChangeHandler();
}

/* ============================
   API Data Fetching
   ============================ */

async function fetchStaffList() {
    const staffSelect = document.getElementById("invStaffSelect");
    if (!staffSelect) {
        console.error("Staff select element not found!");
        return;
    }

    staffSelect.innerHTML = "<option value=''>Loading staff...</option>";

    try {
        console.log("Fetching staff for user_id:", user_id);
        const res = await fetch(`${staffURLphp}?user_id=${user_id}`);
        if (!res.ok) throw new Error(`Staff API returned ${res.status}`);

        const json = await res.json();
        console.log("Staff API Response:", json);

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
        console.log("Fetching bank accounts for user_id:", user_id);
        const res = await fetch(`${bankURLphp}?user_id=${user_id}`);
        if (!res.ok) throw new Error(`Bank API returned ${res.status}`);

        const json = await res.json();
        console.log("Bank API Response:", json);

        if (Array.isArray(json)) {
            bankAccountData = json;
        } else if (json?.accounts && Array.isArray(json.accounts)) {
            bankAccountData = json.accounts;
        } else if (json?.data && Array.isArray(json.data)) {
            bankAccountData = json.data;
        } else {
            bankAccountData = [];
        }

        console.log("Bank accounts loaded:", bankAccountData.length);
    } catch (e) {
        console.error("Error fetching bank accounts:", e);
        bankAccountData = [];
        showNotification("Failed to load bank accounts", "error");
    }
}

/* ============================
   Staff Selection & Filtering
   ============================ */

function applyStatusFilter() {
    const staffSelect = document.getElementById("invStaffSelect");
    if (!staffSelect) return;

    console.log(invAllStaff);
    invFilteredStaff = invAllStaff || [];
    console.log(invFilteredStaff);

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
    const balanceCard = document.getElementById("staffBalanceCard");

    if (salaryEl) {
        const salary = invSelectedStaff ? parseFloat(invSelectedStaff.salary || 0) : 0;
        salaryEl.textContent = `₹${salary.toFixed(2)}`;
    }

    // Update balance display
    if (balanceCard && invSelectedStaff) {
        const totalExpenses = invExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
        const salary = parseFloat(invSelectedStaff.salary || 0);
        const balance = salary - totalExpenses;
        const balanceColor = balance >= 0 ? '#10b981' : '#ef4444';

        balanceCard.innerHTML = `
            <div style="font-size: 20px; font-weight: 700; color: ${balanceColor};">₹${Math.abs(balance).toFixed(2)}</div>
        `;
    }
}

/* ============================
   Bank Account Filtering
   ============================ */

function getAccountsByPaymentMode(paymentMode) {
    if (!paymentMode) return bankAccountData;
    
    const mode = paymentMode.toLowerCase();
    
    if (mode === 'cash') {
        return [];
    } else if (mode === 'upi') {
        // Filter accounts that support UPI (type = 'upi' or name contains 'upi')
        return bankAccountData.filter(acc => 
            acc.type?.toLowerCase() === 'upi' || 
            acc.name?.toLowerCase().includes('upi') ||
            acc.account_name?.toLowerCase().includes('upi')
        );
    } else if (mode === 'bank') {
        // Filter accounts that are bank accounts (type = 'bank')
        return bankAccountData.filter(acc => 
            acc.type?.toLowerCase() === 'bank' ||
            (!acc.type && acc.account_number) // Fallback for accounts without explicit type
        );
    }
    
    return bankAccountData;
}

function populateBankAccountDropdown(selectedBankId = "", paymentMode = "") {
    const select = document.getElementById("expenseBankAccount");
    if (!select) {
        console.error("Bank account select element not found");
        return;
    }

    // If cash is selected, disable the bank account field
    if (paymentMode.toLowerCase() === 'cash') {
        select.disabled = true;
        select.innerHTML = `<option value="">Not applicable for Cash</option>`;
        select.value = "";
        select.removeAttribute('required');
        return;
    }

    select.disabled = false;
    select.setAttribute('required', 'required');

    // Get filtered accounts based on payment mode
    const filteredAccounts = paymentMode ? getAccountsByPaymentMode(paymentMode) : bankAccountData;

    console.log(`Populating bank account dropdown with ${filteredAccounts.length} accounts for mode: ${paymentMode}`);

    select.innerHTML = `<option value="">Select Account</option>`;

    if (filteredAccounts.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = `No ${paymentMode} accounts available`;
        opt.disabled = true;
        select.appendChild(opt);
        console.warn("No bank accounts to populate");
        return;
    }

    filteredAccounts.forEach((bank) => {
        const opt = document.createElement("option");
        opt.value = bank.id || bank.account_id;

        const bankName = bank.bank_name || bank.account_name || bank.name || 'Account';
        const accountNumber = bank.account_number || bank.acc_number || bank.number || '';

        opt.textContent = `${bankName}${accountNumber ? ' - ' + accountNumber : ''}`;
        select.appendChild(opt);
    });

    if (selectedBankId) {
        select.value = String(selectedBankId);
    }

    console.log("Bank dropdown populated with", select.options.length - 1, "accounts");
}

function setupPaymentModeChangeHandler() {
    const paymentModeSelect = document.getElementById("expensePaymentMode");
    if (!paymentModeSelect) return;

    // Remove existing listeners by cloning
    const newSelect = paymentModeSelect.cloneNode(true);
    paymentModeSelect.parentNode.replaceChild(newSelect, paymentModeSelect);

    newSelect.addEventListener("change", function() {
        const selectedMode = this.value;
        console.log("Payment mode changed to:", selectedMode);
        populateBankAccountDropdown("", selectedMode);
    });
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

        let url = `${expenseURLphp}?user_id=${user_id}&staff_id=${invSelectedStaff.id}`;
        console.log(url);
        const res = await fetch(url);
        console.log(res);
        
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

        console.log("Expenses loaded:", invExpenses);
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

function normalizeToYYYYMM(dateStr) {
    if (!dateStr) return "";

    // Format: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr.slice(0, 7);
    }

    // Format: DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [d, m, y] = dateStr.split("-");
        return `${y}-${m}`;
    }

    return "";
}

function renderExpenses() {
    const expensesList = document.getElementById("staffExpensesList");
    if (!expensesList) return;

    const monthSelect = document.getElementById("invMonthSelect");
    const selectedMonth = monthSelect ? monthSelect.value : null;

    let filtered = invExpenses;
    console.log("filtered", filtered);

    if (selectedMonth) {
        filtered = invExpenses.filter(e => {
            const dateStr = normalizeToYYYYMM(e.expense_date || e.date);
            return dateStr === selectedMonth;
        });
    }

    if (!filtered.length) {
        expensesList.innerHTML = `
            <div style="padding: 30px; text-align: center; color: #999;">
                <p style="font-size: 16px; margin-bottom: 10px;">No expenses recorded</p>
                <p style="font-size: 14px;">Add an expense using the "Add Expense" button</p>
            </div>
        `;
        return;
    }

    let html = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Date</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Amount</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Payment Mode</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Description</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    filtered.forEach((exp, index) => {
        const date = new Date(exp.expense_date || exp.date).toLocaleDateString('en-IN');
        const amount = parseFloat(exp.amount || 0);
        const paymentMode = exp.payment_mode || 'N/A';
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';

        html += `
            <tr style="background: ${bgColor}; border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px; color: #374151; font-size: 14px;">${date}</td>
                <td style="padding: 12px; text-align: right; color: #374151; font-size: 14px; font-weight: 600;">₹${amount.toFixed(2)}</td>
                <td style="padding: 12px; color: #374151; font-size: 14px;">${paymentMode.toUpperCase()}</td>
                <td style="padding: 12px; color: #374151; font-size: 14px;">${exp.note || exp.notes || exp.description || '-'}</td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="handleDeleteExpense('${exp.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">Delete</button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    expensesList.innerHTML = html;
}

window.handleDeleteExpense = async function(expenseId) {
    try {
        const confirmed = await showConfirm("Are you sure you want to delete this expense?", "warning");
        if (!confirmed) return;

        const res = await fetch(`${expenseURLphp}?id=${expenseId}`, {
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
    if (!totalExpenseEl) return;

    const monthSelect = document.getElementById("invMonthSelect");
    const selectedMonth = monthSelect ? monthSelect.value : null;

    let filtered = invExpenses;
    if (selectedMonth) {
        filtered = invExpenses.filter(e => {
            const dateStr = normalizeToYYYYMM(e.expense_date || e.date);
            return dateStr === selectedMonth;
        });
    }

    const totalExpense = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
    totalExpenseEl.textContent = `₹${totalExpense.toFixed(2)}`;
    
    // Update balance card
    updateStaffHeader();
}

/* ============================
   Submit Expense
   ============================ */
async function handleSubmitExpense(event) {
    event.preventDefault();

    if (!invSelectedStaff) {
        showNotification("Please select a staff member first.", "error");
        return;
    }

    const categoryId = window.staffSalaryCategoryId; // Default category ID

    const amountInput = document.getElementById("invExpenseAmount");
    const dateInput = document.getElementById("invExpenseDate");
    const noteInput = document.getElementById("invExpenseNote");
    const paymentModeSelect = document.getElementById("expensePaymentMode");
    const bankAccountSelect = document.getElementById("expenseBankAccount");

    if (!amountInput || !dateInput || !paymentModeSelect) return;

    const amount = Number(amountInput.value);
    const date = dateInput.value;
    const note = noteInput ? noteInput.value.trim() : "";
    const paymentMode = paymentModeSelect.value;
    const bankAccountId = bankAccountSelect.value || null;

    // Validation
    if (!amount || !date || !paymentMode) {
        showNotification("Please fill all required fields.", "error");
        return;
    }
    if (amount <= 0) {
        showNotification("Amount must be greater than zero.", "error");
        return;
    }
    if (paymentMode !== "cash" && !bankAccountId) {
        showNotification("Please select a bank account for non-cash payments.", "error");
        return;
    }

    // Convert date from YYYY-MM-DD to DD-MM-YYYY format
    const [year, month, day] = date.split("-");
    const formattedDate = `${year}-${month}-${day}`;

    const payload = {
        user_id: user_id,
        staff_id: invSelectedStaff.id,
        // category_id: categoryId,
        amount: amount,
        expense_date: formattedDate,
        payment_mode: paymentMode,
        note: note
    };

    // Add bank_account_id only for non-cash payments
    if (paymentMode !== "cash" && bankAccountId) {
        payload.bank_account_id = parseInt(bankAccountId);
    }

    console.log("Submitting expense:", payload);

    const confirmed = await showConfirm("Are you sure you want to add this expense?", "warning");
    if (!confirmed) return;

    try {
        const res = await fetch(expenseURLphp, {
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
        console.log("Expense created:", created);

        // Reload expenses to get fresh data
        await loadExpensesForStaff();

        // Close modal and reset form
        closeExpenseForm();

        showNotification("Expense added successfully.", "success");
    } catch (e) {
        console.error("Error posting expense:", e);
        showNotification("Error while adding expense. Please try again.", "error");
    }
}

// Global handler functions
window.handleStaffChange = function(staffId) {
    handleStaffSelection(staffId);
};

window.handleMonthChange = function(monthYear) {
    const monthSelect = document.getElementById("invMonthSelect");
    if (monthSelect) {
        monthSelect.value = monthYear;
        renderExpenses();
        calculateTotals();
    }
};

window.handleAddExpense = handleSubmitExpense;

/* Expose for outside use */
window.initInventoryStaffPage = initInventoryStaffPage;
window.renderInventoryStaffPage = renderInventoryStaffPage;