document.addEventListener('DOMContentLoaded', function() {
  // Получаем элементы модальных окон
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
  
  // Обновление выпадающих списков
  function updateDropdownLists(data) {
    console.log("Обновление выпадающих списков с данными:", data);
    
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
  
  // Добавление обработчика сообщений WebSocket для получения данных
  if (window.webSocketMessages) {
    // Сохраняем оригинальную функцию
    const originalWebSocketMessages = window.webSocketMessages;
    
    // Заменяем на новую, которая будет обрабатывать и сообщения для абонементов
    window.webSocketMessages = function(data) {
      // Вызываем оригинальную функцию
      originalWebSocketMessages(data);
      console.log("works")
      
      // Обрабатываем сообщения для абонементов
      switch (data.code) {
        case 293: // Код для получения данных для выпадающих списков
          console.log("Получены данные для выпадающих списков:", data.data);
          updateDropdownLists(data.data);
          break;
      }
    };
  }
});