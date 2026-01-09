// ============================================
// GENERAL EXPENSE PAGE - CRUD OPERATIONS WITH PAGINATION
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
    setupEscKeyHandler
} from "./validation.js";

// Get user from localStorage or sessionStorage
let currentUser = JSON.parse(localStorage.getItem("rememberedUser") || sessionStorage.getItem("rememberedUser"));
let user_id = currentUser?.id;

// Expense Data Storage
let expenseData = [];

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
let currentDate = null;
let month = 0;
let year = 0;

// ============================================
// LOAD EXPENSE DATA FROM API (SERVER PAGINATION)
// ============================================
async function loadExpenseData() {
    try {
        if (month === 0 || year === 0) {
            let today = new Date();
            month = today.getMonth() + 1;
            year = today.getFullYear();
        }
        month = currentDate ? parseInt(currentDate.split("-")[1], 10) : month;
        year = currentDate ? parseInt(currentDate.split("-")[0], 10) : year;
        
        const url = `${expenseURLphp}?user_id=${user_id}&month=${month}&year=${year}&page=${currentExpensePage}&per_page=${expensePerPage}`;
        console.log("Loading expenses from:", url);

        const data = await getItemsData(url);
        
        // Extract expenses from response
        expenseData = data?.expenses || [];
        expenseTotal = data?.total ?? expenseData.length;
        expensePerPage = data?.per_page ?? expensePerPage;
        expenseTotalPages = data?.total_pages ?? Math.max(1, Math.ceil(expenseTotal / expensePerPage));
        currentExpensePage = data?.page ?? currentExpensePage;
        
        console.log("Loaded expenses:", expenseData.length, "Total:", expenseTotal);
    } catch (error) {
        console.error("Error loading expenses:", error);
        expenseData = [];
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

        bankAccountData = allBanks;
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

    categoryData.forEach((cat) => {
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

// Filter bank accounts by payment mode
function getAccountsByPaymentMode(paymentMode) {
    if (!paymentMode) return bankAccountData;
    
    const mode = paymentMode.toLowerCase();
    
    if (mode === 'cash') {
        return [];
    } else if (mode === 'upi') {
        // Filter accounts that support UPI (type = 'upi')
        return bankAccountData.filter(acc => 
            acc.type?.toLowerCase() === 'upi' || 
            acc.account_type?.toLowerCase() === 'upi' ||
            acc.name?.toLowerCase().includes('upi') ||
            acc.account_name?.toLowerCase().includes('upi')
        );
    } else if (mode === 'bank' || mode === 'bank_transfer') {
        // Filter accounts that are bank accounts (type = 'bank')
        return bankAccountData.filter(acc => 
            acc.type?.toLowerCase() === 'bank' ||
            acc.account_type?.toLowerCase() === 'bank' ||
            (!acc.type && acc.account_number) // Fallback for accounts without explicit type
        );
    }
    
    return bankAccountData;
}

// Populate Bank Account dropdown based on payment mode
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

    select.innerHTML = `<option value="">Select Bank Account</option>`;

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

    if (dateStr.includes("-")) {
        const parts = dateStr.split("-");
        if (parts[0].length === 4) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else {
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
        expenseData.forEach((expense, index) => {
            const serialNo = (page - 1) * perPage + index + 1;
            const paymentModeDisplay = (expense.payment_mode || 'cash').toUpperCase();
            
            tableRows += `
                <tr>
                    <td>${serialNo}</td>
                    <td>${getCategoryNameById(expense.category_id)}</td>
                    <td>₹${parseFloat(expense.amount || 0).toFixed(2)}</td>
                    <td>${formatDateForDisplay(expense.expense_date)}</td>
                    <td>${paymentModeDisplay}</td>
                    <td>${expense.bank_name || getBankNameById(expense.bank_account_id) || "N/A"}</td>
                    <td>${expense.notes || 'N/A'}</td>
                    <td>
                        <button class="btn-icon btn-edit" onclick="editExpense(${expense.id})" title="Edit">
                            <i class="icon-edit">✎</i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>Expense Management</h2>
                <button class="btn-add" onclick="openGeneralExpenseForm()">Add Expense</button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Payment Mode</th>
                            <th>Bank Account</th>
                            <th>Notes</th>
                            <th>Actions</th>
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
                    <input type="date" id="expenseDate" required>
                    <button class="close-btn" onclick="closeExpenseForm()">&times;</button>
                </div>
                <div class="modal-body" style="padding = 0px !importent;">
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
                                <label for="expensePaymentMode">Payment Mode <span class="required">*</span></label>
                                <select id="expensePaymentMode" required>
                                    <option value="">Select Payment Mode</option>
                                    <option value="cash" selected>Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank">Bank</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="expenseBankAccount">Bank Account</label>
                                <select id="expenseBankAccount" disabled>
                                    <option value="">Not applicable for Cash</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group form-group-full">
                                <label for="expenseNotes">Notes</label>
                                <textarea
                                    id="expenseNotes"
                                    rows="3"
                                    placeholder="Enter notes (optional)"
                                    style="resize: vertical; width: 100%;"
                                ></textarea>
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
// PAGINATION FUNCTIONS
// ============================================
async function changeExpensePage(direction) {
    if (direction === "next" && currentExpensePage < expenseTotalPages) {
        currentExpensePage++;
    } else if (direction === "prev" && currentExpensePage > 1) {
        currentExpensePage--;
    } else {
        return;
    }

    await loadExpenseData();
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
        mainContent.innerHTML = generateTableHTML();
    }
}

// ============================================
// FORM FUNCTIONS
// ============================================
function openGeneralExpenseForm() {
    editingExpenseId = null;
    document.getElementById("expenseFormTitle").textContent = "Add New Expense";
    document.getElementById("expenseForm").reset();
    document.getElementById("expenseId").value = "";

    // Set today's date by default
    document.getElementById("expenseDate").value = getTodayDate();

    console.log("Opening expense form, populating dropdowns...");
    populateCategoryDropdown();

    // Set default payment mode to cash
    const paymentModeSelect = document.getElementById("expensePaymentMode");
    if (paymentModeSelect) {
        paymentModeSelect.value = "cash";
    }
    
    // Initialize bank account dropdown as disabled for cash
    populateBankAccountDropdown("", "cash");

    setupPaymentModeChangeHandler();

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
// EDIT EXPENSE FUNCTION
// ============================================
function editExpense(id) {
    editingExpenseId = id;
    const item = expenseData.find(i => String(i.id) === String(id));

    if (!item) {
        console.error("Expense not found for edit:", id);
        showNotification("Expense not found!", "error");
        return;
    }

    document.getElementById("expenseFormTitle").textContent = "Update Expense";
    document.getElementById("expenseId").value = item.id;
    document.getElementById("expenseAmount").value = item.amount || "";
    document.getElementById("expenseDate").value = item.expense_date || getTodayDate();
    document.getElementById("expenseNotes").value = item.notes || "";

    console.log("Editing expense, populating dropdowns...");
    
    // First populate category dropdown
    populateCategoryDropdown(item.category_id || "");
    
    // Set payment mode first (default to cash if not set)
    const paymentMode = item.payment_mode || "cash";
    document.getElementById("expensePaymentMode").value = paymentMode;
    
    // Then populate bank account dropdown based on payment mode and select the bank
    populateBankAccountDropdown(item.bank_account_id || "", paymentMode);

    setupPaymentModeChangeHandler();

    const modal = document.getElementById("expenseFormModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

async function submitExpenseForm(event) {
    event.preventDefault();
    console.log("Submitting expense form");

    const categoryId = document.getElementById("expenseCategory").value;
    const amount = document.getElementById("expenseAmount").value;
    const date = document.getElementById("expenseDate").value;
    const bankAccountId = document.getElementById("expenseBankAccount").value;
    const paymentMode = document.getElementById("expensePaymentMode").value;
    const notes = document.getElementById("expenseNotes").value;

    // Validation
    if (!categoryId) {
        showNotification("Please select a category.", "error");
        return;
    }

    if (!amount || parseFloat(amount) <= 0) {
        showNotification("Amount must be greater than zero.", "error");
        return;
    }

    if (!date) {
        showNotification("Please select a date.", "error");
        return;
    }

    if (!paymentMode) {
        showNotification("Please select a payment mode.", "error");
        return;
    }

    if (paymentMode !== "cash" && !bankAccountId) {
        showNotification("Please select a bank account for non-cash payments.", "error");
        return;
    }

    const formData = {
        user_id: user_id,
        category_id: parseInt(categoryId),
        amount: parseFloat(amount),
        expense_date: date,
        bank_account_id: (paymentMode !== "cash" && bankAccountId) ? parseInt(bankAccountId) : null,
        payment_mode: paymentMode,
        notes: notes || "N/A",
        shop_id: null
    };

    console.log("Form data:", formData);

    const mainContent = document.getElementById("mainContent");

    if (editingExpenseId) {
        const confirmed = await showConfirm(
            "Are you sure you want to update this expense?",
            "warning"
        );

        if (!confirmed) return;

        try {
            const result = await updateItem(expenseURLphp, editingExpenseId, formData);
            console.log("Update result:", result);

            if (result?.error) {
                showNotification(result.message || "Error updating expense!", "error");
            } else if (result) {
                showNotification("Expense updated successfully!", "success");
                closeExpenseForm();
                await loadExpenseData();
                if (mainContent) {
                    mainContent.innerHTML = generateTableHTML();
                }
            } else {
                showNotification("Error updating expense!", "error");
            }
        } catch (error) {
            console.error("Update error:", error);
            showNotification(error?.message || "Error updating expense!", "error");
        }
    } else {
        const confirmed = await showConfirm(
            "Are you sure you want to add this expense?",
            "warning"
        );

        if (!confirmed) return;

        try {
            const result = await addItemToAPI(`${expenseURLphp}?user_id=${user_id}`, formData);
            console.log("Add result:", result);

            if (result?.status === "ok" || result?.success) {
                showNotification("Expense added successfully!", "success");
                closeExpenseForm();
                await loadExpenseData();
                if (mainContent) {
                    mainContent.innerHTML = generateTableHTML();
                }
            } else {
                showNotification(result?.message || "Error adding expense!", "error");
            }
        } catch (error) {
            console.error("Add error:", error);
            showNotification(error?.message || "Error adding expense!", "error");
        }
    }
}

// ============================================
// PAYMENT MODE CHANGE HANDLER
// ============================================
function setupPaymentModeChangeHandler() {
    const paymentModeSelect = document.getElementById("expensePaymentMode");
    if (!paymentModeSelect) return;

    // Remove existing listeners by cloning
    const newSelect = paymentModeSelect.cloneNode(true);
    paymentModeSelect.parentNode.replaceChild(newSelect, paymentModeSelect);

    newSelect.addEventListener("change", function () {
        const selectedMode = this.value;
        console.log("Payment mode changed to:", selectedMode);
        populateBankAccountDropdown("", selectedMode);
    });
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
window.editExpense = editExpense;
window.openGeneralExpenseForm = openGeneralExpenseForm;
window.closeExpenseForm = closeExpenseForm;
window.submitExpenseForm = submitExpenseForm;
window.changeExpensePage = changeExpensePage;

// Setup ESC key handler for modal
setupEscKeyHandler();