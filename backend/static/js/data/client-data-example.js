// Пример структуры данных клиента, получаемой с сервера

// Код 400 - Получение списка всех клиентов
const clientsListExample = {
    code: 400,
    data: [
      {
        id: 1,
        username: 'olena.kovalchuk',
        full_name: 'Олена Ковальчук',
        is_active: true,
        last_lesson_date: '2025-04-12',
        lessons_used: 16,
        lessons_total: 20,
        subscription_end_date: '2025-04-30'
      },
      {
        id: 2,
        username: 'maksym.honcharenko',
        full_name: 'Максим Гончаренко',
        is_active: true,
        last_lesson_date: '2025-04-11',
        lessons_used: 5,
        lessons_total: 10,
        subscription_end_date: '2025-05-15'
      },
      {
        id: 3,
        username: 'valeriia.pavlenko',
        full_name: 'Валерія Павленко',
        is_active: false,
        last_lesson_date: '2025-03-25',
        lessons_used: 10,
        lessons_total: 10,
        subscription_end_date: '2025-04-01'
      }
    ]
  };
  
  // Код 194 - Получение данных конкретного клиента
  const clientDataExample = {
    code: 194,
    data: {
      id: 1,
      username: 'olena.kovalchuk',
      full_name: 'Олена Ковальчук',
      phone: '+380 98 765 4321',
      email: 'olena.kovalchuk@gmail.com',
      birth_date: '1990-07-15',
      gender: 'female',
      registration_date: '2023-01-01',
      is_active: true,
      comments: 'Надає перевагу ранковим заняттям. Має невеликі проблеми з колінами, потрібен індивідуальний підхід.',
      last_lesson_date: '2025-04-12',
      lessons_used: 16,
      lessons_total: 20,
      subscription_end_date: '2025-04-30'
    }
  };
  
  // Код 198 - Получение абонементов клиента
  const clientSubscriptionsExample = {
    code: 402,
    data: [
      {
        id: 1,
        client_id: 1,
        start_date: '2025-03-01',
        end_date: '2025-04-30',
        lessons_total: 20,
        lessons_used: 16,
        is_active: true,
        price: 9000
      },
      {
        id: 2,
        client_id: 1,
        start_date: '2025-01-01',
        end_date: '2025-02-28',
        lessons_total: 10,
        lessons_used: 10,
        is_active: false,
        price: 5000
      },
      {
        id: 3,
        client_id: 1,
        start_date: '2024-11-01',
        end_date: '2024-12-31',
        lessons_total: 8,
        lessons_used: 8,
        is_active: false,
        price: 4000
      }
    ]
  };
  
  // Код 197 - Получение занятий клиента
  const clientLessonsExample = {
    code: 404,
    data: [
      {
        id: 1,
        client_id: 1,
        group_id: 1,
        group_name: 'Група А',
        lesson_type: 'ранковий пілатес',
        date: '2025-04-12',
        coach_id: 1,
        coach_name: 'Анна Петренко'
      },
      {
        id: 2,
        client_id: 1,
        group_id: 1,
        group_name: 'Група А',
        lesson_type: 'ранковий пілатес',
        date: '2025-04-10',
        coach_id: 1,
        coach_name: 'Анна Петренко'
      },
      {
        id: 3,
        client_id: 1,
        group_id: 2,
        group_name: 'Група Б',
        lesson_type: 'пілатес на реформері',
        date: '2025-04-08',
        coach_id: 2,
        coach_name: 'Олександр Марченко'
      }
    ]
  };
  
  // Код 401 - Создание нового клиента (запрос)
  const createClientRequest = {
    code: 401,
    client: {
      full_name: 'Наталія Коваль',
      phone: '+380 67 123 4567',
      email: 'natalia.koval@gmail.com',
      birth_date: '1985-05-20',
      gender: 'female',
      is_active: true,
      comments: 'Новий клієнт. Раніше займалася йогою.'
    }
  };
  
  // Код 401 - Создание нового клиента (ответ)
  const createClientResponse = {
    code: 200,
    message: 'Клієнт успішно створений',
    client_id: 6
  };
  
  // Код 195 - Обновление данных клиента (запрос)
  const updateClientRequest = {
    code: 402,
    client: {
      id: 1,
      full_name: 'Олена Ковальчук',
      phone: '+380 98 765 4321',
      email: 'olena.kovalchuk@gmail.com',
      birth_date: '1990-07-15',
      gender: 'female',
      is_active: true,
      comments: 'Оновлений коментар. Надає перевагу ранковим заняттям.'
    }
  };
  
  // Код 195 - Обновление данных клиента (ответ)
  const updateClientResponse = {
    code: 200,
    message: 'Дані клієнта оновлено успішно'
  };
  
  // Код 402 - Удаление клиента (запрос)
  const deleteClientRequest = {
    code: 407,
    id: 5
  };
  
  // Код 402 - Удаление клиента (ответ)
  const deleteClientResponse = {
    code: 200,
    message: 'Клієнт успішно видалений'
  };
  
  // Код 199 - Использование абонемента (запрос)
  const useSubscriptionRequest = {
    code: 405,
    sub_id: 1,
    client_name: 'olena.kovalchuk'
  };
  
  // Код 199 - Использование абонемента (ответ)
  const useSubscriptionResponse = {
    code: 200,
    message: 'Заняття успішно додано',
    lessons_used: 17,
    lessons_total: 20
  };