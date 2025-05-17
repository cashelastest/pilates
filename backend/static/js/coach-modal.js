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
        } else if (button.dataset.tab === 'comments' && currentTrainerId) {
            loadTrainerComments(currentTrainerId);
        }
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

// Функция для загрузки комментариев (добавлена)
function loadTrainerComments(trainerId, page = 1) {
    const commentsContainer = document.getElementById('commentsContainer');
    const loadMoreBtn = document.getElementById('loadMoreComments');
    const avgRatingEl = document.getElementById('avgRating');
    const ratingStarsEl = document.getElementById('ratingStars');
    const totalReviewsEl = document.getElementById('totalReviews');
    
    // Показываем индикатор загрузки при первой странице
    if (page === 1) {
        commentsContainer.innerHTML = '<p>Завантаження відгуків...</p>';
    }
    
    fetch(`/coaches/api/trainers/${trainerId}/comments?page=${page}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Помилка завантаження відгуків');
            }
            return response.json();
        })
        .then(data => {
            // Обновляем информацию о рейтинге
            avgRatingEl.textContent = data.avg_rating.toFixed(1);
            
            // Формируем звёзды для рейтинга
            const fullStars = Math.floor(data.avg_rating);
            const halfStar = data.avg_rating - fullStars >= 0.5;
            const stars = '★'.repeat(fullStars) + (halfStar ? '⭐' : '') + '☆'.repeat(5 - fullStars - (halfStar ? 1 : 0));
            ratingStarsEl.textContent = stars;
            
            totalReviewsEl.textContent = `Всього відгуків: ${data.total_comments}`;
            
            // Если это первая страница, очищаем контейнер
            if (page === 1) {
                commentsContainer.innerHTML = '';
            }
            
            // Добавляем комментарии
            if (data.comments && data.comments.length > 0) {
                data.comments.forEach(comment => {
                    commentsContainer.innerHTML += createCommentElement(comment);
                });
            } else if (page === 1) {
                commentsContainer.innerHTML = '<p>Відгуки відсутні</p>';
            }
            
            // Обновляем состояние кнопки "Загрузить ещё"
            loadMoreBtn.style.display = data.has_more ? 'block' : 'none';
            loadMoreBtn.dataset.page = page + 1;
        })
        .catch(error => {
            console.error('Ошибка:', error);
            if (page === 1) {
                commentsContainer.innerHTML = '<p>Помилка завантаження відгуків</p>';
            }
            loadMoreBtn.style.display = 'none';
        });
}

// Обновленная функция для загрузки данных о тренере
function loadTrainerData(trainerId) {
    fetch(`/coaches/api/trainers/${trainerId}/details`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Помилка завантаження даних');
            }
            return response.json();
        })
        .then(data => {
            // Заполняем основную информацию
            document.getElementById('modalTrainerName').textContent = data.name;
            document.getElementById('modalTrainerPosition').textContent = data.position;
            document.getElementById('modalTrainerBio').textContent = data.description;
            
            // Статус тренера
            // const statusEl = document.getElementById('modalTrainerStatus');
            // statusEl.textContent = getStatusText(data.status);
            // statusEl.className = 'trainer-status status-' + data.status;
            
            // Дополнительная информация
            // document.getElementById('trainerSpecialization').textContent = data.specialization || 'Не вказано';
            // document.getElementById('trainerExperience').textContent = data.experience || 'Не вказано';
            
            // Сертификаты - обновленный формат с маркерами
            // const certificatesEl = document.getElementById('trainerCertificates');
            // if (data.certificates && data.certificates.length > 0) {
            //     let certificatesHtml = '<ul>';
            //     data.certificates.forEach(cert => {
            //         certificatesHtml += `<li>${cert.name} (${cert.year})</li>`;
            //     });
            //     certificatesHtml += '</ul>';
            //     certificatesEl.innerHTML = certificatesHtml;
            // } else {
            //     certificatesEl.textContent = 'Не вказано';
            // }
            
            // Устанавливаем фото тренера
            const photoSrc = data.photo || '/media/coaches/default.png';
            document.getElementById('modalTrainerPhoto').src = photoSrc;
            document.getElementById('modalTrainerPhoto').alt = data.name;
            
            // Заполняем форму редактирования
            document.getElementById('editName').value = data.name;
            document.getElementById('editPosition').value = data.position;
            document.getElementById('editDescription').value = data.description;
            // document.getElementById('editSpecialization').value = data.specialization || '';
            // document.getElementById('editExperience').value = data.experience || '';
            document.getElementById('editStatus').value = data.status;
            
            // Расписание тренера
            loadTrainerSchedule(data.schedule);
            
            // Загружаем статистику
            loadTrainerStatistics(trainerId);
            
            // Загружаем комментарии
            loadTrainerComments(trainerId);
            
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
    const statRating = document.getElementById('statRating');
    const statActiveGroups = document.getElementById('statActiveGroups');
    
    // Показываем индикаторы загрузки
    statClientsTotal.textContent = '...';
    statSessionsMonth.textContent = '...';
    statRating.textContent = '...';
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
            statRating.textContent = data.rating.toFixed(1);
            statActiveGroups.textContent = data.active_groups;
            
            // Создаем график занятий за последние 6 месяцев
            createSessionsChart(data.sessions_history);
            
            // Создаем график распределения типов занятий
            // createSessionsTypeChart(data.sessions_types);
        })
        .catch(error => {
            console.error('Ошибка:', error);
            statClientsTotal.textContent = 'Помилка';
            statSessionsMonth.textContent = 'Помилка';
            statRating.textContent = 'Помилка';
            statActiveGroups.textContent = 'Помилка';
        });
}

// function createSessionsTypeChart(data) {
//     const ctx = document.getElementById('sessionsTypeChart').getContext('2d');
    
//     // Безопасное уничтожение предыдущего графика, если он существует
//     if (window.sessionsTypeChart instanceof Chart) {
//         window.sessionsTypeChart.destroy();
//     } else if (window.sessionsTypeChart) {
//         // Если объект существует, но не является экземпляром Chart
//         // Удаляем ссылку на него, чтобы избежать ошибок
//         delete window.sessionsTypeChart;
//     }
    
//     // Создаем новый график
//     window.sessionsTypeChart = new Chart(ctx, {
//         type: 'pie',
//         data: {
//             labels: Object.keys(data),
//             datasets: [{
//                 data: Object.values(data),
//                 backgroundColor: [
//                     'rgba(76, 175, 80, 0.7)',
//                     'rgba(33, 150, 243, 0.7)',
//                     'rgba(255, 193, 7, 0.7)',
//                     'rgba(156, 39, 176, 0.7)'
//                 ],
//                 borderWidth: 1
//             }]
//         },
//         options: {
//             responsive: true
//         }
//     });
// }

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

// Исправленная функция для загрузки статистики
function loadTrainerStatistics(trainerId) {
    const statClientsTotal = document.getElementById('statClientsTotal');
    const statSessionsMonth = document.getElementById('statSessionsMonth');
    const statRating = document.getElementById('statRating');
    const statActiveGroups = document.getElementById('statActiveGroups');
    
    // Показываем индикаторы загрузки
    statClientsTotal.textContent = '...';
    statSessionsMonth.textContent = '...';
    statRating.textContent = '...';
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
            statRating.textContent = data.rating.toFixed(1);
            statActiveGroups.textContent = data.active_groups;
            
            try {
                // Создаем график занятий за последние 6 месяцев
                if (data.sessions_history && data.sessions_history.length > 0) {
                    createSessionsChart(data.sessions_history);
                }
                
                // Создаем график распределения типов занятий
                // if (data.sessions_types && Object.keys(data.sessions_types).length > 0) {
                //     createSessionsTypeChart(data.sessions_types);
                // }
            } catch (chartError) {
                console.error('Ошибка при создании графиков:', chartError);
                
                // Перезагружаем canvas элементы при ошибке
                const sessionsChartCanvas = document.getElementById('sessionsChart');
                const sessionsTypeChartCanvas = document.getElementById('sessionsTypeChart');
                
                if (sessionsChartCanvas) {
                    const parent = sessionsChartCanvas.parentNode;
                    parent.innerHTML = '<canvas id="sessionsChart"></canvas>';
                }
                
                if (sessionsTypeChartCanvas) {
                    const parent = sessionsTypeChartCanvas.parentNode;
                    parent.innerHTML = '<canvas id="sessionsTypeChart"></canvas>';
                }
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            statClientsTotal.textContent = 'Помилка';
            statSessionsMonth.textContent = 'Помилка';
            statRating.textContent = 'Помилка';
            statActiveGroups.textContent = 'Помилка';
        });
}

// Обработчик для кнопки "Загрузить еще комментарии"
document.getElementById('loadMoreComments').addEventListener('click', function() {
    const page = parseInt(this.dataset.page || 2);
    loadTrainerComments(currentTrainerId, page);
});

// Функция для создания элемента комментария
function createCommentElement(comment) {
    const date = new Date(comment.date);
    const formattedDate = date.toLocaleDateString('uk-UA');
    
    const stars = '★'.repeat(comment.rating) + '☆'.repeat(5 - comment.rating);
    
    return `
        <div class="comment-item">
            <div class="comment-header">
                <div class="comment-author">${comment.author}</div>
                <div class="comment-date">${formattedDate}</div>
            </div>
            <div class="comment-rating">${stars}</div>
            <div class="comment-text">${comment.text}</div>
        </div>
    `;
}

// Функция для обновления информации о тренере
function updateTrainerInfo(formData) {
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
        // Показываем сообщение об успешном обновлении
        alert('Інформацію про тренера успішно оновлено!');
        
        // Обновляем данные в модальном окне
        loadTrainerData(currentTrainerId);
        
        // Обновляем данные на карточке тренера
        updateTrainerCard(currentTrainerId, data);
        
        // Переключаемся на вкладку с деталями
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector('.tab-button[data-tab="details"]').classList.add('active');
        document.getElementById('detailsTab').classList.add('active');
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Помилка оновлення даних про тренера');
    });
}

// Функция для обновления карточки тренера на странице
function updateTrainerCard(trainerId, data) {
    const trainerCard = document.querySelector(`.trainer-card[data-id="${trainerId}"]`);
    if (!trainerCard) return;
    
    trainerCard.querySelector('.trainer-name').textContent = data.name;
    trainerCard.querySelector('.trainer-title').textContent = data.position;
    trainerCard.querySelector('.trainer-bio').textContent = data.description;
    
    // Обновляем статус
    const statusEl = trainerCard.querySelector('.trainer-status');
    statusEl.textContent = getStatusText(data.status);
    statusEl.className = 'trainer-status status-' + data.status;
    
    // Обновляем статистику, если она есть в карточке
    const clientsAmountEl = trainerCard.querySelector('.stat-value:nth-child(1)');
    if (clientsAmountEl && data.clients_amount !== undefined) {
        clientsAmountEl.textContent = data.clients_amount;
    }
    
    const groupsAmountEl = trainerCard.querySelector('.stat-value:nth-child(2)');
    if (groupsAmountEl && data.groups_amount !== undefined) {
        groupsAmountEl.textContent = data.groups_amount;
    }
    
    const rateEl = trainerCard.querySelector('.stat-value:nth-child(3)');
    if (rateEl && data.rate !== undefined) {
        rateEl.textContent = data.rate;
    }
    
    // Обновляем фото, если оно было изменено
    if (data.photo) {
        const photoEl = trainerCard.querySelector('.trainer-photo img');
        photoEl.src = data.photo;
        photoEl.alt = data.name;
    }
}

// Функция для получения текстового представления статуса
function getStatusText(status) {
    const statusMap = {
        'active': 'Активний',
        'vacation': 'Відпустка',
        'sick': 'Хворіє',
        'inactive': 'Неактивний'
    };
    
    return statusMap[status] || 'Невідомий';
}

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
                addTrainerCardToGrid(response.trainer);
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

// Function to create a new trainer
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
    });
}

// Function to add new trainer card to the grid
function addTrainerCardToGrid(trainer) {
    const trainersGrid = document.querySelector('.trainers-grid');
    
    const statusText = getStatusText(trainer.status);
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
                    <div class="stat-item">
                        <div class="stat-value">${trainer.rate || '0.0'}</div>
                        <div class="stat-label">Рейтинг</div>
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