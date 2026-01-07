// ============================================
// ORDERS PAGE - WITH VIEW ORDER DETAILS
// ============================================

import { currentStockURLphp } from "../apis/api.js";
import {
    getItemsData,
    updateItem,
    addItemToAPI
} from "../apis/master_api.js";
import { showNotification, showConfirm } from "./notification.js";
import {
    validateIndianMobile,
    validateDate,
    validateSalary,
    validateRequiredField,
    setupEscKeyHandler
} from "./validation.js";

// Initialize ESC key handler on page load
setupEscKeyHandler();

// Staff Data Storage
let itemData = [];
let itemsData = [];
let orderItems = [];

// Server-side pagination meta
let currentstaffPage = 1;
let staffPerPage = 10;
let staffTotal = 0;
let staffTotalPages = 1;
let currentDate = null
let editingItemId = null;

// EXPENSE MANAGEMENT STATE
let selectedStaffForExpense = null;
let staffExpenses = [];
let expenseEditingId = null;

const currentUser = JSON.parse(localStorage.getItem("rememberedUser") || sessionStorage.getItem("rememberedUser") || "null");
const user_id = currentUser?.id || "";
if (!user_id) {
    sessionStorage.removeItem("rememberedUser");
    localStorage.removeItem("rememberedUser");
    window.location.replace("../index.html");
}

// ============================================
// LOAD current stock DATA FROM API (SERVER PAGINATION)
// ============================================
function loaditemData() {
    const url = `${currentStockURLphp}?user_id=${user_id}`;
    console.log("Loading from URL:", url);

    return getItemsData(url).then(data => {
        console.log("Raw API Response:", data);
        console.log("Response type:", typeof data);
        console.log("Is Array:", Array.isArray(data));

        // Handle different response structures
        const items = data.items || [];
        
        // Reset itemData before filtering
        itemData = [];

        console.log("Total items from API:", items.length);

        // Filter items with current_stock > 0
        for (let index = 0; index < items.length; index++) {
            const element = items[index];
            const stock = parseFloat(element.current_stock);
            
            console.log(`Item ${index}: ${element.name}, Stock: ${element.current_stock} (parsed: ${stock})`);
            
            // Only add items with stock greater than 0
            if (stock > 0) {
                itemData.push(element);
                console.log(`✓ Added: ${element.name} with stock ${stock}`);
            } else {
                console.log(`✗ Skipped: ${element.name} with stock ${stock}`);
            }
        }

        console.log("Filtered items with stock > 0:", itemData.length);
        console.log("Items to display:", itemData);

        staffTotal = itemData.length;
        staffTotalPages = Math.ceil(staffTotal / staffPerPage);

        return data;
    }).catch(error => {
        console.error("Error loading items:", error);
        showNotification("Error loading items data!", "error");
        itemData = [];
        staffTotal = 0;
        staffTotalPages = 1;
        return { items: [], total: 0 };
    });
}

// ============================================
// RENDER STOCK ADJUSTMENT PAGE
// ============================================
export function renderStockAdjustmentPage() {
    console.log("=== renderStockAdjustmentPage called ===");
    
    return loaditemData().then(() => {
        console.log("Data loaded, filtered itemData length:", itemData.length);
        const html = generateTableHTML();
        
        setTimeout(() => {
            console.log("Populating dropdown with items:", itemData);
            renderItemsDataindropdown(itemData);
        }, 100);

        return html;
    });
}

// Generate table HTML
function generateTableHTML() {
    return `
        <div class="content-card">
            <div class="staff-header">
                <h2>Items Stock Adjustment</h2>
            </div>
            
            <div class="modal-body">
                <form id="staffForm" class="form-responsive" onsubmit="submitStockAdjuForm(event)">
                    <label for="modalToggle" style="color: red;">* Quantity must be negative</label>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="itemsName">Item Name <span class="required">*</span></label>
                            <select id="itemsName" required>
                                <option value="">Select Item</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="qty">Quantity<span class="required">*</span></label>
                            <input type="number" id="qty" step="1" max="0" value="-1" required placeholder="Enter Negative Quantity">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="reason">Reason <span class="required">*</span></label>
                        <textarea id="reason" rows="4" required placeholder="Enter your reason for adjustment"></textarea>
                    </div>
                    
                    <div class="form-actions" id="formActions">
                        <button type="button" class="btn-cancel" id="cancelBtn" onclick="resetstaffForm()">Reset</button>
                        <button type="submit" class="btn-submit" id="submitBtn">Add Adjustment</button>
                    </div>
                </form>
            </div>  
        </div>
    `;
}

function resetstaffForm() {
    const form = document.getElementById("staffForm");
    if (form) {
        form.reset();
        document.getElementById("qty").value = "-1";
    }
}

// ============================================
// RENDER ITEMS DATA in dropdown with validation
// ============================================
function renderItemsDataindropdown(itemsData) {
    console.log("=== renderItemsDataindropdown START ===");
    console.log("itemsData received:", itemsData);
    console.log("itemsData length:", itemsData?.length);

    const itemList = document.getElementById("itemsName");
    console.log("Dropdown element found:", !!itemList);

    if (!itemList) {
        console.error("❌ Dropdown element 'itemsName' not found");
        return;
    }

    // Clear existing options
    itemList.innerHTML = '<option value="">Select Item</option>';

    // Validate itemsData
    if (!itemsData || !Array.isArray(itemsData)) {
        console.warn("⚠️ No valid items data");
        showNotification("No items available", "warning");
        return;
    }

    if (itemsData.length === 0) {
        console.warn("⚠️ No items with stock > 0");
        showNotification("No items with stock available for adjustment", "info");
        return;
    }

    // Populate dropdown
    let successCount = 0;
    itemsData.forEach((item, index) => {
        const itemId = item.item_id || item.id;
        const itemName = item.name;
        const currentStock = item.current_stock;

        if (!itemId || !itemName) {
            console.warn(`⚠️ Skipping invalid item at index ${index}:`, item);
            return;
        }

        const opt = document.createElement("option");
        opt.value = itemId;
        opt.textContent = `${itemName} (Stock: ${currentStock} ${item.unit || ''})`;
        opt.dataset.stock = currentStock || 0;
        opt.dataset.unit = item.unit || '';

        itemList.appendChild(opt);
        successCount++;
        console.log(`✓ Added to dropdown: ${itemName} (ID: ${itemId}, Stock: ${currentStock})`);
    });

    console.log(`✅ Successfully added ${successCount} items to dropdown`);
    console.log("=== renderItemsDataindropdown END ===");
}

// ============================================
// SUBMIT FORM : with new stock data
// ============================================
function submitStockAdjuForm(event) {
    event.preventDefault();
    console.log("=== FORM SUBMISSION START ===");

    // Get form values
    const itemId = document.getElementById("itemsName").value;
    const qty = parseFloat(document.getElementById("qty").value);
    const reason = document.getElementById("reason").value.trim();
    
    console.log("📋 Form values:");
    console.log("  - Item ID:", itemId);
    console.log("  - Quantity:", qty);
    console.log("  - Reason:", reason);

    // Validation
    if (!itemId) {
        showNotification("Please select an item", "error");
        return;
    }

    if (qty >= 0) {
        showNotification("Quantity must be negative for adjustment", "error");
        return;
    }

    if (!reason) {
        showNotification("Please provide a reason for adjustment", "error");
        return;
    }

    // Prepare data in the format you specified
    const formData = {
        user_id: user_id,
        qty: qty,
        reason: reason,
        item_id: parseInt(itemId)
    };

    console.log("📤 Data to be sent:");
    console.log(JSON.stringify(formData, null, 2));
    console.table(formData);

    showConfirm(
        "Are you sure you want to make this stock adjustment?",
        "warning"
    ).then(confirmed => {
        if (!confirmed) {
            console.log("❌ User cancelled the submission");
            return;
        }

        console.log("🚀 Sending PATCH request to:", currentStockURLphp);

        return fetch(currentStockURLphp, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(result => {
            console.log("✅ API response received:");
            console.log(JSON.stringify(result.data, null, 2));
            
            if (result.status === 200 || result.data.status === "ok" || result.data.success) {
                showNotification("Stock adjustment recorded successfully!", "success");
                resetstaffForm();
                nevigateToPage('stockmovement');
                
                // Reload the page to show updated stock
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    renderStockAdjustmentPage().then(html => {
                        mainContent.innerHTML = html;
                    });
                }
            } else {
                console.error("❌ API returned error:", result.data);
                showNotification(result.data.detail || result.data.message || "Error recording adjustment", "error");
            }
        })
        .catch(error => {
            console.error("❌ Error submitting form:");
            console.error(error);
            showNotification("Error submitting adjustment", "error");
        });
    });
}

// Expose functions to window
window.submitStockAdjuForm = submitStockAdjuForm;
window.showNotification = showNotification;
window.generateTableHTML = generateTableHTML;
window.showConfirm = showConfirm;
window.renderItemsDataindropdown = renderItemsDataindropdown;
window.loaditemData = loaditemData;
window.resetstaffForm = resetstaffForm;