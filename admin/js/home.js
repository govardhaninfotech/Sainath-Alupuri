// home.js
// Responsible only for Dashboard Home Page
// All logs included for debugging & flow understanding

import { staffURLphp } from "../apis/api.js";
import { userURLphp } from "../apis/api.js";

console.log("✅ home.js loaded");

// Fake APIs for now (you can replace later)
const ORDERS_URL = "http://localhost:3000/orders";
const STATUS_URL = "http://localhost:3000/status";

let allOrders = [];
let allUsers = [];

// Init Home
export async function initHomePage() {
    console.log("📌 Initializing Home Dashboard...");

    await Promise.all([
        fetchOrders(),
        fetchUsers()
    ]);

    renderHomeStats();
}

// ===============================
// FETCH FUNCTIONS
// ===============================

async function fetchOrders() {
    console.log("📡 Fetching orders from:", ORDERS_URL);

    try {
        const res = await fetch(ORDERS_URL);
        const data = await res.json();

        console.log("✅ Orders fetched:", data);

        allOrders = Array.isArray(data) ? data : [];
    } catch (err) {
        console.error("❌ Failed to load orders:", err);
        allOrders = [];
    }
}

async function fetchUsers() {
    console.log("📡 Fetching users/staff from:", staffURLphp);

    try {
        const res = await fetch(staffURLphp);
        const data = await res.json();

        console.log("✅ Staff API response:", data);

        if (Array.isArray(data)) {
            allUsers = data;
        } else if (Array.isArray(data.data)) {
            allUsers = data.data;
        } else {
            allUsers = [];
        }
    } catch (error) {
        console.error("❌ Failed to load staff/users:", error);
        allUsers = [];
    }
}

// ===============================
// RENDER HOME DATA
// ===============================

function renderHomeStats() {

    const totalOrders = allOrders.length;
    const delivered = allOrders.filter(o => o.status === "delivered").length;
    const pending = allOrders.filter(o => o.status === "pending").length;
    const sameDay = allOrders.filter(o => o.delivery_type === "same_day").length;
    const nextDay = allOrders.filter(o => o.delivery_type === "next_day").length;

    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => u.status === "active").length;
    const inactiveUsers = allUsers.filter(u => u.status === "inactive").length;

    const totalAmountReceived = allOrders
        .filter(o => o.status === "delivered")
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const dueAmount = allOrders
        .filter(o => o.status === "pending")
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    // Performance metrics
    const deliveryRate = totalOrders > 0 ? ((delivered / totalOrders) * 100).toFixed(1) : 0;
    const sameDayPercent = totalOrders > 0 ? ((sameDay / totalOrders) * 100).toFixed(1) : 0;

    console.log("📊 Dashboard Stats Calculated");

    // Update quick stat tiles
    document.getElementById("totalOrdersValue").textContent = totalOrders;
    document.getElementById("deliveredValue").textContent = delivered;
    document.getElementById("pendingValue").textContent = pending;
    document.getElementById("activeUsersValue").textContent = activeUsers;

    // Orders stats grid
    document.getElementById("homeOrdersStats").innerHTML = `
        <div class="home-card blue">
            <div class="card-header">📦 Total Orders</div>
            <div class="card-value">${totalOrders}</div>
            <div class="card-footer">All-time orders</div>
        </div>
        <div class="home-card green">
            <div class="card-header">✅ Delivered</div>
            <div class="card-value">${delivered}</div>
            <div class="card-footer">${deliveryRate}% success rate</div>
        </div>
        <div class="home-card orange">
            <div class="card-header">⏳ Pending</div>
            <div class="card-value">${pending}</div>
            <div class="card-footer">Awaiting action</div>
        </div>
        <div class="home-card purple">
            <div class="card-header">🚀 Same Day</div>
            <div class="card-value">${sameDay}</div>
            <div class="card-footer">${sameDayPercent}% of orders</div>
        </div>
        <div class="home-card teal">
            <div class="card-header">📅 Next Day</div>
            <div class="card-value">${nextDay}</div>
            <div class="card-footer">Scheduled delivery</div>
        </div>
    `;

    // Finance stats grid
    document.getElementById("homeFinanceStats").innerHTML = `
        <div class="home-card green">
            <div class="card-header">💚 Received</div>
            <div class="card-value">₹${totalAmountReceived.toLocaleString('en-IN')}</div>
            <div class="card-footer">Completed transactions</div>
        </div>
        <div class="home-card red">
            <div class="card-header">❌ Due</div>
            <div class="card-value">₹${dueAmount.toLocaleString('en-IN')}</div>
            <div class="card-footer">Outstanding payments</div>
        </div>
        <div class="home-card blue">
            <div class="card-header">💰 Total Revenue</div>
            <div class="card-value">₹${(totalAmountReceived + dueAmount).toLocaleString('en-IN')}</div>
            <div class="card-footer">All orders combined</div>
        </div>
    `;

    // Users stats grid
    document.getElementById("homeUsersStats").innerHTML = `
        <div class="home-card green">
            <div class="card-header">✅ Active Users</div>
            <div class="card-value">${activeUsers}</div>
            <div class="card-footer">Currently online</div>
        </div>
        <div class="home-card gray">
            <div class="card-header">⏸ Inactive Users</div>
            <div class="card-value">${inactiveUsers}</div>
            <div class="card-footer">Offline members</div>
        </div>
        <div class="home-card blue">
            <div class="card-header">👥 Total Users</div>
            <div class="card-value">${totalUsers}</div>
            <div class="card-footer">All team members</div>
        </div>
    `;

    // Metrics stats grid
    const processed = delivered;
    const processingRate = totalOrders > 0 ? ((processed / totalOrders) * 100).toFixed(1) : 0;

    document.getElementById("homeMetricsStats").innerHTML = `
        <div class="home-card blue">
            <div class="card-header">📈 Delivery Rate</div>
            <div class="card-value">${deliveryRate}%</div>
            <div class="card-footer">${delivered} of ${totalOrders} orders</div>
        </div>
        <div class="home-card purple">
            <div class="card-header">⚡ Same Day Rate</div>
            <div class="card-value">${sameDayPercent}%</div>
            <div class="card-footer">Fast delivery orders</div>
        </div>
        <div class="home-card teal">
            <div class="card-header">⏱ Processing Rate</div>
            <div class="card-value">${processingRate}%</div>
            <div class="card-footer">Orders handled</div>
        </div>
        <div class="home-card green">
            <div class="card-header">📊 Avg Order Value</div>
            <div class="card-value">₹${totalOrders > 0 ? ((totalAmountReceived + dueAmount) / totalOrders).toFixed(0) : 0}</div>
            <div class="card-footer">Per order average</div>
        </div>
    `;
}

// ===============================
// HTML Generator
// ===============================

export function renderHomePage() {
    console.log("🧱 Rendering Home HTML");

    return `
        <div class="home-wrapper">
            
            <!-- Welcome Header -->
            <div class="home-header">
                <h1 class="home-welcome">Welcome to Sainath Dashboard</h1>
                <p class="home-subtitle">Manage your business efficiently with real-time insights</p>
            </div>

            <!-- Quick Stats Overview -->
            <div class="home-quick-stats">
                <div class="home-stat-tile primary">
                    <div class="stat-icon">📋</div>
                    <div class="stat-content">
                        <p class="stat-label">Total Orders</p>
                        <h3 class="stat-value" id="totalOrdersValue">0</h3>
                        <p class="stat-meta">All-time orders</p>
                    </div>
                </div>
                
                <div class="home-stat-tile success">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <p class="stat-label">Delivered</p>
                        <h3 class="stat-value" id="deliveredValue">0</h3>
                        <p class="stat-meta">Completed orders</p>
                    </div>
                </div>

                <div class="home-stat-tile warning">
                    <div class="stat-icon">⏳</div>
                    <div class="stat-content">
                        <p class="stat-label">Pending</p>
                        <h3 class="stat-value" id="pendingValue">0</h3>
                        <p class="stat-meta">Awaiting action</p>
                    </div>
                </div>

                <div class="home-stat-tile info">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <p class="stat-label">Active Users</p>
                        <h3 class="stat-value" id="activeUsersValue">0</h3>
                        <p class="stat-meta">Online members</p>
                    </div>
                </div>
            </div>

            <!-- Orders Section -->
            <div class="home-section">
                <div class="section-header">
                    <h2>📊 Orders Overview</h2>
                    <p>Real-time order statistics and breakdown</p>
                </div>
                <div id="homeOrdersStats" class="home-grid"></div>
            </div>

            <!-- Financial Section -->
            <div class="home-section">
                <div class="section-header">
                    <h2>💰 Financial Summary</h2>
                    <p>Revenue and outstanding payments</p>
                </div>
                <div id="homeFinanceStats" class="home-grid"></div>
            </div>

            <!-- Users Section -->
            <div class="home-section">
                <div class="section-header">
                    <h2>👨‍💼 Team Status</h2>
                    <p>User and department activity</p>
                </div>
                <div id="homeUsersStats" class="home-grid"></div>
            </div>

            <!-- Performance Metrics -->
            <div class="home-section">
                <div class="section-header">
                    <h2>📈 Performance Metrics</h2>
                    <p>Delivery performance and efficiency</p>
                </div>
                <div id="homeMetricsStats" class="home-grid"></div>
            </div>

        </div>
    `;
}
