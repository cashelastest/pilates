// Моки данных для страницы групп

// Данные о группах
const MOCK_GROUPS = [
    {
        id: 1,
        name: "Початківці",
        coach_id: 1,
        coach_name: "Олена Петренко",
        status: true,
        description: "Група для початківців, які тільки знайомляться з пілатесом. Підходить для новачків будь-якого віку та фізичної підготовки.",
        members_count: 8,
        members: [
            { id: 1, name: "Марія Коваленко" },
            { id: 2, name: "Олександр Шевченко" },
            { id: 3, name: "Ірина Мельник" },
            { id: 5, name: "Анна Бойко" },
            { id: 7, name: "Дмитро Лисенко" },
            { id: 9, name: "Валентина Ткаченко" },
            { id: 12, name: "Тетяна Кравченко" },
            { id: 15, name: "Микола Пономаренко" }
        ]
    },
    {
        id: 2,
        name: "Середній рівень",
        coach_id: 1,
        coach_name: "Олена Петренко",
        status: true,
        description: "Група для тих, хто вже має досвід занять пілатесом. Заняття орієнтовані на вдосконалення техніки та підвищення інтенсивності.",
        members_count: 6,
        members: [
            { id: 4, name: "Сергій Ковальчук" },
            { id: 6, name: "Наталія Іваненко" },
            { id: 8, name: "Олег Морозенко" },
            { id: 10, name: "Юлія Даниленко" },
            { id: 13, name: "Віктор Савченко" },
            { id: 14, name: "Оксана Петренко" }
        ]
    },
    {
        id: 3,
        name: "Просунутий рівень",
        coach_id: 2,
        coach_name: "Іван Сидоренко",
        status: true,
        description: "Група для досвідчених учасників з високим рівнем фізичної підготовки. Складні вправи та інтенсивні тренування.",
        members_count: 4,
        members: [
            { id: 11, name: "Максим Козаченко" },
            { id: 16, name: "Катерина Іванова" },
            { id: 17, name: "Андрій Павленко" },
            { id: 18, name: "Лідія Романенко" }
        ]
    },
    {
        id: 4,
        name: "Пілатес для вагітних",
        coach_id: 3,
        coach_name: "Анна Ковальчук",
        status: true,
        description: "Спеціальна група для вагітних жінок. Безпечні та корисні вправи з урахуванням особливостей організму під час вагітності.",
        members_count: 5,
        members: [
            { id: 19, name: "Марина Степаненко" },
            { id: 20, name: "Вікторія Захарчук" },
            { id: 21, name: "Юлія Броварчук" },
            { id: 22, name: "Олена Сомова" },
            { id: 23, name: "Світлана Томенко" }
        ]
    },
    {
        id: 5,
        name: "Реабілітаційний пілатес",
        coach_id: 2,
        coach_name: "Іван Сидоренко",
        status: true,
        description: "Група для людей, які відновлюються після травм або мають проблеми з опорно-руховим апаратом. Індивідуальний підхід і помірні навантаження.",
        members_count: 4,
        members: [
            { id: 24, name: "Володимир Семенко" },
            { id: 25, name: "Лариса Петрова" },
            { id: 26, name: "Михайло Чорний" },
            { id: 27, name: "Надія Білоус" }
        ]
    },
    {
        id: 6,
        name: "Пілатес 55+",
        coach_id: 3,
        coach_name: "Анна Ковальчук",
        status: false,
        description: "Група для людей старшого віку. Вправи для покращення гнучкості, зміцнення м'язів і поліпшення загального самопочуття.",
        members_count: 0,
        members: []
    }
];

// Данные о занятиях групп
const MOCK_GROUP_LESSONS = {
    1: [ // Уроки для группы с ID 1
        {
            id: 101,
            title: "Початківці",
            date: "2023-05-15",
            start_time: "18:00:00",
            end_time: "19:30:00",
            coach_name: "Олена Петренко",
            price: 300,
            is_cancelled: false
        },
        {
            id: 102,
            title: "Початківці",
            date: "2023-05-17",
            start_time: "18:00:00",
            end_time: "19:30:00",
            coach_name: "Олена Петренко",
            price: 300,
            is_cancelled: false
        },
        {
            id: 103,
            title: "Початківці",
            date: "2023-05-20",
            start_time: "10:00:00",
            end_time: "11:30:00",
            coach_name: "Олена Петренко",
            price: 300,
            is_cancelled: true,
            cancel_reason: "Тренер захворів"
        },
        {
            id: 104,
            title: "Початківці",
            date: "2023-05-22",
            start_time: "18:00:00",
            end_time: "19:30:00",
            coach_name: "Олена Петренко",
            price: 300,
            is_cancelled: false
        }
    ],
    2: [ // Уроки для группы с ID 2
        {
            id: 201,
            title: "Середній рівень",
            date: "2023-05-16",
            start_time: "19:00:00",
            end_time: "20:30:00",
            coach_name: "Олена Петренко",
            price: 350,
            is_cancelled: false
        },
        {
            id: 202,
            title: "Середній рівень",
            date: "2023-05-18",
            start_time: "19:00:00",
            end_time: "20:30:00",
            coach_name: "Олена Петренко",
            price: 350,
            is_cancelled: false
        }
    ],
    3: [ // Уроки для группы с ID 3
        {
            id: 301,
            title: "Просунутий рівень",
            date: "2023-05-15",
            start_time: "20:00:00",
            end_time: "21:30:00",
            coach_name: "Іван Сидоренко",
            price: 400,
            is_cancelled: false
        },
        {
            id: 302,
            title: "Просунутий рівень",
            date: "2023-05-19",
            start_time: "20:00:00",
            end_time: "21:30:00",
            coach_name: "Іван Сидоренко",
            price: 400,
            is_cancelled: false
        }
    ],
    4: [ // Уроки для группы с ID 4
        {
            id: 401,
            title: "Пілатес для вагітних",
            date: "2023-05-16",
            start_time: "11:00:00",
            end_time: "12:00:00",
            coach_name: "Анна Ковальчук",
            price: 350,
            is_cancelled: false
        },
        {
            id: 402,
            title: "Пілатес для вагітних",
            date: "2023-05-20",
            start_time: "11:00:00",
            end_time: "12:00:00",
            coach_name: "Анна Ковальчук",
            price: 350,
            is_cancelled: false
        }
    ],
    5: [ // Уроки для группы с ID 5
        {
            id: 501,
            title: "Реабілітаційний пілатес",
            date: "2023-05-15",
            start_time: "15:00:00",
            end_time: "16:00:00",
            coach_name: "Іван Сидоренко",
            price: 400,
            is_cancelled: false
        },
        {
            id: 502,
            title: "Реабілітаційний пілатес",
            date: "2023-05-17",
            start_time: "15:00:00",
            end_time: "16:00:00",
            coach_name: "Іван Сидоренко",
            price: 400,
            is_cancelled: false
        },
        {
            id: 503,
            title: "Реабілітаційний пілатес",
            date: "2023-05-19",
            start_time: "15:00:00",
            end_time: "16:00:00",
            coach_name: "Іван Сидоренко",
            price: 400,
            is_cancelled: true,
            cancel_reason: "Технічні причини"
        }
    ],
    6: [] // Пустой массив для группы 6 (неактивная)
};

// Данные о тренерах
const MOCK_COACHES = [
    { id: 1, name: "Олена Петренко" },
    { id: 2, name: "Іван Сидоренко" },
    { id: 3, name: "Анна Ковальчук" }
];

// Данные о клиентах, которые можно добавить в группу
const MOCK_AVAILABLE_CLIENTS = [
    { id: 28, name: "Роман Гончаренко" },
    { id: 29, name: "Софія Вернидуб" },
    { id: 30, name: "Артем Зеленський" },
    { id: 31, name: "Валерія Соколова" },
    { id: 32, name: "Богдан Кириленко" },
    { id: 33, name: "Олександра Руденко" },
    { id: 34, name: "Павло Назаренко" },
    { id: 35, name: "Людмила Войтенко" }
];

// API коды для работы с группами
const GROUP_API_CODES = {
    // Получение данных
    GET_GROUPS: 300,
    GET_GROUP_DETAILS: 301,
    GET_GROUP_MEMBERS: 302,
    GET_GROUP_LESSONS: 303,
    GET_CLIENTS_DATA:304,
    GET_COACHES: 305,
    
    // Ответы сервера
    GROUPS_DATA: 310,
    GROUP_DETAILS: 311,
    GROUP_MEMBERS: 312,
    GROUP_LESSONS: 313,
    CLIENTS_DATA:314,
    COACH_DETAILS: 315,
    
    // Операции с группами
    CREATE_GROUP: 320,
    UPDATE_GROUP: 321,
    DELETE_GROUP: 322,
    
    // Операции с участниками группы
    ADD_MEMBER: 330,
    REMOVE_MEMBER: 331,
    
    // Операции с занятиями группы
    ADD_GROUP_LESSON: 340,
    CANCEL_GROUP_LESSON: 341,
    
    // Общие коды
    SUCCESS: 200
};