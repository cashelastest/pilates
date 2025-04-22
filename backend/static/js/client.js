// Основная функция инициализации для всех обработчиков событий
function initializeAllEventHandlers() {
    console.log('Initializing all event handlers...');
    
    // Фиксация всех кнопок, которые могут быть не найдены
    const buttons = {
        editClientBtn: document.getElementById('editClientBtn'),
        assignSubscriptionBtn: document.getElementById('assignSubscriptionBtn'),
        addSubscriptionBtn: document.getElementById('addSubscriptionBtn'),
        addLessonBtn: document.getElementById('addLessonBtn'),
        closeEditClientModal: document.getElementById('closeEditClientModal'),
        cancelEditClientBtn: document.getElementById('cancelEditClientBtn'),
        saveEditClientBtn: document.getElementById('saveEditClientBtn'),
        closeAssignSubModal: document.getElementById('closeAssignSubModal'),
        cancelAssignSubBtn: document.getElementById('cancelAssignSubBtn'),
        saveAssignSubBtn: document.getElementById('saveAssignSubBtn')
    };
    
    // Проверяем наличие каждой кнопки перед добавлением обработчика
    for (const [key, button] of Object.entries(buttons)) {
        if (!button) {
            console.warn(`Button ${key} not found in the DOM!`);
        }
    }
    
    // Инициализация обработчиков вкладок
    const tabButtons = document.querySelectorAll('.tab-button');
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                console.log('Tab button clicked:', this.getAttribute('data-tab'));
                const targetTab = this.getAttribute('data-tab');
                
                // Активация кнопки
                tabButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Активация панели
                const tabPanels = document.querySelectorAll('.tab-panel');
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                const targetPanel = document.getElementById(`${targetTab}-panel`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                } else {
                    console.error(`Target panel ${targetTab}-panel not found!`);
                }
            });
        });
    } else {
        console.warn('No tab buttons found!');
    }
    
    // Инициализация фильтров уроков
    const lessonsFilters = document.querySelectorAll('input[name="lessons-filter"]');
    if (lessonsFilters.length > 0) {
        lessonsFilters.forEach(radio => {
            radio.addEventListener('change', function() {
                console.log('Lesson filter changed:', this.value);
                renderLessons(this.value);
            });
        });
    } else {
        console.warn('No lesson filters found!');
    }
    
    // Кнопка редактирования профиля
    if (buttons.editClientBtn) {
        buttons.editClientBtn.addEventListener('click', function() {
            console.log('Edit client button clicked');
            // Получаем модальное окно
            const editClientModal = document.getElementById('editClientModal');
            if (!editClientModal) {
                console.error('Edit client modal not found!');
                return;
            }
            
            // Заполняем форму данными
            populateEditForm();
            
            // Открываем модальное окно
            editClientModal.classList.add('active');
        });
    }
    
    // Функции закрытия модального окна редактирования
    function closeEditModal() {
        console.log('Closing edit modal');
        const editClientModal = document.getElementById('editClientModal');
        if (!editClientModal) {
            console.error('Edit client modal not found when trying to close it!');
            return;
        }
        
        editClientModal.classList.remove('active');
        
        const editClientForm = document.getElementById('editClientForm');
        if (editClientForm) {
            editClientForm.reset();
        }
    }
    
    // Кнопки закрытия модального окна редактирования
    if (buttons.closeEditClientModal) {
        buttons.closeEditClientModal.addEventListener('click', closeEditModal);
    }
    
    if (buttons.cancelEditClientBtn) {
        buttons.cancelEditClientBtn.addEventListener('click', closeEditModal);
    }
    
    // Закрытие по клику на фон
    const editClientModal = document.getElementById('editClientModal');
    if (editClientModal) {
        editClientModal.addEventListener('click', function(e) {
            if (e.target === editClientModal) {
                closeEditModal();
            }
        });
    }
    
    // Сохранение данных клиента
    if (buttons.saveEditClientBtn) {
        buttons.saveEditClientBtn.addEventListener('click', function() {
            console.log('Save edit client button clicked');
            const editClientForm = document.getElementById('editClientForm');
            
            if (!editClientForm) {
                console.error('Edit client form not found!');
                return;
            }
            

            
            const clientUsername = new URLSearchParams(window.location.search).get('username') || 2;
            
            // Сбор данных из формы
            const nameInput = document.getElementById('editClientName');
            const usernameInput = document.getElementById('editClientUsername');
            const emailInput = document.getElementById('editClientEmail');
            const passwordInput = document.getElementById('editClientPassword');
            const birthdayInput = document.getElementById('editClientBirthday');
            const sexInput = document.getElementById('editClientSex');
            const statusInput = document.getElementById('editClientStatus');
            const balanceInput = document.getElementById('editClientBalance');
            const coachInput = document.getElementById('editClientCoach');
            const groupInput = document.getElementById('editClientGroup');
            const descriptionInput = document.getElementById('editClientDescription');
            
            if (!nameInput || !usernameInput || !emailInput) {
                console.error('Required form inputs not found!');
                return;
            }
            
            const updatedData = {
                client_username: clientUsername,
                name: nameInput.value,
                username: usernameInput.value,
                email: emailInput.value,
                password: passwordInput ? passwordInput.value || undefined : undefined,
                date_of_birth: birthdayInput ? birthdayInput.value : undefined,
                sex: sexInput ? sexInput.value === '1' : undefined,
                status: statusInput ? statusInput.value === '1' : undefined,
                balance: balanceInput ? parseFloat(balanceInput.value) : undefined,
                coach_id: coachInput && coachInput.value ? coachInput.value : null,
                group_id: groupInput && groupInput.value ? groupInput.value : null,
                description: descriptionInput ? descriptionInput.value : undefined
            };
            console.log(` DATATAAAs${updatedData.name}`);
            // Отправка данных на сервер
            if (ws&& ws.readyState === WebSocket.OPEN) {
                const apiCodes = window.API_CODES || {
                    UPDATE_CLIENT: 195
                };
                
                ws.send(JSON.stringify({
                    code: apiCodes.UPDATE_CLIENT,
                    client: updatedData
                }));
                
                // Обновляем локальные данные
                if (window.clientData) {
                    Object.assign(window.clientData, updatedData);
                    renderClientData();
                }
                
                // Закрываем модальное окно
                closeEditModal();
            } else {
                alert('Немає з\'єднання з сервером');
            }
        });
    }
    
    // Кнопка назначения абонемента
    if (buttons.assignSubscriptionBtn) {
        buttons.assignSubscriptionBtn.addEventListener('click', function() {
            console.log('Assign subscription button clicked');
            const assignSubscriptionModal = document.getElementById('assignSubscriptionModal');
            if (!assignSubscriptionModal) {
                console.error('Assign subscription modal not found!');
                return;
            }
            
            // По умолчанию установим текущее время + 1 час
            const now = new Date();
            const startTimeInput = document.getElementById('startTimeInput');
            const endTimeInput = document.getElementById('endTimeInput');
            
            if (startTimeInput && endTimeInput) {
                startTimeInput.value = `${String(now.getHours()).padStart(2, '0')}:00`;
                endTimeInput.value = `${String(now.getHours() + 1).padStart(2, '0')}:30`;
            } else {
                console.warn('Time inputs not found!');
            }
            
            assignSubscriptionModal.classList.add('active');
        });
    }
    
    // Дублирование кнопки добавления абонемента
    if (buttons.addSubscriptionBtn) {
        buttons.addSubscriptionBtn.addEventListener('click', function() {
            console.log('Add subscription button clicked');
            if (buttons.assignSubscriptionBtn) {
                buttons.assignSubscriptionBtn.click();
            } else {
                console.error('Assign subscription button not found!');
                
                // Попытка открыть модальное окно напрямую
                const assignSubscriptionModal = document.getElementById('assignSubscriptionModal');
                if (assignSubscriptionModal) {
                    assignSubscriptionModal.classList.add('active');
                }
            }
        });
    }
    
    // Функции закрытия модального окна назначения абонемента
    function closeAssignSubModal() {
        console.log('Closing assign sub modal');
        const assignSubscriptionModal = document.getElementById('assignSubscriptionModal');
        if (!assignSubscriptionModal) {
            console.error('Assign subscription modal not found when trying to close it!');
            return;
        }
        
        assignSubscriptionModal.classList.remove('active');
        
        const assignSubForm = document.getElementById('assignSubForm');
        if (assignSubForm) {
            assignSubForm.reset();
        }
    }
    
    // Кнопки закрытия модального окна назначения абонемента
    if (buttons.closeAssignSubModal) {
        buttons.closeAssignSubModal.addEventListener('click', closeAssignSubModal);
    }
    
    if (buttons.cancelAssignSubBtn) {
        buttons.cancelAssignSubBtn.addEventListener('click', closeAssignSubModal);
    }
    
    // Закрытие по клику на фон
    const assignSubscriptionModal = document.getElementById('assignSubscriptionModal');
    if (assignSubscriptionModal) {
        assignSubscriptionModal.addEventListener('click', function(e) {
            if (e.target === assignSubscriptionModal) {
                closeAssignSubModal();
            }
        });
    }
    
    // Сохранение назначения абонемента
    if (buttons.saveAssignSubBtn) {
        buttons.saveAssignSubBtn.addEventListener('click', function() {
            console.log('Save assign sub button clicked');
            const assignSubForm = document.getElementById('assignSubForm');
            
            if (!assignSubForm) {
                console.error('Assign sub form not found!');
                return;
            }
            
            if (!assignSubForm.checkValidity()) {
                alert('Будь ласка, заповніть всі обов\'язкові поля');
                return;
            }
            
            const clientId = new URLSearchParams(window.location.search).get('id') || 1;
            
            const subSelectInput = document.getElementById('subSelect');
            const dayOfWeekInput = document.getElementById('dayOfWeekSelect');
            const startTimeInput = document.getElementById('startTimeInput');
            const endTimeInput = document.getElementById('endTimeInput');
            
            if (!subSelectInput || !dayOfWeekInput || !startTimeInput || !endTimeInput) {
                console.error('Required form inputs not found!');
                return;
            }
            
            // Формирование данных для отправки
            const scheduleData = {
                client_id: clientId,
                subscription_id: subSelectInput.value,
                day_of_the_week: parseInt(dayOfWeekInput.value),
                start_time: startTimeInput.value,
                end_time: endTimeInput.value
            };
            
            // Отправка данных на сервер
            if (ws && ws.readyState === WebSocket.OPEN) {
                const apiCodes = window.API_CODES || {
                    ASSIGN_SUB_TO_CLIENT: 196,
                    GET_CLIENT_SUBS: 198
                };
                
                ws.send(JSON.stringify({
                    code: apiCodes.ASSIGN_SUB_TO_CLIENT,
                    schedule: scheduleData
                }));
                
                // Закрываем модальное окно
                closeAssignSubModal();
                
                // Обновляем данные абонементов
                ws.send(JSON.stringify({
                    code: apiCodes.GET_CLIENT_SUBS,
                    id: clientId
                }));
            } else {
                alert('Немає з\'єднання з сервером');
            }
        });
    }
    
    // Кнопка добавления занятия
    if (buttons.addLessonBtn) {
        buttons.addLessonBtn.addEventListener('click', function() {
            console.log('Add lesson button clicked');
            const clientId = new URLSearchParams(window.location.search).get('id') || 1;
            
            // Перенаправление на страницу календаря для создания занятия
            window.location.href = `index.html?client_id=${clientId}`;
        });
    }
    
    // Проверяем текущие события на карточках абонементов и уроков
    const addScheduleBtns = document.querySelectorAll('.add-schedule-btn');
    const editSubscriptionBtns = document.querySelectorAll('.edit-subscription-btn');
    
    console.log('Found add schedule buttons:', addScheduleBtns.length);
    console.log('Found edit subscription buttons:', editSubscriptionBtns.length);
    
    // Перепривязываем события к карточкам
    rebindSubscriptionCardEvents();
    rebindLessonCardEvents();
}

// Функция для повторной привязки событий к карточкам абонементов
function rebindSubscriptionCardEvents() {
    console.log('Rebinding subscription card events');
    
    document.querySelectorAll('.add-schedule-btn').forEach(button => {
        button.addEventListener('click', function() {
            const subscriptionId = this.getAttribute('data-id');
            console.log('Add schedule button clicked for subscription:', subscriptionId);
            openAddScheduleModal(subscriptionId);
        });
    });
    
    document.querySelectorAll('.edit-subscription-btn').forEach(button => {
        button.addEventListener('click', function() {
            const subscriptionId = this.getAttribute('data-id');
            console.log('Edit subscription button clicked for subscription:', subscriptionId);
            openEditSubscriptionModal(subscriptionId);
        });
    });

    // Add event listener for the new "Use Subscription" button
    document.querySelectorAll('.use-subscription-btn').forEach(button => {
        button.addEventListener('click', function() {
            const subscriptionId = this.getAttribute('data-id');
            console.log('Use subscription button clicked for subscription:', subscriptionId);
            useSubscription(subscriptionId);
        });
    });
}
function useSubscription(subscriptionId) {
    console.log('Using subscription:', subscriptionId);
    
    if (confirm('Ви впевнені, що хочете застосувати цей абонемент?')) {
        const clientUsername = new URLSearchParams(window.location.search).get('username');
        
        // Send data to server
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            const apiCodes = window.API_CODES || {
                USE_SUBSCRIPTION: 199,
                GET_CLIENT_SUBS: 198
            };
            
            ws.send(JSON.stringify({
                code: apiCodes.USE_SUBSCRIPTION,
                sub_id: subscriptionId,
                client_name: clientUsername
            }));
            
            // Update subscriptions data after applying the subscription
            // setTimeout(() => {
            //     ws.send(JSON.stringify({
            //         code: apiCodes.GET_CLIENT_SUBS,
            //         username: clientUsername
            //     }));
            // }, 300);
            
        } else {
            alert('Немає з\'єднання з сервером');
        }
    }
}

// Функция для повторной привязки событий к карточкам уроков
function renderSubscriptions() {
    console.log('Rendering subscriptions', window.clientSubscriptions);
    const subscriptionsList = document.getElementById('subscriptions-list');
    
    if (!subscriptionsList) {
        console.error('Subscriptions list container not found!');
        return;
    }
    
    if (!window.clientSubscriptions || window.clientSubscriptions.length === 0) {
        subscriptionsList.innerHTML = `
            <div class="empty-state">
                <p>У клієнта немає активних абонементів</p>
            </div>
        `;
        return;
    }
    
    subscriptionsList.innerHTML = '';
    
    window.clientSubscriptions.forEach(subscription => {
        const scheduleItems = subscription.schedules.map(schedule => {
            const dayName = getDayOfWeekName(schedule.day_of_the_week);
            return `
                <div class="schedule-item">
                    <span class="schedule-day">${dayName}</span>
                    <span class="schedule-time">${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}</span>
                </div>
            `;
        }).join('');
        
        const card = document.createElement('div');
        card.className = 'subscription-card';
        card.innerHTML = `
            <div class="subscription-header">
                <div class="subscription-title">${subscription.name}</div>
                <div class="subscription-status ${subscription.is_active ? 'active' : 'expired'}">
                    ${subscription.is_active ? 'Активний' : 'Закінчився'}
                </div>
            </div>
            <div class="subscription-details">
                <div class="subscription-detail">
                    <div class="detail-title">Ціна</div>
                    <div class="detail-value-sub">${subscription.price} ₴</div>
                </div>
                <div class="subscription-detail">
                    <div class="detail-title">Використано занять</div>
                    <div class="detail-value-sub">${subscription.used_lessons} / ${subscription.total_lessons}</div>
                </div>
                <div class="subscription-detail">
                    <div class="detail-title">Дійсний до</div>
                    <div class="detail-value-sub">${formatDate(subscription.valid_until)}</div>
                </div>
            </div>
            <div class="subscription-schedule">
                <div class="schedule-title">Розклад:</div>
                ${scheduleItems || '<p>Розклад не визначено</p>'}
            </div>
            <div class="subscription-actions">
                <button class="action-button use-subscription-btn" data-id="${subscription.id}">Застосувати</button>
                <button class="action-button add-schedule-btn" data-id="${subscription.id}">Додати розклад</button>
                <button class="action-button edit-subscription-btn" data-id="${subscription.id}">Редагувати</button>
            </div>
        `;
        
        subscriptionsList.appendChild(card);
    });
    
    // Перепривязываем события для новых карточек
    rebindSubscriptionCardEvents();
}
// Заменяем оригинальную функцию renderLessons
function renderLessons(filter = 'all') {
    console.log('Rendering lessons with filter:', filter);
    const lessonsList = document.getElementById('lessons-list');
    
    if (!lessonsList) {
        console.error('Lessons list container not found!');
        return;
    }
    
    if (!window.clientLessons || window.clientLessons.length === 0) {
        lessonsList.innerHTML = `
            <div class="empty-state">
                <p>У клієнта немає занять</p>
            </div>
        `;
        return;
    }
    
    // Фильтрация уроков
    let filteredLessons = window.clientLessons;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filter === 'upcoming') {
        filteredLessons = window.clientLessons.filter(lesson => {
            const lessonDate = new Date(lesson.date);
            return lessonDate >= today;
        });
    } else if (filter === 'past') {
        filteredLessons = window.clientLessons.filter(lesson => {
            const lessonDate = new Date(lesson.date);
            return lessonDate < today;
        });
    }
    
    if (filteredLessons.length === 0) {
        lessonsList.innerHTML = `
            <div class="empty-state">
                <p>Немає занять за вибраним фільтром</p>
            </div>
        `;
        return;
    }
    
    lessonsList.innerHTML = '';
    
    filteredLessons.forEach(lesson => {
        let statusClass = 'scheduled';
        let statusText = 'Заплановано';
        
        if (lesson.is_cancelled) {
            statusClass = 'cancelled';
            statusText = 'Скасовано';
        } else {
            const lessonDateTime = new Date(`${lesson.date}T${lesson.end_time}`);
            if (lessonDateTime < new Date()) {
                statusClass = 'completed';
                statusText = 'Проведено';
            }
        }
        
        const card = document.createElement('div');
        card.className = `lesson-card ${statusClass}`;
        card.innerHTML = `
            <div class="lesson-header">
                <div class="lesson-title">${lesson.title || 'Індивідуальне заняття'}</div>
                <div class="lesson-status ${statusClass}">${statusText}</div>
            </div>
            <div class="lesson-details">
                <div class="lesson-detail">
                    <div class="detail-title">Дата і час</div>
                    <div class="detail-value-sub">${formatDate(lesson.date)}, ${formatTime(lesson.start_time)} - ${formatTime(lesson.end_time)}</div>
                </div>
                <div class="lesson-detail">
                    <div class="detail-title">Тренер</div>
                    <div class="detail-value-sub">${lesson.coach_name}</div>
                </div>
                <div class="lesson-detail">
                    <div class="detail-title">Ціна</div>
                    <div class="detail-value-sub">${lesson.price} ₴</div>
                </div>
            </div>
            <div class="lesson-actions">
                ${!lesson.is_cancelled && new Date(`${lesson.date}T${lesson.end_time}`) > new Date() ? 
                  `<button class="action-button cancel-lesson-btn" data-id="${lesson.id}">Скасувати</button>` : ''}
                <button class="action-button edit-lesson-btn" data-id="${lesson.id}">Деталі</button>
            </div>
        `;
        
        lessonsList.appendChild(card);
    });
    
    // Перепривязываем события к новым карточкам
    rebindLessonCardEvents();
}

// Улучшенная обработка сообщений WebSocket
function processWebSocketMessage(data) {
    console.log('Processing WebSocket message:', data);
    
    // Определяем API_CODES, если они не определены
    const apiCodes = window.API_CODES || {
        CLIENT_DATA: 294,
        CLIENT_SUBSCRIPTIONS: 296,
        CLIENT_LESSONS: 295,
        SELECT_DATA: 289,
        SUCCESS: 200
    };
    
    switch(data.code) {
        case apiCodes.CLIENT_DATA:
            console.log('Received client data');
            window.clientData = data.data;
            renderClientData();
            break;
            
        case apiCodes.CLIENT_SUBSCRIPTIONS:
            console.log('Received client subscriptions');
            window.clientSubscriptions = data.data.subscriptions;
            window.subscriptionsData = data.data.all_subscriptions;
            renderSubscriptions();
            break;
            
        case apiCodes.CLIENT_LESSONS:
            console.log('Received client lessons');
            window.clientLessons = data.data;
            renderLessons();
            break;
            
        case apiCodes.SELECT_DATA:
            console.log('Received select data');
            window.coachesData = data.data[0];
            window.groupsData = data.data[1];
            populateSelectFields();
            break;
            case apiCodes.SUCCESS:
                console.log('Operation completed successfully');
                // This line causes the infinite loop
                // loadClientData();
                break;
            
        default:
            console.log('Unknown message code:', data.code);
    }
}

// Запуск инициализации при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Создаем глобальные переменные, если они не существуют
    window.clientData = window.clientData || null;
    window.clientSubscriptions = window.clientSubscriptions || [];
    window.clientLessons = window.clientLessons || [];
    window.subscriptionsData = window.subscriptionsData || [];
    window.coachesData = window.coachesData || [];
    window.groupsData = window.groupsData || [];
    
    // Запускаем инициализацию всех обработчиков событий
    // initializeAllEventHandlers();
    
    // Проверяем WebSocket соединение
    if (window.ws) {
        console.log('WebSocket already initialized, current state:', window.ws.readyState);
        if (window.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket connection is already open, loading client data');
            loadClientData();
        } else if (window.ws.readyState === WebSocket.CONNECTING) {
            console.log('WebSocket is still connecting, waiting...');
            window.ws.addEventListener('open', function() {
                console.log('WebSocket connection established from event listener');
                loadClientData();
            });
        }
    } else {
        console.log('Initializing new WebSocket connection');
        try {
            window.ws = new WebSocket('ws://localhost:8000/socket/');
            
            window.ws.onopen = function() {
                console.log('WebSocket connection established');
                loadClientData();
            };
            
            window.ws.onmessage = function(event) {
                console.log('WebSocket data received');
                try {
                    const data = JSON.parse(event.data);
                    processWebSocketMessage(data);
                } catch (error) {
                    console.error('Error processing WebSocket data:', error);
                }
            };
            
            window.ws.onerror = function(error) {
                console.error('WebSocket error:', error);
                // Для тестирования, если соединение не установлено
                simulateClientData();
            };
            
            window.ws.onclose = function() {
                console.log('WebSocket connection closed');
            };
        } catch (error) {
            console.error('Error creating WebSocket:', error);
            simulateClientData();
        }
    }
});

// Обеспечиваем доступность вспомогательных функций
function populateEditForm() {
    console.log('Populating edit form');
    if (!window.clientData) {
        console.warn('Client data not available');
        return;
    }
    
    const nameInput = document.getElementById('editClientName');
    const usernameInput = document.getElementById('editClientUsername');
    const emailInput = document.getElementById('editClientEmail');
    const birthdayInput = document.getElementById('editClientBirthday');
    const sexInput = document.getElementById('editClientSex');
    const statusInput = document.getElementById('editClientStatus');
    const balanceInput = document.getElementById('editClientBalance');
    const descriptionInput = document.getElementById('editClientDescription');
    const coachInput = document.getElementById('editClientCoach');
    const groupInput = document.getElementById('editClientGroup');
    
    // Проверяем наличие каждого элемента перед установкой значения
    if (nameInput) nameInput.value = window.clientData.name;
    if (usernameInput) usernameInput.value = window.clientData.username;
    if (emailInput) emailInput.value = window.clientData.email;
    if (birthdayInput) birthdayInput.value = formatDateForInput(window.clientData.date_of_birth);
    if (sexInput) sexInput.value = window.clientData.sex ? '1' : '0';
    if (statusInput) statusInput.value = window.clientData.status ? '1' : '0';
    if (balanceInput) balanceInput.value = window.clientData.balance;
    if (descriptionInput) descriptionInput.value = window.clientData.description || '';
    
    // Выбираем тренера и группу
    if (coachInput && window.clientData.coach_id) {
        coachInput.value = window.clientData.coach_id;
    }
    
    if (groupInput && window.clientData.group_id) {
        groupInput.value = window.clientData.group_id;
    }
}

// Получение инициалов из имени
function getInitials(name) {
    if (!name) return '';
    return name.split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA');
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString || '-';
    }
}

// Форматирование даты для input type="date"
function formatDateForInput(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date for input:', error);
        return dateString || '';
    }
}

// Форматирование времени
function formatTime(timeString) {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
}

// Вычисление возраста
function calculateAge(dateString) {
    if (!dateString) return '-';
    
    try {
        const birthDate = new Date(dateString);
        const today = new Date();
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return `${age} років`;
    } catch (error) {
        console.error('Error calculating age:', error);
        return '-';
    }
}

// Получение названия дня недели
function getDayOfWeekName(dayNumber) {
    const days = [
        'Понеділок',
        'Вівторок',
        'Середа',
        'Четвер',
        'П\'ятниця',
        'Субота',
        'Неділя'
    ];
    
    return days[dayNumber] || 'Невідомий день';
}

// Функция загрузки данных клиента
function loadClientData() {
    console.log('Loading client data');
    
    const clientId = new URLSearchParams(window.location.search).get('username') || null;
    console.log('Client ID:', clientId);
    
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        // Определяем API_CODES, если они не определены
        const apiCodes = window.API_CODES || {
            GET_CLIENT: 194,
            GET_CLIENT_LESSONS: 197,
            GET_CLIENT_SUBS: 198,
            GET_SELECT_DATA: 189
        };
        
        // Запрашиваем данные клиента~
        ws.send(JSON.stringify({
            code: apiCodes.GET_CLIENT,
            username: clientId
        }));
        
        // Запрашиваем уроки клиента
        ws.send(JSON.stringify({
            code: apiCodes.GET_CLIENT_LESSONS,
            username: clientId
        }));
        
        // Запрашиваем абонементы клиента
        ws.send(JSON.stringify({
            code: apiCodes.GET_CLIENT_SUBS,
            username: clientId
        }));
        
        // Запрашиваем данные для выпадающих списков
        ws.send(JSON.stringify({
            code: apiCodes.GET_SELECT_DATA
        }));
    } else {
        console.error('WebSocket connection not established');
        // Для тестирования добавим имитацию данных
        simulateClientData();
    }
}

// Функция отображения данных клиента
function renderClientData() {
    console.log('Rendering client data');
    
    if (!window.clientData) {
        console.warn('No client data to render');
        return;
    }
    
    // Получаем все элементы, которые нужно заполнить
    const elements = {
        clientNameElement: document.getElementById('clientName'),
        clientInitialsElement: document.getElementById('clientInitials'),
        clientBalanceElement: document.getElementById('clientBalance'),
        clientStatusElement: document.getElementById('clientStatus'),
        clientJoinedElement: document.getElementById('clientJoined'),
        clientEmailElement: document.getElementById('clientEmail'),
        clientUsernameElement: document.getElementById('clientUsername'),
        clientBirthdayElement: document.getElementById('clientBirthday'),
        clientAgeElement: document.getElementById('clientAge'),
        clientSexElement: document.getElementById('clientSex'),
        clientCoachElement: document.getElementById('clientCoach'),
        clientGroupElement: document.getElementById('clientGroup'),
        clientDescriptionElement: document.getElementById('clientDescription')
    };
    
    // Проверяем наличие элементов перед установкой значений
    if (elements.clientNameElement) elements.clientNameElement.textContent = window.clientData.name;
    if (elements.clientInitialsElement) elements.clientInitialsElement.textContent = getInitials(window.clientData.name);
    if (elements.clientBalanceElement) elements.clientBalanceElement.textContent = `${window.clientData.balance} ₴`;
    
    // Статус
    if (elements.clientStatusElement) {
        if (window.clientData.status) {
            elements.clientStatusElement.textContent = 'Активний';
            elements.clientStatusElement.className = 'meta-value status-active';
        } else {
            elements.clientStatusElement.textContent = 'Неактивний';
            elements.clientStatusElement.className = 'meta-value status-inactive';
        }
    }
    
    // Дата регистрации
    if (elements.clientJoinedElement) elements.clientJoinedElement.textContent = formatDate(window.clientData.joined);
    
    // Контактная информация
    if (elements.clientEmailElement) elements.clientEmailElement.textContent = window.clientData.email;
    if (elements.clientUsernameElement) elements.clientUsernameElement.textContent = window.clientData.username;
    
    // Личная информация
    if (elements.clientBirthdayElement) elements.clientBirthdayElement.textContent = formatDate(window.clientData.date_of_birth);
    if (elements.clientAgeElement) elements.clientAgeElement.textContent = calculateAge(window.clientData.date_of_birth);
    if (elements.clientSexElement) elements.clientSexElement.textContent = window.clientData.sex ? 'Жіноча' : 'Чоловіча';
    
    // Тренер и группа
    if (elements.clientCoachElement) elements.clientCoachElement.textContent = window.clientData.coach_name || 'Не призначено';
    if (elements.clientGroupElement) elements.clientGroupElement.textContent = window.clientData.group_name || 'Не призначено';
    
    // Дополнительная информация
    if (elements.clientDescriptionElement) elements.clientDescriptionElement.textContent = window.clientData.description || 'Немає додаткової інформації';
}

// Функция заполнения полей выбора в модальных окнах
function populateSelectFields() {
    console.log('Populating select fields');
    
    // Если данные еще не загружены, выходим
    if (!window.coachesData || !window.coachesData.length || !window.groupsData || !window.groupsData.length) {
        console.warn('Select data not loaded');
        return;
    }
    
    // Тренеры для формы редактирования
    const editClientCoach = document.getElementById('editClientCoach');
    if (editClientCoach) {
        editClientCoach.innerHTML = '<option value="">Виберіть тренера</option>';
        window.coachesData.forEach(coach => {
            const option = document.createElement('option');
            option.value = coach.id;
            option.textContent = coach.name;
            editClientCoach.appendChild(option);
        });
        
        // Выбираем текущего тренера
        if (window.clientData && window.clientData.coach_id) {
            editClientCoach.value = window.clientData.coach_id;
        }
    }
    
    // Группы для формы редактирования
    const editClientGroup = document.getElementById('editClientGroup');
    if (editClientGroup) {
        editClientGroup.innerHTML = '<option value="">Виберіть групу</option>';
        window.groupsData.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            editClientGroup.appendChild(option);
        });
        
        // Выбираем текущую группу
        if (window.clientData && window.clientData.group_id) {
            editClientGroup.value = window.clientData.group_id;
        }
    }
    
    // Абонементы для формы назначения
    const subSelect = document.getElementById('subSelect');
    if (subSelect && window.subscriptionsData && window.subscriptionsData.length) {
        subSelect.innerHTML = '<option value="">Оберіть абонемент</option>';
        window.subscriptionsData.forEach(subscription => {
            const option = document.createElement('option');
            option.value = subscription.id;
            option.textContent = subscription.name;
            subSelect.appendChild(option);
        });
    }
}

// Открытие модального окна для добавления расписания к существующему абонементу
function openAddScheduleModal(subscriptionId) {
    console.log('Opening add schedule modal for subscription:', subscriptionId);
    
    // Создаем модальное окно динамически, если его еще нет
    let addScheduleModal = document.getElementById('addScheduleModal');
    
    if (!addScheduleModal) {
        // Создаем модальное окно
        addScheduleModal = document.createElement('div');
        addScheduleModal.id = 'addScheduleModal';
        addScheduleModal.className = 'modal-overlay';
        
        // Содержимое модального окна
        addScheduleModal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3 class="modal-title">Додати розклад до абонементу</h3>
                    <button class="modal-close" id="closeAddScheduleModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addScheduleForm">
                        <input type="hidden" id="scheduleSubId" value="${subscriptionId}">
                        <div class="form-group">
                            <label>День тижня</label>
                            <select class="form-control" id="scheduleDaySelect" required>
                                <option value="">Оберіть день тижня</option>
                                <option value="0">Понеділок</option>
                                <option value="1">Вівторок</option>
                                <option value="2">Середа</option>
                                <option value="3">Четвер</option>
                                <option value="4">П'ятниця</option>
                                <option value="5">Субота</option>
                                <option value="6">Неділя</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="scheduleStartTime">Час початку</label>
                                <input type="time" class="form-control" id="scheduleStartTime" required>
                            </div>
                            <div class="form-group">
                                <label for="scheduleEndTime">Час закінчення</label>
                                <input type="time" class="form-control" id="scheduleEndTime" required>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelAddScheduleBtn">Скасувати</button>
                    <button type="button" class="btn btn-primary" id="saveAddScheduleBtn">Додати</button>
                </div>
            </div>
        `;
        
        // Добавляем окно в body
        document.body.appendChild(addScheduleModal);
        
        // Добавляем обработчики событий
        const closeBtn = document.getElementById('closeAddScheduleModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeAddScheduleModal);
        }
        
        const cancelBtn = document.getElementById('cancelAddScheduleBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeAddScheduleModal);
        }
        
        const saveBtn = document.getElementById('saveAddScheduleBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveNewSchedule);
        }
        
        addScheduleModal.addEventListener('click', function(e) {
            if (e.target === addScheduleModal) {
                closeAddScheduleModal();
            }
        });
    } else {
        // Устанавливаем ID абонемента
        const scheduleSubIdField = document.getElementById('scheduleSubId');
        if (scheduleSubIdField) {
            scheduleSubIdField.value = subscriptionId;
        }
    }
    
    // Устанавливаем время по умолчанию
    const now = new Date();
    const startTimeInput = document.getElementById('scheduleStartTime');
    const endTimeInput = document.getElementById('scheduleEndTime');
    
    if (startTimeInput) {
        startTimeInput.value = `${String(now.getHours()).padStart(2, '0')}:00`;
    }
    
    if (endTimeInput) {
        endTimeInput.value = `${String(now.getHours() + 1).padStart(2, '0')}:30`;
    }
    
    // Открываем модальное окно
    addScheduleModal.classList.add('active');
}

// Закрытие модального окна добавления расписания
function closeAddScheduleModal() {
    console.log('Closing add schedule modal');
    const addScheduleModal = document.getElementById('addScheduleModal');
    if (addScheduleModal) {
        addScheduleModal.classList.remove('active');
        
        const addScheduleForm = document.getElementById('addScheduleForm');
        if (addScheduleForm) {
            addScheduleForm.reset();
        }
    }
}

// Сохранение нового расписания
function saveNewSchedule() {
    console.log('Saving new schedule');
    const addScheduleForm = document.getElementById('addScheduleForm');
    
    if (!addScheduleForm) {
        console.error('Add schedule form not found!');
        return;
    }
    
    if (!addScheduleForm.checkValidity()) {
        alert('Будь ласка, заповніть всі обов\'язкові поля');
        return;
    }
    
    const clientId = new URLSearchParams(window.location.search).get('id') || 1;
    const subscriptionId = document.getElementById('scheduleSubId').value;
    const dayOfWeek = document.getElementById('scheduleDaySelect').value;
    const startTime = document.getElementById('scheduleStartTime').value;
    const endTime = document.getElementById('scheduleEndTime').value;
    
    // Формирование данных для отправки
    const scheduleData = {
        client_id: clientId,
        subscription_id: subscriptionId,
        day_of_the_week: parseInt(dayOfWeek),
        start_time: startTime,
        end_time: endTime
    };
    
    console.log('Schedule data:', scheduleData);
    
    // Отправка данных на сервер
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        const apiCodes = window.API_CODES || {
            ADD_SCHEDULE: 297,
            GET_CLIENT_SUBS: 198
        };
        
        ws.send(JSON.stringify({
            code: apiCodes.ADD_SCHEDULE,
            schedule: scheduleData
        }));
        
        // Закрываем модальное окно
        closeAddScheduleModal();
        
        // Обновляем данные абонементов
        ws.send(JSON.stringify({
            code: apiCodes.GET_CLIENT_SUBS,
            id: clientId
        }));
    } else {
        alert('Немає з\'єднання з сервером');
    }
}

// Открытие модального окна для редактирования абонемента
function openEditSubscriptionModal(subscriptionId) {
    console.log('Opening edit subscription modal for subscription:', subscriptionId);
    
    // Находим абонемент по ID
    const subscription = window.clientSubscriptions.find(sub => sub.id == subscriptionId);
    if (!subscription) {
        console.error('Subscription with ID ' + subscriptionId + ' not found');
        return;
    }
    
    // Создаем модальное окно динамически, если его еще нет
    let editSubModal = document.getElementById('editSubscriptionModal');
    
    if (!editSubModal) {
        // Создаем модальное окно
        editSubModal = document.createElement('div');
        editSubModal.id = 'editSubscriptionModal';
        editSubModal.className = 'modal-overlay';
        
        // Содержимое модального окна
        editSubModal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3 class="modal-title">Редагування абонементу</h3>
                    <button class="modal-close" id="closeEditSubModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editSubForm">
                        <input type="hidden" id="editSubId" value="${subscription.id}">
                        <div class="form-group">
                            <label for="editSubName">Назва абонементу</label>
                            <input type="text" class="form-control" id="editSubName" disabled>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editSubPrice">Ціна (₴)</label>
                                <input type="number" class="form-control" id="editSubPrice" min="0" step="50" disabled>
                            </div>
                            <div class="form-group">
                                <label for="editSubTotalLessons">Всього занять</label>
                                <input type="number" class="form-control" id="editSubTotalLessons" min="1" disabled>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="editSubUsedLessons">Використано занять</label>
                            <input type="number" class="form-control" id="editSubUsedLessons" min="0">
                        </div>
                        <div class="form-group">
                            <label for="editSubValidUntil">Дійсний до</label>
                            <input type="date" class="form-control" id="editSubValidUntil">
                        </div>
                        <div class="form-group">
                            <label for="editSubStatus">Статус</label>
                            <select class="form-control" id="editSubStatus">
                                <option value="1">Активний</option>
                                <option value="0">Неактивний</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Розклад:</label>
                            <div id="editSubScheduleList" class="schedule-list">
                                <!-- Сюда будут добавлены элементы расписания -->
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelEditSubBtn">Скасувати</button>
                    <button type="button" class="btn btn-primary" id="saveEditSubBtn">Зберегти</button>
                </div>
            </div>
        `;
        
        // Добавляем окно в body
        document.body.appendChild(editSubModal);
        
        // Добавляем обработчики событий
        const closeBtn = document.getElementById('closeEditSubModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeEditSubModal);
        }
        
        const cancelBtn = document.getElementById('cancelEditSubBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeEditSubModal);
        }
        
        const saveBtn = document.getElementById('saveEditSubBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveEditedSubscription);
        }
        
        editSubModal.addEventListener('click', function(e) {
            if (e.target === editSubModal) {
                closeEditSubModal();
            }
        });
    }
    
    // Заполняем форму данными абонемента
    const editSubId = document.getElementById('editSubId');
    const editSubName = document.getElementById('editSubName');
    const editSubPrice = document.getElementById('editSubPrice');
    const editSubTotalLessons = document.getElementById('editSubTotalLessons');
    const editSubUsedLessons = document.getElementById('editSubUsedLessons');
    const editSubValidUntil = document.getElementById('editSubValidUntil');
    const editSubStatus = document.getElementById('editSubStatus');
    
    if (editSubId) editSubId.value = subscription.id;
    if (editSubName) editSubName.value = subscription.name;
    if (editSubPrice) editSubPrice.value = subscription.price;
    if (editSubTotalLessons) editSubTotalLessons.value = subscription.total_lessons;
    if (editSubUsedLessons) editSubUsedLessons.value = subscription.used_lessons;
    if (editSubValidUntil) editSubValidUntil.value = formatDateForInput(subscription.valid_until);
    if (editSubStatus) editSubStatus.value = subscription.is_active ? '1' : '0';
    
    // Отображаем расписание
    const scheduleList = document.getElementById('editSubScheduleList');
    if (scheduleList) {
        scheduleList.innerHTML = '';
        
        if (subscription.schedules && subscription.schedules.length > 0) {
            subscription.schedules.forEach(schedule => {
                const dayName = getDayOfWeekName(schedule.day_of_the_week);
                const scheduleItem = document.createElement('div');
                scheduleItem.className = 'schedule-item-edit';
                scheduleItem.innerHTML = `
                    <span class="schedule-day-edit">${dayName}</span>
                    <span class="schedule-time-edit">${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}</span>
                    <button type="button" class="delete-schedule-btn" data-id="${schedule.id}">&times;</button>
                `;
                scheduleList.appendChild(scheduleItem);
            });
            
            // Добавляем обработчики для кнопок удаления
            document.querySelectorAll('.delete-schedule-btn').forEach(button => {
                button.addEventListener('click', function() {
                    deleteSchedule(this.getAttribute('data-id'));
                });
            });
        } else {
            scheduleList.innerHTML = '<p>Розклад не визначено</p>';
        }
    }
    
    // Открываем модальное окно
    editSubModal.classList.add('active');
}

// Закрытие модального окна редактирования абонемента
function closeEditSubModal() {
    console.log('Closing edit subscription modal');
    const editSubModal = document.getElementById('editSubscriptionModal');
    if (editSubModal) {
        editSubModal.classList.remove('active');
    }
}

// Сохранение отредактированного абонемента
function saveEditedSubscription() {
    console.log('Saving edited subscription');
    const editSubForm = document.getElementById('editSubForm');
    
    if (!editSubForm) {
        console.error('Edit subscription form not found!');
        return;
    }
    
    if (!editSubForm.checkValidity()) {
        alert('Будь ласка, заповніть всі обов\'язкові поля');
        return;
    }
    
    const clientId = new URLSearchParams(window.location.search).get('id') || 1;
    
    const subscriptionId = document.getElementById('editSubId').value;
    const usedLessons = parseInt(document.getElementById('editSubUsedLessons').value);
    const validUntil = document.getElementById('editSubValidUntil').value;
    const isActive = document.getElementById('editSubStatus').value === '1';
    
    // Формирование данных для отправки
    const subscriptionData = {
        id: subscriptionId,
        client_id: clientId,
        used_lessons: usedLessons,
        valid_until: validUntil,
        is_active: isActive
    };
    
    console.log('Subscription data:', subscriptionData);
    
    // Отправка данных на сервер
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        const apiCodes = window.API_CODES || {
            UPDATE_SUBSCRIPTION: 299,
            GET_CLIENT_SUBS: 198
        };
        
        ws.send(JSON.stringify({
            code: apiCodes.UPDATE_SUBSCRIPTION,
            subscription: subscriptionData
        }));
        
        // Закрываем модальное окно
        closeEditSubModal();
        
        // Обновляем данные абонементов
        ws.send(JSON.stringify({
            code: apiCodes.GET_CLIENT_SUBS,
            id: clientId
        }));
    } else {
        alert('Немає з\'єднання з сервером');
    }
}

// Удаление расписания
function deleteSchedule(scheduleId) {
    console.log('Deleting schedule:', scheduleId);
    
    if (confirm('Ви впевнені, що хочете видалити цей розклад?')) {
        const clientId = new URLSearchParams(window.location.search).get('id') || 1;
        
        // Отправка данных на сервер
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            const apiCodes = window.API_CODES || {
                DELETE_SCHEDULE: 298,
                GET_CLIENT_SUBS: 198
            };
            
            ws.send(JSON.stringify({
                code: apiCodes.DELETE_SCHEDULE,
                id: scheduleId
            }));
            
            // Обновляем модальное окно
            const element = document.querySelector(`.delete-schedule-btn[data-id="${scheduleId}"]`);
            if (element && element.parentNode) {
                element.parentNode.remove();
            }
            
            // Обновляем данные абонементов
            ws.send(JSON.stringify({
                code: apiCodes.GET_CLIENT_SUBS,
                id: clientId
            }));
        } else {
            alert('Немає з\'єднання з сервером');
        }
    }
}

// Отмена урока
function cancelLesson(lessonId) {
    console.log('Canceling lesson:', lessonId);
    
    if (confirm('Ви впевнені, що хочете скасувати це заняття?')) {
        const clientId = new URLSearchParams(window.location.search).get('id') || 1;
        
        // Отправка данных на сервер
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            const apiCodes = window.API_CODES || {
                USE_SUBSCRIPTION: 1909,
                GET_CLIENT_LESSONS: 197
            };
            
            ws.send(JSON.stringify({
                code: apiCodes.CANCEL_LESSON,
                id: lessonId
            }));
            
            // Обновляем данные уроков
            ws.send(JSON.stringify({
                code: apiCodes.GET_CLIENT_LESSONS,
                id: clientId
            }));
        } else {
            alert('Немає з\'єднання з сервером');
        }
    }
}

// Просмотр деталей урока
function viewLessonDetails(lessonId) {
    console.log('Viewing lesson details:', lessonId);
    
    // Находим урок по ID
    const lesson = window.clientLessons.find(l => l.id == lessonId);
    if (!lesson) {
        console.error('Lesson with ID ' + lessonId + ' not found');
        return;
    }
    
    // Создаем модальное окно динамически, если его еще нет
    let lessonDetailsModal = document.getElementById('lessonDetailsModal');
    
    if (!lessonDetailsModal) {
        // Создаем модальное окно
        lessonDetailsModal = document.createElement('div');
        lessonDetailsModal.id = 'lessonDetailsModal';
        lessonDetailsModal.className = 'modal-overlay';
        
        // Содержимое модального окна
        lessonDetailsModal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3 class="modal-title">Деталі заняття</h3>
                    <button class="modal-close" id="closeLessonDetailsModal">&times;</button>
                </div>
                <div class="modal-body" id="lessonDetailsContent">
                    <!-- Содержимое будет заполнено динамически -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="closeLessonDetailsBtn">Закрити</button>
                </div>
            </div>
        `;
        
        // Добавляем окно в body
        document.body.appendChild(lessonDetailsModal);
        
        // Добавляем обработчики событий
        const closeBtn = document.getElementById('closeLessonDetailsModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeLessonDetailsModal);
        }
        
        const closeFooterBtn = document.getElementById('closeLessonDetailsBtn');
        if (closeFooterBtn) {
            closeFooterBtn.addEventListener('click', closeLessonDetailsModal);
        }
        
        lessonDetailsModal.addEventListener('click', function(e) {
            if (e.target === lessonDetailsModal) {
                closeLessonDetailsModal();
            }
        });
    }
    
    // Определяем статус урока
    let statusClass = 'scheduled';
    let statusText = 'Заплановано';
    
    if (lesson.is_cancelled) {
        statusClass = 'cancelled';
        statusText = 'Скасовано';
    } else {
        const lessonDateTime = new Date(`${lesson.date}T${lesson.end_time}`);
        if (lessonDateTime < new Date()) {
            statusClass = 'completed';
            statusText = 'Проведено';
        }
    }
    
    // Заполняем содержимое
    const lessonDetailsContent = document.getElementById('lessonDetailsContent');
    if (lessonDetailsContent) {
        lessonDetailsContent.innerHTML = `
            <div class="lesson-details-header">
                <h4>${lesson.title || 'Індивідуальне заняття'}</h4>
                <div class="lesson-status ${statusClass}">${statusText}</div>
            </div>
            <div class="lesson-details-info">
                <div class="detail-row">
                    <div class="detail-label">Дата:</div>
                    <div class="detail-value">${formatDate(lesson.date)}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Час:</div>
                        <div class="detail-value">${formatTime(lesson.start_time)} - ${formatTime(lesson.end_time)}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Тренер:</div>
                        <div class="detail-value">${lesson.coach_name}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Ціна:</div>
                        <div class="detail-value">${lesson.price} ₴</div>
                    </div>
                    ${lesson.description ? `
                        <div class="detail-row">
                            <div class="detail-label">Опис:</div>
                            <div class="detail-value">${lesson.description}</div>
                        </div>
                    ` : ''}
                    ${lesson.is_cancelled ? `
                        <div class="detail-row">
                            <div class="detail-label">Причина скасування:</div>
                            <div class="detail-value">${lesson.cancel_reason || 'Не вказано'}</div>
                        </div>
                    ` : ''}
                </div>
                
                ${!lesson.is_cancelled && new Date(`${lesson.date}T${lesson.end_time}`) > new Date() ? `
                    <div class="lesson-details-actions">
                        <button class="btn btn-danger cancel-lesson-detail-btn" data-id="${lesson.id}">Скасувати заняття</button>
                    </div>
                ` : ''}
            `;
            
            // Добавляем обработчик для кнопки отмены
            const cancelButton = document.querySelector('.cancel-lesson-detail-btn');
            if (cancelButton) {
                cancelButton.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    closeLessonDetailsModal();
                    cancelLesson(id);
                });
            }
        }
        
        // Открываем модальное окно
        lessonDetailsModal.classList.add('active');
    }
    
    // Закрытие модального окна деталей урока
    function closeLessonDetailsModal() {
        console.log('Closing lesson details modal');
        const lessonDetailsModal = document.getElementById('lessonDetailsModal');
        if (lessonDetailsModal) {
            lessonDetailsModal.classList.remove('active');
        }
    }
    
    // Для тестирования: имитация данных когда соединение не установлено
    function simulateClientData() {
        console.log('Simulating client data');
        
        // Имитация данных клиента
        // window.clientData = {
        //     id: 1,
        //     name: "Марія Коваленко",
        //     username: "maria123",
        //     email: "maria@example.com",
        //     balance: 2500,
        //     status: true,
        //     joined: "2023-01-15",
        //     date_of_birth: "1990-05-20",
        //     sex: true,
        //     coach_id: 1,
        //     coach_name: "Олена Петренко",
        //     group_id: 2,
        //     group_name: "Початківці",
        //     description: "Займається вже 3 роки, має проблеми зі спиною."
        // };
        
        // Имитация данных абонементов
        window.clientSubscriptions = [
            {
                id: 1,
                name: "Місячний абонемент",
                price: 1500,
                total_lessons: 8,
                used_lessons: 3,
                valid_until: "2023-05-30",
                is_active: true,
                schedules: [
                    {
                        id: 1,
                        day_of_the_week: 1,
                        start_time: "18:00:00",
                        end_time: "19:30:00"
                    },
                    {
                        id: 2,
                        day_of_the_week: 3,
                        start_time: "18:00:00",
                        end_time: "19:30:00"
                    }
                ]
            },
            {
                id: 2,
                name: "Персональні заняття",
                price: 2500,
                total_lessons: 5,
                used_lessons: 1,
                valid_until: "2023-06-15",
                is_active: true,
                schedules: []
            }
        ];
        
        // Имитация данных уроков
        window.clientLessons = [
            {
                id: 1,
                title: "Групове заняття",
                date: "2023-05-15",
                start_time: "18:00:00",
                end_time: "19:30:00",
                coach_name: "Олена Петренко",
                price: 300,
                is_cancelled: false
            },
            {
                id: 2,
                title: "Персональне заняття",
                date: "2023-05-10",
                start_time: "10:00:00",
                end_time: "11:30:00",
                coach_name: "Олена Петренко",
                price: 500,
                is_cancelled: false
            },
            {
                id: 3,
                title: "Персональне заняття",
                date: "2023-05-05",
                start_time: "15:00:00",
                end_time: "16:30:00",
                coach_name: "Олена Петренко",
                price: 500,
                is_cancelled: true,
                cancel_reason: "Тренер захворів"
            }
        ];
        
        // Имитация данных для выпадающих списков
        window.coachesData = [
            { id: 1, name: "Олена Петренко" },
            { id: 2, name: "Іван Сидоренко" },
            { id: 3, name: "Анна Ковальчук" }
        ];
        
        window.groupsData = [
            { id: 1, name: "Продвинуті" },
            { id: 2, name: "Початківці" },
            { id: 3, name: "Діти" }
        ];
        
        window.subscriptionsData = [
            { id: 1, name: "Місячний абонемент" },
            { id: 2, name: "Персональні заняття" },
            { id: 3, name: "Абонемент на півроку" }
        ];
        
        // Отрисовка данных
        renderClientData();
        renderSubscriptions();
        renderLessons();
        populateSelectFields();
    }
    
    // Добавляем стили для новых модальных окон
    function addCustomStyles() {
        console.log('Adding custom styles');
        
        // Проверяем, есть ли уже добавленные стили
        const existingStyles = document.getElementById('client-custom-styles');
        if (existingStyles) {
            return;
        }
        
        const styleElement = document.createElement('style');
        styleElement.id = 'client-custom-styles';
        styleElement.textContent = `
            .schedule-item-edit {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                margin-bottom: 5px;
                background-color: #f5f5f5;
                border-radius: 4px;
            }
            
            .schedule-day-edit {
                font-weight: bold;
                margin-right: 10px;
            }
            
            .delete-schedule-btn {
                background: none;
                border: none;
                color: #ff5252;
                font-size: 18px;
                cursor: pointer;
            }
            
            .delete-schedule-btn:hover {
                color: #ff0000;
            }
            
            .schedule-list {
                margin-top: 10px;
            }
            
            .lesson-details-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .lesson-details-info {
                margin-bottom: 20px;
            }
            
            .lesson-details-actions {
                margin-top: 20px;
                display: flex;
                justify-content: flex-end;
            }
            
            .btn-danger {
                background-color: #ff5252;
                color: white;
            }
            
            .btn-danger:hover {
                background-color: #ff0000;
            }
            
            /* Фикс для уроков и абонементов */
            .subscription-actions, .lesson-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 10px;
            }
            
            /* Фикс для мобильной адаптации */
            @media (max-width: 768px) {
                .subscription-actions, .lesson-actions {
                    flex-direction: column;
                }
                
                .action-button {
                    width: 100%;
                    margin-bottom: 5px;
                }
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    // ============ API коды ============
    // Если файл api-codes.js не загружен, определим коды здесь
    if (typeof window.API_CODES === 'undefined') {
        console.log('API_CODES not defined, creating defaults');
        
        window.API_CODES = {
            // Коды получения данных
            GET_CLIENT: 194,
            GET_CLIENT_LESSONS: 197,
            GET_CLIENT_SUBS: 198,
            GET_SELECT_DATA: 189,
            
            // Коды ответов сервера
            CLIENT_DATA: 294,
            CLIENT_LESSONS: 295,
            CLIENT_SUBSCRIPTIONS: 296,
            SELECT_DATA: 289,
            SUCCESS: 200,
            
            // Коды операций
            UPDATE_CLIENT: 195,
            ASSIGN_SUB_TO_CLIENT: 196,
            UPDATE_SUBSCRIPTION: 299,
            ADD_SCHEDULE: 297,
            DELETE_SCHEDULE: 298,
            USE_SUBSCRIPTION: 199
        };
    }
    
    // Инициализация всего скрипта
    (function() {
        console.log('Running init function');
        
        // Добавляем стили
        addCustomStyles();
        
        // Устанавливаем глобальные переменные, если они еще не существуют
        window.clientData = window.clientData || null;
        window.clientSubscriptions = window.clientSubscriptions || [];
        window.clientLessons = window.clientLessons || [];
        window.subscriptionsData = window.subscriptionsData || [];
        window.coachesData = window.coachesData || [];
        window.groupsData = window.groupsData || [];
        
        // Определяем функцию запуска инициализации, которая будет вызвана после загрузки DOM
        function init() {
            console.log('DOM is fully loaded, initializing...');
            
            // Инициализируем обработчики событий
            initializeAllEventHandlers();
            
            // Проверяем WebSocket соединение
            if (window.ws) {
                console.log('WebSocket already initialized, current state:', window.ws.readyState);
                
                if (window.ws.readyState === WebSocket.OPEN) {
                    console.log('WebSocket connection is already open, loading client data');
                    loadClientData();
                } else if (window.ws.readyState === WebSocket.CONNECTING) {
                    console.log('WebSocket is still connecting, waiting...');
                    window.ws.addEventListener('open', function() {
                        console.log('WebSocket connection established from event listener');
                        loadClientData();
                    });
                } else {
                    console.warn('WebSocket is in an unexpected state:', window.ws.readyState);
                    // Имитация данных для тестирования
                    simulateClientData();
                }
            } else {
                console.log('Initializing new WebSocket connection');
                
                try {
                    window.ws = new WebSocket('ws://localhost:8000/socket/');
                    
                    window.ws.onopen = function() {
                        console.log('WebSocket connection established');
                        loadClientData();
                    };
                    
                    window.ws.onmessage = function(event) {
                        console.log('WebSocket data received');
                        try {
                            const data = JSON.parse(event.data);
                            processWebSocketMessage(data);
                        } catch (error) {
                            console.error('Error processing WebSocket data:', error);
                        }
                    };
                    
                    window.ws.onerror = function(error) {
                        console.error('WebSocket error:', error);
                        // Для тестирования, если соединение не установлено
                        simulateClientData();
                    };
                    
                    window.ws.onclose = function() {
                        console.log('WebSocket connection closed');
                    };
                } catch (error) {
                    console.error('Error creating WebSocket:', error);
                    simulateClientData();
                }
            }
        }
        
        // Проверяем, загружен ли уже DOM
        if (document.readyState === 'loading') {
            // DOM еще загружается, добавляем обработчик события
            document.addEventListener('DOMContentLoaded', init);
        } else {
            // DOM уже загружен, запускаем инициализацию немедленно
            init();
        }
    })();