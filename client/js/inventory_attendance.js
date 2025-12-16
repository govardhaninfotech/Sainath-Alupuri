import {
    getCurrentUser,
    setCurrentUser,
    getStorageItem,
    setLocalStorage
} from './validation.js';

import { attendanceURLphp, staffURLphp, ATTENDANCE_URL } from '../apis/api.js';

let allAttendanceData = [];
let allStaffData = [];
let currentUser = null;
let currentEditId = null;
const itemsPerPage = 10;
let currentPage = 1;
let filteredData = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please log in first');
        window.location.href = '../index.html';
        return;
    }

    loadStaffData();
    loadAttendanceData();

    document.getElementById('filterBtn').addEventListener('click', applyFilters);
    document.getElementById('resetBtn').addEventListener('click', resetFilters);
    document.getElementById('addAttendanceBtn').addEventListener('click', openModal);
    document.getElementById('attendanceForm').addEventListener('submit', handleFormSubmit);
});

// Load Staff Data
function loadStaffData() {
    fetch(staffURLphp)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                allStaffData = data.data;
                populateStaffSelect();
            }
        })
        .catch(err => {
            console.error('Error loading staff:', err);
            showAlert('Error loading staff data', 'error');
        });
}

// Populate Staff Select
function populateStaffSelect() {
    const staffSelect = document.getElementById('staffSelect');
    const formStaffId = document.getElementById('formStaffId');

    staffSelect.innerHTML = '<option value="">-- All Staff --</option>';
    formStaffId.innerHTML = '<option value="">-- Select Staff --</option>';

    allStaffData.forEach(staff => {
        staffSelect.innerHTML += `<option value="${staff.id}">${staff.name}</option>`;
        formStaffId.innerHTML += `<option value="${staff.id}">${staff.name}</option>`;
    });
}

// Load Attendance Data
function loadAttendanceData() {
    const shopId = currentUser.shop_id;

    // Try API first, fallback to JSON
    fetch(`${ATTENDANCE_URL}?shop_id=${shopId}`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                allAttendanceData = data;
            } else if (data.attendance) {
                allAttendanceData = data.attendance;
            }
            filterByShop();
        })
        .catch(err => {
            console.warn('API load failed, trying JSON file:', err);
            fetch('data/attendance.json')
                .then(res => res.json())
                .then(data => {
                    allAttendanceData = data.attendance || data;
                    filterByShop();
                })
                .catch(err => {
                    console.error('Error loading attendance:', err);
                    showAlert('Error loading attendance data', 'error');
                    renderTable([]);
                });
        });
}

// Filter by Shop ID
function filterByShop() {
    filteredData = allAttendanceData.filter(record =>
        record.shop_id.toString() === currentUser.shop_id.toString()
    );
    currentPage = 1;
    renderTable(filteredData);
    updateStats(filteredData);
}

// Apply Filters
function applyFilters() {
    const staffId = document.getElementById('staffSelect').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const status = document.getElementById('statusFilter').value;

    filteredData = allAttendanceData.filter(record => {
        const matchShop = record.shop_id.toString() === currentUser.shop_id.toString();
        const matchStaff = !staffId || record.staff_id.toString() === staffId;
        const matchDateFrom = !dateFrom || record.date >= dateFrom;
        const matchDateTo = !dateTo || record.date <= dateTo;
        const matchStatus = !status || record.status === status;

        return matchShop && matchStaff && matchDateFrom && matchDateTo && matchStatus;
    });

    currentPage = 1;
    renderTable(filteredData);
    updateStats(filteredData);

    // Show staff info if staff is filtered
    if (staffId) {
        const selectedStaff = allStaffData.find(s => s.id.toString() === staffId);
        if (selectedStaff) {
            document.getElementById('staffInfoContainer').innerHTML = `
                <div class="staff-info">
                    <strong>Staff:</strong> ${selectedStaff.name} | 
                    <strong>Mobile:</strong> ${selectedStaff.mobile} | 
                    <strong>Shop ID:</strong> ${selectedStaff.shop_id}
                </div>
            `;
        }
    } else {
        document.getElementById('staffInfoContainer').innerHTML = '';
    }
}

// Reset Filters
function resetFilters() {
    document.getElementById('staffSelect').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('staffInfoContainer').innerHTML = '';
    filterByShop();
}

// Render Table
function renderTable(data) {
    const tableContainer = document.getElementById('tableContainer');

    if (data.length === 0) {
        tableContainer.innerHTML = `
            <div class="no-data">
                <p>No attendance records found</p>
            </div>
        `;
        document.getElementById('paginationContainer').style.display = 'none';
        return;
    }

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const pageData = data.slice(startIdx, startIdx + itemsPerPage);

    let html = `
        <table class="attendance-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Staff ID</th>
                    <th>In Time</th>
                    <th>Out Time</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    pageData.forEach(record => {
        const statusClass = `status-${record.status.toLowerCase().replace(' ', '-')}`;
        html += `
            <tr>
                <td>${record.date}</td>
                <td>${record.staff_id}</td>
                <td><span class="time-display">${record.in_time}</span></td>
                <td><span class="time-display">${record.out_time}</span></td>
                <td><span class="status-badge ${statusClass}">${record.status}</span></td>
                <td>${record.notes || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editRecord('${record.id}')">Edit</button>
                        <button class="btn-delete" onclick="deleteRecord('${record.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = html;

    // Render Pagination
    renderPagination(totalPages);
}

// Render Pagination
function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('paginationContainer');

    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';
    let html = '';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable(filteredData);
        }
    };
    paginationContainer.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === currentPage ? 'active' : '';
        pageBtn.onclick = () => {
            currentPage = i;
            renderTable(filteredData);
        };
        paginationContainer.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable(filteredData);
        }
    };
    paginationContainer.appendChild(nextBtn);
}

// Update Stats
function updateStats(data) {
    const stats = {
        'Present': 0,
        'Absent': 0,
        'Half Day': 0,
        'Late': 0
    };

    data.forEach(record => {
        if (stats.hasOwnProperty(record.status)) {
            stats[record.status]++;
        }
    });

    document.getElementById('presentCount').textContent = stats['Present'];
    document.getElementById('absentCount').textContent = stats['Absent'];
    document.getElementById('halfDayCount').textContent = stats['Half Day'];
    document.getElementById('lateCount').textContent = stats['Late'];
}

// Open Modal
window.openModal = function (editId = null) {
    currentEditId = editId;
    const modal = document.getElementById('attendanceModal');
    const form = document.getElementById('attendanceForm');

    if (editId) {
        const record = allAttendanceData.find(r => r.id.toString() === editId);
        if (record) {
            document.getElementById('modalTitle').textContent = 'Edit Attendance Record';
            document.getElementById('formStaffId').value = record.staff_id;
            document.getElementById('formDate').value = record.date;
            document.getElementById('formInTime').value = record.in_time;
            document.getElementById('formOutTime').value = record.out_time;
            document.getElementById('formStatus').value = record.status;
            document.getElementById('formNotes').value = record.notes || '';
        }
    } else {
        document.getElementById('modalTitle').textContent = 'Add Attendance Record';
        form.reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('formDate').value = today;
    }

    modal.classList.add('show');
};

// Close Modal
window.closeModal = function () {
    document.getElementById('attendanceModal').classList.remove('show');
    currentEditId = null;
};

// Edit Record
window.editRecord = function (id) {
    openModal(id);
};

// Delete Record
window.deleteRecord = function (id) {
    if (!confirm('Are you sure you want to delete this record?')) return;

    fetch(`${ATTENDANCE_URL}/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            showAlert('Record deleted successfully', 'success');
            loadAttendanceData();
        })
        .catch(err => {
            console.error('Delete error:', err);
            // Fallback: Remove from local data
            allAttendanceData = allAttendanceData.filter(r => r.id.toString() !== id);
            filterByShop();
            showAlert('Record deleted', 'success');
        });
};

// Handle Form Submit
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
        staff_id: document.getElementById('formStaffId').value,
        date: document.getElementById('formDate').value,
        in_time: document.getElementById('formInTime').value,
        out_time: document.getElementById('formOutTime').value,
        status: document.getElementById('formStatus').value,
        notes: document.getElementById('formNotes').value || null,
        shop_id: currentUser.shop_id
    };

    // Validate
    if (!formData.staff_id || !formData.date || !formData.in_time || !formData.out_time || !formData.status) {
        showAlert('Please fill all required fields', 'error');
        return;
    }

    try {
        if (currentEditId) {
            // Update
            const response = await fetch(`${attendanceURLphp}?id=${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            showAlert('Record updated successfully', 'success');
        } else {
            // Create
            const response = await fetch(attendanceURLphp, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.status === 'created' || result.message.includes('successfully')) {
                showAlert('Record created successfully', 'success');
            }
        }

        closeModal();
        loadAttendanceData();
    } catch (err) {
        console.error('Error:', err);
        showAlert('Error saving record. Try again.', 'error');
    }
}

// Show Alert
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 4000);
}
