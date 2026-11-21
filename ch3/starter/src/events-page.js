// Trang lịch sự kiện: tải danh sách từ API, tìm theo tên, lọc theo CLB.
// Bộ lọc được ghi lên URL (?q=…&clubId=…) để tải lại trang hay gửi link cho bạn vẫn giữ kết quả.
import { getClubs, getEvents } from './api.js';
import { el, renderEventList, renderStatus } from './render.js';
import { debounce } from './utils/debounce.js';

const SEARCH_DELAY_MS = 300;

const filterForm = document.querySelector('.filters');
const searchInput = document.querySelector('#search');
const clubSelect = document.querySelector('#club-filter');
const eventList = document.querySelector('#event-list');
const resultCount = document.querySelector('#result-count');

/** id CLB → tên CLB, để card hiện "CLB Tin học" thay vì một chuỗi UUID */
const clubNames = new Map();
let currentController = null;

// ---- URL search params ----

function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get('q') ?? '',
    clubId: params.get('clubId') ?? '',
  };
}

function readFiltersFromForm() {
  return { q: searchInput.value.trim(), clubId: clubSelect.value };
}

function writeFiltersToUrl({ q, clubId }) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (clubId) params.set('clubId', clubId);
  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState(null, '', nextUrl);
}

// ---- Câu lạc bộ ----

async function loadClubs() {
  try {
    for (const club of await getClubs()) {
      clubNames.set(club.id, club.name);
      clubSelect.append(el('option', { text: club.name, attrs: { value: club.id } }));
    }
  } catch (error) {
    // Thiếu danh sách CLB chỉ làm mất bộ lọc, trang vẫn xem được sự kiện
    console.warn('Không tải được danh sách CLB:', error.message);
  }
}

// ---- Sự kiện ----

async function loadEvents() {
  const filters = readFiltersFromForm();
  writeFiltersToUrl(filters);

  if (currentController) currentController.abort();
  currentController = new AbortController();
  const { signal } = currentController;

  renderStatus(eventList, 'loading', 'Đang tải sự kiện…');
  try {
    const page = await getEvents(filters, signal);
    if (page.items.length === 0) {
      resultCount.textContent = '';
      renderStatus(eventList, 'empty', 'Không có sự kiện nào khớp với bộ lọc hiện tại.');
      return;
    }
    resultCount.textContent = `Tìm thấy ${page.totalCount} sự kiện`;
    renderEventList(eventList, page.items, clubNames);
  } catch (error) {
    if (error.name === 'AbortError') return;
    resultCount.textContent = '';
    renderStatus(eventList, 'error', error.message, { label: 'Thử lại', onClick: loadEvents });
  }
}

// ---- Gắn sự kiện ----

searchInput.addEventListener('input', debounce(loadEvents, SEARCH_DELAY_MS));
clubSelect.addEventListener('change', loadEvents);
filterForm.addEventListener('submit', (event) => {
  event.preventDefault(); // Enter trong ô tìm kiếm: lọc ngay, không tải lại trang
  loadEvents();
});

async function init() {
  const filters = readFiltersFromUrl();
  searchInput.value = filters.q;
  await loadClubs(); // cần có <option> CLB thì mới chọn lại được clubId từ URL
  clubSelect.value = filters.clubId;
  await loadEvents();
}

init();
