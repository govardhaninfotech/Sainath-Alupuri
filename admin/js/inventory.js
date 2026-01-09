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
// PRINT AND EXPORT FUNCTIONS
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
 * Print the staff expense report with confirmation
 */
window.printReport = function () {
    const staffSelect = document.getElementById("invStaffSelect");
    const monthSelect = document.getElementById("invMonthSelect");

    if (!staffSelect.value || !monthSelect.value) {
        showNotification("Please select Staff and Month to print report", "warning");
        return;
    }

    // Show confirmation dialog
    const staffName = staffSelect.options[staffSelect.selectedIndex].text;
    const monthYear = monthSelect.value;

    const confirmPrint = confirm(
        `📋 Print Report Confirmation\n\n` +
        `Staff: ${staffName}\n` +
        `Period: ${monthYear}\n\n` +
        `Do you want to print this report?`
    );

    if (!confirmPrint) return;

    // Create professional PDF
    generateAndPrintPDF(staffName, monthYear);
};

/**
 * Generate professional PDF with logo and details
 */
function generateAndPrintPDF(staffName, monthYear) {
    const salary = document.getElementById("invStaffSalary").textContent;
    const totalExpense = document.getElementById("invTotalExpense").textContent;
    const balanceElement = document.getElementById("staffBalanceCard");
    let balance = "₹0.00";

    if (balanceElement) {
        balance = balanceElement.textContent.trim();
    }

    const capFirst = document.getElementById("capFirstCount").textContent || "0";
    const capTotal = document.getElementById("capTotalCount").textContent || "0";
    const daysCompleted = document.getElementById("daysCompleted").textContent || "0";
    const presentCount = document.getElementById("presentCount").textContent || "0";
    const absentCount = document.getElementById("absentCount").textContent || "0";
    const leaveCount = document.getElementById("leaveCount").textContent || "0";
    const sameShirtDays = document.getElementById("sameShirtCount").textContent || "0";

    const printWindow = window.open("", "_blank");

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Staff Report - ${staffName}</title>
            <style>
       
            </style>
        </head>
        <body>
            <div class="pdf-container">
                <!-- Header -->
                <div class="header">
                    <div class="logo-section">
                        <div class="logo">SA</div>
                        <div class="company-info">
                            <h1>Sainath Alupuri</h1>
                            <p>Staff Management System</p>
                            <p>Professional Report</p>
                        </div>
                    </div>
                    <div class="report-title">
                        <h2>Staff Report</h2>
                        <p>Generated on ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>

                <!-- Content -->
                <div class="content">
                    <!-- Staff Information -->
                    <div class="section">
                        <div class="section-title">👤 Staff Information</div>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Staff Name</div>
                                <div class="info-value">${staffName}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Reporting Period</div>
                                <div class="info-value">${monthYear}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Financial Summary -->
                    <div class="section">
                        <div class="section-title">💰 Financial Summary</div>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Monthly Salary</div>
                                <div class="info-value">${salary}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Total Expenses</div>
                                <div class="info-value">${totalExpense}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Balance</div>
                                <div class="info-value">${balance}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Performance Metrics -->
                    <div class="section">
                        <div class="section-title">📊 Performance Metrics</div>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-label">Present Days</div>
                                <div class="stat-value">${presentCount}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Absent Days</div>
                                <div class="stat-value">${absentCount}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Leaves</div>
                                <div class="stat-value">${leaveCount}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Days Worked</div>
                                <div class="stat-value">${daysCompleted}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Uniform & Cap Management -->
                    <div class="section">
                        <div class="section-title">👕 Uniform & Cap Management</div>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Cap Distribution (1st)</div>
                                <div class="info-value">${capFirst}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Total Cap Count</div>
                                <div class="info-value">${capTotal}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Same Shirt Days</div>
                                <div class="info-value">${sameShirtDays}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">25 Days Period</div>
                                <div class="info-value">${daysCompleted}/25</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Signature Area -->
                <div class="signature-area">
                    <div class="signature-line">
                        Staff Signature
                    </div>
                    <div class="signature-line">
                        Manager Signature
                    </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <p>This is an official report generated by Sainath Alupuri Management System</p>
                    <p style="margin-top: 8px;">© 2026 All Rights Reserved | Confidential</p>
                </div>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
    }, 500);
}

/**
 * Export to PDF with confirmation
 */
window.exportToPDF = function () {
    const staffSelect = document.getElementById("invStaffSelect");
    const monthSelect = document.getElementById("invMonthSelect");

    if (!staffSelect.value || !monthSelect.value) {
        showNotification("Please select Staff and Month to export", "warning");
        return;
    }

    const staffName = staffSelect.options[staffSelect.selectedIndex].text;
    const monthYear = monthSelect.value;

    // Show confirmation dialog
    const confirmExport = confirm(
        `📄 PDF Export Confirmation\n\n` +
        `Staff: ${staffName}\n` +
        `Period: ${monthYear}\n\n` +
        `PDF will be generated and downloaded.\nDo you want to continue?`
    );

    if (!confirmExport) return;

    showNotification("Generating PDF... Please wait", "info");

    // Close dropdown
    const dropdown = document.getElementById("exportDropdown");
    if (dropdown) {
        dropdown.classList.remove("show");
    }

    // Generate PDF
    generateAndPrintPDF(staffName, monthYear);

    setTimeout(() => {
        showNotification("PDF report generated successfully!", "success");
    }, 1500);
};

/**
 * Export to Excel with confirmation
 */
window.exportToExcel = function () {
    const staffSelect = document.getElementById("invStaffSelect");
    const monthSelect = document.getElementById("invMonthSelect");

    if (!staffSelect.value || !monthSelect.value) {
        showNotification("Please select Staff and Month to export", "warning");
        return;
    }

    const staffName = staffSelect.options[staffSelect.selectedIndex].text;
    const monthYear = monthSelect.value;

    // Show confirmation dialog
    const confirmExport = confirm(
        `📊 Excel Export Confirmation\n\n` +
        `Staff: ${staffName}\n` +
        `Period: ${monthYear}\n\n` +
        `Excel file will be downloaded.\nDo you want to continue?`
    );

    if (!confirmExport) return;

    // Get data
    const salary = document.getElementById("invStaffSalary").textContent;
    const totalExpense = document.getElementById("invTotalExpense").textContent;
    const balance = document.getElementById("staffBalanceCard").textContent;

    const presentCount = document.getElementById("presentCount").textContent;
    const absentCount = document.getElementById("absentCount").textContent;
    const leaveCount = document.getElementById("leaveCount").textContent;
    const capTotal = document.getElementById("capTotalCount").textContent;
    const daysCompleted = document.getElementById("daysCompleted").textContent;

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Sainath Alupuri - Staff Report\n";
    csvContent += `${new Date().toLocaleDateString('en-IN')}\n\n`;

    csvContent += "STAFF INFORMATION\n";
    csvContent += `Staff Name,${staffName}\n`;
    csvContent += `Period,${monthYear}\n\n`;

    csvContent += "FINANCIAL SUMMARY\n";
    csvContent += "Item,Value\n";
    csvContent += `Monthly Salary,${salary}\n`;
    csvContent += `Total Expenses,${totalExpense}\n`;
    csvContent += `Balance,${balance}\n\n`;

    csvContent += "ATTENDANCE SUMMARY\n";
    csvContent += "Item,Count\n";
    csvContent += `Present Days,${presentCount}\n`;
    csvContent += `Absent Days,${absentCount}\n`;
    csvContent += `Leaves,${leaveCount}\n\n`;

    csvContent += "PERFORMANCE METRICS\n";
    csvContent += "Item,Value\n";
    csvContent += `Days Worked,${daysCompleted}/25\n`;
    csvContent += `Cap Count,${capTotal}\n\n`;

    csvContent += "Generated by Sainath Alupuri Management System\n";
    csvContent += `Generated Date,${new Date().toLocaleString('en-IN')}`;

    // Create and download file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Staff_Report_${staffName}_${monthYear.replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("✅ Excel file downloaded successfully!", "success");

    // Close dropdown
    const dropdown = document.getElementById("exportDropdown");
    if (dropdown) {
        dropdown.classList.remove("show");
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

        // Cap Management - Get from staff data or calculate
        const capFirstCount = parseInt(staffData.cap_first_count || staffData.first_cap || 0);
        const capTotalCount = parseInt(staffData.cap_total_count || staffData.total_cap || 0);

        document.getElementById("capFirstCount").textContent = capFirstCount;
        document.getElementById("capTotalCount").textContent = capTotalCount;

        // 25 Days Tracking - Calculate from attendance
        const daysCompleted = parseInt(staffData.days_worked || staffData.working_days || 0);
        const daysRemaining = Math.max(0, 25 - daysCompleted);

        document.getElementById("daysCompleted").textContent = daysCompleted;
        document.getElementById("daysRemaining").textContent = daysRemaining;

        // T-Shirt Uniform - Get from staff data
        const sameShirtDays = parseInt(staffData.same_shirt_days || staffData.uniform_days || 0);
        const changedShirtDays = Math.max(0, 25 - sameShirtDays);

        document.getElementById("sameShirtCount").textContent = sameShirtDays;
        document.getElementById("changedShirtCount").textContent = changedShirtDays;

        // Attendance Summary - Get from staff data
        const presentCount = parseInt(staffData.attendance_present || staffData.present || 0);
        const absentCount = parseInt(staffData.attendance_absent || staffData.absent || 0);
        const leaveCount = parseInt(staffData.attendance_leave || staffData.leave || 0);

        document.getElementById("presentCount").textContent = presentCount;
        document.getElementById("absentCount").textContent = absentCount;
        document.getElementById("leaveCount").textContent = leaveCount;

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
    document.getElementById("capFirstCount").textContent = "0";
    document.getElementById("capTotalCount").textContent = "0";
    document.getElementById("daysCompleted").textContent = "0";
    document.getElementById("daysRemaining").textContent = "25";
    document.getElementById("sameShirtCount").textContent = "0";
    document.getElementById("changedShirtCount").textContent = "0";
    document.getElementById("presentCount").textContent = "0";
    document.getElementById("absentCount").textContent = "0";
    document.getElementById("leaveCount").textContent = "0";
}

// Update summary cards when staff changes
window.updateSummaryCards = updateSummaryCards;