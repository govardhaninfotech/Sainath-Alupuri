export function validateIndianMobile(mobile) {
    if (!mobile) {
        return { status: false, message: "Mobile number is required" };
    }

    // Remove spaces if user typed with space
    mobile = mobile.trim();

    // Indian 10-digit pattern starting with 6-9
    const pattern = /^[6-9]\d{9}$/;

    if (!pattern.test(mobile)) {
        return {
            status: false,
            message: "Enter a valid 10-digit Indian mobile number"
        };
    }

    return { status: true };
}

// ============================================
// DATE VALIDATION
// ============================================
export function validateDate(dateValue) {
    if (!dateValue || dateValue.length === 0) {
        return { status: false, message: "Date is required" };
    }

    const selectedDate = new Date(dateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        return { status: false, message: "Date cannot be in the past" };
    }

    return { status: true };
}

// ============================================
// CREDIT LIMIT VALIDATION
// ============================================
export function validateCreditLimit(creditLimit) {
    if (!creditLimit || creditLimit === "") {
        return { status: false, message: "Credit limit is required" };
    }

    const limit = parseFloat(creditLimit);

    if (isNaN(limit) || limit <= 0) {
        return { status: false, message: "Credit limit must be greater than 0" };
    }

    return { status: true };
}

// ============================================
// BALANCE VALIDATION
// ============================================
export function validateBalance(balance) {
    if (balance === "" || balance === null || balance === undefined) {
        return { status: false, message: "Current balance is required" };
    }

    const balanceValue = parseFloat(balance);

    if (isNaN(balanceValue)) {
        return { status: false, message: "Current balance must be a valid number" };
    }

    // Balance can be negative, so we only check if it's a valid number
    return { status: true };
}

// ============================================
// SALARY VALIDATION
// ============================================
export function validateSalary(salary) {
    if (!salary || salary === "") {
        return { status: false, message: "Salary is required" };
    }

    const salaryValue = parseFloat(salary);

    if (isNaN(salaryValue) || salaryValue <= 0) {
        return { status: false, message: "Salary must be greater than 0" };
    }

    return { status: true };
}

// ============================================
// REQUIRED TEXT FIELD VALIDATION
// ============================================
export function validateRequiredField(value, fieldName, minLength = 0) {
    if (!value || value.trim().length === 0) {
        return { status: false, message: `${fieldName} is required` };
    }

    if (minLength > 0 && value.trim().length < minLength) {
        return { status: false, message: `${fieldName} must be at least ${minLength} characters` };
    }

    return { status: true };
}

// ============================================
// EMAIL VALIDATION
// ============================================
export function validateEmail(email) {
    if (!email || email.trim().length === 0) {
        return { status: false, message: "Email is required" };
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        return { status: false, message: "Enter a valid email address" };
    }

    return { status: true };
}

// ============================================
// AADHAR CARD NUMBER VALIDATION
// ============================================
export function validateAadharNumber(aadhar) {
    if (!aadhar) {
        return { status: false, message: "Aadhar card number is required" };
    }

    // Remove spaces if user typed with space
    aadhar = aadhar.trim();

    // Indian Aadhar is 12 digits
    const pattern = /^\d{12}$/;

    if (!pattern.test(aadhar)) {
        return {
            status: false,
            message: "Enter a valid 12-digit Aadhar card number"
        };
    }

    return { status: true };
}

// ============================================
// SETUP GLOBAL ESC KEY HANDLER
// ============================================
export function setupEscKeyHandler() {
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" || event.keyCode === 27) {
            // Close all visible modals
            const modals = document.querySelectorAll(".modal");
            modals.forEach(modal => {
                if (modal.style.display === "flex" || modal.classList.contains("show")) {
                    modal.classList.remove("show");
                    setTimeout(() => {
                        modal.style.display = "none";
                    }, 300);
                }
            });
        }
    });
}

// ============================================
// BATCH VALIDATION HELPER
// ============================================
export function validateForm(fields) {
    for (const field of fields) {
        if (!field.status) {
            return { status: false, message: field.message };
        }
    }
    return { status: true };
}

// ============================================
// UNIQUE SHOP CODE VALIDATION
// ============================================
export function validateUniqueShopCode(shopCode, allShops, currentShopId = null) {
    if (!shopCode || shopCode.trim().length === 0) {
        return { status: false, message: "Shop code is required" };
    }

    // Normalize the code (trim and uppercase for comparison)
    const normalizedCode = shopCode.trim().toUpperCase();

    // Check if code already exists in the list
    const existingShop = allShops.find(shop => {
        const existingCode = (shop.shop_code || "").trim().toUpperCase();
        // If editing, allow the same code for the current shop
        if (currentShopId && shop.id === currentShopId) {
            return false;
        }
        return existingCode === normalizedCode;
    });

    if (existingShop) {
        return { status: false, message: `Shop code "${shopCode}" already exists!` };
    }

    return { status: true };
}

// ============================================
// PASSWORD VALIDATION
// ============================================
export function validatePassword(password) {
    if (!password || password.trim().length === 0) {
        return { status: false, message: "Password is required" };
    }

    if (password.length < 6) {
        return { status: false, message: "Password must be at least 6 characters" };
    }

    return { status: true };
}

// ============================================
// UNIQUE MOBILE VALIDATION (FOR USERS)
// ============================================
export function validateUniqueMobile(mobile, allUsers, currentUserId = null) {
    if (!mobile || mobile.trim().length === 0) {
        return { status: false, message: "Mobile number is required" };
    }

    // Check if mobile already exists in the list
    const existingUser = allUsers.find(user => {
        // If editing, allow the same mobile for the current user
        if (currentUserId && user.id === currentUserId) {
            return false;
        }
        return user.mobile === mobile;
    });

    if (existingUser) {
        return { status: false, message: `Mobile number "${mobile}" already exists!` };
    }

    return { status: true };
}

// ============================================
// STORAGE HELPER FUNCTIONS (Session + Local)
// ============================================

/**
 * Get user data from either localStorage or sessionStorage
 * Priority: localStorage first, then sessionStorage
 */
export function getCurrentUser() {
    // Try localStorage first (if "Remember me" was checked)
    let userData = localStorage.getItem("rememberedUser");

    // If not in localStorage, check sessionStorage
    if (!userData) {
        userData = sessionStorage.getItem("rememberedUser");
    }

    if (userData) {
        return JSON.parse(userData);
    }

    return null;
}

/**
 * Set user data - choose storage based on remember flag
 */
export function setCurrentUser(userData, remember = false) {
    const userJSON = JSON.stringify(userData);

    // Clear both storages first
    localStorage.removeItem("rememberedUser");
    sessionStorage.removeItem("rememberedUser");

    // Set to appropriate storage
    if (remember) {
        localStorage.setItem("rememberedUser", userJSON);
    } else {
        sessionStorage.setItem("rememberedUser", userJSON);
    }
}

/**
 * Clear user data from both storages
 */
export function clearCurrentUser() {
    localStorage.removeItem("rememberedUser");
    sessionStorage.removeItem("rememberedUser");
}

/**
 * Get value from either localStorage or sessionStorage
 */
export function getStorageItem(key) {
    // Try localStorage first
    let value = localStorage.getItem(key);

    // If not found, try sessionStorage
    if (value === null) {
        value = sessionStorage.getItem(key);
    }

    return value;
}

/**
 * Set value to localStorage (persistent across sessions)
 */
export function setLocalStorage(key, value) {
    localStorage.setItem(key, value);
}

/**
 * Remove value from both storages
 */
export function removeStorageItem(key) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
}
