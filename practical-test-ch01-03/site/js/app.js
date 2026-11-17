// Câu 2: viết JavaScript tại đây

const API_URL = 'http://localhost:4000';

// Hàm có sẵn: đổi giờ UTC sang giờ Việt Nam, vd "08:00 12/09/2026"
const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

const searchForm = document.getElementById('search-form');
const keywordInput = document.getElementById('keyword');
const statusEl = document.getElementById('status');
const eventListEl = document.getElementById('event-list');

/**
 * Định dạng thông tin số chỗ còn lại của sự kiện.
 */
const formatSeats = (event) => {
  const remaining = event.capacity - event.registeredCount;
  if (remaining <= 0) {
    return 'Hết chỗ';
  }
  return `Còn ${remaining}/${event.capacity} chỗ`;
};

const createTextElement = (tag, text, className) => {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  el.textContent = text;
  return el;
};

/**
 * Tạo một phần tử <article> biểu diễn thẻ sự kiện.
 */
const createEventCard = (event) => {
  const article = document.createElement('article');
  article.className = 'event-card';

  const img = document.createElement('img');
  img.setAttribute('src', 'img/event.svg');
  img.setAttribute('alt', event.name);

  const body = document.createElement('div');
  body.className = 'event-card-body';

  const title = document.createElement('h2');
  title.className = 'event-title';
  const link = document.createElement('a');
  link.setAttribute('href', `event-detail.html?id=${encodeURIComponent(event.id)}`);
  link.textContent = event.name;
  title.append(link);

  const meta = document.createElement('p');
  meta.className = 'event-meta';
  const time = document.createElement('time');
  time.setAttribute('datetime', event.startTime);
  time.textContent = formatDateTime(event.startTime);
  meta.append(time);

  const location = createTextElement('p', event.location, 'event-location');

  const seatText = formatSeats(event);
  const isFull = seatText === 'Hết chỗ';
  const seats = createTextElement(
    'p',
    seatText,
    isFull ? 'event-seats is-full' : 'event-seats'
  );

  body.append(title, meta, location, seats);
  article.append(img, body);
  return article;
};

/**
 * Hiển thị danh sách sự kiện ra #event-list bằng replaceChildren.
 */
const renderEvents = (events) => {
  const cards = events.map(createEventCard);
  eventListEl.replaceChildren(...cards);
};

/**
 * Tải danh sách sự kiện từ API theo từ khoá tìm kiếm.
 */
const loadEvents = async (keyword = '') => {
  statusEl.textContent = 'Đang tải…';

  const params = new URLSearchParams({ pageSize: '50' });
  if (keyword) {
    params.set('q', keyword);
  }

  try {
    const response = await fetch(`${API_URL}/api/events?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];
    renderEvents(items);

    statusEl.textContent =
      items.length === 0
        ? 'Không có sự kiện nào khớp từ khoá.'
        : `Tìm thấy ${items.length} sự kiện`;
  } catch {
    statusEl.textContent = 'Không tải được dữ liệu, vui lòng thử lại.';
  }
};

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const keyword = keywordInput.value.trim();
  loadEvents(keyword);
});

loadEvents();
