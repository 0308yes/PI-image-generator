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
            fetchLogs();
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
    imageContainer.innerHTML = imageUrls.map(url => `<img src="${url}" alt="Generated Image" style="width: 300px; height: auto;">`).join('');
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
        displayLogs(logs);
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

// 날짜별 로그를 HTML로 표시하는 함수
function displayLogs(logs) {
    const logContainer = document.getElementById('logContainer');
    const groupedLogs = groupLogsByDate(logs);
    const sortedDates = Object.keys(groupedLogs).sort((a, b) => new Date(b) - new Date(a));

    logContainer.innerHTML = sortedDates.map(date => `
        <div class="log-date-group">
            <h3>${date}</h3>
            ${groupedLogs[date].map(log => `
                <div class="log-item" style="border: 1px solid #ccc; margin-bottom: 10px; padding: 10px;">
                    <img src="${log.imageFilepath}" alt="Log Image" style="width: 300px; height: auto;">
                    <p><strong>Time:</strong> ${new Date(log.timestamp).toLocaleString()}</p>
                </div>
            `).join('')}
        </div>
    `).join('');
}

//--------------------- 날짜 예전꺼부터 보이게 
// function groupLogsByDate(logs) {
//     return logs.reduce((acc, log) => {
//         const date = new Date(log.timestamp).toLocaleDateString();
//         if (!acc[date]) {
//             acc[date] = [];
//         }
//         acc[date].push(log);
//         return acc;
//     }, {});
// }

// // 날짜별 로그를 HTML로 표시하는 함수
// function displayLogs(logs) {
//     const logContainer = document.getElementById('logContainer');
//     const groupedLogs = groupLogsByDate(logs);

//     logContainer.innerHTML = Object.keys(groupedLogs).map(date => `
//         <div class="log-date-group">
//             <h3>${date}</h3>
//             ${groupedLogs[date].map(log => `
//                 <div class="log-item" style="border: 1px solid #ccc; margin-bottom: 10px; padding: 10px;">
//                     <img src="${log.imageFilepath}" alt="Log Image" style="width: 300px; height: 00px;">
//                     <p><strong>Time:</strong> ${new Date(log.timestamp).toLocaleString()}</p>
//                 </div>
//             `).join('')}
//         </div>
//     `).join('');
// }


//--------------------- 다른 메타 데이터도 표시해주기
// function displayLogs(logs) {
//     const logContainer = document.getElementById('logContainer');
//     const groupedLogs = groupLogsByDate(logs);

//     logContainer.innerHTML = Object.keys(groupedLogs).map(date => `
//         <div class="log-date-group">
//             <h3>${date}</h3>
//             ${groupedLogs[date].map(log => `
//                 <div class="log-item" style="border: 1px solid #ccc; margin-bottom: 10px; padding: 10px;">
//                     <img src="${log.imageFilepath}" alt="Log Image" style="width: 100px; height: 100px;">
//                     <p><strong>Timestamp:</strong> ${new Date(log.timestamp).toLocaleString()}</p>
//                     <p><strong>Move:</strong> ${log.move}</p>
//                     <p><strong>Exercise:</strong> ${log.exercise}</p>
//                     <p><strong>Stand:</strong> ${log.stand}</p>
//                     <p><strong>Steps:</strong> ${log.steps}</p>
//                     <p><strong>Distance:</strong> ${log.distance} km</p>
//                     <p><strong>Generated Prompt:</strong> ${log.prompt}</p>
//                 </div>
//             `).join('')}
//         </div>
//     `).join('');
// }

// 페이지 로드 시 로그 데이터를 불러오기
document.addEventListener('DOMContentLoaded', fetchLogs);

