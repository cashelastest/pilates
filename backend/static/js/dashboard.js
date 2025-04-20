document.addEventListener('DOMContentLoaded', function(){

  const calendarEl = document.getElementById('calendar');
  const ws = new WebSocket('ws://localhost:8000/dashboard/socket/');
  let calendar;
  
  ws.onopen = function() {
    console.log('WebSocket соединение установлено');
    ws.send(JSON.stringify({
      'code':187
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
  function webSocketMessages(data){
    console.log(data.data);
    switch(data.code){
      case 287:
        console.log('ok');
        initializeCalendar(data.data);
        break;
      case 289:
        fetchDropdownData(data.data)
      default:
        console.log('didn t get any');
    }
  }
  
  // Модальное окно
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
    titleEl.innerHTML = arg.event.title || '';
    
    // Добавляем информацию о тренере, если есть
    if (arg.event.extendedProps && arg.event.extendedProps.trainer) {
      const trainerEl = document.createElement('div');
      trainerEl.style.fontSize = '0.85em';
      trainerEl.style.opacity = '0.8';
      trainerEl.innerHTML = arg.event.extendedProps.trainer;
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
    console.log("sended!");
  }
  
  // Функция для открытия модального окна
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
  
  // Функция для закрытия модального окна
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
  
  // Загрузка данных для выпадающих списков
  function fetchDropdownData(data) {
    // Функция-заглушка для демонстрационных данных
    // В реальном приложении здесь будут запросы к API
    
    // Тренеры
    console.log(data)
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
  
  // Обработчики событий модального окна
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
    const clientId = clientSelect.value;
    const price = priceInput.value;
    const subscriptionId = subscriptionSelect.value;
    
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
      code: 189, // Код для создания нового занятия
      event: {
        title: title,
        date: date,
        start_time: startTime,
        end_time: endTime,
        coach_id: coachId,
        group_id: groupId || null,
        client_id: clientId,
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
        ws.send(JSON.stringify({"code":189}));
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
  
  // Инициализируем календарь с пустыми событиями
  initializeCalendar([]);
});