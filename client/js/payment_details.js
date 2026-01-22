// payment_details.js - Payment Details Page with QR Code and Bank Information

// ⭐ STATIC PAYMENT DETAILS - Update these values with your actual details
const STATIC_BANK_DETAILS = [
    {
        id: 1,
        account_holder_name: "SAINATH ALUPURI",
        bank_name: "State Bank of India",
        account_number: "1234567890",
        ifsc_code: "SBIN0001234",
        upi_id: "sainath@sbi",
        branch: "Main Branch"
    }
    // You can add more bank accounts here if needed
    // {
    //     id: 2,
    //     account_holder_name: "SAINATH CATERERS",
    //     bank_name: "HDFC Bank",
    //     account_number: "0987654321",
    //     ifsc_code: "HDFC0001234",
    //     upi_id: "sainath@hdfcbank",
    //     branch: "SG Highway Branch"
    // }
];

// Get static bank details (no API call)
function getBankDetails() {
    return STATIC_BANK_DETAILS;
}

// Generate UPI QR Code
function generateUPIQRCode(upiId, name, amount = "") {
    // UPI payment URL format
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}${amount ? `&am=${amount}` : ""}`;
    
    // Use a QR code API to generate the image
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
    
    return qrCodeUrl;
}

// Render Payment Details Page
export function renderPaymentDetailsPage() {
    const bankDetails = getBankDetails();

    // If no bank details found
    if (!bankDetails || bankDetails.length === 0) {
        return `
            <div class="content-card">
                <div style="text-align: center; padding: 40px;">
                    <h2 style="color: #6b7280; margin-bottom: 16px;">No Payment Details Available</h2>
                    <p style="color: #9ca3af;">Please add bank/UPI details in the Master section.</p>
                    <button onclick="navigateTo('bank')" style="
                        margin-top: 20px;
                        padding: 10px 24px;
                        background: #667eea;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                        Add Bank Details
                    </button>
                </div>
            </div>
        `;
    }

    // Render bank details cards
    const bankCards = bankDetails.map((bank) => {
        const qrCodeUrl = bank.upi_id ? generateUPIQRCode(bank.upi_id, bank.account_holder_name) : null;

        return `
            <div class="bank-card" style="
                background: white;
                border-radius: 12px;
                padding: 24px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                margin-bottom: 20px;
                border: 1px solid #e5e7eb;
            ">
                <div class="bank-card-grid" style="
                    display: grid;
                    grid-template-columns: 1fr auto;
                    gap: 24px;
                    align-items: start;
                ">
                    <!-- Bank Details Section -->
                    <div class="bank-details-section">
                        <h3 style="color: #1f2937; margin-bottom: 20px; font-size: 20px; font-weight: 600;">
                            💳 Payment Details
                        </h3>
                        
                        <div class="detail-row" style="margin-bottom: 16px;">
                            <label style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">
                                Account Holder Name
                            </label>
                            <div style="color: #1f2937; font-size: 16px; font-weight: 500;">
                                ${bank.account_holder_name || "N/A"}
                            </div>
                        </div>

                        <div class="detail-row" style="margin-bottom: 16px;">
                            <label style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">
                                Bank Name
                            </label>
                            <div style="color: #1f2937; font-size: 16px; font-weight: 500;">
                                ${bank.bank_name || "N/A"}
                            </div>
                        </div>

                        <div class="account-details-grid" style="
                            display: grid;
                            grid-template-columns: 1fr;
                            gap: 16px;
                            margin-bottom: 16px;
                        ">
                            <div class="detail-row">
                                <label style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">
                                    Account Number
                                </label>
                                <div style="color: #1f2937; font-size: 16px; font-weight: 500; font-family: monospace; word-break: break-all;">
                                    ${bank.account_number || "N/A"}
                                </div>
                            </div>

                            <div class="detail-row">
                                <label style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">
                                    IFSC Code
                                </label>
                                <div style="color: #1f2937; font-size: 16px; font-weight: 500; font-family: monospace;">
                                    ${bank.ifsc_code || "N/A"}
                                </div>
                            </div>
                        </div>

                        ${bank.upi_id ? `
                            <div class="detail-row" style="margin-bottom: 16px;">
                                <label style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">
                                    UPI ID
                                </label>
                                <div style="color: #1f2937; font-size: 16px; font-weight: 500; font-family: monospace; word-break: break-all;">
                                    ${bank.upi_id}
                                </div>
                            </div>
                        ` : ""}

                        ${bank.branch ? `
                            <div class="detail-row">
                                <label style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">
                                    Branch
                                </label>
                                <div style="color: #1f2937; font-size: 16px;">
                                    ${bank.branch}
                                </div>
                            </div>
                        ` : ""}
                    </div>

                    <!-- QR Code Section -->
                    ${qrCodeUrl ? `
                        <div class="qr-code-section" style="text-align: center;">
                            <label style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 12px;">
                                Scan to Pay
                            </label>
                            <div style="
                                background: white;
                                padding: 12px;
                                border-radius: 12px;
                                border: 2px solid #667eea;
                                display: inline-block;
                            ">
                                <img src="${qrCodeUrl}" alt="UPI QR Code" style="
                                    width: 200px;
                                    height: 200px;
                                    display: block;
                                ">
                            </div>
                            <div style="margin-top: 8px; color: #6b7280; font-size: 12px;">
                                UPI Payment QR Code
                            </div>
                        </div>
                    ` : ""}
                </div>

                <!-- Action Buttons -->
                <div class="action-buttons" style="
                    margin-top: 24px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    width:40%
                ">
                    <button onclick="copyBankDetails(${bank.id})" style="
                        padding: 10px 20px;
                        background: #667eea;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: background 0.2s;
                        flex: 1;
                        min-width: 140px;
                    " onmouseover="this.style.background='#5568d3'" onmouseout="this.style.background='#667eea'">
                        📋 Copy Details
                    </button>
                    
                    ${qrCodeUrl ? `
                        <button onclick="downloadQRCode('${qrCodeUrl}', '${bank.account_holder_name}')" style="
                            padding: 10px 20px;
                            background: #10b981;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 500;
                            transition: background 0.2s;
                            flex: 1;
                            min-width: 140px;
                        " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                            📥 Download QR Code
                        </button>
                    ` : ""}
                </div>
            </div>

            <style>
                /* Mobile Responsive Styles */
                @media screen and (max-width: 768px) {
                    .bank-card-grid {
                        grid-template-columns: 1fr !important;
                        gap: 20px !important;
                    }

                    .qr-code-section {
                        order: -1;
                        margin-bottom: 20px;
                    }

                    .account-details-grid {
                        grid-template-columns: 1fr !important;
                    }

                    .action-buttons {
                        flex-direction: column !important;
                        width:100% !important;
                    }

                    .action-buttons button {
                        width: 100% !important;
                        min-width: unset !important;
                    }

                    .bank-card {
                        padding: 16px !important;
                    }

                    .bank-details-section h3 {
                        font-size: 18px !important;
                    }
                }

                @media screen and (max-width: 480px) {
                    .qr-code-section img {
                        width: 150px !important;
                        height: 150px !important;
                    }

                    .detail-row label {
                        font-size: 12px !important;
                    }

                    .detail-row div {
                        font-size: 14px !important;
                    }
                }
            </style>
        `;
    }).join("");

    return `
        <div class="content-card">
            <div class="header-section" style="
                margin-bottom: 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 16px;
            ">
                <div>
                    <h2 style="color: #1f2937; margin-bottom: 8px;">Payment Details</h2>
                    <p style="color: #6b7280; font-size: 14px;">Bank account and UPI payment information</p>
                </div>
                <!-- <button onclick="navigateTo('bank')" style="
                    padding: 10px 20px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                ">
                    ⚙️ Manage Bank Details
                </button> -->
            </div>

            ${bankCards}
        </div>

        <style>
            /* Additional responsive styles for header */
            @media screen and (max-width: 640px) {
                .header-section {
                    flex-direction: column;
                    align-items: flex-start !important;
                }

                .header-section button {
                    width: 100%;
                }

                .content-card {
                    padding: 16px !important;
                }

                .content-card h2 {
                    font-size: 20px !important;
                }

                .content-card p {
                    font-size: 13px !important;
                }
            }
        </style>
    `;
}

// Copy bank details to clipboard
window.copyBankDetails = function(bankId) {
    const bankDetails = getBankDetails();
    const bank = bankDetails.find(b => b.id === bankId);
    
    if (!bank) return;

    const details = `
Payment Details:
Account Holder: ${bank.account_holder_name || "N/A"}
Bank Name: ${bank.bank_name || "N/A"}
Account Number: ${bank.account_number || "N/A"}
IFSC Code: ${bank.ifsc_code || "N/A"}
${bank.upi_id ? `UPI ID: ${bank.upi_id}` : ""}
${bank.branch ? `Branch: ${bank.branch}` : ""}
    `.trim();

    try {
        navigator.clipboard.writeText(details);
        alert("✅ Payment details copied to clipboard!");
    } catch (error) {
        console.error("Failed to copy:", error);
        alert("❌ Failed to copy details");
    }
};

// Download QR Code
window.downloadQRCode = function(qrCodeUrl, accountHolderName) {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `QR_Code_${accountHolderName.replace(/\s+/g, "_")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};