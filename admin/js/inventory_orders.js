// inventory_orders.js
// Inventory -> Orders page logic
// Uses: real PHP client + PHP orders + order_items API
import { userURLphp, ordersURLphp, orderItemsURLphp } from "../apis/api.js";


console.log("✅ inventory_orders.js loaded");

// ===============================
// API ENDPOINTS
// ===============================

// REAL client API from your PHP backend
const CLIENT_API_URL = userURLphp;        // users.php
const ORDERS_API_URL = ordersURLphp;      // orders.php
const ORDER_ITEMS_API_URL = orderItemsURLphp; // order_items.php


// Fake orders + order_items from json-server
// for future use

// ===============================
// STATE
// ===============================
let ordAllClients = [];
let ordAllOrders = [];

// ===============================
// INIT
// ===============================
export async function initInventoryOrdersPage() {
    console.log("📄 Orders page init");
    initFilters();
    await fetchClientsAndOrders();
}

// Set default date = today
function initFilters() {
    const dateInput = document.getElementById("ordDateFilter");
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.value = today;
        console.log("📅 Default orders date:", today);
        dateInput.addEventListener("change", applyOrderFilters);
    }

    const clientSelect = document.getElementById("ordClientFilter");
    if (clientSelect) {
        clientSelect.addEventListener("change", applyOrderFilters);
    }
}

// ===============================
// FETCH DATA
// ===============================
async function fetchClientsAndOrders() {
    console.log("📡 Loading clients + orders...");

    await Promise.all([fetchClients(), fetchOrders()]);

    applyOrderFilters();
}

async function fetchClients() {
    console.log("📡 Fetching clients from:", CLIENT_API_URL);

    try {
        const res = await fetch(CLIENT_API_URL);
        const data = await res.json();

        console.log("✅ Client API response:", data);

        // Adjust this based on your real client.php output
        if (Array.isArray(data)) {
            ordAllClients = data;
        } else if (Array.isArray(data.clients)) {
            ordAllClients = data.clients;
        } else if (Array.isArray(data.data)) {
            ordAllClients = data.data;
        } else {
            console.warn("⚠️ Unknown client response format");
            ordAllClients = [];
        }

        populateClientFilter();
    } catch (error) {
        console.error("❌ Error loading clients:", error);
        ordAllClients = [];
    }
}

function populateClientFilter() {
    const clientSelect = document.getElementById("ordClientFilter");
    if (!clientSelect) return;

    // Keep "All Clients"
    clientSelect.innerHTML = `<option value="all">All Clients</option>`;

    ordAllClients.forEach((c) => {
        if ((c.role || "").toLowerCase() !== "client") return;

        const opt = document.createElement("option");
        opt.value = c.id;                 // use ID for filter
        opt.textContent = c.name;         // show name
        clientSelect.appendChild(opt);
    });

    console.log("👥 Client filter populated with", ordAllClients.length, "records");
}

async function fetchOrders() {
    console.log("📡 Fetching orders from:", ORDERS_API_URL);

    try {
        const res = await fetch(ORDERS_API_URL);
        const data = await res.json();

        console.log("✅ Orders API response:", data);

        if (Array.isArray(data)) {
            ordAllOrders = data;
        } else if (Array.isArray(data.orders)) {
            ordAllOrders = data.orders;
        } else if (Array.isArray(data.data)) {
            ordAllOrders = data.data;
        } else {
            console.warn("⚠️ Orders API did not return an array");
            ordAllOrders = [];
        }
    } catch (error) {
        console.error("❌ Error loading orders:", error);
        ordAllOrders = [];
    }
}

// ===============================
// FILTER & RENDER
// ===============================
function applyOrderFilters() {
    const dateInput = document.getElementById("ordDateFilter");
    const clientSelect = document.getElementById("ordClientFilter");

    const selectedDate = dateInput ? dateInput.value : "";
    const selectedClientId = clientSelect ? clientSelect.value : "all";

    console.log("🔎 Applying filters -> date:", selectedDate, " client:", selectedClientId);

    let filtered = ordAllOrders;

    if (selectedDate) {
        filtered = filtered.filter((o) => o.date === selectedDate);
    }

    if (selectedClientId !== "all") {
        filtered = filtered.filter(
            (o) => String(o.client_id) === String(selectedClientId)
        );
    }

    renderOrdersTable(filtered);
}

export async function renderInventoryOrdersPage() {
    return `
        <div class="inv-wrapper">
            <!-- Page Header -->
            <div class="inv-page-header">
                <div class="inv-page-title">
                    <h1>Orders</h1>
                    <p class="inv-subtitle">View and filter all client orders</p>
                </div>
            </div>

            <!-- Filters: Date + Client -->
            <div class="inv-filters-section inv-orders-filters">
                <div class="inv-filter-group">
                    <label for="ordDateFilter">Date</label>
                    <input type="date" id="ordDateFilter">
                </div>

                <div class="inv-filter-group">
                    <label for="ordClientFilter">Client</label>
                    <select id="ordClientFilter">
                        <option value="all">All Clients</option>
                    </select>
                </div>
            </div>

            <!-- Orders Table -->
            <div class="inv-orders-table-card">
                <div class="inv-table-header">
                    <h2>Orders List</h2>
                    <p>Filtered by selected date and client</p>
                </div>

                <div class="inv-table-wrapper">
                    <table class="inv-data-table inv-orders-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Client</th>
                                <th>Delivery</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="ordTableBody">
                            <!-- JS will render rows here -->
                        </tbody>
                    </table>

                    <div id="ordEmptyState" class="inv-empty-state">
                        <div class="inv-empty-icon">📦</div>
                        <h3>No Orders Found</h3>
                        <p>Try changing the date or client filter</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function renderOrdersTable(orders) {
    const tbody = document.getElementById("ordTableBody");
    const emptyState = document.getElementById("ordEmptyState");

    if (!tbody || !emptyState) return;

    tbody.innerHTML = "";

    if (!orders.length) {
        emptyState.classList.add("show");
        return;
    } else {
        emptyState.classList.remove("show");
    }

    orders.forEach((order, index) => {
        const tr = document.createElement("tr");

        // order no: 1..n for current filtered list
        const orderNo = index + 1;

        // client name lookup
        const client = ordAllClients.find(
            (c) => String(c.id) === String(order.client_id)
        );
        const clientName = client ? client.name : `#${order.client_id}`;

        const deliveryLabel =
            order.delivery_type === "same_day"
                ? "Same Day"
                : order.delivery_type === "next_day"
                    ? "Next Day"
                    : order.delivery_type || "-";

        const amount = Number(order.total_amount || 0).toFixed(2);

        const statusBadgeHtml = getStatusBadge(order.status);

        tr.innerHTML = `
            <td>${orderNo}</td>
            <td>${clientName}</td>
            <td>${deliveryLabel}</td>
            <td>₹${amount}</td>
            <td>${statusBadgeHtml}</td>
        `;

        tbody.appendChild(tr);
    });

    console.log("📋 Rendered", orders.length, "orders in table");
}

function getStatusBadge(statusRaw = "") {
    const status = statusRaw.toLowerCase();

    if (status === "pending") {
        return `<span class="inv-status-badge inv-status-pending">⏳ Pending</span>`;
    }
    if (status === "delivered") {
        return `<span class="inv-status-badge inv-status-delivered">✅ Delivered</span>`;
    }
    if (status === "accepted") {
        return `<span class="inv-status-badge inv-status-accepted">👍 Accepted</span>`;
    }
    if (status === "processing") {
        return `<span class="inv-status-badge inv-status-processing">⚙️ Processing</span>`;
    }
    if (status === "cancelled") {
        return `<span class="inv-status-badge inv-status-cancelled">❌ Cancelled</span>`;
    }

    return `<span class="inv-status-badge">${statusRaw || "-"}</span>`;
}
