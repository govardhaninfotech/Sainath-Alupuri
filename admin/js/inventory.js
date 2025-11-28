// inventory.js
// Handles: Inventory -> Staff page
// Uses: PHP staff API + Node/json-server for expenses
import { EXPENSES_URL, STATUS_URL } from "../apis/api.js";
import { staffURLphp } from "../apis/api.js";
import { showNotification } from "./notification.js";

console.log("✅ inventory.js loaded");

// ============================================
// API ENDPOINTS (CONFIG)
// ============================================

// REAL staff API from your PHP backend
const STAFF_API_URL = staffURLphp;

// ============================================
// GLOBAL STATE
// ============================================

let invAllStaff = [];        // all staff from PHP
let invFilteredStaff = [];   // staff after status filter
let invSelectedStaff = null; // currently selected staff
let invExpenses = [];        // expenses for selected staff (from Node API)

// ============================================
// PUBLIC API (called from dashboard.js)
// ============================================

// 1) Dashboard asks for HTML:
export async function renderInventoryStaffPage() {
    console.log("🎨 renderInventoryStaffPage called");

    try {
        const res = await fetch("inventory_staff.html");
        const html = await res.text();
        return html;
    } catch (err) {
        console.error("❌ Error loading inventory_staff.html:", err);
        return `<div class="content-card"><p>Error loading Inventory Staff page.</p></div>`;
    }
}

// 2) Dashboard calls this AFTER HTML has been injected
export function initInventoryStaffPage() {
    console.log("⚙️ initInventoryStaffPage called");

    // 1) Check Node API status (just log)
    checkInventoryApiStatus();

    // 2) Set default date
    setDefaultDateToday();

    // 3) Setup month filter dropdown
    initMonthDropdown();

    // 4) Attach listeners to dropdowns & button
    attachEventListeners();

    // 5) Load staff from PHP API
    fetchStaffList();
}

// ============================================
// INITIALIZATION HELPERS
// ============================================

async function checkInventoryApiStatus() {
    console.log("📡 Checking Inventory API status:", STATUS_URL);

    try {
        const res = await fetch(STATUS_URL);
        const data = await res.json();
        console.log("✅ /status response:", data);
    } catch (err) {
        console.error("❌ Cannot reach /status endpoint:", err);
    }
}

function setDefaultDateToday() {
    const dateInput = document.getElementById("invExpenseDate");
    if (!dateInput) return;

    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    console.log("📅 Default expense date set:", today);
}

function initMonthDropdown() {
    console.log("🗓️ Initializing month dropdown");

    const monthSelect = document.getElementById("invMonthSelect");
    if (!monthSelect) return;

    monthSelect.innerHTML = "";

    const today = new Date();
    for (let i = 0; i < 3; i++) {
        const d = new Date();
        d.setMonth(today.getMonth() - i);

        const value = d.toISOString().slice(0, 7); // yyyy-mm
        const label = d.toLocaleString("default", { month: "long", year: "numeric" });

        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        monthSelect.appendChild(opt);
    }

    console.log("🗓️ Month dropdown ready");
}

function attachEventListeners() {
    console.log("🔗 Attaching Inventory Staff listeners");

    const statusSelect = document.getElementById("invStatusSelect");
    const staffSelect = document.getElementById("invStaffSelect");
    const monthSelect = document.getElementById("invMonthSelect");
    const submitBtn = document.getElementById("invSubmitExpense");

    if (statusSelect) {
        statusSelect.addEventListener("change", () => {
            console.log("🔁 Status filter changed:", statusSelect.value);
            applyStatusFilter();
        });
    }

    if (staffSelect) {
        staffSelect.addEventListener("change", () => {
            const id = staffSelect.value;
            console.log("👤 Staff selected:", id);
            handleStaffSelection(id);
        });
    }

    if (monthSelect) {
        monthSelect.addEventListener("change", () => {
            console.log("📅 Month filter changed:", monthSelect.value);
            renderExpenses(); // re-renders and applies month filter inside
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", handleSubmitExpense);
    }
}

// ============================================
// STAFF (from PHP API)
// ============================================

async function fetchStaffList() {
    console.log("📡 Fetching staff from PHP API:", STAFF_API_URL);

    const staffSelect = document.getElementById("invStaffSelect");
    if (staffSelect) {
        staffSelect.innerHTML = `<option value="">Loading staff...</option>`;
    }

    try {
        const res = await fetch(STAFF_API_URL);
        const data = await res.json();

        console.log("✅ Raw staff API response:", data);

        // ⚠️ Adjust based on your real staff.php output
        if (Array.isArray(data)) {
            invAllStaff = data;
        } else if (Array.isArray(data.staff)) {
            invAllStaff = data.staff;
        } else if (Array.isArray(data.data)) {
            invAllStaff = data.data;
        } else {
            console.warn("⚠️ Unknown staff response format. Expected array.");
            invAllStaff = [];
        }

        console.log("👥 Total staff loaded:", invAllStaff.length);

        applyStatusFilter();
    } catch (err) {
        console.error("❌ Error fetching staff:", err);
        if (staffSelect) {
            staffSelect.innerHTML = `<option value="">Error loading staff</option>`;
        }
    }
}

function applyStatusFilter() {
    const statusSelect = document.getElementById("invStatusSelect");
    const staffSelect = document.getElementById("invStaffSelect");
    if (!statusSelect || !staffSelect) return;

    const status = statusSelect.value; // "all" | "active" | "deactive"
    console.log("🔎 Applying staff status filter:", status);

    invFilteredStaff = invAllStaff.filter((s) => {
        if (status === "all") return true;
        const sStatus = (s.status || "").toLowerCase();
        return sStatus === status.toLowerCase();
    });

    staffSelect.innerHTML = `<option value="">Select Staff</option>`;
    invFilteredStaff.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name; // only name as you asked
        staffSelect.appendChild(opt);
    });

    console.log("👥 Filtered staff count:", invFilteredStaff.length);

    invSelectedStaff = null;
    updateStaffHeader();
    clearExpenses();
}

function handleStaffSelection(staffId) {
    invSelectedStaff = invFilteredStaff.find(
        (s) => String(s.id) === String(staffId)
    );

    console.log("✅ Selected staff object:", invSelectedStaff);

    updateStaffHeader();

    if (invSelectedStaff) {
        // Load expenses for this staff from Node API
        loadExpensesForStaff();
    } else {
        clearExpenses();
    }
}

function updateStaffHeader() {
    const salaryEl = document.getElementById("invStaffSalary");

    if (!salaryEl) return;

    if (!invSelectedStaff) {
        salaryEl.textContent = "0";
    } else {
        salaryEl.textContent = invSelectedStaff.salary || "0";
    }
}

// ============================================
// EXPENSES (from Node/json-server /expenses)
// ============================================

async function loadExpensesForStaff() {
    if (!invSelectedStaff) return;

    console.log("📡 Fetching expenses for staff:", invSelectedStaff.id);

    try {
        const res = await fetch(EXPENSES_URL);
        const data = await res.json();

        console.log("✅ Raw /expenses response:", data);

        // json-server returns array
        if (!Array.isArray(data)) {
            console.warn("⚠️ /expenses expected array, got:", data);
            invExpenses = [];
        } else {
            // keep only this staff's expenses
            invExpenses = data.filter(
                (exp) => String(exp.staff_id) === String(invSelectedStaff.id)
            );
        }

        console.log("📋 Staff expenses loaded:", invExpenses.length);

        renderExpenses();
        calculateTotals();
    } catch (err) {
        console.error("❌ Error loading expenses:", err);
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

    if (!invExpenses.length) {
        if (emptyState) {
            emptyState.classList.add("show");
        }
        return;
    }

    if (emptyState) {
        emptyState.classList.remove("show");
    }

    invExpenses.forEach((exp, index) => {
        const tr = document.createElement("tr");

        // Row number starts from 1
        const rowNumber = index + 1;

        tr.innerHTML = `
            <td class="row-number">${rowNumber}</td>
            <td>${exp.date}</td>
            <td>₹${Number(exp.amount).toFixed(2)}</td>
            <td>${exp.note || '-'}</td>
            <td class="action-col">
                <button class="action-btn" title="Remove expense" onclick="window.handleDeleteExpense(${exp.id})">
                    🗑️
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}


// ============================================
// DELETE EXPENSE
// ============================================

window.handleDeleteExpense = async function (expenseId) {
    const confirmed = await showConfirm(
        "Are you sure you want to delete this expense?",
        "warning"
    );
    if (!confirmed) return;

    console.log("🗑️ Deleting expense:", expenseId);

    try {
        const res = await fetch(`${EXPENSES_URL}/${expenseId}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            throw new Error(`Delete failed with status ${res.status}`);
        }

        console.log("✅ Expense deleted successfully");

        // Remove from local array
        invExpenses = invExpenses.filter(exp => exp.id !== expenseId);

        renderExpenses();
        calculateTotals();

        showNotification("Expense deleted successfully.", "success");
    } catch (err) {
        console.error("❌ Error deleting expense:", err);
        showNotification("Error while deleting expense.", "error");
    }
};


// ============================================
// TOTALS & BALANCE
// ============================================

function calculateTotals() {
    const totalExpenseEl = document.getElementById("invTotalExpense");
    const balanceEl = document.getElementById("invFinalBalance");

    if (!totalExpenseEl || !balanceEl) return;

    const salary = invSelectedStaff ? Number(invSelectedStaff.salary || 0) : 0;

    const monthSelect = document.getElementById("invMonthSelect");
    const selectedMonth = monthSelect ? monthSelect.value : null;

    let filtered = invExpenses;
    if (selectedMonth) {
        filtered = invExpenses.filter((exp) => {
            const expMonth = (exp.date || "").slice(0, 7);
            return expMonth === selectedMonth;
        });
    }

    const totalExpense = filtered.reduce(
        (sum, e) => sum + Number(e.amount || 0),
        0
    );

    const balance = salary - totalExpense;

    totalExpenseEl.textContent = totalExpense.toFixed(2);
    balanceEl.textContent = `₹${balance.toFixed(2)}`;

    // Style balance text based on positive/negative
    if (balance >= 0) {
        balanceEl.style.color = "inherit";
    } else {
        balanceEl.style.color = "#991b1b";
    }

    console.log("💰 Totals -> salary:", salary, "expenses:", totalExpense, "balance:", balance);
}

// ============================================
// SUBMIT EXPENSE (POST -> /expenses)
// ============================================

async function handleSubmitExpense() {
    if (!invSelectedStaff) {
        showNotification("Please select a staff first.", "error");
        return;
    }

    const amountInput = document.getElementById("invExpenseAmount");
    const dateInput = document.getElementById("invExpenseDate");
    const noteInput = document.getElementById("invExpenseNote");

    if (!amountInput || !dateInput || !noteInput) return;

    const amount = Number(amountInput.value);
    const date = dateInput.value;
    const note = noteInput.value.trim();

    if (!amount || !date) {
        showNotification("Please enter amount and date.", "error");
        return;
    }

    const payload = {
        staff_id: invSelectedStaff.id,
        date,
        amount,
        note
    };

    if (amount <= 0) {
        showNotification("Amount must be greater than zero.", "error");
        return;
    }

    const confirmed = await showConfirm(
        "Are you sure you want to add this expense?",
        "warning"
    );
    if (!confirmed) return;

    console.log("📤 Sending new expense to /expenses:", payload);

    try {
        const res = await fetch(EXPENSES_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const created = await res.json();
        console.log("✅ Expense created by server:", created);

        // json-server returns created object with id
        invExpenses.push(created);

        // Clear form
        amountInput.value = "";
        noteInput.value = "";
        setDefaultDateToday();

        renderExpenses();
        calculateTotals();

        showNotification("Expense added successfully.", "success");
    } catch (err) {
        console.error("❌ Error posting expense:", err);
        showNotification("Error while adding expense.", "error");
    }
}

