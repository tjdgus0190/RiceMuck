
function formatDateToInput(value) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

let currentDate = new Date(); // 전역 변수로 선언

document.addEventListener('DOMContentLoaded', () => {
    const currentDate = new Date();
    initializeChart(); // 차트 초기화 함수 호출
    loadMonthlyRecords(currentDate);
    loadRecords();
    updateRiceValues();
    updateOverallTotals();

    document.getElementById('inputTab').addEventListener('click', showInputFormSection);
    document.getElementById('overviewTab').addEventListener('click', showOverviewSection);

    document.querySelectorAll('.multiply-button').forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const multiplier = parseInt(button.getAttribute('data-multiplier'));
            input.value = parseFormattedNumber(input.value) * multiplier;
        });
    });

    const dateInput = document.getElementById('dateInput');
    dateInput.value = formatDateToInput(new Date());

    document.getElementById('prevMonth').addEventListener('click', () => {
        const currentMonth = new Date(document.getElementById('dateInput').value);
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        document.getElementById('dateInput').value = formatDateToInput(currentMonth);
        loadMonthlyRecords(currentMonth);
        updateChart('toggleRice');  // 차트를 갱신
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        const currentMonth = new Date(document.getElementById('dateInput').value);
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        document.getElementById('dateInput').value = formatDateToInput(currentMonth);
        loadMonthlyRecords(currentMonth);
        updateChart('toggleRice');  // 차트를 갱신
    });

    dateInput.addEventListener('change', () => {
        const selectedDate = dateInput.value;
        loadRecords(selectedDate);
        updateRiceValues(selectedDate); // 선택한 날짜에 맞게 업데이트
    });

    loadRecords(dateInput.value);
    updateRiceValues(dateInput.value);
    updateOverallTotals();
    loadMonthlyRecords(new Date());

    document.getElementById('saveButton').addEventListener('click', () => {
        const dateValue = dateInput.value;
        const dailyExpense = Math.floor(parseFormattedNumber(document.getElementById('dailyExpense').value));
        const currentPiecePrice = Math.floor(parseFormattedNumber(document.getElementById('currentPiecePrice').value));
        const dailyPieces = parseInt(document.getElementById('dailyPieces').value) || 0;
        const ricePrice = Math.floor(parseFormattedNumber(document.getElementById('ricePrice').value));

        // 수입 계산: (획득 조각 최저가 * 획득 조각) + 획득 메소
        const dailyIncome = Math.floor((currentPiecePrice * dailyPieces) + dailyExpense);

        
        // 쌀값 계산: 수입 / 100000000 * 오늘의 쌀값
        const dailyRiceValue = Math.floor((dailyIncome / 100000000) * ricePrice);


        const recordDate = dateValue || formatDateToInput(new Date());

        let records = JSON.parse(localStorage.getItem('records')) || [];
        const existingRecordIndex = records.findIndex(record => record.date === recordDate);

        if (existingRecordIndex !== -1) {
            records[existingRecordIndex].dailyIncome += dailyIncome;
            records[existingRecordIndex].dailyRiceValue += dailyRiceValue;
            records[existingRecordIndex].dailyPieces += dailyPieces;
            records[existingRecordIndex].dailyExpense += dailyExpense;
        } else {
            const record = {
                date: recordDate,
                dailyPieces: dailyPieces,
                dailyExpense: dailyExpense,
                dailyIncome: dailyIncome,
                dailyRiceValue: dailyRiceValue
            };
            records.push(record);
        }

        localStorage.setItem('records', JSON.stringify(records));
        loadRecords(recordDate);
        updateRiceValues(recordDate);
        updateOverallTotals();
        loadMonthlyRecords(new Date());
    });
});


    document.getElementById('clearStorageButton').addEventListener('click', () => {
        if (confirm('정말로 로컬 스토리지를 초기화하시겠습니까? 모든 기록이 삭제됩니다.')) {
            localStorage.clear();
            loadRecords(new Date().toISOString().split('T')[0]); // 초기화 후 기록 목록을 다시 로드
            updateRiceValues();
            updateOverallTotals();
            loadMonthlyRecords(new Date());
            alert('로컬 스토리지가 초기화되었습니다.');
        }
    });

    document.querySelectorAll('.chart-toggle').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.chart-toggle').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            if (dataChart) {
                updateChart(button.id); // 호출 시점에 정의된 함수인지 확인
            }
        });
    });


function initializeChart() {
    const ctx = document.getElementById('dataChart').getContext('2d');
    dataChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '데이터',
                data: [],
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.2)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '날짜'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '값'
                    }
                }
            }
        }
    });
}
function updateChart(chartType) {
    const records = JSON.parse(localStorage.getItem('records')) || [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const labels = [];
    const data = [];

    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        // 월-일 형식으로 레이블 생성
        const currentDateStr = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        labels.push(currentDateStr);
        const record = records.find(r => r.date === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`) || {
            dailyIncome: 0,
            dailyRiceValue: 0,
            dailyPieces: 0
        };
        switch (chartType) {
            case 'toggleRice':
                data.push(Math.floor(record.dailyRiceValue / 10000)); // 쌀값을 만원으로 변환
                break;
            case 'togglePieces':
                data.push(record.dailyPieces); // 조각 개수
                break;
            case 'toggleExpense':
                data.push(Math.floor(record.dailyIncome / 100000000)); // 메소를 억 단위로 변환
                break;
        }
    }

    dataChart.data.labels = labels;
    dataChart.data.datasets[0].data = data;
    dataChart.data.datasets[0].label = {
        'toggleRice': '쌀값',
        'togglePieces': '조각 개수',
        'toggleExpense': '메소'
    }[chartType];
    
    dataChart.options.scales.y.title.text = {
        'toggleRice': '만원',
        'togglePieces': '조각',
        'toggleExpense': '억'
    }[chartType];
    
    dataChart.update();
}



function parseFormattedNumber(value) {
    return Math.floor(parseFloat(value.replace(/,/g, ''))) || 0;
}

function showInputFormSection() {
    document.getElementById('inputFormSection').style.display = 'block';
    document.getElementById('overviewSection').style.display = 'none';
    document.getElementById('inputTab').classList.add('active');
    document.getElementById('overviewTab').classList.remove('active');
}

function showOverviewSection() {
    document.getElementById('inputFormSection').style.display = 'none';
    document.getElementById('overviewSection').style.display = 'block';
    document.getElementById('inputTab').classList.remove('active');
    document.getElementById('overviewTab').classList.add('active');
}


function loadRecords(selectedDate) {
    const records = JSON.parse(localStorage.getItem('records')) || [];
    const recordList = document.getElementById('recordList');
    recordList.innerHTML = ''; 

    const record = records.find(r => r.date === selectedDate);

    if (record) {
        displayRecord(record);
    } else {
        recordList.innerHTML = '<p>해당 날짜의 기록이 없습니다.</p>';
    }
}
function displayRecord(record) {
    const recordList = document.getElementById('recordList');
    const recordItem = document.createElement('div');
    recordItem.className = 'record-item';

    recordItem.innerHTML = `
        <p>날짜: ${record.date}</p>
        <p>하루 조각 개수: ${formatNumber(record.dailyPieces || 0)}</p>
        <p>하루 메소: ${formatNumber(record.dailyExpense || 0)} 메소</p>
        <p>쌀 값: ${formatNumber(record.dailyRiceValue || 0)} 원</p>
    `;
    
    recordList.appendChild(recordItem);
}

function formatNumber(num) {
    if (num === undefined || num === null) {
        return '0'; // 또는 다른 기본값 설정
    }
    return Math.floor(num).toLocaleString(); // 소숫점 제거
}
function getPreviousDate(dateStr) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
}
function updateRiceValues(selectedDate) {
    const records = JSON.parse(localStorage.getItem('records')) || [];
    const currentRecord = records.find(record => record.date === selectedDate);

    if (!currentRecord) return;

    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = formatDateToInput(yesterday);
    const yesterdayRecord = records.find(record => record.date === yesterdayDate);

    const riceValueElement = document.getElementById('riceValue');
    const differenceElement = document.getElementById('difference');

    // ID가 일치하는 요소가 존재하는지 확인
    if (!riceValueElement || !differenceElement) {
        console.error('riceValue 또는 difference 요소를 찾을 수 없습니다.');
        return;
    }

    if (yesterdayRecord) {
        const riceValueChange = currentRecord.dailyRiceValue - yesterdayRecord.dailyRiceValue;
        riceValueElement.textContent = `쌀 값: ${formatNumber(currentRecord.dailyRiceValue)} 원`;
        differenceElement.textContent = `어제 대비 증감: ${formatNumber(riceValueChange)} 원`;
    } else {
        riceValueElement.textContent = `쌀 값: ${formatNumber(currentRecord.dailyRiceValue)} 원`;
        differenceElement.textContent = `어제 데이터가 없습니다.`;
    }
}

function updateOverallTotals() {
    const records = JSON.parse(localStorage.getItem('records')) || [];
    let overallTotalIncome = 0;
    let overallTotalRiceValue = 0;

    records.forEach(record => {
        overallTotalIncome += record.dailyIncome;
        overallTotalRiceValue += record.dailyRiceValue;
    });

    document.getElementById('overallTotalIncome').innerText = formatNumber(overallTotalIncome);
    document.getElementById('overallTotalRiceValue').innerText = formatNumber(overallTotalRiceValue);
}

function loadMonthlyRecords(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const records = JSON.parse(localStorage.getItem('records')) || [];

    const overviewTableBody = document.querySelector('#overviewTable tbody');
    if (!overviewTableBody) {
        console.error('Table body element not found.');
        return;
    }
    
    overviewTableBody.innerHTML = ''; // 기존 데이터 초기화

    let totalMonthlyIncome = 0;
    let totalMonthlyRiceValue = 0;

    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const currentDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = records.find(r => r.date === currentDate) || {
            dailyIncome: 0,
            dailyRiceValue: 0
        };

        totalMonthlyIncome += record.dailyIncome;
        totalMonthlyRiceValue += record.dailyRiceValue;

        // 3일마다 테이블에 추가
        if (day % 3 === 1 || day === 1) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="3" style="border-top: 2px solid #000;"></td>
            `;
            overviewTableBody.appendChild(row);
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${currentDate}</td>
            <td>${formatNumber(record.dailyIncome)}</td>
            <td>${formatNumber(record.dailyRiceValue)}원</td>
        `;
        overviewTableBody.appendChild(row);
    }

    document.getElementById('monthlyTotalIncome').innerText = formatNumber(totalMonthlyIncome);
    document.getElementById('monthlyTotalRiceValue').innerText = formatNumber(totalMonthlyRiceValue);
    document.getElementById('currentMonth').innerText = `${year}년 ${month + 1}월`;

    // 초기 차트 업데이트
    updateChart('toggleRice');
    
}

function changeMonth(delta) {
    const currentMonthText = document.getElementById('currentMonth').innerText;
    const [year, month] = currentMonthText.replace('년', '').replace('월', '').trim().split(' ').map(Number);
    const newDate = new Date(year, month - 1 + delta, 1);
    loadMonthlyRecords(newDate);
}

function deleteRecord(index) {
    let records = JSON.parse(localStorage.getItem('records')) || [];
    records.splice(index, 1);
    localStorage.setItem('records', JSON.stringify(records));
    loadRecords();
    updateRiceValues();
    updateOverallTotals();
    loadMonthlyRecords(new Date());
}

let timerInterval;
let timerSeconds = 0;

function updateTimerDisplay() {
    const hours = String(Math.floor(timerSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(timerSeconds % 60).padStart(2, '0');
    document.getElementById('timerDisplay').textContent = `${hours}:${minutes}:${seconds}`;
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            alert('타이머가 종료되었습니다!');
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    timerSeconds = 0;
    updateTimerDisplay();
}

document.getElementById('setMaterialCost').addEventListener('click', () => {
    timerSeconds = 30 * 60; // 30분
    updateTimerDisplay();
});

document.getElementById('setReacquisitionCost').addEventListener('click', () => {
    timerSeconds = 2 * 60 * 60; // 2시간
    updateTimerDisplay();
});

document.getElementById('startTimer').addEventListener('click', () => {
    startTimer();
});

document.getElementById('resetTimer').addEventListener('click', () => {
    resetTimer();
});

function showTimerSection() {
    document.getElementById('inputFormSection').style.display = 'none';
    document.getElementById('overviewSection').style.display = 'none';
    document.getElementById('timerSection').style.display = 'block';
    document.getElementById('inputTab').classList.remove('active');
    document.getElementById('overviewTab').classList.remove('active');
    document.getElementById('timerTab').classList.add('active');
}

document.getElementById('timerTab').addEventListener('click', showTimerSection);