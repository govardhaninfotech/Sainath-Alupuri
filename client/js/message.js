export function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message || '';
    element.className = 'message ' + type;
    element.classList.remove('hidden');
}