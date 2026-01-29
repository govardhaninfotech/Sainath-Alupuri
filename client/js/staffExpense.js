// ============================================
// STAFF EXPENSE MANAGEMENT PAGE
// ============================================

import { staffURLphp, expenseURLphp } from "../apis/api.js";
import { getItemsData, addItemToAPI, deleteItemFromAPI } from "../apis/master_api.js";
import { showNotification, showConfirm } from "./notification.js";

// Get user from localStorage or sessionStorage
let currentUser = JSON.parse(localStorage.getItem("rememberedUser") || sessionStorage.getItem("rememberedUser") || "null");
const user_id = currentUser?.id || "";
if (!user_id) {
    sessionStorage.removeItem("rememberedUser");
    localStorage.removeItem("rememberedUser");
    window.location.replace("../index.html");
}

// State Management
let staffList = [];
let staffExpenses = [];
let selectedStaffId = null;
let selectedMonth = null;
let selectedYear = null;

// Initialize with current month/year
const today = new Date();
selectedMonth = String(today.getMonth() + 1).padStart(2, '0');
selectedYear = today.getFullYear();

// ============================================
// LOAD STAFF DATA
// ============================================
async function loadStaffList() {
    try {
        const url = `${staffURLphp}?user_id=${user_id}`;
        const data = await getItemsData(url);
        
        staffList = data.staff || data || [];
        console.log("Staff loaded:", staffList.length);
        return staffList;
    } catch (error) {
        console.error("Error loading staff:", error);
        showNotification("Error loading staff data!", "error");
        staffList = [];
        return [];
    }
}

// ============================================
// LOAD EXPENSES FOR SELECTED STAFF
// ============================================
async function loadStaffExpenses(staffId, month, year) {
    try {
        if (!staffId) {
            staffExpenses = [];
            return [];
        }

        const url = `${expenseURLphp}?user_id=${user_id}&staff_id=${staffId}&month=${month}&year=${year}`;
        const data = await getItemsData(url);
        
        staffExpenses = Array.isArray(data) ? data : (data?.expenses || []);
        console.log("Expenses loaded:", staffExpenses.length);
        return staffExpenses;
    } catch (error) {
        console.error("Error loading expenses:", error);
        showNotification("Error loading expenses!", "error");
        staffExpenses = [];
        return [];
    }
}

// ============================================
// GET SELECTED STAFF INFO
// ============================================
function getSelectedStaffInfo() {
    if (!selectedStaffId) return null;
    return staffList.find(staff => String(staff.id) === String(selectedStaffId));
}

// ============================================
// CALCULATE TOTAL EXPENSES
// ============================================
function calculateTotalExpenses() {
    return staffExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
}

// ============================================
// HANDLE STAFF SELECTION CHANGE
// ============================================
function handleStaffChange(staffId) {
    selectedStaffId = staffId;
    
    // Update salary display
    const staffInfo = getSelectedStaffInfo();
    const salaryDisplay = document.getElementById("salaryStat");
    if (salaryDisplay && staffInfo) {
        salaryDisplay.textContent = `₹${parseFloat(staffInfo.salary || 0).toFixed(2)}`;
    }
    
    updateExpenseDisplay();
}

// ============================================
// HANDLE MONTH CHANGE
// ============================================
function handleMonthChange(monthYear) {
    if (!monthYear) return;
    
    const [year, month] = monthYear.split('-');
    selectedYear = year;
    selectedMonth = month;
    updateExpenseDisplay();
}

// ============================================
// UPDATE EXPENSE DISPLAY
// ============================================
async function updateExpenseDisplay() {
    if (!selectedStaffId) {
        document.getElementById("staffBalanceCard").innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999;">
                Please select a staff member
            </div>
        `;
        document.getElementById("staffExpensesList").innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999;">
                No data to display
            </div>
        `;
        return;
    }

    await loadStaffExpenses(selectedStaffId, selectedMonth, selectedYear);
    renderBalanceCard();
    renderExpensesList();
}

// ============================================
// RENDER BALANCE CARD
// ============================================
function renderBalanceCard() {
    const staffInfo = getSelectedStaffInfo();
    if (!staffInfo) return;

    const totalExpenses = calculateTotalExpenses();
    const salary = parseFloat(staffInfo.salary || 0);
    const balance = salary - totalExpenses;

    const balanceColor = balance >= 0 ? '#10b981' : '#ef4444';
    const balanceLabel = balance >= 0 ? 'Balance' : 'Due';

    const html = `
        <div style="padding: 12px; text-align: center;">
            <div style="font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 500;">Balance</div>
            <div style="font-size: 28px; font-weight: 700; color: ${balanceColor};">₹${Math.abs(balance).toFixed(2)}</div>
            <div style="font-size: 11px; color: #999; margin-top: 4px;">${balanceLabel}</div>
        </div>
    `;

    document.getElementById("staffBalanceCard").innerHTML = html;
}

// ============================================
// RENDER EXPENSES LIST
// ============================================
function renderExpensesList() {
    if (staffExpenses.length === 0) {
        document.getElementById("staffExpensesList").innerHTML = `
            <div style="padding: 30px; text-align: center; color: #999;">
                <p style="font-size: 16px; margin-bottom: 10px;">No expenses recorded</p>
                <p style="font-size: 14px;">Add an expense using the form on the left</p>
            </div>
        `;
        return;
    }

    let html = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Date</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Description</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Amount</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    staffExpenses.forEach((expense, index) => {
        const date = new Date(expense.date).toLocaleDateString('en-IN');
        const amount = parseFloat(expense.amount || 0);
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';

        html += `
            <tr style="background: ${bgColor}; border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px; color: #374151; font-size: 14px;">${date}</td>
                <td style="padding: 12px; color: #374151; font-size: 14px;">${expense.description || 'N/A'}</td>
                <td style="padding: 12px; text-align: right; color: #374151; font-size: 14px; font-weight: 600;">₹${amount.toFixed(2)}</td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="deleteExpense('${expense.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">Delete</button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    document.getElementById("staffExpensesList").innerHTML = html;
}

// ============================================
// ADD EXPENSE
// ============================================
async function addExpense(event) {
    event.preventDefault();

    if (!selectedStaffId) {
        showNotification("Please select a staff member first!", "error");
        return;
    }

    const expenseDate = document.getElementById("expenseDate").value;
    const expenseAmount = document.getElementById("expenseAmount").value;
    const expenseDescription = document.getElementById("expenseDescription").value;
    const paymentMode = document.getElementById("expensePaymentMode").value;
    const bankAccount = document.getElementById("expenseBankAccount").value;

    if (!expenseDate || !expenseAmount) {
        showNotification("Please fill in all required fields!", "error");
        return;
    }

    const amount = parseFloat(expenseAmount);
    if (amount <= 0) {
        showNotification("Amount must be greater than 0!", "error");
        return;
    }

    if (paymentMode !== 'cash' && !bankAccount) {
        showNotification("Please select a bank account!", "error");
        return;
    }

    const formData = {
        user_id: user_id,
        staff_id: parseInt(selectedStaffId),
        date: expenseDate,
        amount: amount,
        description: expenseDescription || "",
        payment_mode: paymentMode,
        bank_account: bankAccount || ""
    };

    try {
        const result = await addItemToAPI(expenseURLphp, formData);
        
        if (result.status === "ok" || result.id) {
            showNotification("Expense added successfully!", "success");
            document.getElementById("expenseForm").reset();
            document.getElementById("expensePaymentMode").value = "cash";
            document.getElementById("expenseBankAccount").disabled = true;
            document.getElementById("expenseBankAccount").value = "";
            await updateExpenseDisplay();
        } else {
            showNotification(result.message || "Error adding expense!", "error");
        }
    } catch (error) {
        console.error("Error adding expense:", error);
        showNotification("Error adding expense!", "error");
    }
}

// ============================================
// HANDLE PAYMENT MODE CHANGE
// ============================================
function handlePaymentModeChange(paymentMode) {
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
        bankAccountSelect.value = "";
    }
}

// ============================================
// DELETE EXPENSE
// ============================================
async function deleteExpense(expenseId) {
    const confirmed = await showConfirm("Are you sure you want to delete this expense?", "warning");
    
    if (!confirmed) return;

    try {
        const result = await deleteItemFromAPI(expenseURLphp, expenseId);
        
        if (result) {
            showNotification("Expense deleted successfully!", "success");
            await updateExpenseDisplay();
        } else {
            showNotification("Error deleting expense!", "error");
        }
    } catch (error) {
        console.error("Error deleting expense:", error);
        showNotification("Error deleting expense!", "error");
    }
}

// ============================================
// GENERATE MONTH OPTIONS
// ============================================
function generateMonthOptions() {
    let html = '<option value="">Select Month</option>';
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(today.getMonth() - i);
        const value = d.toISOString().slice(0, 7);
        const label = d.toLocaleString("default", { month: "long", year: "numeric" });
        const selected = value === `${selectedYear}-${selectedMonth}` ? 'selected' : '';
        html += `<option value="${value}" ${selected}>${label}</option>`;
    }
    
    return html;
}

// ============================================
// MAIN RENDER FUNCTION
// ============================================
export async function renderStaffExpensePage() {
    await loadStaffList();

    // Set current month as default
    const today = new Date();
    const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const todayDate = today.toISOString().split('T')[0];

    let staffOptions = '<option value="">Select Staff</option>';
    staffList.forEach(staff => {
        staffOptions += `<option value="${staff.id}">${staff.name} (${staff.role})</option>`;
    });

    return `
        <div class="staff-expense-container">
            <!-- Header -->
            <div class="staff-expense-header">
                <h1>💼 Staff Expense</h1>
            </div>

            <!-- Selection Cards -->
            <div class="selection-row">
                <div class="selection-card">
                    <label>Staff Selection</label>
                    <select id="staffSelect" onchange="handleStaffChange(this.value)" class="selection-input">
                        ${staffOptions}
                    </select>
                </div>

                <div class="selection-card">
                    <label>Month Selection</label>
                    <select id="monthSelect" onchange="handleMonthChange(this.value)" class="selection-input">
                        ${generateMonthOptions()}
                    </select>
                </div>

                <div class="selection-card">
                    <label>Balance</label>
                    <div id="staffBalanceCard" class="stat-display">
                        <div style="padding: 20px; text-align: center; color: #999;">Select staff</div>
                    </div>
                </div>

                <div class="selection-card">
                    <label>Salary</label>
                    <div class="stat-display" id="salaryStat" style="font-size: 24px; font-weight: bold; color: #667eea; text-align: center;">
                        ₹0.00
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="expense-content">
                <!-- Add Expense Form Modal -->
                <div id="addExpenseModal" class="expense-modal" style="display: none;">
                    <div class="expense-modal-overlay" onclick="closeAddExpenseModal()"></div>
                    <div class="expense-modal-box">
                        <div class="expense-modal-header">
                            <h2>Add new expense</h2>
                            <button type="button" class="expense-modal-close" onclick="closeAddExpenseModal()">✕</button>
                        </div>

                        <form id="expenseForm" onsubmit="addExpense(event)" class="expense-modal-form">
                            <div class="expense-form-grid">
                                <!-- Row 1: Date and Amount -->
                                <div class="expense-form-row">
                                    <div class="expense-form-group">
                                        <label for="expenseDate">Date</label>
                                        <input type="date" id="expenseDate" value="${todayDate}" required class="expense-form-input">
                                    </div>

                                    <div class="expense-form-group">
                                        <label for="expenseAmount">Amount</label>
                                        <input type="number" id="expenseAmount" placeholder="Enter amount" required min="0" step="0.01" class="expense-form-input">
                                    </div>
                                </div>

                                <!-- Row 2: Payment Mode and Bank Account -->
                                <div class="expense-form-row">
                                    <div class="expense-form-group">
                                        <label for="expensePaymentMode">Payment Mode</label>
                                        <select id="expensePaymentMode" class="expense-form-input" onchange="handlePaymentModeChange(this.value)">
                                            <option value="cash" selected>Cash</option>
                                            <option value="upi">UPI</option>
                                            <option value="bank">Bank</option>
                                        </select>
                                    </div>

                                    <div class="expense-form-group">
                                        <label for="expenseBankAccount">Bank Account</label>
                                        <select id="expenseBankAccount" class="expense-form-input" disabled>
                                            <option value="">N/A</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Row 3: Notes (Full Width) -->
                                <div class="expense-form-group expense-form-group-full">
                                    <label for="expenseDescription">Notes</label>
                                    <textarea id="expenseDescription" placeholder="Enter notes" rows="5" class="expense-form-input expense-form-textarea"></textarea>
                                </div>
                            </div>

                            <div class="expense-modal-footer expense-modal-footer-left">
                                <button type="button" class="expense-btn-cancel" onclick="closeAddExpenseModal()">Cancel</button>
                                <button type="submit" class="expense-btn-save">Save</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Add Expense Button and List Section -->
                <div class="expense-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0;">Add Expense</h2>
                        <button type="button" onclick="openAddExpenseModal()" class="btn-add-expense" style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.3s ease;">
                            ➕ Add Expense
                        </button>
                    </div>
                </div>

                <!-- Display Expenses -->
                <div class="expense-section">
                    <h2 style="margin-bottom: 20px; color: #1f2937; font-size: 18px; font-weight: 600;">Expense Per User</h2>
                    <div id="staffExpensesList" style="max-height: 500px; overflow-y: auto;">
                        <div style="padding: 20px; text-align: center; color: #999;">
                            Select a staff member to view expenses
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.handleStaffChange = handleStaffChange;
window.handleMonthChange = handleMonthChange;
window.addExpense = addExpense;
window.deleteExpense = deleteExpense;
window.showNotification = showNotification;
window.updateExpenseDisplay = updateExpenseDisplay;
window.handlePaymentModeChange = handlePaymentModeChange;
window.openAddExpenseModal = function() {
    const modal = document.getElementById("addExpenseModal");
    if (modal) {
        modal.style.display = "flex";
        setTimeout(() => modal.classList.add("show"), 10);
    }
};
window.closeAddExpenseModal = function() {
    const modal = document.getElementById("addExpenseModal");
    if (modal) {
        modal.classList.remove("show");
        setTimeout(() => modal.style.display = "none", 300);
    }
};
