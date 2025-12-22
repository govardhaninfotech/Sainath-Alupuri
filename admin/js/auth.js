import { validateIndianMobile } from './validation.js';
import { loginUers, forgotUserPassword } from "./handle_api.js";
import { showMessage } from "./message.js";
import { sendOTPURL, verifyOTPURL } from '../apis/api.js';

let formLogin = document.getElementById('loginForm');;
// let formRegister = document.getElementById('registerForm');
let updateForm = document.getElementById('updateForm');
let generateOTPForm = document.getElementById('generateOTP');
let verifyOTPForm = document.getElementById('verifyOTP');
// --------------------------------------------------------------------------------------------
// user login
if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();

        let mobile = document.getElementById('loginMobile').value;
        let password = document.getElementById('loginPassword').value;
        let remember = document.getElementById('rememberMe').checked

        // 🔹 Mobile validation
        const mCheck = validateIndianMobile(mobile);
        if (!mCheck.status) {
            showMessage('loginMessage', mCheck.message, 'error');
            return;
        }

        // 🔹 Password validation
        if (password.length < 6) {
            showMessage('loginMessage', 'Password must be at least 6 characters', 'error');
            return;
        }

        loginUers(mobile, password, remember);
    });
}
// --------------------------------------------------------------------------------------------
// forgot password
if (updateForm) {
    updateForm.addEventListener('submit', (e) => {
        e.preventDefault()

        let user_id = JSON.parse(localStorage.getItem("user_id") || sessionStorage.getItem("user_id") || "null");

        let newPassword = document.getElementById('newPassword').value;
        let confirmNewPassword = document.getElementById('confirmNewPassword').value

        if (newPassword !== confirmNewPassword) {
            showMessage('forgotMessage', 'The password and confirmation password do not match', 'error');

            return;
        }

        forgotUserPassword(user_id, newPassword);

    })
}


// ---------------------------------------------------------------------------------------------
// Select Elements
// Select Elements
const emailInput = document.getElementById('forgotEmail');
const otpInput = document.getElementById('otp');
const verifyBtn = document.getElementById('verifyBtn');
const generateBtn = document.getElementById('generateBtn');


// DEFAULT STATE ▶ OTP Disabled


// =======================================
// 1️⃣ CLICK ON "GENERATE OTP" (2 MODES)
// =======================================
if (generateBtn) {

    generateBtn.addEventListener('click', async (e) => {
        // If in EDIT mode → enable email again
        if (generateBtn.dataset.mode === "edit") {
            e.preventDefault();
            emailInput.disabled = false;
            otpInput.disabled = true;
            verifyBtn.disabled = true;
            generateBtn.textContent = "Generate OTP";
            generateBtn.dataset.mode = "generate";
            return;
        }
    });

}

// =======================================
// 2️⃣ GENERATE OTP PROCESS
// =======================================
if (generateOTPForm) {
    generateOTPForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        let email = emailInput.value.trim();

        if (!email) {
            showMessage('forgotMessage', 'Please enter your email', 'error');
            return;
        }

        try {
            const response = await fetch(sendOTPURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            console.log(data);

            if (data.status === "ok") {
                showMessage('forgotMessage', data.message, 'success');

                sessionStorage.setItem('email', JSON.stringify(email));

                // 🔥 Change mode → EDIT MODE
                emailInput.disabled = true;
                otpInput.disabled = false;
                verifyBtn.disabled = false;

                generateBtn.textContent = "Edit Email";
                generateBtn.dataset.mode = "edit";  // STORE MODE INSIDE BUTTON
                otpInput.focus();

            } else {
                showMessage('forgotMessage', data.status, 'error');
            }

        } catch (error) {
            showMessage('forgotMessage', 'Unable to send OTP. Try again.', 'error');
        }
    });
}


// =======================================
// 3️⃣ VERIFY OTP
// =======================================
if (verifyOTPForm) {
    verifyOTPForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        let email = JSON.parse(sessionStorage.getItem('email') || '""');
        let otp = otpInput.value.trim();

        if (!otp) {
            showMessage('forgotMessage', 'Please enter OTP', 'error');
            return;
        }

        try {
            const response = await fetch(verifyOTPURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const data = await response.json();
            console.log("Verify OTP Response:", data);

            if (data.status === "ok") {
                showMessage('forgotMessage', "OTP verified successfully.", 'success');
                sessionStorage.setItem('user_id', JSON.stringify(data.user_id));

                setTimeout(() => {
                    window.location.href = "./update_password.html";
                }, 2000);

            } else {
                showMessage('forgotMessage', data.message, 'error');
            }

        } catch (error) {
            showMessage('forgotMessage', 'Error verifying OTP. Try again.', 'error');
        }
    });
}
// --------------------------------------------------------------------------------------------