import { userURL } from "../apis/api.js";
import { showMessage } from "./message.js";
import { setCurrentUser, setLocalStorage } from "./validation.js";

// user login
export function loginUers(mobile, password, remember) {
    return fetch(userURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile, password })
    })
        .then(async response => {

            // ❌ Wrong mobile or password
            if (response.status === 401) {
                showMessage(
                    'loginMessage',
                    'Mobile number or password is incorrect',
                    'error'
                );
                return null;
            }

            // ❌ Other server errors
            if (!response.ok) {
                showMessage(
                    'loginMessage',
                    'Something went wrong. Please try again.',
                    'error'
                );
                return null;
            }

            // ✅ Only parse JSON if response is OK
            return response.json();
        })
        .then(res => {
            if (!res || !res.user) return;

            const data = res.user;

            // const currentUser = {
            //     id: data.id,
            //     mobile: data.mobile,
            //     role: data.role,
            //     shop_id: data.shop_id,
            //     is_family_member: data.is_family_member
            // };

            setCurrentUser(data, remember);

            if (data.role === "admin") {
                showMessage('loginMessage', 'Admin login successful!', 'success');
                // Redirect to dashboard home page
                window.location.href = './admin/dashboard.html?page=home';
                return;
            }

            if (data.role === "client") {
                showMessage('loginMessage', 'Client login successful!', 'success');
                window.location.href = './client/dashboard.html?page=home';
                return;
            }

            showMessage('loginMessage', 'Invalid user role', 'error');
        })
        .catch(error => {
            console.error('Login error:', error);
            showMessage(
                'loginMessage',
                'Network error. Please check your connection.',
                'error'
            );
        });
}

// Forgot Password API
export async function forgotUserPassword(user_id, password) {

    // -------------------------
    // 🔹 Basic Frontend Validation
    // -------------------------

    // if (!user_id || user_id === "") {
    //     showMessage('forgotMessage', 'Please enter your valid email.', 'error');
    //     return;
    // }

    // Email format check (if user_id is email)
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (user_id.includes("@") && !emailRegex.test(user_id)) {
    //     showMessage('forgotMessage', 'Invalid email format. Please enter a valid email.', 'error');
    //     return;
    // }

    if (!password || password.trim() === "") {
        showMessage('forgotMessage', 'Please enter a new password.', 'error');
        return;
    }


    try {
        // -------------------------
        // 🔹 API CALL
        // -------------------------
        const response = await fetch(`https://gisurat.com/govardhan/sainath_aloopuri/api/reset_password.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: user_id,
                password: password
            })
        });

        const data = await response.json();
        console.log("API Response:", data);

        // -------------------------
        // 🔹 API Validations & Handling
        // -------------------------

        if (!response.ok) {
            showMessage('forgotMessage', 'Server error! Please try again later.', 'error');
            return;
        }

        // Case 1: User not found
        if (data.status === "user_not_found") {
            showMessage('forgotMessage', 'User does not exist. Please check your email or user ID.', 'error');
            return;
        }

        // Case 2: Email invalid (if API returns such message)
        if (data.status === "invalid_email") {
            showMessage('forgotMessage', 'Email is not valid. Please enter a registered email.', 'error');
            return;
        }

        // Case 3: Any custom error from backend
        if (data.status === "error") {
            showMessage('forgotMessage', data.message || 'Something went wrong. Try again.', 'error');
            return;
        }

        // Case 4: Success
        if (data.status === "ok") {
            showMessage('forgotMessage', 'Password updated successfully. Please login with your new password.', 'success');
            sessionStorage.removeItem('user_id');
            sessionStorage.removeItem('email');

            setTimeout(() => {
                window.location.href = './index.html';
            }, 1000);


            return;
        }

        // Unknown case
        // showMessage('forgotMessage', 'Unexpected response from server.', 'error');

    } catch (error) {
        console.error(error);
        showMessage('forgotMessage', 'Network error! Please check your internet connection.', 'error');
    }
}
