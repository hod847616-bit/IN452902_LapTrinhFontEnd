// Các hàm TẠO phần tử DOM từ dữ liệu. Chỉ dùng textContent cho dữ liệu từ server:
// nếu ai đó đặt tên sự kiện là "<img src=x onerror=alert(1)>", textContent hiện
// nguyên chuỗi đó ra màn hình, còn innerHTML sẽ chạy mã độc (lỗi XSS).
import { getClubImage } from './club-images.js';
import { formatDateTime, formatSeats, getSeatStatus } from './utils/format.ts';

/** Tạo một phần tử: el('p', { className: 'tag', text: 'CLB Tin học' }) */
export function el(tag, { className, text, attrs = {} } = {}, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  node.append(...children);
  return node;
}

/** Nhãn tình trạng chỗ, hoặc null nếu còn nhiều chỗ */
export function createSeatBadge(event) {
  const status = getSeatStatus(event);
  if (status === 'full') {
    return el('span', { className: 'badge badge--full', text: 'Hết chỗ' });
  }
  if (status === 'almost-full') {
    return el('span', { className: 'badge badge--hot', text: 'Sắp hết chỗ' });
  }
  return null;
}

/** Dòng "CLB Tin học [Sắp hết chỗ]" dùng chung cho card và trang chi tiết */
export function createEventMeta(event, clubName) {
  const children = [el('span', { className: 'tag', text: clubName })];
  const badge = createSeatBadge(event);
  if (badge) children.push(badge);
  return el('p', { className: 'card__meta' }, children);
}

export function createTime(iso) {
  return el('time', { text: formatDateTime(iso), attrs: { datetime: iso } });
}

/** Một card sự kiện — cùng cấu trúc HTML với card tĩnh ở Ch02 để dùng lại CSS */
export function createEventCard(event, clubName) {
  return el('article', { className: 'card event-card' }, [
    el('img', {
      className: 'card__media',
      attrs: {
        src: getClubImage(event.clubId),
        alt: `Biểu tượng ${clubName}`,
        width: '640',
        height: '360',
        loading: 'lazy',
      },
    }),
    el('div', { className: 'card__body' }, [
      createEventMeta(event, clubName),
      el('h3', { className: 'card__title' }, [
        el('a', {
          text: event.name,
          attrs: { href: `event-detail.html?id=${encodeURIComponent(event.id)}` },
        }),
      ]),
      el('p', { className: 'event-card__info' }, [
        createTime(event.startTime),
        document.createTextNode(` · ${event.location}`),
      ]),
      el('p', { className: 'card__text', text: event.description }),
      el('p', { className: 'event-card__seats', text: formatSeats(event) }),
    ]),
  ]);
}

/**
 * Vẽ lại toàn bộ danh sách. replaceChildren() xoá card cũ và gắn card mới
 * trong một lần — trình duyệt chỉ vẽ lại một lần.
 */
export function renderEventList(container, events, clubNames) {
  const cards = events.map((event) =>
    createEventCard(event, clubNames.get(event.clubId) ?? 'Câu lạc bộ'),
  );
  container.replaceChildren(...cards);
}

/**
 * Hộp trạng thái loading / empty / error.
 * action (tuỳ chọn): { label, onClick } — vd. nút "Thử lại" khi lỗi.
 */
export function renderStatus(container, kind, message, action) {
  const children = [el('p', { text: message })];
  if (action) {
    const button = el('button', { className: 'btn btn--ghost', text: action.label, attrs: { type: 'button' } });
    button.addEventListener('click', action.onClick);
    children.push(button);
  }
  const box = el('div', { className: `status status--${kind}`, attrs: { role: kind === 'error' ? 'alert' : 'status' } }, children);
  container.replaceChildren(box);
}
