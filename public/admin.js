const properties = ['auth_type', 'ID', 'password', 'data_types']
const table = document.getElementById("table");
const addRowButton = document.getElementById('addRowButton');
const saveButton = document.getElementById('saveButton');
let dbData = null;
let isSaving = false; // Flag to prevent multiple save operations

import { UserMeta } from "./communication/userMeta.js";


const userMeta = new UserMeta()


request();


function showLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'block';
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

async function request() {

    dbData = await userMeta.getAllUsers()
    console.log(dbData);
    for (const user of dbData.users) {
        let tr = document.createElement('tr');
        tr.className = 'temp';
        for (let i = 0; i < properties.length; i++) {
            let td = document.createElement('td');
            td.textContent = user[properties[i]];
            td.contentEditable = "true";
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
}

addRowButton.addEventListener('click', () => {
    let tr = document.createElement('tr');
    for (let i = 0; i < properties.length; i++) {
        let td = document.createElement('td');
        td.contentEditable = "true";
        tr.appendChild(td);
    }
    table.appendChild(tr);
});

saveButton.addEventListener('click', async () => {
    if (isSaving) return; // Prevent multiple save operations
    isSaving = true;
    showLoadingSpinner();

    const rows = table.rows;
    try {
        // Delete all users
        let response = await userMeta.deleteAllUsers();
        console.log(response);

        for (let i = 1; i < rows.length; i++) {
            if (!isRowEmpty(rows[i])) {
                const tdElements = rows[i].querySelectorAll('td');
                let temp = [];
                for (let j = 0; j < properties.length; j++) {
                    temp.push(tdElements[j].textContent);
                }
                await userMeta.createUser(...temp);
            }
        }
    } finally {
        hideLoadingSpinner();
        isSaving = false;
    }
});

function isRowEmpty(row) {
    for (let i = 0; i < row.cells.length; i++) {
        let cell = row.cells[i];
        if (cell.textContent.trim() !== '') {
            return false;
        }
    }
    return true;
}


