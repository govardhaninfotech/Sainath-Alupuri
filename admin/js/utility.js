export function getCUrrenetUser() {

    let currentUser =
        JSON.parse(sessionStorage.getItem("rememberedUser")) ||
        JSON.parse(localStorage.getItem("rememberedUser"));
    return currentUser;
}

window.getCUrrenetUser = getCUrrenetUser;   