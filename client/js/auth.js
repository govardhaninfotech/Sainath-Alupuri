import { validateIndianMobile } from './validation.js';
import { loginUers, forgotUserPassword } from "./handle_api.js";
import { showMessage } from "./message.js";

let formLogin = document.getElementById('loginForm');;
// let formRegister = document.getElementById('registerForm');
let formForgot = document.getElementById('forgotForm');
// console.log(formLogin, formRegister, formForgot);

// --------------------------------------------------------------------------------------------
// user login

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

// --------------------------------------------------------------------------------------------
// forgot password
if (formForgot) {
    formForgot.addEventListener('submit', (e) => {
        e.preventDefault()
        let forgotEmail = document.getElementById('forgotEmail').value;
        let newPassword = document.getElementById('newPassword').value;
        let confirmNewPassword = document.getElementById('confirmNewPassword').value

        if (newPassword !== confirmNewPassword) {
            showMessage('forgotMessage', 'Passwords do not match', 'error');

            return;
        }

        forgotUserPassword(forgotEmail, newPassword);

    })
}