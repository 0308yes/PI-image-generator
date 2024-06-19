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
            fetchLogs(); // 이미지를 생성한 후 로그를 다시 불러옴
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
    imageContainer.innerHTML = imageUrls.map(url => `<img src="${url}" alt="Generated Image" style="width: 512px; height: auto;">`).join('');
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

function fetchLogs() {
    fetch('/logs')
    .then(response => response.json())
    .then(logs => {
        displayTodayLogs(logs);
        const historyButton = document.getElementById("btn1");
        const todayButton = document.getElementById("btn2");
        historyButton.addEventListener('click', () => displayAllLogs(logs));
        todayButton.addEventListener('click', () => displayTodayLogs(logs));
    })
    .catch(error => {
        console.error('Error fetching logs:', error);
    });
}

function groupLogsByDate(logs) {
    const grouped = logs.reduce((acc, log) => {
        const date = new Date(log.timestamp).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(log);
        return acc;
    }, {});

    // 날짜별로 로그를 시간순으로 정렬
    Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });

    return grouped;
}

function renderLogs(date, logs) {
    return `
        <div class="log-date-group">
            <h3>${date}</h3>
            ${logs.map(log => `
                <div class="log-item" style="border: 1px solid #ccc; margin-bottom: 10px; padding: 10px;">
                    <img src="${log.imageFilepath}" alt="Log Image" style="width: 300px; height: auto;">
                    <p><strong>Time:</strong> ${new Date(log.timestamp).toLocaleString()}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function displayTodayLogs(logs) {
    const logContainer = document.getElementById('logContainer');
    const today = new Date().toLocaleDateString();
    const todayLogs = logs
        .filter(log => new Date(log.timestamp).toLocaleDateString() === today)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // 최신순으로 정렬

    logContainer.innerHTML = renderLogs(today, todayLogs);
}

function displayAllLogs(logs) {
    const logContainer = document.getElementById('logContainer');
    const groupedLogs = groupLogsByDate(logs);
    const sortedDates = Object.keys(groupedLogs).sort((a, b) => new Date(b) - new Date(a));

    logContainer.innerHTML = sortedDates.map(date => renderLogs(date, groupedLogs[date])).join('');
}

// 페이지 로드 시 오늘의 로그 데이터를 불러오기
document.addEventListener('DOMContentLoaded', fetchLogs);
