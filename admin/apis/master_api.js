
// get itemsData for items tablein itemsData.js
export function getItemsData(url) {
    return fetch(url).then(response => response.json()).then(data => {
        // console.log(data);
        // If data is an array, return it directly; if it's an object with items property, return that
        return data;
    }).catch(error => {
        console.error('Error fetching items data:', error);
        return [];
    });
}



// Update item
export async function updateItem(url, itemId, itemData, userId = null) {
    console.log(itemData);

    console.log(userId);

    try {
        var finalURL = `${url}?id=${itemId}`;
        if (userId) {
            finalURL = `${url}?user_id=${userId}&id=${itemId}`;
        }
        console.log(finalURL);
        let response = await fetch(finalURL, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemData)
        });

        console.log(response);

        if (!response.ok) {
            const errorText = await response.text();
            let errorData = null;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: errorText };
            }
            throw new Error(JSON.stringify(errorData));
        }

        const result = await response.json();
        return result;
        // return await response.json();/
    } catch (error) {
        console.error('Error updating item:', error);
        return null;
    }
}

// ------------------------------------------------------------------------------------------------------------------------------------
// Add new item using php
export async function addItemToAPI(url, itemData) {
    console.log(url,itemData);

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
            let errorData = null;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: errorText };
            }
            throw new Error(JSON.stringify(errorData));
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Full error:', error);
        // Return error object instead of null
        try {
            const errorObj = JSON.parse(error.message);
            return { error: true, ...errorObj };
        } catch (e) {
            return { error: true, message: error.message || 'An error occurred' };
        }
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
