document.getElementById('dataForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const move = document.getElementById('move').value;
    const exercise = document.getElementById('exercise').value;
    const stand = document.getElementById('stand').value;
    const steps = document.getElementById('steps').value;
    const distance = document.getElementById('distance').value;

    showLoadingSpinner();

    //-------------- API 호출
    fetch('/generate-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ move, exercise, stand, steps, distance }),
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingSpinner();
        if (data.imageUrls) {
            displayImages(data.imageUrls, data.prompt);
            fetchLogs(); // 이미지를 생성한 후 로그를 다시 불러옴
        } else {
            displayError(data.error);
        }
    })
    .catch(error => {
        hideLoadingSpinner();
        console.error('Error:', error);
        displayError(error);
    });
});

//-------------- 로딩
function showLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'block';
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

//-------------- 이미지 보여주기
function displayImages(imageUrls, prompt) {
    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = imageUrls.map(url => `<img src="${url}" alt="Generated Image" style="width: 512px; height: auto; margin-top: 10px;">`).join('');
    if (prompt) {
        const promptElement = document.createElement('p');
        promptElement.innerText = `Generated Prompt: ${prompt}`;
        imageContainer.appendChild(promptElement);
    }
}

function displayError(error) {
    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = `<p style="color: red;">Error generating image: ${error}</p>`;
}

function fetchLogs() {
    fetch('/logs')
    .then(response => response.json())
    .then(logs => {
        displayTodayLogs(logs);
        renderCalendar(new Date().getMonth(), new Date().getFullYear(), logs);
        const historyButton = document.getElementById("btn1");
        const todayButton = document.getElementById("btn2");
        historyButton.addEventListener('click', () => displayAllLogs(logs));
        todayButton.addEventListener('click', () => displayTodayLogs(logs));
    })
    .catch(error => {
        console.error('Error fetching logs:', error);
    });
}

//-------------- 로그 정렬
function groupLogsByDate(logs) {
    const grouped = logs.reduce((acc, log) => {
        const date = new Date(log.timestamp).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(log);
        return acc;
    }, {});

    // 날짜별로 로그 시간순 정렬
    Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });

    return grouped;
}

//-------------- 로그 출력
function renderLogs(date, logs) {
    return `
        <div class="log-date-group">
            <h3>${date}</h3>
            ${logs.map(log => `
                <div class="log-item">
                    <div class="log-content">
                        <img src="${log.imageFilepath}" alt="Log Image">
                        <div class="log-details">
                            <p><strong>Time:</strong> ${new Date(log.timestamp).toLocaleString()}</p>
                            <p><strong>Move:</strong> ${log.move}</p>
                            <p><strong>Exercise:</strong> ${log.exercise}</p>
                            <p><strong>Stand:</strong> ${log.stand}</p>
                            <p><strong>Steps:</strong> ${log.steps}</p>
                            <p><strong>Distance:</strong> ${log.distance} km</p>
                            <p><strong>Generated Prompt:</strong> ${log.prompt}</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

//-------------- 로그 보여주기
// 오늘 로그
function displayTodayLogs(logs) {
    const logContainer = document.getElementById('logContainer');
    const today = new Date().toLocaleDateString();
    const todayLogs = logs
        .filter(log => new Date(log.timestamp).toLocaleDateString() === today)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // 최신순으로 정렬

    logContainer.innerHTML = todayLogs.length > 0 ? renderLogs(today, todayLogs) : `<p>No logs for today.</p>`;
}

// 전체 히스토리
function displayAllLogs(logs) {
    const logContainer = document.getElementById('logContainer');
    const groupedLogs = groupLogsByDate(logs);
    const sortedDates = Object.keys(groupedLogs).sort((a, b) => new Date(b) - new Date(a));

    logContainer.innerHTML = sortedDates.map(date => renderLogs(date, groupedLogs[date])).join('');
}

//-------------- 캘린더 생성
// 캘린더 생성 함수
function renderCalendar(month, year, logs) {
    const calendar = document.getElementById('calendar');
    const groupedLogs = groupLogsByDate(logs);
    calendar.innerHTML = `
        <div class="calendar-header">
            <button onclick="navigateMonth(${month - 1}, ${year})">&#10094;</button>
            <h2>${year}.${('0' + (month + 1)).slice(-2)}</h2>
            <button onclick="navigateMonth(${month + 1}, ${year})">&#10095;</button>
        </div>
        <div class="calendar-grid">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            ${generateCalendarCells(month, year, groupedLogs)}
        </div>
    `;
}

function generateCalendarCells(month, year, groupedLogs) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let cells = '';

    for (let i = 0; i < firstDay; i++) {
        cells += '<div class="calendar-cell"></div>';
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = new Date(year, month, i).toLocaleDateString();
        const logs = groupedLogs[dateStr];
        cells += `
            <div class="calendar-cell">
                <div class="date">${i}</div>
                ${logs ? `<img src="${logs[0].imageFilepath}" alt="Event Image" class="event-image">` : ''}
            </div>
        `;
    }

    return cells;
}

function navigateMonth(month, year) {
    const newDate = new Date(year, month, 1);
    const newMonth = newDate.getMonth();
    const newYear = newDate.getFullYear();
    fetch('/logs')
    .then(response => response.json())
    .then(logs => {
        renderCalendar(newMonth, newYear, logs);
    })
    .catch(error => {
        console.error('Error fetching logs:', error);
    });
}

//-------------- 탭 변경
function showTab(tabName) {
    const calendarTab = document.getElementById('calendarTab');
    const logTab = document.getElementById('logTab');
    const calendarContent = document.getElementById('calendar');
    const logContent = document.getElementById('logContainer');
    const buttonContainer = document.getElementById('buttonContainer');

    if (tabName === 'calendar') {
        calendarTab.classList.add('active');
        logTab.classList.remove('active');
        calendarContent.style.display = 'block';
        logContent.style.display = 'none';
        buttonContainer.style.display = 'none';
    } else if (tabName === 'log') {
        logTab.classList.add('active');
        calendarTab.classList.remove('active');
        logContent.style.display = 'block';
        calendarContent.style.display = 'none';
        buttonContainer.style.display = 'block';
    }
}

// 페이지 로드 시 오늘의 로그 데이터를 불러오기
document.addEventListener('DOMContentLoaded', () => {
    showTab('log'); // 초기 탭을 Image Log 탭으로
    fetchLogs();
});
