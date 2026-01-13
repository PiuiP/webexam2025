const API_KEY = 'f67e61cb-1981-4ed5-9545-8962853e8763';
const API_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';

let allOrders = [];
let filteredOrders = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

// Глобальные переменные для модальных окон
let currentOrderId = null;
let currentCourseId = null;

// Показ уведомления
function showNotification(message, type = 'info') {
  const area = document.getElementById('notification-area');
  if (!area) return;

  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  area.appendChild(alert);
  setTimeout(() => {
    if (alert.parentNode) alert.remove();
  }, 5000);
}

// Загрузка заявок
async function loadOrders() {
  try {
    const res = await fetch(`${API_URL}/orders?api_key=${API_KEY}`);
    if (!res.ok) throw new Error('Ошибка сети');
    allOrders = await res.json();
    filteredOrders = [...allOrders];
    currentPage = 1;
    renderOrders();
    renderPagination();
  } catch (err) {
    console.error(err);
    showNotification('Не удалось загрузить заявки', 'danger');
    document.getElementById('orders-list').innerHTML = '<tr><td colspan="6" class="text-center text-danger py-5">Ошибка загрузки</td></tr>';
  }
}

// Отображение заявок
function renderOrders() {
  const container = document.getElementById('orders-list');
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageOrders = filteredOrders.slice(start, end);

  if (pageOrders.length === 0) {
    container.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5">Нет заявок</td></tr>';
    return;
  }

  container.innerHTML = pageOrders.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${order.course_name || '—'}</td>
      <td>${new Date(order.date_start).toLocaleDateString('ru-RU')}</td>
      <td>${order.persons}</td>
      <td>${order.price.toLocaleString()} руб</td>
      <td>
        <button class="btn btn-sm btn-info me-1" onclick="showOrderDetails(${order.id})">Подробнее</button>
        <button class="btn btn-sm btn-warning me-1" onclick="showEditForm(${order.id})">Изменить</button>
        <button class="btn btn-sm btn-danger" onclick="showDeleteConfirm(${order.id})">Удалить</button>
      </td>
    </tr>
  `).join('');
}

// Пагинация
function renderPagination() {
  const container = document.getElementById('orders-pagination');
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<ul class="pagination justify-content-center">`;
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">&laquo;</a>
          </li>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
              <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>`;
  }

  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">&raquo;</a>
          </li>`;
  html += '</ul>';
  container.innerHTML = html;
}

function changePage(page) {
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderOrders();
    renderPagination();
  }
}

// Подробности заявки
function showOrderDetails(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  let html = `
    <p><strong>Курс:</strong> ${order.course_name}</p>
    <p><strong>Дата начала:</strong> ${new Date(order.date_start).toLocaleDateString('ru-RU')}</p>
    <p><strong>Время:</strong> ${order.time_start}</p>
    <p><strong>Продолжительность:</strong> ${order.duration} недель</p>
    <p><strong>Количество студентов:</strong> ${order.persons}</p>
    <p><strong>Итоговая стоимость:</strong> ${order.price.toLocaleString()} руб</p>
    <h6 class="mt-3">Опции:</h6>
    <ul>
  `;

  if (order.early_registration) html += '<li>Ранняя регистрация (-10%)</li>';
  if (order.group_enrollment) html += '<li>Групповая запись (-15%)</li>';
  if (order.intensive_course) html += '<li>Интенсивный курс (+20%)</li>';
  if (order.supplementary) html += '<li>Учебные материалы (+2000 руб/студент)</li>';
  if (order.personalized) html += '<li>Индивидуальные занятия</li>';
  if (order.excursions) html += '<li>Культурные экскурсии (+25%)</li>';
  if (order.assessment) html += '<li>Оценка уровня (+300 руб)</li>';
  if (order.interactive) html += '<li>Онлайн-платформа (+50%)</li>';

  html += '</ul>';

  document.getElementById('detail-id').textContent = orderId;
  document.getElementById('detail-content').innerHTML = html;
  
  const detailModal = document.getElementById('detailModal');
  const modal = bootstrap.Modal.getOrCreateInstance(detailModal);
  modal.show();
}

// Форма редактирования
async function showEditForm(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  currentOrderId = orderId;
  currentCourseId = order.course_id;

  document.getElementById('edit-order-id').value = orderId;
  document.getElementById('edit-students').value = order.persons;
  document.getElementById('edit-date').value = order.date_start.split('T')[0];

  // Получаем возможные времена
  const course = await fetchCourseById(order.course_id);
  const timeSelect = document.getElementById('edit-time');
  timeSelect.innerHTML = '';

  if (course) {
    const times = course.start_dates
      .filter(dt => dt.startsWith(order.date_start.split('T')[0]))
      .map(dt => dt.split('T')[1].substring(0, 5))
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();

    times.forEach(time => {
      const opt = document.createElement('option');
      opt.value = time;
      opt.textContent = time;
      timeSelect.appendChild(opt);
    });
    timeSelect.value = order.time_start;
  }

  document.getElementById('edit-id').textContent = orderId;
  const editModal = document.getElementById('editModal');
  const modal = bootstrap.Modal.getOrCreateInstance(editModal);
  modal.show();
}

// Загрузка курса по ID
async function fetchCourseById(courseId) {
  try {
    const res = await fetch(`${API_URL}/courses/${courseId}?api_key=${API_KEY}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Отправка изменений
async function submitEditOrder() {
  const orderId = currentOrderId;
  const students = document.getElementById('edit-students').value;
  const date = document.getElementById('edit-date').value;
  const time = document.getElementById('edit-time').value;

  if (!date || !time) {
    showNotification('Выберите дату и время', 'warning');
    return;
  }

  const updatedOrder = {
    persons: parseInt(students),
    date_start: date,
    time_start: time
  };

  try {
    const res = await fetch(`${API_URL}/orders/${orderId}?api_key=${API_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedOrder)
    });

    if (!res.ok) throw new Error('Ошибка обновления');
    showNotification('Заявка успешно обновлена!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    loadOrders();
  } catch (err) {
    console.error(err);
    showNotification('Не удалось обновить заявку', 'danger');
  }
}

// Подтверждение удаления
function showDeleteConfirm(orderId) {
  currentOrderId = orderId;
  document.getElementById('delete-id').textContent = orderId;
  const deleteModal = document.getElementById('deleteModal');
  const modal = bootstrap.Modal.getOrCreateInstance(deleteModal);
  modal.show();
}

// Удаление заявки
async function confirmDeleteOrder() {
  try {
    const res = await fetch(`${API_URL}/orders/${currentOrderId}?api_key=${API_KEY}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('Ошибка удаления');
    showNotification('Заявка удалена', 'success');
    bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
    loadOrders();
  } catch (err) {
    console.error(err);
    showNotification('Не удалось удалить заявку', 'danger');
  }
}

// Инициализация
document.addEventListener('DOMContentLoaded', loadOrders);