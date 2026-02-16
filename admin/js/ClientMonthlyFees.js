// ============================================
// CLIENT MONTHLY REPORTS WITH API INTEGRATION
// ============================================

import { getItemsData, addItemToAPI, updateItem } from "../apis/master_api.js";
import { showNotification, showConfirm } from "./notification.js";

// API URL
const monthlyChargesURL = "https://gisurat.com/govardhan/sainath_aloopuri/api/monthly_charges.php";
const userURLphp = "https://gisurat.com/govardhan/sainath_aloopuri/api/users.php";
const bankURLphp = "https://gisurat.com/govardhan/sainath_aloopuri/api/bank_accounts.php";

// Data Storage
let clientsData = [];
let allClientsFromAPI = [];
let bankAccounts = [];
let currentUser = null;
let selectedClient = null;
let selectedMonth = null;
let selectedYear = null;

// DOM Elements
let feesTableBody;
let paymentModalElement;
let editModalElement;
let paymentFormElement;
let editFormElement;
let dateFilter;

// ============================================
// USER MANAGEMENT
// ============================================
function loadCurrentUser() {
    console.log("🔍 [loadCurrentUser] Loading current user...");
    
    try {
        currentUser =
            JSON.parse(sessionStorage.getItem("rememberedUser")) ||
            JSON.parse(localStorage.getItem("rememberedUser"));
        
        console.log("✅ [loadCurrentUser] User loaded:", currentUser);
    } catch (e) {
        console.error("❌ [loadCurrentUser] Error parsing user data:", e);
        currentUser = null;
    }

    if (!currentUser || !currentUser.id) {
        console.error("❌ [loadCurrentUser] User not logged in");
        showNotification("User not logged in!", "error");
        return false;
    }
    
    console.log("✅ [loadCurrentUser] Current user ID:", currentUser.id);
    return true;
}

// ============================================
// API DATA LOADING
// ============================================

// Load all clients from API
async function loadAllClients() {
    console.log("👥 [loadAllClients] Loading all clients from API...");
    
    try {
        const url = `${userURLphp}`;
        console.log("🌐 [loadAllClients] API URL:", url);
        
        const data = await getItemsData(url);
        console.log("📥 [loadAllClients] Raw API Response:", data);
        
        if (data?.users && Array.isArray(data.users)) {
            allClientsFromAPI = data.users;
            console.log("✅ [loadAllClients] Extracted from data.users");
        } else if (Array.isArray(data)) {
            allClientsFromAPI = data;
            console.log("✅ [loadAllClients] Using data directly");
        } else {
            allClientsFromAPI = [];
            console.warn("⚠️ [loadAllClients] Unexpected response structure");
        }
        
        console.log(`✅ [loadAllClients] Loaded ${allClientsFromAPI.length} clients`);
        return allClientsFromAPI;
    } catch (error) {
        console.error("❌ [loadAllClients] Error:", error);
        showNotification("Error loading clients", "error");
        return [];
    }
}

// Load bank accounts
async function loadBankAccounts() {
    console.log("🏦 [loadBankAccounts] Loading bank accounts...");
    
    try {
        const url = `${bankURLphp}?user_id=${currentUser.id}`;
        console.log("🌐 [loadBankAccounts] API URL:", url);
        
        const data = await getItemsData(url);
        console.log("📥 [loadBankAccounts] Raw API Response:", data);
        
        if (data?.accounts && Array.isArray(data.accounts)) {
            bankAccounts = data.accounts;
        } else if (data?.bank_accounts && Array.isArray(data.bank_accounts)) {
            bankAccounts = data.bank_accounts;
        } else if (Array.isArray(data)) {
            bankAccounts = data;
        } else {
            bankAccounts = [];
        }
        
        console.log(`✅ [loadBankAccounts] Loaded ${bankAccounts.length} accounts`);
        return bankAccounts;
    } catch (error) {
        console.error("❌ [loadBankAccounts] Error:", error);
        return [];
    }
}

// Load monthly charges data
async function loadMonthlyChargesData(month, year) {
    console.log(`📊 [loadMonthlyChargesData] Loading data for ${month}/${year}...`);
    
    if (!loadCurrentUser()) return;
    
    try {
        const url = `${monthlyChargesURL}?user_id=${currentUser.id}&month=${month}&year=${year}`;
        console.log("🌐 [loadMonthlyChargesData] API URL:", url);
        
        const data = await getItemsData(url);
        console.log("📥 [loadMonthlyChargesData] Raw API Response:", data);
        
        if (data?.charges && Array.isArray(data.charges)) {
            clientsData = data.charges;
            console.log("✅ [loadMonthlyChargesData] Extracted from data.charges");
        } else if (Array.isArray(data)) {
            clientsData = data;
            console.log("✅ [loadMonthlyChargesData] Using data directly");
        } else {
            clientsData = [];
            console.warn("⚠️ [loadMonthlyChargesData] No data found");
        }
        
        console.log(`✅ [loadMonthlyChargesData] Loaded ${clientsData.length} records`);
        
        // Log first record to see structure
        if (clientsData.length > 0) {
            console.log("📋 [loadMonthlyChargesData] Sample record structure:", clientsData[0]);
            console.log("📋 [loadMonthlyChargesData] Available date fields:");
            console.log(`   - date: ${clientsData[0].date}`);
            console.log(`   - created_at: ${clientsData[0].created_at}`);
            console.log(`   - payment_date: ${clientsData[0].payment_date}`);
            console.log(`   - due_date: ${clientsData[0].due_date}`);
        }
        
        await renderTable();
    } catch (error) {
        console.error("❌ [loadMonthlyChargesData] Error:", error);
        showNotification("Error loading monthly charges", "error");
        clientsData = [];
        await renderTable();
    }
}

// ============================================
// RENDER PAGE
// ============================================
export function renderClientMonthlyFeesPage() {
    console.log("🎨 [renderClientMonthlyFeesPage] Loading page HTML...");
    
    return fetch("Client_Monthly_Fees.html")
        .then(res => res.text())
        .then(html => {
            console.log("✅ [renderClientMonthlyFeesPage] HTML loaded");
            return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        })
        .catch(err => {
            console.error("❌ [renderClientMonthlyFeesPage] Error loading HTML:", err);
            return `<div class="content-card"><p>Error loading Client Monthly Fees page.</p></div>`;
        });
}

// ============================================
// INITIALIZE PAGE
// ============================================
export async function initClientMonthlyFeesPage() {
    console.log("🚀 [initClientMonthlyFeesPage] ========== INITIALIZING PAGE ==========");
    
    // Load current user
    if (!loadCurrentUser()) return;
    
    // Get DOM elements
    feesTableBody = document.getElementById('feesTableBody');
    paymentModalElement = document.getElementById('paymentModal');
    editModalElement = document.getElementById('editModal');
    paymentFormElement = document.getElementById('paymentForm');
    editFormElement = document.getElementById('editForm');
    dateFilter = document.getElementById('dateFilter');

    if (!dateFilter || !feesTableBody) {
        console.error("❌ [initClientMonthlyFeesPage] Required DOM elements not found");
        return;
    }

    console.log("✅ [initClientMonthlyFeesPage] DOM elements found");
    
    // Debug modal elements
    if (paymentModalElement) {
        console.log("🔍 [Modal Debug] Payment Modal:");
        console.log("   Element:", paymentModalElement);
        console.log("   Initial display:", window.getComputedStyle(paymentModalElement).display);
        console.log("   Initial z-index:", window.getComputedStyle(paymentModalElement).zIndex);
        console.log("   Initial position:", window.getComputedStyle(paymentModalElement).position);
    }
    
    if (editModalElement) {
        console.log("🔍 [Modal Debug] Edit Modal:");
        console.log("   Element:", editModalElement);
        console.log("   Initial display:", window.getComputedStyle(editModalElement).display);
        console.log("   Initial z-index:", window.getComputedStyle(editModalElement).zIndex);
        console.log("   Initial position:", window.getComputedStyle(editModalElement).position);
    }

    // Load all clients and bank accounts
    await loadAllClients();
    await loadBankAccounts();
    
    // Initialize date filter
    initializeDateFilter();
    
    // Setup modal event listeners
    setupModalEventListeners();
    
    // Populate bank account dropdown
    populateBankAccountDropdown();
    
    // Load initial data
    await loadMonthlyChargesData(selectedMonth, selectedYear);
    
    console.log("✅ [initClientMonthlyFeesPage] ========== INITIALIZATION COMPLETE ==========");
}

// ============================================
// DATE FILTER
// ============================================
function initializeDateFilter() {
    console.log("📅 [initializeDateFilter] Setting up date filter...");
    
    const today = new Date();
    selectedYear = today.getFullYear();
    selectedMonth = String(today.getMonth() + 1).padStart(2, '0');

    dateFilter.value = `${selectedYear}-${selectedMonth}`;
    console.log(`📅 [initializeDateFilter] Default date: ${dateFilter.value}`);
    
    dateFilter.addEventListener('change', filterByMonth);
    console.log("✅ [initializeDateFilter] Event listener attached");
}

// ============================================
// RENDER TABLE
// ============================================
async function renderTable() {
    console.log("📋 [renderTable] Rendering table...");
    console.log(`📋 [renderTable] Records to render: ${clientsData.length}`);
    
    feesTableBody.innerHTML = '';

    if (clientsData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 30px; color: #666;">
                No records found for the selected month
            </td>
        `;
        feesTableBody.appendChild(row);
        console.log("ℹ️ [renderTable] No data to display");
        return;
    }

    clientsData.forEach((client, index) => {
        console.log(`➕ [renderTable] Rendering row ${index + 1}:`, client);
        
        const row = document.createElement('tr');
        
        const clientName = client.client_name || client.name || 'Unknown';
        const amount = client.amount || 0;
        
        // Extract date with multiple fallbacks
        const date = client.date || client.created_at || client.payment_date || client.due_date || null;
        console.log(`   📅 Date field raw value: "${date}" (type: ${typeof date})`);
        
        const paymentId = client.payment_id || client.id || null;
        const paymentMode = client.payment_mode || 'cash';
        const bankAccountId = client.bank_account_id || '';
        const referenceNo = client.reference_no || '';
        const notes = client.notes || '';
        
        const formattedDate = formatDate(date);
        console.log(`   📅 Formatted date: "${formattedDate}"`);
        
        const formattedAmount = formatCurrency(amount);
        
        // Determine if edit button should be enabled
        const hasPaymentId = paymentId && paymentId !== null;
        const editButtonClass = hasPaymentId ? 'btn btn-edit btn-icon' : 'btn btn-edit btn-icon btn-disabled';
        const editButtonDisabled = hasPaymentId ? '' : 'disabled';
        const editIcon = hasPaymentId ? '✏️' : '🔒';
        
        console.log(`   Payment ID: ${paymentId}, Has Payment: ${hasPaymentId}`);
        console.log(`   Payment Mode: ${paymentMode}, Bank: ${bankAccountId}`);

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${clientName}</td>
            <td>${formattedAmount}</td>
            <td>${formattedDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-pay btn-icon" 
                            data-client-id="${client.client_id || client.id}"
                            data-client-name="${clientName}"
                            data-amount="${amount}"
                            data-payment-id="${paymentId || ''}"
                            title="Add Payment">
                        💳
                    </button>
                    <button class="${editButtonClass}" 
                            data-payment-id="${paymentId || ''}"
                            data-client-name="${clientName}"
                            data-amount="${amount}"
                            data-payment-mode="${paymentMode}"
                            data-bank-account-id="${bankAccountId}"
                            data-reference-no="${referenceNo}"
                            data-notes="${notes}"
                            title="${hasPaymentId ? 'Edit Payment' : 'Payment not made yet'}"
                            ${editButtonDisabled}>
                        ${editIcon}
                    </button>
                </div>
            </td>
        `;

        feesTableBody.appendChild(row);
    });
    
    // Attach event listeners to buttons
    attachTableButtonListeners();
    
    console.log(`✅ [renderTable] Table rendered with ${clientsData.length} rows`);
}

// Attach event listeners to table buttons
function attachTableButtonListeners() {
    console.log("🔗 [attachTableButtonListeners] Attaching button listeners...");
    
    // Pay buttons
    const payButtons = feesTableBody.querySelectorAll('.btn-pay');
    payButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const clientId = this.dataset.clientId;
            const clientName = this.dataset.clientName;
            const amount = this.dataset.amount;
            const paymentId = this.dataset.paymentId;
            
            console.log("🔔 [PayButton Click] Client ID:", clientId, "Payment ID:", paymentId);
            openPaymentModal(clientId, clientName, amount, paymentId);
        });
    });
    
    // Edit buttons
    const editButtons = feesTableBody.querySelectorAll('.btn-edit:not(.btn-disabled)');
    editButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const dataset = this.dataset;
            console.log("🔔 [EditButton Click] Payment ID:", dataset.paymentId);
            console.log("🔔 [EditButton Click] Full dataset:", dataset);
            
            if (dataset.paymentId && dataset.paymentId !== 'null' && dataset.paymentId !== '') {
                openEditModal({
                    payment_id: dataset.paymentId,
                    client_name: dataset.clientName,
                    amount: dataset.amount,
                    payment_mode: dataset.paymentMode || 'cash', // Default to cash if not set
                    bank_account_id: dataset.bankAccountId,
                    reference_no: dataset.referenceNo,
                    notes: dataset.notes
                });
            } else {
                console.warn("⚠️ [EditButton Click] No valid payment ID");
            }
        });
    });
    
    console.log(`✅ [attachTableButtonListeners] Attached ${payButtons.length} pay and ${editButtons.length} edit listeners`);
}

// ============================================
// FORMATTING FUNCTIONS
// ============================================
function formatDate(dateString) {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
        return '-';
    }
    
    try {
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn("⚠️ [formatDate] Invalid date:", dateString);
            return '-';
        }
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        console.error("❌ [formatDate] Error formatting date:", e);
        return '-';
    }
}

function formatCurrency(amount) {
    try {
        const numAmount = parseFloat(amount) || 0;
        return '₹' + numAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } catch (e) {
        console.error("❌ [formatCurrency] Error formatting currency:", e);
        return '₹0.00';
    }
}

// ============================================
// BANK ACCOUNT DROPDOWN
// ============================================
function populateBankAccountDropdown() {
    console.log("🏦 [populateBankAccountDropdown] Populating bank dropdown...");
    
    const bankSelect = document.getElementById('bankSelection');
    const editBankSelect = document.getElementById('editBankSelection');
    
    if (!bankSelect || !editBankSelect) {
        console.error("❌ [populateBankAccountDropdown] Bank select elements not found");
        return;
    }
    
    const defaultOption = '<option value="">Select Bank Account</option>';
    
    if (bankAccounts.length === 0) {
        bankSelect.innerHTML = defaultOption + '<option value="" disabled>No bank accounts available</option>';
        editBankSelect.innerHTML = defaultOption + '<option value="" disabled>No bank accounts available</option>';
        console.warn("⚠️ [populateBankAccountDropdown] No bank accounts available");
        return;
    }
    
    let optionsHtml = defaultOption;
    bankAccounts.forEach(bank => {
        const bankName = bank.bank_name || bank.account_name || bank.name || 'Account';
        const accountNumber = bank.account_number || bank.acc_number || '';
        const bankId = bank.id || bank.account_id;
        
        optionsHtml += `<option value="${bankId}">${bankName}${accountNumber ? ' - ' + accountNumber : ''}</option>`;
    });
    
    bankSelect.innerHTML = optionsHtml;
    editBankSelect.innerHTML = optionsHtml;
    
    console.log(`✅ [populateBankAccountDropdown] Populated with ${bankAccounts.length} accounts`);
}

// Filter accounts by payment mode
function filterBankAccountsByMode(paymentMode, selectElementId) {
    console.log(`🔍 [filterBankAccountsByMode] Filtering for mode: ${paymentMode}`);
    
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) return;
    
    if (paymentMode === 'cash') {
        selectElement.disabled = true;
        selectElement.value = '';
        selectElement.removeAttribute('required');
        console.log("💵 [filterBankAccountsByMode] Cash mode - disabled bank selection");
        return;
    }
    
    selectElement.disabled = false;
    selectElement.setAttribute('required', 'required');
    
    const defaultOption = '<option value="">Select Bank Account</option>';
    let filteredAccounts = bankAccounts;
    
    if (paymentMode === 'upi') {
        filteredAccounts = bankAccounts.filter(acc =>
            acc.type?.toLowerCase() === 'upi' ||
            acc.account_type?.toLowerCase() === 'upi' ||
            acc.name?.toLowerCase().includes('upi')
        );
    } else if (paymentMode === 'bank' || paymentMode === 'bank_transfer') {
        filteredAccounts = bankAccounts.filter(acc =>
            acc.type?.toLowerCase() === 'bank' ||
            acc.account_type?.toLowerCase() === 'bank' ||
            (!acc.type && acc.account_number)
        );
    }
    
    console.log(`📋 [filterBankAccountsByMode] Filtered ${filteredAccounts.length} accounts`);
    
    let optionsHtml = defaultOption;
    filteredAccounts.forEach(bank => {
        const bankName = bank.bank_name || bank.account_name || bank.name || 'Account';
        const accountNumber = bank.account_number || bank.acc_number || '';
        const bankId = bank.id || bank.account_id;
        
        optionsHtml += `<option value="${bankId}">${bankName}${accountNumber ? ' - ' + accountNumber : ''}</option>`;
    });
    
    selectElement.innerHTML = optionsHtml;
}

// ============================================
// PAYMENT MODAL
// ============================================
function openPaymentModal(clientId, clientName, amount, paymentId) {
    console.log("💳 [openPaymentModal] Opening payment modal...");
    console.log(`   Client ID: ${clientId}, Name: ${clientName}, Amount: ${amount}, Payment ID: ${paymentId}`);
    
    selectedClient = {
        client_id: clientId,
        client_name: clientName,
        amount: amount,
        payment_id: paymentId
    };
    
    // Reset form
    paymentFormElement.reset();
    
    // Pre-fill form
    document.getElementById('clientName').value = clientName;
    document.getElementById('amount').value = amount;
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('paymentMode').value = 'cash';
    
    // Handle bank account dropdown
    filterBankAccountsByMode('cash', 'bankSelection');
    
    // Show modal with both methods to ensure visibility
    paymentModalElement.style.display = 'block';
    paymentModalElement.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    console.log("✅ [openPaymentModal] Modal opened");
    console.log("   Modal display:", paymentModalElement.style.display);
    console.log("   Modal classList:", paymentModalElement.classList.toString());
    
    // Debug visibility after a short delay to let CSS apply
    setTimeout(() => {
        const computed = window.getComputedStyle(paymentModalElement);
        console.log("🔍 [Modal Visibility Check]");
        console.log("   Computed display:", computed.display);
        console.log("   Computed visibility:", computed.visibility);
        console.log("   Computed z-index:", computed.zIndex);
        console.log("   Computed position:", computed.position);
        
        if (computed.display === 'none' || computed.visibility === 'hidden') {
            console.error("❌ MODAL IS HIDDEN! Running full debug...");
            if (typeof window.debugModalVisibility === 'function') {
                window.debugModalVisibility(paymentModalElement, 'PAYMENT MODAL');
            }
        }
    }, 100);
}

// ============================================
// EDIT MODAL
// ============================================
function openEditModal(paymentData) {
    console.log("✏️ [openEditModal] Opening edit modal...");
    console.log("   Payment data received:", paymentData);
    
    if (!paymentData.payment_id) {
        console.error("❌ [openEditModal] No payment ID provided");
        showNotification("Cannot edit: No payment ID", "error");
        return;
    }
    
    selectedClient = paymentData;
    
    // Reset form
    editFormElement.reset();
    
    // Pre-fill form with detailed logging
    console.log("📝 [openEditModal] Pre-filling form fields:");
    
    document.getElementById('editPaymentId').value = paymentData.payment_id;
    console.log(`   ✓ Payment ID: ${paymentData.payment_id}`);
    
    document.getElementById('editClientName').value = paymentData.client_name;
    console.log(`   ✓ Client Name: ${paymentData.client_name}`);
    
    document.getElementById('editAmount').value = paymentData.amount;
    console.log(`   ✓ Amount: ${paymentData.amount}`);
    
    const paymentMode = paymentData.payment_mode || 'cash';
    document.getElementById('editPaymentMode').value = paymentMode;
    console.log(`   ✓ Payment Mode: ${paymentMode}`);
    
    document.getElementById('editReferenceNo').value = paymentData.reference_no || '';
    console.log(`   ✓ Reference No: ${paymentData.reference_no || '(empty)'}`);
    
    document.getElementById('editNotes').value = paymentData.notes || '';
    console.log(`   ✓ Notes: ${paymentData.notes || '(empty)'}`);
    
    // Handle bank account dropdown
    console.log("🏦 [openEditModal] Filtering bank accounts for mode:", paymentMode);
    filterBankAccountsByMode(paymentMode, 'editBankSelection');
    
    // Set bank account after filtering
    if (paymentData.bank_account_id && paymentMode !== 'cash') {
        console.log(`🏦 [openEditModal] Setting bank account: ${paymentData.bank_account_id}`);
        setTimeout(() => {
            const bankSelect = document.getElementById('editBankSelection');
            bankSelect.value = paymentData.bank_account_id;
            console.log(`   ✓ Bank account set to: ${bankSelect.value}`);
            
            // Verify it was set correctly
            if (bankSelect.value !== paymentData.bank_account_id) {
                console.warn(`   ⚠️ Bank account value mismatch! Expected: ${paymentData.bank_account_id}, Got: ${bankSelect.value}`);
            }
        }, 0);
    } else {
        console.log(`🏦 [openEditModal] No bank account to set (cash mode or no ID)`);
    }
    
    // Show modal with both methods to ensure visibility
    editModalElement.style.display = 'block';
    editModalElement.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    console.log("✅ [openEditModal] Modal opened");
    console.log("   Modal display:", editModalElement.style.display);
    console.log("   Modal classList:", editModalElement.classList.toString());
}

// ============================================
// CLOSE MODAL
// ============================================
function closeModal(modal) {
    console.log("❌ [closeModal] Closing modal");
    
    // Hide modal with both methods
    modal.style.display = 'none';
    modal.classList.remove('show');
    
    // Restore body scrolling
    document.body.style.overflow = '';
    
    console.log("✅ [closeModal] Modal closed");
    console.log("   Modal display:", modal.style.display);
    console.log("   Modal classList:", modal.classList.toString());
}

// ============================================
// SETUP MODAL EVENT LISTENERS
// ============================================
function setupModalEventListeners() {
    console.log("⚙️ [setupModalEventListeners] Setting up modal event listeners...");
    
    // Payment modal close buttons
    const paymentCloseBtn = paymentModalElement.querySelector('.close');
    const cancelBtn = document.getElementById('cancelBtn');

    paymentCloseBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal(paymentModalElement);
    };
    
    cancelBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal(paymentModalElement);
    };

    // Edit modal close buttons
    const editCloseBtn = editModalElement.querySelector('.close');
    const editCancelBtn = document.getElementById('editCancelBtn');

    editCloseBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal(editModalElement);
    };
    
    editCancelBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal(editModalElement);
    };

    // Close modal when clicking outside
    window.onclick = function (event) {
        if (event.target === paymentModalElement) {
            closeModal(paymentModalElement);
        }
        if (event.target === editModalElement) {
            closeModal(editModalElement);
        }
    };

    // Payment form submission
    paymentFormElement.onsubmit = handlePaymentSubmit;

    // Edit form submission
    editFormElement.onsubmit = handleEditSubmit;
    
    // Payment mode change listeners
    const paymentModeSelect = document.getElementById('paymentMode');
    if (paymentModeSelect) {
        paymentModeSelect.addEventListener('change', function(e) {
            e.preventDefault();
            e.stopPropagation();
            filterBankAccountsByMode(this.value, 'bankSelection');
        });
    }
    
    const editPaymentModeSelect = document.getElementById('editPaymentMode');
    if (editPaymentModeSelect) {
        editPaymentModeSelect.addEventListener('change', function(e) {
            e.preventDefault();
            e.stopPropagation();
            filterBankAccountsByMode(this.value, 'editBankSelection');
        });
    }
    
    console.log("✅ [setupModalEventListeners] All event listeners attached");
}

// ============================================
// HANDLE PAYMENT FORM SUBMISSION
// ============================================
async function handlePaymentSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("📤 [handlePaymentSubmit] ========== PAYMENT SUBMISSION ==========");
    
    const clientName = document.getElementById('clientName').value;
    const date = document.getElementById('paymentDate').value;
    const amount = document.getElementById('amount').value;
    const paymentMode = document.getElementById('paymentMode').value;
    const bankSelection = document.getElementById('bankSelection').value;
    const referenceNo = document.getElementById('paymentReferenceNo')?.value || '';
    const notes = document.getElementById('paymentNotes')?.value || '';
    
    console.log("📋 [handlePaymentSubmit] Form data:");
    console.log(`   Client: ${clientName}`);
    console.log(`   Amount: ${amount}`);
    console.log(`   Payment Mode: ${paymentMode}`);
    console.log(`   Bank Account: ${bankSelection}`);
    console.log(`   Reference: ${referenceNo}`);
    
    // Validation
    if (paymentMode !== 'cash' && !bankSelection) {
        console.error("❌ [handlePaymentSubmit] Bank account required for non-cash payment");
        showNotification("Please select a bank account for this payment mode!", "error");
        return;
    }
    
    const formData = {
        user_id: currentUser.id,
        client_id: parseInt(selectedClient.client_id, 10),
        month: selectedMonth,
        year: selectedYear,
        amount: parseFloat(amount),
        payment_mode: paymentMode.toLowerCase(),
        reference_no: referenceNo,
        notes: notes
    };
    
    // Add bank account ID only if not cash
    if (paymentMode !== 'cash' && bankSelection) {
        formData.bank_account_id = parseInt(bankSelection, 10);
    }
    
    console.log("📦 [handlePaymentSubmit] Payload:", formData);
    
    try {
        const confirmed = await showConfirm(
            `Add payment of ${formatCurrency(amount)} for ${clientName}?`,
            "warning"
        );
        
        if (!confirmed) {
            console.log("❌ [handlePaymentSubmit] User cancelled");
            return;
        }
        
        console.log("🌐 [handlePaymentSubmit] Sending POST request...");
        const result = await addItemToAPI(monthlyChargesURL, formData);
        
        console.log("📥 [handlePaymentSubmit] API Response:", result);
        
        if (result?.error) {
            console.error("❌ [handlePaymentSubmit] API error:", result.message);
            showNotification(result.message || "Error adding payment!", "error");
        } else if (result) {
            console.log("✅ [handlePaymentSubmit] Payment added successfully");
            showNotification("Payment added successfully!", "success");
            closeModal(paymentModalElement);
            paymentFormElement.reset();
            await loadMonthlyChargesData(selectedMonth, selectedYear);
        } else {
            console.error("❌ [handlePaymentSubmit] Unexpected response");
            showNotification("Error adding payment!", "error");
        }
    } catch (error) {
        console.error("❌ [handlePaymentSubmit] Error:", error);
        showNotification(error?.message || "Error adding payment!", "error");
    }
}

// ============================================
// HANDLE EDIT FORM SUBMISSION
// ============================================
async function handleEditSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("📤 [handleEditSubmit] ========== EDIT SUBMISSION ==========");
    
    const paymentId = document.getElementById('editPaymentId').value;
    const amount = document.getElementById('editAmount').value;
    const paymentMode = document.getElementById('editPaymentMode').value;
    const bankSelection = document.getElementById('editBankSelection').value;
    const referenceNo = document.getElementById('editReferenceNo')?.value || '';
    const notes = document.getElementById('editNotes')?.value || '';
    
    console.log("📋 [handleEditSubmit] Form data:");
    console.log(`   Payment ID: ${paymentId}`);
    console.log(`   Amount: ${amount}`);
    console.log(`   Payment Mode: ${paymentMode}`);
    console.log(`   Bank Account: ${bankSelection}`);
    
    if (!paymentId) {
        console.error("❌ [handleEditSubmit] No payment ID");
        showNotification("Cannot update: No payment ID", "error");
        return;
    }
    
    // Validation
    if (paymentMode !== 'cash' && !bankSelection) {
        console.error("❌ [handleEditSubmit] Bank account required");
        showNotification("Please select a bank account for this payment mode!", "error");
        return;
    }
    
    const formData = {
        user_id: currentUser.id,
        payment_id: parseInt(paymentId, 10),
        amount: parseFloat(amount),
        payment_mode: paymentMode.toLowerCase(),
        reference_no: referenceNo,
        notes: notes
    };
    
    // Add bank account ID only if not cash
    if (paymentMode !== 'cash' && bankSelection) {
        formData.bank_account_id = parseInt(bankSelection, 10);
    }
    
    console.log("📦 [handleEditSubmit] Payload:", formData);
    
    try {
        const confirmed = await showConfirm(
            "Update payment details?",
            "warning"
        );
        
        if (!confirmed) {
            console.log("❌ [handleEditSubmit] User cancelled");
            return;
        }
        
        console.log("🌐 [handleEditSubmit] Sending PUT request...");
        
        // Use fetch directly with PUT method since your API expects PUT, not PATCH
        const response = await fetch(monthlyChargesURL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log("📥 [handleEditSubmit] Response status:", response.status);
        
        let result;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            result = await response.json();
        } else {
            const text = await response.text();
            console.log("📥 [handleEditSubmit] Response text:", text);
            result = { message: text };
        }
        
        console.log("📥 [handleEditSubmit] API Response:", result);
        
        if (!response.ok) {
            console.error("❌ [handleEditSubmit] API error:", result);
            const errorMessage = result?.message || result?.error || "Error updating payment!";
            showNotification(errorMessage, "error");
            return;
        }
        
        if (result?.error) {
            console.error("❌ [handleEditSubmit] API error:", result.message);
            showNotification(result.message || "Error updating payment!", "error");
        } else if (result) {
            console.log("✅ [handleEditSubmit] Payment updated successfully");
            showNotification("Payment updated successfully!", "success");
            closeModal(editModalElement);
            editFormElement.reset();
            await loadMonthlyChargesData(selectedMonth, selectedYear);
        } else {
            console.error("❌ [handleEditSubmit] Unexpected response");
            showNotification("Error updating payment!", "error");
        }
    } catch (error) {
        console.error("❌ [handleEditSubmit] Error:", error);
        showNotification(error?.message || "Error updating payment!", "error");
    }
}

// ============================================
// FILTER BY MONTH
// ============================================
async function filterByMonth() {
    console.log("📅 [filterByMonth] Date filter changed");
    
    const selectedDate = dateFilter.value;
    console.log(`📅 [filterByMonth] Selected date: ${selectedDate}`);
    
    if (!selectedDate) {
        console.warn("⚠️ [filterByMonth] No date selected");
        return;
    }

    const [year, month] = selectedDate.split('-');
    selectedYear = year;
    selectedMonth = month;
    
    console.log(`📅 [filterByMonth] Month: ${selectedMonth}, Year: ${selectedYear}`);
    
    await loadMonthlyChargesData(selectedMonth, selectedYear);
}

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================
console.log("🌐 [Global] Exposing functions to window object");
window.renderClientMonthlyFeesPage = renderClientMonthlyFeesPage;
window.initClientMonthlyFeesPage = initClientMonthlyFeesPage;
console.log("✅ [Global] Functions exposed");