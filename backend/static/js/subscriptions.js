// Глобальные переменные для хранения данных
let templates = [];
let subscriptions = [];
let coaches = [];
let groups = [];
let clients = [];
let schedules = []; // Временное хранение расписаний для текущего шаблона

// API эндпоинты
const API_ENDPOINTS = {
    TEMPLATES: '/api/templates',
    SUBSCRIPTIONS: '/api/subscriptions',
    COACHES: '/api/coaches',
    GROUPS: '/api/groups',
    CLIENTS: '/api/clients',
    SCHEDULES: '/api/schedules'
};

// DOM-элементы основных страниц
const templatesGrid = document.getElementById('templatesGrid');
const subscriptionsGrid = document.getElementById('subscriptionsGrid');
const templateSearch = document.getElementById('templateSearch');
const subscriptionSearch = document.getElementById('subscriptionSearch');
const coachTemplateFilter = document.getElementById('coachTemplateFilter');
const groupTemplateFilter = document.getElementById('groupTemplateFilter');
const clientFilter = document.getElementById('clientFilter');
const templateFilter = document.getElementById('templateFilter');
const statusFilter = document.getElementById('statusFilter');

// DOM-элементы модальных окон
const templateModal = document.getElementById('templateModal');
const scheduleModal = document.getElementById('scheduleModal');
const templateDetailsModal = document.getElementById('templateDetailsModal');
const subscriptionDetailsModal = document.getElementById('subscriptionDetailsModal');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация обработчиков событий
    initializeEventHandlers();
    
    // Активация вкладки шаблонов по умолчанию
    document.querySelector('.tab-button[data-tab="templates"]').click();
});

// Инициализация всех обработчиков событий
function initializeEventHandlers() {
    // Табы для переключения между шаблонами и абонементами
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Активация кнопки
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Активация панели
            const tabId = this.dataset.tab;
            const tabPanels = document.querySelectorAll('.subscription-tab-content');
            tabPanels.forEach(panel => panel.classList.remove('active'));
            document.getElementById(`${tabId}-panel`).classList.add('active');
            
            // Загрузка данных для активной вкладки
            if (tabId === 'templates') {
                loadTemplates();
                loadCoachesAndGroups();
            } else if (tabId === 'active') {
                loadSubscriptions();
                loadClients();
            }
        });
    });
    
    // Поиск и фильтрация для шаблонов
    templateSearch.addEventListener('input', filterAndRenderTemplates);
    coachTemplateFilter.addEventListener('change', filterAndRenderTemplates);
    groupTemplateFilter.addEventListener('change', filterAndRenderTemplates);
    
    // Поиск и фильтрация для абонементов
    subscriptionSearch.addEventListener('input', filterAndRenderSubscriptions);
    clientFilter.addEventListener('change', filterAndRenderSubscriptions);
    templateFilter.addEventListener('change', filterAndRenderSubscriptions);
    statusFilter.addEventListener('change', filterAndRenderSubscriptions);
    
    // Кнопка создания шаблона
    document.getElementById('createTemplateBtn').addEventListener('click', openCreateTemplateModal);
    
    // Обработчики для модального окна шаблона
    document.getElementById('closeTemplateModal').addEventListener('click', closeTemplateModal);
    document.getElementById('cancelTemplateBtn').addEventListener('click', closeTemplateModal);
    document.getElementById('saveTemplateBtn').addEventListener('click', saveTemplate);
    
    // Изменение группы в форме шаблона
    document.getElementById('templateGroup').addEventListener('change', toggleScheduleSection);
    
    // Обработчики для модального окна расписания
    document.getElementById('addScheduleBtn').addEventListener('click', openScheduleModal);
    document.getElementById('closeScheduleModal').addEventListener('click', closeScheduleModal);
    document.getElementById('cancelScheduleBtn').addEventListener('click', closeScheduleModal);
    document.getElementById('saveScheduleBtn').addEventListener('click', addScheduleItem);
    
    // Обработчики для модального окна деталей шаблона
    document.getElementById('closeTemplateDetailsModal').addEventListener('click', closeTemplateDetailsModal);
    document.getElementById('closeDetailsBtn').addEventListener('click', closeTemplateDetailsModal);
    document.getElementById('editTemplateBtn').addEventListener('click', openEditTemplateModal);
    document.getElementById('deleteTemplateBtn').addEventListener('click', confirmDeleteTemplate);
    
    // Обработчики для модального окна деталей абонемента
    document.getElementById('closeSubscriptionDetailsModal').addEventListener('click', closeSubscriptionDetailsModal);
    document.getElementById('closeSubDetailsBtn').addEventListener('click', closeSubscriptionDetailsModal);
    document.getElementById('cancelSubscriptionBtn').addEventListener('click', confirmCancelSubscription);
    
    // Закрытие модальных окон при клике вне их области
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
}

// Загрузка тренеров и групп
async function loadCoachesAndGroups() {
    try {
        // Загрузка тренеров
        const coachesResponse = await fetch(API_ENDPOINTS.COACHES);
        if (!coachesResponse.ok) {
            throw new Error('Failed to load coaches');
        }
        coaches = await coachesResponse.json();
        
        // Загрузка групп
        const groupsResponse = await fetch(API_ENDPOINTS.GROUPS);
        if (!groupsResponse.ok) {
            throw new Error('Failed to load groups');
        }
        groups = await groupsResponse.json();
        
        // Обновляем фильтры и выпадающие списки
        populateFilters();
    } catch (error) {
        console.error('Error loading coaches and groups:', error);
        // Для тестирования без сервера
        coaches = MOCK_COACHES;
        groups = MOCK_GROUPS;
        populateFilters();
    }
}

// Загрузка клиентов
async function loadClients() {
    try {
        const response = await fetch(API_ENDPOINTS.CLIENTS);
        if (!response.ok) {
            throw new Error('Failed to load clients');
        }
        clients = await response.json();
        populateClientFilter();
    } catch (error) {
        console.error('Error loading clients:', error);
        // Для тестирования без сервера
        clients = MOCK_CLIENTS;
        populateClientFilter();
    }
}

// Загрузка шаблонов абонементов
async function loadTemplates() {
    try {
        const response = await fetch(API_ENDPOINTS.TEMPLATES);
        if (!response.ok) {
            throw new Error('Failed to load templates');
        }
        templates = await response.json();
        filterAndRenderTemplates();
    } catch (error) {
        console.error('Error loading templates:', error);
        // Для тестирования без сервера
        templates = MOCK_TEMPLATES;
        filterAndRenderTemplates();
    }
}

// Загрузка активных абонементов
async function loadSubscriptions() {
    try {
        const response = await fetch(API_ENDPOINTS.SUBSCRIPTIONS);
        if (!response.ok) {
            throw new Error('Failed to load subscriptions');
        }
        subscriptions = await response.json();
        filterAndRenderSubscriptions();
    } catch (error) {
        console.error('Error loading subscriptions:', error);
        // Для тестирования без сервера
        subscriptions = MOCK_SUBSCRIPTIONS;
        filterAndRenderSubscriptions();
    }
}

// Загрузка деталей конкретного шаблона
async function loadTemplateDetails(templateId) {
    try {
        const response = await fetch(`${API_ENDPOINTS.TEMPLATES}/${templateId}`);
        if (!response.ok) {
            throw new Error('Failed to load template details');
        }
        const template = await response.json();
        openTemplateDetailsModal(template);
    } catch (error) {
        console.error('Error loading template details:', error);
        // Для тестирования без сервера
        const template = templates.find(t => t.id === templateId);
        if (template) {
            openTemplateDetailsModal(template);
        }
    }
}

// Загрузка деталей конкретного абонемента
async function loadSubscriptionDetails(subscriptionId) {
    try {
        const response = await fetch(`${API_ENDPOINTS.SUBSCRIPTIONS}/${subscriptionId}`);
        if (!response.ok) {
            throw new Error('Failed to load subscription details');
        }
        const subscription = await response.json();
        openSubscriptionDetailsModal(subscription);
    } catch (error) {
        console.error('Error loading subscription details:', error);
        // Для тестирования без сервера
        const subscription = subscriptions.find(s => s.id === subscriptionId);
        if (subscription) {
            openSubscriptionDetailsModal(subscription);
        }
    }
}

// Фильтрация и отображение шаблонов
function filterAndRenderTemplates() {
    const searchText = templateSearch.value.toLowerCase();
    const coachId = coachTemplateFilter.value ? parseInt(coachTemplateFilter.value) : null;
    const groupId = groupTemplateFilter.value;
    
    const filteredTemplates = templates.filter(template => {
        // Фильтр по поисковому запросу
        const matchesSearch = searchText === '' || 
                              template.name.toLowerCase().includes(searchText);
        
        // Фильтр по тренеру
        const matchesCoach = coachId === null || 
                            template.coach_id === coachId;
        
        // Фильтр по группе
        let matchesGroup = true;
        if (groupId === 'null') {
            matchesGroup = template.group_id === null;
        } else if (groupId !== '') {
            matchesGroup = template.group_id === parseInt(groupId);
        }
        
        return matchesSearch && matchesCoach && matchesGroup;
    });
    
    renderTemplates(filteredTemplates);
}

// Фильтрация и отображение абонементов
function filterAndRenderSubscriptions() {
    const searchText = subscriptionSearch.value.toLowerCase();
    const clientId = clientFilter.value ? parseInt(clientFilter.value) : null;
    const templateId = templateFilter.value ? parseInt(templateFilter.value) : null;
    const status = statusFilter.value;
    
    const filteredSubscriptions = subscriptions.filter(subscription => {
        // Фильтр по поисковому запросу (ищем в имени клиента и шаблона)
        const matchesSearch = searchText === '' || 
                              subscription.client_name.toLowerCase().includes(searchText) ||
                              subscription.template_name.toLowerCase().includes(searchText);
        
        // Фильтр по клиенту
        const matchesClient = clientId === null || 
                             subscription.client_id === clientId;
        
        // Фильтр по шаблону
        const matchesTemplate = templateId === null || 
                               subscription.template_id === templateId;
        
        // Фильтр по статусу
        const matchesStatus = status === '' || 
                             (status === 'active' && subscription.is_active) || 
                             (status === 'inactive' && !subscription.is_active);
        
        return matchesSearch && matchesClient && matchesTemplate && matchesStatus;
    });
    
    renderSubscriptions(filteredSubscriptions);
}

// Отображение списка шаблонов абонементов
function renderTemplates(templatesData) {
    templatesGrid.innerHTML = '';
    
    if (templatesData.length === 0) {
        templatesGrid.innerHTML = `
            <div class="empty-state">
                <p>Шаблони абонементів не знайдено</p>
            </div>
        `;
        return;
    }
    
    templatesData.forEach(template => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.dataset.id = template.id;
        
        // Находим имя тренера и группы
        const coachName = coaches.find(c => c.id === template.coach_id)?.name || 'Не призначено';
        const groupName = template.group_id ? (groups.find(g => g.id === template.group_id)?.name || 'Група не знайдена') : 'Індивідуальний';
        
        card.innerHTML = `
            <div class="template-header">
                <div class="template-title">${template.name}</div>
            </div>
            <div class="template-details">
                <div class="detail-item">
                    <div class="detail-label">Ціна:</div>
                    <div class="detail-value">${template.price} ₴</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Кількість занять:</div>
                    <div class="detail-value">${template.total_lessons}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Тренер:</div>
                    <div class="detail-value">${coachName}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Тип:</div>
                    <div class="detail-value">${groupName}</div>
                </div>
            </div>
            <div class="template-actions">
                <button class="action-button view-details" data-id="${template.id}">Деталі</button>
                <button class="action-button edit-template" data-id="${template.id}">Редагувати</button>
            </div>
        `;
        
        templatesGrid.appendChild(card);
        
        // Добавляем обработчики событий для кнопок
        card.querySelector('.view-details').addEventListener('click', function(e) {
            e.stopPropagation();
            loadTemplateDetails(parseInt(this.dataset.id));
        });
        
        card.querySelector('.edit-template').addEventListener('click', function(e) {
            e.stopPropagation();
            const templateId = parseInt(this.dataset.id);
            const template = templates.find(t => t.id === templateId);
            if (template) {
                openEditTemplateModal(template);
            }
        });
        
        // Обработчик клика на карточку
        card.addEventListener('click', function() {
            loadTemplateDetails(parseInt(this.dataset.id));
        });
    });
}

// Отображение списка активных абонементов
function renderSubscriptions(subscriptionsData) {
    subscriptionsGrid.innerHTML = '';
    
    if (subscriptionsData.length === 0) {
        subscriptionsGrid.innerHTML = `
            <div class="empty-state">
                <p>Активні абонементи не знайдено</p>
            </div>
        `;
        return;
    }
    
    subscriptionsData.forEach(subscription => {
        const card = document.createElement('div');
        card.className = 'subscription-card';
        card.dataset.id = subscription.id;
        
        // Вычисляем процент использованных занятий
        const totalLessons = subscription.total_lessons;
        const usedLessons = subscription.used_lessons;
        const progressPercent = Math.round((usedLessons / totalLessons) * 100);
        
        // Получаем инициалы клиента
        const nameParts = subscription.client_name.split(' ');
        const initials = nameParts.length > 1 
            ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() 
            : (nameParts[0][0] + (nameParts[0][1] || '')).toUpperCase();
        
        card.innerHTML = `
            <div class="subscription-header">
                <div>
                    <div class="subscription-client">
                        <div class="client-avatar">${initials}</div>
                        <div>${subscription.client_name}</div>
                    </div>
                    <div class="subscription-template">${subscription.template_name}</div>
                </div>
                <div class="subscription-status ${subscription.is_active ? 'status-active' : 'status-inactive'}">
                    ${subscription.is_active ? 'Активний' : 'Неактивний'}
                </div>
            </div>
            <div class="subscription-body">
                <div class="detail-item">
                    <div class="detail-label">Термін дії:</div>
                    <div class="detail-value">до ${formatDate(subscription.valid_until)}</div>
                </div>
                <div class="subscription-progress">
                    <div class="progress-label">
                        <span>Використано занять</span>
                        <span>${usedLessons} з ${totalLessons}</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${progressPercent}%;"></div>
                    </div>
                </div>
            </div>
            <div class="subscription-actions">
                <button class="action-button view-subscription" data-id="${subscription.id}">Деталі</button>
                ${subscription.is_active ? `<button class="action-button action-button-cancel" data-id="${subscription.id}">Анулювати</button>` : ''}
            </div>
        `;
        
        subscriptionsGrid.appendChild(card);
        
        // Добавляем обработчики событий для кнопок
        card.querySelector('.view-subscription').addEventListener('click', function(e) {
            e.stopPropagation();
            loadSubscriptionDetails(parseInt(this.dataset.id));
        });
        
        const cancelButton = card.querySelector('.action-button-cancel');
        if (cancelButton) {
            cancelButton.addEventListener('click', function(e) {
                e.stopPropagation();
                confirmCancelSubscription(parseInt(this.dataset.id));
            });
        }
        
        // Обработчик клика на карточку
        card.addEventListener('click', function() {
            loadSubscriptionDetails(parseInt(this.dataset.id));
        });
    });
}

// Заполнение выпадающих списков фильтров
function populateFilters() {
    // Заполнение фильтра тренеров для шаблонов
    coachTemplateFilter.innerHTML = '<option value="">Всі тренери</option>';
    coaches.forEach(coach => {
        const option = document.createElement('option');
        option.value = coach.id;
        option.textContent = coach.name;
        coachTemplateFilter.appendChild(option);
    });
    
    // Заполнение фильтра групп для шаблонов
    groupTemplateFilter.innerHTML = '<option value="">Всі типи</option><option value="null">Індивідуальні</option>';
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        groupTemplateFilter.appendChild(option);
    });
    
    // Заполнение выпадающих списков в модальном окне шаблона
    const templateCoach = document.getElementById('templateCoach');
    templateCoach.innerHTML = '<option value="">Оберіть тренера</option>';
    coaches.forEach(coach => {
        const option = document.createElement('option');
        option.value = coach.id;
        option.textContent = coach.name;
        templateCoach.appendChild(option);
    });
    
    const templateGroup = document.getElementById('templateGroup');
    templateGroup.innerHTML = '<option value="">Без групи (індивідуальний)</option>';
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        templateGroup.appendChild(option);
    });
    
    // Заполнение фильтра шаблонов для абонементов
    templateFilter.innerHTML = '<option value="">Всі шаблони</option>';
    templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        templateFilter.appendChild(option);
    });
}

// Заполнение фильтра клиентов
function populateClientFilter() {
    clientFilter.innerHTML = '<option value="">Всі клієнти</option>';
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        clientFilter.appendChild(option);
    });
}

// Переключение отображения секции расписания
function toggleScheduleSection() {
    const groupId = document.getElementById('templateGroup').value;
    const scheduleSection = document.getElementById('scheduleSection');
    
    if (groupId) {
        scheduleSection.style.display = 'block';
    } else {
        scheduleSection.style.display = 'none';
    }
}

// Открытие модального окна создания шаблона
function openCreateTemplateModal() {
    document.getElementById('templateModalTitle').textContent = 'Створення шаблону абонемента';
    document.getElementById('templateId').value = '';
    document.getElementById('templateForm').reset();
    
    // Устанавливаем значения по умолчанию
    document.getElementById('templateLessons').value = '8';
    document.getElementById('templateValidity').value = '30';
    
    // Очищаем список расписаний
    schedules = [];
    document.getElementById('schedulesList').innerHTML = '';
    document.getElementById('scheduleSection').style.display = 'none';
    
    templateModal.classList.add('active');
}

// Закрытие модального окна шаблона
function closeTemplateModal() {
    templateModal.classList.remove('active');
    document.getElementById('templateForm').reset();
}

// Открытие модального окна редактирования шаблона
function openEditTemplateModal(template) {
    document.getElementById('templateModalTitle').textContent = `Редагування шаблону "${template.name}"`;
    document.getElementById('templateId').value = template.id;
    document.getElementById('templateName').value = template.name;
    document.getElementById('templatePrice').value = template.price;
    document.getElementById('templateLessons').value = template.total_lessons;
    document.getElementById('templateValidity').value = template.valid_days;
    document.getElementById('templateCoach').value = template.coach_id;
    document.getElementById('templateGroup').value = template.group_id || '';
    document.getElementById('templateDescription').value = template.description || '';
    
    // Загружаем расписания для шаблона
    schedules = template.schedules || [];
    renderSchedulesList();
    
    // Отображаем секцию расписания если выбрана группа
    toggleScheduleSection();
    
    closeTemplateDetailsModal();
    templateModal.classList.add('active');
}

// Сохранение шаблона
async function saveTemplate() {
    const templateForm = document.getElementById('templateForm');
    
    if (!templateForm.checkValidity()) {
        alert('Будь ласка, заповніть всі обов\'язкові поля');
        return;
    }
    
    const templateId = document.getElementById('templateId').value;
    const templateData = {
        name: document.getElementById('templateName').value,
        price: parseFloat(document.getElementById('templatePrice').value),
        total_lessons: parseInt(document.getElementById('templateLessons').value),
        valid_days: parseInt(document.getElementById('templateValidity').value),
        coach_id: parseInt(document.getElementById('templateCoach').value),
        group_id: document.getElementById('templateGroup').value ? parseInt(document.getElementById('templateGroup').value) : null,
        description: document.getElementById('templateDescription').value || '',
        schedules: schedules
    };
    
    try {
        let response;
        
        if (templateId) {
            // Обновление существующего шаблона
            response = await fetch(`${API_ENDPOINTS.TEMPLATES}/${templateId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(templateData),
            });
        } else {
            // Создание нового шаблона
            response = await fetch(API_ENDPOINTS.TEMPLATES, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(templateData),
            });
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка при сохранении шаблона');
        }
        
        // Перезагружаем список шаблонов
        await loadTemplates();
        closeTemplateModal();
    } catch (error) {
        console.error('Error saving template:', error);
        alert(`Помилка при збереженні шаблону: ${error.message}`);
    }
}

// Открытие модального окна добавления расписания
function openScheduleModal() {
    document.getElementById('scheduleForm').reset();
    
    // Устанавливаем значения по умолчанию
    const now = new Date();
    document.getElementById('startTime').value = `${String(now.getHours()).padStart(2, '0')}:00`;
    document.getElementById('endTime').value = `${String(now.getHours() + 1).padStart(2, '0')}:30`;
    
    scheduleModal.classList.add('active');
}

// Закрытие модального окна расписания
function closeScheduleModal() {
    scheduleModal.classList.remove('active');
    document.getElementById('scheduleForm').reset();
}

// Добавление элемента расписания
function addScheduleItem() {
    const scheduleForm = document.getElementById('scheduleForm');
    
    if (!scheduleForm.checkValidity()) {
        alert('Будь ласка, заповніть всі обов\'язкові поля');
        return;
    }
    
    const dayOfWeek = parseInt(document.getElementById('dayOfWeek').value);
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    
    // Добавляем новый элемент расписания
    const newSchedule = {
        id: Date.now(), // Временный ID
        day_of_the_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime
    };
    
    schedules.push(newSchedule);
    renderSchedulesList();
    closeScheduleModal();
}

// Отображение списка расписаний
function renderSchedulesList() {
    const schedulesList = document.getElementById('schedulesList');
    schedulesList.innerHTML = '';
    
    if (schedules.length === 0) {
        schedulesList.innerHTML = '<p>Розклад не додано</p>';
        return;
    }
    
    schedules.forEach(schedule => {
        const dayNames = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'];
        const dayName = dayNames[schedule.day_of_the_week];
        
        const scheduleItem = document.createElement('div');
        scheduleItem.className = 'schedule-item';
        scheduleItem.innerHTML = `
            <div class="schedule-info">
                <div class="schedule-day">${dayName}</div>
                <div class="schedule-time">${schedule.start_time} - ${schedule.end_time}</div>
            </div>
            <div class="schedule-actions">
                <button type="button" class="remove-schedule" data-id="${schedule.id}">&times;</button>
            </div>
        `;
        
        schedulesList.appendChild(scheduleItem);
    });
    
    // Добавляем обработчики для кнопок удаления
    document.querySelectorAll('.remove-schedule').forEach(button => {
        button.addEventListener('click', function() {
            const scheduleId = parseInt(this.dataset.id);
            schedules = schedules.filter(s => s.id !== scheduleId);
            renderSchedulesList();
        });
    });
}

// Открытие модального окна деталей шаблона
function openTemplateDetailsModal(template) {
    document.getElementById('templateDetailsTitle').textContent = template.name;
    document.getElementById('detailTemplateName').textContent = template.name;
    document.getElementById('detailTemplatePrice').textContent = `${template.price} ₴`;
    document.getElementById('detailTemplateLessons').textContent = template.total_lessons;
    document.getElementById('detailTemplateValidity').textContent = `${template.valid_days} днів`;
    
    // Сохраняем ID шаблона для удаления
    document.getElementById('detailTemplateName').dataset.id = template.id;
    
    // Находим имя тренера и группы
    const coachName = coaches.find(c => c.id === template.coach_id)?.name || 'Не призначено';
    const groupName = template.group_id ? (groups.find(g => g.id === template.group_id)?.name || 'Група не знайдена') : 'Індивідуальний';
    
    document.getElementById('detailTemplateCoach').textContent = coachName;
    document.getElementById('detailTemplateGroup').textContent = groupName;
    document.getElementById('detailTemplateDescription').textContent = template.description || 'Опис відсутній';
    
    // Отображаем расписание
    const schedulesList = document.getElementById('detailSchedulesList');
    schedulesList.innerHTML = '';
    
    if (!template.schedules || template.schedules.length === 0) {
        schedulesList.innerHTML = '<p>Розклад не додано</p>';
    } else {
        const dayNames = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'];
        
        template.schedules.forEach(schedule => {
            const dayName = dayNames[schedule.day_of_the_week];
            const scheduleItem = document.createElement('div');
            scheduleItem.className = 'schedule-item';
            scheduleItem.innerHTML = `
                <div class="schedule-info">
                    <div class="schedule-day">${dayName}</div>
                    <div class="schedule-time">${schedule.start_time.substring(0, 5)} - ${schedule.end_time.substring(0, 5)}</div>
                </div>
            `;
            schedulesList.appendChild(scheduleItem);
        });
    }
    
    templateDetailsModal.classList.add('active');
}

// Закрытие модального окна деталей шаблона
function closeTemplateDetailsModal() {
    templateDetailsModal.classList.remove('active');
}

// Подтверждение удаления шаблона
async function confirmDeleteTemplate() {
    const templateId = parseInt(document.getElementById('detailTemplateName').dataset.id);
    const templateName = document.getElementById('detailTemplateName').textContent;
    
    if (confirm(`Ви впевнені, що хочете видалити шаблон "${templateName}"?`)) {
        try {
            const response = await fetch(`${API_ENDPOINTS.TEMPLATES}/${templateId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка при удалении шаблона');
            }
            
            // Перезагружаем список шаблонов
            await loadTemplates();
            closeTemplateDetailsModal();
        } catch (error) {
            console.error('Error deleting template:', error);
            alert(`Помилка при видаленні шаблону: ${error.message}`);
        }
    }
}

// Открытие модального окна деталей абонемента
function openSubscriptionDetailsModal(subscription) {
    document.getElementById('subscriptionDetailsTitle').textContent = `Абонемент клієнта ${subscription.client_name}`;
    document.getElementById('detailSubscriptionClient').textContent = subscription.client_name;
    document.getElementById('detailSubscriptionTemplate').textContent = subscription.template_name;
    
    const statusClass = subscription.is_active ? 'status-active' : 'status-inactive';
    const statusText = subscription.is_active ? 'Активний' : 'Неактивний';
    document.getElementById('detailSubscriptionStatus').innerHTML = `
        <span class="subscription-status ${statusClass}">${statusText}</span>
    `;
    
    document.getElementById('detailSubscriptionPrice').textContent = `${subscription.price} ₴`;
    document.getElementById('detailSubscriptionUsed').textContent = `${subscription.used_lessons} з ${subscription.total_lessons}`;
    document.getElementById('detailSubscriptionValidity').textContent = formatDate(subscription.valid_until);
    
    // Отображаем список занятий
    const lessonsList = document.getElementById('detailLessonsList');
    lessonsList.innerHTML = '';
    
    if (!subscription.lessons || subscription.lessons.length === 0) {
        lessonsList.innerHTML = '<p>Заняття не знайдено</p>';
    } else {
        subscription.lessons.forEach(lesson => {
            let statusClass = 'scheduled';
            let statusText = 'Заплановано';
            
            if (lesson.is_cancelled) {
                statusClass = 'cancelled';
                statusText = 'Скасовано';
            } else if (new Date(lesson.date) < new Date()) {
                statusClass = 'completed';
                statusText = 'Проведено';
            }
            
            const lessonItem = document.createElement('div');
            lessonItem.className = 'lesson-item';
            lessonItem.innerHTML = `
                <div class="lesson-info">
                    <div class="lesson-date">${formatDate(lesson.date)}</div>
                    <div class="lesson-time">${lesson.start_time.substring(0, 5)} - ${lesson.end_time.substring(0, 5)}</div>
                </div>
                <div class="lesson-status ${statusClass}">${statusText}</div>
            `;
            lessonsList.appendChild(lessonItem);
        });
    }
    
    // Отображаем расписание
    const schedulesList = document.getElementById('detailSubscriptionSchedules');
    schedulesList.innerHTML = '';
    
    if (!subscription.schedules || subscription.schedules.length === 0) {
        schedulesList.innerHTML = '<p>Розклад не додано</p>';
    } else {
        const dayNames = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'];
        
        subscription.schedules.forEach(schedule => {
            const dayName = dayNames[schedule.day_of_the_week];
            const scheduleItem = document.createElement('div');
            scheduleItem.className = 'schedule-item';
            scheduleItem.innerHTML = `
                <div class="schedule-info">
                    <div class="schedule-day">${dayName}</div>
                    <div class="schedule-time">${schedule.start_time.substring(0, 5)} - ${schedule.end_time.substring(0, 5)}</div>
                </div>
            `;
            schedulesList.appendChild(scheduleItem);
        });
    }
    
    // Состояние кнопки "Анулювати"
    const cancelButton = document.getElementById('cancelSubscriptionBtn');
    if (subscription.is_active) {
        cancelButton.style.display = 'block';
        cancelButton.dataset.id = subscription.id;
    } else {
        cancelButton.style.display = 'none';
    }
    
    subscriptionDetailsModal.classList.add('active');
}

// Закрытие модального окна деталей абонемента
function closeSubscriptionDetailsModal() {
    subscriptionDetailsModal.classList.remove('active');
}

// Подтверждение аннулирования абонемента
async function confirmCancelSubscription(subscriptionId) {
    // Если передан ID в параметре, используем его, иначе берем из data-id кнопки
    if (!subscriptionId) {
        subscriptionId = parseInt(document.getElementById('cancelSubscriptionBtn').dataset.id);
    }
    
    if (confirm(`Ви впевнені, що хочете анулювати цей абонемент?`)) {
        try {
            const response = await fetch(`${API_ENDPOINTS.SUBSCRIPTIONS}/${subscriptionId}/cancel`, {
                method: 'POST',
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка при аннулировании абонемента');
            }
            
            // Перезагружаем список абонементов
            await loadSubscriptions();
            closeSubscriptionDetailsModal();
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            alert(`Помилка при анулюванні абонемента: ${error.message}`);
        }
    }
}

// Вспомогательная функция для форматирования даты
function formatDate(dateString) {
    if (!dateString) return '—';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA');
    } catch (error) {
        console.error('Ошибка форматирования даты:', error);
        return dateString;
    }
}

// Мок-данные для тестирования
const MOCK_COACHES = [
    { id: 1, name: "Олена Петренко" },
    { id: 2, name: "Іван Сидоренко" },
    { id: 3, name: "Анна Ковальчук" }
];

const MOCK_GROUPS = [
    { id: 1, name: "Початківці" },
    { id: 2, name: "Середній рівень" },
    { id: 3, name: "Продвинуті" }
];

const MOCK_CLIENTS = [
    { id: 1, name: "Марія Коваленко" },
    { id: 2, name: "Олександр Мельник" },
    { id: 3, name: "Наталія Шевченко" }
];

// Пример данных шаблонов абонементов
const MOCK_TEMPLATES = [
    {
        id: 1,
        name: "Базовий абонемент",
        price: 1200,
        total_lessons: 8,
        valid_days: 30,
        coach_id: 1,
        group_id: 1,
        description: "Базовий абонемент для початківців, включає 8 групових занять протягом місяця.",
        schedules: [
            { id: 1, day_of_the_week: 1, start_time: "18:00:00", end_time: "19:30:00" },
            { id: 2, day_of_the_week: 3, start_time: "18:00:00", end_time: "19:30:00" }
        ]
    },
    {
        id: 2,
        name: "Індивідуальний абонемент",
        price: 2500,
        total_lessons: 5,
        valid_days: 45,
        coach_id: 2,
        group_id: null,
        description: "Індивідуальні заняття з тренером, 5 занять протягом півтора місяця.",
        schedules: []
    },
    {
        id: 3,
        name: "Преміум абонемент",
        price: 3000,
        total_lessons: 12,
        valid_days: 45,
        coach_id: 3,
        group_id: 3,
        description: "Розширений абонемент для просунутих клієнтів, включає 12 занять протягом півтора місяця.",
        schedules: [
            { id: 3, day_of_the_week: 0, start_time: "17:00:00", end_time: "18:30:00" },
            { id: 4, day_of_the_week: 2, start_time: "17:00:00", end_time: "18:30:00" },
            { id: 5, day_of_the_week: 4, start_time: "17:00:00", end_time: "18:30:00" }
        ]
    }
];

// Пример данных абонементов
const MOCK_SUBSCRIPTIONS = [
    {
        id: 1,
        client_id: 1,
        client_name: "Марія Коваленко",
        template_id: 1,
        template_name: "Базовий абонемент",
        is_active: true,
        price: 1200,
        total_lessons: 8,
        used_lessons: 3,
        valid_until: "2025-06-15",
        lessons: [
            { id: 1, date: "2025-05-10", start_time: "18:00:00", end_time: "19:30:00", is_cancelled: false },
            { id: 2, date: "2025-05-12", start_time: "18:00:00", end_time: "19:30:00", is_cancelled: false },
            { id: 3, date: "2025-05-14", start_time: "18:00:00", end_time: "19:30:00", is_cancelled: false },
            { id: 4, date: "2025-05-17", start_time: "18:00:00", end_time: "19:30:00", is_cancelled: false },
            { id: 5, date: "2025-05-19", start_time: "18:00:00", end_time: "19:30:00", is_cancelled: false }
        ],
        schedules: [
            { id: 1, day_of_the_week: 1, start_time: "18:00:00", end_time: "19:30:00" },
            { id: 2, day_of_the_week: 3, start_time: "18:00:00", end_time: "19:30:00" }
        ]
    },
    {
        id: 2,
        client_id: 2,
        client_name: "Олександр Мельник",
        template_id: 2,
        template_name: "Індивідуальний абонемент",
        is_active: true,
        price: 2500,
        total_lessons: 5,
        used_lessons: 1,
        valid_until: "2025-06-30",
        lessons: [
            { id: 6, date: "2025-05-11", start_time: "10:00:00", end_time: "11:30:00", is_cancelled: false },
            { id: 7, date: "2025-05-18", start_time: "10:00:00", end_time: "11:30:00", is_cancelled: false },
            { id: 8, date: "2025-05-25", start_time: "10:00:00", end_time: "11:30:00", is_cancelled: false }
        ],
        schedules: []
    },
    {
        id: 3,
        client_id: 3,
        client_name: "Наталія Шевченко",
        template_id: 3,
        template_name: "Преміум абонемент",
        is_active: false,
        price: 3000,
        total_lessons: 12,
        used_lessons: 12,
        valid_until: "2025-05-01",
        lessons: [],
        schedules: [
            { id: 3, day_of_the_week: 0, start_time: "17:00:00", end_time: "18:30:00" },
            { id: 4, day_of_the_week: 2, start_time: "17:00:00", end_time: "18:30:00" },
            { id: 5, day_of_the_week: 4, start_time: "17:00:00", end_time: "18:30:00" }
        ]
    }
];