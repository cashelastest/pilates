document.addEventListener('DOMContentLoaded', function() {
  // ====================== DASHBOARD.JS ======================
  const calendarEl = document.getElementById('calendar');
  window.ws = new WebSocket('ws://localhost:8000/socket/');
  let calendar;
  
  ws.onopen = function() {
    console.log('WebSocket соединение установлено');
    ws.send(JSON.stringify({
      'code': 187
    }));
  };
  
  ws.onmessage = function(event) {
    console.log('Получены данные:', event.data);
    try {
      const events = JSON.parse(event.data);
      webSocketMessages(events);
    } catch (error) {
      console.error('Ошибка при обработке данных WebSocket:', error);
    }
  };
  
  // Обработка сообщений от WebSocket
  function webSocketMessages(data) {
    console.log('Получен код:', data.code);
    console.log('Получены данные:', data.data);
    
    switch(data.code) {
      case 287:
        console.log('Инициализация календаря');
        initializeCalendar(data.data);
        break;
      case 289:
        console.log('Получены данные для выпадающих списков занятия');
        fetchDropdownData(data.data);
        break;
      case 293:
        console.log('Получены данные для выпадающих списков абонемента:', data.data);
        updateSubscriptionDropdownLists(data.data);
        break;
      default:
        console.log('Не обработанный код:', data.code);
    }
  }
  
  // =============== ФУНКЦИИ КАЛЕНДАРЯ И ЗАНЯТИЙ ===============
  
  // Модальное окно занятия
  const modal = document.getElementById('lessonModal');
  const closeModalBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelLessonBtn');
  const saveBtn = document.getElementById('saveLessonBtn');
  const lessonForm = document.getElementById('lessonForm');
  const lessonDateInput = document.getElementById('lessonDate');
  const lessonTitleInput = document.getElementById('lessonTitle');
  const startTimeInput = document.getElementById('startTime');
  const endTimeInput = document.getElementById('endTime');
  const coachSelect = document.getElementById('coachSelect');
  const groupSelect = document.getElementById('groupSelect');
  const clientSelect = document.getElementById('clientSelect');
  const priceInput = document.getElementById('lessonPrice');
  const subscriptionSelect = document.getElementById('subscriptionSelect');
  
  // Функция для отображения содержимого событий
  function renderEventContent(arg) {
    // Создаем контейнер для всего содержимого
    const contentEl = document.createElement('div');
    contentEl.classList.add('fc-event-content-custom');
    
    // Центральная часть с временем и названием
    const centerEl = document.createElement('div');
    centerEl.classList.add('fc-event-center');
    
    // Время
    const timeEl = document.createElement('div');
    timeEl.classList.add('fc-event-time-custom');
    
    if (!arg.event.allDay) {
      const startTime = arg.event.start ? arg.event.start.toLocaleTimeString('uk', {hour: '2-digit', minute: '2-digit'}) : '';
      const endTime = arg.event.end ? arg.event.end.toLocaleTimeString('uk', {hour: '2-digit', minute: '2-digit'}) : '';
      timeEl.innerHTML = startTime + (endTime ? ' - ' + endTime : '');
    } else {
      timeEl.innerHTML = 'Весь день';
    }
    
    // Название
    const titleEl = document.createElement('div');
    titleEl.classList.add('fc-event-title-custom');
    titleEl.innerHTML = arg.event.extendedProps.trainer || '';
    
    // Добавляем информацию о тренере, если есть
    if (arg.event.title) {
      const trainerEl = document.createElement('div');
      trainerEl.style.fontSize = '0.85em';
      trainerEl.style.color = '#7D9D9C';
      trainerEl.innerHTML = arg.event.title;
      centerEl.appendChild(trainerEl);
    }
    
    centerEl.appendChild(timeEl);
    centerEl.appendChild(titleEl);
    contentEl.appendChild(centerEl);
    
    // Проверяем наличие цены и добавляем её справа
    if (arg.event.extendedProps && arg.event.extendedProps.price !== undefined) {
      const priceEl = document.createElement('div');
      priceEl.classList.add('fc-event-price');
      priceEl.innerHTML = arg.event.extendedProps.price + '₴';
      contentEl.appendChild(priceEl);
    }
    
    return { domNodes: [contentEl] };
  }
  
  function handleClick(eventId) {
    console.log('click id: ' + eventId);
    // Здесь можно добавить код для открытия модального окна с деталями события
    const event = calendar.getEventById(eventId);
    if (event) {
      alert(`
        Занятие: ${event.title}
        Начало: ${event.start.toLocaleString()}
        Конец: ${event.end ? event.end.toLocaleString() : 'Не указано'}
        Тренер: ${event.extendedProps.trainer || 'Не назначен'}
        Стоимость: ${event.extendedProps.price || '0'}₴
        Статус: ${getStatusText(event.extendedProps.status)}
      `);
    }
  }
  
  function getStatusText(status) {
    switch(status) {
      case 'completed': return 'Проведено';
      case 'cancelled': return 'Отменено';
      case 'scheduled': return 'Запланировано';
      default: return 'Не указан';
    }
  }
  
  // Функция для обработки изменений события (перетаскивание или изменение размера)
  function handleEventChange(eventId, date, newStart, newEnd, isResize) {
    console.log(`Событие ${isResize ? 'изменен размер' : 'перемещено'}:`, {
      id: eventId,
      новое_начало: newStart,
      новый_конец: newEnd
    });

    ws.send(JSON.stringify({
      code: 188,
      id: eventId,
      'date': date,
      start: newStart,
      end: newEnd
    }));
    console.log("Отправлены данные изменения времени события!");
  }
  
  // Функция для открытия модального окна занятия
  function openModal(date) {
    // Форматируем дату для поля ввода
    const formattedDate = date.toISOString().split('T')[0];
    lessonDateInput.value = formattedDate;
    
    // Устанавливаем время по умолчанию
    const currentHour = date.getHours();
    startTimeInput.value = `${String(currentHour).padStart(2, '0')}:00`;
    endTimeInput.value = `${String(currentHour + 1).padStart(2, '0')}:30`;
    
    // Показываем модальное окно
    modal.classList.add('active');
  }
  
  // Функция для закрытия модального окна занятия
  function closeModal() {
    modal.classList.remove('active');
    lessonForm.reset();
    
    // Сбрасываем состояние полей выбора
    clientSelect.disabled = false;
    clientSelect.required = true;
    clientSelect.parentElement.style.opacity = '1';
    
    groupSelect.disabled = false;
    groupSelect.parentElement.style.opacity = '1';
  }
  
  // Загрузка данных для выпадающих списков занятия
  function fetchDropdownData(data) {
    console.log('Обновление выпадающих списков для занятия:', data);
    
    // Тренеры
    coachSelect.innerHTML = '<option value="">Оберіть тренера</option>';
    data[0].forEach(coach => {
      const option = document.createElement('option');
      option.value = coach.id;
      option.textContent = coach.name;
      coachSelect.appendChild(option);
    });
    
    // Группы
    groupSelect.innerHTML = '<option value="">Оберіть групу (необов\'язково)</option>';
    data[1].forEach(group => {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.name;
      groupSelect.appendChild(option);
    });
    
    // Клиенты
    clientSelect.innerHTML = '<option value="">Оберіть клієнта</option>';
    data[2].forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name;
      clientSelect.appendChild(option);
    });
    
    // Абонементы
    subscriptionSelect.innerHTML = '<option value="">Оберіть абонемент (необов\'язково)</option>';
    data[3].forEach(subscription => {
      const option = document.createElement('option');
      option.value = subscription.id;
      option.textContent = subscription.name;
      subscriptionSelect.appendChild(option);
    });
  }
  
  // Автозаполнение названия при выборе группы и управление зависимостями
  groupSelect.addEventListener('change', function() {
    if (this.value) {
      // Автозаполнение названия группы
      if (lessonTitleInput.value === '') {
        const selectedOption = this.options[this.selectedIndex];
        lessonTitleInput.value = selectedOption.textContent;
      }
      
      // Отключаем выбор клиента, так как выбрана группа
      clientSelect.disabled = true;
      clientSelect.value = "";
      clientSelect.required = false;
      
      // Добавляем визуальное обозначение неактивного состояния
      clientSelect.parentElement.style.opacity = '0.5';
    } else {
      // Если группа не выбрана, включаем выбор клиента
      clientSelect.disabled = false;
      clientSelect.required = true;
      clientSelect.parentElement.style.opacity = '1';
    }
  });
  
  // Управление взаимоисключением: если выбран клиент, отключаем группу
  clientSelect.addEventListener('change', function() {
    if (this.value) {
      // Отключаем выбор группы, так как выбран клиент
      groupSelect.disabled = true;
      groupSelect.value = "";
      
      // Добавляем визуальное обозначение неактивного состояния
      groupSelect.parentElement.style.opacity = '0.5';
    } else {
      // Если клиент не выбран, включаем выбор группы
      groupSelect.disabled = false;
      groupSelect.parentElement.style.opacity = '1';
    }
  });
  
  // Обработчики событий модального окна занятия
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // Закрытие модального окна при клике вне его
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Сохранение данных занятия
  saveBtn.addEventListener('click', function() {
    // Проверяем, выбрана ли либо группа, либо клиент
    if (!groupSelect.value && !clientSelect.value) {
      alert('Будь ласка, виберіть групу або клієнта');
      return;
    }
    
    // Проверка валидности формы
    if (!lessonForm.checkValidity()) {
      alert('Будь ласка, заповніть всі обов\'язкові поля');
      return;
    }
    
    // Получение значений формы
    const date = lessonDateInput.value;
    const title = lessonTitleInput.value;
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    const coachId = coachSelect.value;
    const coachName = coachSelect.options[coachSelect.selectedIndex].textContent;
    const groupId = groupSelect.value;
    let clientId = clientSelect.value;
    const price = parseInt(priceInput.value);
    const subscriptionId = subscriptionSelect.value;
    if (clientId === '') {
      clientId = null;
    }
    
    // Создание объектов даты начала и окончания
    const startDate = new Date(`${date}T${startTime}`);
    const endDate = new Date(`${date}T${endTime}`);
    
    // Создание объекта события
    const eventData = {
      id: 'new-' + new Date().getTime(),
      title: title,
      start: startDate,
      end: endDate,
      extendedProps: {
        price: parseInt(price),
        trainer: coachName,
        status: 'scheduled',
        coachId: coachId,
        groupId: groupId,
        clientId: clientId,
        subscriptionId: subscriptionId || null
      },
      className: 'future_lesson'
    };
    
    // Добавление события в календарь
    calendar.addEvent(eventData);
    
    // Отправка данных на сервер через WebSocket
    ws.send(JSON.stringify({
      code: 190, // Код для создания нового занятия
      event: {
        title: title,
        date: date,
        start_time: startTime,
        end_time: endTime,
        coach_id: coachId,
        group_id: groupId || null,
        client_id: clientId || null,
        price: price,
        subscription_id: subscriptionId || null,
        is_cancelled: false
      }
    }));
    
    // Закрытие модального окна
    closeModal();
  });
  
  // Инициализация календаря
  function initializeCalendar(events) {
    // Если календарь уже инициализирован, очищаем его события и добавляем новые
    if (calendar) {
      calendar.getEvents().forEach(event => event.remove());
      events.forEach(event => calendar.addEvent(event));
      return;
    }
    
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: window.innerWidth < 768 ? "timeGridDay" : "timeGridWeek",
      locale: 'uk',
      height: 'auto',
      aspectRatio: 1.8,
      contentHeight: 'auto',
      headerToolbar: {
        left: 'prev next',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      slotDuration: '00:15:00', // 15-минутные интервалы
      slotLabelInterval: '01:00:00', // Подписи часов каждый час
      slotMinTime: '06:00:00', // Начало дня в 6:00
      slotMaxTime: '23:00:00', // Конец дня в 23:00
      dayMaxEvents: true, // Показывать "+еще" при большом количестве событий в месячном виде
      navLinks: true, // Клик по дате/времени для перехода к детальному представлению
      editable: true, // Разрешить перетаскивание событий
      selectable: true, // Разрешить выбор временных интервалов
      nowIndicator: true, // Показывать индикатор текущего времени
      events: events,
      
      // Добавляем функцию отображения содержимого событий
      eventContent: renderEventContent,
      
      eventClick: function(info) {
        info.jsEvent.preventDefault();
        const eventId = info.event.id;
        handleClick(eventId);
      },
      
      allDaySlot: false,
      
      // Обработчик клика по дате
      dateClick: function(info) {
        console.log("clicked on " + info.dateStr);
        ws.send(JSON.stringify({"code": 189}));
        openModal(info.date);
      },
      
      select: function(info) {
        console.log('Выбран интервал:', info.startStr, 'до', info.endStr);
        // Можно добавить создание нового события при выделении интервала
      },
      
      // Обработчик перетаскивания события
      eventDrop: function(info) {
        handleEventChange(
          info.event.id,
          info.event.date,
          info.event.startStr,
          info.event.endStr,
          false // не изменение размера, а перетаскивание
        );
      },
      
      // Обработчик изменения размера события
      eventResize: function(info) {
        handleEventChange(
          info.event.id,
          info.event.date,
          info.event.startStr,
          info.event.endStr,
          true // это изменение размера
        );
      },
      
      // Адаптация к изменению размера экрана
      windowResize: function(view) {
        if (window.innerWidth < 768) {
          calendar.changeView('timeGridDay');
        } else {
          calendar.changeView('timeGridWeek');
        }
      }
    });
    
    // Отрисовываем календарь
    calendar.render();
  }
  
  // Экспортируем методы для внешнего использования
  window.addCalendarEvent = function(eventData) {
    calendar.addEvent(eventData);
  };
  
  window.removeCalendarEvent = function(eventId) {
    const event = calendar.getEventById(eventId);
    if (event) {
      event.remove();
    }
  };
  
  window.updateCalendarEvent = function(eventId, updatedData) {
    const event = calendar.getEventById(eventId);
    if (event) {
      // Обновляем данные события
      if (updatedData.title) event.setProp('title', updatedData.title);
      if (updatedData.start) event.setStart(updatedData.start);
      if (updatedData.end) event.setEnd(updatedData.end);
      if (updatedData.className) event.setProp('classNames', updatedData.className);
      
      // Обновляем extendedProps
      if (updatedData.extendedProps) {
        const currentProps = event.extendedProps || {};
        const newProps = {...currentProps, ...updatedData.extendedProps};
        
        // Устанавливаем обновленные свойства
        for (const key in newProps) {
          event.setExtendedProp(key, newProps[key]);
        }
      }
    }
  };
  
  // =============== ФУНКЦИИ АБОНЕМЕНТОВ И РАСПИСАНИЙ ===============
  
  // Получаем элементы модальных окон абонементов
  const subscriptionModal = document.getElementById('subscriptionModal');
  const assignScheduleModal = document.getElementById('assignScheduleModal');
  
  // Кнопки открытия модальных окон
  const createSubscriptionBtn = document.getElementById('createSubscriptionBtn');
  const assignScheduleBtn = document.getElementById('assignScheduleBtn');
  
  // Кнопки закрытия модальных окон
  const closeSubscriptionModal = document.getElementById('closeSubscriptionModal');
  const closeAssignScheduleModal = document.getElementById('closeAssignScheduleModal');
  const cancelSubscriptionBtn = document.getElementById('cancelSubscriptionBtn');
  const cancelAssignScheduleBtn = document.getElementById('cancelAssignScheduleBtn');
  
  // Кнопки сохранения данных
  const saveSubscriptionBtn = document.getElementById('saveSubscriptionBtn');
  const saveAssignScheduleBtn = document.getElementById('saveAssignScheduleBtn');
  
  // Элементы форм
  const subscriptionForm = document.getElementById('subscriptionForm');
  const assignScheduleForm = document.getElementById('assignScheduleForm');
  
  // Открытие модального окна для создания абонемента
  createSubscriptionBtn.addEventListener('click', function() {
    subscriptionModal.classList.add('active');
  });
  
  // Открытие модального окна для назначения расписания абонементу
  assignScheduleBtn.addEventListener('click', function() {
    fetchClientsAndSubscriptions();
    assignScheduleModal.classList.add('active');
  });
  
  // Закрытие модальных окон
  function closeSubscriptionModalFunc() {
    subscriptionModal.classList.remove('active');
    subscriptionForm.reset();
  }
  
  function closeAssignScheduleModalFunc() {
    assignScheduleModal.classList.remove('active');
    assignScheduleForm.reset();
  }
  
  // Привязка событий закрытия модальных окон
  closeSubscriptionModal.addEventListener('click', closeSubscriptionModalFunc);
  cancelSubscriptionBtn.addEventListener('click', closeSubscriptionModalFunc);
  
  closeAssignScheduleModal.addEventListener('click', closeAssignScheduleModalFunc);
  cancelAssignScheduleBtn.addEventListener('click', closeAssignScheduleModalFunc);
  
  // Закрытие модальных окон при клике вне их области
  subscriptionModal.addEventListener('click', function(e) {
    if (e.target === subscriptionModal) {
      closeSubscriptionModalFunc();
    }
  });
  
  assignScheduleModal.addEventListener('click', function(e) {
    if (e.target === assignScheduleModal) {
      closeAssignScheduleModalFunc();
    }
  });
  
  // Сохранение абонемента
  saveSubscriptionBtn.addEventListener('click', function() {
    if (!subscriptionForm.checkValidity()) {
      alert('Будь ласка, заповніть всі обов\'язкові поля');
      return;
    }
    
    const name = document.getElementById('subscriptionName').value;
    const price = document.getElementById('subscriptionPrice').value;
    const description = document.getElementById('subscriptionDescription').value || '';
    
    // Формирование данных для отправки
    const subscriptionData = {
      name: name,
      price: parseFloat(price),
      description: description
    };
    
    // Отправка данных на сервер через WebSocket
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
      window.ws.send(JSON.stringify({
        code: 191, // Код для создания абонемента
        subscription: subscriptionData
      }));
      
      console.log('Отправлены данные абонемента:', subscriptionData);
      
      // Закрытие модального окна
      closeSubscriptionModalFunc();
    } else {
      alert('Немає з\'єднання з сервером');
    }
  });
  
  // Сохранение назначения расписания абонементу
  saveAssignScheduleBtn.addEventListener('click', function() {
    if (!assignScheduleForm.checkValidity()) {
      alert('Будь ласка, заповніть всі обов\'язкові поля');
      return;
    }
    
    const clientId = document.getElementById('assignClientSelect').value;
    const subscriptionId = document.getElementById('assignSubscriptionSelect').value;
    const dayOfWeek = document.getElementById('assignDayOfWeekSelect').value;
    const startTime = document.getElementById('assignStartTime').value;
    const endTime = document.getElementById('assignEndTime').value;
    
    // Формирование данных для отправки (без поля coach_id)
    const scheduleData = {
      client_id: clientId,
      subscription_id: subscriptionId,
      day_of_the_week: parseInt(dayOfWeek),
      start_time: startTime,
      end_time: endTime
    };
    
    // Отправка данных на сервер через WebSocket
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
      window.ws.send(JSON.stringify({
        code: 192, // Код для назначения расписания абонементу
        schedule: scheduleData
      }));
      
      console.log('Отправлены данные расписания:', scheduleData);
      
      // Закрытие модального окна
      closeAssignScheduleModalFunc();
    } else {
      alert('Немає з\'єднання з сервером');
    }
  });
  
  // Получение списка клиентов и абонементов для формы назначения расписания
  function fetchClientsAndSubscriptions() {
    // Проверяем, есть ли глобальная переменная ws
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
      window.ws.send(JSON.stringify({
        code: 193 // Код для запроса данных
      }));
      console.log('Отправлен запрос на получение данных для выпадающих списков');
    } else {
      console.error('WebSocket соединение не установлено');
      alert('Немає з\'єднання з сервером');
    }
  }
  
  // Обновление выпадающих списков для абонементов
  function updateSubscriptionDropdownLists(data) {
    console.log("Обновление выпадающих списков абонементов с данными:", data);
    
    // Проверка, что данные - это массив и имеет нужную длину
    if (!Array.isArray(data) || data.length < 2) {
      console.error("Неверный формат данных для выпадающих списков:", data);
      return;
    }
    
    // Обновление списка клиентов
    const clientSelect = document.getElementById('assignClientSelect');
    if (clientSelect) {
      clientSelect.innerHTML = '<option value="">Оберіть клієнта</option>';
      
      // Проверка, что данные клиентов - это массив
      if (Array.isArray(data[0])) {
        data[0].forEach(client => {
          const option = document.createElement('option');
          option.value = client.id;
          option.textContent = client.name;
          clientSelect.appendChild(option);
        });
      } else {
        console.error("Данные клиентов не являются массивом:", data[0]);
      }
    } else {
      console.error("Элемент assignClientSelect не найден");
    }
    
    // Обновление списка абонементов
    const subscriptionSelect = document.getElementById('assignSubscriptionSelect');
    if (subscriptionSelect) {
      subscriptionSelect.innerHTML = '<option value="">Оберіть абонемент</option>';
      
      // Проверка, что данные абонементов - это массив
      if (Array.isArray(data[1])) {
        data[1].forEach(subscription => {
          const option = document.createElement('option');
          option.value = subscription.id;
          option.textContent = subscription.name;
          subscriptionSelect.appendChild(option);
        });
      } else {
        console.error("Данные абонементов не являются массивом:", data[1]);
      }
    } else {
      console.error("Элемент assignSubscriptionSelect не найден");
    }
  }

  // Инициализируем календарь с пустыми событиями
  initializeCalendar([]);
});