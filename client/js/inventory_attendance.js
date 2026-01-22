// ============================================
// STAFF ATTENDANCE PAGE - FIXED VERSION
// ============================================

import { staffURLphp, attendanceURLphp } from "../apis/api.js";
import { getItemsData, addItemToAPI, updateItem } from "../apis/master_api.js";
import { showNotification, showConfirm } from "./notification.js";

// Get user from storage
const currentUser = JSON.parse(localStorage.getItem("rememberedUser") || sessionStorage.getItem("rememberedUser") || "null");
const user_id = currentUser?.id || "22";

console.log('[LOG] Initializing Staff Attendance - User ID:', user_id);

// Data Storage
let staffData = [];
let attendanceData = [];

// Pagination
let currentPage = 1;
let itemsPerPage = 10;
let totalItems = 0;
let totalPages = 1;
let mainDate = null;
// Current filter date
let currentFilterDate = null;

// Store current editing record
let currentEditingRecord = null;

// Default constants
const DEFAULT_STATUS = "fullday";

// Helper function to get today's date
function getTodayDate() {
    console.log('[LOG] Getting today date');
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    console.log('[LOG] Today date:', formatted);
    return formatted;
}

const TODAY_DATE = getTodayDate();
currentFilterDate = TODAY_DATE;

// ============================================
// LOAD FUNCTIONS
// ============================================

async function loadStaffData(date) {
    console.log('[LOG] Loading active staff data for date:', date);
    try {
        const url = `${staffURLphp}?user_id=${user_id}&date=${date}&status=active`;
        console.log('[LOG] Staff URL:', url);

        const data = await getItemsData(url);

        staffData = Array.isArray(data) ? data : (data?.staff || data?.data || []);
        console.log(`[LOG] Loaded ${staffData.length} active staff members`);
        return staffData;
    } catch (error) {
        console.error('[LOG] Error loading staff data:', error);
        showNotification("Error loading staff data!", "error");
        staffData = [];
        return [];
    }
}

async function loadAttendanceData(filterDate = null) {
    console.log('[LOG] Loading attendance data - Filter Date:', filterDate);
    try {
        let url = `${attendanceURLphp}?user_id=${user_id}`;

        if (filterDate) {
            url += `&date=${filterDate}`;
            currentFilterDate = filterDate;
            console.log('[LOG] Applied date filter:', filterDate);
        } else {
            currentFilterDate = TODAY_DATE;
        }

        console.log('[LOG] Attendance URL:', url);
        const data = await getItemsData(url);
        console.log('[LOG] Attendance API Response:', data);
        mainDate = data.date;
        console.log(mainDate);
        
        attendanceData = data.records || [];

        // Sort by date descending
        attendanceData.sort((a, b) => {
            const dateA = new Date(a.date || "");
            const dateB = new Date(b.date || "");
            return dateB - dateA;
        });

        totalItems = attendanceData.length;
        totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

        console.log(`[LOG] Loaded ${attendanceData.length} attendance records`);
        return attendanceData;
    } catch (error) {
        console.error('[LOG] Error loading attendance data:', error);
        attendanceData = [];
        totalItems = 0;
        totalPages = 1;
        return [];
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getStaffNameById(staffId) {
    const staff = staffData.find(s => String(s.id) === String(staffId));
    return staff ? staff.name : "Unknown Staff";
}

function formatDateForDisplay(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function getStatusBadgeClass(status) {
    const statusLower = (status || "").toLowerCase();
    const badgeMap = {
        'fullday': 'badge-success',
        'halfday': 'badge-warning',
        'leave': 'badge-danger'
    };
    return badgeMap[statusLower] || 'badge-secondary';
}

function validateFilterDate(dateStr) {
    console.log('[LOG] Validating filter date:', dateStr);
    if (!dateStr) {
        console.warn('[LOG] Filter date is empty');
        return false;
    }

    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
        console.warn('[LOG] Selected date is in the future');
        showNotification("Cannot select future dates!", "warning");
        return false;
    }

    console.log('[LOG] Filter date validated successfully');
    return true;
}

// ============================================
// RENDER PAGE
// ============================================

export async function renderStaffAttendancePage() {
    console.log('[LOG] Rendering Staff Attendance Page');
    try {
        await loadAttendanceData(TODAY_DATE);
        const html = generatePageHTML();

        const appDiv = document.getElementById("app");
        if (appDiv) {
            appDiv.innerHTML = html;
            console.log('[LOG] HTML rendered into #app');
        } else {
            console.warn('[LOG] #app div not found');
        }
        return html;
    } catch (error) {
        console.error('[LOG] Error rendering page:', error);
        showNotification(error.message || "Error loading page", "error");
        return generatePageHTML();
    }
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
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                    <p style="font-size: 16px; margin-bottom: 8px;">📋 No attendance records found</p>
                    <p style="font-size: 14px;">Click "Add Attendance" button to record attendance</p>
                </td>
            </tr>
        `;
    } else {
        currentPageData.forEach((record, index) => {
            const statusBadge = getStatusBadgeClass(record.status);

            // CRITICAL FIX: Use record.id (the attendance record ID), not record.staff_id

            tableRows += `
                <tr>
                    <td>${startIndex + index + 1}</td>
                    <td><strong>${record.name || 'N/A'}</strong></td>
                    <td>${record.cap === 1 ? '✓ Cap' : '✘'}</td>
                    <td>${record.t_shirt === 1 ? '✓ T-Shirt' : '✘'}</td>
                    <td><span class="status-badge ${statusBadge}">${(record.status || 'N/A').toUpperCase()}</span></td>
                    <td>
                        <button class="btn-edit" onclick="editAttendance(${record.staff_id})" title="Edit">✎</button>
                        <!-- <button class="btn-delete" onclick="deleteAttendance(${record.staff_id})" title="Delete">🗑️</button> -->
                    </td>
                </tr>
            `;
        });
    }

    const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
    const showingTo = Math.min(endIndex, totalItems);

    return `
        <div class="staffAttendance-container">
            <!-- Header Section -->
            <div class="staff-page-header">
                <div class="header-content-staff">
                    <h1>Staff Attendance</h1>
                </div>
                <div>
                    <input type="date" id="filterDate" class="filter-input" value="${currentFilterDate || TODAY_DATE}" onchange="applyDateFilterAttendnace()">
                    <button class="btn-add-attendance" onclick="openAttendanceForm()">➕ Add Attendance</button>
                </div>
            </div>

            <!-- Table Section -->
            <div class="header-table-wrapper-staff">
                <table class="attendance-table-staff">
                    <thead>
                        <tr>
                            <th>Sr No</th>
                            <th>Staff Name</th>
                            <th>Cap</th>
                            <th>T Shirt</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="pagination-section">
                <div class="pagination-info">
                    Showing ${showingFrom} to ${showingTo} of ${totalItems} records
                </div>
                <div class="pagination-buttons">
                    <button onclick="previousPage()" ${currentPage === 1 ? 'disabled' : ''} class="btn-pagination">← Previous</button>
                    <span class="page-indicator">Page ${currentPage} of ${totalPages}</span>
                    <button onclick="nextPage()" ${currentPage === totalPages ? 'disabled' : ''} class="btn-pagination">Next →</button>
                </div>
            </div>
        </div>

        <!-- Add Attendance Modal -->
        <div id="attendanceModal" class="modal">
            <div class="modal-overlay" onclick="closeAttendanceForm()"></div>
            <div class="modal-box-staff add-attendance-form">
                <div class="modal_staff-header">
                    <h2>Add Staff Attendance</h2>
                    <input type="date" class="date-display" id="staffAttDate" onchange="staffAttDateChange()" required style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; flex: 0 0 auto;">
                    <button class="close-btn" onclick="closeAttendanceForm()">✕</button>
                </div>
                
                <form id="attendanceForm" onsubmit="submitAttendanceForm(event)">
                    <div class="form-header-table-wrapper-staff">
                        <table class="form-table">
                            <thead>
                                <tr>
                                    <th>Sr No</th>
                                    <th>Staff Name</th>
                                    <th>Status</th>
                                    <th>T-Shirt</th>    
                                    <th>Cap</th>
                                </tr>
                            </thead>
                            <tbody id="staffTableBody">
                                <!-- Staff rows will be populated here -->
                            </tbody>
                        </table>
                    </div>

                    <div class="modal-footer form-footer">
                        <button type="button" class="btn-cancel" onclick="closeAttendanceForm()">Cancel</button>
                        <button type="submit" class="btn-submit">Save</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Edit Attendance Modal -->
        <div id="editAttendanceModal" class="modal">
            <div class="modal-overlay" onclick="closeEditAttendanceForm()"></div>
            <div class="modal-box-staff edit-attendance-form-container">
                <div class="edit-modal-header">
                    <h2>Edit Staff Attendance</h2>
                    <button class="edit-close-btn" onclick="closeEditAttendanceForm()">✕</button>
                </div>
                
                <form id="editAttendanceForm" class="edit-attendance-form" onsubmit="submitEditAttendanceForm(event)">
                    <input type="hidden" id="editRecordId">
                    <input type="hidden" id="editStaffId">
                    <input type="hidden" id="editRecordDate">
                    
                    <div class="edit-form-group">
                        <label for="editStaffName" class="edit-form-label">Staff Name</label>
                        <input type="text" id="editStaffName" class="edit-form-input edit-staff-name-input" disabled>
                    </div>

                    <div class="edit-form-group">
                        <label for="editAttendanceDate" class="edit-form-label">Date</label>
                        <input type="date" id="editAttendanceDate" class="edit-form-input edit-attendance-date-input" disabled>
                    </div>

                    <div class="edit-form-group">
                        <label for="editStatus" class="edit-form-label">Status</label>
                        <select id="editStatus" class="edit-form-select edit-status-select" required>
                            <option value="fullday">Full Day</option>
                            <option value="halfday">Half Day</option>
                            <option value="leave">Leave</option>
                            <option value="absent">Absent</option>
                        </select>
                    </div>

                    <div class="edit-form-group edit-checkbox-group">
                        <label class="edit-checkbox-label">
                            <input type="checkbox" id="editTShirt" class="edit-form-checkbox edit-tshirt-checkbox">
                            <span class="edit-checkbox-text">T-Shirt</span>
                        </label>
                    </div>

                    <div class="edit-form-group edit-checkbox-group">
                        <label class="edit-checkbox-label">
                            <input type="checkbox" id="editCap" class="edit-form-checkbox edit-cap-checkbox">
                            <span class="edit-checkbox-text">Cap</span>
                        </label>
                    </div>

                    <div class="edit-modal-footer">
                        <button type="button" class="edit-btn-cancel" onclick="closeEditAttendanceForm()">Cancel</button>
                        <button type="submit" style="width: 20px !important;" class="edit-btn-submit">Update</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// ============================================
// FILTER & PAGINATION FUNCTIONS
// ============================================

function applyDateFilterAttendnace() {
    console.log('[LOG] Applying date filter');
    const filterInput = document.getElementById("filterDate");
    const filterDate = filterInput?.value;

    if (!validateFilterDate(filterDate)) {
        filterInput.value = currentFilterDate || TODAY_DATE;
        return;
    }

    console.log('[LOG] Filter date applied:', filterDate);
    currentFilterDate = filterDate;
    currentPage = 1;
    loadAttendanceData(filterDate).then(() => {
        refreshPage();
    });
}

function previousPage() {
    console.log('[LOG] Going to previous page');
    if (currentPage > 1) {
        currentPage--;
        refreshPage();
    }
}

function nextPage() {
    console.log('[LOG] Going to next page');
    if (currentPage < totalPages) {
        currentPage++;
        refreshPage();
    }
}

function refreshPage() {
    console.log('[LOG] Refreshing page');
    const container = document.querySelector(".staffAttendance-container");
    if (container) {
        container.parentElement.innerHTML = generatePageHTML();
    }
}

async function staffAttDateChange() {
    console.log('[LOG] Staff attendance date changed');
    let date = document.getElementById("staffAttDate").value;

    if (!validateFilterDate(date)) {
        document.getElementById("staffAttDate").value = TODAY_DATE;
        return;
    }

    await loadStaffData(date);
    populateStaffTable();
}

// ============================================
// MODAL FUNCTIONS
// ============================================

async function openAttendanceForm() {
    console.log('[LOG] Opening attendance form');
    const formDate = currentFilterDate || TODAY_DATE;
    document.getElementById("staffAttDate").value = formDate;

    await loadStaffData(formDate);
    const modal = document.getElementById("attendanceModal");

    document.getElementById("attendanceForm").reset();
    populateStaffTable();

    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}

function closeAttendanceForm() {
    console.log('[LOG] Closing attendance form');
    const modal = document.getElementById("attendanceModal");
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
}

function populateStaffTable() {
    console.log('[LOG] Populating staff attendance table');
    const tbody = document.getElementById("staffTableBody");

    if (!tbody) {
        console.warn('[LOG] Staff table body not found');
        return;
    }

    tbody.innerHTML = '';

    staffData.forEach((staff, index) => {
        const row = document.createElement('tr');
        row.className = 'staff-row';
        row.innerHTML = `
            <td class="sr-no">${index + 1}</td>
            <td class="staff-name">${staff.name || 'Unknown'}</td>
            <td class="status-cell">
                <select class="status-select" id="status_${staff.id}" data-staff-id="${staff.id}">
                    <option value="fullday" selected>Full Day</option>
                    <option value="halfday">Half Day</option>
                    <option value="leave">Leave</option>
                </select>
            </td>
            <td class="checkbox-cell">
                <input type="checkbox" class="tshirt-check" id="tshirt_${staff.id}" data-staff-id="${staff.id}" checked>
            </td>
            <td class="checkbox-cell">
                <input type="checkbox" class="cap-check" id="cap_${staff.id}" data-staff-id="${staff.id}" checked>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log(`[LOG] Populated ${staffData.length} staff members in attendance table`);
}

// ============================================
// SUBMIT FUNCTIONS
// ============================================

async function submitAttendanceForm(event) {
    event.preventDefault();
    console.log('[LOG] Submitting attendance form for all staff');

    const formDate = document.getElementById("staffAttDate").value;
    const staffArray = [];
    const staffRows = document.querySelectorAll('.staff-row');

    staffRows.forEach(row => {
        const staffIdCells = row.querySelectorAll('[data-staff-id]');
        if (staffIdCells.length === 0) return;

        const staffId = staffIdCells[0].getAttribute('data-staff-id');
        const statusSelect = row.querySelector(`#status_${staffId}`);
        const tshirtCheck = row.querySelector(`#tshirt_${staffId}`);
        const capCheck = row.querySelector(`#cap_${staffId}`);

        const status = statusSelect?.value;

        if (status && status !== '') {
            staffArray.push({
                staff_id: parseInt(staffId),
                status: status,
                t_shirt: tshirtCheck?.checked ? 1 : 0,
                cap: capCheck?.checked ? 1 : 0
            });
        }
    });

    if (staffArray.length === 0) {
        console.warn('[LOG] Validation failed - no staff selected');
        showNotification("Please select status for at least one staff member!", "warning");
        return;
    }

    const attendanceData = {
        user_id: parseInt(user_id),
        date: formDate,
        staffs: staffArray
    };

    console.log(attendanceData);
    
    // console.log('[LOG] Attendance data prepared:', JSON.stringify(attendanceData, null, 2));

    try {
        const confirmed = await showConfirm(
            `Confirm attendance for ${staffArray.length} staff member(s) on ${formatDateForDisplay(formDate)}?`,
            "info"
        );

        if (!confirmed) {
            console.log('[LOG] Form submission cancelled by user');
            return;
        }

        const result = await addItemToAPI(`${attendanceURLphp}?user_id=${user_id}`, attendanceData);

        if (result?.error) {
            console.error('[LOG] API Error:', result);
            showNotification(result.message || "Error saving attendance!", "error");
            return;
        }

        console.log('[LOG] Attendance submitted successfully');
        showNotification(`✓ Attendance recorded for ${staffArray.length} staff member(s)!`, "success");
        closeAttendanceForm();

        // await loadAttendanceData(currentFilterDate || TODAY_DATE);
        // refreshPage();

    } catch (error) {
        console.error('[LOG] Error submitting form:', error);
        showNotification("Error saving attendance!", "error");
    }
}

// ============================================
// EDIT FUNCTIONS - FIXED
// ============================================

async function editAttendance(recordId) {
    console.log('[LOG] ========================================');
    console.log('[LOG] EDIT ATTENDANCE - START');
    console.log('[LOG] Record ID:', recordId);
    console.log(attendanceData);

    try {
        // CRITICAL FIX: Find by attendance record ID, not staff_id
        const record = attendanceData.find(r =>
            String(r.staff_id) === String(recordId)
        );
        console.log("record", record);

        if (!record) {
            console.error('[LOG] ❌ Attendance record not found!');
            console.error('[LOG] Looking for ID:', recordId);
            console.error('[LOG] Available records:', attendanceData.map(r => ({ id: r.id, staff_id: r.staff_id, name: r.name })));
            showNotification("Record not found!", "error");
            return;
        }

        console.log('[LOG] ✓ Found attendance record:', record);

        currentEditingRecord = { ...record };

        const modal = document.getElementById("editAttendanceModal");
        if (!modal) {
            console.error('[LOG] ❌ Edit modal not found');
            return;
        }

        // CRITICAL FIX: Store the attendance record ID, not staff_id
        document.getElementById("editRecordId").value = record.id;
        document.getElementById("editStaffId").value = record.staff_id;
        document.getElementById("editRecordDate").value = mainDate;
        document.getElementById("editStaffName").value = record.name || '';
        document.getElementById("editAttendanceDate").value = record.date;

        console.log(mainDate);
        
        const statusSelect = document.getElementById("editStatus");
        const statusValue = (record.status || 'fullday').toLowerCase();
        statusSelect.value = statusValue;

        const tshirtValue = record.t_shirt === 1 || record.t_shirt === '1' || record.t_shirt === true;
        const capValue = record.cap === 1 || record.cap === '1' || record.cap === true;

        document.getElementById("editTShirt").checked = tshirtValue;
        document.getElementById("editCap").checked = capValue;

        console.log('[LOG] Form populated successfully');
        console.log('[LOG] ========================================');

        modal.style.display = "flex";
        setTimeout(() => {
            modal.classList.add("show");
        }, 10);

    } catch (error) {
        console.error('[LOG] ❌ Error editing attendance:', error);
        showNotification("Error loading attendance record!", "error");
    }
}

async function submitEditAttendanceForm(event) {
    event.preventDefault();
    console.log('[LOG] ========================================');
    console.log('[LOG] SUBMIT EDIT FORM - START');

    try {
        // CRITICAL FIX: Get the attendance record ID, not staff_id
        const recordId = document.getElementById("editRecordId").value;
        const staff_id = document.getElementById("editStaffId").value;
        const status = document.getElementById("editStatus").value;
        const tshirt = document.getElementById("editTShirt").checked;
        const cap = document.getElementById("editCap").checked;

        console.log('[LOG] Form Values Retrieved:');
        console.log('[LOG] - Record ID:', recordId);
        console.log('[LOG] - Staff ID:', staff_id);
        console.log('[LOG] - Status:', status);
        console.log('[LOG] - T-Shirt:', tshirt);
        console.log('[LOG] - Cap:', cap);

            // if (!recordId) {
            //     console.error('[LOG] ❌ Record ID not found');
            //     showNotification("Error: Record ID not found!", "error");
            //     return;
            // }

        // CRITICAL FIX: Build update data with proper structure
        const editData = {
            // user_id: parseInt(user_id),
            // staff_id: parseInt(staff_id),
            status: status,
            t_shirt: tshirt ? 1 : 0,
            cap: cap ? 1 : 0
        };

        console.log('[LOG] Update Data Prepared:', JSON.stringify(editData, null, 2));

        const confirmed = await showConfirm(
            "Are you sure you want to update this attendance record?",
            "info"
        );

        if (!confirmed) {
            console.log('[LOG] ⚠ Edit cancelled by user');
            return;
        }

        console.log('[LOG] Calling updateItem API...');
        console.log('[LOG] URL:', attendanceURLphp);
        // console.log('[LOG] Record ID:', recordId);

        // CRITICAL FIX: Use the attendance record ID for update
        const result = await updateItem(attendanceURLphp, recordId, editData);

        console.log('[LOG] API Response:', result);

        if (result?.error) {
            console.error('[LOG] ❌ API Error:', result);
            showNotification(result.message || "Error updating attendance!", "error");
            return;
        }

        console.log('[LOG] ✓ Attendance updated successfully');
        showNotification("✓ Attendance updated successfully!", "success");
        closeEditAttendanceForm();

        await loadAttendanceData(currentFilterDate || TODAY_DATE);
        refreshPage();
        console.log('[LOG] ========================================');

    } catch (error) {
        console.error('[LOG] ❌ Error updating attendance:', error);
        showNotification("Error updating attendance!", "error");
    }
}

function closeEditAttendanceForm() {
    console.log('[LOG] Closing edit attendance form');
    currentEditingRecord = null;
    const modal = document.getElementById("editAttendanceModal");
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
}

// ============================================
// DELETE FUNCTION - NEW IMPLEMENTATION
// ============================================

async function deleteAttendance(recordId) {
    console.log('[LOG] ========================================');
    console.log('[LOG] DELETE ATTENDANCE - START');
    console.log('[LOG] Record ID:', recordId);

    try {
        // Find the record to get staff name for confirmation
        const record = attendanceData.find(r =>
            String(r.id) === String(recordId) ||
            String(r.attendance_id) === String(recordId)
        );

        if (!record) {
            console.error('[LOG] ❌ Record not found');
            showNotification("Record not found!", "error");
            return;
        }

        console.log('[LOG] Record to delete:', record);

        const confirmed = await showConfirm(
            `Are you sure you want to delete attendance for ${record.name || 'this staff'} on ${formatDateForDisplay(record.date)}?`,
            "warning"
        );

        if (!confirmed) {
            console.log('[LOG] ⚠ Delete cancelled by user');
            return;
        }

        console.log('[LOG] Deleting record with ID:', recordId);

        // Make DELETE request
        const url = `${attendanceURLphp}?id=${recordId}`;
        console.log('[LOG] Delete URL:', url);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('[LOG] Delete response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[LOG] ❌ Delete failed:', errorText);
            throw new Error(`Delete failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('[LOG] Delete result:', result);

        if (result?.error) {
            console.error('[LOG] ❌ API Error:', result);
            showNotification(result.message || "Error deleting attendance!", "error");
            return;
        }

        console.log('[LOG] ✓ Attendance deleted successfully');
        showNotification("✓ Attendance deleted successfully!", "success");

        // Reload data and refresh
        await loadAttendanceData(currentFilterDate || TODAY_DATE);
        refreshPage();
        console.log('[LOG] ========================================');

    } catch (error) {
        console.error('[LOG] ❌ Error deleting attendance:', error);
        showNotification("Error deleting attendance!", "error");
    }
}

// ============================================
// GLOBAL FUNCTION EXPORTS
// ============================================

window.openAttendanceForm = openAttendanceForm;
window.closeAttendanceForm = closeAttendanceForm;
window.editAttendance = editAttendance;
window.submitEditAttendanceForm = submitEditAttendanceForm;
window.closeEditAttendanceForm = closeEditAttendanceForm;
window.deleteAttendance = deleteAttendance;
window.applyDateFilterAttendnace = applyDateFilterAttendnace;