// Переменные для хранения данных
let groups = [];
let filteredGroups = [];
let currentGroup = null;
let availableClients = [];
let coaches = [];
let lessons = [];

// DOM-элементы
const groupsGrid = document.getElementById('groupsGrid');
const groupSearch = document.getElementById('groupSearch');
const coachFilter = document.getElementById('coachFilter');
const statusFilter = document.getElementById('statusFilter');
const createGroupBtn = document.getElementById('createGroupBtn');

// Модальные окна
const groupModal = document.getElementById('groupModal');
const groupDetailsModal = document.getElementById('groupDetailsModal');
const addMemberModal = document.getElementById('addMemberModal');
const addLessonModal = document.getElementById('addLessonModal');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация WebSocket соединения (если используется)
    initializeWebSocket();
    
    // Загрузка данных
    console.log(27)

    
    // Инициализация обработчиков событий
    initializeEventHandlers();
});

// Инициализация WebSocket соединения
function initializeWebSocket() {
    if (!window.ws || window.ws.readyState !== WebSocket.OPEN) {
        try {
            window.ws = new WebSocket('ws://localhost:8000/socket/');
            
            window.ws.onopen = function() {
                console.log('WebSocket соединение установлено');
                loadGroups();
                console.log(29);
                loadCoaches();
            };
            
            window.ws.onmessage = function(event) {
                console.log('Получены данные:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    processWebSocketMessage(data);
                } catch (error) {
                    console.error('Ошибка при обработке данных WebSocket:', error);
                }
            };
            
            window.ws.onerror = function(error) {
                console.error('WebSocket ошибка:', error);
                simulateGroupsData();
            };
            
            window.ws.onclose = function() {
                console.log('WebSocket соединение закрыто');
            };
        } catch (error) {
            console.error('Ошибка создания WebSocket:', error);
            simulateGroupsData();
        }
    }
}

// Инициализация обработчиков событий
function initializeEventHandlers() {
    // Поиск и фильтрация
    groupSearch.addEventListener('input', filterAndRenderGroups);
    coachFilter.addEventListener('change', filterAndRenderGroups);
    statusFilter.addEventListener('change', filterAndRenderGroups);
    
    // Кнопка создания группы
    createGroupBtn.addEventListener('click', openCreateGroupModal);
    
    // Обработчики для модального окна группы
    document.getElementById('closeGroupModal').addEventListener('click', closeGroupModal);
    document.getElementById('cancelGroupBtn').addEventListener('click', closeGroupModal);
    document.getElementById('saveGroupBtn').addEventListener('click', saveGroup);
    
    // Обработчики для модального окна деталей группы
    document.getElementById('closeGroupDetailsModal').addEventListener('click', closeGroupDetailsModal);
    document.getElementById('closeDetailsBtn').addEventListener('click', closeGroupDetailsModal);
    document.getElementById('editGroupBtn').addEventListener('click', openEditGroupModal);
    document.getElementById('deleteGroupBtn').addEventListener('click', confirmDeleteGroup);
    
    // Обработчики для модального окна добавления участника
    document.getElementById('addMemberBtn').addEventListener('click', openAddMemberModal);
    document.getElementById('closeAddMemberModal').addEventListener('click', closeAddMemberModal);
    document.getElementById('cancelAddMemberBtn').addEventListener('click', closeAddMemberModal);
    document.getElementById('saveAddMemberBtn').addEventListener('click', addMemberToGroup);
    
    // Обработчики для модального окна добавления занятия
    document.getElementById('addLessonBtn').addEventListener('click', openAddLessonModal);
    document.getElementById('closeAddLessonModal').addEventListener('click', closeAddLessonModal);
    document.getElementById('cancelAddLessonBtn').addEventListener('click', closeAddLessonModal);
    document.getElementById('saveAddLessonBtn').addEventListener('click', addLessonToGroup);
    
    // Обработчики вкладок в деталях группы
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Активация кнопки
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Активация панели
            const tabPanels = document.querySelectorAll('.tab-panel');
            tabPanels.forEach(panel => panel.classList.remove('active'));
            document.getElementById(`${tabId}-panel`).classList.add('active');
        });
    });
    
    // Фильтры для занятий
    const lessonFilters = document.querySelectorAll('input[name="lessons-filter"]');
    lessonFilters.forEach(filter => {
        filter.addEventListener('change', function() {
            if (currentGroup) {
                const filterValue = this.value;
                renderGroupLessons(lessons || [], filterValue);
            }
        });
    });
    
    // Закрытие модальных окон при клике вне их области
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
}

// Загрузка данных о группах
function loadGroups() {
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        window.ws.send(JSON.stringify({
            code: GROUP_API_CODES.GET_GROUPS
        }));
    } else {
        simulateGroupsData();
    }
}

// Загрузка данных о тренерах
function loadCoaches() {
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        window.ws.send(JSON.stringify({
            code: 305 // Предполагаемый код для получения тренеров
        }));
    } else {
        coaches = MOCK_COACHES;
        populateCoachFilter();
    }
}

// Загрузка доступных клиентов
function loadAvailableClients() {
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        window.ws.send(JSON.stringify({
            code: GROUP_API_CODES.GET_CLIENTS_DATA
        }));
    } else {
        populateClientDropdown(MOCK_AVAILABLE_CLIENTS);
    }
}

// Заполнение выпадающего списка клиентов
function populateClientDropdown(clients) {
    availableClients = clients;
    
    if (!currentGroup) return;
    
    // Заполнение списка доступных клиентов
    const memberSelect = document.getElementById('memberSelect');
    memberSelect.innerHTML = '<option value="">Оберіть клієнта</option>';
    
    // Фильтрация клиентов, исключая тех, кто уже в группе
    const currentMemberIds = (currentGroup.members || []).map(m => m.id);
    const filteredClients = availableClients.filter(
        client => !currentMemberIds.includes(client.id)
    );
    
    filteredClients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        memberSelect.appendChild(option);
    });
}

// Загрузка деталей о группе
function loadGroupDetails(groupId) {
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        window.ws.send(JSON.stringify({
            code: GROUP_API_CODES.GET_GROUP_DETAILS,
            id: groupId
        }));
    } else {
        const group = groups.find(g => g.id === groupId);
        if (group) {
            currentGroup = group;
            openGroupDetailsModal(group);
        }
    }
}

function openGroupDetailsModal(group) {
    currentGroup = group;
    
    // Заполнение информации о группе
    document.getElementById('groupDetailsTitle').textContent = group.name;
    document.getElementById('detailGroupName').textContent = group.name;
    document.getElementById('detailGroupCoach').textContent = group.coach_name;
    document.getElementById('detailGroupStatus').textContent = group.status ? 'Активна' : 'Неактивна';
    document.getElementById('detailGroupStatus').className = group.status ? 'detail-value status-active' : 'detail-value status-inactive';
    document.getElementById('detailGroupMembers').textContent = group.members_count;
    document.getElementById('detailGroupDescription').textContent = group.description || 'Опис відсутній';
    
    // Отображение участников группы
    renderGroupMembers(group.members || []);
    
    // Отображение занятий группы
    renderGroupLessons(lessons || [], 'all');
    
    // Активация первой вкладки
    document.querySelector('.tab-button[data-tab="members"]').click();
    
    groupDetailsModal.classList.add('active');
}

// Обработка сообщений от WebSocket
function processWebSocketMessage(data) {
    switch(data.code) {
        case GROUP_API_CODES.GROUPS_DATA:
            groups = data.data;
            filterAndRenderGroups();
            break;
            
        case GROUP_API_CODES.GROUP_DETAILS:
            currentGroup = data.data;
            openGroupDetailsModal(currentGroup);
            break;  
            
        case GROUP_API_CODES.CLIENTS_DATA:
            // Обработка полученных данных о клиентах
            populateClientDropdown(data.data);
            break;
            
        case GROUP_API_CODES.GROUP_MEMBERS:
            if (currentGroup) {
                currentGroup.members = data.data;
                renderGroupMembers(currentGroup.members);
            }
            break;
            
        case GROUP_API_CODES.GROUP_LESSONS:
            if (currentGroup) {
                lessons = data.data
                renderGroupLessons(data.data, 'all');
            }
            break;
            

        case GROUP_API_CODES.COACH_DETAILS:
            // Обработка полученных данных о тренере
            console.log("Received coach list:", data.data);
            coaches = data.data;
            populateCoachFilter();
            
            // If we're editing a group, update the coach selection
            if (currentGroup && document.getElementById('groupForm').contains(document.getElementById('groupCoach'))) {
                updateGroupCoachSelection(currentGroup.coach_id);
            }
            break;
            
        default:
            console.log('Неизвестный код сообщения:', data.code);
    }
}

function updateGroupCoachSelection(coachId) {
    if (!coachId) return;
    
    const coachSelect = document.getElementById('groupCoach');
    if (!coachSelect) return;
    
    coachSelect.value = coachId.toString();
}
// Фильтрация групп и обновление отображения
function filterAndRenderGroups() {
    const searchText = groupSearch.value.toLowerCase();
    const coachId = coachFilter.value ? parseInt(coachFilter.value) : null;
    const status = statusFilter.value;
    
    filteredGroups = groups.filter(group => {
        // Фильтр по поисковому запросу
        const matchesSearch = searchText === '' || 
                              group.name.toLowerCase().includes(searchText);
        
        // Фильтр по тренеру
        const matchesCoach = coachId === null || 
                            group.coach_id === coachId;
        
        // Фильтр по статусу
        const matchesStatus = status === '' || 
                              (status === 'active' && group.status) || 
                              (status === 'inactive' && !group.status);
        
        return matchesSearch && matchesCoach && matchesStatus;
    });
    
    renderGroups();
}

// Отображение групп
function renderGroups() {
    groupsGrid.innerHTML = '';
    
    if (filteredGroups.length === 0) {
        groupsGrid.innerHTML = `
            <div class="empty-state">
                <p>Груп не знайдено</p>
            </div>
        `;
        return;
    }
    
    filteredGroups.forEach(group => {
        const card = document.createElement('div');
        card.className = 'group-card';
        card.dataset.id = group.id;
        
        card.innerHTML = `
            <div class="group-header">
                <div class="group-title">${group.name}</div>
                <div class="group-status ${group.status ? 'active' : 'inactive'}">
                    ${group.status ? 'Активна' : 'Неактивна'}
                </div>
            </div>
            <div class="group-details">
                <div class="detail-item">
                    <div class="detail-label">Тренер:</div>
                    <div class="detail-value">${group.coach_name}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Учасників:</div>
                    <div class="detail-value">${group.members_count}</div>
                </div>
            </div>
            <div class="group-actions">
                <button class="action-button view-details" data-id="${group.id}">Деталі</button>
            </div>
        `;
        
        groupsGrid.appendChild(card);
        
        // Обработчик клика на карточку
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('action-button')) {
                loadGroupDetails(parseInt(this.dataset.id));
            }
        });
        
        // Обработчик клика на кнопку деталей
        card.querySelector('.view-details').addEventListener('click', function(e) {
            e.stopPropagation();
            loadGroupDetails(parseInt(this.dataset.id));
        });
    });
}

// Заполнение фильтра тренеров
function populateCoachFilter() {
    coachFilter.innerHTML = '<option value="">Всі тренери</option>';
    
    coaches.forEach(coach => {
        const option = document.createElement('option');
        option.value = coach.id;
        option.textContent = coach.name;
        coachFilter.appendChild(option);
    });
}

// Открытие модального окна создания группы
function openCreateGroupModal() {
    document.getElementById('groupModalTitle').textContent = 'Створення нової групи';
    document.getElementById('groupId').value = '';
    document.getElementById('groupForm').reset();
    
    // Заполнение списка тренеров
    const coachSelect = document.getElementById('groupCoach');
    coachSelect.innerHTML = '<option value="">Оберіть тренера</option>';
    
    coaches.forEach(coach => {
        const option = document.createElement('option');
        option.value = coach.id;
        option.textContent = coach.name;
        coachSelect.appendChild(option);
    });
    
    groupModal.classList.add('active');
}


function processCoachDetails(coachData) {
    // Сохраняем данные тренера для использования при заполнении формы
    const currentCoach = coachData;
    
    // Заполняем список тренеров и выбираем нужного тренера
    const coachSelect = document.getElementById('groupCoach');
    
    // Проверяем, есть ли этот тренер уже в списке
    let coachExists = false;
    for (let i = 0; i < coachSelect.options.length; i++) {
        if (parseInt(coachSelect.options[i].value) === currentCoach.id) {
            coachSelect.selectedIndex = i;
            coachExists = true;
            break;
        }
    }
    
    // Если тренера нет в списке, добавляем его
    if (!coachExists) {
        const option = document.createElement('option');
        option.value = currentCoach.id;
        option.textContent = currentCoach.name;
        coachSelect.appendChild(option);
        coachSelect.value = currentCoach.id.toString();
    }
}



function loadCoaches() {
    console.log("Loading coaches...");
        console.log("Sending request for coaches list");
        window.ws.send(JSON.stringify({
            code: GROUP_API_CODES.GET_COACHES
    }));
    // } else {
    //     console.log("Using mock coaches data");
    //     coaches = MOCK_COACHES;
    //     populateCoachFilter();
    // }
}
function openEditGroupModal() {
    const group = currentGroup;
    
    console.log("Opening edit modal for group:", group);
    
    if (!group) {
        console.error('Группа для редактирования не найдена');
        return;
    }
    
    document.getElementById('groupModalTitle').textContent = `Редагування групи "${group.name}"`;
    document.getElementById('groupId').value = group.id;
    document.getElementById('groupName').value = group.name;
    document.getElementById('groupStatus').value = group.status ? '1' : '0';
    document.getElementById('groupDescription').value = group.description || '';
    
    // Заполнение списка тренеров
    const coachSelect = document.getElementById('groupCoach');
    
    // Добавляем всех доступных тренеров
// Сначала очищаем селект
coachSelect.innerHTML = '';

// Добавляем все опции
coaches.forEach(coach => {
    const option = document.createElement('option');
    option.value = coach.id;
    option.textContent = coach.name;
    
    // Указываем selected для нужного тренера
    if (coach.name === group.coach_name) {
        option.selected = true;
        console.log("Установлен выбранный тренер:", coach);
    }
    
    coachSelect.appendChild(option);
});

    // Если у группы есть тренер, устанавливаем его значение в селекте
    if (group.coach_id) {
        console.log("Group has coach_id:", group.coach_id, "- setting selection");
        coachSelect.value = group.coach_id.toString();
    }
    
    closeGroupDetailsModal();
    groupModal.classList.add('active');
}

// Закрытие модального окна группы
function closeGroupModal() {
    groupModal.classList.remove('active');
    document.getElementById('groupForm').reset();
}

// Сохранение группы
function saveGroup() {
    const groupForm = document.getElementById('groupForm');
    
    if (!groupForm.checkValidity()) {
        alert('Будь ласка, заповніть всі обов\'язкові поля');
        return;
    }
    
    const groupId = document.getElementById('groupId').value;
    const name = document.getElementById('groupName').value;
    const coachId = parseInt(document.getElementById('groupCoach').value);
    const coachName = document.getElementById('groupCoach').options[document.getElementById('groupCoach').selectedIndex].textContent;
    const status = document.getElementById('groupStatus').value === '1';
    const description = document.getElementById('groupDescription').value || '';
    
    const groupData = {
        id: groupId ? parseInt(groupId) : null,
        name: name,
        coach_id: coachId,
        coach_name: coachName,
        status: status,
        description: description,
        members_count: groupId ? (groups.find(g => g.id == groupId)?.members_count || 0) : 0
    };
    
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        window.ws.send(JSON.stringify({
            code: GROUP_API_CODES.CREATE_GROUP,
            group: groupData
        }));
    } else {
        simulateSaveGroup(groupData);
    }
    
    closeGroupModal();
}

// // Открытие модального окна деталей группы
// function openEditGroupModal() {
//     const group = currentGroup;
    
//     if (!group) {
//         console.error('Группа для редактирования не найдена');
//         return;
//     }
    
//     document.getElementById('groupModalTitle').textContent = `Редагування групи "${group.name}"`;
//     document.getElementById('groupId').value = group.id;
//     document.getElementById('groupName').value = group.name;
//     document.getElementById('groupStatus').value = group.status ? '1' : '0';
//     document.getElementById('groupDescription').value = group.description || '';
    
//     // Populate coach dropdown with available coaches
//     const coachSelect = document.getElementById('groupCoach');
//     coachSelect.innerHTML = '<option value="">Оберіть тренера</option>';
    
//     // Add all available coaches
//     coaches.forEach(coach => {
//         const option = document.createElement('option');
//         option.value = coach.id;
//         option.textContent = coach.name;
//         coachSelect.appendChild(option);
//     });
    
//     // Select the current coach if it exists
//     if (group.coach_id) {
//         coachSelect.value = group.coach_id.toString();
//     }
// }

// Закрытие модального окна деталей группы
function closeGroupDetailsModal() {
    groupDetailsModal.classList.remove('active');
}

// Подтверждение удаления группы
function confirmDeleteGroup() {
    if (!currentGroup) return;
    
    if (confirm(`Ви впевнені, що хочете видалити групу "${currentGroup.name}"?`)) {
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            window.ws.send(JSON.stringify({
                code: GROUP_API_CODES.DELETE_GROUP,
                id: currentGroup.id
            }));
        } else {
            simulateDeleteGroup(currentGroup.id);
        }
        
        closeGroupDetailsModal();
    }
}

// Открытие модального окна добавления участника
function openAddMemberModal() {
    if (!currentGroup) return;
    
    document.getElementById('addMemberGroupId').value = currentGroup.id;
    
    // Запрос на получение списка клиентов с сервера
    loadAvailableClients();
    
    addMemberModal.classList.add('active');
}

// Закрытие модального окна добавления участника
function closeAddMemberModal() {
    addMemberModal.classList.remove('active');
    document.getElementById('addMemberForm').reset();
}

// Добавление участника в группу
function addMemberToGroup() {
    const addMemberForm = document.getElementById('addMemberForm');
    
    if (!addMemberForm.checkValidity()) {
        alert('Будь ласка, оберіть клієнта');
        return;
    }
    
    const groupId = parseInt(document.getElementById('addMemberGroupId').value);
    const clientId = parseInt(document.getElementById('memberSelect').value);
    const clientName = document.getElementById('memberSelect').options[document.getElementById('memberSelect').selectedIndex].textContent;
    
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        window.ws.send(JSON.stringify({
            code: GROUP_API_CODES.ADD_MEMBER,
            group_id: groupId,
            client_id: clientId
        }));
    } else {
        simulateAddMember(groupId, clientId, clientName);
    }
    
    closeAddMemberModal();
}

// Удаление участника из группы
function removeMemberFromGroup(clientId) {
    if (!currentGroup) return;
    
    if (confirm('Ви впевнені, що хочете видалити цього учасника з групи?')) {
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            window.ws.send(JSON.stringify({
                code: GROUP_API_CODES.REMOVE_MEMBER,
                group_id: currentGroup.id,
                client_id: clientId
            }));
        } else {
            simulateRemoveMember(currentGroup.id, clientId);
        }
    }
}

// Отображение списка участников группы
function renderGroupMembers(members) {
    const membersList = document.getElementById('membersList');
    
    if (!members || members.length === 0) {
        membersList.innerHTML = `
            <div class="empty-state">
                <p>У групі немає учасників</p>
            </div>
        `;
        return;
    }
    
    membersList.innerHTML = '';
    
    members.forEach(member => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        
        // Получение инициалов для аватара
        const initials = member.name.split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
        
        memberItem.innerHTML = `
            <div class="member-info">
                <div class="member-avatar">${initials}</div>
                <div class="member-name">${member.name}</div>
            </div>
            <button class="remove-member" data-id="${member.id}">&times;</button>
        `;
        
        membersList.appendChild(memberItem);
    });
    
    // Обработчики кнопок удаления участников
    document.querySelectorAll('.remove-member').forEach(button => {
        button.addEventListener('click', function() {
            const clientId = parseInt(this.dataset.id);
            removeMemberFromGroup(clientId);
        });
    });
}

// Открытие модального окна добавления занятия
function openAddLessonModal() {
    if (!currentGroup) return;
    
    document.getElementById('lessonGroupId').value = currentGroup.id;
    document.getElementById('addLessonForm').reset();
    
    // Установка текущей даты по умолчанию
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('lessonDate').value = formattedDate;
    
    addLessonModal.classList.add('active');
}

// Закрытие модального окна добавления занятия
function closeAddLessonModal() {
    addLessonModal.classList.remove('active');
}

// Добавление занятия в группу
function addLessonToGroup() {
    const addLessonForm = document.getElementById('addLessonForm');
    
    // if (!addLessonForm.checkValidity()) {
    //     alert('Будь ласка, заповніть всі обов\'язкові поля');
    //     return;
    // }
    
    const groupId = parseInt(document.getElementById('lessonGroupId').value);
    // const title = document.getElementById('lessonTitle').value;
    const date = document.getElementById('lessonDate').value;
    const startTime = document.getElementById('lessonStartTime').value;
    const endTime = document.getElementById('lessonEndTime').value;
    const price = parseFloat(document.getElementById('lessonPrice').value);
    
    const lesson = {
        id: generateLessonId(),
        date: date,
        start_time: startTime + ':00',
        end_time: endTime + ':00',
        price: price,
        coach_name: currentGroup.coach_name,
        is_cancelled: false
    };
    

        window.ws.send(JSON.stringify({
            code: GROUP_API_CODES.ADD_GROUP_LESSON,
            group_id: groupId,
            lesson: lesson
        }));

    
    closeAddLessonModal();
}

// Отображение занятий группы
function renderGroupLessons(lessons, filter = 'all') {
    const lessonsList = document.getElementById('lessonsList');
    
    if (!lessons || lessons.length === 0) {
        lessonsList.innerHTML = `
            <div class="empty-state">
                <p>У групи немає запланованих занять</p>
            </div>
        `;
        return;
    }
    
    // Фильтрация занятий
    let filteredLessons = lessons;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filter === 'upcoming') {
        filteredLessons = lessons.filter(lesson => {
            const lessonDate = new Date(lesson.date);
            return lessonDate >= today;
        });
    } else if (filter === 'past') {
        filteredLessons = lessons.filter(lesson => {
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
        
        const lessonCard = document.createElement('div');
        lessonCard.className = `lesson-card ${statusClass}`;
        
        lessonCard.innerHTML = `
            <div class="lesson-header">
                <div class="lesson-title">${lesson.title}</div>
                <div class="lesson-status ${statusClass}">${statusText}</div>
            </div>
            <div class="lesson-details">
                <div class="lesson-detail">
                    <div class="detail-title">Дата</div>
                    <div class="detail-value-sub">${formatDate(lesson.date)}</div>
                </div>
                <div class="lesson-detail">
                    <div class="detail-title">Час</div>
                    <div class="detail-value-sub">${formatTime(lesson.start_time)} - ${formatTime(lesson.end_time)}</div>
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
                <button class="action-button view-lesson-btn" data-id="${lesson.id}">Деталі</button>
            </div>
        `;
        
        lessonsList.appendChild(lessonCard);
    });
    
    // Обработчики кнопок
    document.querySelectorAll('.cancel-lesson-btn').forEach(button => {
        button.addEventListener('click', function() {
            const lessonId = parseInt(this.dataset.id);
            cancelGroupLesson(lessonId);
        });
    });
    
    document.querySelectorAll('.view-lesson-btn').forEach(button => {
        button.addEventListener('click', function() {
            const lessonId = parseInt(this.dataset.id);
            viewLessonDetails(lessonId);
        });
    });
}

// Отмена занятия
function cancelGroupLesson(lessonId) {
    if (confirm('Ви впевнені, що хочете скасувати це заняття?')) {
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            window.ws.send(JSON.stringify({
                code: GROUP_API_CODES.CANCEL_GROUP_LESSON,
                id: lessonId
            }));
        } else {
            simulateCancelLesson(lessonId);
        }
    }
}

// Просмотр деталей занятия
function viewLessonDetails(lessonId) {
    if (!currentGroup) return;
    
    // Находим занятие по ID
    const lesson = lessons.find(l => l.id === lessonId);
    
    if (!lesson) {
        console.error('Занятие с ID ' + lessonId + ' не найдено');
        console.log(`tаа${lessons}`)
        return;
    }
    
    alert(`
        Заняття: ${lesson.title}
        Дата: ${formatDate(lesson.date)}
        Час: ${formatTime(lesson.start_time)} - ${formatTime(lesson.end_time)}
        Тренер: ${lesson.coach_name}
        Ціна: ${lesson.price} ₴
        Статус: ${lesson.is_cancelled ? 'Скасовано' : new Date(`${lesson.date}T${lesson.end_time}`) < new Date() ? 'Проведено' : 'Заплановано'}
    `);
}

// Вспомогательные функции
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA');
}

function formatTime(timeString) {
    return timeString.substring(0, 5);
}

function generateLessonId() {
    return Math.floor(Math.random() * 10000) + 1000;
}

// Функции симуляции (для работы без API)
function simulateGroupsData() {
    groups = MOCK_GROUPS;
    coaches = MOCK_COACHES;
    filterAndRenderGroups();
    populateCoachFilter();
}

function simulateSaveGroup(groupData) {
    if (groupData.id) {
        // Обновление существующей группы
        const index = groups.findIndex(g => g.id === groupData.id);
        if (index !== -1) {
            groups[index] = { ...groups[index], ...groupData };
        }
    } else {
        // Создание новой группы
        const newId = Math.max(...groups.map(g => g.id), 0) + 1;
        const newGroup = {
            ...groupData,
            id: newId,
            members_count: 0,
            members: []
        };
        groups.push(newGroup);
    }
    
    filterAndRenderGroups();
}

function simulateDeleteGroup(groupId) {
    groups = groups.filter(g => g.id !== groupId);
    filterAndRenderGroups();
}

function simulateAddMember(groupId, clientId, clientName) {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    if (!group.members) {
        group.members = [];
    }
    
    group.members.push({ id: clientId, name: clientName });
    group.members_count = group.members.length;
    
    if (currentGroup && currentGroup.id === groupId) {
        currentGroup = { ...group };
        renderGroupMembers(currentGroup.members);
        document.getElementById('detailGroupMembers').textContent = currentGroup.members_count;
    }
    
    filterAndRenderGroups();
}

function simulateRemoveMember(groupId, clientId) {
    const group = groups.find(g => g.id === groupId);
    if (!group || !group.members) return;
    
    group.members = group.members.filter(m => m.id !== clientId);
    group.members_count = group.members.length;
    
    if (currentGroup && currentGroup.id === groupId) {
        currentGroup = { ...group };
        renderGroupMembers(currentGroup.members);
        document.getElementById('detailGroupMembers').textContent = currentGroup.members_count;
    }
    
    filterAndRenderGroups();
}

function simulateAddLesson(groupId, lesson) {
    if (!MOCK_GROUP_LESSONS[groupId]) {
        MOCK_GROUP_LESSONS[groupId] = [];
    }
    
    MOCK_GROUP_LESSONS[groupId].push(lesson);
    
    const activeFilter = document.querySelector('input[name="lessons-filter"]:checked').value;
    renderGroupLessons(lessons, activeFilter);
}

function simulateCancelLesson(lessonId) {
    if (!currentGroup) return;
    
    const lessons = MOCK_GROUP_LESSONS[currentGroup.id] || [];
    const index = lessons.findIndex(l => l.id === lessonId);
    
    if (index !== -1) {
        lessons[index].is_cancelled = true;
        
        const activeFilter = document.querySelector('input[name="lessons-filter"]:checked').value;
        renderGroupLessons(lessons, activeFilter);
    }
}