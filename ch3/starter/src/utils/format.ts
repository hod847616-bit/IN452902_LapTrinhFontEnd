// Tệp TypeScript duy nhất của Ch03: các hàm định dạng dữ liệu để hiển thị.
// Kiểu giúp tsc báo lỗi TRƯỚC khi chạy, ví dụ gọi formatSeats(event) mà event thiếu capacity.
// Kiểm tra: npm run typecheck

/** Phần dữ liệu sự kiện cần để tính số chỗ — chỉ 2 trường, không cần cả EventDto. */
export interface SeatInfo {
  capacity: number;
  registeredCount: number;
}

/** Union type: tình trạng chỗ chỉ có thể là một trong ba chuỗi này. */
export type SeatStatus = 'available' | 'almost-full' | 'full';

/** "2026-10-17T00:30:00.000Z" → "07:30 Thứ Bảy, 17/10/2026" */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('hour')}:${get('minute')} ${get('weekday')}, ${get('day')}/${get('month')}/${get('year')}`;
}

export function getSeatsLeft(seat: SeatInfo): number {
  return Math.max(0, seat.capacity - seat.registeredCount);
}

export function getSeatStatus(seat: SeatInfo): SeatStatus {
  const left = getSeatsLeft(seat);
  if (left <= 0) return 'full';
  if (seat.capacity > 0 && left / seat.capacity < 0.2) return 'almost-full';
  return 'available';
}

/** { capacity: 60, registeredCount: 48 } → "Còn 12/60 chỗ" */
export function formatSeats(seat: SeatInfo): string {
  const left = getSeatsLeft(seat);
  if (left <= 0) return `Đã đủ ${seat.capacity} chỗ`;
  return `Còn ${left}/${seat.capacity} chỗ`;
}
