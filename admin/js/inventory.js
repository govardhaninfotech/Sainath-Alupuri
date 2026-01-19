// inventory.js - Live PHP API Integration with Edit & Delete
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
let currentEditingExpense = null;

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
   Modal Functions - Add Expense
   ============================ */

window.openExpenseForm = function () {
    if (!invSelectedStaff) {
        showNotification("Please select a staff member first.", "error");
        return;
    }

    currentEditingExpense = null; // Reset editing state

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

        // Update modal title
        const modalTitle = modal.querySelector(".expense-modal-header h2");
        if (modalTitle) {
            modalTitle.textContent = "Add new expense";
        }

        // Update submit button text
        const submitBtn = modal.querySelector(".expense-btn-save");
        if (submitBtn) {
            submitBtn.textContent = "Save";
        }
    }
};

window.closeExpenseForm = function () {
    const modal = document.getElementById("expenseFormModal");
    if (modal) {
        modal.classList.remove("show");
        setTimeout(() => {
            modal.style.display = "none";
        }, 300);

        // Reset form
        const form = document.getElementById("expenseForm");
        if (form) form.reset();

        currentEditingExpense = null;
    }
};

/* ============================
   Modal Functions - Edit Expense
   ============================ */

window.openEditExpenseForm = function (expenseId) {
    console.log("[LOG] ========================================");
    console.log("[LOG] EDIT EXPENSE - START");
    console.log("[LOG] Opening edit form for expense ID:", expenseId);

    const expense = invExpenses.find(e => String(e.id) === String(expenseId));

    if (!expense) {
        console.error("[LOG] ❌ Expense not found:", expenseId);
        showNotification("Expense not found!", "error");
        return;
    }

    console.log("[LOG] ✓ Found expense to edit:", expense);
    currentEditingExpense = { ...expense };

    const modal = document.getElementById("expenseFormModal");
    if (!modal) {
        console.error("[LOG] ❌ Modal not found");
        return;
    }

    // Populate form with expense data
    const dateInput = document.getElementById("invExpenseDate");
    const amountInput = document.getElementById("invExpenseAmount");
    const noteInput = document.getElementById("invExpenseNote");
    const paymentModeSelect = document.getElementById("expensePaymentMode");
    const bankAccountSelect = document.getElementById("expenseBankAccount");

    console.log("[LOG] Populating form fields...");

    if (dateInput) {
        // Convert date from DD-MM-YYYY or any format to YYYY-MM-DD
        let dateValue = expense.expense_date || expense.date;
        if (dateValue) {
            // Handle DD-MM-YYYY format
            if (/^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
                const [day, month, year] = dateValue.split("-");
                dateValue = `${year}-${month}-${day}`;
            }
            // Handle YYYY-MM-DD format (already correct)
            dateInput.value = dateValue;
            console.log("[LOG] Date set to:", dateValue);
        }
    }

    if (amountInput) {
        amountInput.value = expense.amount || 0;
        console.log("[LOG] Amount set to:", expense.amount);
    }

    if (noteInput) {
        noteInput.value = expense.note || expense.notes || expense.description || "";
        console.log("[LOG] Note set to:", expense.note);
    }

    if (paymentModeSelect) {
        const paymentMode = (expense.payment_mode || "cash").toLowerCase();
        paymentModeSelect.value = paymentMode;
        handleInventoryPaymentMode(paymentMode);
        console.log("[LOG] Payment mode set to:", paymentMode);
    }

    // Set bank account after payment mode is set
    setTimeout(() => {
        if (bankAccountSelect && expense.bank_account_id) {
            bankAccountSelect.value = String(expense.bank_account_id);
            console.log("[LOG] Bank account set to:", expense.bank_account_id);
        }
    }, 100);

    // Update modal title
    const modalTitle = modal.querySelector(".expense-modal-header h2");
    if (modalTitle) {
        modalTitle.textContent = "Edit expense";
    }

    // Update submit button text
    const submitBtn = modal.querySelector(".expense-btn-save");
    if (submitBtn) {
        submitBtn.textContent = "Update";
    }

    console.log("[LOG] ✓ Form populated successfully");
    console.log("[LOG] ========================================");

    // Show modal
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
};

// Handle payment mode change for inventory form
window.handleInventoryPaymentMode = function (paymentMode) {
    const bankAccountSelect = document.getElementById("expenseBankAccount");

    if (paymentMode === 'cash') {
        bankAccountSelect.disabled = true;
        bankAccountSelect.value = "";
        bankAccountSelect.innerHTML = '<option value="">N/A</option>';
    } else if (paymentMode === 'upi') {
        bankAccountSelect.disabled = false;
        bankAccountSelect.innerHTML = '<option value="">Select UPI Account</option>';
        populateBankAccountDropdown("", paymentMode);
    } else if (paymentMode === 'bank') {
        bankAccountSelect.disabled = false;
        bankAccountSelect.innerHTML = '<option value="">Select Bank</option>';
        populateBankAccountDropdown("", paymentMode);
    }
};

// Close modal when clicking outside
window.addEventListener("click", function (event) {
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
        resetSummaryCards();
        return;
    }

    invSelectedStaff = invFilteredStaff.find(s => String(s.id) === String(staffId)) || null;

    if (!invSelectedStaff) {
        invSelectedStaff = (invAllStaff || []).find(s => String(s.id) === String(staffId)) || null;
    }

    updateStaffHeader();
    updateSummaryCards();
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
        return bankAccountData.filter(acc =>
            acc.type?.toLowerCase() === 'upi' ||
            acc.name?.toLowerCase().includes('upi') ||
            acc.account_name?.toLowerCase().includes('upi')
        );
    } else if (mode === 'bank') {
        return bankAccountData.filter(acc =>
            acc.type?.toLowerCase() === 'bank' ||
            (!acc.type && acc.account_number)
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

    if (paymentMode.toLowerCase() === 'cash') {
        select.disabled = true;
        select.innerHTML = `<option value="">N/A</option>`;
        select.value = "";
        select.removeAttribute('required');
        return;
    }

    select.disabled = false;
    select.setAttribute('required', 'required');

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

    const newSelect = paymentModeSelect.cloneNode(true);
    paymentModeSelect.parentNode.replaceChild(newSelect, paymentModeSelect);

    newSelect.addEventListener("change", function () {
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

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr.slice(0, 7);
    }

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
    console.log("[LOG] Filtered expenses:", filtered.length);

    if (selectedMonth) {
        filtered = invExpenses.filter(e => {
            const dateStr = normalizeToYYYYMM(e.expense_date || e.date);
            return dateStr === selectedMonth;
        });
        console.log("[LOG] Expenses after month filter:", filtered.length);
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
        <div class="expense-table-container">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                        <th style="padding: 15px 0px; text-align: center ; font-weight: 600; color: #374151; font-size: 13px;">Sr No</th>
                        <th style="padding: 15px 0px; text-align: center ; font-weight: 600; color: #374151; font-size: 13px;">Date</th>
                        <th style="padding: 15px 0px; text-align: center ; font-weight: 600; color: #374151; font-size: 13px;">Amount</th>
                        <th style="padding: 15px 0px; text-align: center ; font-weight: 600; color: #374151; font-size: 13px;">Payment</th>
                        <th style="padding: 15px 0px; text-align: center ; font-weight: 600; color: #374151; font-size: 13px;">Bank</th>
                        <th style="padding: 15px 0px; text-align: center ; font-weight: 600; color: #374151; font-size: 13px;">Description</th>
                        <th style="padding: 15px 0px; text-align: center ; font-weight: 600; color: #374151; font-size: 13px;">Action</th>
                    </tr>
                </thead>
                <tbody>
    `;

    filtered.forEach((exp, index) => {
        console.log("expance :", exp);

        const date = new Date(exp.expense_date || exp.date).toLocaleDateString('en-IN');
        const amount = parseFloat(exp.amount || 0);
        const paymentMode = exp.payment_mode || 'N/A';
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';

        html += `
            <tr style="background: ${bgColor}; border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 15px 0px ; text-align: center ; color: #374151; font-size: 13px; white-space: nowrap;">${index + 1}</td>
                <td style="padding: 15px 0px; text-align: center ; color: #374151; font-size: 13px; white-space: nowrap;">${date}</td>
                <td style="padding: 15px 0px; text-align: center ; color: #374151; font-size: 13px; font-weight: 600; white-space: nowrap;">₹${amount.toFixed(2)}</td>
                <td style="padding: 15px 0px; text-align: center ; color: #374151; font-size: 13px; white-space: nowrap;">${paymentMode.toUpperCase()}</td>
                <td style="padding: 15px 0px; text-align: center ; color: #374151; font-size: 13px; white-space: nowrap;">${exp.bank_name}</td>
                <td style="padding: 15px 0px; text-align: center ; color: #374151; font-size: 13px; max-width: 100px; overflow: hidden; text-overflow: ellipsis;" title="${exp.notes || 'N/A'}">${exp.notes || 'N/A'}</td>
                <td style="padding: 15px 0px; text-align: center ; text-align: center; white-space: nowrap;">
                    <button onclick="openEditExpenseForm('${exp.id}')" class="icon-btn icon-btn-edit" title="Edit Expense">
                        <i class="icon-edit">✎</i>
                    </button>
                    <button onclick="handleDeleteExpense('${exp.id}')" class="icon-btn icon-btn-delete" title="Delete Expense">
                        <i class="icon-delete">🗑</i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    expensesList.innerHTML = html;
    console.log("[LOG] Rendered", filtered.length, "expenses in table");
}

/* ============================
   Delete Expense
   ============================ */

window.handleDeleteExpense = async function (expenseId) {
    console.log("[LOG] ========================================");
    console.log("[LOG] DELETE EXPENSE - START");
    console.log("[LOG] Attempting to delete expense ID:", expenseId);

    try {
        const expense = invExpenses.find(e => String(e.id) === String(expenseId));

        if (!expense) {
            console.error("[LOG] ❌ Expense not found:", expenseId);
            showNotification("Expense not found!", "error");
            return;
        }

        console.log("[LOG] Expense to delete:", expense);
        console.log("[LOG] - Amount: ₹" + expense.amount);
        console.log("[LOG] - Date:", expense.expense_date || expense.date);
        console.log("[LOG] - Payment Mode:", expense.payment_mode);

        const confirmed = await showConfirm("Are you sure you want to delete this expense?", "warning");

        if (!confirmed) {
            console.log("[LOG] ⚠ Delete cancelled by user");
            console.log("[LOG] ========================================");
            return;
        }

        console.log("[LOG] User confirmed deletion, proceeding...");
        console.log("[LOG] Sending DELETE request to API...");

        const res = await fetch(`${expenseURLphp}?id=${expenseId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        console.log("[LOG] API Response status:", res.status);

        if (!res.ok) {
            const errorText = await res.text();
            console.error("[LOG] ❌ API Error Response:", errorText);
            throw new Error("Delete failed with status " + res.status);
        }

        const result = await res.json();
        console.log("[LOG] ✓ API Success Response:", result);

        // Remove from local array
        const beforeCount = invExpenses.length;
        invExpenses = invExpenses.filter(e => String(e.id) !== String(expenseId));
        const afterCount = invExpenses.length;

        console.log("[LOG] ✓ Removed from local array");
        console.log("[LOG] Expenses count: " + beforeCount + " → " + afterCount);

        // Refresh UI
        renderExpenses();
        calculateTotals();

        console.log("[LOG] ✓ UI refreshed successfully");
        console.log("[LOG] ✓ Expense deleted successfully");
        console.log("[LOG] ========================================");

        showNotification("Expense deleted successfully.", "success");
    } catch (e) {
        console.error("[LOG] ========================================");
        console.error("[LOG] ❌ DELETE FAILED");
        console.error("[LOG] Error:", e.message);
        console.error("[LOG] Stack:", e.stack);
        console.error("[LOG] ========================================");
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

    updateStaffHeader();
}

/* ============================
   Submit Expense (Add or Update)
   ============================ */
async function handleSubmitExpense(event) {
    event.preventDefault();

    console.log("[LOG] ========================================");
    console.log("[LOG] SUBMIT EXPENSE - START");

    if (!invSelectedStaff) {
        console.error("[LOG] ❌ No staff selected");
        showNotification("Please select a staff member first.", "error");
        return;
    }

    const amountInput = document.getElementById("invExpenseAmount");
    const dateInput = document.getElementById("invExpenseDate");
    const noteInput = document.getElementById("invExpenseNote");
    const paymentModeSelect = document.getElementById("expensePaymentMode");
    const bankAccountSelect = document.getElementById("expenseBankAccount");

    if (!amountInput || !dateInput || !paymentModeSelect) {
        console.error("[LOG] ❌ Form inputs not found");
        return;
    }

    const amount = Number(amountInput.value);
    const date = dateInput.value;
    const note = noteInput ? noteInput.value.trim() : "";
    const paymentMode = paymentModeSelect.value;
    const bankAccountId = bankAccountSelect.value || null;

    console.log("[LOG] Form Values:");
    console.log("[LOG] - Amount:", amount);
    console.log("[LOG] - Date:", date);
    console.log("[LOG] - Note:", note);
    console.log("[LOG] - Payment Mode:", paymentMode);
    console.log("[LOG] - Bank Account ID:", bankAccountId);

    // Validation
    if (!amount || !date || !paymentMode) {
        console.error("[LOG] ❌ Validation failed: Missing required fields");
        showNotification("Please fill all required fields.", "error");
        return;
    }
    if (amount <= 0) {
        console.error("[LOG] ❌ Validation failed: Amount must be > 0");
        showNotification("Amount must be greater than zero.", "error");
        return;
    }
    if (paymentMode !== "cash" && !bankAccountId) {
        console.error("[LOG] ❌ Validation failed: Bank account required for non-cash payments");
        showNotification("Please select a bank account for non-cash payments.", "error");
        return;
    }

    console.log("[LOG] ✓ Validation passed");

    // Date is already in YYYY-MM-DD format from the input
    const [year, month, day] = date.split("-");
    const formattedDate = `${year}-${month}-${day}`;

    const payload = {
        user_id: user_id,
        staff_id: invSelectedStaff.id,
        amount: amount,
        expense_date: formattedDate,
        payment_mode: paymentMode,
        note: note
    };

    if (paymentMode !== "cash" && bankAccountId) {
        payload.bank_account_id = parseInt(bankAccountId);
    }

    // Check if editing or adding
    const isEditing = currentEditingExpense !== null;

    console.log("[LOG] Operation Type:", isEditing ? "UPDATE" : "ADD");

    if (isEditing) {
        console.log("[LOG] Editing expense ID:", currentEditingExpense.id);
        console.log("[LOG] Original values:", {
            amount: currentEditingExpense.amount,
            date: currentEditingExpense.expense_date,
            payment_mode: currentEditingExpense.payment_mode
        });
    }

    console.log("[LOG] Payload prepared:", payload);

    const confirmMessage = isEditing
        ? "Are you sure you want to update this expense?"
        : "Are you sure you want to add this expense?";

    const confirmed = await showConfirm(confirmMessage, "info");
    if (!confirmed) {
        console.log("[LOG] ⚠ Operation cancelled by user");
        console.log("[LOG] ========================================");
        return;
    }

    console.log("[LOG] User confirmed, proceeding with API call...");

    try {
        let res;

        if (isEditing) {
            // UPDATE existing expense
            console.log("[LOG] Sending PUT request to update expense...");
            console.log("[LOG] URL:", `${expenseURLphp}?id=${currentEditingExpense.id}`);

            res = await fetch(`${expenseURLphp}?id=${currentEditingExpense.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } else {
            // ADD new expense
            console.log("[LOG] Sending POST request to add new expense...");
            console.log("[LOG] URL:", expenseURLphp);

            res = await fetch(expenseURLphp, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        }

        console.log("[LOG] API Response status:", res.status);

        if (!res.ok) {
            const errorText = await res.text();
            console.error("[LOG] ❌ API Error Response:", errorText);
            throw new Error(`Request failed with status ${res.status}`);
        }

        const result = await res.json();
        console.log("[LOG] ✓ API Success Response:", result);

        // Reload expenses to get fresh data
        console.log("[LOG] Reloading expenses from server...");
        await loadExpensesForStaff();

        // Close modal and reset form
        closeExpenseForm();

        const successMessage = isEditing
            ? "✓ Expense updated successfully!"
            : "✓ Expense added successfully!";

        console.log("[LOG] ✓ Operation completed successfully");
        console.log("[LOG] ========================================");

        showNotification(successMessage, "success");

    } catch (e) {
        console.error("[LOG] ========================================");
        console.error("[LOG] ❌ SUBMIT FAILED");
        console.error("[LOG] Error:", e.message);
        console.error("[LOG] Stack:", e.stack);
        console.error("[LOG] ========================================");
        showNotification("Error while saving expense. Please try again.", "error");
    }
}

// Global handler functions
window.handleStaffChange = function (staffId) {
    handleStaffSelection(staffId);
};

window.handleMonthChange = function (monthYear) {
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

// ============================================
// PRINT AND EXPORT FUNCTIONS - Using Global Print System
// ============================================

/**
 * Toggle export dropdown menu
 */
window.toggleExportDropdown = function () {
    const dropdown = document.getElementById("exportDropdown");
    if (dropdown) {
        dropdown.classList.toggle("show");
    }
};

/**
 * Close export dropdown when clicking outside
 */
document.addEventListener("click", function (event) {
    const dropdown = document.getElementById("exportDropdown");
    const exportBtn = document.querySelector(".btn-export");

    if (dropdown && exportBtn) {
        if (!dropdown.contains(event.target) && !exportBtn.contains(event.target)) {
            dropdown.classList.remove("show");
        }
    }
});

/**
 * Prepare print data from current expenses table
 */
function preparePrintData() {
    const monthSelect = document.getElementById("invMonthSelect");
    const selectedMonth = monthSelect ? monthSelect.value : null;

    let filtered = invExpenses;
    if (selectedMonth) {
        filtered = invExpenses.filter(e => {
            const dateStr = normalizeToYYYYMM(e.expense_date || e.date);
            return dateStr === selectedMonth;
        });
    }

    const headers = ['Sr No', 'Date', 'Amount', 'Payment Mode', 'Bank', 'Description'];
    const rows = filtered.map((exp, index) => {
        const date = new Date(exp.expense_date || exp.date).toLocaleDateString('en-IN');
        const amount = parseFloat(exp.amount || 0);
        const paymentMode = exp.payment_mode || 'N/A';
        return [
            index + 1,
            date,
            `₹${amount.toFixed(2)}`,
            paymentMode.toUpperCase(),
            exp.bank_name || 'N/A',
            exp.notes || 'N/A'
        ];
    });

    return { headers, rows };
}

/**
 * Print the staff expense report with confirmation - Direct Print Dialog
 */
window.printReport = async function () {
    const staffSelect = document.getElementById("invStaffSelect");
    const monthSelect = document.getElementById("invMonthSelect");

    if (!staffSelect.value || !monthSelect.value) {
        showNotification("Please select Staff and Month to print report", "warning");
        return;
    }

    const staffName = staffSelect.options[staffSelect.selectedIndex].text;
    const monthYear = monthSelect.value;

    const confirmPrint = await showConfirm(
        `📋 Print Report Confirmation\n\nStaff: ${staffName}\nPeriod: ${monthYear}\n\nDo you want to print this report?`,
        "info"
    );

    if (!confirmPrint) return;

    // Prepare data for print
    const printData = preparePrintData();

    // Generate print HTML with proper table format
    const printHTML = generatePrintHTML(staffName, monthYear, printData);

    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHTML);
    printWindow.document.close();

    // Trigger print after content loads
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
    }, 500);
};

/**
 * Generate HTML for print/PDF with proper table format
 */
function generatePrintHTML(staffName, monthYear, printData) {
    const headers = printData.headers || [];
    const rows = printData.rows || [];

    // Build table rows - ensure we escape HTML properly and add word-wrap
    const tableRows = rows.length > 0 ? rows.map(row => {
        const cells = row.map(cell => {
            const cellValue = String(cell || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<td style="padding: 8px; border: 1px solid #ddd; text-align: left; word-wrap: break-word; max-width: 150px;">${cellValue}</td>`;
        }).join('');
        return `<tr style="page-break-inside: avoid;">${cells}</tr>`;
    }).join('') : '<tr><td colspan="' + headers.length + '" style="padding: 20px; text-align: center;">No data available</td></tr>';

    const tableHeaders = headers.map(header => {
        const headerText = String(header || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; font-weight: 600; text-align: left;">${headerText}</th>`;
    }).join('');

    // Get logo path - will be converted to absolute path in PDF export function
    // Try to get the base path from current location
    const getLogoPath = () => {
        // If we're in admin folder, use relative path
        if (window.location.pathname.includes('/admin/')) {
            return 'images/logo.jpg';
        }
        // Otherwise, try to construct absolute path
        return '../admin/images/logo.jpg';
    };
    const logoPath = getLogoPath();

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Staff Expense Report - ${staffName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        @media print {
            @page {
                margin: 1cm;
                size: A4;
            }
            body {
                margin: 0;
                padding: 15px;
            }
            .header {
                page-break-after: avoid;
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            thead {
                display: table-header-group;
            }
            tfoot {
                display: table-footer-group;
            }
        }
        body {
            font-family: Arial, sans-serif;
            padding: 15px;
            color: #333;
            background: white;
            font-size: 12px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 15px;
            border-bottom: 2px solid #667eea;
            margin-bottom: 20px;
            page-break-after: avoid;
        }
        .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
            flex: 1;
        }
        .logo-img {
            width: 70px;
            height: 70px;
            object-fit: contain;
            border-radius: 8px;
            flex-shrink: 0;
        }
        .logo {
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 28px;
            flex-shrink: 0;
        }
        .company-info {
            flex: 1;
        }
        .company-info h1 {
            margin: 0;
            font-size: 22px;
            color: #1f2937;
            line-height: 1.2;
        }
        .company-info p {
            margin: 5px 0 0 0;
            color: #6b7280;
            font-size: 13px;
            line-height: 1.3;
        }
        .report-title {
            text-align: right;
            flex-shrink: 0;
            margin-left: 20px;
        }
        .report-title h2 {
            margin: 0;
            font-size: 18px;
            color: #1f2937;
            line-height: 1.2;
        }
        .report-title p {
            margin: 4px 0 0 0;
            color: #6b7280;
            font-size: 11px;
            line-height: 1.4;
        }
        .table-container {
            width: 100%;
            overflow: visible;
            margin-top: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            font-size: 11px;
            page-break-inside: auto;
        }
        thead {
            display: table-header-group;
        }
        tbody {
            display: table-row-group;
        }
        th, td {
            padding: 8px 6px;
            border: 1px solid #ddd;
            text-align: left;
            word-wrap: break-word;
            max-width: 150px;
        }
        th {
            background-color: #f3f4f6;
            font-weight: 600;
            color: #374151;
            font-size: 11px;
        }
        td {
            font-size: 11px;
            vertical-align: top;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        tr {
            page-break-inside: avoid;
        }
        .footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 10px;
            page-break-inside: avoid;
        }
        .footer p {
            margin: 3px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <img src="${logoPath}" alt="Logo" class="logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="logo" style="display: none;">SA</div>
            <div class="company-info">
                <h1>Sainath Alupuri</h1>
                <p>Staff Expense Management System</p>
            </div>
        </div>
        <div class="report-title">
            <h2>Staff Expense Report</h2>
            <p>Staff: ${staffName}</p>
            <p>Period: ${monthYear}</p>
            <p>Generated on: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
    </div>
    
    <div class="table-container">
        <table>
            <thead>
                <tr>${tableHeaders}</tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    </div>
    
    <div class="footer">
        <p>This is an official report generated by Sainath Alupuri Management System</p>
        <p>© ${new Date().getFullYear()} All Rights Reserved | Confidential</p>
    </div>
</body>
</html>`;
}

/**
 * Load html2pdf library dynamically
 */
function loadHtml2Pdf() {
    return new Promise((resolve, reject) => {
        if (window.html2pdf) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.integrity = 'sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==';
        script.crossOrigin = 'anonymous';
        script.referrerPolicy = 'no-referrer';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load html2pdf library'));
        document.head.appendChild(script);
    });
}

/**
 * Load XLSX library dynamically
 */
function loadXLSX() {
    return new Promise((resolve, reject) => {
        if (window.XLSX) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load XLSX library'));
        document.head.appendChild(script);
    });
}

/**
 * Export to PDF with confirmation - Direct PDF Download
 */
window.exportToPDF = async function () {
    const staffSelect = document.getElementById("invStaffSelect");
    const monthSelect = document.getElementById("invMonthSelect");

    if (!staffSelect.value || !monthSelect.value) {
        showNotification("Please select Staff and Month to export", "warning");
        return;
    }

    const staffName = staffSelect.options[staffSelect.selectedIndex].text;
    const monthYear = monthSelect.value;

    const confirmExport = await showConfirm(
        `📄 PDF Export Confirmation\n\nStaff: ${staffName}\nPeriod: ${monthYear}\n\nPDF will be generated and downloaded. Do you want to continue?`,
        "info"
    );

    if (!confirmExport) return;

    showNotification("Loading PDF library... Please wait", "info");

    try {
        // Load library if not already loaded
        await loadHtml2Pdf();

        showNotification("Generating PDF... Please wait", "info");

        // Close dropdown
        const dropdown = document.getElementById("exportDropdown");
        if (dropdown) {
            dropdown.classList.remove("show");
        }

        // Prepare data for print
        const printData = preparePrintData();

        // Check if we have data
        if (!printData || !printData.rows || printData.rows.length === 0) {
            showNotification("No data available to export. Please select staff and month with expenses.", "warning");
            return;
        }

        console.log("Print data:", printData); // Debug log
        console.log("Rows count:", printData.rows.length); // Debug log

        // Generate complete HTML
        const printHTML = generatePrintHTML(staffName, monthYear, printData);
        console.log("Generated HTML length:", printHTML.length); // Debug log

        // Extract body and style content
        const bodyMatch = printHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const styleMatch = printHTML.match(/<style[^>]*>([\s\S]*?)<\/style>/i);

        if (!bodyMatch || !bodyMatch[1]) {
            console.error("Could not extract body content from HTML");
            showNotification("Error: Could not extract content for PDF", "error");
            return;
        }

        // Create a visible container div (positioned off-screen but still renderable)
        const wrapper = document.createElement('div');
        wrapper.id = 'pdf-export-wrapper';
        wrapper.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 210mm;
            padding: 15px;
            background: white;
            font-family: Arial, sans-serif;
            color: #333;
            box-sizing: border-box;
            z-index: -1;
            overflow: visible;
        `;

        // Create style element and add to head
        if (styleMatch && styleMatch[1]) {
            const styleEl = document.createElement('style');
            styleEl.id = 'pdf-export-styles';
            // Remove @media print queries as they won't work in canvas, but keep other styles
            const styles = styleMatch[1].replace(/@media\s+print\s*\{[^}]*\}/g, '');
            styleEl.textContent = styles;
            document.head.appendChild(styleEl);
        }

        // Add body content to wrapper
        wrapper.innerHTML = bodyMatch[1];

        // Fix image paths - convert relative paths to absolute
        const images = wrapper.querySelectorAll('img');
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                // Convert relative path to absolute
                let absolutePath;
                if (src.startsWith('/')) {
                    absolutePath = window.location.origin + src;
                } else {
                    // Get base path - try to find admin folder
                    const pathParts = window.location.pathname.split('/');
                    let basePath = window.location.origin;

                    // If we're in admin folder or its subfolders
                    const adminIndex = pathParts.indexOf('admin');
                    if (adminIndex !== -1) {
                        basePath += '/' + pathParts.slice(0, adminIndex + 1).join('/');
                    } else {
                        // Fallback: use current directory
                        basePath += window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
                    }

                    // Handle relative paths
                    if (src.startsWith('../')) {
                        // Go up one level from base
                        const upLevel = basePath.substring(0, basePath.lastIndexOf('/'));
                        absolutePath = upLevel + '/' + src.substring(3);
                    } else {
                        absolutePath = basePath + '/' + src;
                    }
                }
                img.src = absolutePath;
                console.log("Updated image path from", src, "to", absolutePath);
            }
        });

        // Append to body
        document.body.appendChild(wrapper);

        // Wait for images to load and force layout calculation
        let imagesLoaded = 0;
        const totalImages = images.length;

        const checkImagesAndGenerate = () => {
            imagesLoaded++;
            if (imagesLoaded >= totalImages) {
                setTimeout(generatePDF, 200); // Small delay to ensure rendering
            }
        };

        if (totalImages > 0) {
            images.forEach(img => {
                if (img.complete && img.naturalHeight !== 0) {
                    checkImagesAndGenerate();
                } else {
                    img.onload = () => {
                        checkImagesAndGenerate();
                    };
                    img.onerror = () => {
                        console.warn("Image failed to load:", img.src);
                        checkImagesAndGenerate(); // Continue even if image fails
                    };
                    // Timeout fallback
                    setTimeout(() => {
                        if (!img.complete) {
                            checkImagesAndGenerate();
                        }
                    }, 2000);
                }
            });
        } else {
            setTimeout(generatePDF, 300);
        }

        function generatePDF() {
            // Force reflow to ensure all content is rendered
            wrapper.offsetHeight;

            // Calculate proper dimensions - use scrollHeight to get full content height
            const contentHeight = wrapper.scrollHeight;
            const contentWidth = wrapper.scrollWidth || 210 * 3.779527559; // A4 width in pixels (210mm)

            // For A4: 210mm x 297mm = 794px x 1123px at 96 DPI
            // But we need to account for margins, so use actual content height
            const maxHeight = Math.max(contentHeight, 1123); // Minimum A4 height
            const width = Math.min(contentWidth, 794); // Maximum A4 width

            console.log("Content dimensions:", contentWidth, "x", contentHeight);
            console.log("PDF dimensions:", width, "x", maxHeight);

            const opt = {
                margin: [8, 8, 8, 8],
                filename: `Staff_Expense_Report_${staffName.replace(/\s+/g, '_')}_${monthYear.replace('/', '-')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    width: width,
                    height: maxHeight,
                    windowWidth: width,
                    windowHeight: maxHeight,
                    allowTaint: true,
                    letterRendering: true,
                    scrollX: 0,
                    scrollY: 0
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait',
                    compress: true
                },
                pagebreak: {
                    mode: ['avoid-all', 'css', 'legacy'],
                    before: '.header',
                    after: '.footer',
                    avoid: ['tr', 'thead', 'tfoot']
                }
            };

            html2pdf()
                .set(opt)
                .from(wrapper)
                .save()
                .then(() => {
                    // Cleanup
                    if (wrapper.parentNode) {
                        document.body.removeChild(wrapper);
                    }
                    const styleEl = document.getElementById('pdf-export-styles');
                    if (styleEl && styleEl.parentNode) {
                        styleEl.remove();
                    }
                    showNotification("PDF downloaded successfully!", "success");
                })
                .catch(err => {
                    // Cleanup
                    if (wrapper.parentNode) {
                        document.body.removeChild(wrapper);
                    }
                    const styleEl = document.getElementById('pdf-export-styles');
                    if (styleEl && styleEl.parentNode) {
                        styleEl.remove();
                    }
                    console.error('PDF export error:', err);
                    console.error('Error details:', JSON.stringify(err, null, 2));
                    showNotification("Error generating PDF: " + (err.message || 'Unknown error'), "error");
                });
        }
    } catch (err) {
        console.error('Error loading PDF library:', err);
        showNotification("Error loading PDF library. Please refresh and try again.", "error");
    }
};

/**
 * Export to Excel with confirmation - Direct Excel Download with Professional Formatting
 */
window.exportToExcel = async function () {
    const staffSelect = document.getElementById("invStaffSelect");
    const monthSelect = document.getElementById("invMonthSelect");

    if (!staffSelect.value || !monthSelect.value) {
        showNotification("Please select Staff and Month to export", "warning");
        return;
    }

    const staffName = staffSelect.options[staffSelect.selectedIndex].text;
    const monthYear = monthSelect.value;

    const confirmExport = await showConfirm(
        `📊 Excel Export Confirmation\n\nStaff: ${staffName}\nPeriod: ${monthYear}\n\nExcel file will be downloaded. Do you want to continue?`,
        "info"
    );

    if (!confirmExport) return;

    showNotification("Loading Excel library... Please wait", "info");

    try {
        // Load library if not already loaded
        await loadXLSX();

        showNotification("Generating Excel file... Please wait", "info");

        // Close dropdown
        const dropdown = document.getElementById("exportDropdown");
        if (dropdown) {
            dropdown.classList.remove("show");
        }

        // Prepare data for print
        const printData = preparePrintData();
        const headers = printData.headers || [];
        const rows = printData.rows || [];

        // Config for Excel
        const config = {
            companyName: 'Sainath Alupuri',
            companySubtitle: 'Staff Expense Management System',
            logo: 'SA',
            reportTitle: `Staff Expense Report - ${staffName}`
        };

        // Get additional summary data
        const salary = document.getElementById("invStaffSalary")?.textContent || "₹0.00";
        const totalExpense = document.getElementById("invTotalExpense")?.textContent || "₹0.00";
        const balanceElement = document.getElementById("staffBalanceCard");
        const balance = balanceElement?.textContent.trim() || "₹0.00";

        try {
            // Create workbook
            const wb = XLSX.utils.book_new();

            // Build worksheet data with professional structure
            const wsData = [
                // Company Header (Row 1-2) - Will merge across all columns
                [config.companyName || 'Sainath Alupuri'],
                [config.companySubtitle || 'Staff Expense Management System'],
                [], // Empty row
                // Report Info (Row 4-7)
                ['Report Title:', `Staff Expense Report - ${staffName}`],
                ['Reporting Period:', monthYear],
                ['Generated Date:', new Date().toLocaleString('en-IN')],
                [], // Empty row
                // Summary Section (Row 9-11)
                ['SUMMARY INFORMATION'],
                ['Monthly Salary:', salary],
                ['Total Expenses:', totalExpense],
                ['Balance:', balance],
                [], // Empty row
                // Table Header (Row 13)
                headers,
                // Table Data (Row 14+)
                ...rows,
                [], // Empty row
                // Footer (Row at bottom)
                [`Generated by Sainath Alupuri Management System on ${new Date().toLocaleString('en-IN')}`]
            ];

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Set column widths for better formatting
            const colWidths = headers.map((_, index) => {
                // Set width based on header length
                const maxLength = Math.max(
                    headers[index]?.length || 10,
                    ...rows.map(row => String(row[index] || '').length)
                );
                return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
            });
            ws['!cols'] = colWidths;

            // Set row heights
            ws['!rows'] = [
                { hpt: 20 }, // Company name row
                { hpt: 15 }, // Subtitle row
                { hpt: 5 },  // Empty row
                { hpt: 15 }, // Report info rows
                { hpt: 15 },
                { hpt: 15 },
                { hpt: 5 },  // Empty row
                { hpt: 18 }, // Summary header
                { hpt: 15 }, // Summary rows
                { hpt: 15 },
                { hpt: 15 },
                { hpt: 5 },  // Empty row
                { hpt: 18 }, // Table header
                ...rows.map(() => ({ hpt: 15 })), // Data rows
                { hpt: 5 },  // Empty row
                { hpt: 15 }  // Footer
            ];

            // Merge cells for headers and summary sections
            const mergeRanges = [];

            // Merge company name across all columns (Row 1, Cols 0 to headers.length-1)
            if (headers.length > 0) {
                mergeRanges.push({
                    s: { r: 0, c: 0 },
                    e: { r: 0, c: headers.length - 1 }
                });
                // Merge subtitle (Row 2)
                mergeRanges.push({
                    s: { r: 1, c: 0 },
                    e: { r: 1, c: headers.length - 1 }
                });
                // Merge summary header (Row 9)
                mergeRanges.push({
                    s: { r: 8, c: 0 },
                    e: { r: 8, c: headers.length - 1 }
                });
                // Merge footer (last row)
                mergeRanges.push({
                    s: { r: wsData.length - 1, c: 0 },
                    e: { r: wsData.length - 1, c: headers.length - 1 }
                });
            }

            ws['!merges'] = mergeRanges;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Expense Report');

            // Save file
            const filename = `Staff_Expense_Report_${staffName.replace(/\s+/g, '_')}_${monthYear.replace('/', '-')}.xlsx`;
            XLSX.writeFile(wb, filename);

            showNotification("Excel file downloaded successfully!", "success");
        } catch (err) {
            console.error('Excel export error:', err);
            showNotification("Error generating Excel file. Please try again.", "error");
        }
    } catch (err) {
        console.error('Error loading Excel library:', err);
        showNotification("Error loading Excel library. Please refresh and try again.", "error");
    }
};

// ============================================
// SUMMARY CARD UPDATE FUNCTIONS
// ============================================

/**
 * Update summary cards with staff data
 */
function updateSummaryCards() {
    if (!invSelectedStaff) {
        resetSummaryCards();
        return;
    }

    try {
        // Get data from staff object or use defaults
        const staffData = invSelectedStaff || {};

        // Cap - Days Wear (using same shirt days as cap wear days)
        const capDaysWear = parseInt(staffData.same_shirt_days || staffData.cap_days_wear || 0);
        document.getElementById("capDaysWear").textContent = capDaysWear;

        // T-Shirt - Days Wear 
        const tshirtDaysWear = parseInt(staffData.same_shirt_days || staffData.uniform_days || 0);
        document.getElementById("tshirtDaysWear").textContent = tshirtDaysWear;

        // Attendance - Present Day Count
        const presentCount = parseInt(staffData.attendance_present || staffData.present || 0);
        document.getElementById("presentDayCount").textContent = presentCount;

        console.log("Summary cards updated successfully");
    } catch (e) {
        console.error("Error updating summary cards:", e);
        resetSummaryCards();
    }
}

/**
 * Reset summary cards to default
 */
function resetSummaryCards() {
    document.getElementById("capDaysWear").textContent = "0";
    document.getElementById("tshirtDaysWear").textContent = "0";
    document.getElementById("presentDayCount").textContent = "0";
}

// Update summary cards when staff changes
window.updateSummaryCards = updateSummaryCards;