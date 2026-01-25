// ============================================
// COMPANY INFO PAGE
// ============================================

import { companyProfileURLphp } from "../apis/api.js";
import { getItemsData } from "../apis/master_api.js";
import { showNotification } from "./notification.js";

// Company info data
let companyData = null;
let isCompanyModalOpen = false;
let hasCompanyData = false;

function getLoggedInUserId() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    return user ? user.id : null;
}

// ============================================
// LOAD COMPANY INFO FROM API
// ============================================
async function loadCompanyInfoFromAPI() {
    try {
        console.log("📡 Fetching company info from API:", companyProfileURLphp);
        const data = await getItemsData(`${companyProfileURLphp}?user_id=${getLoggedInUserId()}`);
        console.log("✅ Company info received:", data);

        if (Array.isArray(data) && data.length > 0) {
            return data[0];
        } else if (data && data.company) {
            return data.company;
        } else if (data && data.data) {
            return data.data;
        }
        return null;
    } catch (error) {
        console.error("❌ Error loading company info:", error);
        return null;
    }
}

// ============================================
// RENDER COMPANY INFO PAGE
// ============================================
export async function renderCompanyInfoPage() {
    
    // Prevent re-render if modal is open
    if (isCompanyModalOpen) return;

    // Load company data from API
    const apiData = await loadCompanyInfoFromAPI();
    companyData = apiData;
    hasCompanyData = apiData ? true : false;

    const mainContent = document.getElementById("mainContent");
    mainContent.innerHTML = generateCompanyInfoHTML();

    initCompanyInfoEventListeners();
}

// ============================================
// GENERATE COMPANY INFO PAGE HTML
// ============================================
function generateCompanyInfoHTML() {
    if (hasCompanyData && companyData) {
        return generateCompanyDisplayView();
    } else {
        return generateCompanyFormView();
    }
}

// ============================================
// GENERATE DISPLAY VIEW (WHEN DATA EXISTS)
// ============================================
function generateCompanyDisplayView() {
    const companyName = companyData.company_name || "N/A";
    const address = companyData.address || "N/A";
    const gstNumber = companyData.gst_number || "N/A";
    const cgst = companyData.cgst || "N/A";
    const sgst = companyData.sgst || "N/A";
    const igst = companyData.igst || "N/A";

    return `
        <div class="company-container">

            <div class="company-header">
                <div class="company-header-content">    
                    <img src="./images/logo.png" alt="Sainath Alupuri" class="company-logo">
                    <div class="company-header-text">
                        <h1>Sainath Alupuri</h1>
                        <p>GST and tax information</p>
                    </div>
                </div>
            </div>

            <div class="company-info-display">
                <div class="info-card">
                    <div class="info-field">
                        <label>Company Name</label>
                        <div class="info-value">${companyName}</div>
                    </div>

                    <div class="info-field">
                        <label>Address</label>
                        <div class="info-value">${address}</div>
                    </div>

                    <div class="info-field">
                        <label>GST Number</label>
                        <div class="info-value">${gstNumber}</div>
                    </div>

                    <div class="info-field">
                        <label>CGST (%)</label>
                        <div class="info-value">${cgst}</div>
                    </div>

                    <div class="info-field">
                        <label>SGST (%)</label>
                        <div class="info-value">${sgst}</div>
                    </div>

                    <div class="info-field">
                        <label>IGST (%)</label>
                        <div class="info-value">${igst}</div>
                    </div>
                </div>

                <div class="company-actions">
                    <button class="btn-edit" onclick="openCompanyInfoForm()">✏️ Edit</button>
                    <button class="btn-reset" onclick="resetCompanyInfo()">🔄 Reset</button>
                </div>
            </div>

            <!-- Edit Modal -->
            <div id="companyModal" class="modal-overlay">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>Edit Company Information</h2>
                        <button type="button" class="modal-close" onclick="closeCompanyInfoForm()">✕</button>
                    </div>

                    <form id="companyForm" onclick="event.stopPropagation()">
                        <div class="form-group">
                            <label>Company Name *</label>
                            <input type="text" id="companyName" value="${companyName}" required>
                        </div>

                        <style>
                            #addressGroup textarea {
                                max-width: 100% !important;
                            }
                        </style>
                        <div class="group1" id="addressGroup">
                            <label>Address *</label>
                            <textarea id="companyAddress" style="width: 100% !important;" required>${address}</textarea>
                        </div>

                        <div class="form-group">
                            <label>GST Number *</label>
                            <input type="text" id="companyGST" value="${gstNumber}" required>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>CGST (%) *</label>
                                <input type="number" id="companyCGST" value="${cgst}" step="0.01" required>
                            </div>

                            <div class="form-group">
                                <label>SGST (%) *</label>
                                <input type="number" id="companySGST" value="${sgst}" step="0.01" required>
                            </div>

                            <div class="form-group">
                                <label>IGST (%) *</label>
                                <input type="number" id="companyIGST" value="${igst}" step="0.01" required>
                            </div>
                        </div>

                        <div class="modal-buttons">
                            <button type="button" class="btn-reset" onclick="resetCompanyForm()">Reset</button>
                            <button type="button" class="btn-send" onclick="updateCompanyInfo()">Update</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// GENERATE FORM VIEW (WHEN NO DATA)
// ============================================
function generateCompanyFormView() {
    return `
        <div class="company-container">
   

            <div class="company-header">
                <div class="company-header-content">
                    <img src="./images/logo.png" alt="Sainath Alupuri" class="company-logo">
                    <div class="company-header-text">
                        <h1>Sainath Alupuri</h1>
                        <p>Add GST and tax information</p>
                    </div>
                </div>
            </div>

            <div class="company-form-view">
                <div class="form-card">
                    <form id="companyForm" onclick="event.stopPropagation()">
                        <div class="form-group">
                            <label>Company Name *</label>
                            <input type="text" id="companyName" placeholder="Enter company name" required>
                        </div>

                        <div class="form-group">
                            <label>Address *</label>
                            <textarea id="companyAddress" placeholder="Enter company address" required></textarea>
                        </div>

                        <div class="form-group">
                            <label>GST Number *</label>
                            <input type="text" id="companyGST" placeholder="Enter GST number" required>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>CGST (%) *</label>
                                <input type="number" id="companyCGST" placeholder="0.00" step="0.01" required>
                            </div>

                            <div class="form-group">
                                <label>SGST (%) *</label>
                                <input type="number" id="companySGST" placeholder="0.00" step="0.01" required>
                            </div>

                            <div class="form-group">
                                <label>IGST (%) *</label>
                                <input type="number" id="companyIGST" placeholder="0.00" step="0.01" required>
                            </div>
                        </div>

                        <div class="modal-buttons">
                            <button type="button" class="btn-reset" onclick="resetCompanyForm()">Reset</button>
                            <button type="button" class="btn-send" onclick="saveCompanyInfo()">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// INITIALIZE EVENTS
// ============================================
function initCompanyInfoEventListeners() {
    window.openCompanyInfoForm = openCompanyInfoForm;
    window.closeCompanyInfoForm = closeCompanyInfoForm;
    window.saveCompanyInfo = saveCompanyInfo;
    window.updateCompanyInfo = updateCompanyInfo;
    window.resetCompanyInfo = resetCompanyInfo;
    window.resetCompanyForm = resetCompanyForm;

    const modal = document.getElementById("companyModal");
    if (modal) {
        const newModal = modal.cloneNode(true);
        modal.parentNode.replaceChild(newModal, modal);
        
        const clonedModal = document.getElementById("companyModal");
        clonedModal.addEventListener("click", function (event) {
            if (event.target === this && event.target.className === "modal-overlay") {
                closeCompanyInfoForm();
            }
        });
        
        const modalContent = clonedModal.querySelector(".modal-content");
        if (modalContent) {
            modalContent.addEventListener("click", function (event) {
                event.stopPropagation();
            });
        }
    }
}

// ============================================
// OPEN FORM MODAL
// ============================================
function openCompanyInfoForm() {
    console.log("🔓 Opening company info form");
    const modal = document.getElementById("companyModal");
    if (modal) {
        modal.classList.add("active");
        isCompanyModalOpen = true;
    }
}

// ============================================
// CLOSE FORM MODAL
// ============================================
function closeCompanyInfoForm() {
    console.log("🔒 Closing company info form");
    const modal = document.getElementById("companyModal");
    if (modal) {
        modal.classList.remove("active");
        isCompanyModalOpen = false;
    }
}

// ============================================
// RESET FORM FIELDS
// ============================================
function resetCompanyForm() {
    document.getElementById("companyForm").reset();
}

// ============================================
// SAVE COMPANY INFO (NEW)
// ============================================
async function saveCompanyInfo() {
    const companyName = document.getElementById("companyName").value.trim();
    const address = document.getElementById("companyAddress").value.trim();
    const gstNumber = document.getElementById("companyGST").value.trim();
    const cgst = document.getElementById("companyCGST").value.trim();
    const sgst = document.getElementById("companySGST").value.trim();
    const igst = document.getElementById("companyIGST").value.trim();

    if (!companyName || !address || !gstNumber || !cgst || !sgst || !igst) {
        showNotification("Please fill in all fields", "warning");
        return;
    }

    try {
        const formData = new FormData();
        formData.append("company_name", companyName);
        formData.append("address", address);
        formData.append("gst_number", gstNumber);
        formData.append("cgst", cgst);
        formData.append("sgst", sgst);
        formData.append("igst", igst);

        const response = await fetch(companyProfileURLphp, {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        console.log("📤 Save response:", result);

        if (result.success || result.status === "success") {
            showNotification("Company information saved successfully!", "success");
            setTimeout(() => {
                renderCompanyInfoPage();
            }, 1000);
        } else {
            showNotification("Error saving company information", "error");
        }
    } catch (error) {
        console.error("❌ Error saving company info:", error);
        showNotification("Error saving company information", "error");
    }
}

// ============================================
// UPDATE COMPANY INFO (EXISTING)
// ============================================
async function updateCompanyInfo() {
    const companyName = document.getElementById("companyName").value.trim();
    const address = document.getElementById("companyAddress").value.trim();
    const gstNumber = document.getElementById("companyGST").value.trim();
    const cgst = document.getElementById("companyCGST").value.trim();
    const sgst = document.getElementById("companySGST").value.trim();
    const igst = document.getElementById("companyIGST").value.trim();

    if (!companyName || !address || !gstNumber || !cgst || !sgst || !igst) {
        showNotification("Please fill in all fields", "warning");
        return;
    }

    try {
        const formData = new FormData();
        formData.append("id", companyData.id);
        formData.append("company_name", companyName);
        formData.append("address", address);
        formData.append("gst_number", gstNumber);
        formData.append("cgst", cgst);
        formData.append("sgst", sgst);
        formData.append("igst", igst);

        const response = await fetch(`${companyProfileURLphp}?id=${companyData.id}`, {
            method: "PATCH",
            body: formData
        });

        const result = await response.json();
        console.log("📤 Update response:", result);

        if (result.success || result.status === "success") {
            showNotification("Company information updated successfully!", "success");
            closeCompanyInfoForm();
            setTimeout(() => {
                renderCompanyInfoPage();
            }, 1000);
        } else {
            showNotification("Error updating company information", "error");
        }
    } catch (error) {
        console.error("❌ Error updating company info:", error);
        showNotification("Error updating company information", "error");
    }
}

// ============================================
// RESET COMPANY DATA (DELETE/CLEAR)
// ============================================
async function resetCompanyInfo() {
    if (!confirm("Are you sure you want to delete this company information? This action cannot be undone.")) {
        return;
    }

    try {
        const response = await fetch(`${companyProfileURLphp}?id=${companyData.id}`, {
            method: "DELETE"
        });

        const result = await response.json();
        console.log("🗑️ Delete response:", result);

        if (result.success || result.status === "success") {
            showNotification("Company information deleted successfully!", "success");
            setTimeout(() => {
                renderCompanyInfoPage();
            }, 1000);
        } else {
            showNotification("Error deleting company information", "error");
        }
    } catch (error) {
        console.error("❌ Error deleting company info:", error);
        showNotification("Error deleting company information", "error");
    }
}
