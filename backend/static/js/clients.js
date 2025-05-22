// WebSocket-соединение для страницы клиентов
let socket = null;

// Коды операций для работы с клиентами
const CLIENT_CODES = {
    GET_ALL_CLIENTS: 400,        // Получить список всех клиентов
    GET_CLIENT_DATA: 401,        // Получить данные конкретного клиента
    UPDATE_CLIENT_DATA: 402,     // Обновить данные клиента
    GET_CLIENT_SUBSCRIPTIONS: 403, // Получить абонементы клиента
    GET_CLIENT_LESSONS: 404,     // Получить занятия клиента
    USE_SUBSCRIPTION: 405,       // Использовать абонемент
    CREATE_CLIENT: 406,          // Создать нового клиента
    DELETE_CLIENT: 407           // Удалить клиента
};

// Коды операций для работы с группами и тренерами
const GROUP_CODES = {
    GET_COACHES: 305,           // Получить список всех тренеров
    COACHES_DATA: 315           // Код для полученных данных о тренерах
};
// Глобальные переменные для пагинации
let currentPage = 1;
let clientsPerPage = 5;
let filteredClients = [];
let allClients = [];
// Инициализация WebSocket-соединения
function initWebSocket() {
    // Определяем URL для WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const token = localStorage.getItem("token"); 

    const wsUrl = `${protocol}//${window.location.host}/socket/?token=` + token;
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = function(e) {
        console.log('WebSocket соединение установлено');
        // После подключения запрашиваем список клиентов и тренеров
        getClientsList();
        getCoachesList();
    };
    
    socket.onmessage = function(event) {
        const response = JSON.parse(event.data);
        handleSocketMessage(response);
    };
    
    socket.onclose = function(event) {
        if (event.wasClean) {
            console.log(`WebSocket соединение закрыто корректно, код=${event.code}, причина=${event.reason}`);
        } else {
            console.error('WebSocket соединение прервано');
            // Пытаемся переподключиться через 5 секунд
            setTimeout(initWebSocket, 5000);
        }
    };
    
    socket.onerror = function(error) {
        console.error(`WebSocket ошибка: ${error.message}`);
    };
}

// Получение списка тренеров
function getCoachesList() {
    sendMessage(GROUP_CODES.GET_COACHES);
}

// Обработка сообщений от сервера
function handleSocketMessage(response) {
    console.log('Получено сообщение:', response);
    
    switch(response.code) {
        case CLIENT_CODES.GET_ALL_CLIENTS:
            // Обновляем таблицу клиентов
            updateClientsTable(response.data);
            break;
            
        case CLIENT_CODES.GET_CLIENT_DATA:
            // Заполняем модальное окно данными клиента
            fillClientModal(response.data);
            break;
            
        case CLIENT_CODES.GET_CLIENT_SUBSCRIPTIONS:
            // Обновляем вкладку абонементов
            updateSubscriptionsTab(response.data);
            break;
            
        case CLIENT_CODES.GET_CLIENT_LESSONS:
            // Обновляем вкладку истории занятий
            updateLessonsHistoryTab(response.data);
            break;
            
        case CLIENT_CODES.CREATE_CLIENT:
        case CLIENT_CODES.UPDATE_CLIENT_DATA:
        case CLIENT_CODES.DELETE_CLIENT:
        case CLIENT_CODES.USE_SUBSCRIPTION:
            // Подтверждение операций - обновляем список клиентов
            getClientsList();
            break;
            
        case GROUP_CODES.COACHES_DATA:
            // Обновляем списки тренеров в формах
            updateCoachesList(response.data);
            updateFilterCoachesList(response.data);

            break;
            
        case 200: // Код успешной операции
            console.log('Операция выполнена успешно');
            break;
            
        default:
            console.log('Неизвестный код операции:', response.code);
    }
}

// Обновление списков тренеров в формах
function updateCoachesList(coaches) {
    // Обновляем список в форме редактирования
    const editCoachSelect = document.getElementById('editCoach');
    const addCoachSelect = document.getElementById('addCoach');
    
    if (editCoachSelect) {
        // Сохраняем текущее выбранное значение
        const currentValue = editCoachSelect.value;
        
        // Очищаем список, оставляя только первый элемент (не назначено)
        while (editCoachSelect.options.length > 1) {
            editCoachSelect.remove(1);
        }
        
        // Добавляем тренеров в список
        coaches.forEach(coach => {
            const option = document.createElement('option');
            option.value = coach.id;
            option.textContent = coach.name;
            editCoachSelect.appendChild(option);
        });
        
        // Восстанавливаем выбранное значение, если оно существует
        if (currentValue) {
            editCoachSelect.value = currentValue;
        }
    }
    
    if (addCoachSelect) {
        // Очищаем список, оставляя только первый элемент (не назначено)
        while (addCoachSelect.options.length > 1) {
            addCoachSelect.remove(1);
        }
        
        // Добавляем тренеров в список
        coaches.forEach(coach => {
            const option = document.createElement('option');
            option.value = coach.id;
            option.textContent = coach.name;
            addCoachSelect.appendChild(option);
        });
    }
}

// Отправка сообщения через WebSocket
function sendMessage(code, data = {}) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const message = {
            code: code,
            ...data
        };
        socket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket не подключен');
    }
}

// Получение списка всех клиентов
function getClientsList() {
    sendMessage(CLIENT_CODES.GET_ALL_CLIENTS);
}

// Получение данных конкретного клиента
function getClientData(username) {
    sendMessage(CLIENT_CODES.GET_CLIENT_DATA, { username });
}

// Обновление данных клиента
function updateClientData(client) {
    sendMessage(CLIENT_CODES.UPDATE_CLIENT_DATA, { client });
}

// Получение абонементов клиента
function getClientSubscriptions(username) {
    sendMessage(CLIENT_CODES.GET_CLIENT_SUBSCRIPTIONS, { username });
}

// Получение занятий клиента
function getClientLessons(username) {
    sendMessage(CLIENT_CODES.GET_CLIENT_LESSONS, { username });
}

// Использование абонемента
function useSubscription(subId, clientName) {
    sendMessage(CLIENT_CODES.USE_SUBSCRIPTION, { 
        sub_id: subId, 
        client_name: clientName 
    });
}

// Создание нового клиента
function createClient(client) {
    sendMessage(CLIENT_CODES.CREATE_CLIENT, { client });
}

// Удаление клиента
function deleteClient(clientId) {
    sendMessage(CLIENT_CODES.DELETE_CLIENT, { id: clientId });
}

function updateClientsTable(clients) {
    // Store all clients in the global variable
    allClients = clients;
    
    // Apply current filter to the clients
    applyFilters();
}

// Function to apply filters and update the table
function applyFilters() {
    const searchInput = document.querySelector('.search-input');
    const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
    
    // Filter clients based on search input
    filteredClients = allClients.filter(client => {
        const clientName = client.full_name.toLowerCase();
        return clientName.includes(searchValue);
    });
    
    // Update pagination
    updatePagination();
    
    // Display clients for the current page
    displayClientsForCurrentPage();
}

// Function to display clients for the current page
function displayClientsForCurrentPage() {
    const tbody = document.querySelector('.clients-table tbody');
    if (!tbody) return;
    
    // Clear the table
    tbody.innerHTML = '';
    
    // Calculate start and end index for the current page
    const startIndex = (currentPage - 1) * clientsPerPage;
    const endIndex = Math.min(startIndex + clientsPerPage, filteredClients.length);
    
    // Get clients for the current page
    const clientsToDisplay = filteredClients.slice(startIndex, endIndex);
    
    // If no clients match the filter criteria
    if (clientsToDisplay.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 20px;">
                Немає клієнтів, що відповідають критеріям пошуку
            </td>
        `;
        tbody.appendChild(emptyRow);
        return;
    }
    
    // Display clients in the table
    clientsToDisplay.forEach(client => {
        // Get initials for the avatar
        const names = client.full_name.split(' ');
        const initials = names.length > 1 
            ? (names[0][0] + names[1][0]).toUpperCase() 
            : (names[0][0] + (names[0][1] || '')).toUpperCase();
        
        // Determine client status
        const statusClass = client.is_active ? 'status-active' : 'status-inactive';
        const statusText = client.is_active ? 'Активний' : 'Неактивний';
        
        // Format date
        function formatDate(dateStr, defaultMessage = 'Не має абонементу') {
            if (!dateStr) return defaultMessage;
            
            const date = new Date(dateStr);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return defaultMessage;
            }
            
            return date.toLocaleDateString('uk-UA');
        }
        
        
        // Create table row
        const row = document.createElement('tr');
        row.setAttribute('data-id', client.id);
        row.setAttribute('data-username', client.username);
        function getSubscriptionStatus(client) {
            // Если нет даты окончания абонемента или она в неверном формате
            if (!client.subscription_end_date || isNaN(new Date(client.subscription_end_date).getTime())) {
                return "Не має абонементу";
            }
            
            // Если у клиента есть активный абонемент
            if (client.is_active) {
                return `Дійсний до ${formatDate(client.subscription_end_date)}`;
            } else {
                return `Закінчився ${formatDate(client.subscription_end_date)}`;
            }
        }
  
    // Использование в коде создания строки таблицы:
    row.innerHTML = `
        <td>
            <div class="client-name">
                <div class="client-avatar">${initials}</div>
                ${client.full_name}
            </div>
        </td>
        <td>
            <span class="status-indicator ${statusClass}"></span>
            ${statusText}
        </td>
        <td>${formatDate(client.last_lesson_date, 'Немає занять')}</td>
        <td>${client.lessons_used} з ${client.lessons_total}</td>
        <td>${getSubscriptionStatus(client)}</td>

            <td class="client-actions">
                <button class="client-action-btn">
                <a href = '/client/info/?username=${client.username}'>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4V20H20V13" stroke="#555555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M18 2L21 5M20.4 2.6L15 8L14 10L16 9L21.4 3.6L20.4 2.6Z" stroke="#555555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    </a>
                </button>
                <button class="client-action-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H5M5 6H21M5 6V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V6M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6" stroke="#555555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Update event listeners for the table rows
    addTableEventListeners();
}

// Function to update pagination controls
function updatePagination() {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;
    
    // Calculate total pages
    const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
    
    // Store the previous and next navigation buttons if they exist
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    // Clear current pagination
    paginationContainer.innerHTML = '';
    
    // Re-add previous page button
    if (prevBtn) {
        paginationContainer.appendChild(prevBtn);
    } else {
        // Create a new previous button if it doesn't exist
        const prevButton = document.createElement('div');
        prevButton.className = 'page-nav';
        prevButton.id = 'prevPage';
        prevButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 6L9 12L15 18" stroke="#555555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        paginationContainer.appendChild(prevButton);
    }
    
    // Add page buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('div');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.dataset.page = i; // Add data attribute for easier selection
        pageBtn.addEventListener('click', function() {
            currentPage = i;
            displayClientsForCurrentPage();
            updatePageButtonsActive();
        });
        paginationContainer.appendChild(pageBtn);
    }
    
    // If no pages, add page 1
    if (totalPages === 0) {
        const pageBtn = document.createElement('div');
        pageBtn.className = 'page-btn active';
        pageBtn.textContent = '1';
        pageBtn.dataset.page = 1;
        paginationContainer.appendChild(pageBtn);
    }
    
    // Re-add next page button
    if (nextBtn) {
        paginationContainer.appendChild(nextBtn);
    } else {
        // Create a new next button if it doesn't exist
        const nextButton = document.createElement('div');
        nextButton.className = 'page-nav';
        nextButton.id = 'nextPage';
        nextButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6L15 12L9 18" stroke="#555555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        paginationContainer.appendChild(nextButton);
    }
    
    // Update navigation buttons functionality
    setupPaginationHandlers();
}
function updatePageButtonsActive() {
    const pageButtons = document.querySelectorAll('.page-btn');
    pageButtons.forEach(button => {
        // Use data attribute for more reliable comparison
        if (parseInt(button.dataset.page) === currentPage) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}
// Заполнение модального окна данными клиента
function fillClientModal(client) {
    console.log('Данные клиента для заполнения формы:', client); // Отладочный вывод
    
    // Преобразуем имя для аватара
    const names = client.full_name.split(' ');
    const initials = names.length > 1 
        ? (names[0][0] + names[1][0]).toUpperCase() 
        : (names[0][0] + (names[0][1] || '')).toUpperCase();
    
    // Форматируем дату
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('uk-UA');
    };
    
    // Заполняем информационную вкладку
    document.querySelector('.client-big-avatar').textContent = initials;
    document.querySelector('.client-details h2').textContent = client.full_name;
    
    // Контактные данные
    const contacts = document.querySelectorAll('.client-contact');
    contacts[0].innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="#A0A0A0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        ${client.phone || ''}`;
    
    contacts[1].innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 8L10.8906 13.2604C11.5624 13.7083 12.4376 13.7083 13.1094 13.2604L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="#A0A0A0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        ${client.email || ''}`;
    
    // Персональные данные
    const infoItems = document.querySelectorAll('#info-tab .info-grid .info-item');
    
    // Дата рождения
    infoItems[0].querySelector('.info-value').textContent = formatDate(client.birth_date, 'Не вказано');
    // Определяем, какой формат данных для пола используется в системе
    let genderText = 'Не указан';
    
    // Проверяем различные форматы значения пола
    if (client.gender === 1 || client.gender === '1' || client.gender === 'female') {
        genderText = 'Жіночий';
    } else if (client.gender === 0 || client.gender === '0' || client.gender === 'male') {
        genderText = 'Чоловічий';
    }
    
    // Пол
    infoItems[1].querySelector('.info-value').textContent = genderText;
    
    // Клиент с
    infoItems[2].querySelector('.info-value').textContent = formatDate(client.registration_date);
    
    // Статус
    const statusClass = client.is_active ? 'status-active' : 'status-inactive';
    const statusText = client.is_active ? 'Активний' : 'Неактивний';
    infoItems[3].querySelector('.info-value').innerHTML = `
        <span class="status-indicator ${statusClass}"></span>
        ${statusText}`;
    
    // Комментарии
    document.querySelector('#info-tab .info-section:last-child .info-value').textContent = client.comments || '';
    
    // Сохраняем ID клиента в форме редактирования
    const form = document.getElementById('editClientForm');
    form.setAttribute('data-id', client.id);
    form.setAttribute('data-username', client.username);
    
    // Заполняем форму редактирования
    form.querySelector('input[name="fullName"]').value = client.full_name || '';
    form.querySelector('input[name="phone"]').value = client.phone || '';
    form.querySelector('input[name="email"]').value = client.email || '';
    
    // Преобразуем дату для input[type="date"]
    const birthDate = client.birth_date ? new Date(client.birth_date) : null;
    if (birthDate && !isNaN(birthDate.getTime())) {
        const year = birthDate.getFullYear();
        const month = String(birthDate.getMonth() + 1).padStart(2, '0');
        const day = String(birthDate.getDate()).padStart(2, '0');
        form.querySelector('input[name="birthdate"]').value = `${year}-${month}-${day}`;
    } else {
        form.querySelector('input[name="birthdate"]').value = '';
    }
    
    // Устанавливаем пол (адаптируем к разным форматам)
    const genderSelect = form.querySelector('select[name="gender"]');
    console.log('Значение пола в данных:', client.gender, typeof client.gender); // Отладочный вывод
    
    if (client.gender === 1 || client.gender === '1' || client.gender === 'female') {
        genderSelect.value = 'female';
    } else if (client.gender === 0 || client.gender === '0' || client.gender === 'male') {
        genderSelect.value = 'male';
    } else {
        // По умолчанию выбираем женский пол
        genderSelect.value = 'female';
    }
    
    // Устанавливаем статус
    form.querySelector('select[name="status"]').value = client.is_active ? 'active' : 'inactive';
    
    // Устанавливаем комментарии
    form.querySelector('textarea[name="comments"]').value = client.comments || '';
    
    // Устанавливаем тренера если есть
    const coachSelect = form.querySelector('select[name="coach"]');
    if (coachSelect) {
        if (client.coach_id) {
            console.log('ID тренера в данных:', client.coach_id, typeof client.coach_id); // Отладочный вывод
            
            // Проверяем, существует ли опция с таким значением
            let optionExists = false;
            for (let i = 0; i < coachSelect.options.length; i++) {
                if (coachSelect.options[i].value == client.coach_id) {
                    optionExists = true;
                    break;
                }
            }
            
            // Если опция существует, устанавливаем значение
            if (optionExists) {
                coachSelect.value = client.coach_id;
            } else {
                // Если тренер не найден, но известен его ID, запрашиваем список тренеров
                getCoachesList();
                
                // Пытаемся установить значение через небольшую задержку
                setTimeout(() => {
                    coachSelect.value = client.coach_id;
                }, 500);
            }
        } else {
            // Если ID тренера не указан, устанавливаем "Не назначено"
            coachSelect.value = '';
        }
    }
    
    // Запрашиваем дополнительные данные (абонементы и занятия)
    getClientSubscriptions(client.username);
    getClientLessons(client.username);
}
// Обновление вкладки абонементов
function updateSubscriptionsTab(subscriptions) {
    const membershipTab = document.getElementById('membership-tab');
    if (!membershipTab) return;
    
    // Форматируем дату
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('uk-UA');
    };
    
    // Находим активный абонемент
    const activeSubscription = subscriptions.find(sub => sub.is_active);
    
    // Заполняем информацию об активном абонементе
    if (activeSubscription) {
        const progressPercent = Math.round((activeSubscription.lessons_used / activeSubscription.lessons_total) * 100);
        
        const membershipCard = membershipTab.querySelector('.membership-card');
        if (membershipCard) {
            membershipCard.querySelector('.membership-title').textContent = `Абонемент на ${activeSubscription.lessons_total} занять`;
            
            const infoItems = membershipCard.querySelectorAll('.info-item');
            infoItems[0].querySelector('.info-value').textContent = formatDate(subscription.start_date);
            infoItems[1].querySelector('.info-value').textContent = formatDate(subscription.end_date);
            
            const progressLabel = membershipCard.querySelector('.progress-label span:last-child');
            progressLabel.textContent = `${activeSubscription.lessons_used} из ${activeSubscription.lessons_total}`;
            
            const progressBar = membershipCard.querySelector('.progress-bar');
            progressBar.style.width = `${progressPercent}%`;
        }
    }
    
    // Отображаем историю абонементов
    const historySection = membershipTab.querySelector('.info-section');
    if (historySection) {
        // Очищаем предыдущую историю
        const historyTitle = historySection.querySelector('h3');
        historySection.innerHTML = '';
        historySection.appendChild(historyTitle);
        
        // Фильтруем и сортируем историю абонементов
        const historySubscriptions = subscriptions
            .filter(sub => !sub.is_active)
            .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        
        // Добавляем записи истории
        historySubscriptions.forEach(sub => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
            <div class="history-desc">${lesson.group_name} - ${lesson.lesson_type}</div>
            <div class="history-date">${formatDate(lesson.date, 'Дата не вказана')}</div>
        `;
            historySection.appendChild(historyItem);
        });
        
        // Если нет истории, показываем сообщение
        if (historySubscriptions.length === 0) {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `<div class="history-desc">Немає історії абонементів</div>`;
            historySection.appendChild(historyItem);
        }
    }
}

// Обновление вкладки истории занятий
function updateLessonsHistoryTab(lessons) {
    const historyTab = document.getElementById('history-tab');
    if (!historyTab) return;
    
    // Форматируем дату
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('uk-UA');
    };
    
    // Секция с занятиями
    const lessonsSection = historyTab.querySelector('.info-section:first-child');
    if (lessonsSection) {
        // Очищаем предыдущие занятия
        const sectionTitle = lessonsSection.querySelector('h3');
        lessonsSection.innerHTML = '';
        lessonsSection.appendChild(sectionTitle);
        
        // Сортируем занятия по дате (самые новые вверху)
        const sortedLessons = [...lessons].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        // Добавляем записи о занятиях
        sortedLessons.forEach(lesson => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-desc">${lesson.group_name} - ${lesson.lesson_type}</div>
                <div class="history-date">${formatDate(lesson.date)}</div>
            `;
            lessonsSection.appendChild(historyItem);
        });
        
        // Если нет занятий, показываем сообщение
        if (sortedLessons.length === 0) {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `<div class="history-desc">Немає занять в історії</div>`;
            lessonsSection.appendChild(historyItem);
        }
    }
    
    // Секция с платежами (сохраняем как есть или заполняем из данных)
    // В вашем случае можно добавить API для получения платежей
}

// Добавление обработчиков событий для таблицы клиентов
function addTableEventListeners() {
    // Обработчики для строк таблицы
    const rows = document.querySelectorAll('.clients-table tbody tr');
    rows.forEach(row => {
        row.addEventListener('click', function(e) {
            // Игнорируем клики по кнопкам действий
            if (e.target.closest('.client-action-btn:last-child')) {
                sendMessage(code = 407, {username:  this.getAttribute('data-username')})
                return
            }
            //~ If needed we will make overlay
            // // Получаем имя пользователя
            // const username = this.getAttribute('data-username');
            
            // // Запрашиваем данные клиента
            // getClientData(username);
            
            // // Открываем модальное окно
            // document.getElementById('clientModal').classList.add('active');
            // document.body.style.overflow = 'hidden';
            
            // // Reset the add client form if needed
            // document.getElementById('addClientForm').reset();
        });
    }
    )}
    const closeAddModalBtn = document.getElementById('closeAddModal');
    if (closeAddModalBtn) {
        closeAddModalBtn.addEventListener('click', function() {
            document.getElementById('addClientModal').classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    const cancelAddClientBtn = document.getElementById('cancelAddClient');
    if (cancelAddClientBtn) {
        cancelAddClientBtn.addEventListener('click', function() {
            document.getElementById('addClientModal').classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    const saveNewClientBtn = document.getElementById('saveNewClient');
    if (saveNewClientBtn) {
        saveNewClientBtn.addEventListener('click', function() {
            const form = document.getElementById('addClientForm');
            
            // Валидация формы
            const fullName = form.querySelector('input[name="fullName"]').value.trim();
            if (!fullName) {
                alert('Введіть імʼя та прізвище клієнта');
                return;
            }
            
            // Collect data from the form
            const clientData = {
                username:form.querySelector('input[name="username"]').value.trim() || '',
                password: form.querySelector('input[name="password"]').value.trim() || '',
                full_name: fullName,
                phone: form.querySelector('input[name="phone"]').value.trim() || '',
                email: form.querySelector('input[name="email"]').value.trim() || '',
                birth_date: form.querySelector('input[name="birthdate"]').value || null,
                gender: form.querySelector('select[name="gender"]').value,
                is_active: form.querySelector('select[name="status"]').value === 'active',
                comments: form.querySelector('textarea[name="comments"]').value.trim() || '',
                coach_id: form.querySelector('select[name="coach"]').value || null
            };
            
            // Send request to create new client
            createClient(clientData);
            
            // Close the modal
            document.getElementById('addClientModal').classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    // Обработчик для кнопки закрытия модального окна
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('clientModal').classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Обработчик для кнопки отмены
    const cancelBtn = document.getElementById('cancelEdit');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            document.getElementById('clientModal').classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    // Обработчик для кнопки сохранения

    const saveBtn = document.getElementById('saveClient');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const form = document.getElementById('editClientForm');
            
            // Валидация формы
            const fullName = form.querySelector('input[name="fullName"]').value.trim();
            if (!fullName) {
                alert('Введіть імʼя та прізвище клієнта');
                return;
            }
            
            // Собираем данные из формы
            const clientData = {
                id: form.getAttribute('data-id'),
                username: form.getAttribute('data-username') || fullName.toLowerCase().replace(/\s+/g, '.'),
                full_name: fullName,
                phone: form.querySelector('input[name="phone"]').value.trim() || '',
                email: form.querySelector('input[name="email"]').value.trim() || '',
                birth_date: form.querySelector('input[name="birthdate"]').value || null,
                gender: form.querySelector('select[name="gender"]').value,
                is_active: form.querySelector('select[name="status"]').value === 'active',
                comments: form.querySelector('textarea[name="comments"]').value.trim() || '',
                coach_id: form.querySelector('select[name="coach"]').value || null
            };
            
            // Отладочная информация
            console.log('Отправка данных клиента:', clientData);
            
            // Обновляем существующего клиента
            updateClientData(clientData);
            
            // Закрываем модальное окно
            document.getElementById('clientModal').classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Обработчики переключения вкладок
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Снимаем активный класс со всех вкладок
            tabs.forEach(t => t.classList.remove('active'));
            
            // Добавляем активный класс на текущую вкладку
            this.classList.add('active');
            
            // Получаем ID вкладки
            const tabId = this.getAttribute('data-tab') + '-tab';
            
            // Скрываем все вкладки
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Показываем активную вкладку
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Закрытие модального окна при клике на оверлей
    const modal = document.getElementById('clientModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Закрытие модального окна по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('clientModal').classList.contains('active')) {
            document.getElementById('clientModal').classList.remove('active');
            document.body.style.overflow = '';
        }
    });



function setupSearchHandler() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            // Reset to first page when filtering
            currentPage = 1;
            applyFilters();
        });
    }
}
function setupPaginationHandlers() {
    // Previous page button
    const prevPageBtn = document.getElementById('prevPage');
    if (prevPageBtn) {
        prevPageBtn.onclick = function() {
            if (currentPage > 1) {
                currentPage--;
                displayClientsForCurrentPage();
                updatePageButtonsActive();
            }
        };
    }
    
    // Next page button
    const nextPageBtn = document.getElementById('nextPage');
    if (nextPageBtn) {
        nextPageBtn.onclick = function() {
            const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                console.log(`Current page: ${currentPage}`);
                displayClientsForCurrentPage();
                updatePageButtonsActive();
            }
        };
    }
}

// Обработчик экспорта данных
function setupExportHandler() {
    const exportBtn = document.querySelector('.action-btn:nth-child(2)');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            // В реальном приложении здесь должен быть код для экспорта данных
            alert('Функціонал експорту буде реалізовано пізніше');
        });
    }
}

// Обработчик для кнопки фильтров

// Enhanced filter button setup
function setupFilterHandler() {
    const filterBtn = document.querySelector('.filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            // Create and display filter modal
            showFilterModal();
        });
    }
}

function showFilterModal() {
    // Check if the filter modal already exists
    let filterModal = document.getElementById('filterModal');
    
    // Create modal if it doesn't exist
    if (!filterModal) {
        filterModal = document.createElement('div');
        filterModal.id = 'filterModal';
        filterModal.className = 'modal-overlay';
        
        filterModal.innerHTML = `
            <div class="client-modal">
                <div class="modal-header">
                    <h2 class="modal-title">Фільтри</h2>
                    <button class="modal-close" id="closeFilterModal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="#555555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                
                <div class="client-info">
                    <form id="filterForm">
                        <div class="form-row">
                            <label class="form-label">Статус</label>
                            <select class="form-select" name="status">
                                <option value="all">Всі</option>
                                <option value="active">Активні</option>
                                <option value="inactive">Неактивні</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Тренер</label>
                            <select class="form-select" name="coach" id="filterCoach">
                                <option value="all">Всі</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <div class="form-row">
                                <label class="form-label">Останнє заняття від</label>
                                <input type="date" class="form-input" name="lastLessonFrom">
                            </div>
                            <div class="form-row">
                                <label class="form-label">Останнє заняття до</label>
                                <input type="date" class="form-input" name="lastLessonTo">
                            </div>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button class="modal-btn cancel-btn" id="resetFilters">Скинути</button>
                    <button class="modal-btn save-btn" id="applyFilters">Застосувати</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(filterModal);
        
        // Get coach list for filter
        if (socket && socket.readyState === WebSocket.OPEN) {
            sendMessage(GROUP_CODES.GET_COACHES);
        }
        
        // Add event listeners for filter modal
        document.getElementById('closeFilterModal').addEventListener('click', function() {
            filterModal.classList.remove('active');
        });
        
        document.getElementById('resetFilters').addEventListener('click', function() {
            document.getElementById('filterForm').reset();
        });
        
        document.getElementById('applyFilters').addEventListener('click', function() {
            // Apply advanced filters
            applyAdvancedFilters();
            // Close modal
            filterModal.classList.remove('active');
        });
        
        // Close modal on overlay click
        filterModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }
    
    // Show the modal
    filterModal.classList.add('active');
}

// Function to update coach list in filter modal
function updateFilterCoachesList(coaches) {
    const filterCoachSelect = document.getElementById('filterCoach');
    if (filterCoachSelect) {
        // Clear existing options (except 'All')
        while (filterCoachSelect.options.length > 1) {
            filterCoachSelect.remove(1);
        }
        
        // Add coaches to the list
        coaches.forEach(coach => {
            const option = document.createElement('option');
            option.value = coach.id;
            option.textContent = coach.name;
            filterCoachSelect.appendChild(option);
        });
    }
}

// Function to apply advanced filters
function applyAdvancedFilters() {
    const form = document.getElementById('filterForm');
    if (!form) return;
    
    const statusFilter = form.elements['status'].value;
    const coachFilter = form.elements['coach'].value;
    console.log(`Coach choosed ${coachFilter}`)
    const lastLessonFromFilter = form.elements['lastLessonFrom'].value;
    const lastLessonToFilter = form.elements['lastLessonTo'].value;
    
    // Filter clients based on criteria
    filteredClients = allClients.filter(client => {
        // Status filter
        console.log(client)
        if (statusFilter !== 'all') {
            const isActive = statusFilter === 'active';
            if (client.is_active !== isActive) return false;
        }
        
        // Coach filter
        if (coachFilter !== 'all' && client.coach_id != coachFilter) {
            return false;
        }
        
        // Last lesson date filters
        if (lastLessonFromFilter && client.last_lesson_date) {
            const lastLessonDate = new Date(client.last_lesson_date);
            const fromDate = new Date(lastLessonFromFilter);
            if (lastLessonDate < fromDate) return false;
        }
        
        if (lastLessonToFilter && client.last_lesson_date) {
            const lastLessonDate = new Date(client.last_lesson_date);
            const toDate = new Date(lastLessonToFilter);
            toDate.setHours(23, 59, 59); // End of the day
            if (lastLessonDate > toDate) return false;
        }
        
        // Apply text search filter too
        const searchInput = document.querySelector('.search-input');
        if (searchInput && searchInput.value) {
            const searchValue = searchInput.value.toLowerCase();
            return client.full_name.toLowerCase().includes(searchValue);
        }
        
        return true;
    });
    
    // Reset to first page
    currentPage = 1;
    
    // Update pagination and display clients
    updatePagination();
    displayClientsForCurrentPage();
}

// Инициализация всех обработчиков при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем WebSocket
    initWebSocket();
    
    // Устанавливаем обработчики событий
    setupModalEventListeners();
    setupSearchHandler();
    setupPaginationHandlers();
    setupExportHandler();
    setupFilterHandler();
});
    
    // Обработчики для кнопок действий
    const editButtons = document.querySelectorAll('.client-action-btn:first-child');
    editButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Предотвращаем всплытие события
            
            // Получаем имя пользователя из строки
            const row = this.closest('tr');
            const username = row.getAttribute('data-username');
            
            // Запрашиваем данные клиента
            getClientData(username);
            
            // Открываем модальное окно на вкладке редактирования
            document.getElementById('clientModal').classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Переключаемся на вкладку редактирования
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
                if (tab.getAttribute('data-tab') === 'edit') {
                    tab.classList.add('active');
                }
            });
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === 'edit-tab') {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Обработчики для кнопок удаления
    const deleteButtons = document.querySelectorAll('.client-action-btn:last-child');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Предотвращаем всплытие события
            
            // Получаем ID клиента из строки
            const row = this.closest('tr');
            const clientId = row.getAttribute('data-id');
            
            // Запрашиваем подтверждение удаления
            if (confirm('Ви впевнені, що хочете видалити цього клієнта?')) {
                deleteClient(clientId);
            }
        });
    });


// Обработчики событий для модального окна
// Обработчики событий для модального окна
function setupModalEventListeners() {
    // Обработчик для кнопки добавления клиента
    const addClientBtn = document.getElementById('addClientBtn');
    if (addClientBtn) {
        addClientBtn.addEventListener('click', function() {
            // Open the add client modal instead of the edit modal
            const modal = document.getElementById('addClientModal');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Reset the add client form if needed
            document.getElementById('addClientForm').reset();
        });
    }

    const closeAddModalBtn = document.getElementById('closeAddModal');
    if (closeAddModalBtn) {
        closeAddModalBtn.addEventListener('click', function() {
            document.getElementById('addClientModal').classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    const cancelAddClientBtn = document.getElementById('cancelAddClient');
    if (cancelAddClientBtn) {
        cancelAddClientBtn.addEventListener('click', function() {
            document.getElementById('addClientModal').classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // const saveNewClientBtn = document.getElementById('saveNewClient');
    // if (saveNewClientBtn) {
    //     saveNewClientBtn.addEventListener('click', function() {
    //         const form = document.getElementById('addClientForm');
            
    //         // Валидация формы
    //         const fullName = form.querySelector('input[name="fullName"]').value.trim();
    //         if (!fullName) {
    //             alert('Введіть імʼя та прізвище клієнта');
    //             return;
    //         }
            
    //         // Collect data from the form
    //         const clientData = {
    //             username: fullName.toLowerCase().replace(/\s+/g, '.'),
    //             full_name: fullName,
    //             phone: form.querySelector('input[name="phone"]').value.trim() || '',
    //             email: form.querySelector('input[name="email"]').value.trim() || '',
    //             birth_date: form.querySelector('input[name="birthdate"]').value || null,
    //             gender: form.querySelector('select[name="gender"]').value,
    //             is_active: form.querySelector('select[name="status"]').value === 'active',
    //             comments: form.querySelector('textarea[name="comments"]').value.trim() || '',
    //             coach_id: form.querySelector('select[name="coach"]').value || null
    //         };
            
    //         // Send request to create new client
    //         createClient(clientData);
            
    //         // Close the modal
    //         document.getElementById('addClientModal').classList.remove('active');
    //         document.body.style.overflow = '';
    //     });
    // }
    
    // Обработчик для кнопки закрытия модального окна
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('clientModal').classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Обработчик для кнопки отмены
    const cancelBtn = document.getElementById('cancelEdit');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            document.getElementById('clientModal').classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Обработчик для кнопки сохранения
    const saveBtn = document.getElementById('saveClient');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const form = document.getElementById('editClientForm');
            
            // Валидация формы
            const fullName = form.querySelector('input[name="fullName"]').value.trim();
            if (!fullName) {
                alert('Введіть імʼя та прізвище клієнта');
                return;
            }
            
            // Собираем данные из формы
            const clientData = {
                id: form.getAttribute('data-id'),
                username: form.getAttribute('data-username') || fullName.toLowerCase().replace(/\s+/g, '.'),
                full_name: fullName,
                phone: form.querySelector('input[name="phone"]').value.trim() || '',
                email: form.querySelector('input[name="email"]').value.trim() || '',
                birth_date: form.querySelector('input[name="birthdate"]').value || null,
                gender: form.querySelector('select[name="gender"]').value,
                is_active: form.querySelector('select[name="status"]').value === 'active',
                comments: form.querySelector('textarea[name="comments"]').value.trim() || '',
                coach_id: form.querySelector('select[name="coach"]').value || null
            };
            
            // Отладочная информация
            console.log('Отправка данных клиента:', clientData);
            
            // Обновляем существующего клиента
            updateClientData(clientData);
            
            // Закрываем модальное окно
            document.getElementById('clientModal').classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Обработчики переключения вкладок
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Снимаем активный класс со всех вкладок
            tabs.forEach(t => t.classList.remove('active'));
            
            // Добавляем активный класс на текущую вкладку
            this.classList.add('active');
            
            // Получаем ID вкладки
            const tabId = this.getAttribute('data-tab') + '-tab';
            
            // Скрываем все вкладки
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Показываем активную вкладку
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Закрытие модального окна при клике на оверлей
    const modal = document.getElementById('clientModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Закрытие модального окна по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('clientModal').classList.contains('active')) {
            document.getElementById('clientModal').classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Аналогично для окна добавления клиента
    const addModal = document.getElementById('addClientModal');
    if (addModal) {
        addModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.getElementById('addClientModal').classList.contains('active')) {
                document.getElementById('addClientModal').classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}