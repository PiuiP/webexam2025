const API_KEY = 'f67e61cb-1981-4ed5-9545-8962853e8763';
const API_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';

// Глобальные переменные
let allCourses = []; //Все полученные курсы
let filteredCourses = []; //Курсы после фильтра
let currentPage = 1; //Тек страница
const ITEMS_PER_PAGE = 3; //Сколько показываем курсов на 1 страниице (с 3 более симпатично)

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
    <div class="border rounded p-3 mb-3">
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

// Открытие модального окна (заглушка — можно расширить позже)
function openOrderModal(courseId) {
  const course = allCourses.find(c => c.id === courseId);
  if (!course) return;
  alert(`Заявка на курс "${course.name}" — функционал будет реализован позже.`);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('courses-list')) {
    loadCourses();
  }

  // Поиск в реальном времени
  const searchInput = document.getElementById('course-search');
  const levelSelect = document.getElementById('course-level-filter');
  if (searchInput) searchInput.addEventListener('input', searchCourses);
  if (levelSelect) levelSelect.addEventListener('change', searchCourses);
});