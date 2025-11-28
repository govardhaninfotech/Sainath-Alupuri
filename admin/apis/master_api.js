
// get itemsData for items tablein itemsData.js
export async function getItemsData(url) {
    try {

        let response = await fetch(url);
        let data = await response.json();
        // console.log(data);
        // If data is an array, return it directly; if it's an object with items property, return that
        return data;
    } catch (error) {
        console.error('Error fetching items data:', error);
        return [];
    }
}



// Update item
export async function updateItem(url, itemId, itemData) {
    try {
        let response = await fetch(`${url}?id=${itemId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating item:', error);
        return null;
    }
}

// ------------------------------------------------------------------------------------------------------------------------------------
// Add new item using php
export async function addItemToAPI(url, itemData) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Full error:', error);
        return null;
    }
}

// ------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------
// working but committed delete
// Delete item
export async function deleteItemFromAPI(url, itemId) {
    try {
        let response = await fetch(`${url}?id=${itemId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            return false;
        }

        return response.ok;
    } catch (error) {
        console.error('Error deleting item:', error);
        return false;
    }
}   
