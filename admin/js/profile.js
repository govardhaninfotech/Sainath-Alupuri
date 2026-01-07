// ============================================
// USER PROFILE PAGE - PROFESSIONAL DESIGN
// ============================================

import { showNotification } from "./notification.js";

// Get current user from localStorage/sessionStorage
const currentUser = JSON.parse(
    localStorage.getItem("rememberedUser") || 
    sessionStorage.getItem("rememberedUser") || 
    "null"
);

if (!currentUser || !currentUser.id) {
    console.error("User not logged in");
    window.location.replace("../index.html");
}

// ============================================
// RENDER PROFILE PAGE
// ============================================
export function renderProfilePage() {
    // return generateProfileHTML();
    return `<h1>Profile Page</h1>`;
}

// Generate profile content HTML
function generateProfileHTML() {
    const initials = (currentUser?.name || "U")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase())
        .join("");

    const userRole = currentUser?.role || "User";
    const userStatus = currentUser?.status || "active";
    const isFamilyMember = currentUser?.is_family_member === "True" || currentUser?.is_family_member === true;

    return `
        <div class="profile-container">
            <!-- Header Section -->
            <div class="profile-header">
                <div class="profile-avatar">
                    <div class="avatar-circle">${initials}</div>
                </div>
                
                <div class="profile-header-info">
                    <h1>${currentUser.name || "User"}</h1>
                    <p class="role-text">${userRole.charAt(0).toUpperCase() + userRole.slice(1)}</p>
                    <div class="status-group">
                        <span class="status-badge ${userStatus}">${userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}</span>
                        ${isFamilyMember ? '<span class="badge-info">Family Member</span>' : ''}
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="profile-main">
                <!-- User Information Section -->
                <div class="section user-section">
                    <div class="section-title">
                        <h2>User Information</h2>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-row">
                            <label>Name</label>
                            <span class="info-value">${currentUser.name || "N/A"}</span>
                        </div>
                        
                        <div class="info-row">
                            <label>User ID</label>
                            <span class="info-value">${currentUser.id || "N/A"}</span>
                        </div>
                        
                        <div class="info-row">
                            <label>Role</label>
                            <span class="info-value">${userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>
                        </div>
                        
                        <div class="info-row">
                            <label>Status</label>
                            <span class="info-value">${userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}</span>
                        </div>
                    </div>
                </div>

                <!-- Contact Information Section -->
                <div class="section contact-section">
                    <div class="section-title">
                        <h2>Contact Information</h2>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-row">
                            <label>Email</label>
                            <span class="info-value">${currentUser.email || "N/A"}</span>
                        </div>
                        
                        <div class="info-row">
                            <label>Mobile</label>
                            <span class="info-value">${currentUser.mobile || "N/A"}</span>
                        </div>
                        
                        <div class="info-row full-width">
                            <label>Address</label>
                            <span class="info-value">${currentUser.address || "N/A"}</span>
                        </div>
                    </div>
                </div>

                <!-- Location Information Section -->
                <div class="section location-section">
                    <div class="section-title">
                        <h2>Location</h2>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-row">
                            <label>City</label>
                            <span class="info-value">${currentUser.city || "N/A"}</span>
                        </div>
                        
                        <div class="info-row">
                            <label>State</label>
                            <span class="info-value">${currentUser.state || "N/A"}</span>
                        </div>
                        
                        <div class="info-row">
                            <label>Country</label>
                            <span class="info-value">${currentUser.country || "N/A"}</span>
                        </div>
                        
                        <div class="info-row">
                            <label>Pincode</label>
                            <span class="info-value">${currentUser.pincode || "N/A"}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Actions -->
            <div class="profile-footer">
                <button class="btn-action btn-logout" onclick="logoutUser()">
                    Logout
                </button>
            </div>
        </div>

        <style>
            .profile-container {
                background: #fff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            .profile-header {
                background: #f8f9fa;
                padding: 40px;
                display: flex;
                align-items: center;
                gap: 30px;
                border-bottom: 1px solid #e5e7eb;
            }

            .profile-avatar {
                flex-shrink: 0;
            }

            .avatar-circle {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
                font-weight: 700;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            .profile-header-info {
                flex: 1;
            }

            .profile-header-info h1 {
                margin: 0 0 8px 0;
                font-size: 28px;
                font-weight: 600;
                color: #1f2937;
            }

            .role-text {
                margin: 0 0 12px 0;
                font-size: 16px;
                color: #6b7280;
            }

            .status-group {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
            }

            .status-badge.active {
                background: #d1fae5;
                color: #065f46;
            }

            .status-badge.inactive {
                background: #fee2e2;
                color: #7f1d1d;
            }

            .badge-info {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                background: #dbeafe;
                color: #0c4a6e;
            }

            .profile-main {
                padding: 40px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 30px;
            }

            .section {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                padding: 24px;
            }

            .section-title {
                margin-bottom: 20px;
                padding-bottom: 12px;
                border-bottom: 2px solid #e5e7eb;
            }

            .section-title h2 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
            }

            .info-grid {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .info-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .info-row.full-width {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }

            .info-row label {
                font-weight: 500;
                color: #6b7280;
                font-size: 13px;
            }

            .info-value {
                color: #1f2937;
                font-weight: 500;
                font-size: 14px;
            }

            .profile-footer {
                padding: 20px 40px;
                background: #f9fafb;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: flex-end;
            }

            .btn-action {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                font-size: 14px;
                transition: all 0.3s;
                min-height: 40px;
            }

            .btn-logout {
                background: #ef4444;
                color: white;
            }

            .btn-logout:hover {
                background: #dc2626;
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            }

            @media (max-width: 768px) {
                .profile-header {
                    padding: 24px;
                    flex-direction: column;
                    text-align: center;
                }

                .profile-header-info h1 {
                    font-size: 22px;
                }

                .profile-main {
                    padding: 20px;
                    grid-template-columns: 1fr;
                    gap: 20px;
                }

                .section {
                    padding: 16px;
                }

                .profile-footer {
                    padding: 16px 20px;
                }

                .info-row {
                    flex-direction: column;
                    align-items: flex-start;
                }
            }
        </style>
    `;
}

// ============================================
// LOGOUT FUNCTION
// ============================================
function logoutUser() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("rememberedUser");
        sessionStorage.removeItem("rememberedUser");
        window.location.replace("../index.html");
    }
}

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.renderProfilePage = renderProfilePage;
window.logoutUser = logoutUser;


