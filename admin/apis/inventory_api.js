// apis/inventory_api.js
// Centralised Inventory-related API operations (Orders side)
// Admin side ONLY (no client ordering here)

import {
    userURLphp,
    ordersURLphp,
    orderItemsURLphp
} from "./api.js";

// ============================================
// Helpers
// ============================================

function normalizeArrayResponse(raw, keys = ["data", "orders", "items"]) {
    if (Array.isArray(raw)) return raw;

    for (const k of keys) {
        if (raw && Array.isArray(raw[k])) return raw[k];
    }

    console.warn("⚠️ Unexpected API response format:", raw);
    return [];
}

// ============================================
// CLIENTS (users.php)
// ============================================

// Admin uses this to fill the "Client" dropdown
export async function invFetchClients() {
    console.log("📡 [inventory_api] Fetching clients from:", userURLphp);

    const res = await fetch(userURLphp);
    const data = await res.json();

    const clients = normalizeArrayResponse(data, ["clients", "data"]);

    console.log("👥 [inventory_api] Total users from API:", clients.length);

    // You said you only want actual clients (role = 'client')
    const onlyClients = clients.filter(
        (c) => (c.role || "").toLowerCase() === "client"
    );

    console.log("👥 [inventory_api] Filtered clients (role=client):", onlyClients.length);

    return onlyClients;
}

// ============================================
// ORDERS (orders.php)
// ============================================

// GET all orders by shop (admin side)
// Orders : GET
// req  => { shop_id }
// res  => {id, order_no, user_id, shop_id, total_amount, delivery_type,
//          status, accepted_at, rejection_reason, reminder_count, notes,
//          placed_at, expected_delivery, created_at, user_name? }
export async function invFetchOrdersForShop(shopId) {
    if (!shopId) {
        console.warn("⚠️ [inventory_api] No shopId provided to invFetchOrdersForShop");
        return [];
    }

    const url = `${ordersURLphp}?shop_id=${encodeURIComponent(shopId)}`;
    console.log("📡 [inventory_api] Fetching orders from:", url);

    const res = await fetch(url);
    const data = await res.json();

    const orders = normalizeArrayResponse(data, ["orders", "data"]);

    console.log("📦 [inventory_api] Orders loaded for shop", shopId, "=>", orders.length);

    return orders;
}

// PATCH order (status, rejected_reason, reminder_count, notes)
// Orders : PATCH
// URL  => orders.php?id=1
// body => 'data':{'status':'cancelled','rejected_reason':'','reminder_count':,'notes':}
export async function invUpdateOrderStatus(orderId, payload) {
    const url = `${ordersURLphp}?id=${encodeURIComponent(orderId)}`;
    console.log("📡 [inventory_api] PATCH order:", url, payload);

    // Many PHP backends expect form-data, keeping same style:
    const body = new FormData();
    body.append("data", JSON.stringify(payload));

    const res = await fetch(url, {
        method: "PATCH",
        body
    });

    const data = await res.json();
    console.log("✅ [inventory_api] PATCH response:", data);

    return data;
}

// ============================================
// ORDER ITEMS (order_items.php)
// ============================================

// order_items.php?order_id=1
// res => [{item_name, qty, price, line_total, created_at}, ...]
export async function invFetchOrderItems(orderId) {
    const url = `${orderItemsURLphp}?order_id=${encodeURIComponent(orderId)}`;
    console.log("📡 [inventory_api] Fetching order items:", url);

    const res = await fetch(url);
    const data = await res.json();

    const items = normalizeArrayResponse(data, ["items", "data"]);

    console.log("📦 [inventory_api] Items for order", orderId, "=>", items.length);

    return items;
}
