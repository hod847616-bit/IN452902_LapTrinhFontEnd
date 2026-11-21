// Form tạo tài khoản thành viên: kiểm dữ liệu ở trình duyệt, gửi POST /api/auth/register,
// rồi hiện kết quả. Lỗi của trình duyệt và lỗi server (400, 409) hiện cùng một chỗ: dưới từng ô.
import { ApiError, registerMember } from './api.js';
import { clearDraft, restoreDraft, saveDraft } from './register-draft.js';
import { el } from './render.js';

const form = document.querySelector('#register-form');
const alertBox = document.querySelector('#form-alert');
const submitButton = form.querySelector('button[type="submit"]');

/** FormData đọc mọi ô theo thuộc tính name — không cần querySelector từng ô */
function readForm() {
  const data = new FormData(form);
  return {
    studentId: String(data.get('studentId') ?? '').trim(),
    name: String(data.get('name') ?? '').trim(),
    email: String(data.get('email') ?? '').trim(),
    password: String(data.get('password') ?? ''),
    passwordConfirm: String(data.get('passwordConfirm') ?? ''),
    agree: data.has('agree'),
  };
}

/**
 * Kiểm dữ liệu trước khi gửi. Trả về lỗi theo đúng dạng `errors` server gửi về
 * ({ email: ['…'] }) để dùng chung hàm showFieldErrors. Object rỗng = hợp lệ.
 */
function validate(values) {
  const errors = {};
  if (!/^\d{10}$/.test(values.studentId)) {
    errors.studentId = ['Mã số sinh viên phải gồm đúng 10 chữ số.'];
  }
  if (values.name.length < 2) {
    errors.name = ['Họ và tên phải có ít nhất 2 ký tự.'];
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = ['Email không đúng định dạng.'];
  }
  if (values.password.length < 8) {
    errors.password = ['Mật khẩu phải có ít nhất 8 ký tự.'];
  }
  if (values.passwordConfirm !== values.password) {
    errors.passwordConfirm = ['Mật khẩu nhập lại chưa khớp.'];
  }
  if (!values.agree) {
    errors.agree = ['Bạn cần đồng ý với nội quy sinh hoạt câu lạc bộ.'];
  }
  return errors;
}

// ---- Hiện thông báo ----

function clearMessages() {
  alertBox.replaceChildren();
  for (const box of form.querySelectorAll('[data-error-for]')) box.textContent = '';
  for (const input of form.querySelectorAll('[aria-invalid]')) input.removeAttribute('aria-invalid');
}

function showFieldErrors(errors) {
  let firstInvalid = null;
  for (const [name, messages] of Object.entries(errors)) {
    const box = form.querySelector(`[data-error-for="${name}"]`);
    if (box) box.textContent = Array.isArray(messages) ? messages[0] : String(messages);
    const input = form.elements[name];
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      if (!firstInvalid) firstInvalid = input;
    }
  }
  if (firstInvalid) firstInvalid.focus();
}

function showAlert(kind, message) {
  const role = kind === 'error' ? 'alert' : 'status';
  alertBox.replaceChildren(el('p', { className: `alert alert--${kind}`, text: message, attrs: { role } }));
}

function setSubmitting(isSubmitting) {
  // Khoá nút khi đang gửi: bấm hai lần sẽ gửi hai request
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? 'Đang gửi…' : 'Tạo tài khoản';
}

// ---- Gửi form ----

async function handleSubmit(event) {
  event.preventDefault(); // không để trình duyệt tự gửi form và tải lại trang
  clearMessages();

  const values = readForm();
  const errors = validate(values);
  if (Object.keys(errors).length > 0) {
    showFieldErrors(errors);
    return;
  }

  setSubmitting(true);
  try {
    const member = await registerMember(values);
    form.reset();
    clearDraft();
    showAlert('success', `Đã tạo tài khoản cho ${member.name} (${member.email}).`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const message = error.message || 'Email đã được dùng để đăng ký.';
      showFieldErrors({ email: [message] });
      showAlert('error', message);
    } else if (error instanceof ApiError && error.status === 400 && Object.keys(error.fieldErrors).length > 0) {
      showFieldErrors(error.fieldErrors);
      showAlert('error', error.message || 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.');
    } else {
      showAlert('error', error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  } finally {
    setSubmitting(false);
  }
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('reset', () => {
  clearMessages();
  clearDraft();
});

// (Challenge ch3-T7) nháp tự lưu mỗi lần gõ, tự điền lại khi mở trang
form.addEventListener('input', () => saveDraft(form));
restoreDraft(form);
