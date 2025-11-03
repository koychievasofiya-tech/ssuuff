document.addEventListener('DOMContentLoaded', () => {

    /* ------------------- */
    /* 1. Эффект "Стеклянной" шапки при скролле */
    /* ------------------- */
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    /* ------------------- */
    /* 2. Анимация появления элементов при скролле */
    /* ------------------- */
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    const observerOptions = {
        root: null,
        threshold: 0.1
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    };

    const revealObserver = new IntersectionObserver(observerCallback, observerOptions);
    revealElements.forEach(el => {
        revealObserver.observe(el);
    });


    /* ------------------- */
    /* 3. Логика карусели "Свежие проекты" (Wheel + Swipe) */
    /* ------------------- */
    const container = document.querySelector('.carousel-container');
    const wrapper = document.querySelector('.carousel-wrapper');
    const items = document.querySelectorAll('.carousel-item');
    const totalItems = items.length;

    if (container && wrapper && items.length > 0) {
        
        // --- ОБЩИЕ ПЕРЕМЕННЫЕ СОСТОЯНИЯ ---
        let currentIndex = Math.floor(totalItems / 2); // Начнем с середины
        let currentOffset = 0; // Текущее смещение wrapper'а
        
        // --- ПЕРЕМЕННЫЕ ДЛЯ КОЛЕСА МЫШИ ---
        let isWheeling = false;
        let wheelTimeout;

        // --- ПЕРЕМЕННЫЕ ДЛЯ СВАЙПА/ПЕРЕТАСКИВАНИЯ ---
        let isDragging = false;
        let startX = 0;
        let startTranslate = 0; // Начальная позиция wrapper'а при перетаскивании

        // --- ОСНОВНАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ ---
        // Обновляет позицию карусели, центрируя 'currentIndex'
        const updateCarousel = () => {
            const containerWidth = container.offsetWidth;
            const currentItem = items[currentIndex];
            const itemWidth = currentItem.offsetWidth;
            
            const itemStyle = window.getComputedStyle(currentItem);
            const marginLeft = parseFloat(itemStyle.marginLeft);
            const marginRight = parseFloat(itemStyle.marginRight);
            const totalItemWidth = itemWidth + marginLeft + marginRight;

            // Считаем смещение, чтобы отцентрировать активный элемент
            let offset = (containerWidth / 2) - (itemWidth / 2) - (currentIndex * totalItemWidth);

            // Сохраняем смещение для логики перетаскивания
            currentOffset = offset;
            
            // Применяем плавный переход (если он не был отключен)
            if (wrapper.style.transition === 'none') {
                wrapper.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)';
            }
            wrapper.style.transform = `translateX(${offset}px)`;

            // Обновляем классы
            items.forEach((item, index) => {
                if (index === currentIndex) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        };

        // --- ЛОГИКА ПРОКРУТКИ КОЛЕСОМ МЫШИ ---
        container.addEventListener('wheel', (e) => {
            const direction = e.deltaY > 0 ? 'down' : 'up';

            // "Отпускаем" скролл, если достигли краев
            if ((direction === 'up' && currentIndex === 0) || 
                (direction === 'down' && currentIndex === totalItems - 1)) {
                return; // Позволяем странице скроллиться
            }

            e.preventDefault(); // Захватываем скролл для карусели
            if (isWheeling) return;
            isWheeling = true;

            if (direction === 'down') {
                if (currentIndex < totalItems - 1) currentIndex++;
            } else {
                if (currentIndex > 0) currentIndex--;
            }

            updateCarousel();

            clearTimeout(wheelTimeout);
            wheelTimeout = setTimeout(() => {
                isWheeling = false;
            }, 200); // "Передышка"
        });

        // --- ЛОГИКА СВАЙПА И ПЕРЕТАСКИВАНИЯ ---

        const dragStart = (e) => {
            // Не даем начать перетаскивание, если идет прокрутка колесом
            if (isWheeling) return; 
            
            isDragging = true;
            startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            
            // Запоминаем текущую позицию
            startTranslate = currentOffset; 
            
            // Отключаем плавный переход, чтобы карусель "прилипла" к курсору
            wrapper.style.transition = 'none';
            container.style.cursor = 'grabbing';
            
            // e.preventDefault() нужен для touchstart, чтобы предотвратить скролл страницы
            if (e.type === 'touchstart') e.preventDefault();
        };

        container.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });
        
        const dragging = (e) => {
            if (!isDragging) return;

            // e.preventDefault() нужен для touchmove
            if (e.type === 'touchmove') e.preventDefault();

            const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const deltaX = currentX - startX;

            // Двигаем wrapper вслед за курсором/пальцем
            wrapper.style.transform = `translateX(${startTranslate + deltaX}px)`;
        };

        const dragEnd = (e) => {
            if (!isDragging) return;

            isDragging = false;
            container.style.cursor = 'grab';

            // Включаем плавный переход обратно для "привязки"
            wrapper.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)';

            const endX = e.type.includes('touch') ? e.changedTouches[0].clientX : e.clientX;
            const deltaX = endX - startX;
            const threshold = 50; // Порог в 50px для срабатывания свайпа

            // Определяем, нужно ли переключить слайд
            if (deltaX < -threshold && currentIndex < totalItems - 1) {
                // Свайп влево (следующий слайд)
                currentIndex++;
            } else if (deltaX > threshold && currentIndex > 0) {
                // Свайп вправо (предыдущий слайд)
                currentIndex--;
            }

            // Вызываем updateCarousel, чтобы "привязать" карусель к 
            // новому (или старому, если порог не пройден) индексу
            updateCarousel();
        };

        // Навешиваем обработчики
        container.addEventListener('mousedown', dragStart);
        container.addEventListener('mousemove', dragging);
        container.addEventListener('mouseup', dragEnd);
        container.addEventListener('mouseleave', dragEnd); // Если мышь ушла за пределы

        // Обработчики для сенсорных экранов
        // { passive: false } важно, чтобы e.preventDefault() работал
        container.addEventListener('touchstart', dragStart, { passive: false });
        container.addEventListener('touchmove', dragging, { passive: false });
        container.addEventListener('touchend', dragEnd);


        // --- ИНИЦИАЛИЗАЦИЯ ---
        setTimeout(updateCarousel, 100); 
        window.addEventListener('resize', updateCarousel);
    }
});