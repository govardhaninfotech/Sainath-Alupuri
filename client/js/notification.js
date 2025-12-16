// ============================================
// CUSTOM DIALOG NOTIFICATION + CONFIRM SYSTEM
// ============================================

let currentConfirmResolver = null;

export function showNotification(message, type = "info") {
    // Inject styles once
    if (!document.getElementById("customDialogStyles")) {
        const style = document.createElement("style");
        style.id = "customDialogStyles";
        style.textContent = `
        .custom-dialog-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.45);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }

        .custom-dialog-overlay.show {
            display: flex;
        }

        .custom-dialog-box {
            background: #ffffff;
            padding: 20px 24px;
            border-radius: 16px;
            max-width: 320px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(15, 23, 42, 0.35);
            text-align: center;
            font-family: system-ui, sans-serif;
            transform: translateY(20px);
            opacity: 0;
            transition: all 0.25s ease;
        }

        .custom-dialog-overlay.show .custom-dialog-box {
            transform: translateY(0);
            opacity: 1;
        }

        .custom-dialog-icon {
            font-size: 32px;
            margin-bottom: 8px;
        }

        .custom-dialog-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .custom-dialog-message {
            font-size: 15px;
            margin-bottom: 16px;
            color: #4b5563;
        }

        .custom-dialog-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
        }

        .custom-dialog-btn {
            border: none;
            border-radius: 999px;
            padding: 8px 18px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
        }

        .custom-dialog-btn-primary {
            background: linear-gradient(135deg, #4f46e5, #6366f1);
            color: white;
        }

        .custom-dialog-btn-secondary {
            background: #e5e7eb;
            color: #374151;
        }

        .custom-dialog-success .custom-dialog-icon { color: #16a34a; }
        .custom-dialog-error .custom-dialog-icon { color: #dc2626; }
        .custom-dialog-warning .custom-dialog-icon { color: #f59e0b; }
        .custom-dialog-info .custom-dialog-icon { color: #2563eb; }
        `;
        document.head.appendChild(style);
    }

    // Create dialog DOM once
    let overlay = document.getElementById("customDialogOverlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "customDialogOverlay";
        overlay.className = "custom-dialog-overlay";

        overlay.innerHTML = `
            <div id="customDialogBox" class="custom-dialog-box">
                <div id="customDialogIcon" class="custom-dialog-icon">✔</div>
                <div id="customDialogTitle" class="custom-dialog-title">Success</div>
                <div id="customDialogMessage" class="custom-dialog-message">Message here</div>
                <div class="custom-dialog-actions">
                    <button id="customDialogOk" class="custom-dialog-btn custom-dialog-btn-primary">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const okBtn = document.getElementById("customDialogOk");
        okBtn.addEventListener("click", () => {
            overlay.classList.remove("show");
            // if we were in confirm mode, OK acts like "Yes"
            if (currentConfirmResolver) {
                currentConfirmResolver(true);
                currentConfirmResolver = null;
            }
        });

        // close when clicking outside box
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                overlay.classList.remove("show");
                // In confirm mode, clicking outside = cancel
                if (currentConfirmResolver) {
                    currentConfirmResolver(false);
                    currentConfirmResolver = null;
                }
            }
        });
    }

    const box = document.getElementById("customDialogBox");
    const icon = document.getElementById("customDialogIcon");
    const title = document.getElementById("customDialogTitle");
    const msg = document.getElementById("customDialogMessage");
    const okBtn = document.getElementById("customDialogOk");

    // No pending confirm for simple notification
    currentConfirmResolver = null;

    // Reset classes
    box.classList.remove("custom-dialog-success", "custom-dialog-error", "custom-dialog-warning", "custom-dialog-info");

    // ICONS + TITLES
    let iconChar = "ℹ";
    let titleText = "Info";
    let typeClass = "custom-dialog-info";

    if (type === "success") {
        iconChar = "✔";
        titleText = "Success";
        typeClass = "custom-dialog-success";
    } else if (type === "error") {
        iconChar = "✖";
        titleText = "Error";
        typeClass = "custom-dialog-error";
    } else if (type === "warning") {
        iconChar = "⚠";
        titleText = "Warning";
        typeClass = "custom-dialog-warning";
    }

    icon.textContent = iconChar;
    title.textContent = titleText;
    msg.textContent = message;
    box.classList.add(typeClass);

    // Show only OK button for normal notification
    okBtn.style.display = "inline-block";

    // Hide confirm buttons if they exist
    const yesBtn = document.getElementById("customDialogYes");
    const noBtn = document.getElementById("customDialogNo");
    if (yesBtn) yesBtn.style.display = "none";
    if (noBtn) noBtn.style.display = "none";

    // Show dialog
    overlay.classList.add("show");

    // Auto-close for success/info
    if (type === "success" || type === "info") {
        setTimeout(() => {
            overlay.classList.remove("show");
        }, 2500);
    }
}

// New: confirm dialog with Yes / No
export function showConfirm(message, type = "warning") {
    return new Promise((resolve) => {
        // Ensure base notification DOM exists
        showNotification(message, type); // this sets text, icon, classes, etc.

        const overlay = document.getElementById("customDialogOverlay");
        const box = document.getElementById("customDialogBox");
        const okBtn = document.getElementById("customDialogOk");
        const actions = box.querySelector(".custom-dialog-actions");

        // We are now in confirm mode
        currentConfirmResolver = resolve;

        // Hide OK for confirm
        okBtn.style.display = "none";

        // Create Yes/No buttons if not exist
        let yesBtn = document.getElementById("customDialogYes");
        let noBtn = document.getElementById("customDialogNo");

        if (!yesBtn) {
            yesBtn = document.createElement("button");
            yesBtn.id = "customDialogYes";
            yesBtn.className = "custom-dialog-btn custom-dialog-btn-primary";
            yesBtn.textContent = "Yes";
            actions.appendChild(yesBtn);
        }

        if (!noBtn) {
            noBtn = document.createElement("button");
            noBtn.id = "customDialogNo";
            noBtn.className = "custom-dialog-btn custom-dialog-btn-secondary";
            noBtn.textContent = "No";
            actions.appendChild(noBtn);
        }

        yesBtn.style.display = "inline-block";
        noBtn.style.display = "inline-block";

        // Clean previous listeners by cloning (simple trick)
        const newYesBtn = yesBtn.cloneNode(true);
        const newNoBtn = noBtn.cloneNode(true);
        actions.replaceChild(newYesBtn, yesBtn);
        actions.replaceChild(newNoBtn, noBtn);

        newYesBtn.addEventListener("click", () => {
            overlay.classList.remove("show");
            if (currentConfirmResolver) {
                currentConfirmResolver(true);
                currentConfirmResolver = null;
            }
        });

        newNoBtn.addEventListener("click", () => {
            overlay.classList.remove("show");
            if (currentConfirmResolver) {
                currentConfirmResolver(false);
                currentConfirmResolver = null;
            }
        });

        // For confirm, do NOT auto-close via timeout
    });
}

// Make it available globally if needed
window.showNotification = showNotification;
window.showConfirm = showConfirm;
