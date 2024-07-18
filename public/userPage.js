import {
    UserMeta
} from "./communication/userMeta.js";
const userMeta = new UserMeta()
const form = document.getElementById('dataForm');

const response = await userMeta.getUserById()
const result = response.user.data_types.split(',').map(item => item.trim());

//dynamically create the forms 
for (const item of result) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    const label = document.createElement('label');
    label.htmlFor = item
    label.textContent = item
    label.className = 'form-label';

    const input = document.createElement('input');
    //input.type = 'number';
    input.id = item
    input.name = item
    // input.required = true; // 필수 입력 속성 제거
    input.className = 'form-input';

    formGroup.appendChild(label);
    formGroup.appendChild(input);
    form.insertBefore(formGroup, document.getElementById('submit-button'));
}

const token = localStorage.getItem('token');
if (!token) {
    // Redirect to login if no token is found
    window.location.href = '/login.html';
}

// 제목 클릭 이벤트 핸들러 추가
document.getElementById('pageTitle').addEventListener('click', () => {
    showTab('calendar');
    fetchLogs();
});

// 탭 버튼
document.getElementById('logTab').addEventListener('click', () => showTab('log'));
document.getElementById('calendarTab').addEventListener('click', () => showTab('calendar'));

showTab('calendar'); // 초기 탭을 Image Log 탭으로 설정
fetchLogs();

document.getElementById('dataForm').addEventListener('submit', async (event) => {
    event.preventDefault()

    let values = {};
    const formGroups = form.getElementsByClassName('form-group');
    for (const formGroup of formGroups) {
        const inputs = formGroup.getElementsByTagName('input');
        for (const input of inputs) {
            values[input.id] = input.value || null;  // 빈 값일 경우 null로 설정
        }
    }

    showLoadingSpinner();

    //-------------- API 호출
    fetch('/generate-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            data_types: values
        }),
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

//-------------- 이미지 보여주기 (s3 수정됨)
function displayImages(imageUrls, prompt) {
    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = imageUrls.map(url => `
        <div class="image-item" style="margin-top: 10px;">
            <img src="${url}" alt="Generated Image" style="width: 300px; height: auto;">
            <div style="margin-top: 5px;">
                <button class="toggle-prompt-button" onclick="togglePrompt(this)">이미지 설명 열기</button>
                <p class="generated-prompt" style="display: none;"><strong>AI의 이미지 설명:</strong> ${prompt}</p>
            </div>
        </div>
    `).join('');
}

function displayError(error) {
    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = `<p style="color: red;">Error generating image: ${error}</p>`;
}

//-------------- 데이터 처리 함수
function processLogs(data) {
    // data가 배열이 아닌 경우 배열로 변환
    const logs = Array.isArray(data) ? data : Object.values(data);

    logs.forEach(log => {
        if (typeof log === 'object' && log !== null) {
            // log.data_types를 JSON 형식으로 파싱
            log.data_types = typeof log.data_types === 'string' ? JSON.parse(log.data_types) : log.data_types;
        }
    });

    return logs.filter(log => typeof log === 'object' && log !== null);
}

//-------------- 로그 데이터 처리 통합
function fetchLogs() {
    fetch('/allLogs', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    })
        .then(response => response.json())
        .then(data => {
            console.log('Fetched data:', data); // 응답 데이터 로그 확인

            const validLogs = processLogs(data);

            displayTodayLogs(validLogs);
            renderCalendar(new Date().getMonth(), new Date().getFullYear(), validLogs);

            const historyButton = document.getElementById("btn1");
            const todayButton = document.getElementById("btn2");
            historyButton.addEventListener('click', () => {
                displayAllLogs(validLogs);
                toggleButton(historyButton);
            });
            todayButton.addEventListener('click', () => {
                displayTodayLogs(validLogs);
                toggleButton(todayButton);
            });

            // 초기 활성화된 버튼 설정 (Today)
            toggleButton(todayButton);
        })
        .catch(error => {
            console.error('Error fetching logs:', error);
        });
}

//-------------- 로그 정렬
function groupLogsByDate(logs) {
    const grouped = logs[0].reduce((acc, log) => {
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

//-------------- 로그 출력 (s3 수정됨)
// <div class="nav-buttons">
// <button class="navigate-button" onclick="navigateToDate('${previousDate}')">&#10094;</button>
// <button class="navigate-button" onclick="navigateToDate('${nextDate}')">&#10095;</button>
// </div>

// function renderLogs(date, logs, showNavigation = false) {
//     const previousDate = new Date(new Date(date).setDate(new Date(date).getDate() - 1)).toLocaleDateString();
//     const nextDate = new Date(new Date(date).setDate(new Date(date).getDate() + 1)).toLocaleDateString();

//     const navigationButtons = showNavigation ? `
//         <div class="navigate-buttons">
//             <button class="navigate-button back" onclick="backToCalendar()">back</button>
//         </div>
//     ` : '';

//     return `
//         <div class="log-date-group">
//             <h3>${date}</h3>
//             ${navigationButtons}
//             ${logs.map(log => `
//                 ${log && typeof log === 'object' ? `
//                     <div class="log-item">
//                         <div class="log-content">
//                             <img src="${log.imagePath}" alt="Log Image">
//                             <div class="log-details">
//                                 ${log.isWeekly ? `
//                                     <p><strong>Weekly Image</strong></p>
//                                 ` : `
//                                     <p><strong>Time:</strong> ${new Date(log.timestamp).toLocaleString()}</p>
//                                     ${Object.keys(log.data_types).map(key => `
//                                         <p><strong>${key}:</strong> ${log.data_types[key] !== undefined ? log.data_types[key] : 'N/A'}</p>
//                                     `).join('')}
//                                 `}
//                                 <button class="toggle-prompt-button" onclick="togglePrompt(this)">See Prompt</button>
//                                 <p class="generated-prompt" style="display: none;"><strong>Generated Prompt:</strong> ${log.imagePrompt}</p>
//                                 ${log.memo ? `
//                                     <p><strong>Memo:</strong> ${log.memo}</p>
//                                     <button class="toggle-prompt-button" onclick="showMemoInput('${log.timestamp}', '${log.memo}')">Edit Memo</button>
//                                 ` : `
//                                     <button class="toggle-prompt-button" onclick="showMemoInput('${log.timestamp}')">Add Memo</button>
//                                 `}
//                                 <div id="memoInputContainer-${log.timestamp}" style="display: none;">
//                                     <div class="memo-input-content">
//                                         <textarea id="memoInput-${log.timestamp}" placeholder="Enter your memo"></textarea>
//                                         <button onclick="saveMemo('${log.timestamp}')">Save Memo</button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 ` : ''}
//             `).join('')}
//         </div>
//     `;
// }

// 로그 출력 함수에서 타임스탬프를 시간과 분까지만 표시하도록 수정
// 로그 출력 함수에서 타임스탬프 옆에 버튼 배치 및 입력 컨테이너를 타임스탬프 아래에 배치
// null 값을 체크하고, null인 경우 해당 필드를 표시하지 않도록 수정
function renderLogs(date, logs, showNavigation = false) {
    const navigationButtons = showNavigation ? `
        <button class="navigate-button back" onclick="backToCalendar()">이전</button>
    ` : '';

    return `
        <div class="log-date-group">
            <div class="log-date-navigation">
                ${navigationButtons}
                <h3>${date}</h3>
            </div>
            ${logs.map(log => `
                ${log && typeof log === 'object' ? `
                    <div class="log-item">
                        <div class="log-content">
                            <img src="${log.imagePath}" alt="Log Image">
                            <div class="log-details">
                                ${log.isWeekly ? `
                                    <p><strong>Weekly Image</strong></p>
                                ` : `
                                    <p><strong>기록 시간: </strong> ${new Date(log.timestamp).toLocaleDateString()} ${new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    <button class="toggle-prompt-button" style="margin-left: 10px;" onclick="showTimestampInput('${log.timestamp}')">수정</button></p>
                                    <hr class="divider">
                                    <div id="timestampInputContainer-${log.timestamp}" style="display: none;">
                                        <div class="timestamp-input-content">
                                            <input type="datetime-local" id="timestampInput-${log.timestamp}" value="${new Date(log.timestamp).toISOString().slice(0,16)}">
                                            <button onclick="saveTimestamp('${log.timestamp}')">저장</button>
                                        </div>
                                    </div>
                                    ${Object.keys(log.data_types).map(key => `
                                        ${log.data_types[key] !== null ? `<p><strong>${key}:</strong> ${log.data_types[key]}</p>` : ''}
                                    `).join('')}
                                `}
                                <button class="toggle-prompt-button" onclick="togglePrompt(this)">이미지 설명 열기</button>
                                <p class="generated-prompt" style="display: none;"><strong>AI의 이미지 설명:</strong> ${log.imagePrompt}</p>
                                ${log.memo ? `
                                    <p><strong>Memo:</strong> ${log.memo}</p>
                                    <button class="toggle-prompt-button" onclick="showMemoInput('${log.timestamp}', '${log.memo}')">메모 수정하기</button>
                                ` : `
                                    <button class="toggle-prompt-button" onclick="showMemoInput('${log.timestamp}')">메모 남기기</button>
                                `}
                                <div id="memoInputContainer-${log.timestamp}" style="display: none;">
                                    <div class="memo-input-content">
                                        <textarea id="memoInput-${log.timestamp}" placeholder="메모를 입력하세요."></textarea>
                                        <button onclick="saveMemo('${log.timestamp}')">메모 저장</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            `).join('')}
        </div>
    `;
}






//-------------- 프롬프트 보여주기
window.togglePrompt = function (button) {
    const promptElement = button.nextElementSibling;
    if (promptElement.style.display === 'none' || promptElement.style.display === '') {
        promptElement.style.display = 'block';
        button.innerText = '이미지 설명 닫기';
    } else {
        promptElement.style.display = 'none';
        button.innerText = '이미지 설명 열기';
    }
}

//-------------- 메모
// 메모 입력란 표시 함수
window.showMemoInput = function (timestamp, memo = '') {
    const memoInputContainer = document.getElementById(`memoInputContainer-${timestamp}`);
    const memoInput = document.getElementById(`memoInput-${timestamp}`);
    memoInput.value = memo;
    memoInputContainer.style.display = 'block';
}

// 메모 저장 함수
window.saveMemo = function (timestamp) {
    const memo = document.getElementById(`memoInput-${timestamp}`).value;

    fetch('/save-memo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            timestamp,
            memo
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Memo saved successfully!');
                fetchLogs(); // 메모 저장 후 로그를 다시 불러옴
            } else {
                alert('Error saving memo.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error saving memo.');
        });
}

//-------------- 로그 보여주기
// 오늘 로그
function displayTodayLogs(logs) {

    const logContainer = document.getElementById('logContainer');
    const today = new Date().toLocaleDateString();

    const todayLogs = logs[0]
        .filter(log => log && typeof log === 'object' && new Date(log.timestamp).toLocaleDateString() === today)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // 최신순으로 정렬
    console.log(logs[0])
    logContainer.innerHTML = todayLogs.length > 0 ? renderLogs(today, todayLogs) : `<p class="no-logs-message">오늘의 기록이 없습니다.</p>`;
}

// 전체 히스토리
function displayAllLogs(logs) {
    const logContainer = document.getElementById('logContainer');
    const groupedLogs = groupLogsByDate(logs);
    const sortedDates = Object.keys(groupedLogs).sort((a, b) => new Date(b) - new Date(a));
    logContainer.innerHTML = sortedDates.map(date => renderLogs(date, groupedLogs[date])).join('');
}

// Today | Histoy 버튼
function toggleButton(button) {
    const buttons = document.querySelectorAll('.action-button');

    buttons.forEach(btn => {
        btn.classList.remove('active');
    });

    button.classList.add('active');
}

// 날짜별 로그
// function displayLogsByDate(date, logs) {
//     const logDetailContainer = document.getElementById('logDetailContainer');
//     const dateLogs = logs[0]
//         .filter(log => new Date(log.timestamp).toLocaleDateString() === date)
//         .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

//     logDetailContainer.innerHTML = dateLogs.length > 0 ? renderLogs(date, dateLogs, true) : `<p>No logs for ${date}</p>`;
//     logDetailContainer.style.display = 'block'; // 로그 보여주기 위해 display 속성 변경
//     document.getElementById('calendar').style.display = 'none'; // 캘린더 숨김
//     document.getElementById('logContainer').style.display = 'none'; // 로그 목록 숨김
//     document.getElementById('buttonContainer').style.display = 'none'; // 버튼 컨테이너 숨김
// }

// 날짜별 로그 -- logContainer reference하도록 변경함.
function displayLogsByDate(date, logs) {
    const logContainer = document.getElementById('logContainer');
    const dateLogs = logs[0]
        .filter(log => new Date(log.timestamp).toLocaleDateString() === date)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    logContainer.innerHTML = dateLogs.length > 0 ? renderLogs(date, dateLogs, true) : `<p>No logs for ${date}</p>`;
    logContainer.style.display = 'block'; // 로그 보여주기 위해 display 속성 변경
    document.getElementById('calendar').style.display = 'none'; // 캘린더 숨김
    document.getElementById('buttonContainer').style.display = 'none'; // 버튼 컨테이너 숨김
}


// 캘린더 탭으로 돌아올 때 로그 상세보기 컨테이너 초기화
document.getElementById('calendarTab').addEventListener('click', () => {
    const logDetailContainer = document.getElementById('logDetailContainer');
    logDetailContainer.innerHTML = ''; // 컨테이너 초기화
    logDetailContainer.style.display = 'none'; // 컨테이너 숨기기
});

// 뒤로가기 버튼
// window.backToCalendar = function () {
//     const logDetailContainer = document.getElementById('logDetailContainer');
//     const calendarContainer = document.getElementById('calendar');
//     const logContainer = document.getElementById('logContainer');
//     const buttonContainer = document.getElementById('buttonContainer');

//     logDetailContainer.style.display = 'none'; // 로그 상세보기 컨테이너 숨김
//     logDetailContainer.innerHTML = ''; // 로그 상세보기 컨테이너 초기화
//     calendarContainer.style.display = 'block'; // 캘린더 표시
//     logContainer.style.display = 'none'; // 로그 목록 숨김
//     buttonContainer.style.display = 'none'; // 버튼 컨테이너 숨김
// }

// logcontainer만 reference 하도록 변경
window.backToCalendar = function () {
    const calendarContainer = document.getElementById('calendar');
    const logContainer = document.getElementById('logContainer');
    const buttonContainer = document.getElementById('buttonContainer');

    logContainer.style.display = 'none'; // 로그 목록 숨김
    logContainer.innerHTML = ''; // 로그 목록 초기화
    calendarContainer.style.display = 'block'; // 캘린더 표시
    buttonContainer.style.display = 'none'; // 버튼 컨테이너 숨김
}

//-------------- 캘린더 생성
// 캘린더 생성 함수
function renderCalendar(month, year, logs) {
    const calendar = document.getElementById('calendar');
    const groupedLogs = groupLogsByDate(logs);
    calendar.innerHTML = `
        <div class="calendar-header">
            <button class="calendar-navigate-button" onclick="navigateMonth(${month - 1}, ${year})">
             <span class="arrow arrow-left"></span>
            </button>
            <h2>${year}.${('0' + (month + 1)).slice(-2)}</h2>
            <button class="calendar-navigate-button" onclick="navigateMonth(${month + 1}, ${year})">
                <span class="arrow arrow-right"></span>
            </button>
        </div>
        <div class="calendar-grid">
            <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
            ${generateCalendarCells(month, year, groupedLogs)}
        </div>
    `;
}

// (s3 수정됨)
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
            <div class="calendar-cell" data-date="${dateStr}">
                <div class="date">${i}</div>
                ${logs ? `<img src="${logs[0].imagePath}" alt="Event Image" class="event-image" onclick="handleImageClick(event)">` : ''}
            </div>
        `;
    }

    return cells;
}


// 캘린더 내 이미지 클릭시 해당 날짜 로그로 이동
window.handleImageClick = function (event) {
    event.stopPropagation(); // 이벤트 버블링을 막기 위해 사용
    const date = event.target.closest('.calendar-cell').getAttribute('data-date');
    console.log('image clicked', date);

    fetch('/allLogs', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    })
        .then(response => response.json())
        .then(data => {
            console.log('Fetched data:', data); // 응답 데이터 로그 확인

            const validLogs = processLogs(data);

            displayLogsByDate(date, validLogs);
        })
        .catch(error => {
            console.error('Error fetching logs:', error);
        });
}

window.navigateMonth = function (month, year) {
    const newDate = new Date(year, month, 1);
    const newMonth = newDate.getMonth();
    const newYear = newDate.getFullYear();

    fetch('/allLogs', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    })
        .then(response => response.json())
        .then(data => {
            const validLogs = processLogs(data);
            renderCalendar(newMonth, newYear, validLogs);
        })
        .catch(error => {
            console.error('Error fetching logs:', error);
        });
}

// 캘린더에서 날짜 이동 
window.navigateToDate = function (date) {
    fetch('/allLogs', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    })
        .then(response => response.json())
        .then(data => {
            console.log('Fetched data:', data); // 응답 데이터 로그 확인

            const validLogs = processLogs(data);

            displayLogsByDate(date, validLogs);
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
    const logDetailContainer = document.getElementById('logDetailContainer');

    if (tabName === 'calendar') {
        calendarTab.classList.add('active');
        logTab.classList.remove('active');
        calendarContent.style.display = 'block';
        logContent.style.display = 'none';
        logDetailContainer.style.display = 'none'; // 캘린더 탭으로 돌아올 때 로그 상세보기 컨테이너 숨기기
        logDetailContainer.innerHTML = ''; // 로그 상세보기 컨테이너 초기화
        buttonContainer.style.display = 'none';
    } else if (tabName === 'log') {
        logTab.classList.add('active');
        calendarTab.classList.remove('active');
        logContent.style.display = 'block';
        logDetailContainer.style.display = 'none'; // Image Log 탭으로 돌아올 때 로그 상세보기 컨테이너 숨기기
        logDetailContainer.innerHTML = ''; // 로그 상세보기 컨테이너 초기화
        calendarContent.style.display = 'none';
        buttonContainer.style.display = 'block';
    }
}

//--------- 모달로 폼 열기
window.showForm = function () {
    document.getElementById('formModal').style.display = 'flex';
}

window.hideForm = function () {
    document.getElementById('formModal').style.display = 'none';
}

// 모달 외부를 클릭하면 닫히도록
window.onclick = function (event) {
    const modal = document.getElementById('formModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Weekly Image

// "일요일인가요? 이번주의 이미지를 생성해보세요" 메시지 클릭 이벤트 리스너 추가
document.getElementById('weeklyImageMessage').addEventListener('click', function() {
    const button = document.getElementById('generateWeeklyImage');
    if (button.style.display === 'none' || button.style.display === '') {
        button.style.display = 'block';
    } else {
        button.style.display = 'none';
    }
});

document.getElementById('generateWeeklyImage').addEventListener('click', function() {
    // 현재 날짜 가져오기
    const today = new Date();
    // n일 전 날짜 계산 (나중에 일주일 단위로 변경하기)
    const startDate = new Date();
    startDate.setDate(today.getDate() - 7);

    // yyyy-mm-dd 형식으로 변환
    const formatDate = (date) => date.toISOString().split('T')[0];

    // 시작 날짜와 종료 날짜 설정
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(today);

    showLoadingSpinner();

    fetch('/generate-weekly-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            startDate: formattedStartDate,
            endDate: formattedEndDate
        }),
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

//timestamp 수정
// 타임스탬프 입력란 표시 함수
window.showTimestampInput = function (timestamp) {
    const timestampInputContainer = document.getElementById(`timestampInputContainer-${timestamp}`);
    const timestampInput = document.getElementById(`timestampInput-${timestamp}`);
    
    // timestamp를 로컬 시간대로 변환하여 설정
    const localTimestamp = new Date(timestamp).toLocaleString('sv-SE', { timeZoneName: 'short' }).replace(' ', 'T').slice(0, 16);
    timestampInput.value = localTimestamp;

    timestampInputContainer.style.display = 'block';
}

// 타임스탬프 저장 함수
window.saveTimestamp = function (oldTimestamp) {
    const newTimestamp = document.getElementById(`timestampInput-${oldTimestamp}`).value;

    // newTimestamp를 ISO 형식으로 변환 (UTC 시간대로)
    const newTimestampISO = new Date(newTimestamp).toISOString();

    fetch('/save-timestamp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            oldTimestamp,
            newTimestamp: newTimestampISO
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Timestamp saved successfully!');
            fetchLogs(); // 타임스탬프 저장 후 로그를 다시 불러옴
        } else {
            alert('Error saving timestamp.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving timestamp.');
    });
}