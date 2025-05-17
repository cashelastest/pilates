document.addEventListener('DOMContentLoaded', function() {

    // Get modal elements
    const trainerModal = document.getElementById('trainerModal');
    const addTrainerModal = document.getElementById('addTrainerModal');
    
    // Get all close buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    
    // Add click event to all close buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Find the parent modal of this close button
            const parentModal = this.closest('.modal');
            if (parentModal) {
                parentModal.style.display = 'none';
            }
        });
    });
    
    // Close modals on outside click
    window.addEventListener('click', function(event) {
        if (event.target === trainerModal) {
            trainerModal.style.display = 'none';
        }
        if (event.target === addTrainerModal) {
            addTrainerModal.style.display = 'none';
        }
    });
    
// Находим все кнопки "Розклад" и "Редагувати" на карточках тренеров
const scheduleButtons = document.querySelectorAll('.trainer-actions .action-button:first-child');
const editButtons = document.querySelectorAll('.trainer-actions .action-button:last-child');

// Элементы вкладок
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Переменная для хранения текущего ID тренера
let currentTrainerId = null;

// Настройка вкладок
tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Удаляем класс active у всех кнопок и контентов
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Активируем выбранную вкладку
        button.classList.add('active');
        const tabId = button.dataset.tab + 'Tab';
        document.getElementById(tabId).classList.add('active');
        
        // Загрузка данных для вкладки, если нужно
        if (button.dataset.tab === 'statistics' && currentTrainerId) {
            loadTrainerStatistics(currentTrainerId);
        }
        // Removed comments tab handling
    });
});

// Обработчики для кнопок на карточках тренеров
scheduleButtons.forEach(button => {
    button.addEventListener('click', function() {
        const trainerCard = this.closest('.trainer-card');
        currentTrainerId = trainerCard.dataset.id;
        
        // Открываем модальное окно и загружаем данные
        openTrainerModal(currentTrainerId);
        
        // Активируем вкладку расписания
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector('.tab-button[data-tab="schedule"]').classList.add('active');
        document.getElementById('scheduleTab').classList.add('active');
    });
});

editButtons.forEach(button => {
    button.addEventListener('click', function() {
        const trainerCard = this.closest('.trainer-card');
        currentTrainerId = trainerCard.dataset.id;
        
        // Открываем модальное окно и загружаем данные
        openTrainerModal(currentTrainerId);
        
        // Активируем вкладку редактирования
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector('.tab-button[data-tab="edit"]').classList.add('active');
        document.getElementById('editTab').classList.add('active');
    });
});

// Обработчик для формы редактирования
const editForm = document.getElementById('editTrainerForm');
editForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Создаем FormData для отправки файлов
    const formData = new FormData(editForm);
    formData.append('id', currentTrainerId);
    
    // Отправляем данные формы
    updateTrainerInfo(formData);
});

// Обработчик для предпросмотра фото
const photoInput = document.getElementById('editPhoto');
const photoPreview = document.getElementById('photoPreview');

photoInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            photoPreview.innerHTML = `<img src="${e.target.result}" alt="Предпросмотр">`;
        };
        
        reader.readAsDataURL(this.files[0]);
    }
});

// Обработчик для кнопки "Отмена"
document.getElementById('cancelEdit').addEventListener('click', function() {
    // Возвращаемся на вкладку с деталями
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    document.querySelector('.tab-button[data-tab="details"]').classList.add('active');
    document.getElementById('detailsTab').classList.add('active');
});

// ONLY ONE DEFINITION OF loadTrainerData - Moved the complete version here
function loadTrainerData(trainerId) {
    fetch(`/coaches/api/trainers/${trainerId}/details`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Помилка завантаження даних');
            }
            return response.json();
        })
        .then(data => {
            console.log('Loaded trainer data:', data); // Debugging log
            
            // Заполняем основную информацию
            document.getElementById('modalTrainerName').textContent = data.name;
            document.getElementById('modalTrainerPosition').textContent = data.position;
            document.getElementById('modalTrainerBio').textContent = data.description;
            
            // Устанавливаем фото тренера
            const photoSrc = data.photo || '/media/coaches/default.png';
            document.getElementById('modalTrainerPhoto').src = photoSrc;
            document.getElementById('modalTrainerPhoto').alt = data.name;
            
            // Заполняем форму редактирования
            document.getElementById('editName').value = data.name;
            document.getElementById('editPosition').value = data.position;
            document.getElementById('editDescription').value = data.description;
            
            // Fix status setting - ensure it gets set properly
            const statusSelect = document.getElementById('editStatus');
            if (statusSelect && data.status) {
                // If data.status is the code (e.g., 'active')
                if (Array.from(statusSelect.options).some(option => option.value === data.status)) {
                    statusSelect.value = data.status;
                } 
                // If data.status is the display text (e.g., 'Активний') - map it back to code
                else {
                    const statusMap = {
                        'Активний': 'active',
                        'Відпустка': 'vacation',
                        'Хворіє': 'sick',
                        'Неактивний': 'inactive'
                    };
                    
                    const statusCode = statusMap[data.status];
                    if (statusCode) {
                        statusSelect.value = statusCode;
                    }
                }
                
                // For debugging - log what's happening
                console.log('Setting status dropdown:', {
                    'Received status': data.status,
                    'Dropdown value set to': statusSelect.value
                });
            }
            
            // Расписание тренера
            loadTrainerSchedule(data.schedule);
            
            // Загружаем статистику
            loadTrainerStatistics(trainerId);
            
            document.getElementById('trainerModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert('Помилка завантаження даних про тренера');
        });
}

// Функция для загрузки расписания
function loadTrainerSchedule(scheduleData) {
    const scheduleEl = document.getElementById('trainerSchedule');
    
    if (scheduleData && scheduleData.length > 0) {
        let scheduleHtml = '<table class="schedule-table">';
        scheduleHtml += '<tr><th>День</th><th>Час</th><th>Тип</th><th>Група/Клієнт</th></tr>';
        
        scheduleData.forEach(item => {
            scheduleHtml += `<tr>
                <td>${item.day}</td>
                <td>${item.time}</td>
                <td>${item.type}</td>
                <td>${item.name}</td>
            </tr>`;
        });
        
        scheduleHtml += '</table>';
        scheduleEl.innerHTML = scheduleHtml;
    } else {
        scheduleEl.innerHTML = '<p>Розклад відсутній</p>';
    }
}

// Функция для загрузки статистики
function loadTrainerStatistics(trainerId) {
    const statClientsTotal = document.getElementById('statClientsTotal');
    const statSessionsMonth = document.getElementById('statSessionsMonth');
    // Removed statRating
    const statActiveGroups = document.getElementById('statActiveGroups');
    
    // Показываем индикаторы загрузки
    statClientsTotal.textContent = '...';
    statSessionsMonth.textContent = '...';
    // Removed statRating loading
    statActiveGroups.textContent = '...';
    
    fetch(`/coaches/api/trainers/${trainerId}/statistics`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Помилка завантаження статистики');
            }
            return response.json();
        })
        .then(data => {
            // Заполняем карточки со статистикой
            statClientsTotal.textContent = data.clients_total;
            statSessionsMonth.textContent = data.sessions_month;
            // Removed rating display
            statActiveGroups.textContent = data.active_groups;
            
            // Создаем график занятий за последние 6 месяцев
            createSessionsChart(data.sessions_history);
            
            // Removed sessions type chart
        })
        .catch(error => {
            console.error('Ошибка:', error);
            statClientsTotal.textContent = 'Помилка';
            statSessionsMonth.textContent = 'Помилка';
            // Removed rating error handling
            statActiveGroups.textContent = 'Помилка';
        });
}

function createSessionsChart(data) {
    const ctx = document.getElementById('sessionsChart').getContext('2d');
    
    // Безопасное уничтожение предыдущего графика, если он существует
    if (window.sessionsChart instanceof Chart) {
        window.sessionsChart.destroy();
    } else if (window.sessionsChart) {
        // Если объект существует, но не является экземпляром Chart
        // Удаляем ссылку на него, чтобы избежать ошибок
        delete window.sessionsChart;
    }
    
    // Создаем новый график
    window.sessionsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.month),
            datasets: [{
                label: 'Кількість занять',
                data: data.map(item => item.count),
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 2,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Функция для обновления информации о тренере
function updateTrainerInfo(formData) {
    // Show loading state or disable the form during update
    const submitBtn = document.querySelector('#editTrainerForm button[type="submit"]');
    if (submitBtn) {
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Оновлення...';
        submitBtn.disabled = true;
    }

    fetch(`/coaches/api/trainers/${currentTrainerId}/update`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Помилка оновлення даних');
        }
        return response.json();
    })
    .then(data => {
        console.log('Update successful, received data:', data); // Debugging log
        
        // Обновляем данные в модальном окне
        // loadTrainerData(currentTrainerId);

        // Обновляем данные на карточке тренера
        updateTrainerCard(currentTrainerId, data);
        
        // // Show success message
        // alert('Дані успішно оновлено!');
        
        // Переключаемся на вкладку с деталями
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector('.tab-button[data-tab="details"]').classList.add('active');
        document.getElementById('detailsTab').classList.add('active');
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Помилка оновлення даних про тренера');
    })
    .finally(() => {
        // Reset button state
        if (submitBtn) {
            submitBtn.textContent = 'Зберегти';
            submitBtn.disabled = false;
        }
    });
}

// Функция для обновления карточки тренера на странице
function updateTrainerCard(trainerId, data) {
    const trainerCard = document.querySelector(`.trainer-card[data-id="${trainerId}"]`);
    if (!trainerCard) {
        console.error('Cannot find trainer card with ID:', trainerId);
        return;
    }
    
    console.log('Updating trainer card with data:', data); // Debugging log
    
    // Обновляем основную информацию
    const nameEl = trainerCard.querySelector('.trainer-name');
    if (nameEl) nameEl.textContent = data.name;
    
    const titleEl = trainerCard.querySelector('.trainer-title');
    if (titleEl) titleEl.textContent = data.position;
    
    const bioEl = trainerCard.querySelector('.trainer-bio');
    if (bioEl) bioEl.textContent = data.description;
    
    // Обновляем статус
    const statusEl = trainerCard.querySelector('.trainer-status');
    if (statusEl) {
        statusEl.textContent = data.status;
        statusEl.className = 'trainer-status status-' + data.status;
    }
    
    // Обновляем и вторую отметку статуса, если есть
    const availabilityEl = trainerCard.querySelector('.trainer-availability');
    if (availabilityEl) {
        availabilityEl.innerHTML = `
            <span class="availability-indicator available"></span>
            ${data.status}
        `;
    }
    
    // Обновляем статистику, если она есть в карточке
    const clientsAmountEl = trainerCard.querySelector('.stat-value:nth-child(1)');
    if (clientsAmountEl && data.clients_amount !== undefined) {
        clientsAmountEl.textContent = data.clients_amount;
    }
    
    const groupsAmountEl = trainerCard.querySelector('.stat-value:nth-child(2)');
    if (groupsAmountEl && data.groups_amount !== undefined) {
        groupsAmountEl.textContent = data.groups_amount;
    }
    
    // Обновляем фото, если оно было изменено
    if (data.photo) {
        const photoEl = trainerCard.querySelector('.trainer-photo img');
        if (photoEl) {
            photoEl.src = data.photo;
            photoEl.alt = data.name;
        }
    }
}

// Функция для получения текстового представления статуса
// function getStatusText(status) {
//     const statusMap = {
//         'active': 'Активний',
//         'vacation': 'Відпустка',
//         'sick': 'Хворіє',
//         'inactive': 'Неактивний'
//     };
    
//     return statusMap[status] || 'Невідомий';
// }

// Функция для открытия модального окна тренера
function openTrainerModal(trainerId) {
    currentTrainerId = trainerId;
    loadTrainerData(trainerId);
}

// Add Trainer Functionality
const addTrainerBtn = document.getElementById('addTrainerBtn');
const cancelAddTrainerBtn = document.getElementById('cancelAddTrainer');
const addTrainerForm = document.getElementById('addTrainerForm');

// Open add trainer modal
addTrainerBtn.addEventListener('click', function() {
    addTrainerModal.style.display = 'block';
    // Reset form
    addTrainerForm.reset();
    document.getElementById('newPhotoPreview').innerHTML = '';
});

// Close on cancel button
cancelAddTrainerBtn.addEventListener('click', function() {
    addTrainerModal.style.display = 'none';
});

// Photo preview for new trainer
const newPhotoInput = document.getElementById('newPhoto');
const newPhotoPreview = document.getElementById('newPhotoPreview');

newPhotoInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            newPhotoPreview.innerHTML = `<img src="${e.target.result}" alt="Предпросмотр">`;
        };
        
        reader.readAsDataURL(this.files[0]);
    }
});

// Submit new trainer form
// Submit new trainer form
addTrainerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Create FormData for sending files
    const formData = new FormData(addTrainerForm);
    
    // Show loading state
    const submitBtn = addTrainerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Зберігання...';
    submitBtn.disabled = true;
    
    // Send the form data
    createNewTrainer(formData)
        .then(response => {
            // Hide modal
            addTrainerModal.style.display = 'none';
            
            // Reset form
            addTrainerForm.reset();
            newPhotoPreview.innerHTML = '';
            
            // Show success message
            alert('Тренера успішно додано!');
            
            // Add new trainer card to the grid without reloading the page
            if (response.success && response.trainer) {
                const trainersGrid = document.querySelector('.trainers-grid');
                
                // Create the new card with EXACTLY the same structure as in coaches.html
                const newTrainerCard = document.createElement('div');
                newTrainerCard.className = 'trainer-card';
                newTrainerCard.dataset.id = response.trainer.id;
                
                // Use the exact structure from your HTML example
                newTrainerCard.innerHTML = `
                    <div class="arch-decoration"></div>
                    <div class="trainer-photo">
                        <img src="${response.trainer.photo || '/media/coaches/default.png'}" alt="${response.trainer.name}">
                        <div class="trainer-status status-${response.trainer.status}">${getStatusText(response.trainer.status)}</div>
                    </div>
                    <div class="trainer-info">
                        <div class="trainer-name">${response.trainer.name}</div>
                        <div class="trainer-title">${response.trainer.position}</div>
                        <div class="trainer-bio">
                            ${response.trainer.description}
                        </div>
                        <div class="trainer-availability">
                            <span class="availability-indicator available"></span>
                            ${response.trainer.status}
                        </div>
                        <div class="trainer-actions">
                            <button class="action-button">Розклад</button>
                            <button class="action-button">Редагувати</button>
                        </div>
                    </div>
                `;
                
                // Add to the grid
                trainersGrid.appendChild(newTrainerCard);
                
                // Add event listeners to the new buttons
                const scheduleButton = newTrainerCard.querySelector('.trainer-actions .action-button:first-child');
                const editButton = newTrainerCard.querySelector('.trainer-actions .action-button:last-child');
                
                scheduleButton.addEventListener('click', function() {
                    currentTrainerId = response.trainer.id;
                    openTrainerModal(currentTrainerId);
                    
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    document.querySelector('.tab-button[data-tab="schedule"]').classList.add('active');
                    document.getElementById('scheduleTab').classList.add('active');
                });
                
                editButton.addEventListener('click', function() {
                    currentTrainerId = response.trainer.id;
                    openTrainerModal(currentTrainerId);
                    
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    document.querySelector('.tab-button[data-tab="edit"]').classList.add('active');
                    document.getElementById('editTab').classList.add('active');
                });
            } else {
                // If we only get success status without trainer data, reload the page
                window.location.reload();
            }
        })
        .catch(error => {
            console.error('Помилка додавання тренера:', error);
            alert('Помилка додавання тренера. Спробуйте знову пізніше.');
        })
        .finally(() => {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
});

// Also uncomment this function as you'll need it for status translation
function getStatusText(status) {
    const statusMap = {
        'active': 'Активний',
        'vacation': 'Відпустка',
        'sick': 'Хворіє',
        'inactive': 'Неактивний'
    };
    
    return statusMap[status] || 'Невідомий';
}
// Modify your createNewTrainer function to load complete data after creation
function createNewTrainer(formData) {
    return fetch('/coaches/api/trainers/create', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Помилка створення тренера');
        }
        return response.json();
    })
    .then(data => {
        // After creating, fetch the complete trainer details
        // just like we do when opening an existing trainer
        if (data.success && data.trainer && data.trainer.id) {
            return fetch(`/coaches/api/trainers/${data.trainer.id}/details`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Помилка завантаження даних');
                    }
                    return response.json();
                })
                .then(fullTrainerData => {
                    // Return both the original response and the full data
                    return {
                        success: data.success,
                        trainer: fullTrainerData
                    };
                });
        }
        return data;
    });
}

// Function to add new trainer card to the grid
function addTrainerCardToGrid(trainer) {
    const trainersGrid = document.querySelector('.trainers-grid');
    
    const statusText = trainer.status;
    const photoSrc = trainer.photo || '/media/coaches/default.png';
    
    // Create new trainer card HTML
    const trainerCardHTML = `
        <div class="trainer-card" data-id="${trainer.id}">
            <div class="arch-decoration"></div>
            <div class="trainer-photo">
                <img src="${photoSrc}" alt="${trainer.name}">
                <div class="trainer-status status-${trainer.status}">${statusText}</div>
            </div>
            <div class="trainer-info">
                <div class="trainer-name">${trainer.name}</div>
                <div class="trainer-title">${trainer.position}</div>
                <div class="trainer-bio">
                    ${trainer.description}
                </div>
                <div class="trainer-availability">
                    <span class="availability-indicator available"></span>
                    ${statusText}
                </div>
                <div class="trainer-stats">
                    <div class="stat-item">
                        <div class="stat-value">${trainer.clients_amount || 0}</div>
                        <div class="stat-label">Клієнтів</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${trainer.groups_amount || 0}</div>
                        <div class="stat-label">Груп</div>
                    </div>
                </div>
                <div class="trainer-actions">
                    <button class="action-button">Розклад</button>
                    <button class="action-button">Редагувати</button>
                </div>
            </div>
        </div>
    `;
    
    // Create a temporary container to convert HTML string to DOM elements
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = trainerCardHTML;
    const trainerCard = tempContainer.firstElementChild;
    
    // Add to the grid
    trainersGrid.appendChild(trainerCard);
    
    // Add event listeners to the new buttons
    const scheduleButton = trainerCard.querySelector('.trainer-actions .action-button:first-child');
    const editButton = trainerCard.querySelector('.trainer-actions .action-button:last-child');
    
    scheduleButton.addEventListener('click', function() {
        currentTrainerId = trainer.id;
        openTrainerModal(currentTrainerId);
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector('.tab-button[data-tab="schedule"]').classList.add('active');
        document.getElementById('scheduleTab').classList.add('active');
    });
    
    editButton.addEventListener('click', function() {
        currentTrainerId = trainer.id;
        openTrainerModal(currentTrainerId);
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector('.tab-button[data-tab="edit"]').classList.add('active');
        document.getElementById('editTab').classList.add('active');
    });
}
});