// ============================================
// NOTIFICATIONS PAGE - SEND & MANAGE NOTIFICATIONS
// ============================================

import { notificationsURLphp } from "../apis/api.js";
import { getItemsData } from "../apis/master_api.js";
import { showNotification } from "./notification.js";

// Notifications data storage
let notificationsData = [];
let notificationId = 0;
const STORAGE_KEY = "sainath_notifications";

// ✅ FIX FLAG (PREVENT AUTO RE-RENDER)
let isNotificationModalOpen = false;
let isViewNotificationModalOpen = false;

// ============================================
// LOAD NOTIFICATIONS FROM API
// ============================================
async function loadNotificationsFromAPI() {
    try {
        console.log("📡 Fetching notifications from API:", notificationsURLphp);
        const data = await getItemsData(notificationsURLphp);
        console.log("✅ API Data received:", data);

        if (Array.isArray(data)) {
            return data;
        } else if (data && data.notifications) {
            return data.notifications;
        } else if (data && data.data) {
            return data.data;
        }
        return [];
    } catch (error) {
        console.error("❌ Error loading from API:", error);
        return [];
    }
}

// ============================================
// SAVE NOTIFICATIONS TO LOCALSTORAGE
// ============================================
function saveNotificationsToStorage() {
    try {
        const dataToStore = {
            notifications: notificationsData,
            nextId: notificationId,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
        console.log("✅ Notifications saved to storage");
    } catch (error) {
        console.error("Error saving notifications to storage:", error);
    }
}

// ============================================
// RENDER NOTIFICATIONS PAGE
// ============================================
export async function renderNotificationsPage() {

    // ✅ DO NOT re-render if any modal is open
    if (isNotificationModalOpen || isViewNotificationModalOpen) return;

    // Load from API first
    const apiData = await loadNotificationsFromAPI();
    notificationsData = apiData || [];

    const mainContent = document.getElementById("mainContent");
    mainContent.innerHTML = generateNotificationsHTML();

    initNotificationsEventListeners();
    refreshNotificationsTable();
}

// ============================================
// GENERATE NOTIFICATIONS PAGE HTML
// ============================================
function generateNotificationsHTML() {
    return `
        <div class="notification-container">

            <div class="notification-header">
                <h1>📬 Notifications</h1>
                <p>Send and manage notifications to users</p>
            </div>

            <div id="successMessage" class="success-message">
                ✓ Notification sent successfully!
            </div>

            <div class="notification-actions">
                <button class="btn-add-notification" onclick="openNotificationForm()">
                    + Add Notification
                </button>
            </div>

            <!-- Modal -->
            <div id="notificationModal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Send Notification</h2>
                        <button type="button" class="modal-close" onclick="closeNotificationForm()">✕</button>
                    </div>

                    <form id="notificationForm">
                        <div class="form-group">
                            <label>Title *</label>
                            <input type="text" id="notificationTitle" required>
                        </div>

                        <div class="form-group">
                            <label>Description *</label>
                            <textarea id="notificationDescription" required></textarea>
                        </div>

                        <div class="form-group">
                            <label>Recipient *</label>
                            <input type="text" id="notificationRecipient" required>
                        </div>

                        <div class="modal-buttons">
                            <button type="button" class="btn-reset" onclick="resetNotificationForm()">Reset</button>
                            <button type="button" class="btn-send" onclick="sendNotification()">Send</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Table -->
            <div class="table-container">
                <table id="notificationsTable">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Title</th>
                            <th>Message</th>
                            <th>Created Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="notificationsTableBody"></tbody>
                </table>
            </div>

            <!-- View Notification Modal -->
            <div id="viewNotificationModal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>View Notification</h2>
                        <button type="button" class="modal-close" onclick="closeViewNotification()">✕</button>
                    </div>
                    <div class="view-content">
                        <div class="form-group">
                            <label>Title</label>
                            <div id="viewTitle" class="view-field"></div>
                        </div>
                        <div class="form-group">
                            <label>Message</label>
                            <div id="viewBody" class="view-field"></div>
                        </div>
                        <div class="form-group">
                            <label>Created Date</label>
                            <div id="viewDate" class="view-field"></div>
                        </div>
                        <div class="modal-buttons">
                            <button type="button" class="btn-reset" onclick="closeViewNotification()">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// INITIALIZE EVENTS
// ============================================
function initNotificationsEventListeners() {

    window.openNotificationForm = openNotificationForm;
    window.closeNotificationForm = closeNotificationForm;
    window.sendNotification = sendNotification;
    window.resetNotificationForm = resetNotificationForm;
    window.viewNotification = viewNotification;
    window.closeViewNotification = closeViewNotification;

    // ✅ ESC Key Handler
    document.addEventListener('keydown', handleEscapeKey);

    // Send Notification Modal - Click Outside to Close
    const modal = document.getElementById("notificationModal");
    if (modal) {
        modal.addEventListener("click", function (event) {
            if (event.target === modal) {
                closeNotificationForm();
            }
        });
    }

    // View Notification Modal - Click Outside to Close
    const viewModal = document.getElementById("viewNotificationModal");
    if (viewModal) {
        viewModal.addEventListener("click", function (event) {
            if (event.target === viewModal) {
                closeViewNotification();
            }
        });
    }
}

// ============================================
// ESC KEY HANDLER
// ============================================
function handleEscapeKey(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
        if (isNotificationModalOpen) {
            closeNotificationForm();
        }
        if (isViewNotificationModalOpen) {
            closeViewNotification();
        }
    }
}

// ============================================
// OPEN MODAL
// ============================================
function openNotificationForm() {
    console.log("🔓 Opening notification form...");
    const modal = document.getElementById("notificationModal");
    if (modal) {
        modal.classList.add("active");
        isNotificationModalOpen = true;
        document.body.style.overflow = 'hidden'; // Prevent background scroll
        console.log("✅ Modal opened, isNotificationModalOpen =", isNotificationModalOpen);
    }
}

// ============================================
// CLOSE MODAL
// ============================================
function closeNotificationForm() {
    console.log("🔒 Closing notification form...");
    const modal = document.getElementById("notificationModal");
    if (modal) {
        modal.classList.remove("active");
        isNotificationModalOpen = false;
        document.body.style.overflow = ''; // Restore scroll
        console.log("✅ Modal closed, isNotificationModalOpen =", isNotificationModalOpen);
    }
    const form = document.getElementById("notificationForm");
    if (form) form.reset();
}

// ============================================
// RESET FORM
// ============================================
function resetNotificationForm() {
    document.getElementById("notificationForm").reset();
}

// ============================================
// SEND NOTIFICATION
// ============================================
function sendNotification() {

    const title = document.getElementById("notificationTitle").value.trim();
    const description = document.getElementById("notificationDescription").value.trim();
    const recipient = document.getElementById("notificationRecipient").value.trim();

    if (!title || !description || !recipient) {
        showNotification("Please fill all fields", "warning");
        return;
    }

    const notification = {
        id: ++notificationId,
        title,
        description,
        recipient,
        dateTime: new Date().toLocaleString(),
        timestamp: new Date().toISOString()
    };

    notificationsData.push(notification);
    saveNotificationsToStorage();
    closeNotificationForm();
    refreshNotificationsTable();

    showNotification(`Notification sent to ${recipient}`, "success");
}

// ============================================
// REFRESH TABLE
// ============================================
function refreshNotificationsTable() {

    const tableBody = document.getElementById("notificationsTableBody");
    if (!tableBody) return;

    if (!notificationsData || notificationsData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">
                    No notifications available
                </td>
            </tr>
        `;
        return;
    }

    let html = "";

    notificationsData.forEach((n, index) => {
        const title = n.title || "N/A";
        const body = n.body || n.description || "N/A";
        const createdDate = n.created_date || n.dateTime || "N/A";

        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${title}</strong></td>
                <td>${body.substring(0, 50)}${body.length > 50 ? "..." : ""}</td>
                <td>${createdDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="viewNotification(${n.id})" title="View">
                            👁️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}


// ============================================
// VIEW NOTIFICATION
// ============================================
function viewNotification(id) {
    console.log("👁️ Viewing notification ID:", id);
    const notification = notificationsData.find(n => n.id === id);
    
    if (!notification) {
        showNotification("Notification not found", "error");
        return;
    }

    // Populate the view modal
    const title = notification.title || "N/A";
    const body = notification.body || notification.description || "N/A";
    const createdDate = notification.created_date || notification.dateTime || "N/A";

    document.getElementById("viewTitle").textContent = title;
    document.getElementById("viewBody").textContent = body;
    document.getElementById("viewDate").textContent = createdDate;

    // Open the view modal
    const modal = document.getElementById("viewNotificationModal");
    if (modal) {
        modal.classList.add("active");
        isViewNotificationModalOpen = true;
        document.body.style.overflow = 'hidden'; // Prevent background scroll
        console.log("✅ View modal opened, isViewNotificationModalOpen =", isViewNotificationModalOpen);
    }
}

// ============================================
// CLOSE VIEW NOTIFICATION
// ============================================
function closeViewNotification() {
    console.log("🔒 Closing view notification");
    const modal = document.getElementById("viewNotificationModal");
    if (modal) {
        modal.classList.remove("active");
        isViewNotificationModalOpen = false;
        document.body.style.overflow = ''; // Restore scroll
        console.log("✅ View modal closed, isViewNotificationModalOpen =", isViewNotificationModalOpen);
    }
}