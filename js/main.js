const API_KEY = 'f67e61cb-1981-4ed5-9545-8962853e8763';
const API_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';

//Глоб перем для курсов
let allCourses = []; //Все полученные курсы
let filteredCourses = []; //Курсы после фильтра
let currentPage = 1; //Тек страница
const ITEMS_PER_PAGE = 3; //Сколько показываем курсов на 1 страниице (с 3 более симпатично)
let selectedCourseId = null;
// Глоб перем для тьюторов
let allTutors = [];
let filteredTutors = [];
let currentTutorPage = 1;
const TUTOR_ITEMS_PER_PAGE = 3;


// Показ уведомления
function showNotification(message, type = 'info') {
  const area = document.getElementById('notification-area');
  if (!area) return;

  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.role = 'alert';
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  area.appendChild(alert);

  setTimeout(() => {
    if (alert.parentNode) alert.remove();
  }, 5000);
}

// Загрузка курсов с API
async function loadCourses() {
  try {
    const res = await fetch(`${API_URL}/courses?api_key=${API_KEY}`);
    if (!res.ok) throw new Error('Ошибка сети');
    allCourses = await res.json();
    filteredCourses = [...allCourses]; // Пока без фильтрации — копируем всё
    currentPage = 1;
    renderCourses();
    renderPagination();
  } catch (err) {
    console.error(err);
    showNotification('Не удалось загрузить курсы', 'danger');
  }
}

// Отображение курсов (текущая страница)
function renderCourses() {
  const container = document.getElementById('courses-list');
  if (!container) return;

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageCourses = filteredCourses.slice(start, end);

  if (pageCourses.length === 0) {
    container.innerHTML = '<p class="text-center text-muted py-5">Курсы не найдены</p>';
    return;
  }

  container.innerHTML = pageCourses.map(course => `
    <div class="course-card border rounded p-3 mb-3">
      <h5>${course.name}</h5>
      <p class="text-muted">${course.description}</p>
      <p><strong>Преподаватель:</strong> ${course.teacher}</p>
      <p><strong>Уровень:</strong> ${course.level}</p>
      <p><strong>Длительность:</strong> ${course.total_length} недель (${course.week_length} ч/нед)</p>
      <button class="btn btn-sm btn-primary" onclick="openOrderModal(${course.id})">
        Подать заявку
      </button>
    </div>
  `).join('');
}

// Пагинация
function renderPagination() {
  const container = document.getElementById('courses-pagination');
  if (!container) return;

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<nav aria-label="Пагинация"><ul class="pagination justify-content-center">`;

  // Кнопка "Назад"
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">&laquo;</a>
          </li>`;

  // Страницы
  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
              <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>`;
  }

  // Кнопка "Вперёд"
  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">&raquo;</a>
          </li>`;

  html += `</ul></nav>`;
  container.innerHTML = html;
}

// Смена страницы
function changePage(page) {
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderCourses();
    renderPagination();
    document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
  }
}

// Поиск курсов
function searchCourses() {
  const nameInput = document.getElementById('course-search')?.value.toLowerCase().trim() || '';
  const levelSelect = document.getElementById('course-level-filter')?.value || '';

  filteredCourses = allCourses.filter(course => {
    const matchesName = !nameInput ||
      course.name.toLowerCase().includes(nameInput) ||
      course.description.toLowerCase().includes(nameInput) ||
      course.teacher.toLowerCase().includes(nameInput);
    const matchesLevel = !levelSelect || course.level === levelSelect;
    return matchesName && matchesLevel;
  });
  // После фильтрации всегда возвращаемся на первую страницу
  currentPage = 1;
  renderCourses();
  renderPagination();
}

// Открытие модального окна
function openOrderModal(courseId) {
  const course = allCourses.find(c => c.id === courseId);
  if (!course) return;
  selectedCourseId = courseId;
  // 1. Заполняем информацию о курсе
  document.getElementById('modal-course-info').innerHTML = `
    <strong>${course.name}</strong><br>
    Преподаватель: ${course.teacher}<br>
    Уровень: ${course.level}
  `;

  // 2. Определяем язык курса по названию
  const courseNameLower = course.name.toLowerCase();
  let courseLanguage = null;
  if (courseNameLower.includes('английск') || courseNameLower.includes('english')) courseLanguage = 'English';
  else if (courseNameLower.includes('немецк') || courseNameLower.includes('german')) courseLanguage = 'German';
  else if (courseNameLower.includes('французск') || courseNameLower.includes('french')) courseLanguage = 'French';
  else if (courseNameLower.includes('испанск') || courseNameLower.includes('spanish')) courseLanguage = 'Spanish';
  else if (courseNameLower.includes('китайск') || courseNameLower.includes('chinese')) courseLanguage = 'Chinese';
  else if (courseNameLower.includes('японск') || courseNameLower.includes('japanese')) courseLanguage = 'Japanese';

  // 3. Фильтруем репетиторов по языку
  let relevantTutors = allTutors;
  if (courseLanguage) {
    relevantTutors = allTutors.filter(tutor =>
      Array.isArray(tutor.languages_offered) && tutor.languages_offered.includes(courseLanguage)
    );
  }

  // 4. Обновляем таблицу репетиторов (временно — можно вынести в отдельный блок)
  const tutorList = document.getElementById('tutors-list');
  if (tutorList && relevantTutors.length > 0) {
    const firstTutor = relevantTutors[0];
    document.getElementById('modal-tutor-info').innerHTML = `
      Имя: ${firstTutor.name}<br>
      Языки: ${(firstTutor.languages_offered || []).join(', ')}<br>
      Опыт: ${firstTutor.work_experience} лет
    `;
  } else {
    document.getElementById('modal-tutor-info').innerHTML = '<span class="text-muted">Нет подходящих репетиторов</span>';
  }

  // 5. Заполняем даты из start_dates
  const dateSelect = document.getElementById('order-date');
  dateSelect.innerHTML = '<option value="">Выберите дату</option>';
  const uniqueDates = [...new Set(course.start_dates.map(dt => dt.split('T')[0]))].sort();
  uniqueDates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = new Date(date).toLocaleDateString('ru-RU');
    dateSelect.appendChild(option);
  });

  // 6. Сбрасываем время и студентов
  document.getElementById('order-time').innerHTML = '<option value="">Сначала выберите дату</option>';
  document.getElementById('order-time').disabled = true;
  document.getElementById('order-students').value = 1;

  // 7. Обновляем продолжительность
  document.getElementById('order-duration-info').textContent =
    `${course.total_length} недель (${course.week_length} ч/нед)`;

  // 8. Открываем модальное окно
  const modal = new bootstrap.Modal(document.getElementById('orderModal'));
  modal.show();
}





/////РЕПЕТИТОРЫ НАЧАЛО ЗДЕЕЕЕСЬ//////




// Загрузка репетиторов
async function loadTutors() {
  try {
    const res = await fetch(`${API_URL}/tutors?api_key=${API_KEY}`);
    if (!res.ok) throw new Error('Ошибка сети');
    allTutors = await res.json();
    filteredTutors = [...allTutors];
    
    // Заполним выпадающий список языков
    populateLanguageFilter(allTutors);
    
    currentTutorPage = 1;
    renderTutors();
    renderTutorPagination();
  } catch (err) {
    console.error('Ошибка загрузки репетиторов:', err);
    showNotification('Не удалось загрузить репетиторов', 'danger');
  }
}

// Заполнение списка языков в фильтре
function populateLanguageFilter(tutors) {
  const select = document.getElementById('tutor-language-filter');
  if (!select) return;

  const languages = new Set();
  tutors.forEach(tutor => {
    // Используем languages_offered (предлагаемые языки)
    if (Array.isArray(tutor.languages_offered)) {
      tutor.languages_offered.forEach(lang => {
        languages.add(lang.trim());
      });
    }
  });

  select.innerHTML = '<option value="">все языки</option>';
  
  Array.from(languages)
    .sort()
    .forEach(lang => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = lang;
      select.appendChild(option);
    });
}

// Отображение репетиторов
function renderTutors() {
  const container = document.getElementById('tutors-list');
  if (!container) return;

  const start = (currentTutorPage - 1) * TUTOR_ITEMS_PER_PAGE;
  const end = start + TUTOR_ITEMS_PER_PAGE;
  const pageTutors = filteredTutors.slice(start, end);

  if (pageTutors.length === 0) {
    container.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Репетиторы не найдены</td></tr>`;
    return;
  }

  container.innerHTML = pageTutors.map(tutor => {
    // Формируем строку языков
    const languagesStr = Array.isArray(tutor.languages_offered) 
      ? tutor.languages_offered.join(', ') 
      : '—';
    //Для фото - заглушка
    return `
      <tr>
        <td><img src="https://via.placeholder.com/50" alt="Фото" class="rounded"></td> 
        <td>${tutor.name}</td>
        <td>${tutor.language_level}</td>
        <td>${languagesStr}</td>
        <td>${tutor.work_experience} лет</td>
        <td>${tutor.price_per_hour} руб/час</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="requestTutor(${tutor.id})">
            Выбрать
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Поиск репетиторов
function searchTutors() {
  const language = document.getElementById('tutor-language-filter')?.value || '';
  const level = document.getElementById('tutor-level-filter')?.value || '';
  const experienceStr = document.getElementById('tutor-experience-filter')?.value || '';

  const minExperience = experienceStr ? parseInt(experienceStr, 10) : 0;

  filteredTutors = allTutors.filter(tutor => {
    // Проверка по языку (в languages_offered)
    const matchesLang = !language ||
      (Array.isArray(tutor.languages_offered) && 
       tutor.languages_offered.includes(language));
    
    // Проверка по уровню
    const matchesLevel = !level || tutor.language_level.toLowerCase() === level;//Приводим к нижнему регистру, чтобы корректно работало
    
    // Проверка по опыту
    const matchesExp = (tutor.work_experience || 0) >= minExperience;
    
    return matchesLang && matchesLevel && matchesExp;
  });

  currentTutorPage = 1;
  renderTutors();
  renderTutorPagination();
}

// Пагинация репетиторов
function renderTutorPagination() {
  const container = document.getElementById('tutors-pagination');
  if (!container) return;

  const totalPages = Math.ceil(filteredTutors.length / TUTOR_ITEMS_PER_PAGE);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<nav aria-label="Пагинация"><ul class="pagination justify-content-center">`;

  html += `<li class="page-item ${currentTutorPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeTutorPage(${currentTutorPage - 1}); return false;">&laquo;</a>
          </li>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item ${i === currentTutorPage ? 'active' : ''}">
              <a class="page-link" href="#" onclick="changeTutorPage(${i}); return false;">${i}</a>
            </li>`;
  }

  html += `<li class="page-item ${currentTutorPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeTutorPage(${currentTutorPage + 1}); return false;">&raquo;</a>
          </li>`;

  html += `</ul></nav>`;
  container.innerHTML = html;
}

// Смена страницы репетиторов
function changeTutorPage(page) {
  const totalPages = Math.ceil(filteredTutors.length / TUTOR_ITEMS_PER_PAGE);
  if (page >= 1 && page <= totalPages) {
    currentTutorPage = page;
    renderTutors();
    renderTutorPagination();
    document.getElementById('tutors').scrollIntoView({ behavior: 'smooth' });
  }
}


// Запрос репетитора (заглушка)
function requestTutor(tutorId) {
  const tutor = allTutors.find(t => t.id === tutorId);
  if (!tutor) return;
  alert(`Запрос на сеанс с ${tutor.name} — будет реализован позже.`);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Курсы
  if (document.getElementById('courses-list')) {
    loadCourses();
  }

  // Репетиторы
  if (document.getElementById('tutors-list')) {
    loadTutors();
  }

  // Поиск курсов
  const searchInput = document.getElementById('course-search');
  const levelSelect = document.getElementById('course-level-filter');
  if (searchInput) searchInput.addEventListener('input', searchCourses);
  if (levelSelect) levelSelect.addEventListener('change', searchCourses);

  // Поиск репетиторов
  const langSelect = document.getElementById('tutor-language-filter');
  const tutorLevelSelect = document.getElementById('tutor-level-filter');
  const expInput = document.getElementById('tutor-experience-filter');
  
  if (langSelect) langSelect.addEventListener('change', searchTutors);
  if (tutorLevelSelect) tutorLevelSelect.addEventListener('change', searchTutors);
  if (expInput) expInput.addEventListener('input', searchTutors);
  
  const dateSelect = document.getElementById('order-date');
  if (dateSelect) {
    dateSelect.addEventListener('change', function () {
      const selectedDate = this.value;
      const timeSelect = document.getElementById('order-time');
      const course = allCourses.find(c => c.id === selectedCourseId);

      if (!selectedDate || !course) {
        timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
        timeSelect.disabled = true;
        return;
      }

      const times = course.start_dates
        .filter(dt => dt.startsWith(selectedDate))
        .map(dt => dt.split('T')[1].substring(0, 5))
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort();

      timeSelect.innerHTML = '<option value="">Выберите время</option>';
      times.forEach(time => {
        const opt = document.createElement('option');
        opt.value = time;
        opt.textContent = time;
        timeSelect.appendChild(opt);
      });
      timeSelect.disabled = false;
    });
  }
});