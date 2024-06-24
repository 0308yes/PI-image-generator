
document.getElementById('dataForm').addEventListener('submit', function (event) {
    event.preventDefault();
    fetch('/loginUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ID: document.getElementById('ID').value,
            password: document.getElementById('password').value
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Assuming the server sends the appropriate file, redirect to the URL
                window.location.href = data.redirectUrl;
                localStorage.setItem('token', data.token);
            }
            else {
                // login fail
                if (data.hasOwnProperty('message') == true)
                    alert(data.message);
            }
        })
        .catch(error => {
            alert(error);
        })
})

