import { userURL } from "../apis/api.js";
import { showMessage } from "./message.js";
import { setCurrentUser } from "./validation.js";

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

            const currentUser = {
                id: data.id,
                mobile: data.mobile,
                role: data.role,
                shop_id: data.shop_id,
                is_family_member: data.is_family_member
            };

            setCurrentUser(currentUser, remember);

            if (data.role === "admin") {
                showMessage('loginMessage', 'Admin login successful!', 'success');
                window.location.href = './admin/dashboard.html';
                return;
            }

            if (data.role === "client") {
                showMessage('loginMessage', 'Client login successful!', 'success');
                window.location.href = './client/dashboard.html';
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

// forgot password
export function forgotUserPassword(email, password) {
    return fetch(`${userURL}?email=${email}`).then(response => response.json()).then(data => {
        if (data.length === 0) {
            showMessage('forgotMessage', 'Email not found', 'error');
            return;
        }
        return fetch(`${userURL}/${data[0].id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "password": password })
        }).then(() => {
            showMessage('forgotMessage', 'Password updated successfully. Please login with your new password.', 'success');
            window.location.href = '../../index.html';
        });
    });
}
