document.addEventListener('DOMContentLoaded', function() {
  // ====================== DASHBOARD.JS ======================
  const calendarEl = document.getElementById('calendar');
  window.ws = new WebSocket('ws://localhost:8000/socket/');
  let calendar;
  
  // Додаємо стилі для модального вікна, якщо вони потрібні
  const addStyles = () => {
    if (!document.getElementById('modal-styles')) {
      const style = document.createElement('style');
      style.id = 'modal-styles';
      style.textContent = `
        .modal-overlay.active {
          display: flex;
          align-items: center;
          justify-content: center;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }
      `;
      document.head.appendChild(style);
    }
  };
  
  // Додаємо стилі при завантаженні сторінки
  addStyles();
  
  ws.onopen = function() {
    console.log('WebSocket з\'єднання встановлено');
    ws.send(JSON.stringify({
      'code': 187
    }));
  };
  
  ws.onmessage = function(event) {
    console.log('Отримано дані:', event.data);
    try {
      const events = JSON.parse(event.data);
      webSocketMessages(events);
    } catch (error) {
      console.error('Помилка при обробці даних WebSocket:', error);
    }
  };
  
  // Обробка повідомлень від WebSocket
  function webSocketMessages(data) {
    console.log('Отримано код:', data.code);
    console.log('Отримано дані:', data.data);
    
    switch(data.code) {
      case 287:
        console.log('Ініціалізація календаря');
        initializeCalendar(data.data);
        break;
      case 289:
        console.log('Отримано дані для випадаючих списків заняття');
        fetchDropdownData(data.data);
        break;
      case 293:
        console.log('Отримано дані для випадаючих списків абонемента:', data.data);
        updateSubscriptionDropdownLists(data.data);
        break;
      default:
        console.log('Не оброблений код:', data.code);
    }
  }
  
  // =============== ФУНКЦІЇ КАЛЕНДАРЯ ТА ЗАНЯТЬ ===============
  
  // Модальне вікно заняття
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
  
  // Функція для відображення вмісту подій
  function renderEventContent(arg) {
    // Створюємо контейнер для всього вмісту
    const contentEl = document.createElement('div');
    contentEl.classList.add('fc-event-content-custom');
    
    // Центральна частина з часом і назвою
    const centerEl = document.createElement('div');
    centerEl.classList.add('fc-event-center');
    
    // Час
    const timeEl = document.createElement('div');
    timeEl.classList.add('fc-event-time-custom');
    
    if (!arg.event.allDay) {
      const startTime = arg.event.start ? arg.event.start.toLocaleTimeString('uk', {hour: '2-digit', minute: '2-digit'}) : '';
      const endTime = arg.event.end ? arg.event.end.toLocaleTimeString('uk', {hour: '2-digit', minute: '2-digit'}) : '';
      timeEl.innerHTML = startTime + (endTime ? ' - ' + endTime : '');
    } else {
      timeEl.innerHTML = 'Весь день';
    }
    
    // Назва
    const titleEl = document.createElement('div');
    titleEl.classList.add('fc-event-title-custom');
    titleEl.innerHTML = arg.event.extendedProps.trainer || '';
    
    // Додаємо інформацію про тренера, якщо є
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
    
    // Перевіряємо наявність ціни і додаємо її справа
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
    // Тут можна додати код для відкриття модального вікна з деталями події
    const event = calendar.getEventById(eventId);
    if (event) {
      alert(`
        Заняття: ${event.title}
        Початок: ${event.start.toLocaleString()}
        Кінець: ${event.end ? event.end.toLocaleString() : 'Не вказано'}
        Тренер: ${event.extendedProps.trainer || 'Не призначено'}
        Вартість: ${event.extendedProps.price || '0'}₴
        Статус: ${getStatusText(event.extendedProps.status)}
      `);
    }
  }
  
  function getStatusText(status) {
    switch(status) {
      case 'completed': return 'Проведено';
      case 'cancelled': return 'Скасовано';
      case 'scheduled': return 'Заплановано';
      default: return 'Не вказано';
    }
  }
  
  // Функція для обробки змін події (перетягування або зміна розміру)
  function handleEventChange(eventId, date, newStart, newEnd, isResize) {
    console.log(`Подія ${isResize ? 'змінено розмір' : 'переміщено'}:`, {
      id: eventId,
      новий_початок: newStart,
      новий_кінець: newEnd
    });

    ws.send(JSON.stringify({
      code: 188,
      id: eventId,
      'date': date,
      start: newStart,
      end: newEnd
    }));
    console.log("Відправлено дані зміни часу події!");
  }
  
  // Функція для відкриття модального вікна заняття
  function openModal(date) {
    // Форматуємо дату для поля вводу
    const formattedDate = date.toISOString().split('T')[0];
    lessonDateInput.value = formattedDate;
    
    // Встановлюємо час за замовчуванням
    const currentHour = date.getHours();
    startTimeInput.value = `${String(currentHour).padStart(2, '0')}:00`;
    endTimeInput.value = `${String(currentHour + 1).padStart(2, '0')}:30`;
    
    // Показуємо модальне вікно
    modal.classList.add('active');
    // Відображаємо контейнер модального вікна
    modal.querySelector('.modal-container').style.display = 'block';
  }
  
  // Функція для закриття модального вікна заняття
  function closeModal() {
    modal.classList.remove('active');
    // Приховуємо контейнер модального вікна
    modal.querySelector('.modal-container').style.display = 'none';
    lessonForm.reset();
    
    // Скидаємо стан полів вибору
    clientSelect.disabled = false;
    clientSelect.required = true;
    clientSelect.parentElement.style.opacity = '1';
    
    groupSelect.disabled = false;
    groupSelect.parentElement.style.opacity = '1';
  }
  
  // Завантаження даних для випадаючих списків заняття
  function fetchDropdownData(data) {
    console.log('Оновлення випадаючих списків для заняття:', data);
    
    // Тренери
    coachSelect.innerHTML = '<option value="">Оберіть тренера</option>';
    data[0].forEach(coach => {
      const option = document.createElement('option');
      option.value = coach.id;
      option.textContent = coach.name;
      coachSelect.appendChild(option);
    });
    
    // Групи
    groupSelect.innerHTML = '<option value="">Оберіть групу (необов\'язково)</option>';
    data[1].forEach(group => {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.name;
      groupSelect.appendChild(option);
    });
    
    // Клієнти
    clientSelect.innerHTML = '<option value="">Оберіть клієнта</option>';
    data[2].forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name;
      clientSelect.appendChild(option);
    });
    
    // Абонементи
    subscriptionSelect.innerHTML = '<option value="">Оберіть абонемент (необов\'язково)</option>';
    data[3].forEach(subscription => {
      const option = document.createElement('option');
      option.value = subscription.id;
      option.textContent = subscription.name;
      subscriptionSelect.appendChild(option);
    });
  }
  
  // Автозаповнення назви при виборі групи та управління залежностями
  groupSelect.addEventListener('change', function() {
    if (this.value) {
      // Автозаповнення назви групи
      if (lessonTitleInput.value === '') {
        const selectedOption = this.options[this.selectedIndex];
        lessonTitleInput.value = selectedOption.textContent;
      }
      
      // Вимикаємо вибір клієнта, оскільки вибрана група
      clientSelect.disabled = true;
      clientSelect.value = "";
      clientSelect.required = false;
      
      // Додаємо візуальне позначення неактивного стану
      clientSelect.parentElement.style.opacity = '0.5';
    } else {
      // Якщо група не вибрана, вмикаємо вибір клієнта
      clientSelect.disabled = false;
      clientSelect.required = true;
      clientSelect.parentElement.style.opacity = '1';
    }
  });
  
  // Управління взаємовиключенням: якщо вибрано клієнта, вимикаємо групу
  clientSelect.addEventListener('change', function() {
    if (this.value) {
      // Вимикаємо вибір групи, оскільки вибрано клієнта
      groupSelect.disabled = true;
      groupSelect.value = "";
      
      // Додаємо візуальне позначення неактивного стану
      groupSelect.parentElement.style.opacity = '0.5';
    } else {
      // Якщо клієнт не вибрано, вмикаємо вибір групи
      groupSelect.disabled = false;
      groupSelect.parentElement.style.opacity = '1';
    }
  });
  
  // Обробники подій модального вікна заняття
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // Закриття модального вікна при кліку поза ним
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Збереження даних заняття
  saveBtn.addEventListener('click', function() {
    // Перевіряємо, чи вибрана група або клієнт
    if (!groupSelect.value && !clientSelect.value) {
      alert('Будь ласка, виберіть групу або клієнта');
      return;
    }
    
    // Перевірка валідності форми
    if (!lessonForm.checkValidity()) {
      alert('Будь ласка, заповніть усі обов\'язкові поля');
      return;
    }
    
    // Отримання значень форми
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
    
    // Створення об'єктів дати початку та закінчення
    const startDate = new Date(`${date}T${startTime}`);
    const endDate = new Date(`${date}T${endTime}`);
    
    // Створення об'єкта події
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
    
    // Додавання події до календаря
    calendar.addEvent(eventData);
    
    // Відправка даних на сервер через WebSocket
    ws.send(JSON.stringify({
      code: 190, // Код для створення нового заняття
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
    
    // Закриття модального вікна
    closeModal();
  });
  
  // Ініціалізація календаря
  function initializeCalendar(events) {
    // Якщо календар уже ініціалізовано, очищаємо його події та додаємо нові
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
      slotDuration: '00:15:00', // 15-хвилинні інтервали
      slotLabelInterval: '01:00:00', // Підписи годин кожну годину
      slotMinTime: '06:00:00', // Початок дня о 6:00
      slotMaxTime: '23:00:00', // Кінець дня о 23:00
      dayMaxEvents: true, // Показувати "+ще" при великій кількості подій у місячному вигляді
      navLinks: true, // Клік по даті/часу для переходу до детального представлення
      editable: true, // Дозволити перетягування подій
      selectable: true, // Дозволити вибір часових інтервалів
      nowIndicator: true, // Показувати індикатор поточного часу
      events: events,
      
      // Додаємо функцію відображення вмісту подій
      eventContent: renderEventContent,
      
      eventClick: function(info) {
        info.jsEvent.preventDefault();
        const eventId = info.event.id;
        handleClick(eventId);
      },
      
      allDaySlot: false,
      
      // Обробник кліку по даті
      dateClick: function(info) {
        console.log("Клік на " + info.dateStr);
        // Запитуємо дані для випадаючих списків перед відкриттям форми
        ws.send(JSON.stringify({"code": 189}));
        // Відкриваємо модальне вікно для створення нового заняття
        openModal(info.date);
      },
      
      select: function(info) {
        console.log('Вибрано інтервал:', info.startStr, 'до', info.endStr);
        // Можна додати створення нової події при виділенні інтервалу
      },
      
      // Обробник перетягування події
      eventDrop: function(info) {
        handleEventChange(
          info.event.id,
          info.event.date,
          info.event.startStr,
          info.event.endStr,
          false // не зміна розміру, а перетягування
        );
      },
      
      // Обробник зміни розміру події
      eventResize: function(info) {
        handleEventChange(
          info.event.id,
          info.event.date,
          info.event.startStr,
          info.event.endStr,
          true // це зміна розміру
        );
      },
      
      // Адаптація до зміни розміру екрана
      windowResize: function(view) {
        if (window.innerWidth < 768) {
          calendar.changeView('timeGridDay');
        } else {
          calendar.changeView('timeGridWeek');
        }
      }
    });
    
    // Відображаємо календар
    calendar.render();
  }
  
  // Експортуємо методи для зовнішнього використання
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
      // Оновлюємо дані події
      if (updatedData.title) event.setProp('title', updatedData.title);
      if (updatedData.start) event.setStart(updatedData.start);
      if (updatedData.end) event.setEnd(updatedData.end);
      if (updatedData.className) event.setProp('classNames', updatedData.className);
      
      // Оновлюємо extendedProps
      if (updatedData.extendedProps) {
        const currentProps = event.extendedProps || {};
        const newProps = {...currentProps, ...updatedData.extendedProps};
        
        // Встановлюємо оновлені властивості
        for (const key in newProps) {
          event.setExtendedProp(key, newProps[key]);
        }
      }
    }
  };
  
  // Функція для оновлення випадаючих списків для абонементів
  function updateSubscriptionDropdownLists(data) {
    console.log("Оновлення випадаючих списків абонементів з даними:", data);
    
    // Перевірка, що дані - це масив і має потрібну довжину
    if (!Array.isArray(data) || data.length < 2) {
      console.error("Неправильний формат даних для випадаючих списків:", data);
      return;
    }
  }

  // Ініціалізуємо календар з порожніми подіями
  initializeCalendar([]);
});