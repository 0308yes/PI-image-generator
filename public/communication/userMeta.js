export class UserMeta {
    constructor() {

    }

    async createUser(auth_type, ID, password, data_types, data_category) {
        const token = localStorage.getItem('token');
        const response = await fetch('/createUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                ID: ID,
                password: password,
                data_types: data_types,
                data_category: data_category,
                auth_type: auth_type,

            })
        });
        console.log(response)
        return response
    }

    async getAllUsers() {
        const token = localStorage.getItem('token');
        const response = await fetch('/getAllUsers', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        return response.json()
    }

    async getUserById() {
        const token = localStorage.getItem('token');
        const response = await fetch(`/getUserById`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        })
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const data = await response.json();
        return data;
    }

    async deleteUser(id) {
        const token = localStorage.getItem('token');
        const response = await fetch('/deleteUser', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ID: id })
        });
        return response.json();
    }

    async deleteAllUsers() {
        const token = localStorage.getItem('token');
        const response = fetch('/deleteAllUsers', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        return response;
    }
}



