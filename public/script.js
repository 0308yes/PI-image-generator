document.getElementById('dataForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const move = document.getElementById('move').value;
    const exercise = document.getElementById('exercise').value;
    const stand = document.getElementById('stand').value;
    const steps = document.getElementById('steps').value;
    const distance = document.getElementById('distance').value;

    // API 호출
    fetch('/generate-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ move, exercise, stand, steps, distance }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.imageUrls) {
            displayImages(data.imageUrls, data.prompt);
        } else {
            displayError(data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        displayError(error);
    });
});

document.getElementById('csvForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData();
    const csvFile = document.getElementById('csvFile').files[0];
    formData.append('csvFile', csvFile);

    fetch('/upload-csv', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.imageUrls) {
            displayImages(data.imageUrls);
        } else {
            displayError(data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        displayError(error);
    });
});

function displayImages(imageUrls, prompt) {
    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = imageUrls.map(url => `<img src="${url}" alt="Generated Image">`).join('');
    if (prompt) {
        const promptElement = document.createElement('p');
        promptElement.innerText = `Generated Prompt: ${prompt}`;
        imageContainer.appendChild(promptElement);
    }
}

function displayError(error) {
    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = `<p>Error generating image: ${error}</p>`;
}
