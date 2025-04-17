// JavaScript для страницы статистики с графиками
document.addEventListener('DOMContentLoaded', function() {
    // Настройка для всех графиков Chart.js
    Chart.defaults.font.family = "'Roboto', 'Segoe UI', Arial, sans-serif";
    Chart.defaults.color = '#555555';
    Chart.defaults.scale.grid.color = '#E8DFD6';
    Chart.defaults.plugins.tooltip.backgroundColor = '#333333';
    Chart.defaults.plugins.tooltip.titleColor = '#FFFFFF';
    Chart.defaults.plugins.tooltip.bodyColor = '#FFFFFF';
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.padding = 10;
    
    // Общие цвета в соответствии с дизайном
    const chartColors = {
        primary: '#E6B5A2',
        secondary: '#FFCDB8',
        tertiary: '#E09380',
        light: '#FBEAE2',
        cancelled: '#E2DCDA',
        scheduled: '#D7E4D9',
        background: '#FDFBF8',
        border: '#D5C7B8'
    };
    
    // График посещаемости
    const attendanceCtx = document.getElementById('attendanceChart').getContext('2d');
    const attendanceChart = new Chart(attendanceCtx, {
        type: 'line',
        data: {
            labels: ['01 Апр', '05 Апр', '10 Апр', '15 Апр', '20 Апр', '25 Апр', '30 Апр'],
            datasets: [{
                label: 'Групповые занятия',
                data: [28, 32, 36, 30, 34, 31, 38],
                borderColor: chartColors.primary,
                backgroundColor: hexToRGBA(chartColors.primary, 0.1),
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }, {
                label: 'Индивидуальные занятия',
                data: [12, 15, 18, 14, 16, 19, 15],
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
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw + ' занятий';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 40,
                    ticks: {
                        stepSize: 10
                    }
                }
            }
        }
    });
    
    // График доходов по категориям
    const incomeCtx = document.getElementById('incomeChart').getContext('2d');
    const incomeChart = new Chart(incomeCtx, {
        type: 'doughnut',
        data: {
            labels: ['Групповые занятия', 'Индивидуальные занятия', 'Абонементы', 'Мерч'],
            datasets: [{
                data: [25000, 12000, 6000, 2600],
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
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.raw / total) * 100);
                            return context.label + ': ' + context.raw + '₴ (' + percentage + '%)';
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
    
    // График популярных занятий
    const classesCtx = document.getElementById('classesChart').getContext('2d');
    const classesChart = new Chart(classesCtx, {
        type: 'bar',
        data: {
            labels: ['Матовый пилатес', 'Реформер', 'Барре', 'Стретчинг', 'ТРХ', 'Пренатальный'],
            datasets: [{
                label: 'Количество занятий',
                data: [38, 24, 16, 12, 8, 6],
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
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.raw + ' занятий';
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    suggestedMax: 40,
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // График новых клиентов
    const newClientsCtx = document.getElementById('newClientsChart').getContext('2d');
    const newClientsChart = new Chart(newClientsCtx, {
        type: 'line',
        data: {
            labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
            datasets: [{
                label: 'Новые клиенты',
                data: [12, 18, 15, 22, 16, 20],
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
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 25,
                    ticks: {
                        stepSize: 5
                    }
                }
            }
        }
    });
    
    // Обработка переключения периодов
    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            periodBtns.forEach(b => b.classList.remove('active'));
            
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // В реальном проекте здесь был бы запрос к API для получения данных за выбранный период
            // и обновление графиков
            updateChartsForPeriod(this.textContent);
        });
    });
    
    // Функция для обновления графиков в зависимости от выбранного периода
    function updateChartsForPeriod(period) {
        // Имитация обновления данных
        console.log(`Обновление данных за период: ${period}`);
        
        // В реальном проекте здесь был бы код для обновления данных на графиках
        // Для демонстрации просто показываем сообщение
        // и генерируем случайные данные для графиков
        
        // Генерация случайных данных для графика посещаемости
        const groupData = Array.from({length: 7}, () => Math.floor(Math.random() * 20) + 20);
        const indivData = Array.from({length: 7}, () => Math.floor(Math.random() * 10) + 10);
        
        attendanceChart.data.datasets[0].data = groupData;
        attendanceChart.data.datasets[1].data = indivData;
        attendanceChart.update();
        
        // Генерация случайных данных для графика доходов
        const incomeData = [
            Math.floor(Math.random() * 10000) + 20000, // Групповые
            Math.floor(Math.random() * 5000) + 10000,  // Индивидуальные
            Math.floor(Math.random() * 3000) + 5000,   // Абонементы
            Math.floor(Math.random() * 1000) + 2000    // Мерч
        ];
        
        incomeChart.data.datasets[0].data = incomeData;
        incomeChart.update();
        
        // Обновление информации в карточках статистики
        document.querySelector('.stats-cards .stat-value:nth-child(1)').textContent = 
            Math.floor(Math.random() * 30) + 100;
    }
    
    // Функция для применения дат
    const applyBtn = document.querySelector('.apply-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            
            if (startDate && endDate) {
                // В реальном проекте здесь был бы запрос к API для получения данных за выбранный период
                console.log(`Применяем диапазон дат: ${startDate} - ${endDate}`);
                
                // Для демонстрации просто показываем сообщение
                alert(`Данные обновлены за период: ${startDate} - ${endDate}`);
                
                // И обновляем графики случайными данными
                updateChartsForPeriod('Пользовательский');
            } else {
                alert('Выберите начальную и конечную даты');
            }
        });
    }
    
    // Обработчики для кнопок действий
    const actionBtns = document.querySelectorAll('.chart-action-btn, .table-action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.textContent.trim();
            console.log(`Нажата кнопка: ${action}`);
            
            if (action.includes('Експорт') || action.includes('Завантажити')) {
                alert('Функция экспорта данных будет реализована позже');
            } else if (action.includes('Деталі')) {
                alert('Подробная информация будет доступна в следующей версии');
            }
        });
    });
    
    // Вспомогательная функция для преобразования HEX в RGBA
    function hexToRGBA(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
});