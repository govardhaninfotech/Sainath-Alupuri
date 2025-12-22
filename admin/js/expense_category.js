// ============================================
// EXPENSE CATEGORY PAGE - CRUD OPERATIONS
// ============================================

import { expenseCategoriesURLphp } from "../apis/api.js";
import { getItemsData, addItemToAPI, deleteItemFromAPI } from "../apis/master_api.js";
import { showNotification, showConfirm } from "./notification.js";
import { validateRequiredField } from "./validation.js";

// Expense Category Data Storage
let expenseCategoryData = [];

let editingItemId = null;

// ============================================
// GET USER ID FROM LOCALSTORAGE OR SESSIONSTORAGE
// ============================================
function getUserId() {
    // Check localStorage first (if remember me was selected)
    const rememberedUser = localStorage.getItem("rememberedUser");
    if (rememberedUser) {
        try {
            const user = typeof rememberedUser === "string" ? JSON.parse(rememberedUser) : rememberedUser;
            return user.id || user.user_id || null;
        } catch (e) {
            console.error("Error parsing rememberedUser:", e);
        }
    }

    // Check sessionStorage if not in localStorage (when remember me was NOT checked)
    const sessionUser = sessionStorage.getItem("rememberedUser");
    if (sessionUser) {
        try {
            const user = typeof sessionUser === "string" ? JSON.parse(sessionUser) : sessionUser;
            return user.id || user.user_id || null;
        } catch (e) {
            console.error("Error parsing session user:", e);
        }
    }

    return null;
}

// ============================================
// LOAD EXPENSE CATEGORY DATA FROM API
// ============================================
function loadExpenseCategoryData() {
    // Get user_id from localStorage or sessionStorage
    const userId = getUserId();
    if (!userId) {
        console.warn("User ID not found. Cannot load expense categories.");
        expenseCategoryData = [];
        return Promise.resolve();
    }

    // Build URL with user_id parameter
    const url = `${expenseCategoriesURLphp}?user_id=${userId}`;

    return getItemsData(url).then(data => {
        // Handle API response format: {"page":1,"per_page":50,"total":5,"total_pages":1,"categories":[...]}
        if (data && Array.isArray(data.categories)) {
            expenseCategoryData = data.categories;
        } else if (Array.isArray(data)) {
            expenseCategoryData = data;
        } else if (data && Array.isArray(data.data)) {
            expenseCategoryData = data.data;
        } else {
            expenseCategoryData = [];
        }
    }).catch(error => {
        console.error("Error loading expense categories:", error);
        expenseCategoryData = [];
        showNotification("Error loading expense categories. Please try again.", "error");
    });
}

// ============================================
// RENDER EXPENSE CATEGORY TABLE
// ============================================
export function renderExpenseCategoryTable() {
    return loadExpenseCategoryData().then(() => generateTableHTML());
}

// Generate table HTML
function generateTableHTML() {

    let tableRows = "";
    if (expenseCategoryData.length === 0) {
        tableRows = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px; color: #9ca3af;">
                    No expense categories found. Click "Add Category" to create one.
                </td>
            </tr>
        `;
    } else {
        for (let index = 0; index < expenseCategoryData.length; index++) {
            // const serialNo = (page - 1) * perPage + index + 1;
            const serialNo = index + 1;

            let category = expenseCategoryData[index];
            tableRows += `    
                <tr>
                    <td>${serialNo}</td>
                    <td>${category.name || category.category_name || "-"}</td>
                    <td>${category.notes || "-"}</td>
                    <td>
                        <button class="btn-icon btn-delete-icon" onclick="deleteExpenseCategory('${category.id}')" title="Delete">
                            <i class="icon-delete">🗑</i>
                        </button>
                    </td>
                </tr>
            `;
        }
    }

    return `
        <div class="content-card">
            <div class="items-header">
                <h2>Expense Categories</h2>
                <button class="btn-add" onclick="openExpenseCategoryForm()">Add Category</button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Category Name</th>
                            <th>Notes</th>
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Expense Category Form Modal -->
        <div id="expenseCategoryFormModal" class="modal">
            <div class="modal-content modal-responsive">
                <div class="modal-header">
                    <h3 id="expenseCategoryFormTitle">Add New Category</h3>
                    <button class="close-btn" onclick="closeExpenseCategoryForm()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="expenseCategoryForm" onsubmit="submitExpenseCategoryForm(event)" class="form-responsive">
                        <input type="hidden" id="expenseCategoryId">
                        
                        <div class="form-row">
                            <div class="form-group" style="width: 100%;">
                                <label for="expenseCategoryName">Category Name <span class="required">*</span></label>
                                <input type="text" id="expenseCategoryName" required placeholder="Enter category name">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group" style="width: 100%;">
                                <label for="expenseCategoryNotes">Notes <span class="optional">(Optional)</span></label>
                                <textarea id="expenseCategoryNotes" placeholder="Enter notes (optional)" rows="4" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: Arial, sans-serif; resize: vertical; min-height: 100px;"></textarea>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeExpenseCategoryForm()">Cancel</button>
                            <button type="submit" class="btn-submit">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// FORM FUNCTIONS
// ============================================
function openExpenseCategoryForm() {
    editingItemId = null;
    document.getElementById("expenseCategoryFormTitle").textContent = "Add New Category";
    document.getElementById("expenseCategoryForm").reset();
    document.getElementById("expenseCategoryId").value = "";

    const modal = document.getElementById("expenseCategoryFormModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

function closeExpenseCategoryForm() {
    const modal = document.getElementById("expenseCategoryFormModal");
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
    editingItemId = null;
}

async function submitExpenseCategoryForm(event) {
    event.preventDefault();

    const name = document.getElementById("expenseCategoryName").value.trim();
    const notes = document.getElementById("expenseCategoryNotes").value.trim();

    // Validate Name
    const validation = validateRequiredField(name, "Category name", 2);
    if (!validation.status) {
        showNotification(validation.message, "error");
        return;
    }

    // Get user_id from localStorage or sessionStorage
    const userId = getUserId();
    if (!userId) {
        showNotification("User ID not found. Please login again.", "error");
        return;
    }

    const formData = {
        name: name,
        notes: notes || "NA",
        user_id: userId
    };

    const mainContent = document.getElementById("mainContent");

    return showConfirm(
        "Are you sure you want to add this expense category?",
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        return addItemToAPI(expenseCategoriesURLphp, formData).then(result => {
            if (result && !result.error) {
                showNotification("Expense category added successfully!", "success");
                closeExpenseCategoryForm();

                if (mainContent) {
                    return loadExpenseCategoryData().then(() => {
                        mainContent.innerHTML = generateTableHTML();
                    });
                }
            } else {
                const errorMsg = result?.message || result?.error || "Error adding expense category!";
                showNotification(errorMsg, "error");
            }
        });
    });
}

// ============================================
// DELETE EXPENSE CATEGORY FUNCTION
// ============================================
function deleteExpenseCategory(id) {
    return showConfirm(
        "Are you sure you want to delete this expense category?",
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        // Get user_id from localStorage or sessionStorage
        const userId = getUserId();
        if (!userId) {
            showNotification("User ID not found. Please login again.", "error");
            return;
        }

        // Build URL with both user_id and id parameters
        const url = `${expenseCategoriesURLphp}?user_id=${userId}&id=${id}`;

        return fetch(url, {
            method: 'DELETE'
        }).then(response => {
            if (!response.ok) {
                console.error('API Error:', response.status, response.statusText);
                return false;
            }
            return response.ok;
        }).then(result => {
            if (result) {
                showNotification("Expense category deleted successfully!", "success");
                const mainContent = document.getElementById("mainContent");
                if (mainContent) {
                    // After delete, reload categories from server
                    return loadExpenseCategoryData().then(() => {
                        mainContent.innerHTML = generateTableHTML();
                    });
                }
            } else {
                showNotification("Error deleting expense category!", "error");
            }
        }).catch(error => {
            console.error("Error deleting expense category:", error);
            showNotification("Error deleting expense category!", "error");
            return false;
        });
    });
}

// Close modal when clicking outside
window.addEventListener("click", function (event) {
    const modal = document.getElementById("expenseCategoryFormModal");
    if (event.target === modal) {
        closeExpenseCategoryForm();
    }
});

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.openExpenseCategoryForm = openExpenseCategoryForm;
window.closeExpenseCategoryForm = closeExpenseCategoryForm;
window.submitExpenseCategoryForm = submitExpenseCategoryForm;
window.deleteExpenseCategory = deleteExpenseCategory;
window.showNotification = showNotification;
window.generateTableHTML = generateTableHTML;
window.showConfirm = showConfirm;

