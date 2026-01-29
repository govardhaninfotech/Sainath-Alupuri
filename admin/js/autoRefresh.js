// ============================================
// AUTO-REFRESH UTILITY MODULE
// ============================================
// This module provides automatic data refresh functionality
// Can be used in both admin and client sides

let refreshIntervals = {};
let autoRefreshEnabled = {};

/**
 * Initialize auto-refresh for a specific page
 * @param {string} pageId - Unique identifier for the page (e.g., 'general-expenses')
 * @param {function} refreshFunction - Function to call for refresh
 * @param {number} intervalSeconds - Interval in seconds (default: 30)
 */
export function initAutoRefresh(pageId, refreshFunction, intervalSeconds = 30) {
    if (!pageId || !refreshFunction) {
        console.error('❌ autoRefresh: pageId and refreshFunction are required');
        return;
    }

    const intervalMs = intervalSeconds * 1000;
    
    // Store in session storage
    sessionStorage.setItem(`autoRefresh_${pageId}`, 'true');
    autoRefreshEnabled[pageId] = true;

    // Clear any existing interval
    if (refreshIntervals[pageId]) {
        clearInterval(refreshIntervals[pageId]);
    }

    // Set new interval
    refreshIntervals[pageId] = setInterval(() => {
        if (autoRefreshEnabled[pageId]) {
            console.log(`🔄 Auto-refresh triggered for: ${pageId}`);
            try {
                refreshFunction();
            } catch (error) {
                console.error(`❌ Error in auto-refresh for ${pageId}:`, error);
            }
        }
    }, intervalMs);

    console.log(`✅ Auto-refresh initialized for ${pageId} (${intervalSeconds}s interval)`);
}

/**
 * Disable auto-refresh for a specific page
 */
export function disableAutoRefresh(pageId) {
    if (refreshIntervals[pageId]) {
        clearInterval(refreshIntervals[pageId]);
        delete refreshIntervals[pageId];
    }
    autoRefreshEnabled[pageId] = false;
    sessionStorage.removeItem(`autoRefresh_${pageId}`);
    console.log(`⏸️  Auto-refresh disabled for: ${pageId}`);
}

/**
 * Toggle auto-refresh on/off
 */
export function toggleAutoRefresh(pageId, refreshFunction, intervalSeconds = 30) {
    if (autoRefreshEnabled[pageId]) {
        disableAutoRefresh(pageId);
        return false;
    } else {
        initAutoRefresh(pageId, refreshFunction, intervalSeconds);
        return true;
    }
}

/**
 * Manual refresh trigger
 * @param {function} refreshFunction - Function to call for refresh
 * @param {string} successMessage - Message to show on success
 */
export async function manualRefresh(refreshFunction, successMessage = 'Data refreshed!') {
    try {
        console.log('🔄 Manual refresh triggered');
        await refreshFunction();
        console.log('✅ ' + successMessage);
        return true;
    } catch (error) {
        console.error('❌ Error during refresh:', error);
        return false;
    }
}

/**
 * Create a refresh button HTML
 */
export function createRefreshButton(pageId, refreshFunction, intervalSeconds = 30) {
    return `
        <button 
            onclick="toggleAutoRefreshUI('${pageId}')" 
            class="btn-refresh" 
            id="autoRefreshBtn_${pageId}"
            title="Toggle auto-refresh (every ${intervalSeconds}s)"
            style="
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 8px 12px;
                background: #17a2b8;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            "
            onmouseover="this.style.background='#138496'"
            onmouseout="this.style.background='#17a2b8'"
        >
            <span id="refreshIcon_${pageId}">🔄</span>
            <span id="refreshText_${pageId}">Auto Refresh</span>
        </button>
    `;
}

/**
 * Update refresh button UI state
 */
export function updateRefreshButtonUI(pageId, isEnabled) {
    const btn = document.getElementById(`autoRefreshBtn_${pageId}`);
    const icon = document.getElementById(`refreshIcon_${pageId}`);
    const text = document.getElementById(`refreshText_${pageId}`);

    if (!btn) return;

    if (isEnabled) {
        btn.style.background = '#28a745';
        icon.textContent = '🟢';
        text.textContent = 'Auto Refresh ON';
    } else {
        btn.style.background = '#17a2b8';
        icon.textContent = '🔄';
        text.textContent = 'Auto Refresh OFF';
    }
}

/**
 * Global function for toggle button (accessible from HTML onclick)
 */
window.toggleAutoRefreshUI = function(pageId) {
    const isEnabled = autoRefreshEnabled[pageId];
    console.log(`Toggle for ${pageId}, current state: ${isEnabled}`);
    updateRefreshButtonUI(pageId, !isEnabled);
};

/**
 * Cache buster - append timestamp to API URLs
 */
export function cacheBust(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${Date.now()}`;
}

/**
 * Session-based refresh check
 * Useful for when user comes back to page
 */
export function checkSessionRefresh(pageId, lastUpdateKey, refreshFunction, maxAgeMinutes = 5) {
    const lastUpdate = sessionStorage.getItem(lastUpdateKey);
    const now = Date.now();

    if (!lastUpdate) {
        sessionStorage.setItem(lastUpdateKey, now.toString());
        return;
    }

    const lastUpdateTime = parseInt(lastUpdate);
    const ageMinutes = (now - lastUpdateTime) / (1000 * 60);

    if (ageMinutes > maxAgeMinutes) {
        console.log(`⏰ Data is ${ageMinutes.toFixed(1)} minutes old, refreshing...`);
        sessionStorage.setItem(lastUpdateKey, now.toString());
        refreshFunction();
    }
}

// Export as global for use in HTML onclick handlers
window.manualRefresh = manualRefresh;
window.initAutoRefresh = initAutoRefresh;
window.disableAutoRefresh = disableAutoRefresh;
window.toggleAutoRefresh = toggleAutoRefresh;
window.cacheBust = cacheBust;
