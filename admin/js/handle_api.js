import { userURL } from "../apis/api.js";
import { showMessage } from "./message.js";

// user login
export async function loginUers(mobile, password, remember) {
    try {
        let response = await fetch(userURL, {
            method: 'POST', // Specify the method as POST
            headers: {
                'Content-Type': 'application/json', // Inform the server about the content type
            },
            body: JSON.stringify({ // Send data in the request body
                mobile: mobile,
                password: password
            })
        });
        let user = await response.json();
        let data = user.user;
        console.log(data);
        console.log(remember);

        if (data) {

            // Build the user object you want to store
            let currentUser = {
                id: data.id,
                mobile: data.mobile,
                role: data.role,
                shop_id: data.shop_id,
            };


            // Clear any old stored user
            localStorage.removeItem("CURRENT_USER");
            sessionStorage.removeItem("CURRENT_USER");

            if (remember === true) {
                localStorage.setItem("rememberedUser", JSON.stringify(currentUser));
            } else {
                sessionStorage.setItem("rememberedUser", JSON.stringify(currentUser));
            }

            // Now role-based message / redirect
            if (data.role === "admin") {
                showMessage('loginMessage', 'Admin Login successful!', 'success');
                window.location.href = './Admin/dashboard.html';
                return;
            }

            if (data.role === "client") {
                showMessage('loginMessage', 'Client Login successful!', 'success');
                window.location.href = './Admin/dashboard.html'; // or client dashboard later
                return;
            }

            // Fallback
            // showMessage('loginMessage', 'Login successful!', 'success');
            // window.location.href = './Admin/dashboard.html';
            // return;
        }



    } catch (error) {
        console.error('Error during login:', error);
    }
}

// forgot password
export async function forgotUserPassword(email, password) {
    let response = await fetch(`${userURL}?email=${email}`);
    let data = await response.json();
    if (data.length === 0) {
        showMessage('forgotMessage', 'Email not found', 'error');
        return;
    }
    fetch(`${userURL}/${data[0].id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "password": password })
    });
    showMessage('forgotMessage', 'Password updated successfully. Please login with your new password.', 'success');
    window.location.href = '../../index.html';
}
