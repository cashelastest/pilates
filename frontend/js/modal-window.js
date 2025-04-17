// JavaScript для страницы клиентов и модального окна
document.addEventListener('DOMContentLoaded', function() {
    // Элементы модального окна
    const modalOverlay = document.getElementById('clientModal');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelEdit');
    const saveBtn = document.getElementById('saveClient');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Действия, доступные для клиентов (редактирование/удаление)
    const clientActions = document.querySelectorAll('.client-action-btn');
    
    // Кнопка добавления нового клиента
    const addClientBtn = document.querySelector('.action-btn');
    
    // Открывает модальное окно с данными клиента
    function openClientModal(clientId) {
        // В реальном проекте здесь должна быть загрузка данных клиента по ID
        // Для демонстрации используем заглушку
        console.log('Открываем карточку клиента с ID:', clientId);
        
        // Показываем модальное окно
        modalOverlay.classList.add('active');
        
        // Блокируем прокрутку страницы
        document.body.style.overflow = 'hidden';
    }
    
    // Закрывает модальное окно
    function closeClientModal() {
        modalOverlay.classList.remove('active');
        
        // Разблокируем прокрутку страницы
        document.body.style.overflow = '';
        
        // Сбрасываем активную вкладку на первую
        resetTabs();
    }
    
    // Сбрасывает вкладки на исходное состояние
    function resetTabs() {
        tabs.forEach((tab, index) => {
            if (index === 0) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        tabContents.forEach((content, index) => {
            if (index === 0) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }
    
    // Переключение между вкладками
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Убираем активный класс у всех вкладок
            tabs.forEach(t => t.classList.remove('active'));
            
            // Добавляем активный класс текущей вкладке
            this.classList.add('active');
            
            // Получаем ID содержимого вкладки
            const tabId = this.getAttribute('data-tab') + '-tab';
            
            // Скрываем всё содержимое вкладок
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Показываем содержимое активной вкладки
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Обработчик нажатия на кнопку закрытия модального окна
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeClientModal);
    }
    
    // Обработчик нажатия на кнопку отмены
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeClientModal);
    }
    
    // Обработчик нажатия на кнопку сохранения
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            // Здесь должен быть код для сохранения данных формы
            // Для демонстрации просто закрываем модальное окно
            alert('Данные клиента сохранены');
            closeClientModal();
        });
    }
    
    // Обработчик нажатия на кнопки действий для клиентов
    clientActions.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Получаем ID клиента из атрибута data-id
            const clientId = this.closest('tr').getAttribute('data-id') || '1';
            
            // Определяем тип действия (edit или delete)
            const isEdit = this.querySelector('svg path').getAttribute('d').includes('M11 4H4');
            
            if (isEdit) {
                openClientModal(clientId);
            } else {
                if (confirm('Вы уверены, что хотите удалить этого клиента?')) {
                    console.log('Удаляем клиента с ID:', clientId);
                    // Здесь должен быть код для удаления клиента
                    // Для демонстрации просто обновляем страницу
                    alert('Клиент удален');
                }
            }
        });
    });
    
    // Обработчик нажатия на кнопку добавления нового клиента
    if (addClientBtn) {
        addClientBtn.addEventListener('click', function() {
            // Здесь должен быть код для открытия модального окна с пустой формой
            // Для демонстрации просто открываем существующее модальное окно
            openClientModal('new');
        });
    }
    
    // Добавляем обработчик клика для строк таблицы клиентов
    const clientRows = document.querySelectorAll('.clients-table tbody tr');
    clientRows.forEach(row => {
        row.addEventListener('click', function(e) {
            // Игнорируем клик по кнопкам действий
            if (e.target.closest('.client-action-btn')) {
                return;
            }
            
            // Получаем ID клиента из атрибута data-id
            const clientId = this.getAttribute('data-id') || '1';
            
            // Открываем модальное окно с данными клиента
            openClientModal(clientId);
        });
        
        // Добавляем атрибут для улучшения UX
        row.style.cursor = 'pointer';
    });
    
    // Закрытие модального окна при клике на оверлей
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeClientModal();
            }
        });
    }
    
    // Добавляем обработчик для поиска клиентов
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            clientRows.forEach(row => {
                const clientName = row.querySelector('.client-name').textContent.toLowerCase();
                
                if (clientName.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Обработчик для кнопки фильтров
    const filterBtn = document.querySelector('.filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            // Здесь можно добавить логику открытия выпадающего меню с фильтрами
            alert('Функционал фильтров будет реализован позже');
        });
    }
    
    // Обработка пагинации
    const paginationBtns = document.querySelectorAll('.page-btn, .page-nav');
    paginationBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок пагинации
            document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
            
            // Если это кнопка с номером страницы, делаем ее активной
            if (this.classList.contains('page-btn')) {
                this.classList.add('active');
            }
            
            // В реальном проекте здесь бы была загрузка соответствующей страницы клиентов
            console.log('Переход на страницу:', this.textContent.trim());
        });
    });
    
    // Обработка сортировки таблицы при клике на заголовок
    const tableHeaders = document.querySelectorAll('.clients-table th');
    tableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            // Получаем название колонки для сортировки
            const columnName = this.textContent.trim();
            
            // В реальном проекте здесь бы была логика сортировки таблицы
            console.log('Сортировка по колонке:', columnName);
            
            // Меняем направление сортировки
            const currentDirection = this.getAttribute('data-sort') || 'asc';
            const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
            
            // Сбрасываем направление сортировки для всех заголовков
            tableHeaders.forEach(h => h.removeAttribute('data-sort'));
            
            // Устанавливаем новое направление сортировки для текущего заголовка
            this.setAttribute('data-sort', newDirection);
            
            // Для демонстрации просто показываем сообщение
            alert(`Сортировка по ${columnName} (${newDirection === 'asc' ? 'по возрастанию' : 'по убыванию'})`);
        });
        
        // Добавляем стиль курсора для заголовков таблицы
        header.style.cursor = 'pointer';
    });
    
    // Функция для экспорта данных
    function exportClientData(format) {
        // В реальном проекте здесь был бы код для экспорта данных в разных форматах
        console.log(`Экспорт данных в формате ${format}`);
        alert(`Данные клиентов экспортированы в формате ${format}`);
    }
    
    // Обработчик для кнопки экспорта
    const exportBtn = document.querySelectorAll('.action-btn')[1]; // Вторая кнопка - экспорт
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            // Для демонстрации просто вызываем функцию экспорта с форматом CSV
            exportClientData('CSV');
        });
    }
    
    // Обработка клавиш для модального окна
    document.addEventListener('keydown', function(e) {
        if (modalOverlay && modalOverlay.classList.contains('active')) {
            // Закрываем модальное окно при нажатии на Escape
            if (e.key === 'Escape') {
                closeClientModal();
            }
        }
    });
});