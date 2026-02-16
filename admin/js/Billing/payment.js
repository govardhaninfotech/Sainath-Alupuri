// ============================================
// PAYMENT HISTORY PAGE WITH PAYMENT FORM
// ============================================

import { paymentHistoryURLphp, addPaymentURLphp, userURLphp, bankURLphp } from "../../apis/api.js";
import { getItemsData, addItemToAPI } from "../../apis/master_api.js";
import { showNotification, showConfirm } from "../notification.js";

// Items Data Storage
let itemsData = [];
let bankAccounts = [];
let clientsList = [];
let prefilledData = null;
let clientPayemtInfo = {};
// Server-side pagination meta
let month = 0;
let year = 0;
let currentItemsPage = 1;
let itemsPerPage = 10;
let itemsTotal = 0;
let itemsTotalPages = 1;
let currentDate = null;
let totalPages = itemsTotalPages || 1;
let showingFrom = 0;
let showingTo = 0;
let currentUser = null;
let client_id = 0;

function loadCurrentUser() {
    console.log("🔍 [loadCurrentUser] Starting to load current user...");
    
    try {
        currentUser =
            JSON.parse(sessionStorage.getItem("rememberedUser")) ||
            JSON.parse(localStorage.getItem("rememberedUser"));
        
        console.log("✅ [loadCurrentUser] User loaded from storage:", currentUser);
    } catch (e) {
        console.error("❌ [loadCurrentUser] Error parsing user data:", e);
        currentUser = null;
    }

    if (!currentUser || !currentUser.id) {
        console.error("❌ [loadCurrentUser] User not logged in or missing ID");
        showNotification("User not logged in!", "error");
        return Promise.reject("Missing user_id");
    }
    
    console.log("✅ [loadCurrentUser] Current user ID:", currentUser.id);
    return Promise.resolve(currentUser);
}

// ============================================
// LOAD PAYMENT HISTORY DATA FROM API
// ============================================
function loadPaymentHistoryData() {
    console.log("📊 [loadPaymentHistoryData] Starting to load payment history...");
    
    loadCurrentUser();

    if (month === 0 || year === 0) {
        let today = new Date();
        month = today.getMonth() + 1;
        year = today.getFullYear();
        console.log(`📅 [loadPaymentHistoryData] Set default month/year: ${month}/${year}`);
    }
    month = currentDate ? parseInt(currentDate.split("-")[1], 10) : month;
    year = currentDate ? parseInt(currentDate.split("-")[0], 10) : year;

    const url = `${paymentHistoryURLphp}?user_id=${currentUser.id}&client_id=${client_id}&page=${currentItemsPage}&per_page=${itemsPerPage}`;
    console.log("🌐 [loadPaymentHistoryData] Fetching from URL:", url);

    return getItemsData(url).then(data => {
        console.log("✅ [loadPaymentHistoryData] Payment history data received:", data);

        itemsData = data || [];
        itemsTotal = data.total ?? itemsData.length;
        itemsPerPage = data.per_page ?? itemsPerPage;
        itemsTotalPages = data.total_pages ?? Math.max(1, Math.ceil(itemsTotal / itemsPerPage));
        currentItemsPage = data.page ?? currentItemsPage;
        
        console.log(`📊 [loadPaymentHistoryData] Loaded ${itemsData.length} items, Total: ${itemsTotal}, Pages: ${itemsTotalPages}`);
    }).catch(error => {
        console.error("❌ [loadPaymentHistoryData] Error loading payment history:", error);
        throw error;
    });
}

// ============================================
// LOAD DROPDOWN DATA (CLIENTS & BANK ACCOUNTS)
// ============================================
function loadClientsData() {
    console.log("👥 [loadClientsData] Starting to load clients...");
    
    const url = `${userURLphp}`;
    console.log("🌐 [loadClientsData] Fetching from URL:", url);
    
    return getItemsData(url).then(data => {
        console.log("✅ [loadClientsData] Raw API Response:", data);
        
        // Handle different possible response structures
        if (data?.users && Array.isArray(data.users)) {
            clientsList = data.users;
            console.log("📦 [loadClientsData] Extracted from data.users");
        } else if (Array.isArray(data)) {
            clientsList = data;
            console.log("📦 [loadClientsData] Using data directly as array");
        } else {
            clientsList = [];
            console.warn("⚠️ [loadClientsData] Unexpected response structure, defaulting to empty array");
        }
        
        console.log(`✅ [loadClientsData] Loaded ${clientsList.length} clients`);
        console.log("👥 [loadClientsData] Clients list:", clientsList);
        
        return clientsList;
    }).catch(err => {
        console.error("❌ [loadClientsData] Error loading clients:", err);
        clientsList = [];
        throw err;
    });
}

function loadBankAccountsData() {
    console.log("🏦 [loadBankAccountsData] Starting to load bank accounts...");
    
    const url = `${bankURLphp}?user_id=${currentUser.id}`;
    console.log("🌐 [loadBankAccountsData] Fetching from URL:", url);
    
    return getItemsData(url).then(data => {
        console.log("✅ [loadBankAccountsData] Raw API Response:", data);

        // Handle different API response structures
        if (data?.accounts && Array.isArray(data.accounts)) {
            bankAccounts = data.accounts;
            console.log("📦 [loadBankAccountsData] Extracted from data.accounts");
        } else if (data?.bank_accounts && Array.isArray(data.bank_accounts)) {
            bankAccounts = data.bank_accounts;
            console.log("📦 [loadBankAccountsData] Extracted from data.bank_accounts");
        } else if (Array.isArray(data)) {
            bankAccounts = data;
            console.log("📦 [loadBankAccountsData] Using data directly as array");
        } else {
            bankAccounts = [];
            console.warn("⚠️ [loadBankAccountsData] Unexpected response structure, defaulting to empty array");
        }

        console.log(`✅ [loadBankAccountsData] Loaded ${bankAccounts.length} bank accounts`);
        console.log("🏦 [loadBankAccountsData] Bank accounts list:", bankAccounts);
        
        return bankAccounts;
    }).catch(err => {
        console.error("❌ [loadBankAccountsData] Error loading bank accounts:", err);
        bankAccounts = [];
        throw err;
    });
}

// Helper: Filter bank accounts by payment mode
function getAccountsByPaymentMode(paymentMode) {
    console.log(`🔍 [getAccountsByPaymentMode] Filtering accounts for mode: ${paymentMode}`);
    console.log(`🔍 [getAccountsByPaymentMode] Total bank accounts available: ${bankAccounts.length}`);
    
    if (!paymentMode) {
        console.log("⚠️ [getAccountsByPaymentMode] No payment mode specified, returning all accounts");
        return bankAccounts;
    }

    const mode = paymentMode.toLowerCase();
    console.log(`🔍 [getAccountsByPaymentMode] Normalized mode: ${mode}`);

    if (mode === 'cash') {
        console.log("💵 [getAccountsByPaymentMode] Cash mode - returning empty array");
        return [];
    } else if (mode === 'upi') {
        const filtered = bankAccounts.filter(acc =>
            acc.type?.toLowerCase() === 'upi' ||
            acc.account_type?.toLowerCase() === 'upi' ||
            acc.name?.toLowerCase().includes('upi') ||
            acc.account_name?.toLowerCase().includes('upi')
        );
        console.log(`📱 [getAccountsByPaymentMode] UPI accounts filtered: ${filtered.length}`, filtered);
        return filtered;
    } else if (mode === 'bank') {
        const filtered = bankAccounts.filter(acc =>
            acc.type?.toLowerCase() === 'bank' ||
            acc.account_type?.toLowerCase() === 'bank' ||
            (!acc.type && acc.account_number)
        );
        console.log(`🏦 [getAccountsByPaymentMode] Bank accounts filtered: ${filtered.length}`, filtered);
        return filtered;
    }

    console.log("⚠️ [getAccountsByPaymentMode] Unknown payment mode, returning all accounts");
    return bankAccounts;
}

function populatePaymentClientDropdown(selectedClientId = "") {
    console.log("🎯 [populatePaymentClientDropdown] Starting dropdown population...");
    console.log(`🎯 [populatePaymentClientDropdown] Selected client ID: ${selectedClientId}`);
    console.log(`🎯 [populatePaymentClientDropdown] Clients list length: ${clientsList.length}`);
    
    const select = document.getElementById("paymentClientSelect");
    if (!select) {
        console.error("❌ [populatePaymentClientDropdown] Client select element not found!");
        return;
    }

    console.log("✅ [populatePaymentClientDropdown] Select element found");
    console.log(`📋 [populatePaymentClientDropdown] Populating with ${clientsList.length} clients`);

    select.innerHTML = `<option value="">Select Client</option>`;
    console.log("🧹 [populatePaymentClientDropdown] Dropdown cleared with default option");

    if (clientsList.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No clients available";
        opt.disabled = true;
        select.appendChild(opt);
        console.warn("⚠️ [populatePaymentClientDropdown] No clients available to populate");
        return;
    }

    clientsList.forEach((client, index) => {
        console.log(`➕ [populatePaymentClientDropdown] Adding client ${index + 1}:`, client);
        
        const opt = document.createElement("option");
        opt.value = client.id;
        const clientName = client.name || "Unnamed Client";
        const shopCode = client.shop_code || "";
        opt.textContent = `${clientName}${shopCode ? ' - ' + shopCode : ''}`;
        select.appendChild(opt);
        
        console.log(`   ✅ Added: ${opt.textContent} (ID: ${opt.value})`);
    });

    if (selectedClientId) {
        select.value = String(selectedClientId);
        console.log(`🎯 [populatePaymentClientDropdown] Pre-selected client ID: ${selectedClientId}`);
    }

    console.log(`✅ [populatePaymentClientDropdown] Dropdown populated with ${select.options.length - 1} clients`);
}

// Populate Bank Account dropdown based on payment mode
function populatePaymentBankAccountDropdown(selectedBankId = "", paymentMode = "") {
    console.log("🏦 [populatePaymentBankAccountDropdown] Starting bank account dropdown population...");
    console.log(`🏦 [populatePaymentBankAccountDropdown] Selected bank ID: ${selectedBankId}, Payment mode: ${paymentMode}`);
    
    const select = document.getElementById("paymentBankAccount");
    if (!select) {
        console.error("❌ [populatePaymentBankAccountDropdown] Bank account select element not found!");
        return;
    }

    console.log("✅ [populatePaymentBankAccountDropdown] Select element found");

    if (paymentMode.toLowerCase() === 'cash') {
        console.log("💵 [populatePaymentBankAccountDropdown] Cash mode - disabling bank account field");
        select.disabled = true;
        select.innerHTML = `<option value="">Not applicable for Cash</option>`;
        select.value = "";
        select.removeAttribute('required');
        console.log("✅ [populatePaymentBankAccountDropdown] Bank account field disabled for cash");
        return;
    }

    console.log("🔓 [populatePaymentBankAccountDropdown] Enabling bank account field");
    select.disabled = false;
    select.setAttribute('required', 'required');

    const filteredAccounts = paymentMode ? getAccountsByPaymentMode(paymentMode) : bankAccounts;

    console.log(`📋 [populatePaymentBankAccountDropdown] Populating with ${filteredAccounts.length} accounts for mode: ${paymentMode}`);

    select.innerHTML = `<option value="">Select Bank Account</option>`;
    console.log("🧹 [populatePaymentBankAccountDropdown] Dropdown cleared with default option");

    if (filteredAccounts.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = `No ${paymentMode} accounts available`;
        opt.disabled = true;
        select.appendChild(opt);
        console.warn(`⚠️ [populatePaymentBankAccountDropdown] No ${paymentMode} accounts available`);
        return;
    }

    filteredAccounts.forEach((bank, index) => {
        console.log(`➕ [populatePaymentBankAccountDropdown] Adding account ${index + 1}:`, bank);
        
        const opt = document.createElement("option");
        opt.value = bank.id || bank.account_id;

        const bankName = bank.bank_name || bank.account_name || bank.name || 'Account';
        const accountNumber = bank.account_number || bank.acc_number || bank.number || '';

        opt.textContent = `${bankName}${accountNumber ? ' - ' + accountNumber : ''}`;
        select.appendChild(opt);
        
        console.log(`   ✅ Added: ${opt.textContent} (ID: ${opt.value})`);
    });

    if (selectedBankId) {
        select.value = String(selectedBankId);
        console.log(`🎯 [populatePaymentBankAccountDropdown] Pre-selected bank ID: ${selectedBankId}`);
    }

    console.log(`✅ [populatePaymentBankAccountDropdown] Dropdown populated with ${select.options.length - 1} accounts`);
}

// Setup payment mode change handler
function setupPaymentModeChangeHandler() {
    console.log("⚙️ [setupPaymentModeChangeHandler] Setting up payment mode change handler...");
    
    const paymentModeSelect = document.getElementById("paymentMode");
    if (!paymentModeSelect) {
        console.error("❌ [setupPaymentModeChangeHandler] Payment mode select element not found!");
        return;
    }

    console.log("✅ [setupPaymentModeChangeHandler] Payment mode select found");

    // Save current value before cloning
    const currentValue = paymentModeSelect.value;
    console.log(`💾 [setupPaymentModeChangeHandler] Saving current value: ${currentValue}`);

    // Remove existing listeners by cloning
    const newSelect = paymentModeSelect.cloneNode(true);
    paymentModeSelect.parentNode.replaceChild(newSelect, paymentModeSelect);
    console.log("🔄 [setupPaymentModeChangeHandler] Select element cloned to remove old listeners");

    // Restore the value
    newSelect.value = currentValue;
    console.log(`✅ [setupPaymentModeChangeHandler] Restored value: ${newSelect.value}`);

    newSelect.addEventListener("change", function () {
        const selectedMode = this.value;
        console.log(`🔔 [Payment Mode Change] User changed payment mode to: ${selectedMode}`);
        populatePaymentBankAccountDropdown("", selectedMode);
    });
    
    console.log("✅ [setupPaymentModeChangeHandler] Event listener attached");
}

export function initClientDropdown() {
    console.log("🚀 [initClientDropdown] ========== INITIALIZING PAYMENT PAGE ==========");

    // Load prefilled data flag
    try {
        prefilledData = JSON.parse(sessionStorage.getItem("paymentClientData"));
        console.log("📦 [initClientDropdown] Prefilled data from session:", prefilledData);
        
        if (prefilledData) {
            client_id = prefilledData.client_id;
            console.log(`🎯 [initClientDropdown] Client ID set from prefilled data: ${client_id}`);
        }
    } catch (e) {
        prefilledData = null;
        console.log("⚠️ [initClientDropdown] No prefilled data or error parsing:", e);
    }

    const clientSelect = document.getElementById("invClientSelect");
    if (!clientSelect) {
        console.warn("⚠️ [initClientDropdown] invClientSelect not found, skipping month dropdown setup");
    } else {
        console.log("📅 [initClientDropdown] Setting up month/year dropdown...");
        clientSelect.innerHTML = "";
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date();
            d.setMonth(today.getMonth() - i);
            const value = d.toISOString().slice(0, 7);
            const label = d.toLocaleString("default", { month: "long", year: "numeric" });
            const opt = document.createElement("option");
            opt.value = value;
            opt.textContent = label;
            clientSelect.appendChild(opt);
        }
        console.log("✅ [initClientDropdown] Month/year dropdown populated");
    }

    // ✅ Load all data first, THEN populate and prefill
    console.log("🔄 [initClientDropdown] Loading all required data (payment history, clients, bank accounts)...");
    
    return Promise.all([
        loadPaymentHistoryData(),
        loadClientsData(),
        loadBankAccountsData()
    ]).then(() => {
        console.log("✅ [initClientDropdown] All data loaded successfully!");
        console.log(`   📊 Payment history items: ${itemsData.length}`);
        console.log(`   👥 Clients loaded: ${clientsList.length}`);
        console.log(`   🏦 Bank accounts loaded: ${bankAccounts.length}`);
        
        console.log("🎨 [initClientDropdown] Populating form dropdowns...");
        populatePaymentFormDropdowns();
        
        console.log("📝 [initClientDropdown] Pre-filling form if data exists...");
        prefilPaymentForm();
        
        console.log("✅ [initClientDropdown] ========== INITIALIZATION COMPLETE ==========");
    }).catch(error => {
        console.error("❌ [initClientDropdown] Error loading data:", error);
        showNotification("Error loading form data", "error");
    });
}

export function handleClientChange(event) {
    console.log("🔔 [handleClientChange] Client selection changed");
    console.log("🔔 [handleClientChange] New value:", event.target.value);
    
    currentDate = event.target.value;
    currentItemsPage = 1;
    
    console.log(`📅 [handleClientChange] Current date set to: ${currentDate}, resetting to page 1`);
    
    return loadPaymentHistoryData();
}

function populatePaymentFormDropdowns() {
    console.log("🎨 [populatePaymentFormDropdowns] Starting to populate form dropdowns...");
    
    // Populate clients dropdown
    console.log("👥 [populatePaymentFormDropdowns] Populating clients dropdown...");
    populatePaymentClientDropdown();

    // Set default payment mode to cash
    const paymentModeSelect = document.getElementById("paymentMode");
    if (paymentModeSelect) {
        console.log("💵 [populatePaymentFormDropdowns] Setting default payment mode to 'cash'");
        paymentModeSelect.value = "cash";
        // This will disable bank account field
        populatePaymentBankAccountDropdown("", "cash");
    } else {
        console.error("❌ [populatePaymentFormDropdowns] Payment mode select not found!");
    }

    // Setup payment mode change handler (must be after setting default value)
    console.log("⚙️ [populatePaymentFormDropdowns] Setting up payment mode change handler...");
    setupPaymentModeChangeHandler();
    
    console.log("✅ [populatePaymentFormDropdowns] All dropdowns populated");
}

function prefilPaymentForm() {
    console.log("📝 [prefilPaymentForm] Starting to prefill payment form...");
    
    // Try to get data from sessionStorage
    let dataToFill = null;
    try {
        dataToFill = JSON.parse(sessionStorage.getItem("paymentClientData"));
        console.log("📦 [prefilPaymentForm] Data retrieved from session storage:", dataToFill);
    } catch (e) {
        dataToFill = null;
        console.log("⚠️ [prefilPaymentForm] No data to prefill or error parsing:", e);
    }

    if (!dataToFill) {
        console.log("ℹ️ [prefilPaymentForm] No data to prefill, exiting");
        return;
    }

    console.log("✅ [prefilPaymentForm] Pre-filling payment form with data:", dataToFill);

    // Pre-fill client select
    const clientSelect = document.getElementById("paymentClientSelect");
    if (clientSelect && dataToFill.client_id) {
        clientSelect.value = String(dataToFill.client_id);
        console.log(`👤 [prefilPaymentForm] Client pre-filled: ${dataToFill.client_id}`);
    }

    // Pre-fill payment mode FIRST (before bank account)
    const paymentModeSelect = document.getElementById("paymentMode");
    if (paymentModeSelect) {
        const mode = dataToFill.payment_mode || "cash";
        paymentModeSelect.value = mode;
        console.log(`💳 [prefilPaymentForm] Payment mode pre-filled: ${mode}`);

        // Populate bank accounts for that mode
        console.log(`🏦 [prefilPaymentForm] Populating bank accounts for mode: ${mode}`);
        populatePaymentBankAccountDropdown("", mode);

        // Then set the bank account value (with slight delay to ensure dropdown is populated)
        if (dataToFill.bank_account_id && mode !== 'cash') {
            console.log(`⏱️ [prefilPaymentForm] Scheduling bank account selection: ${dataToFill.bank_account_id}`);
            setTimeout(() => {
                const bankSelect = document.getElementById("paymentBankAccount");
                if (bankSelect) {
                    bankSelect.value = String(dataToFill.bank_account_id);
                    console.log(`🏦 [prefilPaymentForm] Bank account pre-filled: ${dataToFill.bank_account_id}`);
                } else {
                    console.error("❌ [prefilPaymentForm] Bank select not found after timeout");
                }
            }, 0);
        }
    }

    // Pre-fill amount
    const amountInput = document.getElementById("paymentAmount");
    if (amountInput && dataToFill.amount) {
        amountInput.value = dataToFill.amount;
        console.log(`💰 [prefilPaymentForm] Amount pre-filled: ${dataToFill.amount}`);
    }

    // Pre-fill order ID
    const orderInput = document.getElementById("paymentOrderId");
    if (orderInput && dataToFill.order_id) {
        orderInput.value = dataToFill.order_id;
        console.log(`🔢 [prefilPaymentForm] Order ID pre-filled: ${dataToFill.order_id}`);
    }

    console.log("✅ [prefilPaymentForm] Payment form pre-filled successfully");
}

export function initPaymentHistoryCard() {
    console.log("🎨 [initPaymentHistoryCard] Generating payment form HTML");
    return `
        <div class="content-card">
            <div class="inv-page-header">
                <div class="inv-page-header-left">
                    <h1>💳 Add Payment</h1>
                </div>
            </div>

            <form id="paymentForm" onsubmit="submitPaymentForm(event)" class="payment-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="paymentClientSelect1">Client <span class="required">*</span></label>
                        <select id="paymentClientSelect" required>
                            <option value="">Select Client</option>
                        </select>
                    </div>
                     <div class="form-group">
                        <label for="paymentOrderId">Order ID (Optional)</label>
                        <input type="number" id="paymentOrderId" placeholder="Enter order ID" min="0">
                    </div>
                   
                </div>

                <div class="form-row">
                  


                
                
                <div class="form-group">
                    <label for="paymentMode">Payment Mode <span class="required">*</span></label>
                        <select id="paymentMode" required>
                            <option value="">Select Payment Mode</option>
                            <option value="cash" selected>Cash</option>
                            <option value="upi">UPI</option>
                            <option value="bank">Bank</option>
                        </select>
                </div>
                <div class="form-group">
                   <label for="paymentBankAccount">Bank Account</label>
                   <select id="paymentBankAccount">
                       <option value="">Not applicable for Cash</option>
                   </select>
               </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="paymentReferenceNo">Reference Number</label>
                        <input type="text" id="paymentReferenceNo" placeholder="Enter reference number">
                    </div>
                    <div class="form-group">
                        <label for="paymentAmount">Amount <span class="required">*</span></label>
                        <input type="number" id="paymentAmount" required placeholder="Enter amount" min="0" step="0.01">
                    </div>
                   
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="paymentNotes">Notes</label>
                        <textarea
                            id="paymentNotes"
                            rows="3"
                            placeholder="Enter payment notes"
                            style="resize: vertical;"
                        ></textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="reset" class="btn-cancel" onclick="resetPaymentForm()">Clear</button>
                    <button type="submit" class="btn-submit">Save Payment</button>
                </div>
            </form>
        </div>
    `;
}

function resetPaymentForm() {
    console.log("🔄 [resetPaymentForm] Resetting payment form...");
    
    prefilledData = null;
    sessionStorage.removeItem("paymentClientData");
    console.log("🗑️ [resetPaymentForm] Cleared prefilled data and session storage");
    
    document.getElementById("paymentForm").reset();
    console.log("🧹 [resetPaymentForm] Form reset");

    // Reset to defaults
    const paymentModeSelect = document.getElementById("paymentMode");
    if (paymentModeSelect) {
        paymentModeSelect.value = "cash";
        populatePaymentBankAccountDropdown("", "cash");
        console.log("💵 [resetPaymentForm] Payment mode reset to cash");
    }
    
    console.log("✅ [resetPaymentForm] Form reset complete");
}

function closePaymentForm() {
    console.log("❌ [closePaymentForm] Closing payment form modal");
    document.getElementById("paymentFormModal1").style.display = "none";
}

function submitPaymentForm(event) {
    console.log("📤 [submitPaymentForm] ========== FORM SUBMISSION STARTED ==========");
    event.preventDefault();

    loadCurrentUser();

    const clientId = document.getElementById("paymentClientSelect").value;
    const amount = document.getElementById("paymentAmount").value;
    const paymentMode = document.getElementById("paymentMode").value;
    const referenceNo = document.getElementById("paymentReferenceNo").value;
    const orderId = document.getElementById("paymentOrderId").value;
    const notes = document.getElementById("paymentNotes").value;
    const bankAccountId = document.getElementById("paymentBankAccount").value;

    console.log("📋 [submitPaymentForm] Form values collected:");
    console.log(`   👤 Client ID: ${clientId}`);
    console.log(`   💰 Amount: ${amount}`);
    console.log(`   💳 Payment Mode: ${paymentMode}`);
    console.log(`   🏦 Bank Account ID: ${bankAccountId}`);
    console.log(`   🔢 Order ID: ${orderId}`);
    console.log(`   📝 Reference No: ${referenceNo}`);
    console.log(`   📝 Notes: ${notes}`);

    if (paymentMode.toLowerCase() !== 'cash' && !bankAccountId) {
        console.error("❌ [submitPaymentForm] Bank account required for non-cash payment");
        showNotification("Please select a bank account for this payment mode!", "error");
        return;
    }

    if (!clientId || !amount || !paymentMode) {
        console.error("❌ [submitPaymentForm] Required fields missing");
        showNotification("Please fill all required fields!", "error");
        return;
    }

    const formData = {
        user_id: currentUser.id,
        client_id: parseInt(clientId, 10),
        order_id: orderId ? parseInt(orderId, 10) : null,
        bank_account_id: bankAccountId ? parseInt(bankAccountId, 10) : null,
        amount: parseFloat(amount),
        payment_mode: paymentMode.toLowerCase(),
        reference_no: referenceNo || "",
        notes: notes || ""
    };

    console.log("📦 [submitPaymentForm] Form data prepared:", formData);

    return showConfirm(
        "Are you sure you want to add this payment?",
        "warning"
    ).then(confirmed => {
        if (!confirmed) {
            console.log("❌ [submitPaymentForm] User cancelled submission");
            return;
        }

        console.log("✅ [submitPaymentForm] User confirmed, sending to API...");
        const apiUrl = `${addPaymentURLphp}`;
        console.log("🌐 [submitPaymentForm] API URL:", apiUrl);

        return addItemToAPI(apiUrl, formData).then(result => {
            console.log("📥 [submitPaymentForm] API Response:", result);
            
            if (result?.error) {
                let errorMessage = result.message || "Error adding payment!";
                console.error("❌ [submitPaymentForm] API returned error:", errorMessage);
                showNotification(errorMessage, "error");
            } else if (result) {
                console.log("✅ [submitPaymentForm] Payment added successfully!");
                showNotification("Payment added successfully!", "success");
                resetPaymentForm();
                sessionStorage.removeItem("paymentClientData");
                console.log("🔄 [submitPaymentForm] Reloading payment history...");
                return loadPaymentHistoryData();
            } else {
                console.error("❌ [submitPaymentForm] Unexpected response from API");
                showNotification("Error adding payment!", "error");
            }
        }).catch(error => {
            console.error("❌ [submitPaymentForm] API call failed:", error);
            const errorMessage = error?.message || "Error adding payment! Please try again.";
            showNotification(errorMessage, "error");
        });
    }).catch(error => {
        console.error("❌ [submitPaymentForm] Confirmation dialog error:", error);
    });
}

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
console.log("🌐 [Global] Exposing functions to window object");
window.showNotification = showNotification;
window.initClientDropdown = initClientDropdown;
window.handleClientChange = handleClientChange;
window.submitPaymentForm = submitPaymentForm;
window.showConfirm = showConfirm;
window.resetPaymentForm = resetPaymentForm;
window.closePaymentForm = closePaymentForm;
window.prefilPaymentForm = prefilPaymentForm;
window.setupPaymentModeChangeHandler = setupPaymentModeChangeHandler;
window.populatePaymentClientDropdown = populatePaymentClientDropdown;
console.log("✅ [Global] All functions exposed to window");