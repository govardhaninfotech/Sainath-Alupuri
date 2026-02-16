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
    try {
        currentUser =
            JSON.parse(sessionStorage.getItem("rememberedUser")) ||
            JSON.parse(localStorage.getItem("rememberedUser"));
    } catch (e) {
        currentUser = null;
    }

    if (!currentUser || !currentUser.id) {
        showNotification("User not logged in!", "error");
        return Promise.reject("Missing user_id");
    }
}

// ============================================
// LOAD PAYMENT HISTORY DATA FROM API
// ============================================
function loadPaymentHistoryData() {
    loadCurrentUser();

    if (month === 0 || year === 0) {
        let today = new Date();
        month = today.getMonth() + 1;
        year = today.getFullYear();
    }
    month = currentDate ? parseInt(currentDate.split("-")[1], 10) : month;
    year = currentDate ? parseInt(currentDate.split("-")[0], 10) : year;

    const url = `${paymentHistoryURLphp}?user_id=${currentUser.id}&client_id=${client_id}&page=${currentItemsPage}&per_page=${itemsPerPage}`;
    console.log(url);

    return getItemsData(url).then(data => {
        console.log(data);

        itemsData = data || [];
        itemsTotal = data.total ?? itemsData.length;
        itemsPerPage = data.per_page ?? itemsPerPage;
        itemsTotalPages = data.total_pages ?? Math.max(1, Math.ceil(itemsTotal / itemsPerPage));
        currentItemsPage = data.page ?? currentItemsPage;
    });
}

// ============================================
// LOAD DROPDOWN DATA (CLIENTS & BANK ACCOUNTS)
// ============================================
function loadClientsData() {
    const url = `${userURLphp}`;
    return getItemsData(url).then(data => {
        console.log("Users API Response:", data);

        // ✅ FIX: Handle the actual API structure with users array
        // if (data?.users && Array.isArray(data.users)) {
        //     // Filter only clients from users array
        //     clientsList = data.users.filter(user => user.role === 'client');
        // } else if (data?.clients && Array.isArray(data.clients)) {
        //     clientsList = data.clients;
        // } else if (Array.isArray(data)) {
        //     // If data is directly an array, filter for clients
        //     clientsList = data.filter(user => user.role === 'client');
        // } else {
        //     clientsList = [];
        //     clientsList = [];
        // }
        clientsList = data?.users || [];
        console.log(clientsList);

        console.log("Filtered clients:", clientsList.length);
    }).catch(err => {
        console.error("Error loading clients:", err);
        clientsList = [];
    });
}

function loadBankAccountsData() {
    const url = `${bankURLphp}?user_id=${currentUser.id}`;
    return getItemsData(url).then(data => {
        console.log("Bank Accounts API Response:", data);

        // Handle different API response structures
        if (data?.accounts && Array.isArray(data.accounts)) {
            bankAccounts = data.accounts;
        } else if (data?.bank_accounts && Array.isArray(data.bank_accounts)) {
            bankAccounts = data.bank_accounts;
        } else if (Array.isArray(data)) {
            bankAccounts = data;
        } else {
            bankAccounts = [];
        }

        console.log("Bank accounts loaded:", bankAccounts.length);
    }).catch(err => {
        console.error("Error loading bank accounts:", err);
        bankAccounts = [];
    });
}

// Helper: Filter bank accounts by payment mode
function getAccountsByPaymentMode(paymentMode) {
    if (!paymentMode) return bankAccounts;

    const mode = paymentMode.toLowerCase();

    if (mode === 'cash') {
        return [];
    } else if (mode === 'upi') {
        return bankAccounts.filter(acc =>
            acc.type?.toLowerCase() === 'upi' ||
            acc.account_type?.toLowerCase() === 'upi' ||
            acc.name?.toLowerCase().includes('upi') ||
            acc.account_name?.toLowerCase().includes('upi')
        );
    } else if (mode === 'bank') {
        return bankAccounts.filter(acc =>
            acc.type?.toLowerCase() === 'bank' ||
            acc.account_type?.toLowerCase() === 'bank' ||
            (!acc.type && acc.account_number)
        );
    }

    return bankAccounts;
}

function populatePaymentClientDropdown(selectedClientId = "") {
    loadClientsData();
    console.log("Populating client dropdown with", clientsList, "clients");
    const select = document.getElementById("paymentClientSelect");
    if (!select) {
        console.error("Client select element not found");
        return;
    }

    console.log("Populating client dropdown with", clientsList.length, "clients");

    select.innerHTML = `<option value="">Select Client</option>`;

    if (clientsList.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No clients available";
        opt.disabled = true;
        select.appendChild(opt);
        console.warn("No clients to populate");
        return;
    }

    clientsList.forEach((client) => {
        console.log("Processing client for dropdown:", client);
        const opt = document.createElement("option");
        opt.value = client.id;
        const clientName = client.name;
        const shopCode = client.shop_code;
        opt.textContent = `${clientName}${shopCode ? ' - ' + shopCode : ''}`;
        select.appendChild(opt);
    });

    if (selectedClientId) {
        select.value = String(selectedClientId);
    }

    console.log("Client dropdown populated with", select.options.length - 1, "clients");
}

// Populate Bank Account dropdown based on payment mode
function populatePaymentBankAccountDropdown(selectedBankId = "", paymentMode = "") {
    const select = document.getElementById("paymentBankAccount");
    if (!select) {
        console.error("Bank account select element not found");
        return;
    }

    if (paymentMode.toLowerCase() === 'cash') {
        select.disabled = true;
        select.innerHTML = `<option value="">Not applicable for Cash</option>`;
        select.value = "";
        select.removeAttribute('required');
        return;
    }

    select.disabled = false;
    select.setAttribute('required', 'required');

    const filteredAccounts = paymentMode ? getAccountsByPaymentMode(paymentMode) : bankAccounts;

    console.log(`Populating payment bank account dropdown with ${filteredAccounts.length} accounts for mode: ${paymentMode}`);

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

    console.log("Payment bank dropdown populated with", select.options.length - 1, "accounts");
}

// Setup payment mode change handler
function setupPaymentModeChangeHandler() {
    const paymentModeSelect = document.getElementById("paymentMode");
    if (!paymentModeSelect) return;

    // Save current value before cloning
    const currentValue = paymentModeSelect.value;

    // Remove existing listeners by cloning
    const newSelect = paymentModeSelect.cloneNode(true);
    paymentModeSelect.parentNode.replaceChild(newSelect, paymentModeSelect);

    // Restore the value
    newSelect.value = currentValue;

    newSelect.addEventListener("change", function () {
        const selectedMode = this.value;
        console.log("Payment mode changed to:", selectedMode);
        populatePaymentBankAccountDropdown("", selectedMode);
    });
}

// ✅ REMOVE loadFomedData() - it's redundant and causes timing issues
// DELETE THIS FUNCTION ENTIRELY

export function initClientDropdown() {
    console.log("Initializing payment page");

    // Load prefilled data flag
    try {
        prefilledData = JSON.parse(sessionStorage.getItem("paymentClientData"));
        if (prefilledData) {
            client_id = prefilledData.client_id;
        }
    } catch (e) {
        prefilledData = null;
    }

    const clientSelect = document.getElementById("invClientSelect");
    if (!clientSelect) return;

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

    // ✅ Load all data first, THEN populate and prefill
    return Promise.all([
        loadPaymentHistoryData(),
        loadClientsData(),
        loadBankAccountsData()
    ]).then(() => {
        console.log("All data loaded, populating form...");
        populatePaymentFormDropdowns();
        prefilPaymentForm(); // This handles all prefilling
    }).catch(error => {
        console.error("Error loading data:", error);
        showNotification("Error loading form data", "error");
    });
}

export function handleClientChange(event) {
    currentDate = event.target.value;
    currentItemsPage = 1;
    return loadPaymentHistoryData();
}

function populatePaymentFormDropdowns() {
    // Populate clients dropdown
    populatePaymentClientDropdown();

    // Set default payment mode to cash
    const paymentModeSelect = document.getElementById("paymentMode");
    if (paymentModeSelect) {
        paymentModeSelect.value = "cash";
        // This will disable bank account field
        populatePaymentBankAccountDropdown("", "cash");
    }

    // Setup payment mode change handler (must be after setting default value)
    setupPaymentModeChangeHandler();
}

function prefilPaymentForm() {
    // Try to get data from sessionStorage
    let dataToFill = null;
    try {
        dataToFill = JSON.parse(sessionStorage.getItem("paymentClientData"));
    } catch (e) {
        dataToFill = null;
    }

    if (!dataToFill) return;

    console.log("Pre-filling payment form with data:", dataToFill);

    // Pre-fill client select
    const clientSelect = document.getElementById("paymentClientSelect");
    if (clientSelect && dataToFill.client_id) {
        clientSelect.value = String(dataToFill.client_id);
    }

    // Pre-fill payment mode FIRST (before bank account)
    const paymentModeSelect = document.getElementById("paymentMode");
    if (paymentModeSelect) {
        const mode = dataToFill.payment_mode || "cash";
        paymentModeSelect.value = mode;

        // Populate bank accounts for that mode
        populatePaymentBankAccountDropdown("", mode);

        // Then set the bank account value (with slight delay to ensure dropdown is populated)
        if (dataToFill.bank_account_id && mode !== 'cash') {
            setTimeout(() => {
                const bankSelect = document.getElementById("paymentBankAccount");
                if (bankSelect) {
                    bankSelect.value = String(dataToFill.bank_account_id);
                }
            }, 0);
        }
    }

    // Pre-fill amount
    const amountInput = document.getElementById("paymentAmount");
    if (amountInput && dataToFill.amount) {
        amountInput.value = dataToFill.amount;
    }

    // Pre-fill order ID
    const orderInput = document.getElementById("paymentOrderId");
    if (orderInput && dataToFill.order_id) {
        orderInput.value = dataToFill.order_id;
    }

    console.log("Payment form pre-filled successfully");
}

export function initPaymentHistoryCard() {
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
                        <label for="paymentClientSelect">Client <span class="required">*</span></label>
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
    prefilledData = null;
    sessionStorage.removeItem("paymentClientData");
    document.getElementById("paymentForm").reset();

    // Reset to defaults
    const paymentModeSelect = document.getElementById("paymentMode");
    if (paymentModeSelect) {
        paymentModeSelect.value = "cash";
        populatePaymentBankAccountDropdown("", "cash");
    }
}

function closePaymentForm() {
    document.getElementById("paymentFormModal1").style.display = "none";
}

function submitPaymentForm(event) {
    event.preventDefault();

    loadCurrentUser();

    const clientId = document.getElementById("paymentClientSelect").value;
    const amount = document.getElementById("paymentAmount").value;
    const paymentMode = document.getElementById("paymentMode").value;
    const referenceNo = document.getElementById("paymentReferenceNo").value;
    const orderId = document.getElementById("paymentOrderId").value;
    const notes = document.getElementById("paymentNotes").value;
    const bankAccountId = document.getElementById("paymentBankAccount").value;

    if (paymentMode.toLowerCase() !== 'cash' && !bankAccountId) {
        showNotification("Please select a bank account for this payment mode!", "error");
        return;
    }

    if (!clientId || !amount || !paymentMode) {
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

    return showConfirm(
        "Are you sure you want to add this payment?",
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        return addItemToAPI(`${addPaymentURLphp}?user_id=${currentUser.id}`, formData).then(result => {
            if (result?.error) {
                let errorMessage = result.message || "Error adding payment!";
                showNotification(errorMessage, "error");
            } else if (result) {
                showNotification("Payment added successfully!", "success");
                resetPaymentForm();
                sessionStorage.removeItem("paymentClientData");
                return loadPaymentHistoryData();
            } else {
                showNotification("Error adding payment!", "error");
            }
        }).catch(error => {
            console.error("Add payment error:", error);
            const errorMessage = error?.message || "Error adding payment! Please try again.";
            showNotification(errorMessage, "error");
        });
    });
}

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
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