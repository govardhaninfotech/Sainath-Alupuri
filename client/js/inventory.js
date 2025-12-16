// inventory.js (defensive update)
// Purpose: auto-select staff when opened with ?staff_id=ID and robustly handle missing/odd API responses.

import { EXPENSES_URL, STATUS_URL } from "../apis/api.js";
import { staffURLphp } from "../apis/api.js";
import { showNotification, showConfirm } from "./notification.js";

console.log("inventory.js: loaded (defensive update)");

const STAFF_API_URL = staffURLphp || "/staff.php"; // fallback string if import fails

let invAllStaff = [];
let invFilteredStaff = [];
let invSelectedStaff = null;
let invExpenses = [];

/**
 * Public functions expected by your app
 */
export function renderInventoryStaffPage() {
    return fetch("inventory_staff.html")
        .then(res => res.text())
        .then(html => {
            // Remove the script tag since dashboard.js handles initialization
            // This prevents double initialization and timing issues
            return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        })
        .catch(err => {
            console.error("inventory.js: Error loading inventory_staff.html:", err);
            return `<div class="content-card"><p>Error loading Inventory Staff page.</p></div>`;
        });
}

export function initInventoryStaffPage() {
    console.log("inventory.js: initInventoryStaffPage()");
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:30',message:'initInventoryStaffPage called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion agent log
    
    // Wait for DOM to be ready (in case HTML injection hasn't completed)
    setTimeout(() => {
        checkInventoryApiStatus();
        setDefaultDateToday();
        initMonthDropdown();
        attachEventListeners();

        // 1) load staff list
        // 2) if ?staff_id= present OR localStorage has selectedStaffId, attempt to select that staff (with fallbacks)
        fetchStaffList()
            .then(() => {
                // Check URL params first, then localStorage
                const staffIdFromUrl = getQueryParam("staff_id");
                const staffIdFromStorage = localStorage.getItem("selectedStaffId");
                const staffIdToSelect = staffIdFromUrl || staffIdFromStorage;
                
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:45',message:'staff ID sources checked',data:{staffIdFromUrl:staffIdFromUrl,staffIdFromStorage:staffIdFromStorage,staffIdToSelect:staffIdToSelect},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion agent log
                
                if (staffIdToSelect) {
                    // Clear localStorage after reading to avoid stale data
                    if (staffIdFromStorage) {
                        localStorage.removeItem("selectedStaffId");
                    }
                    // Add a small delay to ensure dropdown is populated
                    setTimeout(() => {
                        selectStaffByIdWithFallbacks(staffIdToSelect).catch(err => {
                            console.warn("inventory.js: selectStaffByIdWithFallbacks error:", err);
                            // #region agent log
                            fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:54',message:'selectStaffByIdWithFallbacks error',data:{error:err.message,staffId:staffIdToSelect},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                            // #endregion agent log
                        });
                    }, 100);
                }
            })
            .catch(err => {
                console.warn("inventory.js: fetchStaffList failed:", err);
                // still attempt fallback if staff_id present
                const staffIdFromUrl = getQueryParam("staff_id");
                const staffIdFromStorage = localStorage.getItem("selectedStaffId");
                const staffIdToSelect = staffIdFromUrl || staffIdFromStorage;
                if (staffIdToSelect) {
                    if (staffIdFromStorage) {
                        localStorage.removeItem("selectedStaffId");
                    }
                    setTimeout(() => {
                        selectStaffByIdWithFallbacks(staffIdToSelect).catch(e => console.warn(e));
                    }, 100);
                }
            });
    }, 50);
}

/* ============================
   Utilities & DOM helpers
   ============================ */

function getQueryParam(name) {
    try {
        return new URLSearchParams(window.location.search).get(name);
    } catch (e) {
        return null;
    }
}

async function selectStaffByIdWithFallbacks(staffId) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:70',message:'selectStaffByIdWithFallbacks called',data:{staffId:staffId,invFilteredStaffLength:invFilteredStaff.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion agent log
    
    // If staff already present in invFilteredStaff, just select
    const staffSelect = document.getElementById("invStaffSelect");
    if (!staffSelect) {
        console.warn("inventory.js: invStaffSelect not present in DOM.");
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:76',message:'invStaffSelect not found in DOM',data:{staffId:staffId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion agent log
        return;
    }

    // If staff present in already-loaded filtered list -> select it
    const present = invFilteredStaff.some(s => String(s.id) === String(staffId));
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:80',message:'checking if staff in filtered list',data:{staffId:staffId,present:present,filteredStaffIds:invFilteredStaff.map(s=>s.id),dropdownOptions:Array.from(staffSelect.options).map(o=>o.value)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion agent log
    
    if (present) {
        // Ensure the option exists in dropdown before selecting
        const optionExists = Array.from(staffSelect.options).some(o => String(o.value) === String(staffId));
        if (optionExists) {
            staffSelect.value = String(staffId);
            handleStaffSelection(String(staffId));
            highlightSelectedStaffOption(String(staffId));
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:90',message:'staff found in filtered list, selected',data:{staffId:staffId,selectValue:staffSelect.value,optionExists:optionExists},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion agent log
        } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:95',message:'staff in list but option not in dropdown yet, waiting',data:{staffId:staffId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion agent log
            // Wait a bit and try again
            setTimeout(() => {
                if (Array.from(staffSelect.options).some(o => String(o.value) === String(staffId))) {
                    staffSelect.value = String(staffId);
                    handleStaffSelection(String(staffId));
                    highlightSelectedStaffOption(String(staffId));
                }
            }, 200);
        }
        return;
    }

    // Otherwise, try to fetch single staff by id with a few fallback URL formats.
    // This helps if your staff.php endpoint doesn't offer a list or returns a different structure.
    const fallbackUrls = [
        `${STAFF_API_URL}?id=${encodeURIComponent(staffId)}`,
        `${STAFF_API_URL}/${encodeURIComponent(staffId)}`,
        `${STAFF_API_URL}?staff_id=${encodeURIComponent(staffId)}`,
        // last resort: try staff.php in same folder
        `staff.php?id=${encodeURIComponent(staffId)}`
    ];

    console.log("inventory.js: trying fallback staff fetch for id", staffId, fallbackUrls);

    let foundStaff = null;
    for (const u of fallbackUrls) {
        try {
            const res = await fetch(u, { credentials: "same-origin" });
            if (!res.ok) {
                console.log(`inventory.js: fallback ${u} returned status ${res.status}`);
                continue;
            }
            const json = await res.json();
            // Accept several shapes:
            // - a single staff object { id:.., name:.. }
            // - array [ {..}, ... ]
            // - { staff: {...} } or { data: {...} } or { staff: [ ... ] }
            if (!json) continue;

            if (Array.isArray(json) && json.length) {
                foundStaff = json[0];
            } else if (json.id || json.name) {
                // single object
                foundStaff = json;
            } else if (json.staff && Array.isArray(json.staff) && json.staff.length) {
                foundStaff = json.staff[0];
            } else if (json.data && Array.isArray(json.data) && json.data.length) {
                foundStaff = json.data[0];
            } else if (json.staff && typeof json.staff === "object" && (json.staff.id || json.staff.name)) {
                foundStaff = json.staff;
            } else if (json.data && typeof json.data === "object" && (json.data.id || json.data.name)) {
                foundStaff = json.data;
            }

            if (foundStaff) {
                console.log("inventory.js: found staff via fallback url:", u, foundStaff);
                break;
            }
        } catch (e) {
            console.warn("inventory.js: error fetching fallback url", u, e);
        }
    }

    if (!foundStaff) {
        // Last resort: if invAllStaff has at least one item, open the select as-is and notify
        if ((invAllStaff && invAllStaff.length) === 0) {
            showNotification("Could not load staff list. See console for details.", "warning");
            console.warn("inventory.js: no staff found by fallback and invAllStaff empty.");
            // ensure select shows a friendly message
            staffSelect.innerHTML = `<option value="">No staff available</option>`;
        }
        return;
    }

    // Add the found staff into the dropdown (so user can see it) and select it
    // But avoid duplicates: if already present by id skip adding
    const already = Array.from(staffSelect.options).some(o => String(o.value) === String(foundStaff.id));
    if (!already) {
        const opt = document.createElement("option");
        opt.value = foundStaff.id;
        opt.textContent = foundStaff.name || (`Staff ${foundStaff.id}`);
        staffSelect.appendChild(opt);
    }

    // Ensure internal lists contain the staff (makes the rest of the flow consistent)
    invAllStaff = invAllStaff || [];
    if (!invAllStaff.some(s => String(s.id) === String(foundStaff.id))) {
        invAllStaff.push(foundStaff);
    }

    // Re-apply filters so filtered list also contains the staff
    applyStatusFilter();

    // Finally select and load
    staffSelect.value = foundStaff.id;
    handleStaffSelection(foundStaff.id);
    highlightSelectedStaffOption(foundStaff.id);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:172',message:'staff selected via fallback',data:{staffId:foundStaff.id,staffName:foundStaff.name,selectValue:staffSelect.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion agent log
}

/* ============================
   Initialization helpers
   ============================ */

async function checkInventoryApiStatus() {
    if (!STATUS_URL) return;
    try {
        const res = await fetch(STATUS_URL);
        if (!res.ok) {
            console.warn("inventory.js: status endpoint returned", res.status);
            return;
        }
        const j = await res.json();
        console.log("inventory.js: status ->", j);
    } catch (e) {
        console.warn("inventory.js: status check failed:", e);
    }
}

function setDefaultDateToday() {
    const dateInput = document.getElementById("invExpenseDate");
    if (!dateInput) return;
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
}

function initMonthDropdown() {
    const monthSelect = document.getElementById("invMonthSelect");
    if (!monthSelect) return;
    monthSelect.innerHTML = "";
    const today = new Date();
    for (let i = 0; i < 3; i++) {
        const d = new Date();
        d.setMonth(today.getMonth() - i);
        const value = d.toISOString().slice(0, 7);
        const label = d.toLocaleString("default", { month: "long", year: "numeric" });
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        monthSelect.appendChild(opt);
    }
}

function attachEventListeners() {
    const statusSelect = document.getElementById("invStatusSelect");
    const staffSelect = document.getElementById("invStaffSelect");
    const monthSelect = document.getElementById("invMonthSelect");
    const submitBtn = document.getElementById("invSubmitExpense");

    if (statusSelect) statusSelect.addEventListener("change", () => { applyStatusFilter(); });
    if (staffSelect) staffSelect.addEventListener("change", (e) => { handleStaffSelection(e.target.value); });
    if (monthSelect) monthSelect.addEventListener("change", () => { renderExpenses(); calculateTotals(); });
    if (submitBtn) submitBtn.addEventListener("click", handleSubmitExpense);
}

/* ============================
   Staff fetching & filtering
   ============================ */

async function fetchStaffList() {
    const staffSelect = document.getElementById("invStaffSelect");
    if (staffSelect) staffSelect.innerHTML = "<option value=''>Loading staff...</option>";

    try {
        console.log("inventory.js: fetching staff list from", STAFF_API_URL);
        const res = await fetch(STAFF_API_URL, { credentials: "same-origin" });
        if (!res.ok) {
            console.warn("inventory.js: staff list fetch returned status", res.status);
            if (staffSelect) staffSelect.innerHTML = "<option value=''>Failed to load staff</option>";
            return;
        }
        const json = await res.json();

        // Accept many shapes (array, { staff: [...] }, { data: [...] })
        if (Array.isArray(json)) {
            invAllStaff = json;
        } else if (json && Array.isArray(json.staff)) {
            invAllStaff = json.staff;
        } else if (json && Array.isArray(json.data)) {
            invAllStaff = json.data;
        } else if (json && typeof json === "object" && (json.id || json.name)) {
            invAllStaff = [json];
        } else {
            console.warn("inventory.js: staff endpoint returned unexpected shape:", json);
            invAllStaff = [];
        }

        console.log("inventory.js: staff loaded count =", invAllStaff.length);
        applyStatusFilter();
    } catch (e) {
        console.error("inventory.js: error fetching staff list:", e);
        if (document.getElementById("invStaffSelect")) {
            document.getElementById("invStaffSelect").innerHTML = "<option value=''>Error loading staff</option>";
        }
        // rethrow so top-level can handle fallback
        throw e;
    }
}

function applyStatusFilter() {
    const statusSelect = document.getElementById("invStatusSelect");
    const staffSelect = document.getElementById("invStaffSelect");
    if (!staffSelect) return;

    const status = statusSelect ? statusSelect.value : "all";
    invFilteredStaff = (invAllStaff || []).filter(s => {
        if (status === "all") return true;
        return (s.status || "").toLowerCase() === status.toLowerCase();
    });

    staffSelect.innerHTML = '<option value="">Select Staff</option>';
    invFilteredStaff.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name || `Staff ${s.id}`;
        staffSelect.appendChild(opt);
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:290',message:'applyStatusFilter completed',data:{filteredCount:invFilteredStaff.length,dropdownOptions:staffSelect.options.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion agent log

    // Check if there's a pending staff selection from localStorage
    const pendingStaffId = localStorage.getItem("selectedStaffId");
    if (pendingStaffId && invFilteredStaff.some(s => String(s.id) === String(pendingStaffId))) {
        // Staff is now in the dropdown, select it
        setTimeout(() => {
            staffSelect.value = pendingStaffId;
            handleStaffSelection(pendingStaffId);
            highlightSelectedStaffOption(pendingStaffId);
            localStorage.removeItem("selectedStaffId");
        }, 50);
    } else {
        invSelectedStaff = null;
        updateStaffHeader();
        clearExpenses();
    }
}

/* ============================
   Selection, expenses & totals
   ============================ */

function handleStaffSelection(staffId) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:301',message:'handleStaffSelection called',data:{staffId:staffId,invFilteredStaffLength:invFilteredStaff.length,invAllStaffLength:invAllStaff.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion agent log
    
    invSelectedStaff = invFilteredStaff.find(s => String(s.id) === String(staffId)) || null;
    if (!invSelectedStaff) {
        // maybe the staff was added via fallback to invAllStaff but not present in invFilteredStaff;
        // try to get it from invAllStaff
        invSelectedStaff = (invAllStaff || []).find(s => String(s.id) === String(staffId)) || null;
        // if we found it in invAllStaff, include it into filtered list
        if (invSelectedStaff && !invFilteredStaff.some(s => String(s.id) === String(staffId))) {
            invFilteredStaff.push(invSelectedStaff);
        }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:315',message:'staff selection result',data:{staffId:staffId,found:!!invSelectedStaff,staffName:invSelectedStaff?.name,staffSalary:invSelectedStaff?.salary},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion agent log

    updateStaffHeader();
    if (invSelectedStaff) {
        loadExpensesForStaff();
    } else {
        clearExpenses();
    }
}

function updateStaffHeader() {
    const salaryEl = document.getElementById("invStaffSalary");
    // invStaffName may not be present in your HTML — handle gracefully
    const nameEl = document.getElementById("invStaffName");
    if (salaryEl) {
        salaryEl.textContent = invSelectedStaff ? (invSelectedStaff.salary || "0") : "0";
    }
    if (nameEl) {
        nameEl.textContent = invSelectedStaff ? (invSelectedStaff.name || "") : "";
    }
}

async function loadExpensesForStaff() {
    if (!invSelectedStaff) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:333',message:'loadExpensesForStaff called but no staff selected',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion agent log
        renderExpenses();
        calculateTotals();
        return;
    }

    try {
        console.log("inventory.js: loading expenses for staff", invSelectedStaff.id);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:340',message:'fetching expenses from API',data:{staffId:invSelectedStaff.id,expensesUrl:EXPENSES_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion agent log
        
        const res = await fetch(EXPENSES_URL, { credentials: "same-origin" });
        if (!res.ok) {
            console.warn("inventory.js: /expenses returned", res.status);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:345',message:'expenses API returned error status',data:{status:res.status,staffId:invSelectedStaff.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion agent log
            invExpenses = [];
            renderExpenses();
            calculateTotals();
            return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
            console.warn("inventory.js: /expenses returned unexpected shape", data);
            invExpenses = [];
        } else {
            invExpenses = data.filter(exp => String(exp.staff_id) === String(invSelectedStaff.id));
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:356',message:'expenses loaded and filtered',data:{staffId:invSelectedStaff.id,totalExpenses:data.length,filteredExpenses:invExpenses.length,expenseAmounts:invExpenses.map(e=>e.amount)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion agent log
        
        renderExpenses();
        calculateTotals();
    } catch (e) {
        console.error("inventory.js: error loading expenses:", e);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/255f31eb-83ff-4a2e-b4ec-8216608d9181',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'inventory.js:363',message:'error loading expenses',data:{error:e.message,staffId:invSelectedStaff?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion agent log
        invExpenses = [];
        renderExpenses();
        calculateTotals();
    }
}

function clearExpenses() {
    invExpenses = [];
    renderExpenses();
    calculateTotals();
}

function renderExpenses() {
    const tbody = document.getElementById("invExpenseList");
    const emptyState = document.getElementById("invEmptyState");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!invExpenses.length) {
        if (emptyState) emptyState.classList && emptyState.classList.add("show");
        return;
    }
    if (emptyState) emptyState.classList && emptyState.classList.remove("show");

    invExpenses.forEach((exp, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${exp.date || "-"}</td>
      <td>₹${Number(exp.amount || 0).toFixed(2)}</td>
      <td>${exp.note || "-"}</td>
      <td><button class="action-btn" onclick="window.handleDeleteExpense(${exp.id})">🗑️</button></td>
    `;
        tbody.appendChild(tr);
    });
}

window.handleDeleteExpense = async function (expenseId) {
    try {
        const confirmed = await showConfirm("Are you sure you want to delete this expense?", "warning");
        if (!confirmed) return;
        const res = await fetch(`${EXPENSES_URL}/${expenseId}`, { method: "DELETE", credentials: "same-origin" });
        if (!res.ok) throw new Error("Delete failed with status " + res.status);
        invExpenses = invExpenses.filter(e => e.id !== expenseId);
        renderExpenses();
        calculateTotals();
        showNotification("Expense deleted successfully.", "success");
    } catch (e) {
        console.error("inventory.js: failed to delete expense:", e);
        showNotification("Error deleting expense.", "error");
    }
};

function calculateTotals() {
    const totalExpenseEl = document.getElementById("invTotalExpense");
    const balanceEl = document.getElementById("invFinalBalance");
    if (!totalExpenseEl || !balanceEl) return;

    const salary = invSelectedStaff ? Number(invSelectedStaff.salary || 0) : 0;
    const monthSelect = document.getElementById("invMonthSelect");
    const selectedMonth = monthSelect ? monthSelect.value : null;

    let filtered = invExpenses;
    if (selectedMonth) filtered = invExpenses.filter(e => (e.date || "").slice(0, 7) === selectedMonth);

    const totalExpense = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
    const balance = salary - totalExpense;

    totalExpenseEl.textContent = totalExpense.toFixed(2);
    balanceEl.textContent = `₹${balance.toFixed(2)}`;
    balanceEl.style.color = balance >= 0 ? "inherit" : "#991b1b";
}

/* ============================
   Submit expense
   ============================ */
async function handleSubmitExpense() {
    if (!invSelectedStaff) { showNotification("Please select a staff first.", "error"); return; }
    const amountInput = document.getElementById("invExpenseAmount");
    const dateInput = document.getElementById("invExpenseDate");
    const noteInput = document.getElementById("invExpenseNote");
    if (!amountInput || !dateInput) return;

    const amount = Number(amountInput.value);
    const date = dateInput.value;
    const note = noteInput ? noteInput.value.trim() : "";
    if (!amount || !date) { showNotification("Please enter amount and date.", "error"); return; }
    if (amount <= 0) { showNotification("Amount must be greater than zero.", "error"); return; }

    const payload = { staff_id: invSelectedStaff.id, date, amount, note };
    const confirmed = await showConfirm("Are you sure you want to add this expense?", "warning");
    if (!confirmed) return;

    try {
        const res = await fetch(EXPENSES_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("POST failed " + res.status);
        const created = await res.json();
        invExpenses.push(created);
        amountInput.value = "";
        if (noteInput) noteInput.value = "";
        setDefaultDateToday();
        renderExpenses();
        calculateTotals();
        showNotification("Expense added successfully.", "success");
    } catch (e) {
        console.error("inventory.js: error posting expense:", e);
        showNotification("Error while adding expense.", "error");
    }
}

/* ============================
   Small UI helpers
   ============================ */

function highlightSelectedStaffOption(staffId) {
    const staffSelect = document.getElementById("invStaffSelect");
    if (!staffSelect) return;
    Array.from(staffSelect.options).forEach(o => o.classList && o.classList.remove("selected-staff-option"));
    const selectedOpt = Array.from(staffSelect.options).find(o => String(o.value) === String(staffId));
    if (selectedOpt) selectedOpt.classList.add("selected-staff-option");
}

/* Expose for outside use */
window.initInventoryStaffPage = initInventoryStaffPage;
window.renderInventoryStaffPage = renderInventoryStaffPage;
