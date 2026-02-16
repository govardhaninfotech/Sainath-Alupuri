// Static client data
let clientsData = [
    {
        id: 1,
        clientName: "Rajesh Kumar",
        amount: 15000,
        date: "2026-02-10",
        status: "pending"
    },
    {
        id: 2,
        clientName: "Priya Sharma",
        amount: 22500,
        date: "2026-02-08",
        status: "pending"
    },
    {
        id: 3,
        clientName: "Amit Patel",
        amount: 18750,
        date: "2026-02-05",
        status: "paid"
    },
    {
        id: 4,
        clientName: "Sneha Desai",
        amount: 20000,
        date: "2026-02-12",
        status: "pending"
    }
];

// DOM Elements
let feesTableBody;
let paymentModal;
let editModal;
let paymentForm;
let editForm;
let dateFilter;

// Current selected client for payment
let selectedClient = null;

export function renderClientMonthlyFeesPage() {
    return fetch("Client_Monthly_Fees.html")
        .then(res => res.text())
        .then(html => {
            return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        })
        .catch(err => {
            console.error(
                "ClientMonthlyFees.js: Error loading Client_Monthly_Fees.html:",
                err
            );
            return `<div class="content-card"><p>Error loading Client Monthly Fees page.</p></div>`;
        });
}

export function initClientMonthlyFeesPage() {
    feesTableBody = document.getElementById('feesTableBody');
    paymentModal  = document.getElementById('paymentModal');
    editModal     = document.getElementById('editModal');
    paymentForm   = document.getElementById('paymentForm');
    editForm      = document.getElementById('editForm');
    dateFilter    = document.getElementById('dateFilter');

    if (!dateFilter || !feesTableBody) {
        console.error("Client Monthly Fees DOM not loaded");
        return;
    }

    initializeDateFilter();
    renderTable();
    setupModalEventListeners();
}


// Initialize date filter with current month
function initializeDateFilter() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    dateFilter.value = `${year}-${month}`;
    dateFilter.addEventListener('change', filterByMonth);
}
// Render the table with client data
function renderTable() {
    feesTableBody.innerHTML = '';

    clientsData.forEach((client, index) => {
        const row = document.createElement('tr');

        const formattedDate = formatDate(client.date);
        const formattedAmount = formatCurrency(client.amount);

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${client.clientName}</td>
            <td>${formattedAmount}</td>
            <td>${formattedDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-pay" onclick="openPaymentModal(${client.id})">Pay</button>
                    <button class="btn btn-edit" onclick="openEditModal(${client.id})">Edit</button>
                </div>
            </td>
        `;

        feesTableBody.appendChild(row);
    });
}

// Format date to DD/MM/YYYY
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Format currency
function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN');
}

// Open payment modal
function openPaymentModal(clientId, event) {
    if (event) event.stopPropagation(); // 🛑 STOP HERE

    selectedClient = clientsData.find(client => client.id === clientId);
    if (!selectedClient) return;

    document.getElementById('clientName').value = selectedClient.clientName;
    document.getElementById('amount').value = selectedClient.amount;

    document.getElementById('paymentDate').value =
        new Date().toISOString().split('T')[0];

    document.getElementById('paymentMode').value = '';
    document.getElementById('bankSelection').value = '';

    paymentModal.style.display = 'block';
}


// Open edit modal
function openEditModal(clientId) {
    const client = clientsData.find(c => c.id === clientId);

    if (client) {
        document.getElementById('editClientId').value = client.id;
        document.getElementById('editClientName').value = client.clientName;
        document.getElementById('editAmount').value = client.amount;
        document.getElementById('editDate').value = client.date;

        editModal.style.display = 'block';
    }
}

// Close modals
function closeModal(modal) {
    modal.style.display = 'none';
}

// Setup modal event listeners
function setupModalEventListeners() {
    // Payment modal close buttons
    const paymentCloseBtn = paymentModal.querySelector('.close');
    const cancelBtn = document.getElementById('cancelBtn');

    paymentCloseBtn.onclick = () => closeModal(paymentModal);
    cancelBtn.onclick = () => closeModal(paymentModal);

    // Edit modal close buttons
    const editCloseBtn = editModal.querySelector('.close');
    const editCancelBtn = document.getElementById('editCancelBtn');

    editCloseBtn.onclick = () => closeModal(editModal);
    editCancelBtn.onclick = () => closeModal(editModal);

    // Close modal when clicking outside
    window.onclick = function (event) {
        if (event.target == paymentModal) {
            closeModal(paymentModal);
        }
        if (event.target == editModal) {
            closeModal(editModal);
        }
    }

    // Payment form submission
    paymentForm.onsubmit = handlePaymentSubmit;

    // Edit form submission
    editForm.onsubmit = handleEditSubmit;
}

// Handle payment form submission
function handlePaymentSubmit(e) {
    e.preventDefault();

    const formData = {
        clientName: document.getElementById('clientName').value,
        date: document.getElementById('paymentDate').value,
        amount: document.getElementById('amount').value,
        paymentMode: document.getElementById('paymentMode').value,
        bankSelection: document.getElementById('bankSelection').value
    };

    console.log('Payment submitted:', formData);

    // Update client status to paid
    if (selectedClient) {
        const clientIndex = clientsData.findIndex(c => c.id === selectedClient.id);
        if (clientIndex !== -1) {
            clientsData[clientIndex].status = 'paid';
        }
    }

    // Show success message
    alert(`Payment of ${formatCurrency(formData.amount)} received from ${formData.clientName} via ${formData.paymentMode}`);

    // Close modal and refresh table
    closeModal(paymentModal);
    renderTable();

    // Reset form
    paymentForm.reset();
}

// Handle edit form submission
function handleEditSubmit(e) {
    e.preventDefault();

    const clientId = parseInt(document.getElementById('editClientId').value);
    const updatedData = {
        clientName: document.getElementById('editClientName').value,
        amount: parseFloat(document.getElementById('editAmount').value),
        date: document.getElementById('editDate').value
    };

    // Update client data
    const clientIndex = clientsData.findIndex(c => c.id === clientId);
    if (clientIndex !== -1) {
        clientsData[clientIndex] = {
            ...clientsData[clientIndex],
            ...updatedData
        };
    }

    console.log('Client updated:', updatedData);

    // Show success message
    alert(`Client details updated successfully for ${updatedData.clientName}`);

    // Close modal and refresh table
    closeModal(editModal);
    renderTable();

    // Reset form
    editForm.reset();
}

// Filter table by selected month
function filterByMonth() {
    const selectedMonth = dateFilter.value;

    if (!selectedMonth) {
        renderTable();
        return;
    }

    const [year, month] = selectedMonth.split('-');

    feesTableBody.innerHTML = '';

    const filteredClients = clientsData.filter(client => {
        const clientDate = new Date(client.date);
        const clientYear = clientDate.getFullYear();
        const clientMonth = String(clientDate.getMonth() + 1).padStart(2, '0');

        return clientYear == year && clientMonth == month;
    });

    if (filteredClients.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 30px; color: #666;">
                No records found for the selected month
            </td>
        `;
        feesTableBody.appendChild(row);
        return;
    }

    filteredClients.forEach((client, index) => {
        const row = document.createElement('tr');

        const formattedDate = formatDate(client.date);
        const formattedAmount = formatCurrency(client.amount);

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${client.clientName}</td>
            <td>${formattedAmount}</td>
            <td>${formattedDate}</td>
            <td>
                <div class="action-buttons">
                        <button class="btn btn-pay"
                                onclick="openPaymentModal(${client.id}, event)">
                            Pay
                        </button>
                        <button class="btn btn-edit" onclick="openEditModal(${client.id})">Edit</button>
                </div>
            </td>
        `;

        feesTableBody.appendChild(row);
    });
}

// Make functions globally available
window.openPaymentModal = openPaymentModal;
window.openEditModal = openEditModal;
window.renderClientMonthlyFeesPage = renderClientMonthlyFeesPage;
