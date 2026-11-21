// (Challenge) Lưu nháp form đăng ký vào localStorage: lỡ đóng tab thì mở lại vẫn còn chữ đã gõ.
// localStorage chỉ lưu CHUỖI → dùng JSON.stringify khi ghi, JSON.parse khi đọc.
// Tuyệt đối không lưu mật khẩu: ai mở DevTools trên máy này cũng đọc được localStorage.

const DRAFT_KEY = 'eduhub.registerDraft';

export function saveDraft(form) {
  const draft = {
    studentId: form.elements.studentId?.value ?? '',
    name: form.elements.name?.value ?? '',
    email: form.elements.email?.value ?? '',
  };
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Bỏ qua nếu trình duyệt chặn localStorage
  }
}

export function restoreDraft(form) {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (!draft || typeof draft !== 'object') return;
    if (typeof draft.studentId === 'string' && form.elements.studentId) {
      form.elements.studentId.value = draft.studentId;
    }
    if (typeof draft.name === 'string' && form.elements.name) {
      form.elements.name.value = draft.name;
    }
    if (typeof draft.email === 'string' && form.elements.email) {
      form.elements.email.value = draft.email;
    }
  } catch {
    // Dữ liệu nháp hỏng — bỏ qua để không lỗi trang
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Bỏ qua nếu trình duyệt chặn localStorage
  }
}
