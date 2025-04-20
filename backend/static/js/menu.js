document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.querySelector('.menu-btn');
    const hamburger = document.querySelector('.hamburger');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    let isOpen = false;
    
    menuBtn.addEventListener('click', function() {
        isOpen = !isOpen;
        
        if (isOpen) {
            hamburger.classList.add('active');
            dropdownMenu.classList.add('active');
            menuBtn.setAttribute('aria-label', 'Закрити меню');
        } else {
            hamburger.classList.remove('active');
            dropdownMenu.classList.remove('active');
            menuBtn.setAttribute('aria-label', 'Відкрити меню');
        }
    });
    
    // Закрытие меню при клике на пункт меню
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            hamburger.classList.remove('active');
            dropdownMenu.classList.remove('active');
            isOpen = false;
            menuBtn.setAttribute('aria-label', 'Відкрити меню');
        });
    });
});
