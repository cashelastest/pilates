document.addEventListener('DOMContentLoaded', function(){
  const calendarEl = document.getElementById('calendar');
  const events = [
    {
      id: '1',
      title: 'Группа А',
      start: '2025-04-09T10:00:00',
      end: '2025-04-09T12:00:00',
      extendedProps:{
        price: 500,
        trainer: 'Олександр Бондаренко',
        status: 'completed' // проведено
      },
      className: 'success_lesson'
    },
    {
      id: '2',
      title: 'Группа Б',
      start: '2025-04-11T18:00:00',
      end: '2025-04-11T19:30:00',
      extendedProps:{
        price: 450,
        trainer: 'Марія Шевчук',
        status: 'cancelled' // отменено
      },
      className: 'cancelled_lesson'
    },
    {
      id: '3',
      title: 'Группа А',
      start: '2025-04-14T09:00:00',
      end: '2025-04-14T10:30:00',
      extendedProps:{
        price: 500,
        trainer: 'Дмитро Петренко',
        status: 'scheduled' // запланировано
      },
      className: 'future_lesson'
    }
  ];
  
  function handleClick(eventId){
    console.log('click id'+ eventId);
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
  function handleEventChange(eventId, newStart, newEnd, isResize) {
    console.log(`Событие ${isResize ? 'изменен размер' : 'перемещено'}:`, {
      id: eventId,
      новое_начало: newStart,
      новый_конец: newEnd
    });
    // Здесь ваш код обработки изменений
  }
  
  const calendar = new FullCalendar.Calendar(calendarEl,{
    initialView: window.innerWidth < 768 ? "timeGridDay" : "timeGridWeek",
    locale: 'uk',
    height: 'auto',
    aspectRatio: 1.8,
    contentHeight: 'auto',
    headerToolbar:{
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
    eventContent: function(arg) {
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
    },
    
    eventClick: function(info){
      info.jsEvent.preventDefault();
      const eventId = info.event.id;
      handleClick(eventId);
    },
    allDaYSlot:false,
    dateClick: function(info){
      console.log("clicked on "+ info.dateStr);
      // Можно добавить создание нового события при клике на дату
      if (confirm(`Создать новое занятие на ${info.dateStr}?`)) {
        const title = prompt('Введите название группы:');
        if (title) {
          const startTime = prompt('Введите время начала (HH:MM):', '10:00');
          const endTime = prompt('Введите время окончания (HH:MM):', '11:30');
          
          if (startTime && endTime) {
            const [startHour, startMinute] = startTime.split(':');
            const [endHour, endMinute] = endTime.split(':');
            
            const startDate = new Date(info.date);
            startDate.setHours(parseInt(startHour), parseInt(startMinute));
            
            const endDate = new Date(info.date);
            endDate.setHours(parseInt(endHour), parseInt(endMinute));
            
            const newEvent = {
              id: 'new-' + new Date().getTime(),
              title: title,
              start: startDate,
              end: endDate,
              extendedProps: {
                price: 500,
                trainer: 'Не назначен',
                status: 'scheduled'
              },
              className: 'future_lesson'
            };
            
            calendar.addEvent(newEvent);
          }
        }
      }
    },
    
    select: function(info) {
      console.log('Выбран интервал:', info.startStr, 'до', info.endStr);
      // Здесь можно добавить свою логику для создания нового события
    },
    
    // Обработчик перетаскивания события
    eventDrop: function(info) {
      handleEventChange(
        info.event.id,
        info.event.start,
        info.event.end,
        false // не изменение размера, а перетаскивание
      );
    },
    
    // Обработчик изменения размера события
    eventResize: function(info) {
      handleEventChange(
        info.event.id,
        info.event.start,
        info.event.end,
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
  
  // Экспортируем методы для внешнего использования
  window.addCalendarEvent = function(eventData){
    calendar.addEvent(eventData);
  }
  
  window.removeCalendarEvent = function(eventId){
    const event = calendar.getEventById(eventId);
    if (event){
      event.remove();
    }
  }
  
  window.updateCalendarEvent = function(eventId, updatedData){
    const event = calendar.getEventById(eventId);
    if (event){
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
  }
});