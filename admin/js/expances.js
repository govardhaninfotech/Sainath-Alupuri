// ============================================
// EXPENSE PAGE - CRUD OPERATIONS WITH PAGINATION
// ============================================

import { expenseURLphp, expenseCategoriesURLphp, bankURLphp } from "../apis/api.js";
import {
    getItemsData,
    updateItem,
    deleteItemFromAPI,
    addItemToAPI
} from "../apis/master_api.js";
import { showNotification, showConfirm } from "./notification.js";
import {
    validateRequiredField,
    validateForm,
    setupEscKeyHandler
} from "./validation.js";

// Get user from localStorage or sessionStorage
let currentUser = JSON.parse(localStorage.getItem("rememberedUser") || sessionStorage.getItem("rememberedUser"));
let user_id = currentUser?.id || '22';

// Expense Data Storage
let expenseData = [];
let allExpenseData = []; // Store all expenses for filtering

// Server-side pagination meta
let currentExpensePage = 1;
let expensePerPage = 10;
let expenseTotal = 0;
let expenseTotalPages = 1;

let editingExpenseId = null;

// Category and Bank Account data
let categoryData = [];
let bankAccountData = [];
let categoryDataLoaded = false;
let bankAccountDataLoaded = false;

// ============================================
// LOAD EXPENSE DATA FROM API (SERVER PAGINATION)
// ============================================
async function loadExpenseData() {
    try {
        const url = `${expenseURLphp}?user_id=${user_id}&staff_id=null`;
        const res = await fetch(url);

        if (!res.ok) {
            console.warn("Expenses API returned", res.status);
            expenseData = [];
            allExpenseData = [];
            expenseTotal = 0;
            expenseTotalPages = 1;
            return;
        }

        const data = await res.json();
        console.log("Expense API Response:", data);

        // Handle different response formats
        let allExpenses = [];
        if (Array.isArray(data)) {
            allExpenses = data;
        } else if (data?.expenses && Array.isArray(data.expenses)) {
            allExpenses = data.expenses;
        } else if (data?.data && Array.isArray(data.data)) {
            allExpenses = data.data;
        } else {
            allExpenses = [];
        }

        // ✅ FILTER: Only show expenses where shop_id is null or empty
        allExpenseData = allExpenses.filter(expense =>
            !expense.shop_id ||
            expense.shop_id === null ||
            expense.shop_id === "null" ||
            expense.shop_id === ""
        );

        console.log("Total expenses from API:", allExpenses.length);
        console.log("Filtered expenses (shop_id = null):", allExpenseData.length);

        // Client-side pagination
        expenseTotal = allExpenseData.length;
        expenseTotalPages = Math.max(1, Math.ceil(expenseTotal / expensePerPage));

        // Get current page data
        const startIndex = (currentExpensePage - 1) * expensePerPage;
        const endIndex = startIndex + expensePerPage;
        expenseData = allExpenseData.slice(startIndex, endIndex);

        console.log("Expenses for current page:", expenseData.length);
    } catch (error) {
        console.error("Error loading expenses:", error);
        expenseData = [];
        allExpenseData = [];
        expenseTotal = 0;
        expenseTotalPages = 1;
    }
}

// ============================================
// LOAD CATEGORY DATA (FOR DROPDOWN)
// ============================================
async function loadCategoryData() {
    if (categoryDataLoaded && categoryData.length > 0) {
        return categoryData;
    }

    try {
        const res = await fetch(`${expenseCategoriesURLphp}?user_id=${user_id}`);
        if (!res.ok) throw new Error(`Categories API returned ${res.status}`);

        const json = await res.json();
        console.log("Expense Categories API Response:", json);

        // Handle different response formats
        if (Array.isArray(json)) {
            categoryData = json;
        } else if (json?.categories && Array.isArray(json.categories)) {
            categoryData = json.categories;
        } else if (json?.data && Array.isArray(json.data)) {
            categoryData = json.data;
        } else {
            categoryData = [];
            console.warn("No categories found in response");
        }

        categoryDataLoaded = true;
        console.log("Expense categories loaded:", categoryData.length);
        return categoryData;
    } catch (error) {
        console.error("Error loading category data:", error);
        showNotification("Error loading categories!", "error");
        categoryData = [];
        return [];
    }
}

// ============================================
// LOAD BANK ACCOUNT DATA (FOR DROPDOWN)
// ============================================
async function loadBankAccountData() {
    if (bankAccountDataLoaded && bankAccountData.length > 0) {
        return bankAccountData;
    }

    try {
        const res = await fetch(`${bankURLphp}?user_id=${user_id}`);
        if (!res.ok) throw new Error(`Bank API returned ${res.status}`);

        const json = await res.json();
        console.log("Bank Accounts API Response:", json);

        // Handle different response formats
        let allBanks = [];
        if (Array.isArray(json)) {
            allBanks = json;
        } else if (json?.bank_accounts && Array.isArray(json.bank_accounts)) {
            allBanks = json.bank_accounts;
        } else if (json?.data && Array.isArray(json.data)) {
            allBanks = json.data;
        } else if (json?.accounts && Array.isArray(json.accounts)) {
            allBanks = json.accounts;
        } else {
            allBanks = [];
            console.warn("No bank accounts found in response");
        }

        // Filter only active bank accounts
        bankAccountData = allBanks.filter(account =>
            (account.status || "").toLowerCase() === "active"
        );

        bankAccountDataLoaded = true;
        console.log("Bank accounts loaded:", bankAccountData.length);
        return bankAccountData;
    } catch (error) {
        console.error("Error loading bank account data:", error);
        showNotification("Error loading bank accounts!", "error");
        bankAccountData = [];
        return [];
    }
}

// Helper: get category name from category_id
function getCategoryNameById(categoryId) {
    if (!categoryId) return "";
    const category = categoryData.find(c => String(c.id) === String(categoryId));
    if (category) {
        return category.category_name || category.name || "";
    }
    return "";
}

// Helper: get bank name from bank_account_id
function getBankNameById(bankId) {
    if (!bankId) return "";
    const bank = bankAccountData.find(b => String(b.id) === String(bankId));
    if (bank) {
        return bank.bank_name || bank.account_name || bank.name || "";
    }
    return "";
}

// Populate Category dropdown
function populateCategoryDropdown(selectedCategoryId = "") {
    const select = document.getElementById("expenseCategory");
    if (!select) {
        console.error("Category select element not found");
        return;
    }

    console.log("Populating category dropdown with", categoryData.length, "categories");

    select.innerHTML = `<option value="">Select Category</option>`;

    if (categoryData.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No categories available";
        opt.disabled = true;
        select.appendChild(opt);
        console.warn("No categories to populate");
        return;
    }

    categoryData.forEach((cat, index) => {
        console.log(`Category ${index + 1}:`, cat);
        const opt = document.createElement("option");
        opt.value = cat.id || cat.category_id;
        opt.textContent = cat.category_name || cat.name || `Category ${cat.id}`;
        select.appendChild(opt);
    });

    if (selectedCategoryId) {
        select.value = String(selectedCategoryId);
    }

    console.log("Category dropdown populated with", select.options.length - 1, "categories");
}

// Populate Bank Account dropdown
function populateBankAccountDropdown(selectedBankId = "") {
    const select = document.getElementById("expenseBankAccount");
    if (!select) {
        console.error("Bank account select element not found");
        return;
    }

    console.log("Populating bank account dropdown with", bankAccountData.length, "accounts");

    select.innerHTML = `<option value="">Select Bank Account</option>`;

    if (bankAccountData.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No bank accounts available";
        opt.disabled = true;
        select.appendChild(opt);
        console.warn("No bank accounts to populate");
        return;
    }

    bankAccountData.forEach((bank, index) => {
        console.log(`Bank ${index + 1}:`, bank);
        const opt = document.createElement("option");
        opt.value = bank.id || bank.account_id;

        // Try different possible field names
        const bankName = bank.bank_name || bank.account_name || bank.name || 'Bank';
        const accountNumber = bank.account_number || bank.acc_number || bank.number || '';

        opt.textContent = `${bankName}${accountNumber ? ' - ' + accountNumber : ''}`;
        select.appendChild(opt);
    });

    if (selectedBankId) {
        select.value = String(selectedBankId);
    }

    console.log("Bank dropdown populated with", select.options.length - 1, "accounts");
}

// ============================================
// RENDER EXPENSE TABLE WITH PAGINATION
// ============================================
export function renderInventoryExpancesPage() {
    console.log("renderInventoryExpancesPage: Starting");

    return Promise.all([
        loadExpenseData(),
        loadCategoryData(),
        loadBankAccountData()
    ]).then(() => {
        console.log("All data loaded successfully");
        console.log("Bank accounts available:", bankAccountData.length);
        console.log("Expense categories available:", categoryData.length);
        return generateTableHTML();
    }).catch(error => {
        console.error("Error in renderInventoryExpancesPage:", error);
        showNotification("Error loading data. Please refresh the page.", "error");
        return generateTableHTML();
    });
}

// Format date for display (YYYY-MM-DD to DD/MM/YYYY)
function formatDateForDisplay(dateStr) {
    if (!dateStr || dateStr === "0000-00-00") return "N/A";

    // Handle both YYYY-MM-DD and DD-MM-YYYY formats
    if (dateStr.includes("-")) {
        const parts = dateStr.split("-");
        if (parts[0].length === 4) {
            // YYYY-MM-DD format
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else {
            // Already in DD-MM-YYYY format
            return dateStr.replace(/-/g, '/');
        }
    }

    return dateStr;
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Generate table HTML
function generateTableHTML() {
    const page = currentExpensePage;
    const perPage = expensePerPage;
    const total = expenseTotal;
    const totalPages = expenseTotalPages || 1;

    let showingFrom = 0;
    let showingTo = 0;

    if (total > 0) {
        showingFrom = (page - 1) * perPage + 1;
        showingTo = Math.min(page * perPage, total);
    }

    let tableRows = "";

    if (expenseData.length === 0) {
        tableRows = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div style="color: #6b7280;">
                        <p style="font-size: 18px; margin-bottom: 8px;">No expenses found</p>
                        <p style="font-size: 14px;">Click "Add Expense" to create your first expense.</p>
                    </div>
                </td>
            </tr>
        `;
    } else {
        expenseData.forEach(expense => {
            tableRows += `
                <tr>
                    <td>${getCategoryNameById(expense.category_id)}</td>
                    <td>₹${parseFloat(expense.amount || 0).toFixed(2)}</td>
                    <td>${formatDateForDisplay(expense.expense_date)}</td>
                    <td>${getBankNameById(expense.bank_account_id)}</td>
                    <td>${expense.payment_mode || 'N/A'}</td>
                    <td>${expense.notes || 'N/A'}</td>
                   <!-- <td>
                        <button class="btn-icon btn-edit" onclick="editExpense(${expense.category_id})" title="Edit">
                            <i class="icon-edit">✎</i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteExpense(${expense.category_id})" title="Delete">
                            <i class="icon-delete">🗑️</i>
                        </button>
                    </td>-->
                </tr>
            `;
        });
    }

    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>Expense Management</h2>
                <button class="btn-add" onclick="openExpenseForm()">Add Expense</button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Bank Account</th>
                            <th>Payment Mode</th>
                            <th>Notes</th>
                            <!--<th>Actions</th>-->
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>

            <div class="pagination">
                <div class="pagination-info">
                    Showing ${total === 0 ? 0 : showingFrom} to ${showingTo} of ${total} entries
                </div>
                <div class="pagination-controls">
                    <button onclick="changeExpensePage('prev')" ${page === 1 ? "disabled" : ""}>Previous</button>
                    <span class="page-number">Page ${page} of ${totalPages}</span>
                    <button onclick="changeExpensePage('next')" ${page === totalPages ? "disabled" : ""}>Next</button>
                </div>
            </div>
        </div>

        <!-- Expense Form Modal -->
        <div id="expenseFormModal" class="modal">
            <div class="modal-content modal-responsive">
                <div class="modal-header">
                    <h3 id="expenseFormTitle">Add New Expense</h3>
                    <button class="close-btn" onclick="closeExpenseForm()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="expenseForm" onsubmit="submitExpenseForm(event)" class="form-responsive">
                        <input type="hidden" id="expenseId">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="expenseCategory">Category <span class="required">*</span></label>
                                <select id="expenseCategory" required>
                                    <option value="">Select category</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="expenseAmount">Amount <span class="required">*</span></label>
                                <input type="number" id="expenseAmount" required placeholder="Enter amount" step="0.01" min="0">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="expenseDate">Date <span class="required">*</span></label>
                                <input type="date" id="expenseDate" required>
                            </div>

                            <div class="form-group">
                                <label for="expenseBankAccount">Bank Account <span class="required">*</span></label>
                                <select id="expenseBankAccount" required>
                                    <option value="">Select bank account</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="expensePaymentMode">Payment Mode <span class="required">*</span></label>
                                <select id="expensePaymentMode" required>
                                    <option value="">Select payment mode</option>
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="card">Card</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="expenseNotes">Notes</label>
                                <input type="text" id="expenseNotes" placeholder="Enter notes (optional)">
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeExpenseForm()">Cancel</button>
                            <button type="submit" class="btn-submit">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// PAGINATION FUNCTIONS (CLIENT-SIDE)
// ============================================
function changeExpensePage(direction) {
    if (direction === "next" && currentExpensePage < expenseTotalPages) {
        currentExpensePage++;
    } else if (direction === "prev" && currentExpensePage > 1) {
        currentExpensePage--;
    } else {
        return Promise.resolve();
    }

    // Recalculate current page data from allExpenseData
    const startIndex = (currentExpensePage - 1) * expensePerPage;
    const endIndex = startIndex + expensePerPage;
    expenseData = allExpenseData.slice(startIndex, endIndex);

    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
        mainContent.innerHTML = generateTableHTML();
    }
}

// ============================================
// FORM FUNCTIONS
// ============================================
function openExpenseForm() {
    editingExpenseId = null;
    document.getElementById("expenseFormTitle").textContent = "Add New Expense";
    document.getElementById("expenseForm").reset();
    document.getElementById("expenseId").value = "";

    // Set today's date as default
    document.getElementById("expenseDate").value = getTodayDate();

    // Load and populate dropdowns
    console.log("Opening expense form, populating dropdowns...");
    populateCategoryDropdown();
    populateBankAccountDropdown();

    const modal = document.getElementById("expenseFormModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

function closeExpenseForm() {
    const modal = document.getElementById("expenseFormModal");
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
    editingExpenseId = null;
}

// ============================================
// DELETE EXPENSE FUNCTION WITH CONFIRMATION
// ============================================
async function deleteExpense(id) {
    try {
        const confirmed = await showConfirm(
            "Are you sure you want to delete this expense?",
            "warning"
        );

        if (!confirmed) return;

        const result = await deleteItemFromAPI(expenseURLphp, id);

        if (result) {
            showNotification("Expense deleted successfully!", "success");

            // Reload the page data
            await loadExpenseData();
            const mainContent = document.getElementById("mainContent");
            if (mainContent) {
                mainContent.innerHTML = generateTableHTML();
            }
        } else {
            showNotification("Error deleting expense!", "error");
        }
    } catch (error) {
        console.error("Error deleting expense:", error);
        showNotification("Error deleting expense!", "error");
    }
}

// ============================================
// EDIT EXPENSE FUNCTION
// ============================================
function editExpense(id) {
    editingExpenseId = id;
    const item = allExpenseData.find(i => String(i.category_id) === String(id));

    if (!item) {
        console.error("Expense not found for edit:", id);
        showNotification("Expense not found!", "error");
        return;
    }

    document.getElementById("expenseFormTitle").textContent = "Update Expense";
    document.getElementById("expenseId").value = item.category_id;
    document.getElementById("expenseAmount").value = item.amount || "";
    document.getElementById("expenseDate").value = item.expense_date || getTodayDate();
    document.getElementById("expensePaymentMode").value = item.payment_mode || "";
    document.getElementById("expenseNotes").value = item.notes || "";

    // Populate dropdowns and set selected values
    console.log("Editing expense, populating dropdowns...");
    populateCategoryDropdown(item.category_id || "");
    populateBankAccountDropdown(item.bank_account_id || "");

    const modal = document.getElementById("expenseFormModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

async function submitExpenseForm(event) {
    event.preventDefault();

    // Get form values
    const categoryId = document.getElementById("expenseCategory").value;
    const amount = document.getElementById("expenseAmount").value;
    const date = document.getElementById("expenseDate").value;
    const bankAccountId = document.getElementById("expenseBankAccount").value;
    const paymentMode = document.getElementById("expensePaymentMode").value;
    const notes = document.getElementById("expenseNotes").value;

    // Validate all fields
    const categoryValidation = validateRequiredField(categoryId, "Category");
    const amountValidation = validateRequiredField(amount, "Amount");
    const dateValidation = validateRequiredField(date, "Date");
    const bankAccountValidation = validateRequiredField(bankAccountId, "Bank Account");
    const paymentModeValidation = validateRequiredField(paymentMode, "Payment Mode");

    // Additional amount validation
    if (parseFloat(amount) <= 0) {
        showNotification("Amount must be greater than zero.", "error");
        return;
    }

    // Check all validations
    const formValidation = validateForm([
        categoryValidation,
        amountValidation,
        dateValidation,
        bankAccountValidation,
        paymentModeValidation
    ]);

    if (!formValidation.status) {
        showNotification(formValidation.message, "error");
        return;
    }

    const formData = {
        user_id: user_id,
        category_id: parseInt(categoryId),
        amount: parseFloat(amount),
        expense_date: date,
        bank_account_id: parseInt(bankAccountId),
        payment_mode: paymentMode,
        notes: notes || null,
        shop_id: null  // ✅ Always set shop_id to null for general expenses
    };

    const mainContent = document.getElementById("mainContent");

    if (editingExpenseId) {
        return showConfirm(
            "Are you sure you want to update this expense?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) return;

            return updateItem(expenseURLphp, editingExpenseId, formData).then(result => {
                if (result?.error) {
                    showNotification(result.message || "Error updating expense!", "error");
                } else if (result) {
                    showNotification("Expense updated successfully!", "success");
                    closeExpenseForm();
                    if (mainContent) {
                        return loadExpenseData().then(() => {
                            mainContent.innerHTML = generateTableHTML();
                        });
                    }
                } else {
                    showNotification("Error updating expense!", "error");
                }
            }).catch(error => {
                console.error("Update error:", error);
                showNotification(error?.message || "Error updating expense!", "error");
            });
        });
    } else {
        return showConfirm(
            "Are you sure you want to add this expense?",
            "warning"
        ).then(confirmed => {
            if (!confirmed) return;

            return addItemToAPI(expenseURLphp, formData).then(result => {
                if (result?.error) {
                    showNotification(result.message || "Error adding expense!", "error");
                } else if (result) {
                    showNotification("Expense added successfully!", "success");
                    closeExpenseForm();
                    if (mainContent) {
                        return loadExpenseData().then(() => {
                            mainContent.innerHTML = generateTableHTML();
                        });
                    }
                } else {
                    showNotification("Error adding expense!", "error");
                }
            }).catch(error => {
                console.error("Add error:", error);
                showNotification(error?.message || "Error adding expense!", "error");
            });
        });
    }
}

// Close modal when clicking outside
window.addEventListener("click", function (event) {
    const modal = document.getElementById("expenseFormModal");
    if (event.target === modal) {
        closeExpenseForm();
    }
});

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.deleteExpense = deleteExpense;
window.editExpense = editExpense;
window.openExpenseForm = openExpenseForm;
window.closeExpenseForm = closeExpenseForm;
window.submitExpenseForm = submitExpenseForm;
window.changeExpensePage = changeExpensePage;

// Setup ESC key handler for modal
setupEscKeyHandler();