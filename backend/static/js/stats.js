// JavaScript для страницы статистики с подключением к API
document.addEventListener('DOMContentLoaded', function() {
    // ====================== ПЕРЕМЕННЫЕ И КОНФИГУРАЦИЯ ======================
    
    // WebSocket соединение
    let ws = null;
    
    // Данные статистики
    let statisticsData = {
        activeClients: 0,
        monthlyLessons: 0,
        avgAttendance: 0,
        monthlyRevenue: 0,
        attendance: [],
        revenue: [],
        popularClasses: [],
        newClients: [],
        trainersStats: []
    };
    
    // Объекты графиков
    let charts = {
        attendance: null,
        income: null,
        classes: null,
        newClients: null
    };
    
    // API коды для статистики
    const STATS_API_CODES = {
        // Запросы
        GET_OVERVIEW_STATS: 500,
        GET_ATTENDANCE_STATS: 501,
        GET_REVENUE_STATS: 502,
        GET_TRAINERS_STATS: 503,
        GET_POPULAR_CLASSES: 504,
        GET_NEW_CLIENTS_STATS: 505,
        EXPORT_STATS: 510,
        
        // Ответы
        OVERVIEW_STATS: 600,
        ATTENDANCE_STATS: 601,
        REVENUE_STATS: 602,
        TRAINERS_STATS: 603,
        POPULAR_CLASSES: 604,
        NEW_CLIENTS_STATS: 605,
        EXPORT_DATA: 610,
        
        // Общие
        SUCCESS: 200,
        ERROR: 400
    };
    
    // Текущий выбранный период
    let currentPeriod = {
        type: 'month', // week, month, quarter, year, custom
        startDate: null,
        endDate: null
    };
    
    // Цвета для графиков
    const chartColors = {
        primary: '#E6B5A2',
        secondary: '#FFCDB8',
        tertiary: '#E09380',
        light: '#FBEAE2',
        cancelled: '#E2DCDA',
        scheduled: '#D7E4D9',
        background: '#FDFBF8',
        border: '#D5C7B8',
        success: '#4CAF50',
        warning: '#FF9800',
        danger: '#F44336'
    };
    
    // ====================== ИНИЦИАЛИЗАЦИЯ ======================
    
    // Настройка Chart.js по умолчанию
    Chart.defaults.font.family = "'Roboto', 'Segoe UI', Arial, sans-serif";
    Chart.defaults.color = '#555555';
    Chart.defaults.scale.grid.color = '#E8DFD6';
    Chart.defaults.plugins.tooltip.backgroundColor = '#333333';
    Chart.defaults.plugins.tooltip.titleColor = '#FFFFFF';
    Chart.defaults.plugins.tooltip.bodyColor = '#FFFFFF';
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.padding = 10;
    
    // Инициализация WebSocket
    initializeWebSocket();
    
    // Инициализация обработчиков событий
    initializeEventHandlers();
    
    // ====================== WEBSOCKET ФУНКЦИИ ======================
    
    function initializeWebSocket() {
        try {
            const token = localStorage.getItem("token");
            ws = new WebSocket('ws://localhost:8000/socket/?token=' + token);
            
            ws.onopen = function() {
                console.log('WebSocket соединение для статистики установлено');
                loadInitialData();
            };
            
            ws.onmessage = function(event) {
                console.log('Получены данные статистики:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    processWebSocketMessage(data);
                } catch (error) {
                    console.error('Ошибка при обработке данных статистики:', error);
                }
            };
            
            ws.onerror = function(error) {
                console.error('WebSocket ошибка статистики:', error);
                // Загружаем демо-данные в случае ошибки
                loadDemoData();
            };
            
            ws.onclose = function() {
                console.log('WebSocket соединение статистики закрыто');
                // Попытка переподключения через 5 секунд
                setTimeout(initializeWebSocket, 5000);
            };
        } catch (error) {
            console.error('Ошибка создания WebSocket:', error);
            loadDemoData();
        }
    }
    
    function sendStatsRequest(code, data = {}) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            const message = {
                code: code,
                period: currentPeriod,
                ...data
            };
            ws.send(JSON.stringify(message));
            console.log('Отправлен запрос статистики:', message);
        } else {
            console.error('WebSocket не подключен для отправки запроса статистики');
        }
    }
    
    function processWebSocketMessage(data) {
        console.log('Обработка сообщения статистики:', data.code);
        
        switch(data.code) {
            case STATS_API_CODES.OVERVIEW_STATS:
                updateOverviewStats(data.data);
                break;
                
            case STATS_API_CODES.ATTENDANCE_STATS:
                updateAttendanceChart(data.data);
                break;
                
            case STATS_API_CODES.REVENUE_STATS:
                updateRevenueChart(data.data);
                break;
                
            case STATS_API_CODES.TRAINERS_STATS:
                updateTrainersTable(data.data);
                break;
                
            case STATS_API_CODES.POPULAR_CLASSES:
                updatePopularClassesChart(data.data);
                break;
                
            case STATS_API_CODES.NEW_CLIENTS_STATS:
                updateNewClientsChart(data.data);
                break;
                
            case STATS_API_CODES.EXPORT_DATA:
                handleExportData(data.data);
                break;
                
            case STATS_API_CODES.SUCCESS:
                console.log('Операция выполнена успешно');
                break;
                
            case STATS_API_CODES.ERROR:
                console.error('Ошибка сервера:', data.message);
                showErrorMessage(data.message);
                break;
                
            default:
                console.log('Неизвестный код статистики:', data.code);
        }
    }
    
    // ====================== ЗАГРУЗКА ДАННЫХ ======================
    
    function loadInitialData() {
        // Загружаем все необходимые данные при инициализации
        sendStatsRequest(STATS_API_CODES.GET_OVERVIEW_STATS);
        sendStatsRequest(STATS_API_CODES.GET_ATTENDANCE_STATS);
        sendStatsRequest(STATS_API_CODES.GET_REVENUE_STATS);
        sendStatsRequest(STATS_API_CODES.GET_TRAINERS_STATS);
        sendStatsRequest(STATS_API_CODES.GET_POPULAR_CLASSES);
        sendStatsRequest(STATS_API_CODES.GET_NEW_CLIENTS_STATS);
    }
    
    function loadDataForPeriod(period) {
        currentPeriod = period;
        
        // Показываем индикаторы загрузки
        showLoadingIndicators();
        
        // Загружаем данные для нового периода
        loadInitialData();
    }
    
    function showLoadingIndicators() {
        // Показываем спиннеры загрузки на карточках
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach(value => {
            value.textContent = '...';
        });
    }
    
    // ====================== ОБНОВЛЕНИЕ UI ======================
    
    function updateOverviewStats(data) {
        console.log('Обновление общей статистики:', data);
        
        // Обновляем карточки статистики
        const statCards = document.querySelectorAll('.stat-card');
        
        if (statCards[0]) {
            const activeClientsValue = statCards[0].querySelector('.stat-value');
            const activeClientsChange = statCards[0].querySelector('.stat-change');
            
            activeClientsValue.textContent = data.activeClients || 0;
            updateStatChange(activeClientsChange, data.activeClientsChange || 0);
        }
        
        if (statCards[1]) {
            const monthlyLessonsValue = statCards[1].querySelector('.stat-value');
            const monthlyLessonsChange = statCards[1].querySelector('.stat-change');
            
            monthlyLessonsValue.textContent = data.monthlyLessons || 0;
            updateStatChange(monthlyLessonsChange, data.monthlyLessonsChange || 0);
        }
        
        if (statCards[2]) {
            const avgAttendanceValue = statCards[2].querySelector('.stat-value');
            const avgAttendanceChange = statCards[2].querySelector('.stat-change');
            
            avgAttendanceValue.textContent = (data.avgAttendance || 0) + '%';
            updateStatChange(avgAttendanceChange, data.avgAttendanceChange || 0);
        }
        
        if (statCards[3]) {
            const monthlyRevenueValue = statCards[3].querySelector('.stat-value');
            const monthlyRevenueChange = statCards[3].querySelector('.stat-change');
            
            monthlyRevenueValue.textContent = formatCurrency(data.monthlyRevenue || 0);
            updateStatChange(monthlyRevenueChange, data.monthlyRevenueChange || 0);
        }
        
        // Сохраняем данные
        statisticsData = { ...statisticsData, ...data };
    }
    
    function updateStatChange(element, change) {
        if (!element) return;
        
        const isPositive = change > 0;
        const isNegative = change < 0;
        
        element.className = 'stat-change ' + (isPositive ? 'positive' : isNegative ? 'negative' : '');
        element.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="${isPositive ? 'M18 15L12 9L6 15' : 'M6 9L12 15L18 9'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${Math.abs(change)}%
        `;
    }
    
    function updateAttendanceChart(data) {
        console.log('Обновление графика посещаемости:', data);
        
        const ctx = document.getElementById('attendanceChart');
        if (!ctx) return;
        
        // Уничтожаем предыдущий график
        if (charts.attendance) {
            charts.attendance.destroy();
        }
        
        charts.attendance = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Групові заняття',
                    data: data.groupLessons || [],
                    borderColor: chartColors.primary,
                    backgroundColor: hexToRGBA(chartColors.primary, 0.1),
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }, {
                    label: 'Індивідуальні заняття',
                    data: data.individualLessons || [],
                    borderColor: chartColors.tertiary,
                    backgroundColor: hexToRGBA(chartColors.tertiary, 0.1),
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.raw + ' занять';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 10 }
                    }
                }
            }
        });
    }
    
    function updateRevenueChart(data) {
        console.log('Обновление графика доходов:', data);
        
        const ctx = document.getElementById('incomeChart');
        if (!ctx) return;
        
        // Уничтожаем предыдущий график
        if (charts.income) {
            charts.income.destroy();
        }
        
        charts.income = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: data.labels || ['Групові заняття', 'Індивідуальні заняття', 'Абонементи', 'Інше'],
                datasets: [{
                    data: data.values || [0, 0, 0, 0],
                    backgroundColor: [
                        chartColors.primary,
                        chartColors.tertiary,
                        chartColors.secondary,
                        chartColors.light
                    ],
                    borderColor: chartColors.background,
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((context.raw / total) * 100) : 0;
                                return context.label + ': ' + formatCurrency(context.raw) + ' (' + percentage + '%)';
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }
    
    function updatePopularClassesChart(data) {
        console.log('Обновление графика популярных занятий:', data);
        
        const ctx = document.getElementById('classesChart');
        if (!ctx) return;
        
        // Уничтожаем предыдущий график
        if (charts.classes) {
            charts.classes.destroy();
        }
        
        charts.classes = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Кількість занять',
                    data: data.values || [],
                    backgroundColor: hexToRGBA(chartColors.primary, 0.7),
                    borderColor: chartColors.primary,
                    borderWidth: 1,
                    borderRadius: 6,
                    hoverBackgroundColor: chartColors.primary
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw + ' занять';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { display: false }
                    },
                    y: {
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    function updateNewClientsChart(data) {
        console.log('Обновление графика новых клиентов:', data);
        
        const ctx = document.getElementById('newClientsChart');
        if (!ctx) return;
        
        // Уничтожаем предыдущий график
        if (charts.newClients) {
            charts.newClients.destroy();
        }
        
        charts.newClients = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Нові клієнти',
                    data: data.values || [],
                    borderColor: chartColors.tertiary,
                    backgroundColor: hexToRGBA(chartColors.tertiary, 0.1),
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: chartColors.tertiary,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 5 }
                    }
                }
            }
        });
    }
    
    function updateTrainersTable(data) {
        console.log('Обновление таблицы тренеров:', data);
        
        const tbody = document.querySelector('.trainers-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!data.trainers || data.trainers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        Немає даних про тренерів
                    </td>
                </tr>
            `;
            return;
        }
        
        data.trainers.forEach(trainer => {
            const row = document.createElement('tr');
            
            // Получаем инициалы тренера
            const nameParts = trainer.name.split(' ');
            const initials = nameParts.length > 1 
                ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() 
                : (nameParts[0][0] + (nameParts[0][1] || '')).toUpperCase();
            
            row.innerHTML = `
                <td class="trainer-cell">
                    <div class="trainer-avatar">${initials}</div>
                    <div>${trainer.name}</div>
                </td>
                <td>${trainer.lessonsCount || 0}</td>
                <td>${trainer.clientsCount || 0}</td>
                <td>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${trainer.attendanceRate || 0}%;"></div>
                        <span class="progress-value">${trainer.attendanceRate || 0}%</span>
                    </div>
                </td>
                <td>${formatCurrency(trainer.revenue || 0)}</td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    // ====================== ОБРАБОТЧИКИ СОБЫТИЙ ======================
    
    function initializeEventHandlers() {
        // Обработчики кнопок периодов
        const periodBtns = document.querySelectorAll('.period-btn');
        periodBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Убираем активный класс у всех кнопок
                periodBtns.forEach(b => b.classList.remove('active'));
                
                // Добавляем активный класс текущей кнопке
                this.classList.add('active');
                
                // Определяем тип периода
                const periodType = this.textContent.toLowerCase();
                let period = { type: periodType };
                
                switch(periodType) {
                    case 'тиждень':
                        period.type = 'week';
                        break;
                    case 'місяць':
                        period.type = 'month';
                        break;
                    case 'квартал':
                        period.type = 'quarter';
                        break;
                    case 'рік':
                        period.type = 'year';
                        break;
                }
                
                loadDataForPeriod(period);
            });
        });
        
        // Обработчик кнопки применения диапазона дат
        const applyBtn = document.querySelector('.apply-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', function() {
                const startDate = document.getElementById('start-date').value;
                const endDate = document.getElementById('end-date').value;
                
                if (startDate && endDate) {
                    const period = {
                        type: 'custom',
                        startDate: startDate,
                        endDate: endDate
                    };
                    
                    loadDataForPeriod(period);
                } else {
                    showErrorMessage('Оберіть початкову та кінцеву дати');
                }
            });
        }
        
        // Обработчики кнопок экспорта и деталей
        const actionBtns = document.querySelectorAll('.chart-action-btn, .table-action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.textContent.trim();
                const chartContainer = this.closest('.chart-container, .stats-table');
                const chartType = getChartType(chartContainer);
                
                if (action.includes('Експорт') || action.includes('Завантажити')) {
                    exportData(chartType);
                } else if (action.includes('Деталі')) {
                    showDetails(chartType);
                }
            });
        });
        
        // Обработчик обновления данных
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                this.classList.add('loading');
                loadInitialData();
                
                setTimeout(() => {
                    this.classList.remove('loading');
                }, 2000);
            });
        }
    }
    
    // ====================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======================
    
    function hexToRGBA(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    function formatCurrency(amount) {
        return new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'UAH',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    function formatDate(dateString, format = 'short') {
        const date = new Date(dateString);
        
        if (format === 'short') {
            return date.toLocaleDateString('uk-UA', {
                day: '2-digit',
                month: '2-digit'
            });
        }
        
        return date.toLocaleDateString('uk-UA');
    }
    
    function generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        
        // Полные звезды
        for (let i = 0; i < fullStars; i++) {
            stars += '<span class="star filled">★</span>';
        }
        
        // Половинчатая звезда
        if (hasHalfStar) {
            stars += '<span class="star half-filled">★</span>';
        }
        
        // Пустые звезды
        for (let i = 0; i < emptyStars; i++) {
            stars += '<span class="star">★</span>';
        }
        
        return stars;
    }
    
    function getChartType(container) {
        if (container.querySelector('#attendanceChart')) return 'attendance';
        if (container.querySelector('#incomeChart')) return 'income';
        if (container.querySelector('#classesChart')) return 'classes';
        if (container.querySelector('#newClientsChart')) return 'newClients';
        if (container.querySelector('.trainers-table')) return 'trainers';
        return 'unknown';
    }
    
    function exportData(chartType) {
        console.log(`Экспорт данных для: ${chartType}`);
        
        sendStatsRequest(STATS_API_CODES.EXPORT_STATS, {
            chartType: chartType,
            format: 'xlsx' // можно также 'csv', 'pdf'
        });
    }
    
    function handleExportData(data) {
        if (data.downloadUrl) {
            // Создаем скрытую ссылку для скачивания
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = data.filename || 'statistics.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (data.content) {
            // Создаем blob и скачиваем файл
            const blob = new Blob([data.content], { type: data.mimeType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = data.filename || 'statistics.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    }
    
    function showDetails(chartType) {
        console.log(`Показать детали для: ${chartType}`);
        
        // Можно открыть модальное окно с детальной информацией
        // или перенаправить на страницу с детальной статистикой
        const detailsModal = document.createElement('div');
        detailsModal.className = 'modal-overlay active';
        detailsModal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3>Детальна статистика: ${getChartTitle(chartType)}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Детальна інформація буде доступна в наступній версії</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-details">Закрити</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(detailsModal);
        
        // Обработчики закрытия модального окна
        const closeBtn = detailsModal.querySelector('.modal-close');
        const closeFooterBtn = detailsModal.querySelector('.close-details');
        
        const closeModal = () => {
            document.body.removeChild(detailsModal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        closeFooterBtn.addEventListener('click', closeModal);
        detailsModal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    
    function getChartTitle(chartType) {
        const titles = {
            attendance: 'Відвідуваність',
            income: 'Дохід',
            classes: 'Популярні заняття',
            newClients: 'Нові клієнти',
            trainers: 'Ефективність тренерів'
        };
        
        return titles[chartType] || 'Статистика';
    }
    
    function showErrorMessage(message) {
        // Создаем уведомление об ошибке
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">⚠️</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Добавляем стили
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(notification);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
        
        // Обработчик кнопки закрытия
        notification.querySelector('.notification-close').addEventListener('click', () => {
            document.body.removeChild(notification);
        });
    }
    
    // ====================== ДЕМО ДАННЫЕ ======================
    
    function loadDemoData() {
        console.log('Загрузка демо-данных статистики');
        
        // Имитация данных обзора
        updateOverviewStats({
            activeClients: 128,
            activeClientsChange: 8,
            monthlyLessons: 94,
            monthlyLessonsChange: 12,
            avgAttendance: 82,
            avgAttendanceChange: -3,
            monthlyRevenue: 45600,
            monthlyRevenueChange: 15
        });
        
        // Имитация данных посещаемости
        updateAttendanceChart({
            labels: ['01 Трав', '05 Трав', '10 Трав', '15 Трав', '20 Трав', '25 Трав', '30 Трав'],
            groupLessons: [28, 32, 36, 30, 34, 31, 38],
            individualLessons: [12, 15, 18, 14, 16, 19, 15]
        });
        
        // Имитация данных доходов
        updateRevenueChart({
            labels: ['Групові заняття', 'Індивідуальні заняття', 'Абонементи', 'Інше'],
            values: [25000, 12000, 6000, 2600]
        });
        
        // Имитация популярных занятий
        updatePopularClassesChart({
            labels: ['Матовий пілатес', 'Реформер', 'Барре', 'Стретчинг', 'ТРХ', 'Пренатальний'],
            values: [38, 24, 16, 12, 8, 6]
        });
        
        // Имитация новых клиентов
        updateNewClientsChart({
            labels: ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер'],
            values: [12, 18, 15, 22, 16, 20]
        });
        
        // Имитация данных тренеров (без рейтинга)
        updateTrainersTable({
            trainers: [
                {
                    name: 'Олександра Іванова',
                    lessonsCount: 32,
                    clientsCount: 58,
                    attendanceRate: 95,
                    revenue: 15200
                },
                {
                    name: 'Дмитро Петров',
                    lessonsCount: 28,
                    clientsCount: 42,
                    attendanceRate: 82,
                    revenue: 13600
                },
                {
                    name: 'Марія Сидорова',
                    lessonsCount: 34,
                    clientsCount: 63,
                    attendanceRate: 88,
                    revenue: 16800
                }
            ]
        });
    }
    
    // ====================== ЭКСПОРТ ФУНКЦИЙ ======================
    
    // Экспортируем функции для использования в других скриптах
    window.StatsAPI = {
        loadDataForPeriod,
        exportData,
        sendStatsRequest,
        updateOverviewStats,
        updateAttendanceChart,
        updateRevenueChart,
        updatePopularClassesChart,
        updateNewClientsChart,
        updateTrainersTable
    };
    
    console.log('Модуль статистики инициализирован');
});