// ============================================
// PAYMENT HISTORY PAGE WITH PAYMENT FORM
// ============================================

import { paymentHistoryURLphp, addPaymentURLphp } from "../../apis/api.js";
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
    // Replace with your actual clients API endpoint
    const url = `${userURLphp}?user_id=${currentUser.id}`;
    return getItemsData(url).then(data => {
        clientsList = data.clients || data || [];
    }).catch(err => {
        console.error("Error loading clients:", err);
        clientsList = [];
    });
}

function loadBankAccountsData() {
    // Replace with your actual bank accounts API endpoint
    const url = `${bankURLphp}?user_id=${currentUser.id}`;
    return getItemsData(url).then(data => {
        bankAccounts = data.accounts || data || [];
    }).catch(err => {
        console.error("Error loading bank accounts:", err);
        bankAccounts = [];
    });
}

export function loadFomedData() {
    try {
        clientPayemtInfo =
            JSON.parse(sessionStorage.getItem("paymentClientData")) || {}

        console.log(clientPayemtInfo);

        document.getElementById("paymentClientSelect").value = clientPayemtInfo.client_id;
        document.getElementById("paymentBankAccount").value = clientPayemtInfo.bank_account_id;
        document.getElementById("paymentAmount").value = clientPayemtInfo.amount;
        document.getElementById("paymentMode").value = clientPayemtInfo.payment_mode;
        document.getElementById("paymentOrderId").value = clientPayemtInfo.order_id;
    }
    catch (e) {
        // clientPayemtInfo = {};
        console.log(e);

    }
}

export function initClientDropdown() {
    console.log("enter in payment");

    loadFomedData();

    // Check if there's prefilled data from client due redirect
    try {
        prefilledData = JSON.parse(sessionStorage.getItem("paymentClientData"));
        if (prefilledData) {
            client_id = prefilledData.client_id;
            // sessionStorage.removeItem("paymentClientData");
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
    return Promise.all([
        loadPaymentHistoryData(),
        loadClientsData(),
        loadBankAccountsData()
    ]).then(() => {
        populatePaymentFormDropdowns();
        prefilPaymentForm();
    });
}

export function handleClientChange(event) {
    currentDate = event.target.value;
    currentItemsPage = 1;
    return loadPaymentHistoryData();
}

function populatePaymentFormDropdowns() {
    // Populate clients dropdown
    const clientSelect = document.getElementById("paymentClientSelect");
    if (clientSelect && clientsList.length > 0) {
        clientSelect.innerHTML = '<option value="">Select Client</option>';
        clientsList.forEach(client => {
            const option = document.createElement("option");
            option.value = client.id;
            option.textContent = `${client.name} - ${client.shop_code}`;
            clientSelect.appendChild(option);
        });
    }

    // Populate bank accounts dropdown
    const bankSelect = document.getElementById("paymentBankAccount");
    if (bankSelect && bankAccounts.length > 0) {
        bankSelect.innerHTML = '<option value="">Select Bank Account</option>';
        bankAccounts.forEach(account => {
            const option = document.createElement("option");
            option.value = account.id;
            option.textContent = `${account.bank_name} - ${account.account_number}`;
            bankSelect.appendChild(option);
        });
    }
}

function prefilPaymentForm() {
    if (!prefilledData) return;

    // Pre-fill client select
    const clientSelect = document.getElementById("paymentClientSelect");
    if (clientSelect) {
        clientSelect.value = prefilledData.client_id;
    }

    // Pre-fill amount
    const amountInput = document.getElementById("paymentAmount");
    if (amountInput) {
        amountInput.value = prefilledData.due_amount;
    }

    // Pre-fill order ID if available
    if (prefilledData.order_id) {
        const orderInput = document.getElementById("paymentOrderId");
        if (orderInput) {
            orderInput.value = prefilledData.order_id;
        }
    }

    console.log("Payment form pre-filled with client data", prefilledData);
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
                        <label for="paymentBankAccount">Bank Account <span class="required">*</span></label>
                        <select id="paymentBankAccount" required>
                            <option value="">Select Bank Account</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="paymentAmount">Amount <span class="required">*</span></label>
                        <input type="number" id="paymentAmount" required placeholder="Enter amount" min="0" step="0.01">
                    </div>

                    <div class="form-group">
                        <label for="paymentMode">Payment Mode <span class="required">*</span></label>
                        <select id="paymentMode" required>
                            <option value="">Select Payment Mode</option>
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Card">Card</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="paymentReferenceNo">Reference Number</label>
                        <input type="text" id="paymentReferenceNo" placeholder="Enter reference number">
                    </div>

                    <div class="form-group">
                        <label for="paymentOrderId">Order ID (Optional)</label>
                        <input type="number" id="paymentOrderId" placeholder="Enter order ID" min="0">
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

// ============================================
function resetPaymentForm() {
    prefilledData = null;
    document.getElementById("paymentForm").reset();
}

function closePaymentForm() {
    document.getElementById("paymentFormModal1").style.display = "none";
}

function submitPaymentForm(event) {
    event.preventDefault();

    loadCurrentUser();

    // Get form values
    const clientId = document.getElementById("paymentClientSelect").value;
    const bankAccountId = document.getElementById("paymentBankAccount").value;
    const amount = document.getElementById("paymentAmount").value;
    const paymentMode = document.getElementById("paymentMode").value;
    const referenceNo = document.getElementById("paymentReferenceNo").value;
    const orderId = document.getElementById("paymentOrderId").value;
    const notes = document.getElementById("paymentNotes").value;

    // Validate required fields
    if (!clientId || !bankAccountId || !amount || !paymentMode) {
        showNotification("Please fill all required fields!", "error");
        return;
    }

    // Prepare form data
    const formData = {
        user_id: currentUser.id,
        client_id: parseInt(clientId, 10),
        order_id: orderId ? parseInt(orderId, 10) : null,
        bank_account_id: parseInt(bankAccountId, 10),
        amount: parseFloat(amount),
        payment_mode: paymentMode,
        reference_no: referenceNo || "",
        notes: notes || ""
    };

    return showConfirm(
        "Are you sure you want to add this payment?",
        "warning"
    ).then(confirmed => {
        if (!confirmed) return;

        // Use your actual add payment API endpoint

        return addItemToAPI(`${addPaymentURLphp}?user_id=${currentUser.id}`, formData).then(result => {
            if (result?.error) {
                let errorMessage = result.message || "Error adding payment!";
                showNotification(errorMessage, "error");
            } else if (result) {
                showNotification("Payment added successfully!", "success");
                resetPaymentForm();

                // Reload payment history
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