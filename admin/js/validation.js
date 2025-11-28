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
