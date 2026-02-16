// ============================================
// STAFF ATTENDANCE PAGE - PROFESSIONAL DESIGN
// ============================================

import { staffURLphp, attendanceURLphp } from "../apis/api.js";
import { showNotification, showConfirm } from "./notification.js";
import {
    validateRequiredField,
    validateForm,
    setupEscKeyHandler
} from "./validation.js";

// Get user from localStorage or sessionStorage
let currentUser = JSON.parse(localStorage.getItem("rememberedUser") || sessionStorage.getItem("rememberedUser"));
let user_id = currentUser?.id || '22';

// Data Storage
let staffData = [];
let attendanceData = [];
let selectedStaffId = null;
let selectedDate = null;

// Pagination
let currentPage = 1;
let itemsPerPage = 10;
let totalItems = 0;
let totalPages = 1;

let editingAttendanceId = null;

// ============================================
// LOAD STAFF DATA
// ============================================
async function loadStaffData() {
    try {
        const res = await fetch(`${staffURLphp}?user_id=${user_id}`);
        if (!res.ok) throw new Error(`Staff API returned ${res.status}`);

        const json = await res.json();
        console.log("Staff API Response:", json);

        if (Array.isArray(json)) {
            staffData = json;
        } else if (json?.staff && Array.isArray(json.staff)) {
            staffData = json.staff;
        } else if (json?.data && Array.isArray(json.data)) {
            staffData = json.data;
        } else {
            staffData = [];
        }

        // Filter only active staff
        staffData = staffData.filter(staff =>
            (staff.status || "").toLowerCase() === "active"
        );

        console.log("Active staff loaded:", staffData.length);
        return staffData;
    } catch (error) {
        console.error("Error loading staff data:", error);
        showNotification("Error loading staff!", "error");
        staffData = [];
        return [];
    }
}

// ============================================
// LOAD ATTENDANCE DATA
// ============================================
async function loadAttendanceData() {
    try {
        let url = `${attendanceURLphp}?user_id=${user_id}`;

        // Add filters if selected
        if (selectedStaffId) {
            url += `&staff_id=${selectedStaffId}`;
        }
        if (selectedDate) {
            url += `&date=${selectedDate}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
            console.warn("Attendance API returned", res.status);
            attendanceData = [];
            return;
        }

        const data = await res.json();
        console.log("Attendance API Response:", data);

        if (Array.isArray(data)) {
            attendanceData = data;
        } else if (data?.attendance && Array.isArray(data.attendance)) {
            attendanceData = data.attendance;
        } else if (data?.data && Array.isArray(data.data)) {
            attendanceData = data.data;
        } else {
            attendanceData = [];
        }

        // Sort by date descending (newest first)
        attendanceData.sort((a, b) => {
            const dateA = new Date(a.date || a.attendance_date);
            const dateB = new Date(b.date || b.attendance_date);
            return dateB - dateA;
        });

        totalItems = attendanceData.length;
        totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

        console.log("Attendance records loaded:", attendanceData.length);
    } catch (error) {
        console.error("Error loading attendance:", error);
        attendanceData = [];
        totalItems = 0;
        totalPages = 1;
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getStaffNameById(staffId) {
    if (!staffId) return "";
    const staff = staffData.find(s => String(s.id) === String(staffId));
    return staff ? staff.name || "" : "";
}

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function formatDateForDisplay(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatTimeForDisplay(timeStr) {
    if (!timeStr || timeStr === "00:00:00") return "N/A";
    // Convert 24hr to 12hr format
    const [hours, minutes] = timeStr.split(':');
    const hr = parseInt(hours);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const displayHr = hr % 12 || 12;
    return `${displayHr}:${minutes} ${ampm}`;
}

function getStatusBadgeClass(status) {
    switch ((status || "").toLowerCase()) {
        case 'present': return 'badge-success';
        case 'absent': return 'badge-danger';
        case 'halfday': return 'badge-warning';
        case 'fullday': return 'badge-success';
        case 'leave': return 'badge-info';
        default: return 'badge-secondary';
    }
}

function populateStaffDropdown(selectId, selectedStaffId = "") {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">All Staff</option>';

    staffData.forEach(staff => {
        const option = document.createElement("option");
        option.value = staff.id;
        option.textContent = staff.name;
        select.appendChild(option);
    });

    if (selectedStaffId) {
        select.value = String(selectedStaffId);
    }
}

// ============================================
// RENDER ATTENDANCE PAGE
// ============================================
export async function renderStaffAttendancePage() {
    console.log("renderStaffAttendancePage: Starting");

    return Promise.all([
        loadStaffData(),
        loadAttendanceData()
    ]).then(() => {
        console.log("All data loaded successfully");
        return generatePageHTML();
    }).catch(error => {
        console.error("Error in renderStaffAttendancePage:", error);
        showNotification("Error loading data. Please refresh the page.", "error");
        return generatePageHTML();
    });
}

// ============================================
// GENERATE PAGE HTML
// ============================================
function generatePageHTML() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = attendanceData.slice(startIndex, endIndex);

    let tableRows = "";

    if (currentPageData.length === 0) {
        tableRows = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <div style="color: #6b7280;">
                        <p style="font-size: 18px; margin-bottom: 8px;">No attendance records found</p>
                        <p style="font-size: 14px;">Click "Mark Attendance" to add attendance records.</p>
                    </div>
                </td>
            </tr>
        `;
    } else {
        currentPageData.forEach((record, index) => {
            const staffName = getStaffNameById(record.staff_id);
            const statusBadge = getStatusBadgeClass(record.status);

            tableRows += `
                <tr>
                    <td>${startIndex + index + 1}</td>
                    <td><strong>${staffName}</strong></td>
                    <td>${formatDateForDisplay(record.date || record.attendance_date)}</td>
                    <td>${formatTimeForDisplay(record.in_time)}</td>
                    <td>${formatTimeForDisplay(record.out_time)}</td>
                    <td><span class="status-badge ${statusBadge}">${(record.status || 'N/A').toUpperCase()}</span></td>
                    <td>${record.notes || 'N/A'}</td>
                    <td>
                        <button class="btn-icon btn-edit" onclick="editAttendance(${record.id})" title="Edit">
                            <i class="icon-edit">✎</i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteAttendance(${record.id})" title="Delete">
                            <i class="icon-delete">🗑️</i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
    const showingTo = Math.min(endIndex, totalItems);

    return `
        <style>
            .attendance-container {
                padding: 20px;
                max-width: 1400px;
                margin: 0 auto;
            }

            .page-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .page-header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }

            .page-header p {
                margin: 8px 0 0 0;
                opacity: 0.9;
                font-size: 14px;
            }

            .filter-section {
                background: white;
                padding: 25px;
                border-radius: 12px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
                margin-bottom: 25px;
            }

            .filter-title {
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .filter-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 15px;
            }

            .filter-group {
                display: flex;
                flex-direction: column;
            }

            .filter-group label {
                font-size: 13px;
                font-weight: 500;
                color: #4b5563;
                margin-bottom: 6px;
            }

            .filter-group select,
            .filter-group input {
                padding: 10px 12px;
                border: 1.5px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                transition: all 0.2s;
            }

            .filter-group select:focus,
            .filter-group input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .filter-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .btn-filter,
            .btn-clear,
            .btn-mark-attendance {
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .btn-filter {
                background: #667eea;
                color: white;
            }

            .btn-filter:hover {
                background: #5568d3;
                transform: translateY(-1px);
            }

            .btn-clear {
                background: #6b7280;
                color: white;
            }

            .btn-clear:hover {
                background: #4b5563;
            }

            .btn-mark-attendance {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                margin-left: auto;
            }

            .btn-mark-attendance:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }

            .data-table {
                width: 100%;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
            }

            .data-table thead {
                background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            }

            .data-table th {
                padding: 16px;
                text-align: left;
                font-weight: 600;
                color: #374151;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .data-table td {
                padding: 16px;
                border-top: 1px solid #f3f4f6;
                font-size: 14px;
                color: #4b5563;
            }

            .data-table tbody tr:hover {
                background: #f9fafb;
            }

            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .badge-success {
                background: #d1fae5;
                color: #065f46;
            }

            .badge-danger {
                background: #fee2e2;
                color: #991b1b;
            }

            .badge-warning {
                background: #fef3c7;
                color: #92400e;
            }

            .badge-info {
                background: #dbeafe;
                color: #1e40af;
            }

            .badge-secondary {
                background: #f3f4f6;
                color: #6b7280;
            }

            .pagination {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                background: white;
                border-radius: 12px;
                margin-top: 20px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
            }

            .pagination-info {
                color: #6b7280;
                font-size: 14px;
            }

            .pagination-controls {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            .pagination-controls button {
                padding: 8px 16px;
                border: 1.5px solid #e5e7eb;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: #374151;
                transition: all 0.2s;
            }

            .pagination-controls button:hover:not(:disabled) {
                background: #f9fafb;
                border-color: #667eea;
                color: #667eea;
            }

            .pagination-controls button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .page-number {
                font-size: 14px;
                color: #374151;
                font-weight: 500;
            }

            /* Modal Styles */
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(4px);
            }

            .modal.show {
                display: flex;
            }

            .modal-content {
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                animation: modalSlideIn 0.3s ease-out;
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .modal-header {
                padding: 24px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 16px 16px 0 0;
            }

            .modal-header h3 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
            }

            .close-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .close-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .modal-body {
                padding: 24px;
            }

            .form-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }

            .form-group {
                display: flex;
                flex-direction: column;
            }

            .form-group.full-width {
                grid-column: 1 / -1;
            }

            .form-group label {
                font-size: 13px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
            }

            .required {
                color: #ef4444;
            }

            .form-group input,
            .form-group select,
            .form-group textarea {
                padding: 12px;
                border: 1.5px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                transition: all 0.2s;
            }

            .form-group textarea {
                resize: vertical;
                min-height: 80px;
                font-family: inherit;
            }

            .form-group input:focus,
            .form-group select:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .form-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 24px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            }

            .btn-cancel,
            .btn-submit {
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
            }

            .btn-cancel {
                background: #f3f4f6;
                color: #374151;
            }

            .btn-cancel:hover {
                background: #e5e7eb;
            }

            .btn-submit {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .btn-submit:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            @media (max-width: 768px) {
                .attendance-container {
                    padding: 15px;
                }

                .page-header {
                    padding: 20px;
                }

                .page-header h1 {
                    font-size: 22px;
                }

                .filter-grid {
                    grid-template-columns: 1fr;
                }

                .filter-actions {
                    flex-direction: column;
                }

                .btn-mark-attendance {
                    margin-left: 0;
                    width: 100%;
                    justify-content: center;
                }

                .data-table {
                    font-size: 12px;
                }

                .data-table th,
                .data-table td {
                    padding: 12px 8px;
                }

                .pagination {
                    flex-direction: column;
                    gap: 15px;
                }

                .form-row {
                    grid-template-columns: 1fr;
                }
            }
        </style>

        <div class="attendance-container">
            <div class="page-header">
                <h1>📋 Staff Attendance Management</h1>
                <p>Track and manage daily staff attendance records</p>
            </div>

            <div class="filter-section">
                <div class="filter-title">
                    🔍 Filter Attendance Records
                </div>
                <div class="filter-grid">
                    <div class="filter-group">
                        <label>Select Staff</label>
                        <select id="filterStaff">
                            <option value="">All Staff</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Select Date</label>
                        <input type="date" id="filterDate">
                    </div>
                </div>
                <div class="filter-actions">
                    <button class="btn-filter" onclick="applyFilters()">
                        🔍 Apply Filters
                    </button>
                    <button class="btn-clear" onclick="clearFilters()">
                        ✖️ Clear Filters
                    </button>
                    <button class="btn-mark-attendance" onclick="openAttendanceForm()">
                        ➕ Mark Attendance
                    </button>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Staff Name</th>
                            <th>Date</th>
                            <th>In Time</th>
                            <th>Out Time</th>
                            <th>Status</th>
                            <th>Notes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>

            <div class="pagination">
                <div class="pagination-info">
                    Showing ${showingFrom} to ${showingTo} of ${totalItems} entries
                </div>
                <div class="pagination-controls">
                    <button onclick="changePage('prev')" ${currentPage === 1 ? "disabled" : ""}>
                        ← Previous
                    </button>
                    <span class="page-number">Page ${currentPage} of ${totalPages}</span>
                    <button onclick="changePage('next')" ${currentPage === totalPages ? "disabled" : ""}>
                        Next →
                    </button>
                </div>
            </div>
        </div>

        <!-- Attendance Form Modal -->
        <div id="attendanceModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalTitle">Mark Attendance</h3>
                    <button class="close-btn" onclick="closeAttendanceForm()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="attendanceForm" onsubmit="submitAttendanceForm(event)">
                        <input type="hidden" id="attendanceId">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Staff Member <span class="required">*</span></label>
                                <select id="formStaffId" required>
                                    <option value="">Select Staff</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Date <span class="required">*</span></label>
                                <input type="date" id="formDate" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>In Time <span class="required">*</span></label>
                                <input type="time" id="formInTime" step="1" required>
                            </div>

                            <div class="form-group">
                                <label>Out Time <span class="required">*</span></label>
                                <input type="time" id="formOutTime" step="1" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Status <span class="required">*</span></label>
                                <select id="formStatus" required>
                                    <option value="">Select Status</option>
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="halfday">Half Day</option>
                                    <option value="fullday">Full Day</option>
                                    <option value="leave">Leave</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group full-width">
                                <label>Notes</label>
                                <textarea id="formNotes" placeholder="Add any notes or remarks..."></textarea>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeAttendanceForm()">
                                Cancel
                            </button>
                            <button type="submit" class="btn-submit">
                                Save Attendance
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// FILTER FUNCTIONS
// ============================================
function applyFilters() {
    selectedStaffId = document.getElementById("filterStaff").value || null;
    selectedDate = document.getElementById("filterDate").value || null;

    currentPage = 1; // Reset to first page

    loadAttendanceData().then(() => {
        const container = document.querySelector(".attendance-container");
        if (container) {
            const newHTML = generatePageHTML();
            container.parentElement.innerHTML = newHTML;

            // Re-populate filter dropdowns with selected values
            setTimeout(() => {
                populateStaffDropdown("filterStaff", selectedStaffId);
                populateStaffDropdown("formStaffId");

                if (selectedDate) {
                    const filterDateInput = document.getElementById("filterDate");
                    if (filterDateInput) filterDateInput.value = selectedDate;
                }
            }, 100);
        }
    });
}

function clearFilters() {
    selectedStaffId = null;
    selectedDate = null;
    currentPage = 1;

    document.getElementById("filterStaff").value = "";
    document.getElementById("filterDate").value = "";

    loadAttendanceData().then(() => {
        const container = document.querySelector(".attendance-container");
        if (container) {
            const newHTML = generatePageHTML();
            container.parentElement.innerHTML = newHTML;

            // Re-populate dropdowns
            setTimeout(() => {
                populateStaffDropdown("filterStaff");
                populateStaffDropdown("formStaffId");
            }, 100);
        }
    });
}

// ============================================
// PAGINATION
// ============================================
function changePage(direction) {
    if (direction === "next" && currentPage < totalPages) {
        currentPage++;
    } else if (direction === "prev" && currentPage > 1) {
        currentPage--;
    }

    const container = document.querySelector(".attendance-container");
    if (container) {
        const newHTML = generatePageHTML();
        container.parentElement.innerHTML = newHTML;

        // Re-populate dropdowns
        setTimeout(() => {
            populateStaffDropdown("filterStaff", selectedStaffId);
            populateStaffDropdown("formStaffId");

            if (selectedDate) {
                const filterDateInput = document.getElementById("filterDate");
                if (filterDateInput) filterDateInput.value = selectedDate;
            }
        }, 100);
    }
}

// ============================================
// FORM FUNCTIONS
// ============================================
function openAttendanceForm() {
    editingAttendanceId = null;

    document.getElementById("modalTitle").textContent = "Mark Attendance";
    document.getElementById("attendanceForm").reset();
    document.getElementById("attendanceId").value = "";

    // Set default values
    document.getElementById("formDate").value = getTodayDate();

    // Populate staff dropdown
    populateStaffDropdown("formStaffId");

    const modal = document.getElementById("attendanceModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

function closeAttendanceForm() {
    const modal = document.getElementById("attendanceModal");
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
    editingAttendanceId = null;
}

// ============================================
// EDIT ATTENDANCE
// ============================================
function editAttendance(id) {
    editingAttendanceId = id;
    const record = attendanceData.find(a => String(a.id) === String(id));

    if (!record) {
        showNotification("Attendance record not found!", "error");
        return;
    }

    document.getElementById("modalTitle").textContent = "Edit Attendance";
    document.getElementById("attendanceId").value = record.id;
    document.getElementById("formDate").value = record.date || record.attendance_date;
    document.getElementById("formInTime").value = record.in_time || "";
    document.getElementById("formOutTime").value = record.out_time || "";
    document.getElementById("formStatus").value = record.status || "";
    document.getElementById("formNotes").value = record.notes || "";

    // Populate and select staff
    populateStaffDropdown("formStaffId", record.staff_id);

    const modal = document.getElementById("attendanceModal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

// ============================================
// DELETE ATTENDANCE
// ============================================
async function deleteAttendance(id) {
    try {
        const confirmed = await showConfirm(
            "Are you sure you want to delete this attendance record?",
            "warning"
        );

        if (!confirmed) return;

        const res = await fetch(`${attendanceURLphp}?id=${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        if (!res.ok) {
            throw new Error("Delete failed with status " + res.status);
        }

        showNotification("Attendance deleted successfully!", "success");

        // Reload data
        await loadAttendanceData();
        const container = document.querySelector(".attendance-container");
        if (container) {
            const newHTML = generatePageHTML();
            container.parentElement.innerHTML = newHTML;

            setTimeout(() => {
                populateStaffDropdown("filterStaff", selectedStaffId);
                populateStaffDropdown("formStaffId");

                if (selectedDate) {
                    const filterDateInput = document.getElementById("filterDate");
                    if (filterDateInput) filterDateInput.value = selectedDate;
                }
            }, 100);
        }
    } catch (error) {
        console.error("Error deleting attendance:", error);
        showNotification("Error deleting attendance!", "error");
    }
}

// ============================================
// SUBMIT ATTENDANCE FORM
// ============================================
async function submitAttendanceForm(event) {
    event.preventDefault();

    const staffId = document.getElementById("formStaffId").value;
    const date = document.getElementById("formDate").value;
    const inTime = document.getElementById("formInTime").value;
    const outTime = document.getElementById("formOutTime").value;
    const status = document.getElementById("formStatus").value;
    const notes = document.getElementById("formNotes").value;

    // Validate required fields
    const staffValidation = validateRequiredField(staffId, "Staff");
    const dateValidation = validateRequiredField(date, "Date");
    const inTimeValidation = validateRequiredField(inTime, "In Time");
    const outTimeValidation = validateRequiredField(outTime, "Out Time");
    const statusValidation = validateRequiredField(status, "Status");

    const formValidation = validateForm([
        staffValidation,
        dateValidation,
        inTimeValidation,
        outTimeValidation,
        statusValidation
    ]);

    if (!formValidation.status) {
        showNotification(formValidation.message, "error");
        return;
    }

    // Convert time format from HH:MM to HH:MM:SS if needed
    const inTimeFull = inTime.length === 5 ? inTime + ":00" : inTime;
    const outTimeFull = outTime.length === 5 ? outTime + ":00" : outTime;

    const formData = {
        user_id: user_id,
        staff_id: parseInt(staffId),
        date: date,
        in_time: inTimeFull,
        out_time: outTimeFull,
        status: status,
        notes: notes || null
    };

    try {
        const confirmed = await showConfirm(
            editingAttendanceId ? "Are you sure you want to update this attendance?" : "Are you sure you want to mark this attendance?",
            "warning"
        );

        if (!confirmed) return;

        let res;
        if (editingAttendanceId) {
            res = await fetch(`${attendanceURLphp}?id=${editingAttendanceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
        } else {
            res = await fetch(attendanceURLphp, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
        }

        if (!res.ok) {
            const errorText = await res.text();
            console.error("API Error:", errorText);
            throw new Error(`Request failed with status ${res.status}`);
        }

        const result = await res.json();

        if (result?.error) {
            showNotification(result.message || "Error saving attendance!", "error");
            return;
        }

        showNotification(
            editingAttendanceId ? "Attendance updated successfully!" : "Attendance marked successfully!",
            "success"
        );

        closeAttendanceForm();

        // Reload data
        await loadAttendanceData();
        const container = document.querySelector(".attendance-container");
        if (container) {
            const newHTML = generatePageHTML();
            container.parentElement.innerHTML = newHTML;

            setTimeout(() => {
                populateStaffDropdown("filterStaff", selectedStaffId);
                populateStaffDropdown("formStaffId");

                if (selectedDate) {
                    const filterDateInput = document.getElementById("filterDate");
                    if (filterDateInput) filterDateInput.value = selectedDate;
                }
            }, 100);
        }
    } catch (error) {
        console.error("Error saving attendance:", error);
        showNotification(error?.message || "Error saving attendance!", "error");
    }
}

// Close modal when clicking outside
window.addEventListener("click", function (event) {
    const modal = document.getElementById("attendanceModal");
    if (event.target === modal) {
        closeAttendanceForm();
    }
});

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.openAttendanceForm = openAttendanceForm;
window.closeAttendanceForm = closeAttendanceForm;
window.editAttendance = editAttendance;
window.deleteAttendance = deleteAttendance;
window.renderStaffAttendancePage = renderStaffAttendancePage;
window.submitAttendanceForm = submitAttendanceForm;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.changePage = changePage;

// Initialize dropdowns on load
setTimeout(() => {
    populateStaffDropdown("filterStaff");
    populateStaffDropdown("formStaffId");
}, 100);

// Setup ESC key handler for modal
setupEscKeyHandler();