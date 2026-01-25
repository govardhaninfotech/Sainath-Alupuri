// ============================================
// NOTIFICATIONS PAGE - SEND & MANAGE NOTIFICATIONS
// ============================================

import { notificationsURLphp } from "../apis/api.js";
import { addItemToAPI, getItemsData } from "../apis/master_api.js";
import { showNotification } from "./notification.js";

// Notifications data storage
let notificationsData = [];
let notificationId = 0;
const STORAGE_KEY = "sainath_notifications";

// ✅ FIX FLAG (PREVENT AUTO RE-RENDER)
let isNotificationModalOpen = false;


// Get logged-in user ID
function getLoggedInUserId() {
    let user =
        JSON.parse(localStorage.getItem("rememberedUser")) ||
        JSON.parse(sessionStorage.getItem("rememberedUser"));

    return user?.id || null;
}
let user_id = getLoggedInUserId();

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

    // ✅ DO NOT re-render if modal is open
    if (isNotificationModalOpen) return;

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
        <div class="notification-container_ntf">

            <div class="notification-header_ntf">
                <h1>Notifications</h1>
            </div>

            <div class="notification-actions_ntf">
                <button class="btn-add-notification_ntf" onclick="openSendNotificationForm_ntf()">
                    + Add Notification
                </button>
            </div>

            <!-- Send Notification Modal -->
            <div id="notificationModal_ntf" class="modal-overlay_ntf">
                <div class="modal-content_ntf" onclick="event.stopPropagation()">
                    <div class="modal-header_ntf">
                        <h2>Send Notification</h2>
                        <button type="button" class="modal-close_ntf" onclick="closeSendNotificationForm_ntf()">✕</button>
                    </div>

                    <form id="sendNotificationForm_ntf" onclick="event.stopPropagation()">
                        <div class="form-group_ntf">
                            <label>Title *</label>
                            <input type="text" id="notificationTitle_ntf" required>
                        </div>

                        <div class="form-group_ntf">
                            <label>Description *</label>
                            <textarea id="notificationDescription_ntf" required></textarea>
                        </div>
                        
                        <div class="modal-buttons_ntf">
                            <button type="button" class="btn-reset_ntf" onclick="resetSendNotificationForm_ntf()">Reset</button>
                            <button type="button" class="btn-send_ntf" onclick="sendNotification_ntf()">Send</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Table -->
            <div class="table-container_ntf">
                <table id="notificationsTable_ntf">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Title</th>
                            <th>Message</th>
                            <th>Created Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="notificationsTableBody_ntf"></tbody>
                </table>
            </div>

            <!-- View Notification Modal -->
            <div id="viewNotificationModal_ntf" class="modal-overlay_ntf">
                <div class="modal-content_ntf" onclick="event.stopPropagation()">
                    <div class="modal-header_ntf">
                        <h2>View Notification</h2>
                        <button type="button" class="modal-close_ntf" onclick="closeViewNotification_ntf()">✕</button>
                    </div>
                    <div class="view-content_ntf">
                        <div class="form-group_ntf">
                            <label>Title</label>
                            <div id="viewTitle_ntf" class="view-field_ntf"></div>
                        </div>
                        <div class="form-group_ntf">
                            <label>Message</label>
                            <div id="viewBody_ntf" class="view-field_ntf"></div>
                        </div>
                        <div class="form-group_ntf">
                            <label>Created Date</label>
                            <div id="viewDate_ntf" class="view-field_ntf"></div>
                        </div>
                        <div class="modal-buttons_ntf">
                            <button type="button" class="btn-reset_ntf" onclick="closeViewNotification_ntf()">Close</button>
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

    window.openSendNotificationForm_ntf = openSendNotificationForm_ntf;
    window.closeSendNotificationForm_ntf = closeSendNotificationForm_ntf;
    window.sendNotification_ntf = sendNotification_ntf;
    window.resetSendNotificationForm_ntf = resetSendNotificationForm_ntf;
    window.viewNotification_ntf = viewNotification_ntf;
    window.closeViewNotification_ntf = closeViewNotification_ntf;

    // Send Notification Modal - Click outside to close
    const modal = document.getElementById("notificationModal_ntf");
    if (modal) {
        modal.addEventListener("click", function (event) {
            if (event.target === modal) {
                closeSendNotificationForm_ntf();
            }
        });
    }

    // View Notification Modal - Click outside to close
    const viewModal = document.getElementById("viewNotificationModal_ntf");
    if (viewModal) {
        viewModal.addEventListener("click", function (event) {
            if (event.target === viewModal) {
                closeViewNotification_ntf();
            }
        });
    }

    // ESC key to close modals
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            const notificationModal = document.getElementById("notificationModal_ntf");
            const viewModal = document.getElementById("viewNotificationModal_ntf");

            if (notificationModal && notificationModal.classList.contains("active_ntf")) {
                closeSendNotificationForm_ntf();
            }
            if (viewModal && viewModal.classList.contains("active_ntf")) {
                closeViewNotification_ntf();
            }
        }
    });
}

// ============================================
// OPEN SEND NOTIFICATION MODAL
// ============================================
function openSendNotificationForm_ntf() {
    console.log("🔓 Opening notification form...");
    const modal = document.getElementById("notificationModal_ntf");
    if (modal) {
        // Clear any inline styles
        modal.style.display = "";

        // Add active class
        modal.classList.add("active_ntf");

        isNotificationModalOpen = true;
        console.log("✅ Modal opened, isNotificationModalOpen =", isNotificationModalOpen);

        // Focus first input for better UX
        setTimeout(() => {
            const firstInput = document.getElementById("notificationTitle_ntf");
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

// ============================================
// CLOSE SEND NOTIFICATION MODAL
// ============================================
function closeSendNotificationForm_ntf() {
    console.log("🔒 Closing notification form...");
    const modal = document.getElementById("notificationModal_ntf");
    if (modal) {
        // Remove active class
        modal.classList.remove("active_ntf");

        isNotificationModalOpen = false;
        console.log("✅ Modal closed, isNotificationModalOpen =", isNotificationModalOpen);
    }

    // Reset form
    const form = document.getElementById("sendNotificationForm_ntf");
    if (form) form.reset();
}

// ============================================
// RESET FORM
// ============================================
function resetSendNotificationForm_ntf() {
    const form = document.getElementById("sendNotificationForm_ntf");
    if (form) form.reset();
}

// ============================================
// SEND NOTIFICATION
// ============================================
async function sendNotification_ntf() {

    user_id = getLoggedInUserId();
    const title = document.getElementById("notificationTitle_ntf").value.trim();
    const description = document.getElementById("notificationDescription_ntf").value.trim();

    if (!title || !description) {
        showNotification("Please fill all fields", "warning");
        return;
    }


    const notification = {
        user_id: user_id,
        title,
        body: description
    };

    try {

        let res = await addItemToAPI(notificationsURLphp, notification);
        if (res.message)
            showNotification("Notification sent successfully", "success");
        if (res.error)
            throw new Error(res.error);

        console.log(res);
    } catch (error) {
        console.error(res.error);
        showNotification("Error sending notification", "error");
        return;
    }
    closeSendNotificationForm_ntf();   // close modal first
    await renderNotificationsPage(); // then reload page

}

// ============================================
// REFRESH TABLE
// ============================================
function refreshNotificationsTable() {

    const tableBody = document.getElementById("notificationsTableBody_ntf");
    if (!tableBody) return;

    if (!notificationsData || notificationsData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data_ntf">
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
                    <div class="action-buttons_ntf">
                        <button class="btn-icon_ntf btn-edit_ntf" onclick="viewNotification_ntf(${n.id})" title="View">
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
function viewNotification_ntf(id) {
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

    document.getElementById("viewTitle_ntf").textContent = title;
    document.getElementById("viewBody_ntf").textContent = body;
    document.getElementById("viewDate_ntf").textContent = createdDate;

    // Open the view modal
    const modal = document.getElementById("viewNotificationModal_ntf");
    if (modal) {
        modal.style.display = "";  // Clear inline style
        modal.classList.add("active_ntf");  // Use active class
    }
}

// ============================================
// CLOSE VIEW NOTIFICATION
// ============================================
function closeViewNotification_ntf() {
    console.log("🔒 Closing view notification");
    const modal = document.getElementById("viewNotificationModal_ntf");
    if (modal) {
        modal.classList.remove("active_ntf");  // Use active class
    }
}

window.renderNotificationsPage = renderNotificationsPage;